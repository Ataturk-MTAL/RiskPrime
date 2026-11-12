// Finds where a school's checklists lag behind the shared question bank, and applies chosen updates.
import { addBankQuestions, loadBank } from "./question-bank";
import type { Assessment, BankQuestion } from "./types";

export interface UpdatedItem {
  listId: string;
  listName: string;
  itemId: string;
  key: string;
  oldText: string;
  newText: string;
}
export interface AddedQuestion {
  listId: string;
  listName: string;
  key: string;
  text: string;
}
export interface BankChanges {
  updated: UpdatedItem[];
  added: AddedQuestion[];
}
export interface BankSelection {
  itemIds: string[];
  addedKeys: { listId: string; key: string }[];
}

export const hasBankChanges = (c: BankChanges): boolean => c.updated.length + c.added.length > 0;

/** Items whose bank text differs, and bank questions of the same MEB list code the list lacks. */
export function bankChanges(a: Assessment, bank: BankQuestion[] = loadBank()): BankChanges {
  const byKey = new Map(bank.map((b) => [b.key, b]));
  const updated = a.checklists.flatMap((l) =>
    l.items.flatMap((i) => {
      const q = i.ref && (l.source === "external" || i.fromBank) ? byKey.get(i.ref) : undefined;
      if (!q || q.text.trim() === i.text.trim()) return [];
      return [
        {
          listId: l.id,
          listName: l.name,
          itemId: i.id,
          key: q.key,
          oldText: i.text,
          newText: q.text,
        },
      ];
    }),
  );
  const added = a.checklists.flatMap((l) => {
    const have = new Set(l.items.map((i) => i.ref));
    return bank
      .filter((b) => b.source === "meb" && b.listCode === l.code && !have.has(b.key))
      .map((b) => ({ listId: l.id, listName: l.name, key: b.key, text: b.text }));
  });
  return { updated, added };
}

/** Applies the chosen updates and additions; unknown ids and keys are ignored. */
export function applyBankChanges(
  a: Assessment,
  { itemIds, addedKeys }: BankSelection,
  bank: BankQuestion[] = loadBank(),
): Assessment {
  const ids = new Set(itemIds);
  const byKey = new Map(bank.map((b) => [b.key, b]));
  const replaced: Assessment = {
    ...a,
    checklists: a.checklists.map((l) => ({
      ...l,
      items: l.items.map((i) => {
        const q = ids.has(i.id) && i.ref ? byKey.get(i.ref) : undefined;
        return q ? { ...i, text: q.text, fromBank: true as const } : i;
      }),
    })),
  };
  return addedKeys.reduce((acc, { listId, key }) => {
    if (!byKey.has(key) || !acc.checklists.some((l) => l.id === listId)) return acc;
    return addBankQuestions(acc, listId, [key], bank);
  }, replaced);
}
