use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{create_dir_all, File};
use std::io::{Read, Write};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SecretsConfig {
    entries: HashMap<String, String>,
}

fn get_secrets_path() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|mut path| {
            path.push(".deepseek");
            path.push("secrets");
            path.push("secrets.json");
            path
        })
        .ok_or_else(|| "Failed to resolve home directory".to_string())
}

#[tauri::command]
pub fn read_secrets() -> Result<SecretsConfig, String> {
    let path = get_secrets_path()?;
    
    if !path.exists() {
        return Ok(SecretsConfig {
            entries: HashMap::new(),
        });
    }

    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(|e| e.to_string())?;
        
    let config: SecretsConfig = serde_json::from_str(&contents).map_err(|e| e.to_string())?;    
    Ok(config)
}

#[tauri::command]
pub fn write_secrets(config: SecretsConfig) -> Result<(), String> {
    let path = get_secrets_path()?;
    
    if let Some(parent) = path.parent() {
        create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let json_string = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    file.write_all(json_string.as_bytes()).map_err(|e| e.to_string())?;
    
    Ok(())
}