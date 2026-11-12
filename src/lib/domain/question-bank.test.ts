import { describe, expect, test } from "vite-plus/test";
import library from "../data/library.json";
import starter from "../data/starter.json";
import { addChecklist } from "./checklist";
import { emptyAssessment } from "./assessment";
import { validate } from "./file";
import { sourceLabel } from "./links";
import { addBankQuestions, loadBank, searchBank } from "./question-bank";
import type { ChecklistTemplate } from "./types";

const lists = (library as unknown as { checklists: ChecklistTemplate[] }).checklists;
const mebLists = lists.filter((l) => l.source === "external");
const bank = loadBank();
const byKey = new Map(bank.map((q) => [q.key, q]));

describe("bank contents", () => {
  test("has unique keys, MEB first then RiskPrime", () => {
    expect(byKey.size).toBe(bank.length);
    expect(bank.filter((q) => q.source === "meb")).toHaveLength(783);
    const ee = bank.filter((q) => q.source === "riskprime");
    expect(ee.length).toBeGreaterThanOrEqual(30);
    expect(ee.every((q) => /^EE-\d{2}$/.test(q.key) && q.basis)).toBe(true);
  });

  test("every library MEB item resolves with identical text", () => {
    for (const l of mebLists)
      for (const i of l.items) {
        expect(byKey.get(i.ref ?? "")?.text).toBe(i.text);
        expect(i.ref).toBe(`${l.code}.${i.no.split(".")[1]}`);
      }
  });

  test("every ref in library school lists and in the starter resolves", () => {
    const schoolRefs = lists.filter((l) => l.source === "internal").flatMap((l) => l.items);
    const starterRefs = starter.checklists.flatMap((l) => l.items);
    for (const i of [...schoolRefs, ...starterRefs])
      if (i.ref) expect(byKey.has(i.ref), i.ref).toBe(true);
    expect(starterRefs.filter((i) => i.ref).length).toBeGreaterThan(20);
  });

  test("school items citing (KL-xx.yy) carry that ref", () => {
    const item = starter.checklists
      .flatMap((l) => l.items)
      .find((i) => i.text.includes("(KL-26.06)"));
    expect(item?.ref).toBe("KL-26.06");
  });
});

describe("searchBank", () => {
  test("matches Turkish capitals case-insensitively", () => {
    expect(searchBank("İSTASYON").some((q) => q.key === "EE-02")).toBe(true);
    expect(searchBank("ıslak").length).toBe(searchBank("ISLAK").length);
  });

  test("matches key and basis, all words required", () => {
    expect(searchBank("KL-26.06").map((q) => q.key)).toContain("KL-26.06");
    expect(searchBank("61340").every((q) => q.basis?.includes("61340"))).toBe(true);
    expect(searchBank("lehim zzzz")).toEqual([]);
  });

  test("filters by source and tag", () => {
    expect(searchBank("", { source: "riskprime" }).every((q) => q.source === "riskprime")).toBe(
      true,
    );
    const wet = searchBank("", { tags: ["wet"] });
    expect(wet.length).toBeGreaterThan(0);
    expect(wet.every((q) => q.tags.includes("wet"))).toBe(true);
  });
});

const withList = (source: "internal" | "external") =>
  addChecklist(emptyAssessment("2026-2027"), {
    code: source === "external" ? "KL-26" : "",
    name: "Liste",
    source,
    items: [{ no: "1", text: "Var olan", ref: "EE-01" }],
  });

describe("addBankQuestions", () => {
  test("appends items with ref, numbered after the last, skipping keys already present", () => {
    const a = withList("internal");
    const id = a.checklists[0].id;
    const next = addBankQuestions(a, id, ["EE-01", "EE-02", "KL-26.06", "EE-02"]);
    const items = next.checklists[0].items;
    expect(items.map((i) => [i.no, i.ref])).toEqual([
      ["1", "EE-01"],
      ["2", "EE-02"],
      ["3", "KL-26.06"],
    ]);
    expect(items[2].text).toBe(byKey.get("KL-26.06")?.text);
    expect(items[1].added).toBeUndefined();
    expect(validate(next)).toEqual([]);
  });

  test("marks items added on MEB lists and does not mutate the input", () => {
    const a = withList("external");
    const before = JSON.stringify(a);
    const next = addBankQuestions(a, a.checklists[0].id, ["EE-03"]);
    expect(next.checklists[0].items[1].added).toBe(true);
    expect(JSON.stringify(a)).toBe(before);
  });

  test("throws for unknown list or key", () => {
    const a = withList("internal");
    expect(() => addBankQuestions(a, "yok", ["EE-01"])).toThrow(/bulunamadı/);
    expect(() => addBankQuestions(a, a.checklists[0].id, ["XX-99"])).toThrow(/XX-99/);
  });
});

describe("ref in the model", () => {
  test("addChecklist keeps template refs and the file validator accepts them", () => {
    const a = withList("internal");
    expect(a.checklists[0].items[0].ref).toBe("EE-01");
    expect(validate(a)).toEqual([]);
  });

  test("validate rejects a non-string ref", () => {
    const a = withList("internal");
    const bad = structuredClone(a);
    (bad.checklists[0].items[0] as unknown as { ref: number }).ref = 5;
    expect(validate(bad)).toEqual(["checklists[0].items[0].ref: metin olmalı."]);
  });

  test("sourceLabel prefers the item ref", () => {
    const info = {
      listId: "k",
      itemId: "m",
      locationId: null,
      code: "KL-26",
      listName: "x",
      no: "26.06",
      answer: "" as const,
      text: "t",
    };
    expect(sourceLabel({ ...info, ref: "KL-26.06" })).toBe("KL-26.06");
    expect(sourceLabel({ ...info, ref: "EE-03", code: "" })).toBe("EE-03");
  });
});
