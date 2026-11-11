// Turns a "Hayır" checklist item into a risk row.
import { addRow } from "./assessment";
import type { Assessment, Checklist, ChecklistItem } from "./types";

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

const hazardOf = (list: Checklist, item: ChecklistItem) => `${item.text} (${list.code}.${item.no})`;

export function hasChecklistRisk(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string,
): boolean {
  const { list, item } = find(a, listId, itemId);
  const hazard = hazardOf(list, item);
  return !!a.locations.find((l) => l.id === locationId)?.rows.some((r) => r.hazard === hazard);
}

export function riskRowFromChecklistItem(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string,
): Assessment {
  const { list, item } = find(a, listId, itemId);
  if (!a.locations.some((l) => l.id === locationId))
    throw new Error(`Mekân bulunamadı: ${locationId}`);
  return addRow(a, locationId, { hazard: hazardOf(list, item), action: item.note });
}

/** A location whose name matches the list's name or code, else the first one. */
export function defaultLocationId(a: Assessment, list: Checklist): string {
  const norm = (s: string) => s.toLocaleLowerCase("tr").trim();
  const keys = [list.name, list.code].map(norm).filter(Boolean);
  const match = a.locations.find((l) => {
    const n = norm(l.name);
    return n && keys.some((k) => k.includes(n) || n.includes(k));
  });
  return (match ?? a.locations[0])?.id ?? "";
}
