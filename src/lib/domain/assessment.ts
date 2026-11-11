// Immutable operations on an Assessment. Every function returns a new copy and never mutates its input.
import { parseTrDate, toIso } from "./date";
import { isScore } from "./matrix";
import {
  SCHEMA_VERSION,
  type Assessment,
  type Checklist,
  type Grouping,
  type Location,
  type LocationTemplate,
  type LocationType,
  type RiskRow,
  type RowStatus,
  type RowTemplate,
  type School,
  type Signatory,
} from "./types";

export const LOCATION_TYPES: LocationType[] = ["workshop", "storage", "office", "wet", "common"];
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  workshop: "Atölye",
  storage: "Depo",
  office: "Ofis / oda",
  wet: "Islak hacim",
  common: "Ortak (tüm mekânlar)",
};
export const GROUPINGS: Grouping[] = ["area", "building", "none"];
export const STATUSES: RowStatus[] = ["open", "done"];
export const STATUS_LABELS: Record<RowStatus, string> = { open: "Açık", done: "Tamam" };
export const DEFAULT_SIGNATORY_TITLES: string[] = [
  "İş Güvenliği Uzmanı",
  "Çalışan Temsilcisi",
  "Destek Elemanı",
  "Alan Şefi",
  "İşveren / Okul Müdürü",
];

const META_KEYS = ["period", "assessmentDate", "validUntil"] as const;
const SCHOOL_KEYS = ["name", "scope", "grouping"] as const;
const SIGNATORY_KEYS = ["title", "name"] as const;
const LOCATION_KEYS = ["name", "type", "building", "area"] as const;
const ROW_KEYS = [
  "equipment",
  "hazard",
  "affected",
  "existingControls",
  "likelihood",
  "severity",
  "action",
  "responsible",
  "dueDate",
  "status",
  "likelihoodAfter",
  "severityAfter",
  "sources",
] as const;
const SCORE_KEYS = ["likelihood", "severity", "likelihoodAfter", "severityAfter"] as const;

export function newId(prefix: string): string {
  const c = globalThis.crypto;
  const body =
    c && typeof c.randomUUID === "function"
      ? c.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  return `${prefix}-${body}`;
}

/** Copies only the allowed keys that are present in `source`. */
export function pick<T extends object>(source: object, keys: readonly string[]): Partial<T> {
  const src = source as Record<string, unknown>;
  return Object.fromEntries(keys.filter((k) => k in src).map((k) => [k, src[k]])) as Partial<T>;
}

export function emptyAssessment(period = ""): Assessment {
  return {
    version: SCHEMA_VERSION,
    period,
    assessmentDate: "",
    validUntil: "",
    school: {
      name: "",
      scope: "",
      grouping: "area",
      signatories: DEFAULT_SIGNATORY_TITLES.map((title) => ({ title, name: "" })),
    },
    locations: [],
    checklists: [],
  };
}

export function emptyRow(id?: string): RiskRow {
  return {
    id: id || newId("r"),
    equipment: "",
    hazard: "",
    affected: "",
    existingControls: "",
    likelihood: null,
    severity: null,
    action: "",
    responsible: "",
    dueDate: "",
    status: "open",
    likelihoodAfter: null,
    severityAfter: null,
  };
}

export function updateMeta(
  a: Assessment,
  patch: Partial<Pick<Assessment, "period" | "assessmentDate" | "validUntil">>,
): Assessment {
  return { ...a, ...pick<Assessment>(patch, META_KEYS) };
}

export function updateSchool(
  a: Assessment,
  patch: Partial<Pick<School, "name" | "scope" | "grouping">>,
): Assessment {
  const next = pick<School>(patch, SCHOOL_KEYS);
  if (next.grouping !== undefined && !GROUPINGS.includes(next.grouping)) {
    throw new Error(`Geçersiz gruplama: ${next.grouping}`);
  }
  return { ...a, school: { ...a.school, ...next } };
}

function mapSignatories(a: Assessment, fn: (list: Signatory[]) => Signatory[]): Assessment {
  return { ...a, school: { ...a.school, signatories: fn(a.school.signatories) } };
}

function assertSignatoryIndex(list: Signatory[], index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    throw new Error(`İmzacı bulunamadı: ${index}`);
  }
}

export function addSignatory(a: Assessment, title = ""): Assessment {
  return mapSignatories(a, (list) => [...list, { title, name: "" }]);
}

export function updateSignatory(
  a: Assessment,
  index: number,
  patch: Partial<Signatory>,
): Assessment {
  return mapSignatories(a, (list) => {
    assertSignatoryIndex(list, index);
    return list.map((s, i) =>
      i === index ? { ...s, ...pick<Signatory>(patch, SIGNATORY_KEYS) } : s,
    );
  });
}

export function removeSignatory(a: Assessment, index: number): Assessment {
  return mapSignatories(a, (list) => {
    assertSignatoryIndex(list, index);
    return list.filter((_, i) => i !== index);
  });
}

function findLocation(a: Assessment, id: string): Location {
  const found = a.locations.find((l) => l.id === id);
  if (!found) throw new Error(`Mekân bulunamadı: ${id}`);
  return found;
}

function assertLocationType(type: unknown): void {
  if (!LOCATION_TYPES.includes(type as LocationType))
    throw new Error(`Geçersiz mekân türü: ${String(type)}`);
}

export function addLocation(
  a: Assessment,
  input: Partial<Omit<Location, "rows">> = {},
): Assessment {
  const type = input.type || "workshop";
  assertLocationType(type);
  const location: Location = {
    id: input.id || newId("a"),
    name: (input.name || "").trim() || "Yeni mekân",
    type,
    building: (input.building || "").trim(),
    area: (input.area || "").trim(),
    rows: [],
  };
  return { ...a, locations: [...a.locations, location] };
}

export function updateLocation(
  a: Assessment,
  id: string,
  patch: Partial<Pick<Location, "name" | "type" | "building" | "area">>,
): Assessment {
  findLocation(a, id);
  const next = pick<Location>(patch, LOCATION_KEYS);
  if ("type" in next) assertLocationType(next.type);
  return { ...a, locations: a.locations.map((l) => (l.id === id ? { ...l, ...next } : l)) };
}

/** Drops a location id from a list's locationIds (the key goes away when nothing is left). */
function withoutLocation(c: Checklist, id: string): Checklist {
  if (!c.locationIds?.includes(id)) return c;
  const { locationIds, ...rest } = c;
  const left = locationIds.filter((x) => x !== id);
  return left.length ? { ...rest, locationIds: left } : rest;
}

export function removeLocation(a: Assessment, id: string): Assessment {
  findLocation(a, id);
  return {
    ...a,
    locations: a.locations.filter((l) => l.id !== id),
    checklists: a.checklists.map((c) => withoutLocation(c, id)),
  };
}

/** Group key of a location under school.grouping (same buckets as grouped()). */
function groupKey(a: Assessment, l: Location): string {
  const key = a.school.grouping;
  return key === "none" ? "" : l[key] || "(Belirtilmemiş)";
}

/** Id of the previous (-1) / next (+1) location in the same group, or null. */
export function groupNeighbourId(a: Assessment, id: string, dir: -1 | 1): string | null {
  const i = a.locations.findIndex((l) => l.id === id);
  if (i < 0) throw new Error(`Mekân bulunamadı: ${id}`);
  const key = groupKey(a, a.locations[i]);
  const peers = a.locations.filter((l) => groupKey(a, l) === key);
  return peers[peers.findIndex((l) => l.id === id) + dir]?.id ?? null;
}

/** dir: -1 up, +1 down within the location's group. Returns the same object at the group edge. */
export function moveLocation(a: Assessment, id: string, dir: -1 | 1): Assessment {
  const otherId = groupNeighbourId(a, id, dir);
  if (otherId === null) return a;
  const i = a.locations.findIndex((l) => l.id === id);
  const j = a.locations.findIndex((l) => l.id === otherId);
  const next = [...a.locations];
  [next[i], next[j]] = [next[j], next[i]];
  return { ...a, locations: next };
}

function assertRowValues(patch: Record<string, unknown>): void {
  for (const k of SCORE_KEYS) {
    if (k in patch && patch[k] !== null && !isScore(patch[k])) {
      throw new Error(`${k} 1-5 arası tam sayı ya da boş olmalı: ${String(patch[k])}`);
    }
  }
  if ("status" in patch && !STATUSES.includes(patch.status as RowStatus)) {
    throw new Error(`Geçersiz durum: ${String(patch.status)}`);
  }
}

function mapRows(
  a: Assessment,
  locationId: string,
  fn: (rows: RiskRow[]) => RiskRow[],
): Assessment {
  findLocation(a, locationId);
  return {
    ...a,
    locations: a.locations.map((l) => (l.id === locationId ? { ...l, rows: fn(l.rows) } : l)),
  };
}

function assertRowExists(rows: RiskRow[], rowId: string): void {
  if (!rows.some((r) => r.id === rowId)) throw new Error(`Satır bulunamadı: ${rowId}`);
}

export function addRow(
  a: Assessment,
  locationId: string,
  input: RowTemplate & { id?: string } = {},
): Assessment {
  const values = pick<RiskRow>(input, ROW_KEYS);
  assertRowValues(values);
  const row: RiskRow = { ...emptyRow(input.id), ...values };
  return mapRows(a, locationId, (rows) => [...rows, row]);
}

export function updateRow(
  a: Assessment,
  locationId: string,
  rowId: string,
  patch: Partial<Omit<RiskRow, "id">>,
): Assessment {
  const values = pick<RiskRow>(patch, ROW_KEYS);
  assertRowValues(values);
  return mapRows(a, locationId, (rows) => {
    assertRowExists(rows, rowId);
    return rows.map((r) => (r.id === rowId ? { ...r, ...values } : r));
  });
}

export function removeRow(a: Assessment, locationId: string, rowId: string): Assessment {
  return mapRows(a, locationId, (rows) => {
    assertRowExists(rows, rowId);
    return rows.filter((r) => r.id !== rowId);
  });
}

/** Adds a library location with its rows, under new ids. */
export function addLocationFromTemplate(a: Assessment, tpl: LocationTemplate): Assessment {
  const id = newId("a");
  const withLocation = addLocation(a, { ...tpl, id });
  return (tpl.rows || []).reduce((acc, row) => addRow(acc, id, row), withLocation);
}

/** Distinct building or area labels used by locations, sorted. */
export function labels(a: Assessment, key: "building" | "area"): string[] {
  const set = new Set(a.locations.map((l) => l[key]).filter(Boolean));
  return [...set].sort((x, y) => x.localeCompare(y, "tr"));
}

/** Location groups following school.grouping; order follows location order. */
export function grouped(a: Assessment): { title: string; locations: Location[] }[] {
  const key = a.school.grouping;
  if (key === "none") return [{ title: "", locations: a.locations }];
  const groups = new Map<string, Location[]>();
  for (const l of a.locations) {
    const title = groupKey(a, l);
    groups.set(title, [...(groups.get(title) || []), l]);
  }
  return [...groups].map(([title, locations]) => ({ title, locations }));
}

/** Copy of a row (fresh id) placed right after the original. */
export function duplicateRow(
  a: Assessment,
  locationId: string,
  rowId: string,
  newRowId?: string,
): Assessment {
  return mapRows(a, locationId, (rows) => {
    assertRowExists(rows, rowId);
    return rows.flatMap((r) => (r.id === rowId ? [r, { ...r, id: newRowId || newId("r") }] : [r]));
  });
}

/** Copy of a location with all rows under new ids, named "<name> (kopya)", placed right after it. */
export function duplicateLocation(a: Assessment, id: string, newLocationId?: string): Assessment {
  const source = findLocation(a, id);
  const copy: Location = {
    ...source,
    id: newLocationId || newId("a"),
    name: `${source.name} (kopya)`,
    rows: source.rows.map((r) => ({ ...r, id: newId("r") })),
  };
  return {
    ...a,
    locations: a.locations.flatMap((l) => (l.id === id ? [l, copy] : [l])),
    checklists: a.checklists.map((c) =>
      c.locationIds?.includes(id) ? { ...c, locationIds: [...c.locationIds, copy.id] } : c,
    ),
  };
}

/** True for an open row whose due date (DD.MM.YYYY) is before `today` (injected for tests). */
export function isOverdue(row: RiskRow, today: Date): boolean {
  if (row.status !== "open") return false;
  const due = parseTrDate(row.dueDate);
  if (!due) return false;
  const now = toIso({ y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() });
  return toIso(due) < now;
}

export type RowFilter = "all" | "unscored" | "open" | "overdue";
export const ROW_FILTERS: RowFilter[] = ["all", "unscored", "open", "overdue"];
export const ROW_FILTER_LABELS: Record<RowFilter, string> = {
  all: "Tümü",
  unscored: "Puansız",
  open: "Açık",
  overdue: "Süresi geçmiş",
};

/** Rows matching a text query and a status filter, each with its original 1-based number. */
export function filterRows(
  rows: RiskRow[],
  query: string,
  filter: RowFilter,
  today: Date,
): { row: RiskRow; number: number }[] {
  const q = query.trim().toLocaleLowerCase("tr");
  const matchesFilter = (r: RiskRow) =>
    filter === "all" ||
    (filter === "unscored" && !(isScore(r.likelihood) && isScore(r.severity))) ||
    (filter === "open" && r.status === "open") ||
    (filter === "overdue" && isOverdue(r, today));
  const matchesText = (r: RiskRow) =>
    !q ||
    [r.equipment, r.hazard, r.action, r.responsible].some((t) =>
      t.toLocaleLowerCase("tr").includes(q),
    );
  return rows
    .map((row, i) => ({ row, number: i + 1 }))
    .filter(({ row }) => matchesFilter(row) && matchesText(row));
}
