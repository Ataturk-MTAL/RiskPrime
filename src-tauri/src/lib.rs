mod commands;
mod db;

use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let conn = db::open(&dir.join("riskprime.db")).map_err(|e| format!("{e:?}"))?;
            app.manage(commands::Archive(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::periods_list,
            commands::periods_load,
            commands::periods_save,
            commands::periods_remove
        ])
        .run(tauri::generate_context!())
        .expect("error while running RiskPrime");
}
