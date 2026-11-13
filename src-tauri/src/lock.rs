//! App lock (PIN gate, not encryption): Argon2id-hashed PIN + recovery code with
//! failure backoff and a 24 h "forgotten recovery code" reset. Pure functions over a
//! `Connection`; the clock is passed in so tests control time.
use argon2::password_hash::rand_core::{OsRng, RngCore};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use chrono::{DateTime, Duration, SecondsFormat, Utc};
use rusqlite::{params, Connection, OptionalExtension};

const PIN_MIN: usize = 4;
const PIN_MAX: usize = 8;
const FREE_ATTEMPTS: i64 = 5;
const BACKOFF_BASE_SECS: i64 = 30;
const BACKOFF_CAP_SECS: i64 = 15 * 60;
const RESET_DELAY_HOURS: i64 = 24;
const RECOVERY_LEN: usize = 16;
/// Crockford base32 (no I, L, O, U); 32 symbols so `byte & 31` is unbiased.
const CROCKFORD: &[u8; 32] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

pub const MSG_LOCKED: &str = "Uygulama kilitli.";
const MSG_BAD_PIN_FORMAT: &str = "PIN 4-8 haneli rakamlardan oluşmalı.";
const MSG_WRONG_PIN: &str = "PIN hatalı.";
const MSG_WRONG_RECOVERY: &str = "Kurtarma kodu hatalı.";
const MSG_ALREADY: &str = "PIN zaten belirlenmiş.";
const MSG_NOT_CONFIGURED: &str = "PIN henüz belirlenmemiş.";
const MSG_INTERNAL: &str = "Kilit durumu okunamadı veya yazılamadı.";

#[derive(Debug, PartialEq)]
pub struct LockError {
    pub message: String,
    pub retry_after_sec: Option<u64>,
}

impl LockError {
    fn msg(m: &str) -> Self {
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

type Res<T> = Result<T, LockError>;

#[derive(Debug, PartialEq)]
pub struct Status {
    pub configured: bool,
    pub retry_after_sec: Option<u64>,
    pub reset_pending_until: Option<String>,
}

#[derive(Debug, PartialEq)]
pub enum Attempt {
    Ok,
    Wrong(Option<u64>),
    Throttled(u64),
}

fn ts(t: DateTime<Utc>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Secs, true)
}

fn parse(s: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(s)
        .ok()
        .map(|d| d.with_timezone(&Utc))
}

fn secs_until(deadline: DateTime<Utc>, now: DateTime<Utc>) -> u64 {
    ((deadline - now).num_milliseconds().max(0) as u64).div_ceil(1000)
}

struct Row {
    pin_hash: Option<String>,
    recovery_hash: Option<String>,
    retry_after: Option<String>,
    reset_pending_until: Option<String>,
}

fn read_row(conn: &Connection) -> Res<Option<Row>> {
    Ok(conn
        .query_row(
            "SELECT pin_hash, recovery_hash, retry_after, reset_pending_until FROM app_lock WHERE id = 1",
            [],
            |r| {
                Ok(Row {
                    pin_hash: r.get(0)?,
                    recovery_hash: r.get(1)?,
                    retry_after: r.get(2)?,
                    reset_pending_until: r.get(3)?,
                })
            },
        )
        .optional()?)
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
fn new_recovery() -> Res<(String, String)> {
    let code = generate_code();
    let h = hash(&code)?;
    Ok((group_code(&code), h))
}

pub fn status(conn: &Connection, now: DateTime<Utc>) -> Res<Status> {
    let Some(row) = read_row(conn)? else {
        return Ok(Status {
            configured: false,
            retry_after_sec: None,
            reset_pending_until: None,
        });
    };
    let reset_due = row
        .reset_pending_until
        .as_deref()
        .and_then(parse)
        .is_some_and(|t| t <= now);
    if reset_due {
        // Forgotten-recovery reset: credentials go, period data stays.
        conn.execute(
            "UPDATE app_lock SET pin_hash = NULL, recovery_hash = NULL, failed_count = 0,
             retry_after = NULL, reset_pending_until = NULL WHERE id = 1",
            [],
        )?;
        return Ok(Status {
            configured: false,
            retry_after_sec: None,
            reset_pending_until: None,
        });
    }
    Ok(Status {
        configured: row.pin_hash.is_some(),
        retry_after_sec: row
            .retry_after
            .as_deref()
            .and_then(parse)
            .filter(|t| *t > now)
            .map(|t| secs_until(t, now)),
        reset_pending_until: row.reset_pending_until,
    })
}

pub fn is_configured(conn: &Connection, now: DateTime<Utc>) -> Res<bool> {
    Ok(status(conn, now)?.configured)
}

/// Gate for the period commands: configured AND unlocked.
pub fn ensure_unlocked(
    conn: &Connection,
    unlocked: bool,
    now: DateTime<Utc>,
) -> Result<(), String> {
    if unlocked && is_configured(conn, now).map_err(|e| e.message)? {
        Ok(())
    } else {
        Err(MSG_LOCKED.to_string())
    }
}

fn store_credentials(conn: &Connection, pin: &str, recovery_hash: &str) -> Res<()> {
    conn.execute(
        "INSERT INTO app_lock (id, pin_hash, recovery_hash, failed_count, retry_after, reset_pending_until)
         VALUES (1, ?1, ?2, 0, NULL, NULL)
         ON CONFLICT(id) DO UPDATE SET pin_hash = ?1, recovery_hash = ?2, failed_count = 0,
           retry_after = NULL, reset_pending_until = NULL",
        params![hash(pin)?, recovery_hash],
    )?;
    Ok(())
}

pub fn setup(conn: &Connection, pin: &str, now: DateTime<Utc>) -> Res<String> {
    if is_configured(conn, now)? {
        return Err(LockError::msg(MSG_ALREADY));
    }
    validate_pin(pin)?;
    let (code, rhash) = new_recovery()?;
    store_credentials(conn, pin, &rhash)?;
    Ok(code)
}

fn throttle(conn: &Connection, now: DateTime<Utc>) -> Res<Option<u64>> {
    Ok(read_row(conn)?
        .and_then(|r| r.retry_after)
        .as_deref()
        .and_then(parse)
        .filter(|t| *t > now)
        .map(|t| secs_until(t, now)))
}

fn register_failure(conn: &Connection, now: DateTime<Utc>) -> Res<Option<u64>> {
    let failures: i64 = conn.query_row(
        "UPDATE app_lock SET failed_count = failed_count + 1 WHERE id = 1 RETURNING failed_count",
        [],
        |r| r.get(0),
    )?;
    if failures < FREE_ATTEMPTS {
        return Ok(None);
    }
    let exp = (failures - FREE_ATTEMPTS).min(20) as u32;
    let delay = (BACKOFF_BASE_SECS * 2i64.pow(exp)).min(BACKOFF_CAP_SECS);
    let until = now + Duration::seconds(delay);
    conn.execute(
        "UPDATE app_lock SET retry_after = ?1 WHERE id = 1",
        [ts(until)],
    )?;
    Ok(Some(secs_until(until, now)))
}

fn reset_counters(conn: &Connection) -> Res<()> {
    conn.execute(
        "UPDATE app_lock SET failed_count = 0, retry_after = NULL, reset_pending_until = NULL WHERE id = 1",
        [],
    )?;
    Ok(())
}

/// Check a secret against the chosen hash column, applying throttle + failure counting.
fn attempt(conn: &Connection, secret: &str, recovery: bool, now: DateTime<Utc>) -> Res<Attempt> {
    if !is_configured(conn, now)? {
        return Err(LockError::msg(MSG_NOT_CONFIGURED));
    }
    if let Some(s) = throttle(conn, now)? {
        return Ok(Attempt::Throttled(s));
    }
    let row = read_row(conn)?.ok_or_else(|| LockError::msg(MSG_NOT_CONFIGURED))?;
    let phc = if recovery {
        row.recovery_hash
    } else {
        row.pin_hash
    }
    .unwrap_or_default();
    if matches(secret, &phc) {
        reset_counters(conn)?;
        Ok(Attempt::Ok)
    } else {
        Ok(Attempt::Wrong(register_failure(conn, now)?))
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

fn verify_pin_or_err(conn: &Connection, pin: &str, now: DateTime<Utc>) -> Res<()> {
    into_result(attempt(conn, pin, false, now)?, MSG_WRONG_PIN)
}

pub fn unlock(conn: &Connection, pin: &str, now: DateTime<Utc>) -> Res<Attempt> {
    attempt(conn, pin, false, now)
}

pub fn change(conn: &Connection, pin: &str, new_pin: &str, now: DateTime<Utc>) -> Res<()> {
    validate_pin(new_pin)?;
    verify_pin_or_err(conn, pin, now)?;
    conn.execute(
        "UPDATE app_lock SET pin_hash = ?1 WHERE id = 1",
        [hash(new_pin)?],
    )?;
    Ok(())
}

pub fn new_recovery_code(conn: &Connection, pin: &str, now: DateTime<Utc>) -> Res<String> {
    verify_pin_or_err(conn, pin, now)?;
    let (code, rhash) = new_recovery()?;
    conn.execute(
        "UPDATE app_lock SET recovery_hash = ?1 WHERE id = 1",
        [rhash],
    )?;
    Ok(code)
}

/// Recovery shares the PIN's failure counter. Returns the rotated code.
pub fn recover(conn: &Connection, code: &str, new_pin: &str, now: DateTime<Utc>) -> Res<String> {
    validate_pin(new_pin)?;
    into_result(
        attempt(conn, &normalize_code(code), true, now)?,
        MSG_WRONG_RECOVERY,
    )?;
    let (new_code, rhash) = new_recovery()?;
    store_credentials(conn, new_pin, &rhash)?;
    Ok(new_code)
}

/// Idempotent: an existing (earlier) deadline is kept.
pub fn request_reset(conn: &Connection, now: DateTime<Utc>) -> Res<String> {
    if !is_configured(conn, now)? {
        return Err(LockError::msg(MSG_NOT_CONFIGURED));
    }
    if let Some(existing) = read_row(conn)?.and_then(|r| r.reset_pending_until) {
        return Ok(existing);
    }
    let until = ts(now + Duration::hours(RESET_DELAY_HOURS));
    conn.execute(
        "UPDATE app_lock SET reset_pending_until = ?1 WHERE id = 1",
        [&until],
    )?;
    Ok(until)
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

    fn failed(c: &Connection) -> i64 {
        c.query_row("SELECT failed_count FROM app_lock", [], |r| r.get(0))
            .unwrap()
    }

    fn fail_n(c: &Connection, n: usize, now: DateTime<Utc>) -> Attempt {
        let mut last = Attempt::Ok;
        for _ in 0..n {
            last = unlock(c, "0000", now).unwrap();
        }
        last
    }

    #[test]
    fn setup_returns_grouped_crockford_code_and_hashes_with_argon2id() {
        let c = mem();
        let code = setup(&c, "1234", t0()).unwrap();
        let ok = code.len() == 19
            && code.split('-').count() == 4
            && code.split('-').all(|g| g.len() == 4)
            && code
                .chars()
                .filter(|c| *c != '-')
                .all(|c| CROCKFORD.contains(&(c as u8)));
        assert!(ok, "bad code {code}");
        let pin_hash: String = c
            .query_row("SELECT pin_hash FROM app_lock", [], |r| r.get(0))
            .unwrap();
        assert!(pin_hash.starts_with("$argon2id$"));
        assert!(setup(&c, "1234", t0()).is_err());
    }

    #[test]
    fn pin_format_is_validated() {
        let c = mem();
        for bad in ["123", "123456789", "12a4", "", "１２３４"] {
            assert_eq!(
                setup(&c, bad, t0()).unwrap_err().message,
                MSG_BAD_PIN_FORMAT,
                "{bad}"
            );
        }
        assert!(!is_configured(&c, t0()).unwrap());
    }

    #[test]
    fn unlock_ok_and_wrong() {
        let c = mem();
        setup(&c, "1234", t0()).unwrap();
        assert_eq!(unlock(&c, "1234", t0()).unwrap(), Attempt::Ok);
        assert_eq!(unlock(&c, "9999", t0()).unwrap(), Attempt::Wrong(None));
        assert_eq!(failed(&c), 1);
    }

    #[test]
    fn backoff_starts_at_fifth_failure_doubles_and_caps() {
        let c = mem();
        setup(&c, "1234", t0()).unwrap();
        assert_eq!(fail_n(&c, 4, t0()), Attempt::Wrong(None));
        assert_eq!(unlock(&c, "0000", t0()).unwrap(), Attempt::Wrong(Some(30)));
        // Throttled: not checked (even the right PIN is refused), counter untouched.
        assert_eq!(
            unlock(&c, "1234", t0() + secs(10)).unwrap(),
            Attempt::Throttled(20)
        );
        assert_eq!(failed(&c), 5);
        assert_eq!(
            status(&c, t0() + secs(10)).unwrap().retry_after_sec,
            Some(20)
        );
        // 6th failure after the wait -> 60 s, then 120, ... capped at 900.
        assert_eq!(
            unlock(&c, "0000", t0() + secs(30)).unwrap(),
            Attempt::Wrong(Some(60))
        );
        let mut now = t0() + secs(30);
        let mut last = 60;
        for _ in 0..10 {
            now += secs(last as i64);
            if let Attempt::Wrong(Some(s)) = unlock(&c, "0000", now).unwrap() {
                last = s;
            }
        }
        assert_eq!(last, 900);
    }

    #[test]
    fn throttle_message_is_turkish_with_seconds() {
        let c = mem();
        setup(&c, "1234", t0()).unwrap();
        fail_n(&c, 5, t0());
        let e = change(&c, "1234", "5678", t0() + secs(5)).unwrap_err();
        assert_eq!(
            e.message,
            "Çok fazla hatalı deneme. 25 saniye sonra tekrar deneyin."
        );
        assert_eq!(e.retry_after_sec, Some(25));
    }

    #[test]
    fn success_resets_counters() {
        let c = mem();
        setup(&c, "1234", t0()).unwrap();
        fail_n(&c, 5, t0());
        assert_eq!(unlock(&c, "1234", t0() + secs(31)).unwrap(), Attempt::Ok);
        assert_eq!(failed(&c), 0);
        assert_eq!(status(&c, t0() + secs(31)).unwrap().retry_after_sec, None);
    }

    #[test]
    fn recover_rotates_code_sets_pin_and_shares_backoff() {
        let c = mem();
        let old = setup(&c, "1234", t0()).unwrap();
        // Case/dash/space-insensitive.
        let sloppy = old.to_lowercase().replace('-', " ");
        let new_code = recover(&c, &sloppy, "5678", t0()).unwrap();
        assert_ne!(new_code, old);
        assert_eq!(unlock(&c, "5678", t0()).unwrap(), Attempt::Ok);
        assert_eq!(unlock(&c, "1234", t0()).unwrap(), Attempt::Wrong(None));
        assert_eq!(
            recover(&c, &old, "1111", t0()).unwrap_err().message,
            MSG_WRONG_RECOVERY
        );
        assert!(recover(&c, &new_code, "1111", t0()).is_ok());
        // Recovery failures feed the same counter.
        let before = failed(&c);
        recover(&c, "AAAA-AAAA-AAAA-AAAA", "1111", t0()).unwrap_err();
        assert_eq!(failed(&c), before + 1);
    }

    #[test]
    fn change_and_new_recovery_code_require_the_current_pin() {
        let c = mem();
        let old = setup(&c, "1234", t0()).unwrap();
        assert!(change(&c, "0000", "5678", t0()).is_err());
        change(&c, "1234", "5678", t0()).unwrap();
        assert_eq!(unlock(&c, "5678", t0()).unwrap(), Attempt::Ok);
        assert!(change(&c, "5678", "12", t0()).is_err());
        let fresh = new_recovery_code(&c, "5678", t0()).unwrap();
        assert!(recover(&c, &old, "1111", t0()).is_err());
        assert!(recover(&c, &fresh, "1111", t0()).is_ok());
    }

    #[test]
    fn reset_is_idempotent_and_clears_credentials_after_24h_keeping_data() {
        let mut c = mem();
        setup(&c, "1234", t0()).unwrap();
        let doc = r#"{"period":"p","meta":{"revision":1,"status":"draft"}}"#;
        db::save(&mut c, doc).unwrap();
        let first = request_reset(&c, t0()).unwrap();
        assert_eq!(first, "2026-01-02T00:00:00Z");
        assert_eq!(request_reset(&c, t0() + secs(3600)).unwrap(), first);
        let before = status(&c, t0() + secs(86_399)).unwrap();
        assert!(before.configured);
        assert_eq!(before.reset_pending_until.as_deref(), Some(first.as_str()));
        let after = status(&c, t0() + secs(86_400)).unwrap();
        assert!(!after.configured);
        assert_eq!(after.reset_pending_until, None);
        assert!(db::load(&c, "p#r1").unwrap().is_some());
        // A new PIN can be set up again.
        assert!(setup(&c, "4321", t0() + secs(86_401)).is_ok());
    }

    #[test]
    fn successful_unlock_cancels_pending_reset() {
        let c = mem();
        setup(&c, "1234", t0()).unwrap();
        request_reset(&c, t0()).unwrap();
        unlock(&c, "1234", t0() + secs(60)).unwrap();
        assert_eq!(
            status(&c, t0() + secs(60)).unwrap().reset_pending_until,
            None
        );
    }

    #[test]
    fn gate_refuses_when_locked_or_unconfigured() {
        let c = mem();
        assert_eq!(ensure_unlocked(&c, true, t0()).unwrap_err(), MSG_LOCKED);
        setup(&c, "1234", t0()).unwrap();
        assert_eq!(ensure_unlocked(&c, false, t0()).unwrap_err(), MSG_LOCKED);
        assert!(ensure_unlocked(&c, true, t0()).is_ok());
    }
}
