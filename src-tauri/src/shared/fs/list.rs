use ignore::WalkBuilder;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize, Debug, Clone)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub kind: EntryKind,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "lowercase")]
pub enum EntryKind {
    File,
    Dir,
    Symlink,
}

/// List the immediate children of `dir`, respecting .gitignore and hidden-file rules.
/// Only returns direct children (depth 1), sorted: dirs first, then files, both alphabetically.
pub fn list_dir(dir: &Path) -> Result<Vec<DirEntry>, String> {
    if !dir.exists() {
        return Err(format!("Directory does not exist: {}", dir.display()));
    }

    let mut entries: Vec<DirEntry> = WalkBuilder::new(dir)
        .max_depth(Some(1))     // immediate children only
        .hidden(true)          // show dot-files (but .gitignore still applies)
        .git_ignore(true)       // respect .gitignore
        .git_global(true)       // respect global gitignore
        .git_exclude(true)      // respect .git/info/exclude
        .ignore(true)           // respect .ignore files
        .build()
        .filter_map(|result| {
            let entry = result.ok()?;
            // Skip the root itself (depth 0).
            if entry.depth() == 0 {
                return None;
            }
            let path = entry.path().to_path_buf();
            let name = path.file_name()?.to_string_lossy().to_string();
            let kind = if entry.path().is_symlink() {
                EntryKind::Symlink
            } else if entry.path().is_dir() {
                EntryKind::Dir
            } else {
                EntryKind::File
            };
            Some(DirEntry {
                name,
                path: path.to_string_lossy().to_string(),
                kind,
            })
        })
        .collect();

    // Dirs first, then alphabetically within each group.
    entries.sort_by(|a, b| {
        let a_is_dir = matches!(a.kind, EntryKind::Dir);
        let b_is_dir = matches!(b.kind, EntryKind::Dir);
        if a_is_dir != b_is_dir {
            return if a_is_dir { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater };
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
    });

    Ok(entries)
}
