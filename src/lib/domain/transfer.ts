// Bulk "eksik -> risk satiri": every "Hayir" item of an inspection without a linked row gets a row,
// in the inspection's own location (okul geneli inspections use the list's default location).
import { defaultLocationId, hazardOf, riskRowFromChecklistItem } from "./checklist-risk";
import { rowsForItem } from "./links";
import type { Assessment, Checklist, ChecklistItem, Inspection } from "./types";

export interface TransferResult {
  assessment: Assessment;
  created: number;
  skippedNoLocation: number;
}

const targetOf = (a: Assessment, list: Checklist, insp: Inspection): string =>
  insp.locationId ?? defaultLocationId(a, list);

const scope = (a: Assessment, listId?: string): Inspection[] =>
  listId ? a.inspections.filter((i) => i.checklistId === listId) : a.inspections;

/** A "Hayır" item of the inspection with no linked row; rows made before links existed count when their hazard text matches. */
export const isUntransferred = (
  a: Assessment,
  list: Checklist,
  item: ChecklistItem,
  insp: Inspection,
): boolean => {
  if (insp.answers.find((x) => x.itemId === item.id)?.answer !== "no") return false;
  if (rowsForItem(a, list.id, item.id, insp.locationId).length > 0) return false;
  const target = targetOf(a, list, insp);
  return !a.locations.some(
    (l) =>
      l.id === target &&
      l.rows.some((r) => !r.sources?.length && r.hazard === hazardOf(list, item)),
  );
};

/** Pending (inspection, item) pairs of one list's inspection. */
const pending = (a: Assessment, insp: Inspection): ChecklistItem[] => {
  const list = a.checklists.find((c) => c.id === insp.checklistId);
  return list ? list.items.filter((i) => isUntransferred(a, list, i, insp)) : [];
};

/** Deficiencies ("Hayır" items) that have no risk row yet, over the given list's inspections or all. */
export const countUntransferred = (a: Assessment, listId?: string): number =>
  scope(a, listId).reduce((n, insp) => n + pending(a, insp).length, 0);

export function transferMissing(a: Assessment, listId?: string): TransferResult {
  let assessment = a;
  let created = 0;
  let skippedNoLocation = 0;
  for (const insp of scope(a, listId)) {
    const list = a.checklists.find((c) => c.id === insp.checklistId);
    if (!list) continue;
    const target = targetOf(a, list, insp);
    for (const item of pending(a, insp)) {
      if (!target) {
        skippedNoLocation += 1;
        continue;
      }
      assessment = riskRowFromChecklistItem(assessment, list.id, item.id, insp.locationId, target);
      created += 1;
    }
  }
  return { assessment, created, skippedNoLocation };
}
