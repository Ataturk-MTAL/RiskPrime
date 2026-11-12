// "Eksikleri risk tablosuna aktar" for ONE inspection (a list in one location), unlike transfer.ts
// which sweeps every inspection of a list.
import { defaultLocationId, riskRowFromChecklistItem } from "./checklist-risk";
import { findInspection } from "./inspections";
import { isUntransferred, type TransferResult } from "./transfer";
import type { Assessment, ChecklistItem } from "./types";

function pendingItems(a: Assessment, listId: string, locationId: string | null): ChecklistItem[] {
  const list = a.checklists.find((c) => c.id === listId);
  const insp = findInspection(a, listId, locationId);
  return list && insp ? list.items.filter((i) => isUntransferred(a, list, i, insp)) : [];
}

/** "Hayır" items of the inspection that have no risk row yet. */
export const countUntransferredInspection = (
  a: Assessment,
  listId: string,
  locationId: string | null,
): number => pendingItems(a, listId, locationId).length;

/** Creates a linked risk row (in the inspection's location) for every pending "Hayır" item. */
export function transferInspection(
  a: Assessment,
  listId: string,
  locationId: string | null,
): TransferResult {
  const list = a.checklists.find((c) => c.id === listId);
  const items = pendingItems(a, listId, locationId);
  const target = list ? (locationId ?? defaultLocationId(a, list)) : "";
  if (!list || !target) return { assessment: a, created: 0, skippedNoLocation: items.length };
  return {
    assessment: items.reduce(
      (acc, item) => riskRowFromChecklistItem(acc, listId, item.id, locationId, target),
      a,
    ),
    created: items.length,
    skippedNoLocation: 0,
  };
}
