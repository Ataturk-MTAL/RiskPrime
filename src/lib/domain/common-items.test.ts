import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment } from "./assessment";
import { hasDeficiencyRisk, itemRiskRows, similarRows } from "./checklist-risk";
import { answerOf, deficiencies, ensureInspections } from "./inspections";
import {
  commonOfItem,
  mergeCommonDeficiencies,
  setAnswerShared,
  setNoteShared,
  siblingTargets,
} from "./common-items";
import { deficienciesWithState } from "./filters";
import { addRowSource } from "./links";
import { addRowsForDeficiencies, countUntransferred, transferMissing } from "./transfer";
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

  test("siblingTargets matches school-wide (null) siblings", () => {
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

  /** B's common item linked on its own to a fresh row "r1" in l1 (A and C stay unlinked). */
  const siblingLinked = () =>
    addRowSource(addRow(answered(), "l1", { id: "r1" }), "l1", "r1", {
      listId: "kb",
      itemId: "b1",
      locationId: "l1",
    });

  test("a sibling linked on its own counts as the item's row (hides Riske ekle)", () => {
    // Arrange
    const a = siblingLinked();

    // Act
    const rows = itemRiskRows(a, "ka", "a1", "l1", BANK);

    // Assert
    expect(rows.map((r) => r.rowId)).toEqual(["r1"]);
    expect(hasDeficiencyRisk(a, "ka", "a1", "l1", "l1", BANK)).toBe(true);
    expect(hasDeficiencyRisk(answered(), "ka", "a1", "l1", "l1", BANK)).toBe(false);
  });

  test("a row linked via a sibling is not suggested as a similar row", () => {
    // Arrange: r1 reads exactly like A's item and is linked only to the sibling B at l1
    const hazard = "x (KL-01.17)";
    const unlinked = addRow(answered(), "l1", { id: "r1", hazard });
    const linked = addRowSource(unlinked, "l1", "r1", {
      listId: "kb",
      itemId: "b1",
      locationId: "l1",
    });

    // Act
    const before = similarRows(unlinked, "ka", "a1", "l1", "l1", BANK);
    const after = similarRows(linked, "ka", "a1", "l1", "l1", BANK);

    // Assert
    expect(before.map((h) => h.rowId)).toEqual(["r1"]);
    expect(after).toEqual([]);
  });

  test("item rows list a row linked to several siblings once", () => {
    // Arrange: one row made from A carries A, B and C as sources
    const a = transferMissing(answered()).assessment;

    // Act
    const rows = itemRiskRows(a, "ka", "a1", "l1", BANK);

    // Assert
    expect(rows).toHaveLength(1);
  });

  test("bulk add from deficiencies: a second run creates no rows", () => {
    // Arrange
    const targets = [{ listId: "ka", itemId: "a1", locationId: "l1", target: "l1" }];
    const first = addRowsForDeficiencies(answered(), targets, BANK);

    // Act
    const second = addRowsForDeficiencies(first.assessment, targets, BANK);

    // Assert
    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    expect(second.assessment).toBe(first.assessment);
  });

  test("bulk add from deficiencies: common siblings in one run share one row", () => {
    // Arrange
    const targets = ["ka:a1", "kb:b1", "kc:c1"].map((t) => {
      const [listId, itemId] = t.split(":");
      return { listId, itemId, locationId: "l1", target: "l1" };
    });

    // Act
    const r = addRowsForDeficiencies(answered(), targets, BANK);

    // Assert
    expect(r.created).toBe(1);
    expect(r.assessment.locations[0].rows).toHaveLength(1);
  });

  test("bulk add from deficiencies skips an item whose sibling is already linked", () => {
    // Arrange
    const a = siblingLinked();

    // Act
    const r = addRowsForDeficiencies(
      a,
      [{ listId: "ka", itemId: "a1", locationId: "l1", target: "l1" }],
      BANK,
    );

    // Assert
    expect(r.created).toBe(0);
    expect(r.assessment.locations[0].rows).toHaveLength(1);
  });

  test("bulk add from deficiencies uses the given bank for the sources of the new row", () => {
    // Arrange: a bank where the three items are not common siblings
    const noCommon = [q("KL-01.17"), q("KL-04.07"), q("KL-05.05")];
    const targets = [{ listId: "ka", itemId: "a1", locationId: "l1", target: "l1" }];

    // Act
    const r = addRowsForDeficiencies(answered(), targets, noCommon);

    // Assert
    expect(r.assessment.locations[0].rows[0].sources).toHaveLength(1);
  });
});
