use notify_debouncer_full::{Debouncer, FileIdMap};
use std::collections::HashMap;
use tokio::sync::Mutex;

/// Watcher variants (currently only debouncer).
pub enum WatcherKind {
    Debouncer(Debouncer<notify::RecommendedWatcher, FileIdMap>),
}

/// Shared state for filesystem watchers.
/// Maps canonical path → (watcher, ref-count).
pub struct WatchState {
    pub watchers: Mutex<HashMap<String, (Mutex<WatcherKind>, usize)>>,
}

impl WatchState {
    pub fn new() -> Self {
        Self {
            watchers: Mutex::new(HashMap::new()),
        }
    }
}
