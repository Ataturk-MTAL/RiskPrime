// Excel backup: the whole assessment as a workbook that "Dosya aç" restores completely.
// Not preserved: ids (regenerated on restore). Everything else round-trips.
import {
  emptyAssessment,
  emptyRow,
  LOCATION_TYPE_LABELS,
  newId,
  STATUS_LABELS,
} from "./assessment";
import {
  cell,
  columns,
  dataRows,
  norm,
  RISK_COLUMNS,
  score,
  SHEET_CHECKLIST,
  SHEET_RISK,
  TYPE_LOOKUP,
  type ColumnDef,
  type Sheets,
} from "./excel-import";
import {
  checklistSheet,
  inspectionsOf,
  keyColumn,
  LOCATION_KEY_HEADER,
  lookup,
  optionalColumn,
  readLists,
  resolveRef,
  sourceRef,
  type KeyedList,
} from "./excel-backup-lists";
import { metaRows, readMeta } from "./excel-backup-meta";
import { validate } from "./file";
import { ensureInspections } from "./inspections";
import { riskLevel, riskScore } from "./matrix";
import { applySchoolPatch, readSchoolSheet, SHEET_SCHOOL, schoolSheet } from "./school-sheet";
import {
  SCHEMA_VERSION,
  type Assessment,
  type Checklist,
  type Location,
  type LocationType,
  type RiskRow,
  type RiskSource,
  type RowStatus,
  type Score,
} from "./types";

export const SHEET_MARKER = "RiskPrime";
export const SHEET_LOCATIONS = "Mekânlar";
const MARKER_VALUE = "RiskPrime kayıt dosyası";
const NOTE =
  'Bu dosya RiskPrime\'da "Dosya aç" ile tam olarak geri yüklenir. Sayfa ve sütun adlarını değiştirmeyin.';

type Table = (string | number)[][];

const LOCATION_COLUMNS: ColumnDef[] = [
  ["location", "Mekân"],
  ["type", "Mekân Türü"],
  ["building", "Bina"],
  ["area", "Alan"],
];
// Restorable risk columns: the import columns plus the follow-up fields.
const BACKUP_RISK_COLUMNS: ColumnDef[] = [
  ...RISK_COLUMNS,
  ["dueDate", "Bitiş"],
  ["status", "Durum"],
  ["likelihoodAfter", "O (önlem sonrası)"],
  ["severityAfter", "Ş (önlem sonrası)"],
];
// Read-only columns for people reading the sheet in Excel; ignored on restore.
const COMPUTED_HEADERS = ["Skor", "Düzey", "Skor (önlem sonrası)", "Düzey (önlem sonrası)"];
// Optional last column of "Mekânlar" and "Risk Satırları": ties a row to its location even when
// names repeat (header LOCATION_KEY_HEADER). Older backups lack it; those are matched by name.
// Optional last column of "Risk Satırları": "<Liste No>/<Madde No>@<Mekân No>" of the checklist item (in
// that location's inspection) the row came from; see sourceRef.
const SOURCE_HEADER = "Kaynak Madde";

const STATUS_LOOKUP = lookup(STATUS_LABELS, [[norm("Tamamlandı"), "done"]]);
const SOURCE_SEPARATOR = "; ";

/** All of a row's source refs joined with "; " (dangling ones skipped). */
const sourceRefs = (a: Assessment, r: RiskRow) =>
  (r.sources ?? [])
    .map((s) => sourceRef(a, s))
    .filter(Boolean)
    .join(SOURCE_SEPARATOR);

const orBlank = (n: number | null) => (n === null ? "" : n);

function riskSheet(a: Assessment): Table {
  const header = [
    ...BACKUP_RISK_COLUMNS.map(([, h]) => h),
    ...COMPUTED_HEADERS,
    LOCATION_KEY_HEADER,
    SOURCE_HEADER,
  ];
  const rows = a.locations.flatMap((l, locationIndex) =>
    l.rows.map((r) => {
      const level = (x: ReturnType<typeof riskLevel>) => x?.label ?? "";
      return [
        l.name,
        LOCATION_TYPE_LABELS[l.type],
        l.building,
        l.area,
        r.equipment,
        r.hazard,
        r.affected,
        r.existingControls,
        r.action,
        r.responsible,
        orBlank(r.likelihood),
        orBlank(r.severity),
        r.dueDate,
        STATUS_LABELS[r.status],
        orBlank(r.likelihoodAfter),
        orBlank(r.severityAfter),
        orBlank(riskScore(r.likelihood, r.severity)),
        level(riskLevel(r.likelihood, r.severity)),
        orBlank(riskScore(r.likelihoodAfter, r.severityAfter)),
        level(riskLevel(r.likelihoodAfter, r.severityAfter)),
        locationIndex + 1,
        sourceRefs(a, r),
      ];
    }),
  );
  return [header, ...rows];
}

/** All backup sheets in file order. */
export function backupSheets(a: Assessment): Record<string, Table> {
  return {
    [SHEET_MARKER]: [
      ["Biçim", MARKER_VALUE],
      ["Sürüm", SCHEMA_VERSION],
      ["Not", NOTE],
      ...metaRows(a),
    ],
    [SHEET_SCHOOL]: schoolSheet(a),
    [SHEET_LOCATIONS]: [
      [...LOCATION_COLUMNS.map(([, h]) => h), LOCATION_KEY_HEADER],
      ...a.locations.map((l, i) => [
        l.name,
        LOCATION_TYPE_LABELS[l.type],
        l.building,
        l.area,
        i + 1,
      ]),
    ],
    [SHEET_RISK]: riskSheet(a),
    [SHEET_CHECKLIST]: checklistSheet(a),
  };
}

export function isBackup(sheets: Sheets): boolean {
  const key = Object.keys(sheets).find((k) => norm(k) === norm(SHEET_MARKER));
  return !!key && sheets[key].some((r) => cell(r[1]) === MARKER_VALUE);
}

function sheet(sheets: Sheets, name: string, errors: string[]): unknown[][] {
  const key = Object.keys(sheets).find((k) => norm(k) === norm(name));
  if (!key) errors.push(`"${name}" sayfası yok; kayıt dosyası eksik ya da değiştirilmiş.`);
  return key ? sheets[key] : [];
}

type KeyedLocation = { key: string; location: Location };

function readLocations(aoa: unknown[][], errors: string[]): KeyedLocation[] {
  const cols = columns(aoa[0], LOCATION_COLUMNS, SHEET_LOCATIONS);
  if ("errors" in cols) {
    errors.push(...cols.errors);
    return [];
  }
  const keyAt = keyColumn(aoa[0]);
  return dataRows(aoa, cols.positions, "location").flatMap(({ rowNo, cells: v }) => {
    const type = TYPE_LOOKUP.get(norm(v.type));
    if (!type) errors.push(`${SHEET_LOCATIONS}, satır ${rowNo}: Mekân Türü '${v.type}' tanınmadı.`);
    return type
      ? [
          {
            key: keyAt < 0 ? "" : cell(aoa[rowNo - 1][keyAt]),
            location: {
              id: newId("a"),
              name: v.location,
              type: type as LocationType,
              building: v.building,
              area: v.area,
              rows: [],
            },
          },
        ]
      : [];
  });
}

/** Attaches risk rows to their locations (by key column, else by name), in sheet order. */
function readRiskRows(
  aoa: unknown[][],
  keyed: KeyedLocation[],
  errors: string[],
): { locations: Location[]; refs: Map<string, { ref: string; rowNo: number }> } {
  const locations = keyed.map((k) => k.location);
  const refs = new Map<string, { ref: string; rowNo: number }>();
  const cols = columns(aoa[0], BACKUP_RISK_COLUMNS, SHEET_RISK);
  if ("errors" in cols) {
    errors.push(...cols.errors);
    return { locations, refs };
  }
  const keyAt = keyColumn(aoa[0]);
  const sourceAt = optionalColumn(aoa[0], SOURCE_HEADER);
  const rowsByName = new Map<string, Location["rows"]>();
  for (const { rowNo, cells: v } of dataRows(aoa, cols.positions, "location")) {
    const local: string[] = [];
    const key = keyAt < 0 ? "" : cell(aoa[rowNo - 1][keyAt]);
    const location = (
      key
        ? keyed.find((k) => k.key === key)
        : keyed.find((k) => norm(k.location.name) === norm(v.location))
    )?.location;
    if (!location) local.push(`Mekân '${v.location}' "${SHEET_LOCATIONS}" sayfasında yok.`);
    const status = v.status ? STATUS_LOOKUP.get(norm(v.status)) : "open";
    if (!status) local.push(`Durum '${v.status}' tanınmadı; Açık ya da Tamam yazın.`);
    const [likelihood, severity, likelihoodAfter, severityAfter] = [
      score(v.likelihood, "O", local),
      score(v.severity, "Ş", local),
      score(v.likelihoodAfter, "O (önlem sonrası)", local),
      score(v.severityAfter, "Ş (önlem sonrası)", local),
    ];
    errors.push(...local.map((m) => `${SHEET_RISK}, satır ${rowNo}: ${m}`));
    if (local.length || !location) continue;
    const row: RiskRow = {
      ...emptyRow(),
      equipment: v.equipment,
      hazard: v.hazard,
      affected: v.affected,
      existingControls: v.existingControls,
      action: v.action,
      responsible: v.responsible,
      dueDate: v.dueDate,
      status: status as RowStatus,
      likelihood: likelihood as Score | null,
      severity: severity as Score | null,
      likelihoodAfter: likelihoodAfter as Score | null,
      severityAfter: severityAfter as Score | null,
    };
    rowsByName.set(location.id, [...(rowsByName.get(location.id) ?? []), row]);
    const ref = sourceAt < 0 ? "" : cell(aoa[rowNo - 1][sourceAt]);
    if (ref) refs.set(row.id, { ref, rowNo });
  }
  return { locations: locations.map((l) => ({ ...l, rows: rowsByName.get(l.id) ?? [] })), refs };
}

/** Turns the sheets' Mekân No / Kaynak Madde references into ids. Unknown references are errors. */
function linkBackup(
  rowLocations: Location[],
  keyed: KeyedLocation[],
  lists: KeyedList[],
  refs: Map<string, { ref: string; rowNo: number }>,
  errors: string[],
): { locations: Location[]; checklists: Checklist[] } {
  const locationOf = (key: string) => keyed.find((k) => k.key === key)?.location.id;
  const checklists = lists.map(({ list, locationNos }) => {
    const ids = locationNos.flatMap((no) => {
      const id = locationOf(no);
      if (!id)
        errors.push(
          `${SHEET_CHECKLIST}: ${list.name} listesinin Mekân No '${no}' değeri bulunamadı.`,
        );
      return id ? [id] : [];
    });
    return ids.length ? { ...list, locationIds: ids } : list;
  });
  const liveOf = new Map(checklists.map((c) => [c.id, c.locationIds ?? []]));
  const locations = rowLocations.map((l) => ({
    ...l,
    rows: l.rows.map((r) => {
      const hit = refs.get(r.id);
      if (!hit) return r;
      const sources = hit.ref.split(";").flatMap((part): RiskSource[] => {
        const ref = part.trim();
        if (!ref) return [];
        const found = resolveRef(lists, ref);
        if (!found) {
          errors.push(`${SHEET_RISK}, satır ${hit.rowNo}: Kaynak Madde '${ref}' bulunamadı.`);
          return [];
        }
        const { listId, itemId, scope } = found;
        // Version 1 refs carry no inspection: the row's own location when the list has it, else the first.
        const live = liveOf.get(listId) ?? [];
        const legacyScope = live.includes(l.id) ? l.id : (live[0] ?? null);
        const locationId =
          scope === undefined ? legacyScope : scope === "" ? null : locationOf(scope);
        if (locationId === undefined) {
          errors.push(
            `${SHEET_RISK}, satır ${hit.rowNo}: Kaynak Madde '${ref}' için Mekân No bulunamadı.`,
          );
          return [];
        }
        return [{ listId, itemId, locationId }];
      });
      const unique = sources.filter(
        (s, i) =>
          sources.findIndex(
            (t) => t.listId === s.listId && t.itemId === s.itemId && t.locationId === s.locationId,
          ) === i,
      );
      return unique.length ? { ...r, sources: unique } : r;
    }),
  }));
  return { locations, checklists };
}

/** Rebuilds a fresh assessment (new ids) from backup sheets. All-or-nothing. */
export function restoreBackup(sheets: Sheets): { assessment: Assessment } | { errors: string[] } {
  const errors: string[] = [];
  const schoolAoa = sheet(sheets, SHEET_SCHOOL, errors);
  const locationAoa = sheet(sheets, SHEET_LOCATIONS, errors);
  const riskAoa = sheet(sheets, SHEET_RISK, errors);
  const listAoa = sheet(sheets, SHEET_CHECKLIST, errors);
  if (errors.length) return { errors };
  const patch = readSchoolSheet(schoolAoa, errors, true);
  const keyed = readLocations(locationAoa, errors);
  const risk = readRiskRows(riskAoa, keyed, errors);
  const lists = readLists(listAoa, errors);
  const { locations, checklists } = linkBackup(risk.locations, keyed, lists, risk.refs, errors);
  if (errors.length) return { errors };
  const base = applySchoolPatch(emptyAssessment(""), patch);
  const markerKey = Object.keys(sheets).find((k) => norm(k) === norm(SHEET_MARKER));
  const assessment = ensureInspections({
    ...base,
    meta: readMeta(markerKey ? sheets[markerKey] : [], base.meta),
    locations,
    checklists,
    inspections: inspectionsOf(
      lists,
      (key) => keyed.find((k) => k.key === key)?.location.id,
      errors,
    ),
  });
  if (errors.length) return { errors };
  const invalid = validate(assessment);
  return invalid.length ? { errors: invalid } : { assessment };
}
