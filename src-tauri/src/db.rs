//! SQLite period archive. `periods.document` is the verbatim assessment JSON (source of truth,
//! its content hash must stay verifiable); the other tables are a read model rebuilt on each save.
use rusqlite::{params, Connection, OptionalExtension, Transaction};
use serde::Serialize;
use serde_json::Value;
use std::path::Path;

const SCHEMA_V1: &str = r#"
CREATE TABLE periods (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  revision INTEGER NOT NULL,
  status TEXT NOT NULL,
  school_name TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  signed_at TEXT,
  content_hash TEXT,
  document TEXT NOT NULL
);
CREATE INDEX periods_order ON periods(period DESC, revision DESC);

CREATE TABLE locations (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  id TEXT NOT NULL, name TEXT, type TEXT,
  PRIMARY KEY (period_id, id)
);
CREATE TABLE checklists (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  id TEXT NOT NULL, code TEXT, name TEXT, source TEXT,
  PRIMARY KEY (period_id, id)
);
CREATE TABLE checklist_items (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  list_id TEXT NOT NULL, id TEXT NOT NULL, no TEXT, text TEXT, ref TEXT,
  PRIMARY KEY (period_id, list_id, id)
);
CREATE TABLE inspections (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  id TEXT NOT NULL, list_id TEXT, location_id TEXT,
  PRIMARY KEY (period_id, id)
);
CREATE TABLE answers (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  inspection_id TEXT NOT NULL, item_id TEXT NOT NULL, answer TEXT, note TEXT,
  PRIMARY KEY (period_id, inspection_id, item_id)
);
CREATE TABLE risk_rows (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL, id TEXT NOT NULL, hazard TEXT,
  likelihood INTEGER, severity INTEGER, likelihood_after INTEGER, severity_after INTEGER,
  status TEXT, due_date TEXT,
  PRIMARY KEY (period_id, location_id, id)
);
CREATE TABLE row_sources (
  period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL, row_id TEXT NOT NULL,
  list_id TEXT, item_id TEXT, source_location_id TEXT
);
CREATE INDEX row_sources_row ON row_sources(period_id, location_id, row_id);
"#;

const SCHEMA_V2: &str = r#"
CREATE TABLE app_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pin_hash TEXT,
  recovery_hash TEXT,
  failed_count INTEGER NOT NULL DEFAULT 0,
  retry_after TEXT NULL,
  reset_pending_until TEXT NULL
);
"#;

/// Multi-user: per-user PIN + counters move from `app_lock` (which keeps only the installation
/// recovery hash and its own counters) to `users`. An existing v2 PIN becomes "Kullanıcı 1".
/// `name_key` is the normalised unique name (see users.rs for the Turkish-lowercase caveat).
const SCHEMA_V3: &str = r#"
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  pin_hash TEXT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  retry_after TEXT NULL,
  reset_pending_until TEXT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX users_name_key ON users(name_key);
INSERT INTO users (id, name, name_key, pin_hash, failed_count, retry_after, reset_pending_until, created_at)
  SELECT lower(hex(randomblob(8))), 'Kullanıcı 1', 'kullanıcı 1', pin_hash, failed_count,
         retry_after, reset_pending_until, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
  FROM app_lock WHERE pin_hash IS NOT NULL;
UPDATE app_lock SET pin_hash = NULL, failed_count = 0, retry_after = NULL, reset_pending_until = NULL;

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  started_at TEXT NOT NULL,
  at TEXT NOT NULL,
  user_id TEXT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  period_id TEXT NULL,
  detail TEXT NOT NULL DEFAULT ''
);
CREATE INDEX audit_log_at ON audit_log(at);
"#;

/// A PIN reset now issues a temporary PIN that must be changed at first login. Rows whose PIN
/// was already cleared (NULL) stay NULL: they are refused at login, not claimable.
const SCHEMA_V4: &str = r#"
ALTER TABLE users ADD COLUMN must_change_pin INTEGER NOT NULL DEFAULT 0;
"#;

/// Ordered migrations; index + 1 is the `user_version` after applying it.
const MIGRATIONS: &[&str] = &[SCHEMA_V1, SCHEMA_V2, SCHEMA_V3, SCHEMA_V4];

#[derive(Debug)]
pub enum DbError {
    Sqlite(rusqlite::Error),
    Invalid(&'static str),
}

impl DbError {
    /// Turkish text safe to show in the UI.
    pub fn user_message(&self) -> &'static str {
        match self {
            DbError::Sqlite(_) => "Dönem arşivi okunamadı veya yazılamadı",
            DbError::Invalid(msg) => msg,
        }
    }
}

impl std::fmt::Display for DbError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DbError::Sqlite(e) => write!(f, "sqlite: {e}"),
            DbError::Invalid(msg) => f.write_str(msg),
        }
    }
}

impl std::error::Error for DbError {}

impl From<rusqlite::Error> for DbError {
    fn from(e: rusqlite::Error) -> Self {
        DbError::Sqlite(e)
    }
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PeriodSummary {
    pub id: String,
    pub period: String,
    pub revision: i64,
    pub status: String,
    pub school_name: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signed_at: Option<String>,
}

pub fn open(path: &Path) -> Result<Connection, DbError> {
    let mut conn = Connection::open(path)?;
    migrate(&mut conn)?;
    Ok(conn)
}

pub fn migrate(conn: &mut Connection) -> Result<(), DbError> {
    migrate_to(conn, MIGRATIONS.len())
}

fn migrate_to(conn: &mut Connection, target: usize) -> Result<(), DbError> {
    conn.pragma_update(None, "foreign_keys", true)?;
    let current: usize = conn.pragma_query_value(None, "user_version", |r| r.get(0))?;
    for (i, sql) in MIGRATIONS.iter().enumerate().take(target).skip(current) {
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", i + 1)?;
        tx.commit()?;
    }
    Ok(())
}

/// Must match `periodKey` in src/lib/storage/types.ts.
pub fn period_key(period: &str, revision: i64) -> String {
    let p = period.trim();
    format!("{}#r{}", if p.is_empty() { "adsız" } else { p }, revision)
}

pub fn list(conn: &Connection) -> Result<Vec<PeriodSummary>, DbError> {
    let mut stmt = conn.prepare(
        "SELECT id, period, revision, status, school_name, updated_at, signed_at
         FROM periods ORDER BY period DESC, revision DESC",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok(PeriodSummary {
            id: r.get(0)?,
            period: r.get(1)?,
            revision: r.get(2)?,
            status: r.get(3)?,
            school_name: r.get(4)?,
            updated_at: r.get(5)?,
            signed_at: r.get(6)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn load(conn: &Connection, id: &str) -> Result<Option<String>, DbError> {
    Ok(conn
        .query_row("SELECT document FROM periods WHERE id = ?1", [id], |r| {
            r.get(0)
        })
        .optional()?)
}

pub fn remove(conn: &Connection, id: &str) -> Result<(), DbError> {
    conn.execute("DELETE FROM periods WHERE id = ?1", [id])?;
    Ok(())
}

/// Summary of a document without storing it (id/status for audit classification).
pub fn peek(document: &str) -> Result<PeriodSummary, DbError> {
    let doc: Value =
        serde_json::from_str(document).map_err(|_| DbError::Invalid("Dönem belgesi geçersiz"))?;
    summary_of(&doc)
}

pub fn save(conn: &mut Connection, document: &str) -> Result<PeriodSummary, DbError> {
    let doc: Value =
        serde_json::from_str(document).map_err(|_| DbError::Invalid("Dönem belgesi geçersiz"))?;
    let summary = summary_of(&doc)?;
    let content_hash = doc["meta"]["contentHash"].as_str();

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO periods (id, period, revision, status, school_name, updated_at, signed_at, content_hash, document)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(id) DO UPDATE SET period = ?2, revision = ?3, status = ?4, school_name = ?5,
           updated_at = ?6, signed_at = ?7, content_hash = ?8, document = ?9",
        params![
            summary.id,
            summary.period,
            summary.revision,
            summary.status,
            summary.school_name,
            summary.updated_at,
            summary.signed_at,
            content_hash,
            document
        ],
    )?;
    rebuild_read_model(&tx, &summary.id, &doc)?;
    tx.commit()?;
    Ok(summary)
}

fn summary_of(doc: &Value) -> Result<PeriodSummary, DbError> {
    let missing = || DbError::Invalid("Dönem belgesi eksik alan içeriyor");
    let meta = &doc["meta"];
    let period = doc["period"].as_str().ok_or_else(missing)?;
    let revision = meta["revision"].as_i64().ok_or_else(missing)?;
    let status = meta["status"].as_str().ok_or_else(missing)?;
    Ok(PeriodSummary {
        id: period_key(period, revision),
        period: period.to_string(),
        revision,
        status: status.to_string(),
        school_name: doc["school"]["name"].as_str().unwrap_or("").to_string(),
        updated_at: meta["updatedAt"].as_str().unwrap_or("").to_string(),
        signed_at: meta["signedAt"].as_str().map(str::to_string),
    })
}

const READ_MODEL_TABLES: [&str; 7] = [
    "row_sources",
    "risk_rows",
    "answers",
    "inspections",
    "checklist_items",
    "checklists",
    "locations",
];

fn rebuild_read_model(tx: &Transaction, pid: &str, doc: &Value) -> Result<(), DbError> {
    for table in READ_MODEL_TABLES {
        tx.execute(&format!("DELETE FROM {table} WHERE period_id = ?1"), [pid])?;
    }
    for loc in items(&doc["locations"]) {
        let lid = text(loc, "id");
        tx.execute(
            "INSERT OR REPLACE INTO locations VALUES (?1, ?2, ?3, ?4)",
            params![pid, lid, opt_text(loc, "name"), opt_text(loc, "type")],
        )?;
        for row in items(&loc["rows"]) {
            insert_risk_row(tx, pid, &lid, row)?;
        }
    }
    for list in items(&doc["checklists"]) {
        insert_checklist(tx, pid, list)?;
    }
    for insp in items(&doc["inspections"]) {
        insert_inspection(tx, pid, insp)?;
    }
    Ok(())
}

fn insert_risk_row(tx: &Transaction, pid: &str, lid: &str, row: &Value) -> Result<(), DbError> {
    let rid = text(row, "id");
    tx.execute(
        "INSERT OR REPLACE INTO risk_rows VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            pid,
            lid,
            rid,
            opt_text(row, "hazard"),
            row["likelihood"].as_i64(),
            row["severity"].as_i64(),
            row["likelihoodAfter"].as_i64(),
            row["severityAfter"].as_i64(),
            opt_text(row, "status"),
            opt_text(row, "dueDate")
        ],
    )?;
    for src in items(&row["sources"]) {
        tx.execute(
            "INSERT INTO row_sources VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                pid,
                lid,
                rid,
                opt_text(src, "listId"),
                opt_text(src, "itemId"),
                opt_text(src, "locationId")
            ],
        )?;
    }
    Ok(())
}

fn insert_checklist(tx: &Transaction, pid: &str, list: &Value) -> Result<(), DbError> {
    let lid = text(list, "id");
    tx.execute(
        "INSERT OR REPLACE INTO checklists VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            pid,
            lid,
            opt_text(list, "code"),
            opt_text(list, "name"),
            opt_text(list, "source")
        ],
    )?;
    for item in items(&list["items"]) {
        tx.execute(
            "INSERT OR REPLACE INTO checklist_items VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                pid,
                lid,
                text(item, "id"),
                opt_text(item, "no"),
                opt_text(item, "text"),
                opt_text(item, "ref")
            ],
        )?;
    }
    Ok(())
}

fn insert_inspection(tx: &Transaction, pid: &str, insp: &Value) -> Result<(), DbError> {
    let iid = text(insp, "id");
    tx.execute(
        "INSERT OR REPLACE INTO inspections VALUES (?1, ?2, ?3, ?4)",
        params![
            pid,
            iid,
            opt_text(insp, "checklistId"),
            opt_text(insp, "locationId")
        ],
    )?;
    for a in items(&insp["answers"]) {
        tx.execute(
            "INSERT OR REPLACE INTO answers VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                pid,
                iid,
                text(a, "itemId"),
                opt_text(a, "answer"),
                opt_text(a, "note")
            ],
        )?;
    }
    Ok(())
}

fn items(v: &Value) -> impl Iterator<Item = &Value> {
    v.as_array().into_iter().flatten()
}

fn opt_text(v: &Value, key: &str) -> Option<String> {
    v[key].as_str().map(str::to_string)
}

/// Required key columns: a missing id becomes "" rather than failing the whole save.
fn text(v: &Value, key: &str) -> String {
    opt_text(v, key).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    const STARTER: &str = include_str!("../../src/lib/data/starter.json");

    fn mem() -> Connection {
        let mut c = Connection::open_in_memory().unwrap();
        migrate(&mut c).unwrap();
        c
    }

    fn fixture(period: &str, revision: i64, hazard: &str) -> String {
        serde_json::json!({
            "version": 3, "period": period, "assessmentDate": "", "validUntil": "",
            "meta": {"createdAt": "t", "updatedAt": "2026-01-01T00:00:00Z", "appVersion": "x",
                     "bankVersion": "", "status": "signed", "revision": revision,
                     "signedAt": "2026-02-01T00:00:00Z", "contentHash": "abc123"},
            "school": {"name": "Okul", "scope": "", "grouping": "none", "signatories": []},
            "locations": [{"id": "l1", "name": "Atölye", "type": "workshop", "building": "", "area": "",
                "rows": [{"id": "r1", "hazard": hazard, "likelihood": 3, "severity": 4,
                          "likelihoodAfter": null, "severityAfter": null, "status": "open", "dueDate": "",
                          "sources": [{"listId": "c1", "itemId": "i1", "locationId": null},
                                      {"listId": "c1", "itemId": "i2", "locationId": "l1"}]},
                         {"id": "r2", "status": "done"}]}],
            "checklists": [{"id": "c1", "code": "KL-1", "name": "Liste", "source": "external",
                "items": [{"id": "i1", "no": "1", "text": "a", "ref": "KL-1.01"}, {"id": "i2", "no": "2", "text": "b"}]}],
            "inspections": [{"id": "n1", "checklistId": "c1", "locationId": "l1",
                "answers": [{"itemId": "i1", "answer": "no", "note": "x"}]}]
        })
        .to_string()
    }

    fn count(c: &Connection, table: &str) -> i64 {
        c.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0))
            .unwrap()
    }

    #[test]
    fn migrate_sets_version_and_is_idempotent() {
        let mut c = mem();
        migrate(&mut c).unwrap();
        let v: i64 = c
            .pragma_query_value(None, "user_version", |r| r.get(0))
            .unwrap();
        assert_eq!(v, 4);
    }

    fn v2_db_with_pin(pin_hash: Option<&str>) -> Connection {
        let mut c = Connection::open_in_memory().unwrap();
        migrate_to(&mut c, 2).unwrap();
        c.execute(
            "INSERT INTO app_lock (id, pin_hash, recovery_hash, failed_count, retry_after)
             VALUES (1, ?1, 'rec', 3, '2030-01-01T00:00:00Z')",
            [pin_hash],
        )
        .unwrap();
        c
    }

    #[test]
    fn v2_pin_migrates_to_kullanici_1_and_clears_app_lock_pin() {
        let mut c = v2_db_with_pin(Some("HASH"));
        migrate(&mut c).unwrap();
        let (id, name, hash, failed): (String, String, String, i64) = c
            .query_row(
                "SELECT id, name, pin_hash, failed_count FROM users",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .unwrap();
        assert_eq!(
            (id.len(), name.as_str(), hash.as_str(), failed),
            (16, "Kullanıcı 1", "HASH", 3)
        );
        let (pin, rec, n): (Option<String>, String, i64) = c
            .query_row(
                "SELECT pin_hash, recovery_hash, failed_count FROM app_lock",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();
        assert_eq!((pin, rec.as_str(), n), (None, "rec", 0));
    }

    #[test]
    fn v4_keeps_null_pin_rows_null_and_unflagged() {
        let mut c = Connection::open_in_memory().unwrap();
        migrate_to(&mut c, 3).unwrap();
        c.execute(
            "INSERT INTO users (id, name, name_key, created_at) VALUES ('u', 'A', 'a', 'x')",
            [],
        )
        .unwrap();
        migrate(&mut c).unwrap();
        let (pin, must): (Option<String>, i64) = c
            .query_row("SELECT pin_hash, must_change_pin FROM users", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap();
        assert_eq!((pin, must), (None, 0));
    }

    #[test]
    fn v2_without_pin_creates_no_user() {
        let mut c = v2_db_with_pin(None);
        migrate(&mut c).unwrap();
        assert_eq!(count(&c, "users"), 0);
    }

    #[test]
    fn period_key_matches_ts() {
        assert_eq!(period_key(" 2026-2027 ", 2), "2026-2027#r2");
        assert_eq!(period_key("  ", 1), "adsız#r1");
    }

    #[test]
    fn save_stores_document_verbatim_and_fills_read_model() {
        let mut c = mem();
        let doc = fixture("2026-2027", 2, "h");
        let s = save(&mut c, &doc).unwrap();
        assert_eq!(s.id, "2026-2027#r2");
        assert_eq!(s.signed_at.as_deref(), Some("2026-02-01T00:00:00Z"));
        assert_eq!(load(&c, &s.id).unwrap().as_deref(), Some(doc.as_str()));
        let hash: String = c
            .query_row("SELECT content_hash FROM periods", [], |r| r.get(0))
            .unwrap();
        assert_eq!(hash, "abc123");
        assert_eq!(count(&c, "risk_rows"), 2);
        assert_eq!(count(&c, "row_sources"), 2);
        assert_eq!(count(&c, "checklist_items"), 2);
        assert_eq!(count(&c, "answers"), 1);
        let null_loc: i64 = c
            .query_row(
                "SELECT COUNT(*) FROM row_sources WHERE source_location_id IS NULL",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(null_loc, 1);
    }

    #[test]
    fn resave_replaces_read_model_without_duplicates() {
        let mut c = mem();
        save(&mut c, &fixture("p", 1, "old")).unwrap();
        save(&mut c, &fixture("p", 1, "new")).unwrap();
        assert_eq!(count(&c, "periods"), 1);
        assert_eq!(count(&c, "risk_rows"), 2);
        assert_eq!(count(&c, "row_sources"), 2);
        let h: String = c
            .query_row("SELECT hazard FROM risk_rows WHERE id = 'r1'", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(h, "new");
    }

    #[test]
    fn list_is_newest_first() {
        let mut c = mem();
        for (p, r) in [("2025-2026", 1), ("2026-2027", 1), ("2026-2027", 2)] {
            save(&mut c, &fixture(p, r, "h")).unwrap();
        }
        let ids: Vec<_> = list(&c).unwrap().into_iter().map(|s| s.id).collect();
        assert_eq!(ids, ["2026-2027#r2", "2026-2027#r1", "2025-2026#r1"]);
    }

    #[test]
    fn remove_cascades() {
        let mut c = mem();
        save(&mut c, &fixture("p", 1, "h")).unwrap();
        save(&mut c, &fixture("q", 1, "h")).unwrap();
        remove(&c, "p#r1").unwrap();
        assert_eq!(load(&c, "p#r1").unwrap(), None);
        assert_eq!(count(&c, "risk_rows"), 2);
        assert_eq!(count(&c, "locations"), 1);
    }

    #[test]
    fn rejects_invalid_documents() {
        let mut c = mem();
        assert!(save(&mut c, "not json").is_err());
        assert!(save(&mut c, r#"{"period":"p"}"#).is_err());
        assert_eq!(count(&c, "periods"), 0);
    }

    #[test]
    fn starter_read_model_matches_document() {
        let mut c = mem();
        let s = save(&mut c, STARTER).unwrap();
        let doc: Value = serde_json::from_str(STARTER).unwrap();
        let rows: usize = items(&doc["locations"])
            .map(|l| items(&l["rows"]).count())
            .sum();
        let sources: usize = items(&doc["locations"])
            .flat_map(|l| items(&l["rows"]))
            .map(|r| items(&r["sources"]).count())
            .sum();
        assert_eq!(count(&c, "risk_rows"), rows as i64);
        assert_eq!(count(&c, "row_sources"), sources as i64);
        assert_eq!(
            count(&c, "locations"),
            items(&doc["locations"]).count() as i64
        );
        assert_eq!(
            count(&c, "checklists"),
            items(&doc["checklists"]).count() as i64
        );
        assert_eq!(load(&c, &s.id).unwrap().as_deref(), Some(STARTER));
    }
}
