// Migration of saved files: version 1 (answers on checklist items) -> version 2 (answers in inspections).
// Works on the raw parsed JSON and never throws on odd shapes: whatever it cannot place is left for
// validate() to report.
import { newId } from "./ids";

type Obj = Record<string, unknown>;
const isObject = (x: unknown): x is Obj => x !== null && typeof x === "object" && !Array.isArray(x);
const asList = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

interface ListScope {
  /** Live location ids of the list, in order. */
  live: string[];
  /** Where the v1 answers go: the first live location, or null (okul geneli). */
  target: string | null;
}

function scopeOf(list: Obj, locationIds: Set<unknown>): ListScope {
  const live = asList(list.locationIds).filter(
    (id): id is string => typeof id === "string" && locationIds.has(id),
  );
  return { live, target: live[0] ?? null };
}

/** v1 item without its answer and note. */
function stripItem(item: unknown): unknown {
  if (!isObject(item)) return item;
  const { answer: _answer, note: _note, ...rest } = item;
  return rest;
}

/** The inspection that receives a v1 list's answers. */
function inspectionOf(list: Obj, target: string | null): Obj {
  const answers = asList(list.items).flatMap((item) =>
    isObject(item) && (item.answer !== "" || item.note !== "")
      ? [{ itemId: item.id, answer: item.answer, note: item.note }]
      : [],
  );
  return { id: newId("d"), checklistId: list.id, locationId: target, answers };
}

/** Old single `source` plus `sources`, each given the inspection it belongs to. */
function migrateRow(row: unknown, locationId: unknown, scopes: Map<unknown, ListScope>): unknown {
  if (!isObject(row)) return row;
  const { source, sources, ...rest } = row;
  const all = [...asList(sources), ...(source === undefined ? [] : [source])];
  if (!all.length) return row;
  const migrated = all.map((s) => {
    if (!isObject(s)) return s;
    const scope = scopes.get(s.listId);
    const inspected = scope?.live.includes(locationId as string)
      ? locationId
      : (scope?.target ?? null);
    return { listId: s.listId, itemId: s.itemId, locationId: inspected };
  });
  const unique = migrated.filter(
    (s, i) => migrated.findIndex((t) => JSON.stringify(t) === JSON.stringify(s)) === i,
  );
  return { ...rest, sources: unique };
}

/**
 * v2 -> v3: adds the snapshot meta. A migrated file is an unsigned first revision of unknown bank
 * version; createdAt/updatedAt are the migration time.
 */
export function migrateV2(value: Obj, now: string, appVersion: string): Obj {
  return {
    ...value,
    version: 3,
    meta: {
      createdAt: now,
      updatedAt: now,
      appVersion,
      bankVersion: "",
      status: "draft",
      revision: 1,
    },
  };
}

/**
 * v1 -> v2. Each list's item answers and notes move into the inspection of the list's first live
 * location (or the school-wide one); every other inspection is created later by ensureInspections.
 * A row source gets its row's location when that location is one of the list's inspections, else the
 * inspection that received the answers.
 */
export function migrateV1(value: Obj): Obj {
  const locations = asList(value.locations);
  const locationIds = new Set(locations.filter(isObject).map((l) => l.id));
  const lists = asList(value.checklists);
  const scopes = new Map<unknown, ListScope>(
    lists.filter(isObject).map((l) => [l.id, scopeOf(l, locationIds)]),
  );
  return {
    ...value,
    version: 2,
    locations: locations.map((l) =>
      isObject(l) && Array.isArray(l.rows)
        ? { ...l, rows: l.rows.map((r) => migrateRow(r, l.id, scopes)) }
        : l,
    ),
    checklists: lists.map((l) =>
      isObject(l) && Array.isArray(l.items) ? { ...l, items: l.items.map(stripItem) } : l,
    ),
    inspections: lists
      .filter(isObject)
      .map((l) => inspectionOf(l, scopes.get(l.id)?.target ?? null)),
  };
}
