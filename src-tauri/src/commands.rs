//! Tauri command layer: maps db/lock/users/audit results to UI-facing Turkish error strings.
//! Audit entries are written here, inside the command that causes them — never from the UI.
use crate::audit::{self, Entry, LastEditor};
use crate::db::{self, DbError, PeriodSummary};
use crate::lock::{self, Attempt, LockError, Res};
use crate::users::{self, User, UserInfo};
use chrono::Utc;
use rusqlite::Connection;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

pub struct Archive(pub Mutex<Connection>);

/// In-memory session state; the app always starts logged out.
#[derive(Default)]
pub struct Session {
    /// Id of the logged-in user.
    pub current_user: Mutex<Option<String>>,
}

const MSG_UNAVAILABLE: &str = "Dönem arşivi kullanılamıyor";

/// Lock-logic access to the connection; errors become their Turkish message.
fn run<T>(state: &State<Archive>, f: impl FnOnce(&mut Connection) -> Res<T>) -> Result<T, String> {
    let mut conn = state.0.lock().map_err(|_| MSG_UNAVAILABLE.to_string())?;
    f(&mut conn).map_err(|e| e.message)
}

fn session_id(session: &State<Session>) -> Res<Option<String>> {
    session
        .current_user
        .lock()
        .map(|g| g.clone())
        .map_err(|_| LockError::msg(MSG_UNAVAILABLE))
}

fn set_current(session: &State<Session>, id: Option<String>) -> Res<()> {
    *session
        .current_user
        .lock()
        .map_err(|_| LockError::msg(MSG_UNAVAILABLE))? = id;
    Ok(())
}

/// The logged-in user; a session whose user vanished is logged out.
fn current(conn: &Connection, session: &State<Session>) -> Res<User> {
    let id = session_id(session)?.ok_or_else(|| LockError::msg(lock::MSG_LOCKED))?;
    match users::get(conn, &id)? {
        Some(u) => Ok(u),
        None => {
            set_current(session, None)?;
            Err(LockError::msg(lock::MSG_LOCKED))
        }
    }
}

/// Same as `run` but for the period commands: refuses unless someone is logged in.
fn with_user_conn<T>(
    state: &State<Archive>,
    session: &State<Session>,
    f: impl FnOnce(&mut Connection, &User) -> Result<T, DbError>,
) -> Result<T, String> {
    let mut conn = state.0.lock().map_err(|_| MSG_UNAVAILABLE.to_string())?;
    let user = current(&conn, session).map_err(|e| e.message)?;
    f(&mut conn, &user).map_err(|e| {
        eprintln!("archive error: {e}");
        e.user_message().to_string()
    })
}

#[tauri::command]
pub fn periods_list(
    state: State<Archive>,
    session: State<Session>,
) -> Result<Vec<PeriodSummary>, String> {
    with_user_conn(&state, &session, |c, _| db::list(c))
}

#[tauri::command]
pub fn periods_load(
    state: State<Archive>,
    session: State<Session>,
    id: String,
) -> Result<Option<String>, String> {
    with_user_conn(&state, &session, |c, _| db::load(c, &id))
}

#[tauri::command]
pub fn periods_save(
    state: State<Archive>,
    session: State<Session>,
    document: String,
) -> Result<PeriodSummary, String> {
    with_user_conn(&state, &session, |c, u| {
        audit::save_with_audit(c, u, &document, Utc::now())
    })
}

#[tauri::command]
pub fn periods_remove(
    state: State<Archive>,
    session: State<Session>,
    id: String,
) -> Result<(), String> {
    with_user_conn(&state, &session, |c, u| {
        db::remove(c, &id)?;
        audit::log(c, u, audit::PERIOD_REMOVED, Some(&id), Utc::now())?;
        Ok(())
    })
}

#[tauri::command]
pub fn periods_last_editor(
    state: State<Archive>,
    session: State<Session>,
    period_id: String,
) -> Result<Option<LastEditor>, String> {
    with_user_conn(&state, &session, |c, _| {
        Ok(audit::last_editor(c, &period_id)?)
    })
}

#[tauri::command]
pub fn audit_list(
    state: State<Archive>,
    session: State<Session>,
    limit: i64,
    period_id: Option<String>,
) -> Result<Vec<Entry>, String> {
    with_user_conn(&state, &session, |c, _| {
        Ok(audit::list(c, limit, period_id.as_deref())?)
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LockStatus {
    configured: bool,
    unlocked: bool,
    current_user: Option<User>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryCode {
    recovery_code: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedUser {
    user: User,
    recovery_code: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResult {
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
    run(&state, |c| {
        users::apply_due_resets(c, Utc::now())?;
        let user = match session_id(&session)? {
            Some(id) => users::get(c, &id)?,
            None => None,
        };
        if user.is_none() {
            set_current(&session, None)?;
        }
        Ok(LockStatus {
            configured: users::count(c)? > 0,
            unlocked: user.is_some(),
            current_user: user,
        })
    })
}

/// Allowed while locked: the lock screen needs the picker.
#[tauri::command]
pub fn users_list(state: State<Archive>) -> Result<Vec<UserInfo>, String> {
    run(&state, |c| users::list(c, Utc::now()))
}

/// First run (no users): no login needed; creates the installation recovery code, returns it
/// and logs the new user in. Afterwards: login required, `recoveryCode` is null.
#[tauri::command]
pub fn user_create(
    state: State<Archive>,
    session: State<Session>,
    name: String,
    title: String,
    pin: String,
) -> Result<CreatedUser, String> {
    run(&state, |c| {
        let now = Utc::now();
        let first = users::count(c)? == 0;
        let actor = if first {
            None
        } else {
            Some(current(c, &session)?)
        };
        let tx = c.transaction()?;
        let user = users::create(&tx, &name, &title, &pin, now)?;
        let recovery_code = if first {
            let (code, rhash) = lock::new_recovery()?;
            lock::store_recovery(&tx, &rhash)?;
            Some(code)
        } else {
            None
        };
        let who = actor.as_ref().unwrap_or(&user);
        audit::log_target(&tx, who, audit::USER_CREATED, &user.name, now)?;
        tx.commit()?;
        if first {
            set_current(&session, Some(user.id.clone()))?;
        }
        Ok(CreatedUser {
            user,
            recovery_code,
        })
    })
}

#[tauri::command]
pub fn user_login(
    state: State<Archive>,
    session: State<Session>,
    user_id: String,
    pin: String,
) -> Result<LoginResult, String> {
    run(&state, |c| {
        let now = Utc::now();
        let (ok, retry_after_sec) = match lock::login(c, &user_id, &pin, now)? {
            Attempt::Ok => (true, None),
            Attempt::Wrong(r) => (false, r),
            Attempt::Throttled(s) => (false, Some(s)),
        };
        if ok {
            let user = users::get(c, &user_id)?.ok_or_else(|| LockError::msg(lock::MSG_NO_USER))?;
            audit::log(c, &user, audit::LOGIN, None, now)?;
            set_current(&session, Some(user.id))?;
        }
        Ok(LoginResult {
            ok,
            retry_after_sec,
        })
    })
}

/// Only for a user whose PIN was cleared by a reset; logs them in.
#[tauri::command]
pub fn user_set_initial_pin(
    state: State<Archive>,
    session: State<Session>,
    user_id: String,
    pin: String,
) -> Result<(), String> {
    run(&state, |c| {
        let user = users::set_initial_pin(c, &user_id, &pin)?;
        audit::log(c, &user, audit::LOGIN, None, Utc::now())?;
        set_current(&session, Some(user.id))
    })
}

#[tauri::command]
pub fn lock_now(state: State<Archive>, session: State<Session>) -> Result<(), String> {
    run(&state, |c| {
        if let Some(id) = session_id(&session)? {
            if let Some(user) = users::get(c, &id)? {
                audit::log(c, &user, audit::LOGOUT, None, Utc::now())?;
            }
        }
        set_current(&session, None)
    })
}

#[tauri::command]
pub fn user_update(
    state: State<Archive>,
    session: State<Session>,
    user_id: String,
    name: String,
    title: String,
) -> Result<(), String> {
    run(&state, |c| {
        let actor = current(c, &session)?;
        let user = users::update(c, &user_id, &name, &title)?;
        audit::log_target(c, &actor, audit::USER_UPDATED, &user.name, Utc::now())?;
        Ok(())
    })
}

#[tauri::command]
pub fn user_change_pin(
    state: State<Archive>,
    session: State<Session>,
    pin: String,
    new_pin: String,
) -> Result<(), String> {
    run(&state, |c| {
        let now = Utc::now();
        let user = current(c, &session)?;
        users::change_pin(c, &user.id, &pin, &new_pin, now)?;
        audit::log(c, &user, audit::PIN_CHANGED, None, now)?;
        Ok(())
    })
}

/// Clears ANOTHER user's PIN; they choose a new one at next login.
#[tauri::command]
pub fn user_reset_pin(
    state: State<Archive>,
    session: State<Session>,
    user_id: String,
) -> Result<(), String> {
    run(&state, |c| {
        let actor = current(c, &session)?;
        let user = users::reset_pin(c, &user_id, &actor.id)?;
        audit::log_target(c, &actor, audit::PIN_RESET, &user.name, Utc::now())?;
        Ok(())
    })
}

#[tauri::command]
pub fn user_remove(
    state: State<Archive>,
    session: State<Session>,
    user_id: String,
) -> Result<(), String> {
    run(&state, |c| {
        let actor = current(c, &session)?;
        let user = users::remove(c, &user_id, &actor.id)?;
        audit::log_target(c, &actor, audit::USER_REMOVED, &user.name, Utc::now())?;
        Ok(())
    })
}

/// Installation recovery code -> new PIN for the chosen user; rotates the code and logs in.
#[tauri::command]
pub fn lock_recover(
    state: State<Archive>,
    session: State<Session>,
    recovery_code: String,
    user_id: String,
    new_pin: String,
) -> Result<RecoveryCode, String> {
    run(&state, |c| {
        let now = Utc::now();
        lock::validate_pin(&new_pin)?;
        let user = users::get(c, &user_id)?.ok_or_else(|| LockError::msg(lock::MSG_NO_USER))?;
        // Outside the transaction: a failed attempt's counter update must persist.
        lock::verify_recovery(c, &recovery_code, now)?;
        let (code, rhash) = lock::new_recovery()?;
        let tx = c.transaction()?;
        lock::store_recovery(&tx, &rhash)?;
        users::set_pin(&tx, &user.id, &new_pin)?;
        audit::log(&tx, &user, audit::RECOVERY_USED, None, now)?;
        tx.commit()?;
        set_current(&session, Some(user.id))?;
        Ok(RecoveryCode {
            recovery_code: code,
        })
    })
}

#[tauri::command]
pub fn lock_new_recovery_code(
    state: State<Archive>,
    session: State<Session>,
    pin: String,
) -> Result<RecoveryCode, String> {
    run(&state, |c| {
        let now = Utc::now();
        let user = current(c, &session)?;
        lock::verify_pin(c, &user.id, &pin, now)?;
        let (code, rhash) = lock::new_recovery()?;
        lock::store_recovery(c, &rhash)?;
        audit::log(c, &user, audit::RECOVERY_RENEWED, None, now)?;
        Ok(RecoveryCode {
            recovery_code: code,
        })
    })
}

/// Forgotten PIN: after 24 h the user's PIN is cleared (data kept). No login needed.
#[tauri::command]
pub fn lock_request_reset(state: State<Archive>, user_id: String) -> Result<ResetPending, String> {
    run(&state, |c| {
        let now = Utc::now();
        let (until, newly) = users::request_reset(c, &user_id, now)?;
        if newly {
            if let Some(user) = users::get(c, &user_id)? {
                audit::log(c, &user, audit::PIN_RESET_REQUESTED, None, now)?;
            }
        }
        Ok(ResetPending {
            reset_pending_until: until,
        })
    })
}
