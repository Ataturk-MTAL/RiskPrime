// Reading, writing and validating the assessment file (JSON).
import { GROUPINGS, LOCATION_TYPES, STATUSES } from "./assessment";
import { ANSWERS } from "./checklist";
import { APP_VERSION, nowIso } from "./app-version";
import { migrateV1, migrateV2 } from "./file-migrate";
import { ensureInspections } from "./inspections";
import { isScore } from "./matrix";
import { SCHEMA_VERSION, type Assessment } from "./types";

const SOURCES = ["internal", "external"];

type Obj = Record<string, unknown>;
const isString = (x: unknown): x is string => typeof x === "string";
const isObject = (x: unknown): x is Obj => x !== null && typeof x === "object" && !Array.isArray(x);
const isScoreOrNull = (x: unknown) => x === null || isScore(x);

function checkStrings(obj: Obj, keys: string[], path: string, errors: string[]): void {
  for (const k of keys)
    if (!isString(obj[k])) errors.push(`${path ? `${path}.` : ""}${k}: metin olmalı.`);
}

const PERIOD_STATUSES = ["draft", "signed"];
const HEX_SHA256 = /^[0-9a-f]{64}$/;
const isIsoTime = (x: unknown) => isString(x) && x !== "" && !Number.isNaN(Date.parse(x));
const isHash = (x: unknown) => isString(x) && HEX_SHA256.test(x);

function validateMeta(o: unknown, errors: string[]): void {
  if (!isObject(o)) {
    errors.push("meta: eksik.");
    return;
  }
  for (const k of ["createdAt", "updatedAt"])
    if (!isIsoTime(o[k])) errors.push(`meta.${k}: geçerli bir tarih-saat (ISO) olmalı.`);
  checkStrings(o, ["appVersion", "bankVersion"], "meta", errors);
  if (!PERIOD_STATUSES.includes(o.status as string))
    errors.push(`meta.status: ${PERIOD_STATUSES.join(" ya da ")} olmalı.`);
  if (!Number.isInteger(o.revision) || (o.revision as number) < 1)
    errors.push("meta.revision: 1 ya da daha büyük tam sayı olmalı.");
  if (o.signedAt !== undefined && !isIsoTime(o.signedAt))
    errors.push("meta.signedAt: geçerli bir tarih-saat (ISO) olmalı.");
  for (const k of ["contentHash", "previousHash"])
    if (o[k] !== undefined && !isHash(o[k]))
      errors.push(`meta.${k}: 64 karakterlik onaltılık (SHA-256) özet olmalı.`);
  if (o.status === "signed" && (o.signedAt === undefined || o.contentHash === undefined))
    errors.push("meta: imzalı dönemde signedAt ve contentHash bulunmalı.");
}

function validateSchool(o: unknown, errors: string[]): void {
  if (!isObject(o)) {
    errors.push("school: eksik.");
    return;
  }
  checkStrings(o, ["name", "scope"], "school", errors);
  if (!GROUPINGS.includes(o.grouping as never)) {
    errors.push(`school.grouping: ${GROUPINGS.join(", ")} değerlerinden biri olmalı.`);
  }
  if (!Array.isArray(o.signatories)) {
    errors.push("school.signatories: liste olmalı.");
    return;
  }
  o.signatories.forEach((x, i) => {
    if (!isObject(x) || !isString(x.title) || !isString(x.name)) {
      errors.push(`school.signatories[${i}]: title ve name metin olmalı.`);
    }
  });
}

function validateRow(r: unknown, path: string, errors: string[]): void {
  if (!isObject(r)) {
    errors.push(`${path}: nesne olmalı.`);
    return;
  }
  checkStrings(
    r,
    [
      "id",
      "equipment",
      "hazard",
      "affected",
      "existingControls",
      "action",
      "responsible",
      "dueDate",
    ],
    path,
    errors,
  );
  for (const k of ["likelihood", "severity", "likelihoodAfter", "severityAfter"]) {
    if (!isScoreOrNull(r[k])) errors.push(`${path}.${k}: 1-5 arası tam sayı ya da boş olmalı.`);
  }
  if (!STATUSES.includes(r.status as never))
    errors.push(`${path}.status: ${STATUSES.join(" ya da ")} olmalı.`);
  const list = r.sources;
  if (list !== undefined && !(Array.isArray(list) && list.every(isSourceRef)))
    errors.push(
      `${path}.sources: her kayıt için listId, itemId metin; locationId metin ya da null olmalı.`,
    );
}

const isSourceRef = (s: unknown) =>
  isObject(s) &&
  isString(s.listId) &&
  isString(s.itemId) &&
  (s.locationId === null || isString(s.locationId));

function validateInspection(x: unknown, path: string, errors: string[]): void {
  if (!isObject(x)) {
    errors.push(`${path}: nesne olmalı.`);
    return;
  }
  checkStrings(x, ["id", "checklistId"], path, errors);
  if (x.locationId !== null && !isString(x.locationId))
    errors.push(`${path}.locationId: metin ya da null olmalı.`);
  if (!Array.isArray(x.answers)) {
    errors.push(`${path}.answers: liste olmalı.`);
    return;
  }
  x.answers.forEach((r, j) => {
    const p = `${path}.answers[${j}]`;
    if (!isObject(r)) {
      errors.push(`${p}: nesne olmalı.`);
      return;
    }
    checkStrings(r, ["itemId", "note"], p, errors);
    if (!ANSWERS.includes(r.answer as never))
      errors.push(`${p}.answer: yes, no, na ya da boş olmalı.`);
  });
}

function validateLocation(l: unknown, path: string, errors: string[]): void {
  if (!isObject(l)) {
    errors.push(`${path}: nesne olmalı.`);
    return;
  }
  checkStrings(l, ["id", "name", "building", "area"], path, errors);
  if (!LOCATION_TYPES.includes(l.type as never)) {
    errors.push(`${path}.type: ${LOCATION_TYPES.join(", ")} değerlerinden biri olmalı.`);
  }
  if (!Array.isArray(l.rows)) {
    errors.push(`${path}.rows: liste olmalı.`);
    return;
  }
  l.rows.forEach((r, j) => validateRow(r, `${path}.rows[${j}]`, errors));
}

function validateChecklist(l: unknown, path: string, errors: string[]): void {
  if (!isObject(l)) {
    errors.push(`${path}: nesne olmalı.`);
    return;
  }
  checkStrings(l, ["id", "code", "name"], path, errors);
  if (!SOURCES.includes(l.source as string))
    errors.push(`${path}.source: internal ya da external olmalı.`);
  const ids = l.locationIds;
  if (ids !== undefined && !(Array.isArray(ids) && ids.every(isString)))
    errors.push(`${path}.locationIds: metin listesi olmalı.`);
  if (!Array.isArray(l.items)) {
    errors.push(`${path}.items: liste olmalı.`);
    return;
  }
  l.items.forEach((x, j) => {
    const p = `${path}.items[${j}]`;
    if (!isObject(x)) {
      errors.push(`${p}: nesne olmalı.`);
      return;
    }
    checkStrings(x, ["id", "no", "text"], p, errors);
    if (x.ref !== undefined && !isString(x.ref)) errors.push(`${p}.ref: metin olmalı.`);
  });
}

/** Returns a list of errors; an empty list means the file is valid. */
export function validate(value: unknown): string[] {
  if (!isObject(value)) return ["Dosya bir değerlendirme nesnesi değil."];
  if (Number.isInteger(value.version) && (value.version as number) > SCHEMA_VERSION) {
    return [
      `Bu dosya daha yeni bir RiskPrime sürümüyle oluşturulmuş (sürüm ${value.version}). Sayfanın güncel sürümünü kullanın.`,
    ];
  }
  const errors: string[] = [];
  if (value.version !== SCHEMA_VERSION) errors.push(`version: ${SCHEMA_VERSION} olmalı.`);
  checkStrings(value, ["period", "assessmentDate", "validUntil"], "", errors);
  validateMeta(value.meta, errors);
  validateSchool(value.school, errors);
  if (!Array.isArray(value.locations)) errors.push("locations: liste olmalı.");
  else value.locations.forEach((l, i) => validateLocation(l, `locations[${i}]`, errors));
  if (!Array.isArray(value.checklists)) errors.push("checklists: liste olmalı.");
  else value.checklists.forEach((l, i) => validateChecklist(l, `checklists[${i}]`, errors));
  if (!Array.isArray(value.inspections)) errors.push("inspections: liste olmalı.");
  else value.inspections.forEach((x, i) => validateInspection(x, `inspections[${i}]`, errors));
  return errors;
}

export interface ParseOptions {
  /** Clock for the meta of migrated files. */
  now?: () => string;
  /** Version recorded in the meta of migrated files. */
  appVersion?: string;
}

export function parse(
  text: string,
  { now = nowIso, appVersion = APP_VERSION }: ParseOptions = {},
): { assessment: Assessment } | { errors: string[] } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { errors: ["Dosya okunamadı: geçerli bir JSON değil."] };
  }
  // Older files are upgraded step by step (1 -> 2 -> 3); ensureInspections then completes the
  // inspections of every other location and drops anything that no longer matches the lists.
  const v2 = isObject(value) && value.version === 1 ? migrateV1(value) : value;
  const current = isObject(v2) && v2.version === 2 ? migrateV2(v2, now(), appVersion) : v2;
  const errors = validate(current);
  return errors.length ? { errors } : { assessment: ensureInspections(current as Assessment) };
}

export function serialize(a: Assessment): string {
  return `${JSON.stringify(a, null, 2)}\n`;
}

// Turkish letters and their ASCII stand-ins, position by position.
const TURKISH_LETTERS = "çğıöşüÇĞİÖŞÜ";
const ASCII_LETTERS = "cgiosuCGIOSU";

export function fileName(a: Assessment): string {
  const ascii = (a.period || "").replace(
    /[çğıöşüÇĞİÖŞÜ]/g,
    (c) => ASCII_LETTERS[TURKISH_LETTERS.indexOf(c)],
  );
  const period = ascii.replace(/[^0-9A-Za-z-]+/g, "-").replace(/^-+|-+$/g, "");
  return `risk-${period || "degerlendirme"}.json`;
}
