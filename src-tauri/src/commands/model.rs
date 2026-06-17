use reqwest;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::whale::WhaleState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProviderModel {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProviderGroup {
    pub id: String,
    pub label: String,
    pub models: Vec<ProviderModel>,
}

#[derive(Debug, Deserialize)]
struct OllamaModel {
    id: String,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    data: Vec<OllamaModel>,
}

async fn fetch_ollama_models() -> Vec<ProviderModel> {
    let Ok(resp) = reqwest::get("http://localhost:11434/v1/models").await else {
        return vec![];
    };
    let Ok(data) = resp.json::<OllamaResponse>().await else {
        return vec![];
    };
    data.data
        .into_iter()
        .map(|m| ProviderModel {
            label: m.id.clone(),
            id: m.id,
        })
        .collect()
}

#[tauri::command]
pub async fn list_models(_state: State<'_, WhaleState>) -> Result<Vec<ProviderGroup>, String> {
    let ollama_models = fetch_ollama_models().await;

    let mut groups = vec![
        ProviderGroup {
            id: "deepseek".into(),
            label: "DeepSeek".into(),
            models: vec![
                ProviderModel {
                    id: "deepseek-v4-pro".into(),
                    label: "v4-pro".into(),
                },
                ProviderModel {
                    id: "deepseek-v4-flash".into(),
                    label: "v4-flash".into(),
                },
            ],
        },
        ProviderGroup {
            id: "atlascloud".into(),
            label: "Atlascloud".into(),
            models: vec![
                ProviderModel {
                    id: "deepseek/deepseek-v4-pro".into(),
                    label: "deepseek-v4-pro".into(),
                },
                ProviderModel {
                    id: "deepseek/deepseek-v4-flash".into(),
                    label: "deepseek-v4-flash".into(),
                },
                ProviderModel {
                    id: "minimaxai/minimax-m2.7".into(),
                    label: "minimax-m2.7".into(),
                },
                ProviderModel {
                    id: "minimaxai/minimax-m3".into(),
                    label: "minimax-m3".into(),
                },
            ],
        },
        ProviderGroup {
            id: "openrouter".into(),
            label: "OpenRouter".into(),
            models: vec![
                ProviderModel {
                    id: "deepseek/deepseek-v4-pro".into(),
                    label: "deepseek-v4-pro".into(),
                },
                ProviderModel {
                    id: "deepseek/deepseek-v4-flash".into(),
                    label: "deepseek-v4-flash".into(),
                },
            ],
        },
        ProviderGroup {
            id: "nvidia-nim".into(),
            label: "Nvidia Nim".into(),
            models: vec![
                ProviderModel {
                    id: "deepseek/deepseek-v4-pro".into(),
                    label: "deepseek-v4-pro".into(),
                },
                ProviderModel {
                    id: "deepseek/deepseek-v4-flash".into(),
                    label: "deepseek-v4-flash".into(),
                },
                ProviderModel {
                    id: "minimaxai/minimax-m2.7".into(),
                    label: "minimax-m2.7".into(),
                },
            ],
        },
    ];

    if !ollama_models.is_empty() {
        groups.push(ProviderGroup {
            id: "ollama".into(),
            label: "Ollama".into(),
            models: ollama_models,
        });
    }

    Ok(groups)
}
