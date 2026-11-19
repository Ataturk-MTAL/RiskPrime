import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment, removeLocation } from "./assessment";
import { addChecklist, removeItem } from "./checklist";
import {
  deficiencies,
  ensureInspections,
  findInspection,
  inspectionsForList,
  inspectionsForLocation,
  inspectionSummary,
  riskRegister,
  scopeName,
} from "./inspections";
import { addRowSource, setChecklistLocations } from "./links";
import { riskRowFromChecklistItem } from "./checklist-risk";
import { withAnswers } from "./test-helpers";
import type { Assessment } from "./types";

/** Locations l1 (Depo) and l2 (Atölye); k1 on both, k2 general. */
function sample(): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Atölye" });
  a = addChecklist(a, {
    code: "KL-26",
    name: "Elektrik",
    source: "external",
    items: [
      { no: "1", text: "Pano kapalı mı?", ref: "KL-26.01" },
      { no: "2", text: "Topraklama var mı?" },
    ],
  });
  a = addChecklist(a, { name: "Genel", items: [{ no: "1", text: "Çıkış açık mı?" }] });
  return setChecklistLocations(a, a.checklists[0].id, ["l1", "l2"]);
}
const ids = (a: Assessment) => ({
  k1: a.checklists[0].id,
  k2: a.checklists[1].id,
  m1: a.checklists[0].items[0].id,
  m2: a.checklists[0].items[1].id,
  g1: a.checklists[1].items[0].id,
});

describe("ensureInspections", () => {
  test("creates one inspection per live location, or one school-wide", () => {
    const a = sample();
    const { k1, k2 } = ids(a);
    expect(a.inspections.map((i) => [i.checklistId, i.locationId])).toEqual([
      [k1, "l1"],
      [k1, "l2"],
      [k2, null],
    ]);
    expect(a.inspections.every((i) => i.answers.length === 0)).toBe(true);
  });

  test("is idempotent: a second run changes nothing", () => {
    const a = sample();
    expect(ensureInspections(a)).toEqual(a);
    expect(ensureInspections(ensureInspections(a))).toEqual(a);
  });

  test("keeps existing inspections (same ids) and their answers", () => {
    const base = sample();
    const { k1, m1 } = ids(base);
    const a = withAnswers(base, k1, "l1", { [m1]: "no" });
    const before = findInspection(a, k1, "l1");
    const after = findInspection(
      ensureInspections({ ...a, locations: [...a.locations] }),
      k1,
      "l1",
    );
    expect(after).toEqual(before);
  });

  test("drops orphans: unknown lists, dead locations, duplicates and answers of deleted items", () => {
    const a = sample();
    const { k1 } = ids(a);
    const junk = {
      ...a,
      inspections: [
        ...a.inspections,
        { id: "d-x", checklistId: "yok", locationId: null, answers: [] },
        { id: "d-y", checklistId: k1, locationId: "l9", answers: [] },
        { id: "d-z", checklistId: k1, locationId: "l1", answers: [] },
        {
          ...a.inspections[0],
          id: "d-w",
          answers: [{ itemId: "gone", answer: "no" as const, note: "" }],
        },
      ],
    };
    const fixed = ensureInspections(junk);
    expect(fixed.inspections).toEqual(a.inspections);
  });

  test("follows structural changes: assigning locations, removing a location or a list", () => {
    const a = sample();
    const { k1, k2, m1 } = ids(a);
    const answered = withAnswers(a, k1, "l2", { [m1]: "no" });
    const toL2 = setChecklistLocations(answered, k1, ["l2"]);
    expect(inspectionsForList(toL2, k1).map((i) => i.locationId)).toEqual(["l2"]);
    expect(findInspection(toL2, k1, "l2")?.answers).toHaveLength(1);
    const general = setChecklistLocations(a, k2, ["l1"]);
    expect(inspectionsForList(general, k2).map((i) => i.locationId)).toEqual(["l1"]);
    const noL2 = removeLocation(answered, "l2");
    expect(inspectionsForList(noL2, k1).map((i) => i.locationId)).toEqual(["l1"]);
    expect(noL2.inspections.some((i) => i.locationId === "l2")).toBe(false);
  });
});

describe("inspection queries", () => {
  test("inspectionsForLocation and inspectionsForList", () => {
    const a = sample();
    const { k1, k2 } = ids(a);
    expect(inspectionsForLocation(a, "l1").map((i) => i.checklistId)).toEqual([k1]);
    expect(inspectionsForLocation(a, "l9")).toEqual([]);
    expect(inspectionsForList(a, k1)).toHaveLength(2);
    expect(inspectionsForList(a, k2)).toHaveLength(1);
    expect(inspectionsForList(a, "yok")).toEqual([]);
  });

  test("inspectionSummary counts items, answers and deficiencies of one inspection", () => {
    const a0 = sample();
    const { k1, m1, m2 } = ids(a0);
    const a = withAnswers(a0, k1, "l1", { [m1]: "no", [m2]: "yes" }, { [m1]: "not" });
    const insp = findInspection(a, k1, "l1");
    if (!insp) throw new Error("missing");
    expect(inspectionSummary(a, insp)).toEqual({ total: 2, answered: 2, no: 1 });
    const other = findInspection(a, k1, "l2");
    expect(other && inspectionSummary(a, other)).toEqual({ total: 2, answered: 0, no: 0 });
  });

  test("scopeName: location name or Okul geneli", () => {
    const a = sample();
    expect(scopeName(a, "l1")).toBe("Depo");
    expect(scopeName(a, null)).toBe("Okul geneli");
  });
});

describe("deficiencies", () => {
  test("lists every Hayır across inspections with its location, note and linked rows", () => {
    const a0 = sample();
    const { k1, k2, m1, m2, g1 } = ids(a0);
    let a = withAnswers(a0, k1, "l1", { [m1]: "no", [m2]: "yes" }, { [m1]: "Kapatılacak" });
    a = withAnswers(a, k1, "l2", { [m1]: "yes", [m2]: "no" });
    a = withAnswers(a, k2, null, { [g1]: "no" });
    a = riskRowFromChecklistItem(a, k1, m1, "l1");
    const list = deficiencies(a);
    expect(list.map((d) => [d.listCode, d.itemNo, d.locationId, d.locationName, d.note])).toEqual([
      ["KL-26", "1", "l1", "Depo", "Kapatılacak"],
      ["KL-26", "2", "l2", "Atölye", ""],
      ["", "1", null, "Okul geneli", ""],
    ]);
    expect(list[0]).toMatchObject({
      listId: k1,
      listName: "Elektrik",
      itemId: m1,
      text: "Pano kapalı mı?",
      ref: "KL-26.01",
      rowIds: [a.locations[0].rows[0].id],
    });
    expect(list[1].rowIds).toEqual([]);
    expect("ref" in list[1]).toBe(false);
  });

  test("a row linked to one location's deficiency does not cover the same item elsewhere", () => {
    const a0 = sample();
    const { k1, m1 } = ids(a0);
    let a = withAnswers(withAnswers(a0, k1, "l1", { [m1]: "no" }), k1, "l2", { [m1]: "no" });
    a = riskRowFromChecklistItem(a, k1, m1, "l2");
    expect(deficiencies(a).map((d) => [d.locationId, d.rowIds.length])).toEqual([
      ["l1", 0],
      ["l2", 1],
    ]);
    // one row can serve both inspections' deficiencies
    const row = a.locations[1].rows[0];
    a = addRowSource(a, "l2", row.id, { listId: k1, itemId: m1, locationId: "l1" });
    expect(deficiencies(a).map((d) => d.rowIds)).toEqual([[row.id], [row.id]]);
  });

  test("answers other than Hayır and deleted items are not listed", () => {
    const a0 = sample();
    const { k1, m1, m2 } = ids(a0);
    const a = withAnswers(a0, k1, "l1", { [m1]: "no", [m2]: "na" });
    expect(deficiencies(a)).toHaveLength(1);
    expect(deficiencies(removeItem(a, k1, m1))).toEqual([]);
  });
});

describe("riskRegister", () => {
  test("flattens every location's rows with number and level", () => {
    let a = sample();
    a = addRow(a, "l1", { id: "r1", hazard: "A", likelihood: 5, severity: 5 });
    a = addRow(a, "l1", { id: "r2", hazard: "B" });
    a = addRow(a, "l2", { id: "r3", hazard: "C", likelihood: 1, severity: 1 });
    const register = riskRegister(a);
    expect(register.map((e) => [e.locationId, e.locationName, e.row.id, e.number])).toEqual([
      ["l1", "Depo", "r1", 1],
      ["l1", "Depo", "r2", 2],
      ["l2", "Atölye", "r3", 1],
    ]);
    expect(register.map((e) => e.level?.key ?? null)).toEqual(["intolerable", null, "negligible"]);
  });

  test("is empty without rows", () => {
    expect(riskRegister(sample())).toEqual([]);
  });
});
