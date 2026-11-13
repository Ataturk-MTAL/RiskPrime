//! Secrets + failure backoff shared by per-user PINs and the installation recovery code
//! (PIN gate, not encryption). Argon2id hashes; the clock is passed in so tests control time.
//! Counters live on the `users` row (PIN) or the `app_lock` row (recovery code).
use crate::users;
use argon2::password_hash::rand_core::{OsRng, RngCore};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use chrono::{DateTime, Duration, SecondsFormat, Utc};
use rusqlite::types::Value;
use rusqlite::{params, Connection, OptionalExtension};

const PIN_MIN: usize = 4;
const PIN_MAX: usize = 8;
const FREE_ATTEMPTS: i64 = 5;
const BACKOFF_BASE_SECS: i64 = 30;
const BACKOFF_CAP_SECS: i64 = 15 * 60;
const RECOVERY_LEN: usize = 16;
/// Crockford base32 (no I, L, O, U); 32 symbols so `byte & 31` is unbiased.
const CROCKFORD: &[u8; 32] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

pub const MSG_LOCKED: &str = "Uygulama kilitli.";
pub const MSG_NO_USER: &str = "Kullanıcı bulunamadı.";
pub const MSG_NEEDS_PIN: &str = "Bu kullanıcı için yeni PIN belirlenmeli.";
const MSG_BAD_PIN_FORMAT: &str = "PIN 4-8 haneli rakamlardan oluşmalı.";
const MSG_WRONG_PIN: &str = "PIN hatalı.";
const MSG_WRONG_RECOVERY: &str = "Kurtarma kodu hatalı.";
const MSG_INTERNAL: &str = "Kilit durumu okunamadı veya yazılamadı.";

#[derive(Debug, PartialEq)]
pub struct LockError {
    pub message: String,
    pub retry_after_sec: Option<u64>,
}

impl LockError {
    pub fn msg(m: &str) -> Self {
        Self {
            message: m.to_string(),
            retry_after_sec: None,
        }
    }
}

impl From<rusqlite::Error> for LockError {
    fn from(e: rusqlite::Error) -> Self {
        eprintln!("lock db error: {e}");
        Self::msg(MSG_INTERNAL)
    }
}

pub type Res<T> = Result<T, LockError>;

#[derive(Debug, PartialEq)]
pub enum Attempt {
    Ok,
    Wrong(Option<u64>),
    Throttled(u64),
}

/// Whose failure counters an attempt touches.
#[derive(Clone, Copy)]
enum Who<'a> {
    User(&'a str),
    Install,
}

/// (table, key) of the row holding the counters; both tables key on `id`.
fn target(who: Who) -> (&'static str, Value) {
    match who {
        Who::User(id) => ("users", Value::Text(id.to_string())),
        Who::Install => ("app_lock", Value::Integer(1)),
    }
}

pub fn ts(t: DateTime<Utc>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Secs, true)
}

pub fn parse(s: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(s)
        .ok()
        .map(|d| d.with_timezone(&Utc))
}

fn secs_until(deadline: DateTime<Utc>, now: DateTime<Utc>) -> u64 {
    ((deadline - now).num_milliseconds().max(0) as u64).div_ceil(1000)
}

fn hash(secret: &str) -> Res<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(secret.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| {
            eprintln!("argon2 hash error: {e}");
            LockError::msg(MSG_INTERNAL)
        })
}

fn matches(secret: &str, phc: &str) -> bool {
    PasswordHash::new(phc)
        .map(|h| {
            Argon2::default()
                .verify_password(secret.as_bytes(), &h)
                .is_ok()
        })
        .unwrap_or(false)
}

pub fn validate_pin(pin: &str) -> Res<()> {
    let ok = (PIN_MIN..=PIN_MAX).contains(&pin.len()) && pin.bytes().all(|b| b.is_ascii_digit());
    if ok {
        Ok(())
    } else {
        Err(LockError::msg(MSG_BAD_PIN_FORMAT))
    }
}

/// Validated + hashed PIN, ready to store.
pub fn hashed_pin(pin: &str) -> Res<String> {
    validate_pin(pin)?;
    hash(pin)
}

/// 16 Crockford chars, uppercase, no separators.
fn generate_code() -> String {
    let mut bytes = [0u8; RECOVERY_LEN];
    OsRng.fill_bytes(&mut bytes);
    bytes
        .iter()
        .map(|b| CROCKFORD[(b & 31) as usize] as char)
        .collect()
}

/// "XXXX-XXXX-XXXX-XXXX" display form.
fn group_code(code: &str) -> String {
    code.as_bytes()
        .chunks(4)
        .map(|c| String::from_utf8_lossy(c).into_owned())
        .collect::<Vec<_>>()
        .join("-")
}

fn normalize_code(input: &str) -> String {
    input
        .chars()
        .filter(|c| *c != '-' && !c.is_whitespace())
        .flat_map(char::to_uppercase)
        .collect()
}

/// New code (grouped for display) + its hash (over the normalised, ungrouped form).
pub fn new_recovery() -> Res<(String, String)> {
    let code = generate_code();
    let h = hash(&code)?;
    Ok((group_code(&code), h))
}

/// Installation-wide recovery hash; also clears that counter.
pub fn store_recovery(conn: &Connection, recovery_hash: &str) -> Res<()> {
    conn.execute(
        "INSERT INTO app_lock (id, recovery_hash) VALUES (1, ?1)
         ON CONFLICT(id) DO UPDATE SET recovery_hash = ?1, failed_count = 0, retry_after = NULL",
        [recovery_hash],
    )?;
    Ok(())
}

fn throttle(conn: &Connection, who: Who, now: DateTime<Utc>) -> Res<Option<u64>> {
    let (table, key) = target(who);
    let until: Option<String> = conn
        .query_row(
            &format!("SELECT retry_after FROM {table} WHERE id = ?1"),
            [key],
            |r| r.get(0),
        )
        .optional()?
        .flatten();
    Ok(until
        .as_deref()
        .and_then(parse)
        .filter(|t| *t > now)
        .map(|t| secs_until(t, now)))
}

fn register_failure(conn: &Connection, who: Who, now: DateTime<Utc>) -> Res<Option<u64>> {
    let (table, key) = target(who);
    let failures: i64 = conn.query_row(
        &format!(
            "UPDATE {table} SET failed_count = failed_count + 1 WHERE id = ?1 RETURNING failed_count"
        ),
        [key.clone()],
        |r| r.get(0),
    )?;
    if failures < FREE_ATTEMPTS {
        return Ok(None);
    }
    let exp = (failures - FREE_ATTEMPTS).min(20) as u32;
    let delay = (BACKOFF_BASE_SECS * 2i64.pow(exp)).min(BACKOFF_CAP_SECS);
    let until = now + Duration::seconds(delay);
    conn.execute(
        &format!("UPDATE {table} SET retry_after = ?2 WHERE id = ?1"),
        params![key, ts(until)],
    )?;
    Ok(Some(secs_until(until, now)))
}

/// A success also cancels a pending forgotten-PIN reset.
fn reset_counters(conn: &Connection, who: Who) -> Res<()> {
    let (table, key) = target(who);
    conn.execute(
        &format!(
            "UPDATE {table} SET failed_count = 0, retry_after = NULL, reset_pending_until = NULL WHERE id = ?1"
        ),
        [key],
    )?;
    Ok(())
}

/// Check `secret` against `phc`, applying throttle + failure counting.
fn check(
    conn: &Connection,
    who: Who,
    secret: &str,
    phc: Option<&str>,
    now: DateTime<Utc>,
) -> Res<Attempt> {
    if let Some(s) = throttle(conn, who, now)? {
        return Ok(Attempt::Throttled(s));
    }
    if phc.is_some_and(|p| matches(secret, p)) {
        reset_counters(conn, who)?;
        Ok(Attempt::Ok)
    } else {
        Ok(Attempt::Wrong(register_failure(conn, who, now)?))
    }
}

fn into_result(a: Attempt, wrong_msg: &str) -> Res<()> {
    match a {
        Attempt::Ok => Ok(()),
        Attempt::Wrong(r) => Err(LockError {
            message: wrong_msg.to_string(),
            retry_after_sec: r,
        }),
        Attempt::Throttled(s) => Err(LockError {
            message: format!("Çok fazla hatalı deneme. {s} saniye sonra tekrar deneyin."),
            retry_after_sec: Some(s),
        }),
    }
}

/// Per-user PIN attempt. Applies due 24 h resets first; a user with no PIN yields
/// `MSG_NEEDS_PIN` (the caller then asks for a new one).
pub fn login(conn: &Connection, user_id: &str, pin: &str, now: DateTime<Utc>) -> Res<Attempt> {
    users::apply_due_resets(conn, now)?;
    let phc = users::pin_hash(conn, user_id)?
        .ok_or_else(|| LockError::msg(MSG_NO_USER))?
        .ok_or_else(|| LockError::msg(MSG_NEEDS_PIN))?;
    check(conn, Who::User(user_id), pin, Some(&phc), now)
}

pub fn verify_pin(conn: &Connection, user_id: &str, pin: &str, now: DateTime<Utc>) -> Res<()> {
    into_result(login(conn, user_id, pin, now)?, MSG_WRONG_PIN)
}

/// Checks the installation recovery code (installation-level counter in `app_lock`).
pub fn verify_recovery(conn: &Connection, code: &str, now: DateTime<Utc>) -> Res<()> {
    let phc: Option<String> = conn
        .query_row("SELECT recovery_hash FROM app_lock WHERE id = 1", [], |r| {
            r.get(0)
        })
        .optional()?
        .flatten();
    let Some(phc) = phc else {
        return Err(LockError::msg(MSG_WRONG_RECOVERY));
    };
    let a = check(conn, Who::Install, &normalize_code(code), Some(&phc), now)?;
    into_result(a, MSG_WRONG_RECOVERY)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;

    fn mem() -> Connection {
        let mut c = Connection::open_in_memory().unwrap();
        db::migrate(&mut c).unwrap();
        c
    }

    fn t0() -> DateTime<Utc> {
        parse("2026-01-01T00:00:00Z").unwrap()
    }

    fn secs(n: i64) -> Duration {
        Duration::seconds(n)
    }

    fn user(c: &Connection, name: &str) -> String {
        users::create(c, name, "", "1234", t0()).unwrap().id
    }

    fn failed(c: &Connection, id: &str) -> i64 {
        c.query_row("SELECT failed_count FROM users WHERE id = ?1", [id], |r| {
            r.get(0)
        })
        .unwrap()
    }

    fn fail_n(c: &Connection, id: &str, n: usize, now: DateTime<Utc>) -> Attempt {
        let mut last = Attempt::Ok;
        for _ in 0..n {
            last = login(c, id, "0000", now).unwrap();
        }
        last
    }

    #[test]
    fn recovery_code_is_grouped_crockford_and_argon2id() {
        let (code, h) = new_recovery().unwrap();
        let ok = code.len() == 19
            && code.split('-').count() == 4
            && code.split('-').all(|g| g.len() == 4)
            && code
                .chars()
                .filter(|c| *c != '-')
                .all(|c| CROCKFORD.contains(&(c as u8)));
        assert!(ok, "bad code {code}");
        assert!(h.starts_with("$argon2id$"));
    }

    #[test]
    fn pin_format_is_validated() {
        for bad in ["123", "123456789", "12a4", "", "１２３４"] {
            assert_eq!(
                validate_pin(bad).unwrap_err().message,
                MSG_BAD_PIN_FORMAT,
                "{bad}"
            );
        }
    }

    #[test]
    fn login_ok_and_wrong() {
        let c = mem();
        let id = user(&c, "Ali");
        assert_eq!(login(&c, &id, "1234", t0()).unwrap(), Attempt::Ok);
        assert_eq!(login(&c, &id, "9999", t0()).unwrap(), Attempt::Wrong(None));
        assert_eq!(failed(&c, &id), 1);
        assert_eq!(
            login(&c, "nope", "1234", t0()).unwrap_err().message,
            MSG_NO_USER
        );
    }

    #[test]
    fn backoff_starts_at_fifth_failure_doubles_and_caps() {
        let c = mem();
        let id = user(&c, "Ali");
        assert_eq!(fail_n(&c, &id, 4, t0()), Attempt::Wrong(None));
        assert_eq!(
            login(&c, &id, "0000", t0()).unwrap(),
            Attempt::Wrong(Some(30))
        );
        // Throttled: not checked (even the right PIN is refused), counter untouched.
        assert_eq!(
            login(&c, &id, "1234", t0() + secs(10)).unwrap(),
            Attempt::Throttled(20)
        );
        assert_eq!(failed(&c, &id), 5);
        assert_eq!(
            login(&c, &id, "0000", t0() + secs(30)).unwrap(),
            Attempt::Wrong(Some(60))
        );
        let mut now = t0() + secs(30);
        let mut last = 60;
        for _ in 0..10 {
            now += secs(last as i64);
            if let Attempt::Wrong(Some(s)) = login(&c, &id, "0000", now).unwrap() {
                last = s;
            }
        }
        assert_eq!(last, 900);
    }

    #[test]
    fn backoff_is_isolated_between_users() {
        let c = mem();
        let (a, b) = (user(&c, "Ali"), user(&c, "Veli"));
        fail_n(&c, &a, 5, t0());
        assert_eq!(
            login(&c, &a, "1234", t0() + secs(1)).unwrap(),
            Attempt::Throttled(29)
        );
        assert_eq!(login(&c, &b, "1234", t0() + secs(1)).unwrap(), Attempt::Ok);
        assert_eq!(failed(&c, &b), 0);
    }

    #[test]
    fn throttle_message_is_turkish_with_seconds() {
        let c = mem();
        let id = user(&c, "Ali");
        fail_n(&c, &id, 5, t0());
        let e = verify_pin(&c, &id, "1234", t0() + secs(5)).unwrap_err();
        assert_eq!(
            e.message,
            "Çok fazla hatalı deneme. 25 saniye sonra tekrar deneyin."
        );
        assert_eq!(e.retry_after_sec, Some(25));
    }

    #[test]
    fn success_resets_counters_and_pending_reset() {
        let c = mem();
        let id = user(&c, "Ali");
        users::request_reset(&c, &id, t0()).unwrap();
        fail_n(&c, &id, 5, t0());
        assert_eq!(
            login(&c, &id, "1234", t0() + secs(31)).unwrap(),
            Attempt::Ok
        );
        assert_eq!(failed(&c, &id), 0);
        assert_eq!(users::list(&c, t0()).unwrap()[0].reset_pending_until, None);
    }

    #[test]
    fn recovery_uses_installation_counter_not_user_counter() {
        let c = mem();
        let id = user(&c, "Ali");
        let (code, h) = new_recovery().unwrap();
        store_recovery(&c, &h).unwrap();
        // Case/dash/space-insensitive.
        verify_recovery(&c, &code.to_lowercase().replace('-', " "), t0()).unwrap();
        verify_recovery(&c, "AAAA-AAAA-AAAA-AAAA", t0()).unwrap_err();
        let n: i64 = c
            .query_row("SELECT failed_count FROM app_lock", [], |r| r.get(0))
            .unwrap();
        assert_eq!(n, 1);
        assert_eq!(failed(&c, &id), 0);
    }
}
