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
import { validate } from "./file";
import { liveLocationIds } from "./links";
import { riskLevel, riskScore } from "./matrix";
import { applySchoolPatch, readSchoolSheet, SHEET_SCHOOL, schoolSheet } from "./school-sheet";
import {
  SCHEMA_VERSION,
  type Answer,
  type Assessment,
  type Checklist,
  type ChecklistSource,
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
const ADDED_TEXT = "Evet";

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
// Optional last column of "Mekânlar" and "Risk Satırları": ties a risk row to its location even
// when names repeat. Older backups lack it; those are matched by name.
const LOCATION_KEY_HEADER = "Mekân No";
// Optional last column of "Risk Satırları": "<Liste No>/<Madde No>" of the checklist item the row
// came from ("<Liste No>/#<sıra>" when the item number is blank or repeats within its list).
const SOURCE_HEADER = "Kaynak Madde";
// Optional last column of "Kontrol Listeleri": comma list of the "Mekân No" values the list applies to.
const LIST_LOCATIONS_HEADER = "Mekân Nolar";
/** Question bank key of an item (e.g. KL-26.06, EE-03); optional, older backups lack it. */
const ITEM_REF_HEADER = "Soru Anahtarı";

/** Index of an optional column in a header row, or -1. */
const optionalColumn = (header: unknown[] | undefined, name: string) =>
  (header || []).findIndex((h) => norm(cell(h)) === norm(name));
const keyColumn = (header: unknown[] | undefined) => optionalColumn(header, LOCATION_KEY_HEADER);

const SOURCE_SEPARATOR = "; ";

/** "<Liste No>/<Madde No>" for one source, or "" when dangling. */
function sourceRef(a: Assessment, s: RiskSource): string {
  const listIndex = a.checklists.findIndex((c) => c.id === s.listId);
  const items = a.checklists[listIndex]?.items ?? [];
  const position = items.findIndex((m) => m.id === s.itemId);
  if (position < 0) return "";
  const no = items[position].no.trim();
  const unique = no !== "" && items.filter((m) => m.no.trim() === no).length === 1;
  return `${listIndex + 1}/${unique ? no : `#${position + 1}`}`;
}

/** All of a row's source refs joined with "; " (dangling ones skipped). */
const sourceRefs = (a: Assessment, r: RiskRow) =>
  (r.sources ?? [])
    .map((s) => sourceRef(a, s))
    .filter(Boolean)
    .join(SOURCE_SEPARATOR);
const LIST_COLUMNS: ColumnDef[] = [
  ["listNo", "Liste No"],
  ["code", "Liste Kodu"],
  ["name", "Liste Adı"],
  ["source", "Kaynak"],
  ["no", "Madde No"],
  ["text", "Madde"],
  ["answer", "Cevap"],
  ["note", "Açıklama"],
  ["added", "Okulca Eklendi"],
];

const SOURCE_LABELS = { internal: "Okul", external: "MEB" } as const;
const ANSWER_OUT: Record<Answer, string> = { yes: "Evet", no: "Hayır", na: "U.D.", "": "" };
const lookup = <T extends string>(labels: Record<T, string>, extra: [string, T][] = []) =>
  new Map<string, T>([
    ...(Object.entries(labels) as [T, string][]).map(([k, v]): [string, T] => [norm(v), k]),
    ...extra,
  ]);
const STATUS_LOOKUP = lookup(STATUS_LABELS, [[norm("Tamamlandı"), "done"]]);
const SOURCE_LOOKUP = lookup(SOURCE_LABELS);
const ANSWER_LOOKUP = lookup(ANSWER_OUT, [
  [norm("U/D"), "na"],
  [norm("UD"), "na"],
]);

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

function checklistSheet(a: Assessment): Table {
  const head = (l: Checklist, i: number) => [i + 1, l.code, l.name, SOURCE_LABELS[l.source]];
  const locationNos = (l: Checklist) =>
    liveLocationIds(a, l)
      .map((id) => a.locations.findIndex((x) => x.id === id) + 1)
      .join(", ");
  const rows = a.checklists.flatMap((l, i) =>
    l.items.length
      ? l.items.map((m) => [
          ...head(l, i),
          m.no,
          m.text,
          ANSWER_OUT[m.answer],
          m.note,
          m.added ? ADDED_TEXT : "",
          locationNos(l),
          m.ref ?? "",
        ])
      : [[...head(l, i), "", "", "", "", "", locationNos(l), ""]],
  );
  return [[...LIST_COLUMNS.map(([, h]) => h), LIST_LOCATIONS_HEADER, ITEM_REF_HEADER], ...rows];
}

/** All backup sheets in file order. */
export function backupSheets(a: Assessment): Record<string, Table> {
  return {
    [SHEET_MARKER]: [
      ["Biçim", MARKER_VALUE],
      ["Sürüm", SCHEMA_VERSION],
      ["Not", NOTE],
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

type KeyedList = { key: string; list: Checklist; locationNos: string[] };

/** Finds the item named by a "<Liste No>/<Madde No>" reference. */
function resolveRef(lists: KeyedList[], ref: string): { listId: string; itemId: string } | null {
  const slash = ref.indexOf("/");
  const list = lists.find((l) => l.key === ref.slice(0, slash))?.list;
  const rest = ref.slice(slash + 1);
  const item = rest.startsWith("#")
    ? list?.items[Number(rest.slice(1)) - 1]
    : list?.items.find((m) => m.no.trim() === rest);
  return slash > 0 && list && item ? { listId: list.id, itemId: item.id } : null;
}

/** Turns the sheets' Mekân No / Kaynak Madde references into ids. Unknown references are errors. */
function linkBackup(
  rowLocations: Location[],
  keyed: KeyedLocation[],
  lists: KeyedList[],
  refs: Map<string, { ref: string; rowNo: number }>,
  errors: string[],
): { locations: Location[]; checklists: Checklist[] } {
  const locations = rowLocations.map((l) => ({
    ...l,
    rows: l.rows.map((r) => {
      const hit = refs.get(r.id);
      if (!hit) return r;
      const sources = hit.ref.split(";").flatMap((part) => {
        const ref = part.trim();
        if (!ref) return [];
        const found = resolveRef(lists, ref);
        if (!found)
          errors.push(`${SHEET_RISK}, satır ${hit.rowNo}: Kaynak Madde '${ref}' bulunamadı.`);
        return found ? [found] : [];
      });
      const unique = sources.filter(
        (s, i) => sources.findIndex((t) => t.listId === s.listId && t.itemId === s.itemId) === i,
      );
      return unique.length ? { ...r, sources: unique } : r;
    }),
  }));
  const checklists = lists.map(({ list, locationNos }) => {
    const ids = locationNos.flatMap((no) => {
      const id = keyed.find((k) => k.key === no)?.location.id;
      if (!id)
        errors.push(
          `${SHEET_CHECKLIST}: ${list.name} listesinin Mekân No '${no}' değeri bulunamadı.`,
        );
      return id ? [id] : [];
    });
    return ids.length ? { ...list, locationIds: ids } : list;
  });
  return { locations, checklists };
}

function readLists(aoa: unknown[][], errors: string[]): KeyedList[] {
  const cols = columns(aoa[0], LIST_COLUMNS, SHEET_CHECKLIST);
  if ("errors" in cols) {
    errors.push(...cols.errors);
    return [];
  }
  const locationsAt = optionalColumn(aoa[0], LIST_LOCATIONS_HEADER);
  const refAt = optionalColumn(aoa[0], ITEM_REF_HEADER);
  const locationNos = new Map<string, string[]>();
  const lists = new Map<string, Checklist>();
  for (const { rowNo, cells: v } of dataRows(aoa, cols.positions, "listNo")) {
    const local: string[] = [];
    const source = SOURCE_LOOKUP.get(norm(v.source));
    if (!v.listNo) local.push("Liste No boş.");
    if (!source) local.push(`Kaynak '${v.source}' tanınmadı; MEB ya da Okul yazın.`);
    const answer = ANSWER_LOOKUP.get(norm(v.answer));
    if (answer === undefined)
      local.push(`Cevap '${v.answer}' tanınmadı; Evet, Hayır ya da U.D. yazın.`);
    errors.push(...local.map((m) => `${SHEET_CHECKLIST}, satır ${rowNo}: ${m}`));
    if (local.length) continue;
    const list = lists.get(v.listNo) ?? {
      id: newId("k"),
      code: v.code,
      name: v.name,
      source: source as ChecklistSource,
      items: [],
    };
    const nos = locationsAt < 0 ? "" : cell(aoa[rowNo - 1][locationsAt]);
    if (nos && !locationNos.has(v.listNo))
      locationNos.set(
        v.listNo,
        nos
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
      );
    const hasItem = v.no !== "" || v.text !== "" || v.added !== "";
    const ref = refAt < 0 ? "" : cell(aoa[rowNo - 1][refAt]);
    lists.set(v.listNo, {
      ...list,
      items: hasItem
        ? [
            ...list.items,
            {
              id: newId("m"),
              no: v.no,
              text: v.text,
              answer: answer as Answer,
              note: v.note,
              ...(v.added ? { added: true } : {}),
              ...(ref ? { ref } : {}),
            },
          ]
        : list.items,
    });
  }
  return [...lists].map(([key, list]) => ({ key, list, locationNos: locationNos.get(key) ?? [] }));
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
  const assessment = {
    ...applySchoolPatch(emptyAssessment(""), patch),
    locations,
    checklists,
  };
  const invalid = validate(assessment);
  return invalid.length ? { errors: invalid } : { assessment };
}
