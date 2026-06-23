mod commands;
mod shared;
mod state;
mod whale;

use state::WatchState;
use tauri::{Manager, RunEvent}; // Ensure Manager and RunEvent are imported

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // 1. Build the App instance (Note: Changed to `.build` instead of the original `.run`)
    let app = builder
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(whale::WhaleState::empty())
        .manage(WatchState::new())
        .invoke_handler(tauri::generate_handler![
            whale::connect,
            whale::create_thread,
            whale::resume_thread,
            whale::list_threads,
            whale::archive_thread,
            whale::send_prompt,
            whale::get_thread,
            whale::decide_approval,
            whale::turn_interrupt,
            whale::list_skills,
            whale::toggle_skill,
            commands::workspace::list_workspaces,
            commands::workspace::add_workspace,
            commands::workspace::remove_workspace,
            commands::fs::list_dir,
            commands::fs::search_dir,
            commands::watch::start_watch,
            commands::watch::stop_watch,
            commands::model::list_models,
            commands::secret::read_secrets,
            commands::secret::write_secrets,
        ])
        // [Removed] The original `.on_window_event` block was removed to prevent the app from 
        // exiting before asynchronous tasks finish executing due to the main thread not being blocked.
        .setup(|_app| Ok(()))
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // 2. Take over the Tauri global lifecycle event loop
    app.run(|app_handle, event| match event {
        // RunEvent::Exit represents the absolute final stage before the entire application process exits
        RunEvent::Exit => {
            let state = app_handle.state::<whale::WhaleState>();

            // Use `block_on` to force-block the current main thread, ensuring the asynchronous 
            // shutdown logic executes completely.
            tauri::async_runtime::block_on(async {
                state.shutdown().await;
            });

            eprintln!("[tauri] App exited, sidecar and tasks cleaned up securely.");
        }
        _ => {}
    });
}