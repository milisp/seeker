use crate::shared::fs::list::{self, DirEntry};
use crate::shared::fs::search::{self, SearchResult};

#[tauri::command]
pub fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    list::list_dir(std::path::Path::new(&path))
}

#[tauri::command]
pub fn search_dir(root: String, query: String, limit: usize) -> Result<Vec<SearchResult>, String> {
    search::search_dir(std::path::Path::new(&root), &query, limit)
}
