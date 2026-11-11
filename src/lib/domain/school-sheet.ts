// "Okul Bilgileri" Excel sheet: school, period, dates, grouping and signatories.
// Layout: a "Bilgi | Değer" block, then an "İmzacı Unvanı | Ad Soyad" block.
import type { Assessment, Grouping, Signatory } from "./types";

export const SHEET_SCHOOL = "Okul Bilgileri";

type Field = "name" | "scope" | "grouping" | "period" | "assessmentDate" | "validUntil";
const FIELDS: readonly (readonly [Field, string])[] = [
  ["name", "Okul"],
  ["scope", "Kapsam"],
  ["period", "Dönem"],
  ["assessmentDate", "Değerlendirme Tarihi"],
  ["validUntil", "Geçerlilik Tarihi"],
  ["grouping", "Gruplama"],
];
const GROUPING_LABELS: Record<Grouping, string> = {
  area: "Alana göre",
  building: "Binaya göre",
  none: "Gruplama yok",
};
const INFO_HEADER = ["Bilgi", "Değer"];
const SIGNATORY_HEADER = ["İmzacı Unvanı", "Ad Soyad"];

const norm = (x: unknown) =>
  (typeof x === "string" ? x : "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
const text = (x: unknown) =>
  typeof x === "string" || typeof x === "number" ? String(x).trim() : "";

const FIELD_BY_LABEL = new Map(FIELDS.map(([key, label]) => [norm(label), key]));
const GROUPING_LOOKUP = new Map<string, Grouping>(
  (Object.entries(GROUPING_LABELS) as [Grouping, string][]).flatMap(([code, label]) => [
    [norm(code), code],
    [norm(label), code],
  ]),
);

/** Sheet rows for the current assessment (template and Excel export). */
export function schoolSheet(a: Assessment): string[][] {
  const values: Record<Field, string> = {
    name: a.school.name,
    scope: a.school.scope,
    grouping: GROUPING_LABELS[a.school.grouping],
    period: a.period,
    assessmentDate: a.assessmentDate,
    validUntil: a.validUntil,
  };
  return [
    INFO_HEADER,
    ...FIELDS.map(([key, label]) => [label, values[key]]),
    [],
    SIGNATORY_HEADER,
    ...a.school.signatories.map((s) => [s.title, s.name]),
  ];
}

export interface SchoolPatch {
  school: Partial<{ name: string; scope: string; grouping: Grouping }>;
  meta: Partial<{ period: string; assessmentDate: string; validUntil: string }>;
  /** null when the sheet has no signatory rows (keep the current list). */
  signatories: Signatory[] | null;
}

function readInfoRow(
  patch: SchoolPatch,
  label: string,
  value: string,
  fail: (m: string) => void,
): void {
  const field = FIELD_BY_LABEL.get(norm(label));
  if (!field) return fail(`'${label}' tanınmadı.`);
  if (!value) return;
  if (field === "grouping") {
    const grouping = GROUPING_LOOKUP.get(norm(value));
    if (grouping) patch.school.grouping = grouping;
    else fail(`Gruplama '${value}' tanınmadı; Alana göre, Binaya göre ya da Gruplama yok yazın.`);
  } else if (field === "name" || field === "scope") {
    patch.school[field] = value;
  } else {
    patch.meta[field] = value;
  }
}

/** Reads the sheet; empty values leave the current value unchanged. Errors carry row numbers. */
export function readSchoolSheet(aoa: unknown[][], errors: string[]): SchoolPatch {
  const patch: SchoolPatch = { school: {}, meta: {}, signatories: null };
  const signatories: Signatory[] = [];
  let inSignatories = false;
  aoa.forEach((row, i) => {
    const [first, second] = [text(row?.[0]), text(row?.[1])];
    if (!first && !second) return;
    if (norm(first) === norm(INFO_HEADER[0])) return;
    if (norm(first) === norm(SIGNATORY_HEADER[0])) {
      inSignatories = true;
      return;
    }
    if (inSignatories) {
      if (first) signatories.push({ title: first, name: second });
      return;
    }
    readInfoRow(patch, first, second, (m) => errors.push(`${SHEET_SCHOOL}, satır ${i + 1}: ${m}`));
  });
  // A list of titles without any names is an unfilled template: keep the current signatories.
  if (signatories.some((s) => s.name)) patch.signatories = signatories;
  return patch;
}

/** True when the sheet actually changes something (an empty template changes nothing). */
export function hasChanges(patch: SchoolPatch): boolean {
  return (
    Object.keys(patch.school).length > 0 ||
    Object.keys(patch.meta).length > 0 ||
    patch.signatories !== null
  );
}

/** Applies a parsed patch; returns a new assessment. */
export function applySchoolPatch(a: Assessment, patch: SchoolPatch): Assessment {
  return {
    ...a,
    ...patch.meta,
    school: {
      ...a.school,
      ...patch.school,
      signatories: patch.signatories ?? a.school.signatories,
    },
  };
}
