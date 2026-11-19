// Pure filters of Riskler and its deficiency view. Filter shapes live in nav.svelte.ts.
import { isOverdue } from "./assessment";
import { mergeCommonDeficiencies } from "./common-items";
import { deficiencies, findInspection, type Deficiency, type RegisterEntry } from "./inspections";
import { isUntransferred } from "./transfer";
import type { Assessment } from "./types";
import type { LevelKey } from "./matrix";
import type { DeficiencyFilter, RegisterFilter } from "../nav.svelte";

/** Level keys from worst to best; the register is sorted in this order, unscored last. */
export const LEVEL_ORDER: readonly LevelKey[] = [
  "intolerable",
  "high",
  "medium",
  "low",
  "negligible",
];
const SERIOUS: readonly LevelKey[] = ["intolerable", "high"];

const matches = (query: string, fields: (string | undefined)[]): boolean => {
  const q = query.trim().toLocaleLowerCase("tr");
  return !q || fields.some((f) => f?.toLocaleLowerCase("tr").includes(q));
};

/** DeficiencyFilter.locationId value for okul geneli inspections (null means "all locations"). */
export const SCHOOL_WIDE_FILTER = "__school__";

/** A deficiency with the same "already in the risk table" rule the bulk transfer uses. */
export type DeficiencyWithState = Deficiency & { transferred: boolean };

export function deficienciesWithState(a: Assessment): DeficiencyWithState[] {
  return mergeCommonDeficiencies(a, deficiencies(a)).map((d) => {
    const list = a.checklists.find((c) => c.id === d.listId);
    const item = list?.items.find((i) => i.id === d.itemId);
    const insp = findInspection(a, d.listId, d.locationId);
    const pending = list && item && insp ? isUntransferred(a, list, item, insp) : !d.rowIds.length;
    return { ...d, transferred: !pending };
  });
}

export const isTransferred = (d: Deficiency & { transferred?: boolean }): boolean =>
  d.transferred ?? d.rowIds.length > 0;

/** Deficiencies passing every facet except `state` (so state counts stay meaningful). */
function withoutState(list: Deficiency[], f: DeficiencyFilter): Deficiency[] {
  return list.filter(
    (d) =>
      (f.locationId === null ||
        (f.locationId === SCHOOL_WIDE_FILTER
          ? d.locationId === null
          : d.locationId === f.locationId)) &&
      (f.listId === null ||
        d.listId === f.listId ||
        !!d.siblings?.some((s) => s.listId === f.listId)) &&
      matches(f.query, [d.text, d.note, d.itemNo, d.listName, d.listCode, d.ref, d.locationName]),
  );
}

export function filterDeficiencies(list: Deficiency[], f: DeficiencyFilter): Deficiency[] {
  return withoutState(list, f).filter(
    (d) => f.state === "all" || (f.state === "transferred") === isTransferred(d),
  );
}

/** Counts of the state facet under the other active filters. */
export function deficiencyCounts(
  list: Deficiency[],
  f: DeficiencyFilter,
): { all: number; untransferred: number; transferred: number } {
  const base = withoutState(list, f);
  const transferred = base.filter(isTransferred).length;
  return { all: base.length, transferred, untransferred: base.length - transferred };
}

/** Entries passing every facet except `level` (so level counts stay meaningful). */
function withoutLevel(entries: RegisterEntry[], f: RegisterFilter, today: Date): RegisterEntry[] {
  return entries.filter(
    ({ row, locationId, locationName, number }) =>
      (f.locationId === null || locationId === f.locationId) &&
      (f.status === "all" || row.status === f.status) &&
      (!f.overdue || isOverdue(row, today)) &&
      matches(f.query, [
        locationName,
        row.equipment,
        row.hazard,
        row.action,
        row.responsible,
        String(number),
      ]),
  );
}

const rank = (e: RegisterEntry): number => {
  const i = e.level ? LEVEL_ORDER.indexOf(e.level.key) : -1;
  return i < 0 ? LEVEL_ORDER.length : i;
};

/** Filtered entries, worst level first (unscored last), then by location name; stable otherwise. */
export function filterRegister(
  entries: RegisterEntry[],
  f: RegisterFilter,
  today: Date,
): RegisterEntry[] {
  return withoutLevel(entries, f, today)
    .filter(
      (e) =>
        f.level === "all" ||
        (f.level === "unscored" ? !e.level : !!e.level && SERIOUS.includes(e.level.key)),
    )
    .sort((x, y) => rank(x) - rank(y) || x.locationName.localeCompare(y.locationName, "tr"));
}

/** Entries per level (plus unscored) under the other active filters. */
export function levelCounts(
  entries: RegisterEntry[],
  f: RegisterFilter,
  today: Date,
): { all: number; serious: number; unscored: number } & Record<LevelKey, number> {
  const counts = {
    all: 0,
    serious: 0,
    unscored: 0,
    intolerable: 0,
    high: 0,
    medium: 0,
    low: 0,
    negligible: 0,
  };
  for (const e of withoutLevel(entries, f, today)) {
    counts.all += 1;
    if (!e.level) counts.unscored += 1;
    else {
      counts[e.level.key] += 1;
      if (SERIOUS.includes(e.level.key)) counts.serious += 1;
    }
  }
  return counts;
}

/** Items grouped by location (okul geneli under SCHOOL_WIDE_FILTER), groups in first-seen order. */
export function groupByLocation<T extends { locationId: string | null; locationName: string }>(
  items: readonly T[],
): { key: string; name: string; items: T[] }[] {
  const keyOf = (i: T) => i.locationId ?? SCHOOL_WIDE_FILTER;
  return [...new Set(items.map(keyOf))].map((key) => {
    const members = items.filter((i) => keyOf(i) === key);
    return { key, name: members[0].locationName, items: members };
  });
}

/** What a Riskler filter showed when it was chosen, every row id known then, and its location. */
export interface RegisterPin {
  shown: readonly string[];
  known: ReadonlySet<string>;
  locationId: string | null;
}

export function pinRegister(
  entries: readonly RegisterEntry[],
  f: RegisterFilter,
  today: Date,
): RegisterPin {
  return {
    shown: filterRegister([...entries], f, today).map((e) => e.row.id),
    known: new Set(entries.map((e) => e.row.id)),
    locationId: f.locationId,
  };
}

/**
 * Pinned rows in pinned order (deleted ones drop out), then rows added since in the pinned location:
 * a row scored under "Puansız" stays where it is instead of vanishing under the cursor.
 */
export function keepPinned(entries: readonly RegisterEntry[], pin: RegisterPin): RegisterEntry[] {
  const byId = new Map(entries.map((e) => [e.row.id, e]));
  const kept = pin.shown.flatMap((id) => byId.get(id) ?? []);
  const added = entries.filter(
    (e) => !pin.known.has(e.row.id) && (pin.locationId === null || e.locationId === pin.locationId),
  );
  return [...kept, ...added];
}

export const matchesRegisterFilter = (e: RegisterEntry, f: RegisterFilter, today: Date): boolean =>
  filterRegister([e], f, today).length > 0;
