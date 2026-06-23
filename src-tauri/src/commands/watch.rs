use crate::shared::fs::watcher;
use crate::state::WatchState;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

fn tauri_watch_emitter(app: AppHandle) -> Arc<dyn Fn(watcher::FsChange) + Send + Sync> {
    Arc::new(move |payload: watcher::FsChange| {
        let _ = app.emit("fs_change", &payload);
    })
}
#[tauri::command]
pub async fn start_watch(
    app: AppHandle,
    state: State<'_, WatchState>,
    path: String,
) -> Result<(), String> {
    watcher::watch(state.inner(), path, tauri_watch_emitter(app)).await
}

#[tauri::command]
pub async fn stop_watch(state: State<'_, WatchState>, path: String) -> Result<(), String> {
    watcher::unwatch(state.inner(), path).await
}