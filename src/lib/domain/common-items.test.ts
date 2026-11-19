import { describe, expect, test } from "vite-plus/test";
import { addLocation, emptyAssessment } from "./assessment";
import { answerOf, deficiencies, ensureInspections } from "./inspections";
import {
  commonOfItem,
  mergeCommonDeficiencies,
  setAnswerShared,
  setNoteShared,
  siblingTargets,
} from "./common-items";
import { deficienciesWithState } from "./filters";
import { countUntransferred, transferMissing } from "./transfer";
import { withAnswers } from "./test-helpers";
import type { Assessment, BankQuestion } from "./types";

const q = (key: string, common?: string): BankQuestion => ({
  key,
  text: key,
  source: "meb",
  tags: [],
  ...(common ? { common } : {}),
});
const BANK = [q("KL-01.17", "X"), q("KL-04.07", "X"), q("KL-05.05", "X"), q("KL-01.01")];

function sample(): Assessment {
  const a = addLocation(emptyAssessment("2026-2027"), { id: "l1", name: "Depo" });
  return ensureInspections({
    ...a,
    checklists: [
      {
        id: "ka",
        code: "A",
        name: "A",
        source: "external",
        items: [{ id: "a1", no: "1", text: "x", ref: "KL-01.17" }],
        locationIds: ["l1"],
      },
      {
        id: "kb",
        code: "B",
        name: "B",
        source: "external",
        items: [
          { id: "b1", no: "1", text: "x", ref: "KL-04.07" },
          { id: "b2", no: "2", text: "y", ref: "KL-01.01" },
        ],
        locationIds: ["l1"],
      },
      {
        id: "kc",
        code: "C",
        name: "C",
        source: "external",
        items: [{ id: "c1", no: "1", text: "x", ref: "KL-05.05" }],
        locationIds: ["l1"],
      },
    ],
  });
}

describe("common items", () => {
  test("commonOfItem reads the bank question", () => {
    const a = sample();
    expect(commonOfItem(a.checklists[0].items[0], BANK)).toBe("X");
    expect(commonOfItem(a.checklists[1].items[1], BANK)).toBeUndefined();
    expect(commonOfItem({ id: "z", no: "1", text: "" }, BANK)).toBeUndefined();
  });

  test("siblingTargets: same location, other inspections only", () => {
    const a = sample();
    expect(siblingTargets(a, "ka", "a1", "l1", BANK)).toEqual([
      { listId: "kb", itemId: "b1" },
      { listId: "kc", itemId: "c1" },
    ]);
    expect(siblingTargets(a, "ka", "a1", null, BANK)).toEqual([]);
    expect(siblingTargets(a, "kb", "b2", "l1", BANK)).toEqual([]);
  });

  test("siblingTargets matches okul geneli (null) siblings", () => {
    const base = sample();
    const a = ensureInspections({
      ...base,
      checklists: base.checklists.map(({ locationIds: _l, ...c }) => c),
    });
    expect(siblingTargets(a, "ka", "a1", null, BANK)).toHaveLength(2);
  });

  test("setAnswerShared and setNoteShared write through immutably", () => {
    const a = sample();
    const b = setNoteShared(
      setAnswerShared(a, "ka", "l1", "a1", "no", BANK),
      "ka",
      "l1",
      "a1",
      "not",
      BANK,
    );
    for (const [l, i] of [
      ["ka", "a1"],
      ["kb", "b1"],
      ["kc", "c1"],
    ]) {
      expect(answerOf(b, l, "l1", i)).toMatchObject({ answer: "no", note: "not" });
    }
    expect(answerOf(b, "kb", "l1", "b2").answer).toBe("");
    expect(answerOf(a, "kb", "l1", "b1").answer).toBe("");
  });

  test("the new answer overwrites a conflicting sibling", () => {
    const a = withAnswers(sample(), "kb", "l1", { b1: "yes" });
    expect(
      answerOf(setAnswerShared(a, "ka", "l1", "a1", "no", BANK), "kb", "l1", "b1").answer,
    ).toBe("no");
  });

  test("a non-common item writes only itself", () => {
    const b = setAnswerShared(sample(), "kb", "l1", "b2", "no", BANK);
    expect(answerOf(b, "ka", "l1", "a1").answer).toBe("");
  });
});

describe("common deficiencies and transfer", () => {
  const answered = () => setAnswerShared(sample(), "ka", "l1", "a1", "no", BANK);

  test("one deficiency lists every source", () => {
    const merged = mergeCommonDeficiencies(answered(), deficiencies(answered()), BANK);
    expect(merged).toHaveLength(1);
    expect(merged[0].listId).toBe("ka");
    expect(merged[0].siblings?.map((s) => s.ref)).toEqual(["KL-04.07", "KL-05.05"]);
  });

  test("conflicting sibling is left alone: only the real Hayır shows", () => {
    const a = withAnswers(sample(), "kb", "l1", { b1: "no" });
    const merged = mergeCommonDeficiencies(a, deficiencies(a), BANK);
    expect(merged.map((d) => d.listId)).toEqual(["kb"]);
    expect(merged[0].siblings).toBeUndefined();
  });

  test("bulk transfer makes one row with every sibling as source", () => {
    const r = transferMissing(answered());
    expect(r.created).toBe(1);
    const rows = r.assessment.locations[0].rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].sources).toHaveLength(3);
    expect(countUntransferred(r.assessment)).toBe(0);
    expect(transferMissing(r.assessment).created).toBe(0);
  });

  test("count matches bulk transfer, also for a list-scoped run", () => {
    expect(countUntransferred(answered())).toBe(1);
    const scoped = transferMissing(answered(), "kc");
    expect(scoped.created).toBe(1);
    expect(countUntransferred(scoped.assessment)).toBe(0);
  });

  test("deficienciesWithState reports the merged deficiency transferred after one transfer", () => {
    const before = deficienciesWithState(answered());
    expect(before).toHaveLength(1);
    expect(before[0].transferred).toBe(false);
    const after = deficienciesWithState(transferMissing(answered()).assessment);
    expect(after).toHaveLength(1);
    expect(after[0].transferred).toBe(true);
  });
});
