// Question bank (compiled from content/questions/*.toml): MEB items plus RiskPrime's own. Pure helpers.
import bankData from "../data/questions.json";
import { newItem } from "./checklist";
import type { Assessment, BankQuestion, BankSource, CommonItem, LocationType } from "./types";

const norm = (s: string) => s.toLocaleLowerCase("tr");

const bank = bankData as { version: string; items: BankQuestion[]; common?: CommonItem[] };

export { BANK_VERSION } from "./bank-version";

let cached: BankQuestion[] | null = null;

/** MEB questions first, then the RiskPrime ones (order fixed by scripts/build-bank.mjs); each key appears once. */
export function loadBank(): BankQuestion[] {
  cached ??= bank.items;
  return cached;
}

/** Common item groups (questions in different lists that ask the same thing). */
export function loadCommon(): CommonItem[] {
  return bank.common ?? [];
}

export function commonById(id: string): CommonItem | undefined {
  return loadCommon().find((c) => c.id === id);
}

/** Questions matching every word of the query (key, text, basis), the tag and the source. */
export function searchBank(
  query: string,
  filter: { tags?: LocationType[]; source?: BankSource } = {},
  bank: BankQuestion[] = loadBank(),
): BankQuestion[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  const tags = filter.tags ?? [];
  return bank.filter((q) => {
    if (filter.source && q.source !== filter.source) return false;
    if (tags.length && !tags.some((t) => q.tags.includes(t))) return false;
    const haystack = norm(`${q.key} ${q.text} ${q.basis ?? ""}`);
    return words.every((w) => haystack.includes(w));
  });
}

/** Appends the bank questions to a list, skipping keys the list already has. Unknown keys throw. */
export function addBankQuestions(
  a: Assessment,
  listId: string,
  keys: string[],
  bank: BankQuestion[] = loadBank(),
): Assessment {
  const list = a.checklists.find((l) => l.id === listId);
  if (!list) throw new Error(`Kontrol listesi bulunamadı: ${listId}`);
  const have = new Set(list.items.map((i) => i.ref));
  const wanted = [...new Set(keys)].filter((k) => !have.has(k));
  const questions = wanted.map((k) => {
    const q = bank.find((b) => b.key === k);
    if (!q) throw new Error(`Kontrol listesi maddesi bulunamadı: ${k}`);
    return q;
  });
  const items = questions.reduce(
    (acc, q) => [
      ...acc,
      {
        ...newItem(acc.length + 1, q.text, list.source === "external", q.key),
        fromBank: true as const,
      },
    ],
    list.items,
  );
  return {
    ...a,
    checklists: a.checklists.map((l) => (l.id === listId ? { ...l, items } : l)),
  };
}
