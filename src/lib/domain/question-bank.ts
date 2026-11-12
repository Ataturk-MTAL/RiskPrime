// Question bank: every MEB item plus the app's own Elektrik-Elektronik extension. Pure helpers.
import mebData from "../data/questions.json";
import extensionData from "../data/questions-ee.json";
import { newItem } from "./checklist";
import type { Assessment, BankQuestion, BankSource, LocationType } from "./types";

const norm = (s: string) => s.toLocaleLowerCase("tr");

const meb = mebData as { version: string; items: BankQuestion[] };

export { BANK_VERSION } from "./bank-version";

let cached: BankQuestion[] | null = null;

/** MEB questions first, then the RiskPrime extension; each key appears once. */
export function loadBank(): BankQuestion[] {
  cached ??= [...meb.items, ...(extensionData as BankQuestion[])];
  return cached;
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
    if (!q) throw new Error(`Soru bankasında bulunamadı: ${k}`);
    return q;
  });
  const items = questions.reduce(
    (acc, q) => [...acc, newItem(acc.length + 1, q.text, list.source === "external", q.key)],
    list.items,
  );
  return {
    ...a,
    checklists: a.checklists.map((l) => (l.id === listId ? { ...l, items } : l)),
  };
}
