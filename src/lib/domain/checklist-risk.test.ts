import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment } from "./assessment";
import { addChecklist } from "./checklist";
import {
  defaultLocationId,
  hasChecklistRisk,
  hazardOf,
  riskRowFromChecklistItem,
  ROW_SIMILAR_THRESHOLD,
  similarRows,
} from "./checklist-risk";
import { addRowSource } from "./links";
import { withAnswers } from "./test-helpers";
import type { Assessment } from "./types";

function sample(): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Elektrik Atölyesi" });
  const base: Assessment = {
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
          },
          { id: "m2", no: "07", text: "Topraklama var mı?" },
        ],
      },
    ],
  };
  return withAnswers(base, "k1", null, { m1: "no", m2: "no" }, { m1: "Yarın kapatılacak" });
}

describe("hazardOf", () => {
  test("uses the bank key when the item number already carries the list number", () => {
    const list = { id: "k", code: "KL-35", name: "Atölye", source: "external" as const, items: [] };
    const item = { id: "m", no: "35.05", text: "İlkyardım dolabı var mı?", ref: "KL-35.05" };
    expect(hazardOf(list, item)).toBe("İlkyardım dolabı var mı? (KL-35.05)");
  });
});

describe("riskRowFromChecklistItem", () => {
  test("adds a row with hazard, reference and note as action", () => {
    const a = sample();
    const next = riskRowFromChecklistItem(a, "k1", "m1", null, "l2");
    const row = next.locations[1].rows[0];
    expect(row.sources).toEqual([{ listId: "k1", itemId: "m1", locationId: null }]);
    expect(row.hazard).toBe("Pano kapağı kapalı mı? (KL-26.06)");
    expect(row.action).toBe("Yarın kapatılacak");
    expect(row.existingControls).toBe("");
    expect(row.equipment).toBe("");
    expect(a.locations[1].rows).toHaveLength(0);
  });

  test("leaves action empty when the item has no note", () => {
    const next = riskRowFromChecklistItem(sample(), "k1", "m2", null, "l1");
    expect(next.locations[0].rows[0].action).toBe("");
  });

  test("throws for unknown list, item or location", () => {
    expect(() => riskRowFromChecklistItem(sample(), "x", "m1", null, "l1")).toThrow();
    expect(() => riskRowFromChecklistItem(sample(), "k1", "x", null, "l1")).toThrow();
    expect(() => riskRowFromChecklistItem(sample(), "k1", "m1", null, "x")).toThrow();
    expect(() => riskRowFromChecklistItem(sample(), "k1", "m1", null)).toThrow();
  });

  test("a location inspection puts the row in its own location", () => {
    const a = withAnswers(
      { ...sample(), checklists: [{ ...sample().checklists[0], locationIds: ["l1"] }] },
      "k1",
      "l1",
      { m1: "no" },
      { m1: "Not" },
    );
    const next = riskRowFromChecklistItem(a, "k1", "m1", "l1");
    expect(next.locations[0].rows[0]).toMatchObject({
      action: "Not",
      sources: [{ listId: "k1", itemId: "m1", locationId: "l1" }],
    });
  });
});

describe("hasChecklistRisk", () => {
  test("detects an existing row with the same hazard in that location only", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l2");
    expect(hasChecklistRisk(a, "k1", "m1", null, "l2")).toBe(true);
    expect(hasChecklistRisk(a, "k1", "m1", null, "l1")).toBe(false);
    expect(hasChecklistRisk(a, "k1", "m2", null, "l2")).toBe(false);
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

describe("similarRows", () => {
  function sample() {
    let a = emptyAssessment("2026-2027");
    a = addLocation(a, { id: "l1", name: "ELE9" });
    a = addChecklist(a, {
      code: "KL-27",
      name: "Ekranlı araçlar",
      source: "external",
      items: [{ no: "1", text: "Ekranlar ayarlanabilir, yansımasız; mesafe 50-80 cm" }],
    });
    const list = a.checklists[0];
    a = addRow(a, "l1", { id: "r1", hazard: "Yangın tüpü eksik" });
    a = addRow(a, "l1", { id: "r2", hazard: "Ekranlar ayarlanabilir ve yansımasız olmalı" });
    // 2 of 5 meaningful words shared = 0.40: similar enough for the old 0.35, not for rows.
    a = addRow(a, "l1", { id: "r3", hazard: "Ekranlar ayarlanabilir olmalı" });
    return { a, listId: list.id, itemId: list.items[0].id };
  }

  test("suggests rows of the target location whose hazard is similar", () => {
    // Arrange
    const { a, listId, itemId } = sample();
    // Act
    const hits = similarRows(a, listId, itemId, null, "l1");
    // Assert
    expect(hits.map((h) => [h.rowId, h.number])).toEqual([["r2", 2]]);
  });

  test("a borderline row below the row threshold is not suggested", () => {
    const { a, listId, itemId } = sample();
    expect(ROW_SIMILAR_THRESHOLD).toBe(0.45);
    expect(similarRows(a, listId, itemId, null, "l1").some((h) => h.rowId === "r3")).toBe(false);
  });

  test("skips rows already linked to the item", () => {
    const { a, listId, itemId } = sample();
    // the list has only its okul geneli inspection, so the link comes from there
    const linked = addRowSource(a, "l1", "r2", { listId, itemId, locationId: null });
    expect(similarRows(linked, listId, itemId, null, "l1")).toEqual([]);
  });

  test("an unknown location has no suggestions", () => {
    const { a, listId, itemId } = sample();
    expect(similarRows(a, listId, itemId, null, "yok")).toEqual([]);
  });
});
