use tauri::Manager;

mod database;
mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // データベースの初期化
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match database::Database::new(&app_handle).await {
                    Ok(db) => {
                        let db_state: commands::DbState = Arc::new(Mutex::new(db));
                        app_handle.manage(db_state);
                        println!("Database initialized successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                    }
                }
            });
            
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_preset,
            commands::get_preset,
            commands::list_presets,
            commands::delete_preset,
            commands::save_project,
            commands::get_project,
            commands::list_projects,
            commands::delete_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}