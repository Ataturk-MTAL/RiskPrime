//! Activity history. Written only from inside commands; `user_name` is copied so history
//! survives user removal. Action strings are shown by the UI as-is.
use crate::db::{self, DbError, PeriodSummary};
use crate::lock::{parse, ts};
use crate::users::User;
use chrono::{DateTime, Duration, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;

pub const LOGIN: &str = "giriş";
pub const LOGOUT: &str = "çıkış";
pub const USER_CREATED: &str = "kullanıcı eklendi";
pub const USER_UPDATED: &str = "kullanıcı güncellendi";
pub const USER_REMOVED: &str = "kullanıcı silindi";
pub const PIN_RESET: &str = "PIN sıfırlandı";
pub const PIN_RESET_REQUESTED: &str = "PIN sıfırlama istendi (kilit ekranından)";
pub const PIN_RESET_COMPLETED: &str = "PIN sıfırlandı (24 saat doldu)";
pub const PIN_CHANGED: &str = "PIN değiştirildi";
pub const RECOVERY_USED: &str = "kurtarma kodu kullanıldı";
pub const RECOVERY_RENEWED: &str = "yeni kurtarma kodu üretildi";
pub const PERIOD_CREATED: &str = "yeni dönem";
pub const REVISION_OPENED: &str = "düzeltme taslağı açıldı";
pub const PERIOD_SIGNED: &str = "dönem kapatıldı";
pub const PERIOD_EDITED: &str = "düzenledi";
pub const PERIOD_REMOVED: &str = "dönem silindi";

const ANONYMOUS: &str = "—";
const COALESCE_MINUTES: i64 = 10;
const MAX_LIST: i64 = 1000;
const WORK_ACTIONS: [&str; 4] = [
    PERIOD_CREATED,
    REVISION_OPENED,
    PERIOD_SIGNED,
    PERIOD_EDITED,
];

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: i64,
    pub started_at: String,
    pub at: String,
    pub user_id: Option<String>,
    pub user_name: String,
    /// The user's name now; `None` when the user was removed (or the row is anonymous).
    pub current_name: Option<String>,
    pub action: String,
    pub period_id: Option<String>,
    pub detail: String,
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LastEditor {
    pub user_name: String,
    pub at: String,
}

pub fn log(
    conn: &Connection,
    user: &User,
    action: &str,
    period_id: Option<&str>,
    now: DateTime<Utc>,
) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO audit_log (started_at, at, user_id, user_name, action, period_id)
         VALUES (?1, ?1, ?2, ?3, ?4, ?5)",
        params![ts(now), user.id, user.name, action, period_id],
    )?;
    Ok(())
}

/// Entry nobody is logged in for (lock-screen request): no user id, name "—", target in `detail`.
pub fn log_anonymous(
    conn: &Connection,
    action: &str,
    detail: &str,
    now: DateTime<Utc>,
) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO audit_log (started_at, at, user_id, user_name, action, detail)
         VALUES (?1, ?1, NULL, ?2, ?3, ?4)",
        params![ts(now), ANONYMOUS, action, detail],
    )?;
    Ok(())
}

/// "<action>: <target name>" entry.
pub fn log_target(
    conn: &Connection,
    actor: &User,
    action: &str,
    target_name: &str,
    now: DateTime<Utc>,
) -> rusqlite::Result<()> {
    log(conn, actor, &format!("{action}: {target_name}"), None, now)
}

/// Repeated saves by the same user on the same period within 10 minutes become one row
/// (its `at` moves forward) — only when that row is the latest of the whole log.
fn log_edit(
    conn: &Connection,
    user: &User,
    period_id: &str,
    now: DateTime<Utc>,
) -> rusqlite::Result<()> {
    // (id, user_id, period_id, action, at)
    type Latest = (i64, Option<String>, Option<String>, String, String);
    let latest: Option<Latest> = conn
        .query_row(
            "SELECT id, user_id, period_id, action, at FROM audit_log ORDER BY id DESC LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
        )
        .optional()?;
    if let Some((id, uid, pid, action, at)) = latest {
        let recent = parse(&at).is_some_and(|t| now - t <= Duration::minutes(COALESCE_MINUTES));
        let same = uid.as_deref() == Some(user.id.as_str())
            && pid.as_deref() == Some(period_id)
            && action == PERIOD_EDITED;
        if same && recent {
            conn.execute(
                "UPDATE audit_log SET at = ?2 WHERE id = ?1",
                params![id, ts(now)],
            )?;
            return Ok(());
        }
    }
    log(conn, user, PERIOD_EDITED, Some(period_id), now)
}

fn classify(prev_status: Option<&str>, has_siblings: bool, new_status: &str) -> &'static str {
    match prev_status {
        None if has_siblings => REVISION_OPENED,
        None => PERIOD_CREATED,
        Some("draft") if new_status == "signed" => PERIOD_SIGNED,
        Some(_) => PERIOD_EDITED,
    }
}

/// `db::save` plus the matching audit entry. The audit row is written after the save commits
/// (shortcut: separate transactions; a crash between them loses one history line, not data).
pub fn save_with_audit(
    conn: &mut Connection,
    user: &User,
    document: &str,
    now: DateTime<Utc>,
) -> Result<PeriodSummary, DbError> {
    let next = db::peek(document)?;
    let prev: Option<String> = conn
        .query_row(
            "SELECT status FROM periods WHERE id = ?1",
            [&next.id],
            |r| r.get(0),
        )
        .optional()?;
    let has_siblings = conn
        .query_row(
            "SELECT 1 FROM periods WHERE period = ?1 AND id <> ?2 LIMIT 1",
            params![next.period, next.id],
            |_| Ok(()),
        )
        .optional()?
        .is_some();
    let summary = db::save(conn, document)?;
    match classify(prev.as_deref(), has_siblings, &summary.status) {
        PERIOD_EDITED => log_edit(conn, user, &summary.id, now)?,
        action => log(conn, user, action, Some(&summary.id), now)?,
    }
    Ok(summary)
}

pub fn list(
    conn: &Connection,
    limit: i64,
    period_id: Option<&str>,
) -> rusqlite::Result<Vec<Entry>> {
    let mut stmt = conn.prepare(
        "SELECT a.id, a.started_at, a.at, a.user_id, a.user_name, u.name, a.action, a.period_id, a.detail
         FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
         WHERE (?1 IS NULL OR a.period_id = ?1) ORDER BY a.id DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![period_id, limit.clamp(1, MAX_LIST)], |r| {
        Ok(Entry {
            id: r.get(0)?,
            started_at: r.get(1)?,
            at: r.get(2)?,
            user_id: r.get(3)?,
            user_name: r.get(4)?,
            current_name: r.get(5)?,
            action: r.get(6)?,
            period_id: r.get(7)?,
            detail: r.get(8)?,
        })
    })?;
    rows.collect()
}

pub fn last_editor(conn: &Connection, period_id: &str) -> rusqlite::Result<Option<LastEditor>> {
    let marks = vec!["?"; WORK_ACTIONS.len()].join(",");
    let sql = format!(
        "SELECT user_name, at FROM audit_log WHERE period_id = ?1 AND action IN ({marks})
         ORDER BY id DESC LIMIT 1"
    );
    let mut args: Vec<&str> = vec![period_id];
    args.extend(WORK_ACTIONS);
    conn.query_row(&sql, rusqlite::params_from_iter(args), |r| {
        Ok(LastEditor {
            user_name: r.get(0)?,
            at: r.get(1)?,
        })
    })
    .optional()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::users;

    fn mem() -> Connection {
        let mut c = Connection::open_in_memory().unwrap();
        db::migrate(&mut c).unwrap();
        c
    }

    fn t0() -> DateTime<Utc> {
        parse("2026-01-01T00:00:00Z").unwrap()
    }

    fn min(n: i64) -> DateTime<Utc> {
        t0() + Duration::minutes(n)
    }

    fn doc(period: &str, rev: i64, status: &str) -> String {
        format!(r#"{{"period":"{period}","meta":{{"revision":{rev},"status":"{status}"}}}}"#)
    }

    fn mk(c: &Connection, name: &str) -> User {
        users::create(c, name, "", "1234", t0()).unwrap()
    }

    fn actions(c: &Connection) -> Vec<String> {
        let mut v: Vec<_> = list(c, 100, None)
            .unwrap()
            .into_iter()
            .map(|e| e.action)
            .collect();
        v.reverse();
        v
    }

    #[test]
    fn saves_within_ten_minutes_coalesce_and_move_at() {
        let mut c = mem();
        let a = mk(&c, "Ali");
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), t0()).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), min(1)).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), min(6)).unwrap();
        let rows = list(&c, 10, None).unwrap();
        assert_eq!(actions(&c), [PERIOD_CREATED, PERIOD_EDITED]);
        assert_eq!(rows[0].started_at, ts(min(1)));
        assert_eq!(rows[0].at, ts(min(6)));
    }

    #[test]
    fn gap_over_ten_minutes_starts_a_new_row() {
        let mut c = mem();
        let a = mk(&c, "Ali");
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), t0()).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), min(1)).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), min(12)).unwrap();
        assert_eq!(actions(&c), [PERIOD_CREATED, PERIOD_EDITED, PERIOD_EDITED]);
    }

    #[test]
    fn different_user_does_not_coalesce() {
        let mut c = mem();
        let (a, b) = (mk(&c, "Ali"), mk(&c, "Veli"));
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), t0()).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), min(1)).unwrap();
        save_with_audit(&mut c, &b, &doc("p", 1, "draft"), min(2)).unwrap();
        let rows = list(&c, 10, None).unwrap();
        assert_eq!(rows.len(), 3);
        assert_eq!(rows[0].user_name, "Veli");
    }

    #[test]
    fn signing_and_revision_are_logged_distinctly() {
        let mut c = mem();
        let a = mk(&c, "Ali");
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), t0()).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 1, "signed"), min(1)).unwrap();
        save_with_audit(&mut c, &a, &doc("p", 2, "draft"), min(2)).unwrap();
        save_with_audit(&mut c, &a, &doc("q", 1, "draft"), min(3)).unwrap();
        assert_eq!(
            actions(&c),
            [
                PERIOD_CREATED,
                PERIOD_SIGNED,
                REVISION_OPENED,
                PERIOD_CREATED
            ]
        );
        let signed = list(&c, 10, Some("p#r1")).unwrap();
        assert_eq!(signed.len(), 2);
        assert_eq!(signed[0].action, PERIOD_SIGNED);
    }

    #[test]
    fn history_survives_user_removal_and_last_editor_reads_it() {
        let mut c = mem();
        let (a, b) = (mk(&c, "Ali"), mk(&c, "Veli"));
        save_with_audit(&mut c, &b, &doc("p", 1, "draft"), t0()).unwrap();
        log_target(&c, &a, USER_REMOVED, "Veli", min(1)).unwrap();
        users::remove(&c, &b.id, &a.id).unwrap();
        let rows = list(&c, 10, None).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].action, "kullanıcı silindi: Veli");
        assert_eq!(rows[1].user_name, "Veli");
        let le = last_editor(&c, "p#r1").unwrap().unwrap();
        assert_eq!((le.user_name.as_str(), le.at), ("Veli", ts(t0())));
        assert_eq!(last_editor(&c, "zzz").unwrap(), None);
    }

    #[test]
    fn list_returns_user_id_and_current_name_and_anonymous_rows() {
        let mut c = mem();
        let (a, b) = (mk(&c, "Ali"), mk(&c, "Veli"));
        save_with_audit(&mut c, &a, &doc("p", 1, "draft"), t0()).unwrap();
        save_with_audit(&mut c, &b, &doc("q", 1, "draft"), min(1)).unwrap();
        log_anonymous(&c, PIN_RESET_REQUESTED, "Ali", min(2)).unwrap();
        users::update(&c, &a.id, "Ali K.", "").unwrap();
        users::remove(&c, &b.id, &a.id).unwrap();
        let rows = list(&c, 10, None).unwrap();
        let anon = &rows[0];
        assert_eq!(anon.user_id, None);
        assert_eq!(
            (anon.user_name.as_str(), anon.detail.as_str()),
            ("—", "Ali")
        );
        assert_eq!(anon.current_name, None);
        assert_eq!(rows[1].current_name, None); // Veli removed
        assert_eq!(rows[1].user_id.as_deref(), Some(b.id.as_str()));
        assert_eq!(rows[2].user_name, "Ali");
        assert_eq!(rows[2].current_name.as_deref(), Some("Ali K."));
    }

    #[test]
    fn invalid_document_is_rejected_without_audit() {
        let mut c = mem();
        let a = mk(&c, "Ali");
        assert!(save_with_audit(&mut c, &a, "nope", t0()).is_err());
        assert!(list(&c, 10, None).unwrap().is_empty());
    }
}
