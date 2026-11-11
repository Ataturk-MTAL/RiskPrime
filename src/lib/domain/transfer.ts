// Bulk "eksik -> risk satiri": every "Hayir" item without a linked row gets one row per target location.
import { defaultLocationId, hazardOf, riskRowFromChecklistItem } from "./checklist-risk";
import { liveLocationIds, rowsForItem } from "./links";
import type { Assessment, Checklist, ChecklistItem } from "./types";

export interface TransferResult {
  assessment: Assessment;
  created: number;
  skippedNoLocation: number;
}

const targetsOf = (a: Assessment, list: Checklist): string[] => {
  const live = liveLocationIds(a, list);
  if (live.length) return live;
  const fallback = defaultLocationId(a, list);
  return fallback ? [fallback] : [];
};

const scope = (a: Assessment, listId?: string) =>
  listId ? a.checklists.filter((c) => c.id === listId) : a.checklists;

/** A "Hayır" item with no linked row; rows made before links existed count when their hazard text matches. */
export const isUntransferred = (a: Assessment, list: Checklist, item: ChecklistItem): boolean =>
  item.answer === "no" &&
  rowsForItem(a, list.id, item.id).length === 0 &&
  !a.locations.some((l) =>
    l.rows.some((r) => !r.sources?.length && r.hazard === hazardOf(list, item)),
  );

const pending = (a: Assessment, list: Checklist) =>
  list.items.filter((i) => isUntransferred(a, list, i));

/** Deficiencies ("Hayır" items) that have no risk row yet. */
export const countUntransferred = (a: Assessment, listId?: string): number =>
  scope(a, listId).reduce((n, c) => n + pending(a, c).length, 0);

export function transferMissing(a: Assessment, listId?: string): TransferResult {
  let assessment = a;
  let created = 0;
  let skippedNoLocation = 0;
  for (const list of scope(a, listId)) {
    const targets = targetsOf(a, list);
    for (const item of pending(a, list)) {
      if (!targets.length) skippedNoLocation += 1;
      for (const locationId of targets) {
        assessment = riskRowFromChecklistItem(assessment, list.id, item.id, locationId);
        created += 1;
      }
    }
  }
  return { assessment, created, skippedNoLocation };
}
