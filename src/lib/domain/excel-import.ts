// Excel import: template rows and sheet reading. Independent of SheetJS; sheets arrive as arrays of arrays.
// Validation is all-or-nothing: one bad row means nothing is added.
import { addLocation, addRow, emptyAssessment, LOCATION_TYPE_LABELS } from "./assessment";
import { addChecklist } from "./checklist";
import {
  applySchoolPatch,
  hasChanges,
  readSchoolSheet,
  SHEET_SCHOOL,
  schoolSheet,
} from "./school-sheet";
import type { Assessment, ChecklistTemplate, LocationType } from "./types";

export const SHEET_CHECKLIST = "Kontrol Listesi";
export const SHEET_RISK = "Risk Satırları";
export { SHEET_SCHOOL };

export type ColumnDef = readonly [key: string, header: string];
const CHECKLIST_COLUMNS: ColumnDef[] = [
  ["code", "Liste Kodu"],
  ["name", "Liste Adı"],
  ["no", "Madde No"],
  ["text", "Madde"],
];
export const RISK_COLUMNS: ColumnDef[] = [
  ["location", "Mekân"],
  ["type", "Mekân Türü"],
  ["building", "Bina"],
  ["area", "Alan"],
  ["equipment", "Alet / Ekipman Grubu"],
  ["hazard", "Tehlike ve Risk"],
  ["affected", "Etkilenen"],
  ["existingControls", "Mevcut Önlem"],
  ["action", "Düzeltici Önlem"],
  ["responsible", "Sorumlu"],
  ["likelihood", "O"],
  ["severity", "Ş"],
];
const EXAMPLE = /^ÖRNEK/i;

export type Sheets = Record<string, unknown[][]>;
export type Cells = Record<string, string>;
export type NumberedRow = { rowNo: number; cells: Cells };

export const norm = (x: unknown) =>
  String(x)
    .toLocaleLowerCase("tr")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
export const cell = (x: unknown) => (x === null || x === undefined ? "" : String(x).trim());

// Turkish label or code -> type ("Ofis / oda" and "ofis" both match).
export const TYPE_LOOKUP = new Map<string, LocationType>(
  (Object.entries(LOCATION_TYPE_LABELS) as [LocationType, string][]).flatMap(([code, label]) => [
    [norm(code), code],
    [norm(label), code],
    [norm(label.split(/[ /(]/)[0]), code],
  ]),
);

export function template(): Record<string, (string | number)[][]> {
  return {
    [SHEET_SCHOOL]: schoolSheet(emptyAssessment("")),
    [SHEET_CHECKLIST]: [
      CHECKLIST_COLUMNS.map(([, h]) => h),
      [
        "ÖRNEK: KL-26",
        "Elektrikli Tesisat ve Ekipmanlar",
        "26.01",
        "Elektrik tesisatının bakım ve onarımı yetkili kişilerce mi yapılıyor?",
      ],
    ],
    [SHEET_RISK]: [
      RISK_COLUMNS.map(([, h]) => h),
      [
        "ÖRNEK: ELE16",
        "Atölye",
        "C Blok",
        "Elektrik-Elektronik",
        "Matkap",
        "Dönen uca saç kapılması",
        "Öğrenci",
        "Talimat",
        "Siperlik, saç bonesi",
        "Atölye öğretmeni",
        3,
        4,
      ],
    ],
  };
}

/** Column positions from the header row, or an error list when headers are missing. */
export function columns(
  header: unknown[] | undefined,
  defs: ColumnDef[],
  sheet: string,
): { errors: string[] } | { positions: Record<string, number> } {
  const at = new Map((header || []).map((h, i) => [norm(cell(h)), i]));
  const missing = defs.filter(([, h]) => !at.has(norm(h))).map(([, h]) => h);
  if (missing.length)
    return { errors: [`${sheet}: başlık satırında eksik sütun: ${missing.join(", ")}.`] };
  return { positions: Object.fromEntries(defs.map(([k, h]) => [k, at.get(norm(h)) as number])) };
}

/** Data rows; blank rows and rows whose first key starts with "ÖRNEK" are skipped. */
export function dataRows(
  aoa: unknown[][],
  positions: Record<string, number>,
  firstKey: string,
): NumberedRow[] {
  return aoa
    .slice(1)
    .map((r, i) => ({
      rowNo: i + 2,
      cells: Object.fromEntries(
        Object.entries(positions).map(([k, j]) => [k, cell(r[j])]),
      ) as Cells,
    }))
    .filter(({ cells }) => Object.values(cells).some(Boolean) && !EXAMPLE.test(cells[firstKey]));
}

export function score(text: string, label: string, errors: string[]): number | null {
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isInteger(n) || n < 1 || n > 5)
    errors.push(`${label} 1-5 arası olmalı, '${text}' yazılmış.`);
  return n;
}

function readChecklists(aoa: unknown[][], errors: string[]): ChecklistTemplate[] {
  const cols = columns(aoa[0], CHECKLIST_COLUMNS, SHEET_CHECKLIST);
  if ("errors" in cols) {
    errors.push(...cols.errors);
    return [];
  }
  const groups = new Map<string, ChecklistTemplate>();
  for (const { rowNo, cells: v } of dataRows(aoa, cols.positions, "code")) {
    const fail = (m: string) => errors.push(`${SHEET_CHECKLIST}, satır ${rowNo}: ${m}`);
    if (!v.code) fail("Liste Kodu boş.");
    if (!v.text) fail("Madde boş.");
    const g = groups.get(v.code) || {
      code: v.code,
      name: "",
      source: "external" as const,
      items: [],
    };
    groups.set(v.code, {
      ...g,
      name: g.name || v.name,
      items: [...g.items, { no: v.no || String(g.items.length + 1), text: v.text }],
    });
  }
  return [...groups.values()].map((g) => ({ ...g, name: g.name || g.code }));
}

type ParsedRisk = {
  cells: Cells;
  type: LocationType | "" | undefined;
  likelihood: number | null;
  severity: number | null;
};

function readRisks(aoa: unknown[][], errors: string[]): ParsedRisk[] {
  const cols = columns(aoa[0], RISK_COLUMNS, SHEET_RISK);
  if ("errors" in cols) {
    errors.push(...cols.errors);
    return [];
  }
  return dataRows(aoa, cols.positions, "location").map(({ rowNo, cells: v }) => {
    const local: string[] = [];
    if (!v.location) local.push("Mekân boş.");
    const type = v.type ? TYPE_LOOKUP.get(norm(v.type)) : "";
    if (type === undefined) {
      local.push(
        `Mekân Türü '${v.type}' tanınmadı; Atölye, Depo, Ofis, Islak hacim ya da Ortak yazın.`,
      );
    }
    if (!v.hazard) local.push("Tehlike ve Risk boş.");
    const likelihood = score(v.likelihood, "O", local);
    const severity = score(v.severity, "Ş", local);
    errors.push(...local.map((m) => `${SHEET_RISK}, satır ${rowNo}: ${m}`));
    return { cells: v, type, likelihood, severity };
  });
}

export function findSheet(sheets: Sheets, name: string): unknown[][] | null {
  const key = Object.keys(sheets).find((k) => norm(k) === norm(name));
  return key ? sheets[key] : null;
}

/** Codes of the lists to be imported that this assessment already has. */
export function conflictingCodes(a: Assessment, sheets: Sheets): string[] {
  const aoa = findSheet(sheets, SHEET_CHECKLIST);
  if (!aoa) return [];
  const existing = new Set(a.checklists.map((l) => l.code).filter(Boolean));
  return [...new Set(readChecklists(aoa, []).map((l) => l.code))].filter((c) => existing.has(c));
}

function applyRisks(
  a: Assessment,
  risks: ParsedRisk[],
): { assessment: Assessment; newLocations: number; skippedRows: number } {
  let result = a;
  let newLocations = 0;
  let skippedRows = 0;
  const rowKey = (hazard: string, equipment: string) => `${norm(hazard)}\n${norm(equipment)}`;
  // Rows that existed before this import; duplicates inside the file itself are kept.
  const before = new Map(
    a.locations.map((l) => [l.id, l.rows.map((x) => rowKey(x.hazard, x.equipment))]),
  );
  for (const r of risks) {
    const { cells: v } = r;
    let loc = result.locations.find(
      (x) =>
        norm(x.name) === norm(v.location) &&
        norm(x.building) === norm(v.building) &&
        norm(x.area) === norm(v.area),
    );
    if (loc && before.get(loc.id)?.includes(rowKey(v.hazard, v.equipment))) {
      skippedRows += 1;
      continue;
    }
    if (!loc) {
      result = addLocation(result, {
        name: v.location,
        type: r.type || "workshop",
        building: v.building,
        area: v.area,
      });
      loc = result.locations[result.locations.length - 1];
      newLocations += 1;
    }
    result = addRow(result, loc.id, {
      equipment: v.equipment,
      hazard: v.hazard,
      affected: v.affected,
      existingControls: v.existingControls,
      action: v.action,
      responsible: v.responsible,
      likelihood: r.likelihood as never,
      severity: r.severity as never,
    });
  }
  return { assessment: result, newLocations, skippedRows };
}

export interface ImportSummary {
  lists: number;
  items: number;
  locations: number;
  /** Risk rows added (skipped duplicates not counted). */
  rows: number;
  /** Risk rows ignored because the same location + hazard + equipment already existed. */
  skippedRows: number;
  /** True when an "Okul Bilgileri" sheet was read (school info / signatories updated). */
  school: boolean;
}

/**
 * sheets: {sheetName: aoa}. opts.sameCode: 'append' (default) | 'replace'.
 * Does not mutate the input.
 */
export function read(
  a: Assessment,
  sheets: Sheets,
  opts: { sameCode?: "append" | "replace" } = {},
): { assessment: Assessment; summary: ImportSummary } | { errors: string[] } {
  const checklistAoa = findSheet(sheets, SHEET_CHECKLIST);
  const riskAoa = findSheet(sheets, SHEET_RISK);
  const schoolAoa = findSheet(sheets, SHEET_SCHOOL);
  if (!checklistAoa && !riskAoa && !schoolAoa) {
    return {
      errors: [
        `Dosyada "${SHEET_SCHOOL}", "${SHEET_CHECKLIST}" ya da "${SHEET_RISK}" adlı sayfa yok. Şablonu indirip kullanın.`,
      ],
    };
  }
  const errors: string[] = [];
  const schoolPatch = schoolAoa ? readSchoolSheet(schoolAoa, errors) : null;
  const lists = checklistAoa ? readChecklists(checklistAoa, errors) : [];
  const risks = riskAoa ? readRisks(riskAoa, errors) : [];
  if (errors.length) return { errors };

  const codes = new Set(lists.map((l) => l.code));
  const base =
    opts.sameCode === "replace"
      ? { ...a, checklists: a.checklists.filter((l) => !codes.has(l.code)) }
      : a;
  const withSchool = schoolPatch ? applySchoolPatch(base, schoolPatch) : base;
  const withLists = lists.reduce((acc, l) => addChecklist(acc, l), withSchool);
  const { assessment, newLocations, skippedRows } = applyRisks(withLists, risks);
  return {
    assessment,
    summary: {
      lists: lists.length,
      items: lists.reduce((t, l) => t + l.items.length, 0),
      locations: newLocations,
      rows: risks.length - skippedRows,
      skippedRows,
      school: schoolPatch !== null && hasChanges(schoolPatch),
    },
  };
}
