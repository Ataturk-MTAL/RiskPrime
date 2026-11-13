//! Users: CRUD, PIN set/reset and the 24 h forgotten-PIN reset. No roles.
//! Name uniqueness uses `name_key` = trimmed `str::to_lowercase()`, which is not Turkish-aware
//! (`I` -> `i`, not `ı`; `İ` -> `i̇`): "IŞIK" and "ışık" count as different names. Acceptable.
use crate::lock::{self, LockError, Res, MSG_NEEDS_PIN, MSG_NO_USER};
use argon2::password_hash::rand_core::{OsRng, RngCore};
use chrono::{DateTime, Duration, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;

const RESET_DELAY_HOURS: i64 = 24;
const NAME_MAX_CHARS: usize = 80;

const MSG_NAME_EMPTY: &str = "Ad boş olamaz.";
const MSG_TOO_LONG: &str = "Ad veya unvan çok uzun.";
const MSG_NAME_TAKEN: &str = "Bu adda bir kullanıcı zaten var.";
const MSG_PIN_SET: &str = "Bu kullanıcının PIN'i zaten belirlenmiş.";
pub const MSG_SELF_RESET: &str = "Kendi PIN'inizi buradan sıfırlayamazsınız.";
pub const MSG_SELF_REMOVE: &str = "Kendinizi silemezsiniz.";
pub const MSG_LAST_USER: &str = "Son kullanıcı silinemez.";

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub name: String,
    pub title: String,
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub id: String,
    pub name: String,
    pub title: String,
    pub has_pin: bool,
    pub reset_pending_until: Option<String>,
}

fn new_id() -> String {
    let mut b = [0u8; 8];
    OsRng.fill_bytes(&mut b);
    b.iter().map(|x| format!("{x:02x}")).collect()
}

/// (trimmed name, trimmed title, uniqueness key)
fn clean(name: &str, title: &str) -> Res<(String, String, String)> {
    let (name, title) = (name.trim(), title.trim());
    if name.is_empty() {
        return Err(LockError::msg(MSG_NAME_EMPTY));
    }
    if name.chars().count() > NAME_MAX_CHARS || title.chars().count() > NAME_MAX_CHARS {
        return Err(LockError::msg(MSG_TOO_LONG));
    }
    Ok((name.to_string(), title.to_string(), name.to_lowercase()))
}

fn ensure_name_free(conn: &Connection, key: &str, except_id: Option<&str>) -> Res<()> {
    let taken = conn
        .query_row(
            "SELECT 1 FROM users WHERE name_key = ?1 AND id IS NOT ?2",
            params![key, except_id],
            |_| Ok(()),
        )
        .optional()?
        .is_some();
    if taken {
        Err(LockError::msg(MSG_NAME_TAKEN))
    } else {
        Ok(())
    }
}

pub fn count(conn: &Connection) -> Res<i64> {
    Ok(conn.query_row("SELECT COUNT(*) FROM users", [], |r| r.get(0))?)
}

pub fn get(conn: &Connection, id: &str) -> Res<Option<User>> {
    Ok(conn
        .query_row(
            "SELECT id, name, title FROM users WHERE id = ?1",
            [id],
            |r| {
                Ok(User {
                    id: r.get(0)?,
                    name: r.get(1)?,
                    title: r.get(2)?,
                })
            },
        )
        .optional()?)
}

/// Outer `None` = no such user; inner `None` = PIN cleared (must set a new one).
pub fn pin_hash(conn: &Connection, id: &str) -> Res<Option<Option<String>>> {
    Ok(conn
        .query_row("SELECT pin_hash FROM users WHERE id = ?1", [id], |r| {
            r.get(0)
        })
        .optional()?)
}

fn require(conn: &Connection, id: &str) -> Res<User> {
    get(conn, id)?.ok_or_else(|| LockError::msg(MSG_NO_USER))
}

/// Forgotten-PIN reset that came due: the PIN goes, the user and their data stay.
pub fn apply_due_resets(conn: &Connection, now: DateTime<Utc>) -> Res<()> {
    conn.execute(
        "UPDATE users SET pin_hash = NULL, failed_count = 0, retry_after = NULL,
         reset_pending_until = NULL WHERE reset_pending_until IS NOT NULL AND reset_pending_until <= ?1",
        [lock::ts(now)],
    )?;
    Ok(())
}

pub fn list(conn: &Connection, now: DateTime<Utc>) -> Res<Vec<UserInfo>> {
    apply_due_resets(conn, now)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, title, pin_hash IS NOT NULL, reset_pending_until
         FROM users ORDER BY created_at, rowid",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok(UserInfo {
            id: r.get(0)?,
            name: r.get(1)?,
            title: r.get(2)?,
            has_pin: r.get(3)?,
            reset_pending_until: r.get(4)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn create(
    conn: &Connection,
    name: &str,
    title: &str,
    pin: &str,
    now: DateTime<Utc>,
) -> Res<User> {
    let (name, title, key) = clean(name, title)?;
    ensure_name_free(conn, &key, None)?;
    let pin_hash = lock::hashed_pin(pin)?;
    let id = new_id();
    conn.execute(
        "INSERT INTO users (id, name, name_key, title, pin_hash, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, name, key, title, pin_hash, lock::ts(now)],
    )?;
    Ok(User { id, name, title })
}

pub fn update(conn: &Connection, id: &str, name: &str, title: &str) -> Res<User> {
    let (name, title, key) = clean(name, title)?;
    require(conn, id)?;
    ensure_name_free(conn, &key, Some(id))?;
    conn.execute(
        "UPDATE users SET name = ?2, name_key = ?3, title = ?4 WHERE id = ?1",
        params![id, name, key, title],
    )?;
    Ok(User {
        id: id.to_string(),
        name,
        title,
    })
}

/// Sets a (validated) PIN and clears the user's counters and pending reset.
pub fn set_pin(conn: &Connection, id: &str, pin: &str) -> Res<()> {
    let h = lock::hashed_pin(pin)?;
    let n = conn.execute(
        "UPDATE users SET pin_hash = ?2, failed_count = 0, retry_after = NULL,
         reset_pending_until = NULL WHERE id = ?1",
        params![id, h],
    )?;
    if n == 0 {
        return Err(LockError::msg(MSG_NO_USER));
    }
    Ok(())
}

/// Only for a user whose PIN was cleared by a reset.
pub fn set_initial_pin(conn: &Connection, id: &str, pin: &str) -> Res<User> {
    match pin_hash(conn, id)? {
        None => Err(LockError::msg(MSG_NO_USER)),
        Some(Some(_)) => Err(LockError::msg(MSG_PIN_SET)),
        Some(None) => {
            set_pin(conn, id, pin)?;
            require(conn, id)
        }
    }
}

pub fn change_pin(
    conn: &Connection,
    id: &str,
    pin: &str,
    new_pin: &str,
    now: DateTime<Utc>,
) -> Res<()> {
    lock::validate_pin(new_pin)?;
    lock::verify_pin(conn, id, pin, now)?;
    set_pin(conn, id, new_pin)
}

/// Clears `target`'s PIN (they choose a new one at next login). Never one's own.
pub fn reset_pin(conn: &Connection, target: &str, actor: &str) -> Res<User> {
    if target == actor {
        return Err(LockError::msg(MSG_SELF_RESET));
    }
    let user = require(conn, target)?;
    conn.execute(
        "UPDATE users SET pin_hash = NULL, failed_count = 0, retry_after = NULL,
         reset_pending_until = NULL WHERE id = ?1",
        [target],
    )?;
    Ok(user)
}

/// Returns the removed user (for the audit entry).
pub fn remove(conn: &Connection, target: &str, actor: &str) -> Res<User> {
    if target == actor {
        return Err(LockError::msg(MSG_SELF_REMOVE));
    }
    let user = require(conn, target)?;
    if count(conn)? <= 1 {
        return Err(LockError::msg(MSG_LAST_USER));
    }
    conn.execute("DELETE FROM users WHERE id = ?1", [target])?;
    Ok(user)
}

/// Idempotent (an earlier deadline is kept). Returns (deadline, newly requested).
pub fn request_reset(conn: &Connection, id: &str, now: DateTime<Utc>) -> Res<(String, bool)> {
    apply_due_resets(conn, now)?;
    let has_pin = pin_hash(conn, id)?
        .ok_or_else(|| LockError::msg(MSG_NO_USER))?
        .is_some();
    if !has_pin {
        return Err(LockError::msg(MSG_NEEDS_PIN));
    }
    let existing: Option<String> = conn.query_row(
        "SELECT reset_pending_until FROM users WHERE id = ?1",
        [id],
        |r| r.get(0),
    )?;
    if let Some(e) = existing {
        return Ok((e, false));
    }
    let until = lock::ts(now + Duration::hours(RESET_DELAY_HOURS));
    conn.execute(
        "UPDATE users SET reset_pending_until = ?2 WHERE id = ?1",
        params![id, until],
    )?;
    Ok((until, true))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::lock::{login, parse, Attempt};

    fn mem() -> Connection {
        let mut c = Connection::open_in_memory().unwrap();
        db::migrate(&mut c).unwrap();
        c
    }

    fn t0() -> DateTime<Utc> {
        parse("2026-01-01T00:00:00Z").unwrap()
    }

    fn mk(c: &Connection, name: &str) -> User {
        create(c, name, "Müdür", "1234", t0()).unwrap()
    }

    #[test]
    fn create_validates_and_rejects_duplicate_names() {
        let c = mem();
        let a = mk(&c, " Ali ");
        assert_eq!(a.name, "Ali");
        assert_eq!(a.id.len(), 16);
        assert_eq!(
            create(&c, "ALI", "", "1234", t0()).unwrap_err().message,
            MSG_NAME_TAKEN
        );
        assert!(create(&c, "  ", "", "1234", t0()).is_err());
        assert!(create(&c, "Veli", "", "12", t0()).is_err());
        assert_eq!(count(&c).unwrap(), 1);
    }

    #[test]
    fn update_keeps_own_name_but_not_anothers() {
        let c = mem();
        let (a, b) = (mk(&c, "Ali"), mk(&c, "Veli"));
        update(&c, &a.id, "Ali", "Yeni unvan").unwrap();
        assert_eq!(get(&c, &a.id).unwrap().unwrap().title, "Yeni unvan");
        assert!(update(&c, &a.id, "veli", "").is_err());
        assert!(update(&c, &b.id, "Veli K.", "").is_ok());
    }

    #[test]
    fn reset_pin_forces_initial_pin_and_only_for_others() {
        let c = mem();
        let (a, b) = (mk(&c, "Ali"), mk(&c, "Veli"));
        assert_eq!(
            reset_pin(&c, &a.id, &a.id).unwrap_err().message,
            MSG_SELF_RESET
        );
        reset_pin(&c, &b.id, &a.id).unwrap();
        assert!(!list(&c, t0()).unwrap()[1].has_pin);
        assert_eq!(
            login(&c, &b.id, "1234", t0()).unwrap_err().message,
            MSG_NEEDS_PIN
        );
        set_initial_pin(&c, &b.id, "5678").unwrap();
        assert_eq!(login(&c, &b.id, "5678", t0()).unwrap(), Attempt::Ok);
        // Not allowed once a PIN exists.
        assert_eq!(
            set_initial_pin(&c, &b.id, "1111").unwrap_err().message,
            MSG_PIN_SET
        );
    }

    #[test]
    fn remove_rules() {
        let c = mem();
        let (a, b) = (mk(&c, "Ali"), mk(&c, "Veli"));
        assert_eq!(
            remove(&c, &a.id, &a.id).unwrap_err().message,
            MSG_SELF_REMOVE
        );
        assert_eq!(remove(&c, &b.id, &a.id).unwrap().name, "Veli");
        assert_eq!(
            remove(&c, &a.id, "someone-else").unwrap_err().message,
            MSG_LAST_USER
        );
        assert_eq!(count(&c).unwrap(), 1);
    }

    #[test]
    fn change_pin_needs_current_pin() {
        let c = mem();
        let a = mk(&c, "Ali");
        assert!(change_pin(&c, &a.id, "0000", "5678", t0()).is_err());
        assert!(change_pin(&c, &a.id, "1234", "12", t0()).is_err());
        change_pin(&c, &a.id, "1234", "5678", t0()).unwrap();
        assert_eq!(login(&c, &a.id, "5678", t0()).unwrap(), Attempt::Ok);
    }

    #[test]
    fn reset_is_idempotent_and_clears_pin_after_24h_keeping_user() {
        let c = mem();
        let a = mk(&c, "Ali");
        let (first, new) = request_reset(&c, &a.id, t0()).unwrap();
        assert!(new);
        assert_eq!(first, "2026-01-02T00:00:00Z");
        let again = request_reset(&c, &a.id, t0() + Duration::hours(1)).unwrap();
        assert_eq!(again, (first.clone(), false));
        let before = list(&c, t0() + Duration::seconds(86_399)).unwrap();
        assert!(before[0].has_pin);
        assert_eq!(
            before[0].reset_pending_until.as_deref(),
            Some(first.as_str())
        );
        let after = list(&c, t0() + Duration::seconds(86_400)).unwrap();
        assert!(!after[0].has_pin);
        assert_eq!(after[0].reset_pending_until, None);
        assert_eq!(
            login(&c, &a.id, "1234", t0() + Duration::days(2))
                .unwrap_err()
                .message,
            MSG_NEEDS_PIN
        );
    }

    #[test]
    fn reset_due_is_applied_by_login_too() {
        let c = mem();
        let a = mk(&c, "Ali");
        request_reset(&c, &a.id, t0()).unwrap();
        let e = login(&c, &a.id, "1234", t0() + Duration::hours(25)).unwrap_err();
        assert_eq!(e.message, MSG_NEEDS_PIN);
    }
}
