import { describe, expect, test } from "vite-plus/test";
import { emptyAssessment } from "./assessment";
import { applyBankChanges, bankChanges, hasBankChanges } from "./bank-sync";
import { addChecklist, updateItem } from "./checklist";
import { addBankQuestions } from "./question-bank";
import type { Assessment, BankQuestion } from "./types";

const q = (key: string, text: string, listCode?: string): BankQuestion => ({
  key,
  text,
  source: listCode ? "meb" : "riskprime",
  ...(listCode ? { listCode } : {}),
  tags: [],
});

const bank = [
  q("KL-01.01", "Yeni metin", "KL-01"),
  q("KL-01.02", "Aynı metin", "KL-01"),
  q("KL-01.03", "Eklenen soru", "KL-01"),
  q("KL-02.01", "Başka liste", "KL-02"),
  q("EE-01", "EE sorusu"),
];

const make = (code = "KL-01"): Assessment =>
  addChecklist(emptyAssessment("2026-2027"), {
    code,
    name: "Liste",
    source: "external",
    items: [
      { no: "1", text: "Eski metin", ref: "KL-01.01" },
      { no: "2", text: "  Aynı metin ", ref: "KL-01.02" },
      { no: "3", text: "Referanssız" },
      { no: "4", text: "Bankada yok", ref: "KL-99.01" },
    ],
  });

describe("bankChanges", () => {
  test("detects changed text, ignores identical, ref-less and unknown refs", () => {
    const c = bankChanges(make(), bank);
    expect(c.updated.map((u) => [u.key, u.oldText, u.newText])).toEqual([
      ["KL-01.01", "Eski metin", "Yeni metin"],
    ]);
  });

  test("detects added questions only for the matching list code", () => {
    const c = bankChanges(make(), bank);
    expect(c.added.map((x) => x.key)).toEqual(["KL-01.03"]);
    expect(bankChanges(make("OZEL"), bank).added).toEqual([]);
  });

  test("hasBankChanges reflects content", () => {
    expect(hasBankChanges(bankChanges(make(), bank))).toBe(true);
    expect(hasBankChanges(bankChanges(emptyAssessment("x"), bank))).toBe(false);
  });
});

describe("applyBankChanges", () => {
  test("replaces text keeping the item id, appends keys, leaves the original untouched", () => {
    const a = make();
    const list = a.checklists[0];
    const item = list.items[0];
    const next = applyBankChanges(
      a,
      { itemIds: [item.id], addedKeys: [{ listId: list.id, key: "KL-01.03" }] },
      bank,
    );
    const items = next.checklists[0].items;
    expect(items[0]).toMatchObject({ id: item.id, text: "Yeni metin" });
    expect(items.at(-1)).toMatchObject({ ref: "KL-01.03", text: "Eklenen soru" });
    expect(a.checklists[0].items[0].text).toBe("Eski metin");
    expect(a.checklists[0].items).toHaveLength(4);
  });

  test("ignores unknown ids and keys", () => {
    const a = make();
    const next = applyBankChanges(
      a,
      { itemIds: ["nope"], addedKeys: [{ listId: "nope", key: "KL-01.03" }] },
      bank,
    );
    expect(next.checklists[0].items).toEqual(a.checklists[0].items);
  });
});

describe("fromBank", () => {
  const internal = (fromBank: boolean): Assessment => {
    const a = addChecklist(emptyAssessment("2026-2027"), {
      code: "OZEL",
      name: "Okul listesi",
      source: "internal",
      items: [{ no: "1", text: "Okulun kısa ifadesi", ref: "KL-01.01" }],
    });
    if (!fromBank) return a;
    const l = a.checklists[0];
    return {
      ...a,
      checklists: [{ ...l, items: l.items.map((i) => ({ ...i, fromBank: true as const })) }],
    };
  };

  test("internal item with a ref but school wording is not flagged", () => {
    expect(bankChanges(internal(false), bank).updated).toEqual([]);
  });

  test("internal item flagged fromBank is flagged when text differs", () => {
    expect(bankChanges(internal(true), bank).updated).toHaveLength(1);
  });

  test("editing text drops fromBank without mutating the original", () => {
    const a = internal(true);
    const l = a.checklists[0];
    const next = updateItem(a, l.id, l.items[0].id, { text: "Yeni okul metni" });
    expect(next.checklists[0].items[0].fromBank).toBeUndefined();
    expect(l.items[0].fromBank).toBe(true);
  });

  test("addBankQuestions sets fromBank", () => {
    const a = internal(false);
    const next = addBankQuestions(a, a.checklists[0].id, ["KL-01.03"], bank);
    expect(next.checklists[0].items.at(-1)?.fromBank).toBe(true);
  });
});
