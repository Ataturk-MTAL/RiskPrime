// Turns a "Hayır" checklist item (an eksik of one inspection) into a risk row.
import { addRow } from "./assessment";
import { noSiblings, siblingTargets } from "./common-items";
import { answerOf, liveLocationIds, scopeName } from "./inspections";
import { rowsForItem, type ItemRow } from "./links";
import { loadBank } from "./question-bank";
import type { Assessment, BankQuestion, Checklist, ChecklistItem, RiskRow } from "./types";

/** Rows linked to the item or to any common sibling at the same location, each row once. */
export function itemRiskRows(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  bank: BankQuestion[] = loadBank(),
): ItemRow[] {
  const targets = [{ listId, itemId }, ...siblingTargets(a, listId, itemId, locationId, bank)];
  return targets
    .flatMap((t) => rowsForItem(a, t.listId, t.itemId, locationId))
    .filter((r, i, all) => all.findIndex((x) => x.rowId === r.rowId) === i);
}

/** True when the deficiency already has a row: linked via itself or a sibling, or a matching legacy row. */
export const hasDeficiencyRisk = (
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  rowLocationId?: string,
  bank: BankQuestion[] = loadBank(),
): boolean =>
  itemRiskRows(a, listId, itemId, locationId, bank).length > 0 ||
  hasChecklistRisk(a, listId, itemId, locationId, rowLocationId);

function find(
  a: Assessment,
  listId: string,
  itemId: string,
): { list: Checklist; item: ChecklistItem } {
  const list = a.checklists.find((c) => c.id === listId);
  const item = list?.items.find((m) => m.id === itemId);
  if (!list || !item) throw new Error(`Kontrol maddesi bulunamadı: ${listId}/${itemId}`);
  return { list, item };
}

/** Item text plus its MEB reference when the list has a code; the link itself is kept in row.sources. */
export const hazardOf = (list: Checklist, item: ChecklistItem) =>
  list.code.trim() ? `${item.text} (${item.ref ?? `${list.code.trim()}.${item.no}`})` : item.text;

/** Location whose rows receive the risk row: the inspection's own location, else the chosen one. */
function rowLocation(a: Assessment, locationId: string | null, rowLocationId?: string): string {
  const target = locationId ?? rowLocationId;
  if (target === undefined || !a.locations.some((l) => l.id === target))
    throw new Error(`Mekân bulunamadı: ${target ?? scopeName(a, null)}`);
  return target;
}

/**
 * True when the row location already has a row for the item of that inspection (locationId = the
 * inspection's scope, null = okul geneli; rowLocationId = where the row lives, needed for okul geneli).
 * Rows without links count when their hazard text matches.
 */
export function hasChecklistRisk(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  rowLocationId?: string,
): boolean {
  const { list, item } = find(a, listId, itemId);
  const hazard = hazardOf(list, item);
  const linked = (r: RiskRow) =>
    r.sources?.length
      ? r.sources.some(
          (s) => s.listId === listId && s.itemId === itemId && s.locationId === locationId,
        )
      : r.hazard === hazard;
  const target = locationId ?? rowLocationId;
  return !!a.locations.find((l) => l.id === target)?.rows.some(linked);
}

/** Adds a risk row for the item of that inspection; for okul geneli pass the location to put it in. */
export function riskRowFromChecklistItem(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  rowLocationId?: string,
): Assessment {
  const { list, item } = find(a, listId, itemId);
  const target = rowLocation(a, locationId, rowLocationId);
  return addRow(a, target, {
    hazard: hazardOf(list, item),
    action: answerOf(a, listId, locationId, itemId).note,
    // common siblings answered "Hayır" at this location share the one row
    sources: [{ listId, itemId }, ...noSiblings(a, listId, itemId, locationId)].map((t) => ({
      ...t,
      locationId,
    })),
  });
}

/** A location whose name matches the list's name or code, else the first one. */
export function defaultLocationId(a: Assessment, list: Checklist): string {
  const linked = liveLocationIds(a, list)[0];
  if (linked) return linked;
  const norm = (s: string) => s.toLocaleLowerCase("tr").trim();
  const keys = [list.name, list.code].map(norm).filter(Boolean);
  const match = a.locations.find((l) => {
    const n = norm(l.name);
    return n && keys.some((k) => k.includes(n) || n.includes(k));
  });
  return (match ?? a.locations[0])?.id ?? "";
}
