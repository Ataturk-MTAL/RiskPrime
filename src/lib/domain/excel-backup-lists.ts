// Checklist part of the Excel backup. "Kontrol Listesi" has one row per item per inspection:
// "Mekân No" names the inspection's location (blank = okul geneli). Version 1 backups have no such
// column; their rows are one per item and the answers go to the list's first location (or okul geneli).
import { newId } from "./assessment";
import { cell, columns, dataRows, norm, SHEET_CHECKLIST, type ColumnDef } from "./excel-import";
import { answerOf, liveLocationIds, scopesOf } from "./inspections";
import type {
  Answer,
  Assessment,
  Checklist,
  ChecklistItem,
  ChecklistSource,
  Inspection,
  InspectionAnswer,
  RiskSource,
} from "./types";

/** Optional column of "Mekânlar", "Risk Satırları" and "Kontrol Listesi": the location's number. */
export const LOCATION_KEY_HEADER = "Mekân No";
// Optional last column of "Kontrol Listesi": comma list of the "Mekân No" values the list applies to.
const LIST_LOCATIONS_HEADER = "Mekân Nolar";
/** Question bank key of an item (e.g. KL-26.06, EE-03); optional, older backups lack it. */
const ITEM_REF_HEADER = "Soru Anahtarı";
/** Optional column: "Evet" when the item was taken verbatim from the shared checklists (fromBank). */
const BANK_HEADER = "Bankadan";
const ADDED_TEXT = "Evet";
const REF_SCOPE_SEPARATOR = "@";

/** Index of an optional column in a header row, or -1. */
export const optionalColumn = (header: unknown[] | undefined, name: string) =>
  (header || []).findIndex((h) => norm(cell(h)) === norm(name));
export const keyColumn = (header: unknown[] | undefined) =>
  optionalColumn(header, LOCATION_KEY_HEADER);

export const lookup = <T extends string>(labels: Record<T, string>, extra: [string, T][] = []) =>
  new Map<string, T>([
    ...(Object.entries(labels) as [T, string][]).map(([k, v]): [string, T] => [norm(v), k]),
    ...extra,
  ]);

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
const SOURCE_LOOKUP = lookup(SOURCE_LABELS);
const ANSWER_LOOKUP = lookup(ANSWER_OUT, [
  [norm("U/D"), "na"],
  [norm("UD"), "na"],
]);

type Table = (string | number)[][];

/** "<Liste No>/<Madde No>@<Mekân No>" for one source ("<Liste No>/#<sıra>@..." when the item number is blank or repeats); "" when dangling. */
export function sourceRef(a: Assessment, s: RiskSource): string {
  const listIndex = a.checklists.findIndex((c) => c.id === s.listId);
  const items = a.checklists[listIndex]?.items ?? [];
  const position = items.findIndex((m) => m.id === s.itemId);
  if (position < 0) return "";
  const no = items[position].no.trim();
  const unique = no !== "" && items.filter((m) => m.no.trim() === no).length === 1;
  const scope =
    s.locationId === null ? "" : a.locations.findIndex((l) => l.id === s.locationId) + 1;
  return `${listIndex + 1}/${unique ? no : `#${position + 1}`}${REF_SCOPE_SEPARATOR}${scope}`;
}

export function checklistSheet(a: Assessment): Table {
  const head = (l: Checklist, i: number) => [i + 1, l.code, l.name, SOURCE_LABELS[l.source]];
  const locationNos = (l: Checklist) =>
    liveLocationIds(a, l)
      .map((id) => a.locations.findIndex((x) => x.id === id) + 1)
      .join(", ");
  const scopeNo = (locationId: string | null) =>
    locationId === null ? "" : a.locations.findIndex((x) => x.id === locationId) + 1;
  const rows = a.checklists.flatMap((l, i) => {
    const itemRows = scopesOf(a, l).flatMap((locationId) =>
      l.items.map((m) => {
        const { answer, note } = answerOf(a, l.id, locationId, m.id);
        return [
          ...head(l, i),
          m.no,
          m.text,
          ANSWER_OUT[answer],
          note,
          m.added ? ADDED_TEXT : "",
          locationNos(l),
          m.fromBank ? ADDED_TEXT : "",
          m.ref ?? "",
          scopeNo(locationId),
        ];
      }),
    );
    return itemRows.length
      ? itemRows
      : [[...head(l, i), "", "", "", "", "", locationNos(l), "", "", ""]];
  });
  return [
    [
      ...LIST_COLUMNS.map(([, h]) => h),
      LIST_LOCATIONS_HEADER,
      BANK_HEADER,
      ITEM_REF_HEADER,
      LOCATION_KEY_HEADER,
    ],
    ...rows,
  ];
}

export type KeyedList = {
  key: string;
  list: Checklist;
  locationNos: string[];
  /** Answers per "Mekân No" value ("" = okul geneli, or every row of a version 1 backup). */
  answers: Map<string, InspectionAnswer[]>;
  /** True for a version 1 backup (no "Mekân No" column in "Kontrol Listesi"). */
  legacy: boolean;
};

type ListState = { keyed: KeyedList; definingScope: string | null; counts: Map<string, number> };

/** Reads the checklist sheet: items come from the first inspection of each list, the others add answers by position. */
export function readLists(aoa: unknown[][], errors: string[]): KeyedList[] {
  const cols = columns(aoa[0], LIST_COLUMNS, SHEET_CHECKLIST);
  if ("errors" in cols) {
    errors.push(...cols.errors);
    return [];
  }
  const locationsAt = optionalColumn(aoa[0], LIST_LOCATIONS_HEADER);
  const refAt = optionalColumn(aoa[0], ITEM_REF_HEADER);
  const bankAt = optionalColumn(aoa[0], BANK_HEADER);
  const scopeAt = keyColumn(aoa[0]);
  const states = new Map<string, ListState>();
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
    const state: ListState = states.get(v.listNo) ?? {
      keyed: {
        key: v.listNo,
        list: {
          id: newId("k"),
          code: v.code,
          name: v.name,
          source: source as ChecklistSource,
          items: [],
        },
        locationNos: [],
        answers: new Map(),
        legacy: scopeAt < 0,
      },
      definingScope: null,
      counts: new Map(),
    };
    states.set(v.listNo, state);
    const nos = locationsAt < 0 ? "" : cell(aoa[rowNo - 1][locationsAt]);
    if (nos && !state.keyed.locationNos.length)
      state.keyed.locationNos.push(
        ...nos
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
      );
    if (v.no === "" && v.text === "" && v.added === "") continue;
    const scope = scopeAt < 0 ? "" : cell(aoa[rowNo - 1][scopeAt]);
    const ref = refAt < 0 ? "" : cell(aoa[rowNo - 1][refAt]);
    const fromBank = bankAt >= 0 && norm(cell(aoa[rowNo - 1][bankAt])) === norm(ADDED_TEXT);
    addItemRow(state, scope, rowNo, { v, answer: answer as Answer, ref, fromBank }, errors);
  }
  return [...states.values()].map((s) => s.keyed);
}

/** Registers one item row: the first scope seen defines the list's items, later scopes match by position. */
function addItemRow(
  state: ListState,
  scope: string,
  rowNo: number,
  row: { v: Record<string, string>; answer: Answer; ref: string; fromBank: boolean },
  errors: string[],
): void {
  const { keyed } = state;
  state.definingScope ??= scope;
  const index = state.counts.get(scope) ?? 0;
  state.counts.set(scope, index + 1);
  let item: ChecklistItem | undefined = keyed.list.items[index];
  if (scope === state.definingScope) {
    item = {
      id: newId("m"),
      no: row.v.no,
      text: row.v.text,
      ...(row.v.added ? { added: true } : {}),
      ...(row.ref ? { ref: row.ref } : {}),
      ...(row.fromBank ? { fromBank: true as const } : {}),
    };
    keyed.list = { ...keyed.list, items: [...keyed.list.items, item] };
  } else if (!item) {
    errors.push(`${SHEET_CHECKLIST}, satır ${rowNo}: Mekân No '${scope}' için fazladan madde.`);
    return;
  }
  if (row.answer === "" && row.v.note === "") return;
  keyed.answers.set(scope, [
    ...(keyed.answers.get(scope) ?? []),
    { itemId: item.id, answer: row.answer, note: row.v.note },
  ]);
}

/** Finds the item named by a source ref; `scope` is the text after "@" (undefined = version 1 ref). */
export function resolveRef(
  lists: KeyedList[],
  ref: string,
): { listId: string; itemId: string; scope: string | undefined } | null {
  const at = ref.lastIndexOf(REF_SCOPE_SEPARATOR);
  const body = at < 0 ? ref : ref.slice(0, at);
  const scope = at < 0 ? undefined : ref.slice(at + 1).trim();
  const slash = body.indexOf("/");
  const list = lists.find((l) => l.key === body.slice(0, slash))?.list;
  const rest = body.slice(slash + 1);
  const item = rest.startsWith("#")
    ? list?.items[Number(rest.slice(1)) - 1]
    : list?.items.find((m) => m.no.trim() === rest);
  return slash > 0 && list && item ? { listId: list.id, itemId: item.id, scope } : null;
}

/** Inspections rebuilt from the answers read per scope; `locationOf` maps a "Mekân No" to a location id. */
export function inspectionsOf(
  lists: KeyedList[],
  locationOf: (key: string) => string | undefined,
  errors: string[],
): Inspection[] {
  return lists.flatMap(({ list, answers, locationNos, legacy }) =>
    [...answers].flatMap(([scope, found]) => {
      const key = legacy ? (locationNos[0] ?? "") : scope;
      const locationId = key === "" ? null : locationOf(key);
      if (locationId === undefined) {
        errors.push(
          `${SHEET_CHECKLIST}: ${list.name} listesinin Mekân No '${key}' değeri bulunamadı.`,
        );
        return [];
      }
      return [{ id: newId("d"), checklistId: list.id, locationId, answers: found }];
    }),
  );
}
