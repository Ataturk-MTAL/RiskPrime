// Links between checklist items and risk rows. Pure helpers; every change returns a new Assessment.
import type { Assessment, Checklist, ChecklistItem, RiskRow, RiskSource } from "./types";

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
  code: string;
  no: string;
  answer: ChecklistItem["answer"];
  text: string;
}

const itemOf = (a: Assessment, s: RiskSource): { list: Checklist; item: ChecklistItem } | null => {
  const list = a.checklists.find((c) => c.id === s.listId);
  const item = list?.items.find((i) => i.id === s.itemId);
  return list && item ? { list, item } : null;
};

/** Risk rows (in any location) that came from the given checklist item. */
export function rowsForItem(a: Assessment, listId: string, itemId: string): ItemRow[] {
  return a.locations.flatMap((l) =>
    l.rows.flatMap((r, i) =>
      r.source?.listId === listId && r.source.itemId === itemId
        ? [{ locationId: l.id, locationName: l.name, rowId: r.id, number: i + 1 }]
        : [],
    ),
  );
}

/** The item a row came from; null when the row has no source or it no longer exists. */
export function sourceOf(a: Assessment, row: RiskRow): SourceInfo | null {
  const found = row.source && itemOf(a, row.source);
  if (!found) return null;
  const { list, item } = found;
  return {
    listId: list.id,
    itemId: item.id,
    code: list.code,
    no: item.no,
    answer: item.answer,
    text: item.text,
  };
}

/** Location ids of a list that still exist, without duplicates. */
export function liveLocationIds(a: Assessment, list: Checklist): string[] {
  const live = (list.locationIds ?? []).filter((id) => a.locations.some((l) => l.id === id));
  return [...new Set(live)];
}

/** Lists tied to the location, plus how many lists are general (apply to every location). */
export function listsForLocation(
  a: Assessment,
  locationId: string,
): { lists: Checklist[]; generalCount: number } {
  return {
    lists: a.checklists.filter((c) => liveLocationIds(a, c).includes(locationId)),
    generalCount: a.checklists.filter((c) => liveLocationIds(a, c).length === 0).length,
  };
}

export function setChecklistLocations(
  a: Assessment,
  listId: string,
  locationIds: string[],
): Assessment {
  if (!a.checklists.some((c) => c.id === listId))
    throw new Error(`Kontrol listesi bulunamadı: ${listId}`);
  return {
    ...a,
    checklists: a.checklists.map((c) => {
      if (c.id !== listId) return c;
      const { locationIds: _old, ...rest } = c;
      const ids = liveLocationIds(a, { ...c, locationIds });
      return ids.length ? { ...rest, locationIds: ids } : rest;
    }),
  };
}

function withSource(r: RiskRow, source: RiskSource | null): RiskRow {
  const { source: _old, ...rest } = r;
  return source ? { ...rest, source: { ...source } } : rest;
}

/** Sets (or, with null, clears) the source of one row. */
export function linkRow(
  a: Assessment,
  locationId: string,
  rowId: string,
  source: RiskSource | null,
): Assessment {
  const location = a.locations.find((l) => l.id === locationId);
  if (!location) throw new Error(`Mekân bulunamadı: ${locationId}`);
  if (!location.rows.some((r) => r.id === rowId)) throw new Error(`Satır bulunamadı: ${rowId}`);
  if (source && !itemOf(a, source))
    throw new Error(`Kontrol maddesi bulunamadı: ${source.listId}/${source.itemId}`);
  return {
    ...a,
    locations: a.locations.map((l) =>
      l.id === locationId
        ? { ...l, rows: l.rows.map((r) => (r.id === rowId ? withSource(r, source) : r)) }
        : l,
    ),
  };
}

/** Removes the source of every row whose source matches. */
export function clearSources(a: Assessment, matches: (s: RiskSource) => boolean): Assessment {
  return {
    ...a,
    locations: a.locations.map((l) => ({
      ...l,
      rows: l.rows.map((r) => (r.source && matches(r.source) ? withSource(r, null) : r)),
    })),
  };
}
