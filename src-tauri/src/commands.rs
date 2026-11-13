//! Tauri command layer: maps db results to UI-facing Turkish error strings.
use crate::db::{self, DbError, PeriodSummary};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct Archive(pub Mutex<Connection>);

fn with_conn<T>(
    state: &State<Archive>,
    f: impl FnOnce(&mut Connection) -> Result<T, DbError>,
) -> Result<T, String> {
    let mut conn = state
        .0
        .lock()
        .map_err(|_| "Dönem arşivi kullanılamıyor".to_string())?;
    f(&mut conn).map_err(|e| {
        eprintln!("archive error: {e}");
        e.user_message().to_string()
    })
}

#[tauri::command]
pub fn periods_list(state: State<Archive>) -> Result<Vec<PeriodSummary>, String> {
    with_conn(&state, |c| db::list(c))
}

#[tauri::command]
pub fn periods_load(state: State<Archive>, id: String) -> Result<Option<String>, String> {
    with_conn(&state, |c| db::load(c, &id))
}

#[tauri::command]
pub fn periods_save(state: State<Archive>, document: String) -> Result<PeriodSummary, String> {
    with_conn(&state, |c| db::save(c, &document))
}

#[tauri::command]
pub fn periods_remove(state: State<Archive>, id: String) -> Result<(), String> {
    with_conn(&state, |c| db::remove(c, &id))
}
