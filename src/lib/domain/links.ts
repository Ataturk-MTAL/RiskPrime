// Links between checklist items and risk rows. Pure helpers; every change returns a new Assessment.
import { answerOf, ensureInspections, findInspection, liveLocationIds } from "./inspections";
import type {
  Answer,
  Assessment,
  Checklist,
  ChecklistItem,
  Inspection,
  RiskRow,
  RiskSource,
} from "./types";

export interface ItemRow {
  locationId: string;
  locationName: string;
  rowId: string;
  /** 1-based row number inside its location. */
  number: number;
}

export interface SourceInfo {
  listId: string;
  itemId: string;
  /** Inspection scope of the answer; null = school-wide. */
  locationId: string | null;
  code: string;
  listName: string;
  no: string;
  answer: Answer;
  text: string;
  /** Question bank key of the item, when it has one. */
  ref?: string;
}

const SHORT_NAME_LENGTH = 12;
const MEB_REF = /KL-\d+\.\d+/;

/** "KL-26.06": list code + item no; for codeless lists the first MEB reference in the item text, else "<short name> md.<no>". */
export function sourceLabel(info: SourceInfo): string {
  if (info.ref) return info.ref;
  if (info.code) return `${info.code}.${info.no}`;
  return (
    info.text.match(MEB_REF)?.[0] ??
    `${info.listName.trim().slice(0, SHORT_NAME_LENGTH)} md.${info.no}`
  );
}

const itemOf = (a: Assessment, s: RiskSource): { list: Checklist; item: ChecklistItem } | null => {
  const list = a.checklists.find((c) => c.id === s.listId);
  const item = list?.items.find((i) => i.id === s.itemId);
  return list && item ? { list, item } : null;
};

const same = (x: RiskSource, y: RiskSource) =>
  x.listId === y.listId && x.itemId === y.itemId && x.locationId === y.locationId;

/** Risk rows (in any location) that came from the given item in the given inspection (null = school-wide). */
export function rowsForItem(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
): ItemRow[] {
  const wanted: RiskSource = { listId, itemId, locationId };
  return a.locations.flatMap((l) =>
    l.rows.flatMap((r, i) =>
      r.sources?.some((s) => same(s, wanted))
        ? [{ locationId: l.id, locationName: l.name, rowId: r.id, number: i + 1 }]
        : [],
    ),
  );
}

/** The items a row came from, in order, with their answer in the linked inspection; dangling references are dropped. */
export function sourcesOf(a: Assessment, row: RiskRow): SourceInfo[] {
  return (row.sources ?? []).flatMap((s) => {
    const found = itemOf(a, s);
    if (!found || !findInspection(a, s.listId, s.locationId)) return [];
    const { list, item } = found;
    return [
      {
        listId: list.id,
        itemId: item.id,
        locationId: s.locationId,
        code: list.code,
        listName: list.name,
        no: item.no,
        answer: answerOf(a, list.id, s.locationId, item.id).answer,
        text: item.text,
        ...(item.ref ? { ref: item.ref } : {}),
      },
    ];
  });
}

/** Lists tied to the location, plus how many lists are general (apply to every location, one school-wide inspection). */
export function listsForLocation(
  a: Assessment,
  locationId: string,
): { lists: Checklist[]; generalCount: number } {
  return {
    lists: a.checklists.filter((c) => liveLocationIds(a, c).includes(locationId)),
    generalCount: a.checklists.filter((c) => liveLocationIds(a, c).length === 0).length,
  };
}

/** Sets the list's locations (dead ids dropped) and re-syncs its inspections. */
export function setChecklistLocations(
  a: Assessment,
  listId: string,
  locationIds: string[],
): Assessment {
  const list = a.checklists.find((c) => c.id === listId);
  if (!list) throw new Error(`Kontrol listesi bulunamadı: ${listId}`);
  const ids = liveLocationIds(a, { ...list, locationIds });
  const next = ensureInspections({
    ...a,
    checklists: a.checklists.map((c) => {
      if (c.id !== listId) return c;
      const { locationIds: _old, ...rest } = c;
      return ids.length ? { ...rest, locationIds: ids } : rest;
    }),
  });
  // A general list getting its first location would drop the school-wide inspection: keep its answers.
  const schoolWide = findInspection(a, listId, null);
  const wasGeneral = liveLocationIds(a, list).length === 0;
  if (!wasGeneral || !ids.length || !schoolWide?.answers.length) return next;
  return carrySchoolWide(next, listId, schoolWide.answers, ids[0]);
}

/** Moves school-wide answers and row links of a list to one location's (empty) inspection. */
function carrySchoolWide(
  a: Assessment,
  listId: string,
  answers: Inspection["answers"],
  locationId: string,
): Assessment {
  const moveSource = (s: RiskSource): RiskSource =>
    s.listId === listId && s.locationId === null ? { ...s, locationId } : s;
  return {
    ...a,
    inspections: a.inspections.map((i) =>
      i.checklistId === listId && i.locationId === locationId && !i.answers.length
        ? { ...i, answers }
        : i,
    ),
    locations: a.locations.map((l) => ({
      ...l,
      rows: l.rows.map((r) => (r.sources ? { ...r, sources: r.sources.map(moveSource) } : r)),
    })),
  };
}

/** Row with the given sources; an empty list drops the key. Duplicates are removed, order kept. */
function withSources(r: RiskRow, sources: RiskSource[]): RiskRow {
  const { sources: _old, ...rest } = r;
  const unique = sources.filter((s, i) => sources.findIndex((t) => same(s, t)) === i);
  return unique.length ? { ...rest, sources: unique.map((s) => ({ ...s })) } : rest;
}

function updateSources(
  a: Assessment,
  locationId: string,
  rowId: string,
  change: (sources: RiskSource[]) => RiskSource[],
  check?: RiskSource,
): Assessment {
  const location = a.locations.find((l) => l.id === locationId);
  if (!location) throw new Error(`Mekân bulunamadı: ${locationId}`);
  if (!location.rows.some((r) => r.id === rowId)) throw new Error(`Satır bulunamadı: ${rowId}`);
  if (check && !(itemOf(a, check) && findInspection(a, check.listId, check.locationId)))
    throw new Error(`Kontrol maddesi bulunamadı: ${check.listId}/${check.itemId}`);
  return {
    ...a,
    locations: a.locations.map((l) =>
      l.id === locationId
        ? {
            ...l,
            rows: l.rows.map((r) => (r.id === rowId ? withSources(r, change(r.sources ?? [])) : r)),
          }
        : l,
    ),
  };
}

/** Adds an item (in one inspection) to the row's sources (no-op when already linked). */
export function addRowSource(
  a: Assessment,
  locationId: string,
  rowId: string,
  source: RiskSource,
): Assessment {
  return updateSources(a, locationId, rowId, (all) => [...all, source], source);
}

/** Removes one item from the row's sources. */
export function removeRowSource(
  a: Assessment,
  locationId: string,
  rowId: string,
  source: RiskSource,
): Assessment {
  return updateSources(a, locationId, rowId, (all) => all.filter((s) => !same(s, source)));
}

/** Removes every source of one row. */
export function clearRowSources(a: Assessment, locationId: string, rowId: string): Assessment {
  return updateSources(a, locationId, rowId, () => []);
}

/** Removes every matching source from every row. */
export function clearSources(a: Assessment, matches: (s: RiskSource) => boolean): Assessment {
  return {
    ...a,
    locations: a.locations.map((l) => ({
      ...l,
      rows: l.rows.map((r) =>
        r.sources?.some(matches)
          ? withSources(
              r,
              r.sources.filter((s) => !matches(s)),
            )
          : r,
      ),
    })),
  };
}
