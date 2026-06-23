mod commands;
mod shared;
mod state;
mod whale;

use state::WatchState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    builder
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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                use tauri::Manager;
                let state = window.state::<whale::WhaleState>();
                // state() returns a State<'_> guard — extract the Arc client
                // synchronously before spawning so there's no lifetime issue.
                let client = {
                    // try_read avoids blocking; if the lock is contended we
                    // fall through and the Drop impl will still kill the child.
                    state.inner.try_read().ok().and_then(|g| g.client.clone())
                };
                if let Some(client) = client {
                    tauri::async_runtime::spawn(async move {
                        client.shutdown().await;
                    });
                }
            }
        })
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
