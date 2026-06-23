use ignore::WalkBuilder;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize, Debug, Clone)]
pub struct SearchResult {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub kind: SearchResultKind,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "lowercase")]
pub enum SearchResultKind {
    File,
    Dir,
    Symlink,
}

/// Recursively search `root` for entries whose name contains `query` (case-insensitive).
/// Respects .gitignore. Returns up to `limit` results.
pub fn search_dir(root: &Path, query: &str, limit: usize) -> Result<Vec<SearchResult>, String> {
    if !root.exists() {
        return Err(format!("Directory does not exist: {}", root.display()));
    }

    let query_lower = query.to_lowercase();
    let root_str = root.to_string_lossy().to_string();

    let results: Vec<SearchResult> = WalkBuilder::new(root)
        .hidden(true)
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .ignore(true)
        .build()
        .filter_map(|result| {
            let entry = result.ok()?;
            // Skip the root itself (depth 0).
            if entry.depth() == 0 {
                return None;
            }

            let path = entry.path().to_path_buf();
            let name = path.file_name()?.to_string_lossy().to_string();

            // Case-insensitive substring match on the file/dir name.
            if !name.to_lowercase().contains(&query_lower) {
                return None;
            }

            let kind = if path.is_symlink() {
                SearchResultKind::Symlink
            } else if path.is_dir() {
                SearchResultKind::Dir
            } else {
                SearchResultKind::File
            };

            // Compute path relative to root for display.
            let path_str = path.to_string_lossy().to_string();
            let relative_path = path_str
                .strip_prefix(&root_str)
                .unwrap_or(&path_str)
                .trim_start_matches(['/', '\\'])
                .to_string();

            Some(SearchResult {
                name,
                path: path_str,
                relative_path,
                kind,
            })
        })
        .take(limit)
        .collect();

    Ok(results)
}
