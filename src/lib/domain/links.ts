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
  listName: string;
  no: string;
  answer: ChecklistItem["answer"];
  text: string;
}

const SHORT_NAME_LENGTH = 12;
const MEB_REF = /KL-\d+\.\d+/;

/** "KL-26.06": list code + item no; for codeless lists the first MEB reference in the item text, else "<short name> md.<no>". */
export function sourceLabel(info: SourceInfo): string {
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

/** Risk rows (in any location) that came from the given checklist item. */
export function rowsForItem(a: Assessment, listId: string, itemId: string): ItemRow[] {
  return a.locations.flatMap((l) =>
    l.rows.flatMap((r, i) =>
      r.sources?.some((s) => s.listId === listId && s.itemId === itemId)
        ? [{ locationId: l.id, locationName: l.name, rowId: r.id, number: i + 1 }]
        : [],
    ),
  );
}

/** The items a row came from, in order; dangling references are dropped. */
export function sourcesOf(a: Assessment, row: RiskRow): SourceInfo[] {
  return (row.sources ?? []).flatMap((s) => {
    const found = itemOf(a, s);
    if (!found) return [];
    const { list, item } = found;
    return [
      {
        listId: list.id,
        itemId: item.id,
        code: list.code,
        listName: list.name,
        no: item.no,
        answer: item.answer,
        text: item.text,
      },
    ];
  });
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

/** Row with the given sources; an empty list drops the key. Duplicates are removed, order kept. */
function withSources(r: RiskRow, sources: RiskSource[]): RiskRow {
  const { sources: _old, ...rest } = r;
  const seen = new Set<string>();
  const unique = sources.filter((s) => {
    const key = `${s.listId}\u0000${s.itemId}`;
    return !seen.has(key) && !!seen.add(key);
  });
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
  if (check && !itemOf(a, check))
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

const same = (x: RiskSource, y: RiskSource) => x.listId === y.listId && x.itemId === y.itemId;

/** Adds an item to the row's sources (no-op when already linked). */
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
