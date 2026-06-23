use futures::StreamExt;
use libc;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE, HeaderMap, HeaderValue};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;
use thiserror::Error;
use tokio::sync::Mutex;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;

#[derive(Debug, Error, Serialize, Deserialize)]
pub enum WhaleError {
    #[error("{message}")]
    Runtime { message: String },
}

pub struct InnerState {
    pub client: Option<Arc<WhaleHttpClient>>,
    pub provider: String,
}

pub struct WhaleState {
    pub inner: RwLock<InnerState>,
}

impl WhaleState {
    pub fn empty() -> Self {
        WhaleState {
            inner: RwLock::new(InnerState {
                client: None,
                provider: String::new(),
            }),
        }
    }
}

pub struct WhaleHttpClient {
    http: reqwest::Client,
    base_url: String,
    auth_token: Option<String>,
    child_pid: u32,
    child: Mutex<Option<CommandChild>>,
    sse_cancel: Mutex<HashMap<String, CancellationToken>>,
    stderr_cancel: Mutex<Option<CancellationToken>>,
}

impl Drop for WhaleHttpClient {
    fn drop(&mut self) {
        // Cancel the stderr task first
        if let Ok(mut guard) = self.stderr_cancel.try_lock() {
            if let Some(token) = guard.take() {
                token.cancel();
            }
        }

        // Then kill the child process
        if let Ok(mut guard) = self.child.try_lock() {
            if let Some(child) = guard.take() {
                let _ = child.kill();
            }
        }
    }
}

impl WhaleHttpClient {
    /// Cleanly shuts down the child process and all background tasks.
    /// Call this on app exit instead of relying solely on Drop.
    pub async fn shutdown(&self) {
        eprintln!("[whale] shutdown: cancelling SSE streams");
        let mut sse = self.sse_cancel.lock().await;
        for (_, token) in sse.drain() {
            token.cancel();
        }
        drop(sse);

        eprintln!("[whale] shutdown: cancelling stderr task");
        if let Some(token) = self.stderr_cancel.lock().await.take() {
            token.cancel();
        }

        eprintln!("[whale] shutdown: killing child process (pid={})", self.child_pid);
        // tauri-plugin-shell's kill() only sends SIGTERM; use SIGKILL to be sure.
        let killed = unsafe { libc::kill(self.child_pid as libc::pid_t, libc::SIGKILL) == 0 };
        eprintln!("[whale] shutdown: SIGKILL sent={killed}");
        // Also call the tauri kill() to clean up internal state.
        if let Some(child) = self.child.lock().await.take() {
            let _ = child.kill();
        }
    }

    fn auth_headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        if let Some(token) = &self.auth_token {
            if let Ok(value) = HeaderValue::from_str(&format!("Bearer {token}")) {
                headers.insert(AUTHORIZATION, value);
            }
        }
        headers
    }

    async fn request(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value, String> {
        let url = format!("{}{}", self.base_url, path);
        let mut req = self.http.request(method, &url).headers(self.auth_headers());
        if let Some(b) = body {
            req = req.json(&b);
        }

        let response = req.send().await.map_err(|e| e.to_string())?;
        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("Request to {path} failed ({status}): {text}"));
        }
        if text.trim().is_empty() {
            return Ok(Value::Null);
        }
        serde_json::from_str(&text).map_err(|e| format!("invalid JSON from {path}: {e}"))
    }

    pub async fn get(&self, path: &str) -> Result<Value, String> {
        self.request(reqwest::Method::GET, path, None).await
    }

    pub async fn post(&self, path: &str, body: Value) -> Result<Value, String> {
        self.request(reqwest::Method::POST, path, Some(body)).await
    }

    pub async fn patch(&self, path: &str, body: Value) -> Result<Value, String> {
        self.request(reqwest::Method::PATCH, path, Some(body)).await
    }

    pub async fn wait_for_health(&self) -> Result<(), String> {
        for i in 0..100 {
            match self.get("/health").await {
                Ok(v) if v.get("status").and_then(|s| s.as_str()) == Some("ok") => {
                    eprintln!("codewhale health ok after {}ms", i * 100);
                    return Ok(());
                }
                Ok(v) => {
                    if i % 10 == 0 {
                        eprintln!("codewhale health attempt {i}: unexpected response: {v}");
                    }
                }
                Err(e) => {
                    if i % 10 == 0 {
                        eprintln!("codewhale health attempt {i}: {e}");
                    }
                }
            }
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
        Err("CodeWhale runtime API did not become healthy in time".to_string())
    }

    pub async fn subscribe_thread_events(&self, thread_id: String, app: AppHandle) {
        let mut guards = self.sse_cancel.lock().await;
        for (_, token) in guards.drain() {
            token.cancel();
        }
        let cancel = CancellationToken::new();
        guards.insert(thread_id.clone(), cancel.clone());
        drop(guards);

        let base_url = self.base_url.clone();
        let token = self.auth_token.clone();
        let http = self.http.clone();

        tauri::async_runtime::spawn(async move {
            if let Err(err) =
                stream_thread_events(http, &base_url, token, &thread_id, cancel, app).await
            {
                eprintln!("whale SSE [{thread_id}]: {err}");
            }
        });
    }
}

async fn stream_thread_events(
    http: reqwest::Client,
    base_url: &str,
    token: Option<String>,
    thread_id: &str,
    cancel: CancellationToken,
    app: AppHandle,
) -> Result<(), String> {
    let mut url = format!("{base_url}/v1/threads/{thread_id}/events");
    if let Some(token) = &token {
        url.push_str(&format!("?token={token}"));
    }

    let mut headers = HeaderMap::new();
    headers.insert(
        reqwest::header::ACCEPT,
        HeaderValue::from_static("text/event-stream"),
    );
    if let Some(token) = &token {
        if let Ok(value) = HeaderValue::from_str(&format!("Bearer {token}")) {
            headers.insert(AUTHORIZATION, value);
        }
    }

    let response = http
        .get(&url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "SSE connect failed ({}): {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut event_name = String::new();
    let mut data_lines: Vec<String> = Vec::new();

    loop {
        tokio::select! {
            _ = cancel.cancelled() => break,
            chunk = stream.next() => {
                let Some(chunk) = chunk else { break };
                buffer.push_str(&String::from_utf8_lossy(&chunk.map_err(|e| e.to_string())?));

                while let Some(pos) = buffer.find('\n') {
                    let line = buffer[..pos].trim_end_matches('\r').to_string();
                    buffer.drain(..=pos);

                    if line.is_empty() {
                        if data_lines.is_empty() && event_name.is_empty() { continue; }
                        let data = data_lines.join("\n");
                        data_lines.clear();
                        if data == "keepalive" {
                            event_name.clear();
                            continue;
                        }
                        if let Ok(mut value) = serde_json::from_str::<Value>(&data) {
                            let method = if event_name.is_empty() {
                                value.get("event").and_then(|v| v.as_str()).unwrap_or("unknown").to_string()
                            } else {
                                event_name.clone()
                            };
                            event_name.clear();

                            if let Some(payload) = value.get("payload").and_then(|p| p.as_object()).cloned() {
                                if let Some(params_obj) = value.as_object_mut() {
                                    for (k, v) in payload {
                                        params_obj.entry(k).or_insert(v);
                                    }
                                }
                            }
                            if value["event"] != "item.delta" {
                                println!("{}", method);
                            }
                            let _ = app.emit("whale:notification", json!({ "method": method, "params": value }));
                        }
                        continue;
                    }

                    if let Some(name) = line.strip_prefix("event:") {
                        event_name = name.trim().to_string();
                    } else if let Some(data) = line.strip_prefix("data:") {
                        data_lines.push(data.trim_start().to_string());
                    }
                }
            }
        }
    }
    Ok(())
}

pub fn pick_ephemeral_port() -> Result<u16, String> {
    std::net::TcpListener::bind("127.0.0.1:0")
        .and_then(|l| l.local_addr())
        .map(|addr| addr.port())
        .map_err(|e| e.to_string())
}

pub async fn spawn_whale_client(
    provider: &str,
    app_handle: tauri::AppHandle,
) -> Result<Arc<WhaleHttpClient>, String> {
    let port = pick_ephemeral_port()?;
    let base_url = format!("http://127.0.0.1:{port}");
    let runtime_token = format!("{}", uuid::Uuid::new_v4().simple());

    let (event_rx, child) = app_handle
        .shell()
        .sidecar("codewhale-tui")
        .map_err(|e| format!("sidecar not found: {e}"))?
        .args(["serve", "--http", "--host", "127.0.0.1", "--port", &port.to_string(), "--auth-token", &runtime_token])
        .env("CODEWHALE_PROVIDER", provider)
        .spawn()
        .map_err(|e| format!("failed to spawn `codewhale` serve --http: {e}. Install CodeWhale and ensure it is on PATH."))?;

    let stderr_token = CancellationToken::new();
    let stderr_token_task = stderr_token.clone();

    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        let mut event_rx = event_rx;
        loop {
            tokio::select! {
                _ = stderr_token_task.cancelled() => break,
                event = event_rx.recv() => {
                    match event {
                        Some(CommandEvent::Stderr(line)) => {
                            let text = String::from_utf8_lossy(&line);
                            let text = text.trim();
                            if !text.is_empty() {
                                eprintln!("codewhale serve: {text}");
                            }
                        }
                        Some(CommandEvent::Error(e)) => eprintln!("codewhale serve error: {e}"),
                        // Channel closed — child process has exited
                        None => break,
                        _ => {}
                    }
                }
            }
        }
    });

    let child_pid = child.pid();
    let whale = Arc::new(WhaleHttpClient {
        http: reqwest::Client::new(),
        base_url,
        auth_token: Some(runtime_token),
        child_pid,
        child: Mutex::new(Some(child)),
        sse_cancel: Mutex::new(HashMap::new()),
        stderr_cancel: Mutex::new(Some(stderr_token)),
    });

    whale.wait_for_health().await?;
    Ok(whale)
}

pub async fn get_client(state: &WhaleState) -> Result<Arc<WhaleHttpClient>, WhaleError> {
    state
        .inner
        .read()
        .await
        .client
        .clone()
        .ok_or_else(|| WhaleError::Runtime {
            message: "Whale not connected — call whale_connect first".to_string(),
        })
}

#[tauri::command]
pub async fn connect(
    provider: String,
    app: AppHandle,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    {
        let guard = state.inner.read().await;
        if guard.client.is_some() && guard.provider == provider {
            let _ = app.emit(
                "whale:connect",
                json!({ "method": "whale/connected", "params": { "provider": provider } }),
            );
            return Ok(json!({ "ok": true, "provider": provider, "reused": true }));
        }
    }

    let client = spawn_whale_client(&provider, app.clone())
        .await
        .map_err(|e| WhaleError::Runtime { message: e })?;

    let mut guard = state.inner.write().await;
    guard.client = Some(client);
    guard.provider = provider.clone();

    let _ = app.emit(
        "whale:connect",
        json!({ "method": "whale/connected", "params": { "provider": provider } }),
    );

    Ok(json!({ "ok": true, "provider": provider }))
}

#[tauri::command]
pub async fn send_prompt(
    thread_id: String,
    input: String,
    model: String,
    reasoning_effort: Option<String>,
    app: AppHandle,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client.subscribe_thread_events(thread_id.clone(), app).await;

    let mut body = json!({ "prompt": input, "model": model, "mode": "agent" });
    if let Some(effort) = reasoning_effort {
        body["reasoning_effort"] = json!(effort);
    }
    client
        .post(&format!("/v1/threads/{thread_id}/turns"), body)
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn decide_approval(
    approval_id: String,
    decision: String,
    remember: bool,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client
        .post(
            &format!("/v1/approvals/{approval_id}"),
            json!({ "decision": decision, "remember": remember }),
        )
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn turn_interrupt(
    thread_id: String,
    turn_id: String,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client
        .post(
            &format!("/v1/threads/{thread_id}/turns/{turn_id}/interrupt"),
            json!({}),
        )
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn list_skills(state: State<'_, WhaleState>) -> Result<Value, WhaleError> {
    get_client(&state)
        .await?
        .get("/v1/skills")
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn toggle_skill(
    name: String,
    enabled: bool,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client
        .post(&format!("/v1/skills/{name}"), json!({ "enabled": enabled }))
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn get_thread(
    thread_id: String,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client
        .get(&format!("/v1/threads/{thread_id}"))
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn create_thread(
    params: Value,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    let thread = client
        .post("/v1/threads", params)
        .await
        .map_err(|e| WhaleError::Runtime { message: e })?;

    let thread_id = thread
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    Ok(json!({ "thread_id": thread_id, "thread": thread }))
}

#[tauri::command]
pub async fn resume_thread(
    thread_id: String,
    app: AppHandle,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client.subscribe_thread_events(thread_id.clone(), app).await;
    client
        .post(&format!("/v1/threads/{thread_id}/resume"), json!({}))
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}

#[tauri::command]
pub async fn list_threads(state: State<'_, WhaleState>) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    let summaries = client
        .get("/v1/threads/summary?limit=50")
        .await
        .map_err(|e| WhaleError::Runtime { message: e })?;

    let threads = if summaries.is_array() {
        summaries
    } else {
        summaries
            .get("threads")
            .cloned()
            .unwrap_or(Value::Array(vec![]))
    };
    Ok(json!({ "threads": threads }))
}

#[tauri::command]
pub async fn archive_thread(
    thread_id: String,
    state: State<'_, WhaleState>,
) -> Result<Value, WhaleError> {
    let client = get_client(&state).await?;
    client
        .patch(
            &format!("/v1/threads/{thread_id}"),
            json!({ "archived": true }),
        )
        .await
        .map_err(|e| WhaleError::Runtime { message: e })
}