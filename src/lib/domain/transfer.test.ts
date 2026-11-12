import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment } from "./assessment";
import { hazardOf } from "./checklist-risk";
import { ensureInspections } from "./inspections";
import { rowsForItem } from "./links";
import { countUntransferred, transferMissing } from "./transfer";
import { withAnswers } from "./test-helpers";
import type { Answer, Assessment, ChecklistItem } from "./types";

const item = (id: string): ChecklistItem => ({ id, no: id, text: `Madde ${id}` });
const ANSWERS: Record<string, Answer> = { m1: "no", m2: "yes", m3: "no" };

/** Every inspection of every list answered m1 no, m2 yes, m3 no. */
const answerAll = (a: Assessment): Assessment =>
  a.checklists.reduce(
    (acc, list) =>
      acc.inspections
        .filter((i) => i.checklistId === list.id)
        .reduce((x, i) => withAnswers(x, list.id, i.locationId, ANSWERS), acc),
    ensureInspections(a),
  );

function sample(locationIds?: string[]): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Atölye" });
  return answerAll({
    ...a,
    checklists: [
      {
        id: "k1",
        code: "KL-1",
        name: "Liste",
        source: "external",
        items: [item("m1"), item("m2"), item("m3")],
        ...(locationIds ? { locationIds } : {}),
      },
    ],
  });
}

describe("transferMissing", () => {
  test("creates one linked row per target location for every deficiency", () => {
    const { assessment, created, skippedNoLocation } = transferMissing(sample(["l1", "l2"]));
    expect(created).toBe(4);
    expect(skippedNoLocation).toBe(0);
    expect(rowsForItem(assessment, "k1", "m1", "l1")).toHaveLength(1);
    expect(rowsForItem(assessment, "k1", "m1", "l2")).toHaveLength(1);
    expect(rowsForItem(assessment, "k1", "m2", "l1")).toHaveLength(0);
    // each inspection's row lives in its own location
    expect(assessment.locations.map((l) => l.rows.length)).toEqual([2, 2]);
  });

  test("treats an unlinked row with the same hazard text as already transferred", () => {
    const base = sample(["l1"]);
    const legacy = addRow(base, "l1", {
      hazard: hazardOf(base.checklists[0], base.checklists[0].items[0]),
    });
    expect(countUntransferred(legacy)).toBe(1);
    expect(transferMissing(legacy).created).toBe(1);
  });

  test("skips items that already have a linked row", () => {
    const first = transferMissing(sample(["l1"]), "k1").assessment;
    const extended = {
      ...first,
      checklists: [{ ...first.checklists[0], items: [...first.checklists[0].items, item("m4")] }],
    };
    const withNew = withAnswers(extended, "k1", "l1", { m4: "no" });
    expect(transferMissing(withNew).created).toBe(1);
  });

  test("is idempotent on a second run", () => {
    const once = transferMissing(sample());
    const twice = transferMissing(once.assessment);
    expect(once.created).toBeGreaterThan(0);
    expect(twice.created).toBe(0);
    expect(twice.assessment).toBe(once.assessment);
  });

  test("falls back to the default location for a general list", () => {
    const { assessment, created } = transferMissing(sample());
    expect(created).toBe(2);
    expect(assessment.locations[0].rows).toHaveLength(2);
    expect(assessment.locations[0].rows[0].sources).toEqual([
      { listId: "k1", itemId: "m1", locationId: null },
    ]);
  });

  test("counts items as skipped when there is no location", () => {
    const a = { ...sample(), locations: [] };
    const r = transferMissing(a);
    expect(r.created).toBe(0);
    expect(r.skippedNoLocation).toBe(2);
  });

  test("limits work to the given list", () => {
    const a = sample();
    const two = answerAll(
      ensureInspections({
        ...a,
        checklists: [...a.checklists, { ...a.checklists[0], id: "k2" }],
      }),
    );
    expect(transferMissing(two, "k2").created).toBe(2);
    expect(countUntransferred(two, "k2")).toBe(2);
    expect(countUntransferred(two)).toBe(4);
  });

  test("does not mutate the input", () => {
    const a = sample();
    transferMissing(a);
    expect(a.locations[0].rows).toHaveLength(0);
  });
});
