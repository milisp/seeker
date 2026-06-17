use serde::{Deserialize, Serialize};
use std::fs::{create_dir_all, File};
use std::io::{Read, Write};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WorkspaceConfig {
    pub workspaces: Vec<String>,
}

fn get_workspace_path() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|mut path| {
            path.push(".seeker");
            path.push("workspaces.json");
            path
        })
        .ok_or_else(|| "Failed to resolve home directory".to_string())
}

fn read_config() -> Result<WorkspaceConfig, String> {
    let path = get_workspace_path()?;

    if !path.exists() {
        return Ok(WorkspaceConfig {
            workspaces: Vec::new(),
        });
    }

    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(|e| e.to_string())?;

    let config: WorkspaceConfig = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    Ok(config)
}

fn write_config(config: &WorkspaceConfig) -> Result<(), String> {
    let path = get_workspace_path()?;

    if let Some(parent) = path.parent() {
        create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let json_string = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    file.write_all(json_string.as_bytes()).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn list_workspaces() -> Result<Vec<String>, String> {
    let config = read_config()?;
    Ok(config.workspaces)
}

#[tauri::command]
pub fn add_workspace(workspace: String) -> Result<Vec<String>, String> {
    let mut config = read_config()?;

    if config.workspaces.contains(&workspace) {
        return Ok(config.workspaces);
    }

    config.workspaces.push(workspace);
    write_config(&config)?;
    Ok(config.workspaces)
}

#[tauri::command]
pub fn remove_workspace(workspace: String) -> Result<Vec<String>, String> {
    let mut config = read_config()?;

    config.workspaces.retain(|w| w != &workspace);
    write_config(&config)?;
    Ok(config.workspaces)
}
