// Reading, writing and validating the assessment file (JSON).
import { GROUPINGS, LOCATION_TYPES, STATUSES } from "./assessment";
import { ANSWERS } from "./checklist";
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
    checkStrings(x, ["id", "no", "text", "note"], p, errors);
    if (!ANSWERS.includes(x.answer as never))
      errors.push(`${p}.answer: yes, no, na ya da boş olmalı.`);
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
  validateSchool(value.school, errors);
  if (!Array.isArray(value.locations)) errors.push("locations: liste olmalı.");
  else value.locations.forEach((l, i) => validateLocation(l, `locations[${i}]`, errors));
  if (!Array.isArray(value.checklists)) errors.push("checklists: liste olmalı.");
  else value.checklists.forEach((l, i) => validateChecklist(l, `checklists[${i}]`, errors));
  return errors;
}

export function parse(text: string): { assessment: Assessment } | { errors: string[] } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { errors: ["Dosya okunamadı: geçerli bir JSON değil."] };
  }
  const errors = validate(value);
  return errors.length ? { errors } : { assessment: value as Assessment };
}

export function serialize(a: Assessment): string {
  return `${JSON.stringify(a, null, 2)}\n`;
}

const TURKISH_ASCII: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "C",
  Ğ: "G",
  İ: "I",
  Ö: "O",
  Ş: "S",
  Ü: "U",
};

export function fileName(a: Assessment): string {
  const ascii = (a.period || "").replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TURKISH_ASCII[c]);
  const period = ascii.replace(/[^0-9A-Za-z-]+/g, "-").replace(/^-+|-+$/g, "");
  return `risk-${period || "degerlendirme"}.json`;
}
