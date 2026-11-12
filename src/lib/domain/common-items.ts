// Common items: the same question asked by several MEB lists (bank question `common: "OM-04"`).
// At one location such an item is answered once, listed as one deficiency and transferred as one row.
import { setAnswer, setNote } from "./checklist";
import { answerOf, type Deficiency } from "./inspections";
import { loadBank } from "./question-bank";
import type { Answer, Assessment, BankQuestion, ChecklistItem } from "./types";

export interface ItemTarget {
  listId: string;
  itemId: string;
}

const commonByKey = new WeakMap<BankQuestion[], Map<string, string>>();

function commonIndex(bank: BankQuestion[]): Map<string, string> {
  const found = commonByKey.get(bank);
  if (found) return found;
  const index = new Map(bank.flatMap((q) => (q.common ? [[q.key, q.common] as const] : [])));
  commonByKey.set(bank, index);
  return index;
}

/** Common item id of a checklist item (via its bank key), if any. */
export const commonOfItem = (
  item: ChecklistItem,
  bank: BankQuestion[] = loadBank(),
): string | undefined => (item.ref ? commonIndex(bank).get(item.ref) : undefined);

/** Items of OTHER inspections at the SAME location (null = okul geneli) that share the item's common id. */
export function siblingTargets(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  bank: BankQuestion[] = loadBank(),
): ItemTarget[] {
  const item = a.checklists.find((c) => c.id === listId)?.items.find((i) => i.id === itemId);
  const common = item && commonOfItem(item, bank);
  if (!common) return [];
  return a.inspections.flatMap((insp) => {
    if (insp.locationId !== locationId || insp.checklistId === listId) return [];
    const list = a.checklists.find((c) => c.id === insp.checklistId);
    return (list?.items ?? [])
      .filter((i) => commonOfItem(i, bank) === common)
      .map((i) => ({ listId: insp.checklistId, itemId: i.id }));
  });
}

function writeThrough(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
  bank: BankQuestion[],
  apply: (acc: Assessment, t: ItemTarget) => Assessment,
): Assessment {
  const targets = siblingTargets(a, listId, itemId, locationId, bank);
  return targets.reduce(apply, apply(a, { listId, itemId }));
}

/** setAnswer that also sets the answer on the item's siblings at the same location (overwrites them). */
export function setAnswerShared(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
  answer: Answer,
  bank: BankQuestion[] = loadBank(),
): Assessment {
  return writeThrough(a, listId, locationId, itemId, bank, (acc, t) =>
    setAnswer(acc, t.listId, locationId, t.itemId, answer),
  );
}

/** setNote that also sets the note on the item's siblings at the same location (overwrites them). */
export function setNoteShared(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
  note: string,
  bank: BankQuestion[] = loadBank(),
): Assessment {
  return writeThrough(a, listId, locationId, itemId, bank, (acc, t) =>
    setNote(acc, t.listId, locationId, t.itemId, note),
  );
}

/** The item plus its siblings that are answered "Hayır", in inspection order. */
function noMembers(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  bank: BankQuestion[],
): ItemTarget[] {
  const all = [{ listId, itemId }, ...siblingTargets(a, listId, itemId, locationId, bank)];
  const order = (t: ItemTarget) => a.inspections.findIndex((i) => i.checklistId === t.listId);
  return all
    .filter((t) => answerOf(a, t.listId, locationId, t.itemId).answer === "no")
    .sort((x, y) => order(x) - order(y));
}

/** "Hayır" siblings of an item at its location (excluding the item itself); extra risk-row sources. */
export const noSiblings = (
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  bank: BankQuestion[] = loadBank(),
): ItemTarget[] =>
  noMembers(a, listId, itemId, locationId, bank).filter(
    (t) => !(t.listId === listId && t.itemId === itemId),
  );

/** True when an earlier inspection's "Hayır" sibling already stands for this deficiency. */
export function isDuplicateDeficiency(
  a: Assessment,
  listId: string,
  itemId: string,
  locationId: string | null,
  bank: BankQuestion[] = loadBank(),
): boolean {
  const first = noMembers(a, listId, itemId, locationId, bank)[0];
  return !!first && !(first.listId === listId && first.itemId === itemId);
}

/** Deficiencies with common duplicates folded into the first one, which lists the others as siblings. */
export function mergeCommonDeficiencies(
  a: Assessment,
  all: Deficiency[],
  bank: BankQuestion[] = loadBank(),
): Deficiency[] {
  return all
    .filter((d) => !isDuplicateDeficiency(a, d.listId, d.itemId, d.locationId, bank))
    .map((d) => {
      const others = noSiblings(a, d.listId, d.itemId, d.locationId, bank);
      if (!others.length) return d;
      const siblings = others.map((t) => {
        const item = a.checklists
          .find((c) => c.id === t.listId)
          ?.items.find((i) => i.id === t.itemId);
        return { ...t, ref: item?.ref ?? "" };
      });
      const rowIds = all
        .filter((x) => x.locationId === d.locationId && others.some((t) => t.itemId === x.itemId))
        .flatMap((x) => x.rowIds);
      return { ...d, siblings, rowIds: [...new Set([...d.rowIds, ...rowIds])] };
    });
}
