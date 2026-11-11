import { describe, expect, test } from "vite-plus/test";
import { addLocation, emptyAssessment } from "./assessment";
import { defaultLocationId, hasChecklistRisk, riskRowFromChecklistItem } from "./checklist-risk";
import type { Assessment } from "./types";

function sample(): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Elektrik Atölyesi" });
  return {
    ...a,
    checklists: [
      {
        id: "k1",
        code: "KL-26",
        name: "Elektrik Atölyesi",
        source: "external",
        items: [
          {
            id: "m1",
            no: "06",
            text: "Pano kapağı kapalı mı?",
            answer: "no",
            note: "Yarın kapatılacak",
          },
          { id: "m2", no: "07", text: "Topraklama var mı?", answer: "no", note: "" },
        ],
      },
    ],
  };
}

describe("riskRowFromChecklistItem", () => {
  test("adds a row with hazard, reference and note as action", () => {
    const a = sample();
    const next = riskRowFromChecklistItem(a, "k1", "m1", "l2");
    const row = next.locations[1].rows[0];
    expect(row.hazard).toBe("Pano kapağı kapalı mı? (KL-26.06)");
    expect(row.action).toBe("Yarın kapatılacak");
    expect(row.existingControls).toBe("");
    expect(row.equipment).toBe("");
    expect(a.locations[1].rows).toHaveLength(0);
  });

  test("leaves action empty when the item has no note", () => {
    const next = riskRowFromChecklistItem(sample(), "k1", "m2", "l1");
    expect(next.locations[0].rows[0].action).toBe("");
  });

  test("throws for unknown list, item or location", () => {
    expect(() => riskRowFromChecklistItem(sample(), "x", "m1", "l1")).toThrow();
    expect(() => riskRowFromChecklistItem(sample(), "k1", "x", "l1")).toThrow();
    expect(() => riskRowFromChecklistItem(sample(), "k1", "m1", "x")).toThrow();
  });
});

describe("hasChecklistRisk", () => {
  test("detects an existing row with the same hazard in that location only", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", "l2");
    expect(hasChecklistRisk(a, "k1", "m1", "l2")).toBe(true);
    expect(hasChecklistRisk(a, "k1", "m1", "l1")).toBe(false);
    expect(hasChecklistRisk(a, "k1", "m2", "l2")).toBe(false);
  });
});

describe("defaultLocationId", () => {
  test("prefers a location whose name matches the list name", () => {
    const a = sample();
    expect(defaultLocationId(a, a.checklists[0])).toBe("l2");
  });

  test("falls back to the first location", () => {
    const a = sample();
    expect(defaultLocationId(a, { ...a.checklists[0], name: "Kantin", code: "KL-99" })).toBe("l1");
  });

  test("returns empty string without locations", () => {
    const a = { ...sample(), locations: [] };
    expect(defaultLocationId(a, a.checklists[0])).toBe("");
  });
});
