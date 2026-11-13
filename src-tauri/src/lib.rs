mod audit;
mod commands;
mod db;
mod lock;
mod users;

use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let conn = db::open(&dir.join("riskprime.db")).map_err(|e| format!("{e:?}"))?;
            app.manage(commands::Archive(Mutex::new(conn)));
            app.manage(commands::Session::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::periods_list,
            commands::periods_load,
            commands::periods_save,
            commands::periods_remove,
            commands::periods_last_editor,
            commands::audit_list,
            commands::lock_status,
            commands::users_list,
            commands::user_create,
            commands::user_login,
            commands::user_set_initial_pin,
            commands::lock_now,
            commands::user_update,
            commands::user_change_pin,
            commands::user_reset_pin,
            commands::user_remove,
            commands::lock_recover,
            commands::lock_new_recovery_code,
            commands::lock_request_reset
        ])
        .run(tauri::generate_context!())
        .expect("error while running RiskPrime");
}
