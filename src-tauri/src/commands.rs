//! Tauri command layer: maps db/lock results to UI-facing Turkish error strings.
use crate::db::{self, DbError, PeriodSummary};
use crate::lock::{self, Attempt, LockError};
use chrono::Utc;
use rusqlite::Connection;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

pub struct Archive(pub Mutex<Connection>);

/// In-memory session state; the app always starts locked.
#[derive(Default)]
pub struct Session {
    pub unlocked: Mutex<bool>,
}

const MSG_UNAVAILABLE: &str = "Dönem arşivi kullanılamıyor";

fn with_conn<T>(
    state: &State<Archive>,
    f: impl FnOnce(&mut Connection) -> Result<T, DbError>,
) -> Result<T, String> {
    let mut conn = state.0.lock().map_err(|_| MSG_UNAVAILABLE.to_string())?;
    f(&mut conn).map_err(|e| {
        eprintln!("archive error: {e}");
        e.user_message().to_string()
    })
}

/// Same as `with_conn` but refuses unless the lock is configured and unlocked.
fn with_gated_conn<T>(
    state: &State<Archive>,
    session: &State<Session>,
    f: impl FnOnce(&mut Connection) -> Result<T, DbError>,
) -> Result<T, String> {
    let unlocked = is_unlocked(session)?;
    with_lock_conn(state, |c| {
        lock::ensure_unlocked(c, unlocked, Utc::now()).map_err(|m| LockError {
            message: m,
            retry_after_sec: None,
        })
    })?;
    with_conn(state, f)
}

/// Lock-logic access to the connection; errors become their Turkish message.
fn with_lock_conn<T>(
    state: &State<Archive>,
    f: impl FnOnce(&Connection) -> Result<T, LockError>,
) -> Result<T, String> {
    let conn = state.0.lock().map_err(|_| MSG_UNAVAILABLE.to_string())?;
    f(&conn).map_err(|e| e.message)
}

fn set_unlocked(session: &State<Session>, value: bool) -> Result<(), String> {
    *session
        .unlocked
        .lock()
        .map_err(|_| MSG_UNAVAILABLE.to_string())? = value;
    Ok(())
}

fn is_unlocked(session: &State<Session>) -> Result<bool, String> {
    session
        .unlocked
        .lock()
        .map(|g| *g)
        .map_err(|_| MSG_UNAVAILABLE.to_string())
}

fn require_unlocked(session: &State<Session>) -> Result<(), String> {
    if is_unlocked(session)? {
        Ok(())
    } else {
        Err(lock::MSG_LOCKED.to_string())
    }
}

#[tauri::command]
pub fn periods_list(
    state: State<Archive>,
    session: State<Session>,
) -> Result<Vec<PeriodSummary>, String> {
    with_gated_conn(&state, &session, |c| db::list(c))
}

#[tauri::command]
pub fn periods_load(
    state: State<Archive>,
    session: State<Session>,
    id: String,
) -> Result<Option<String>, String> {
    with_gated_conn(&state, &session, |c| db::load(c, &id))
}

#[tauri::command]
pub fn periods_save(
    state: State<Archive>,
    session: State<Session>,
    document: String,
) -> Result<PeriodSummary, String> {
    with_gated_conn(&state, &session, |c| db::save(c, &document))
}

#[tauri::command]
pub fn periods_remove(
    state: State<Archive>,
    session: State<Session>,
    id: String,
) -> Result<(), String> {
    with_gated_conn(&state, &session, |c| db::remove(c, &id))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LockStatus {
    configured: bool,
    unlocked: bool,
    retry_after_sec: Option<u64>,
    reset_pending_until: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryCode {
    recovery_code: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnlockResult {
    ok: bool,
    retry_after_sec: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPending {
    reset_pending_until: String,
}

#[tauri::command]
pub fn lock_status(state: State<Archive>, session: State<Session>) -> Result<LockStatus, String> {
    let s = with_lock_conn(&state, |c| lock::status(c, Utc::now()))?;
    // A reset that just cleared the credentials must not leave a stale unlocked session.
    if !s.configured {
        set_unlocked(&session, false)?;
    }
    Ok(LockStatus {
        configured: s.configured,
        unlocked: is_unlocked(&session)?,
        retry_after_sec: s.retry_after_sec,
        reset_pending_until: s.reset_pending_until,
    })
}

#[tauri::command]
pub fn lock_setup(
    state: State<Archive>,
    session: State<Session>,
    pin: String,
) -> Result<RecoveryCode, String> {
    let code = with_lock_conn(&state, |c| lock::setup(c, &pin, Utc::now()))?;
    set_unlocked(&session, true)?;
    Ok(RecoveryCode {
        recovery_code: code,
    })
}

#[tauri::command]
pub fn lock_unlock(
    state: State<Archive>,
    session: State<Session>,
    pin: String,
) -> Result<UnlockResult, String> {
    let (ok, retry_after_sec) = match with_lock_conn(&state, |c| lock::unlock(c, &pin, Utc::now()))?
    {
        Attempt::Ok => (true, None),
        Attempt::Wrong(r) => (false, r),
        Attempt::Throttled(s) => (false, Some(s)),
    };
    if ok {
        set_unlocked(&session, true)?;
    }
    Ok(UnlockResult {
        ok,
        retry_after_sec,
    })
}

#[tauri::command]
pub fn lock_now(session: State<Session>) -> Result<(), String> {
    set_unlocked(&session, false)
}

#[tauri::command]
pub fn lock_recover(
    state: State<Archive>,
    session: State<Session>,
    recovery_code: String,
    new_pin: String,
) -> Result<RecoveryCode, String> {
    let code = with_lock_conn(&state, |c| {
        lock::recover(c, &recovery_code, &new_pin, Utc::now())
    })?;
    set_unlocked(&session, true)?;
    Ok(RecoveryCode {
        recovery_code: code,
    })
}

#[tauri::command]
pub fn lock_change(
    state: State<Archive>,
    session: State<Session>,
    pin: String,
    new_pin: String,
) -> Result<(), String> {
    require_unlocked(&session)?;
    with_lock_conn(&state, |c| lock::change(c, &pin, &new_pin, Utc::now()))
}

#[tauri::command]
pub fn lock_new_recovery_code(
    state: State<Archive>,
    session: State<Session>,
    pin: String,
) -> Result<RecoveryCode, String> {
    require_unlocked(&session)?;
    let code = with_lock_conn(&state, |c| lock::new_recovery_code(c, &pin, Utc::now()))?;
    Ok(RecoveryCode {
        recovery_code: code,
    })
}

#[tauri::command]
pub fn lock_request_reset(state: State<Archive>) -> Result<ResetPending, String> {
    let until = with_lock_conn(&state, |c| lock::request_reset(c, Utc::now()))?;
    Ok(ResetPending {
        reset_pending_until: until,
    })
}
