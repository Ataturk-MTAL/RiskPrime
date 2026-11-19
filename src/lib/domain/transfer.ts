// Bulk "deficiency -> risk satiri": every "Hayir" item of an inspection without a linked row gets a row,
// in the inspection's own location (school-wide inspections use the list's default location).
import {
  defaultLocationId,
  hasDeficiencyRisk,
  hazardOf,
  riskRowFromChecklistItem,
} from "./checklist-risk";
import { isDuplicateDeficiency, siblingTargets } from "./common-items";
import { rowsForItem } from "./links";
import { loadBank } from "./question-bank";
import type { Assessment, BankQuestion, Checklist, ChecklistItem, Inspection } from "./types";

/** A deficiency of one inspection (locationId = its scope) and the location its row goes to. */
export interface DeficiencyTarget {
  listId: string;
  itemId: string;
  locationId: string | null;
  target: string;
}

/** One row per deficiency that has none yet; a common sibling added earlier in the run is skipped. */
export function addRowsForDeficiencies(
  a: Assessment,
  targets: DeficiencyTarget[],
  bank: BankQuestion[] = loadBank(),
): { assessment: Assessment; created: number } {
  return targets.reduce(
    (acc, t) =>
      hasDeficiencyRisk(acc.assessment, t.listId, t.itemId, t.locationId, t.target, bank)
        ? acc
        : {
            assessment: riskRowFromChecklistItem(
              acc.assessment,
              t.listId,
              t.itemId,
              t.locationId,
              t.target,
            ),
            created: acc.created + 1,
          },
    { assessment: a, created: 0 },
  );
}

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
  const linked = [
    { listId: list.id, itemId: item.id },
    ...siblingTargets(a, list.id, item.id, insp.locationId),
  ];
  if (linked.some((t) => rowsForItem(a, t.listId, t.itemId, insp.locationId).length > 0))
    return false;
  const target = targetOf(a, list, insp);
  return !a.locations.some(
    (l) =>
      l.id === target &&
      l.rows.some((r) => !r.sources?.length && r.hazard === hazardOf(list, item)),
  );
};

/** Untransferred items of one inspection. */
const pendingRaw = (a: Assessment, insp: Inspection): ChecklistItem[] => {
  const list = a.checklists.find((c) => c.id === insp.checklistId);
  return list ? list.items.filter((i) => isUntransferred(a, list, i, insp)) : [];
};

/** Like pendingRaw, but a common item an earlier inspection already stands for is skipped (counted once). */
export const pending = (a: Assessment, insp: Inspection): ChecklistItem[] =>
  pendingRaw(a, insp).filter(
    (i) => !isDuplicateDeficiency(a, insp.checklistId, i.id, insp.locationId),
  );

/** Deficiencies ("Hayır" items) that have no risk row yet, over the given list's inspections or all. */
export const countUntransferred = (a: Assessment, listId?: string): number => {
  const { created, skippedNoLocation } = transferMissing(a, listId);
  return created + skippedNoLocation;
};

/** One risk row per pending deficiency; a common item's siblings share the row (they count as transferred after it). */
export function transferMissing(a: Assessment, listId?: string): TransferResult {
  let assessment = a;
  let created = 0;
  let skippedNoLocation = 0;
  for (const insp of scope(a, listId)) {
    const list = a.checklists.find((c) => c.id === insp.checklistId);
    if (!list) continue;
    const target = targetOf(a, list, insp);
    for (const item of pendingRaw(assessment, insp)) {
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
