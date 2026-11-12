import { describe, expect, test } from "vite-plus/test";
import { addLocation, emptyAssessment } from "./assessment";
import { ensureInspections } from "./inspections";
import { rowsForItem } from "./links";
import { withAnswers } from "./test-helpers";
import { countUntransferredInspection, transferInspection } from "./transfer-inspection";
import type { Assessment } from "./types";

function sample(): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Atölye" });
  a = ensureInspections({
    ...a,
    checklists: [
      {
        id: "k1",
        code: "KL-1",
        name: "Liste",
        source: "external",
        items: [
          { id: "m1", no: "1", text: "Bir" },
          { id: "m2", no: "2", text: "İki" },
        ],
        locationIds: ["l1", "l2"],
      },
    ],
  });
  a = withAnswers(a, "k1", "l1", { m1: "no", m2: "yes" });
  return withAnswers(a, "k1", "l2", { m1: "no", m2: "no" });
}

describe("transferInspection", () => {
  test("only the chosen inspection gets rows", () => {
    const a = sample();
    expect(countUntransferredInspection(a, "k1", "l1")).toBe(1);
    const r = transferInspection(a, "k1", "l1");
    expect(r.created).toBe(1);
    expect(rowsForItem(r.assessment, "k1", "m1", "l1")).toHaveLength(1);
    expect(rowsForItem(r.assessment, "k1", "m1", "l2")).toHaveLength(0);
    expect(countUntransferredInspection(r.assessment, "k1", "l2")).toBe(2);
  });

  test("is idempotent", () => {
    const once = transferInspection(sample(), "k1", "l2").assessment;
    expect(transferInspection(once, "k1", "l2").created).toBe(0);
  });

  test("unknown inspection creates nothing", () => {
    const a = sample();
    expect(transferInspection(a, "nope", "l1")).toEqual({
      assessment: a,
      created: 0,
      skippedNoLocation: 0,
    });
  });
});
