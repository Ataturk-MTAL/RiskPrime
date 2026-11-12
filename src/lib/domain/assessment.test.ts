import { describe, expect, test } from "vite-plus/test";
import * as m from "./assessment";

function sample() {
  let a = m.emptyAssessment("2026-2027");
  a = m.addLocation(a, {
    id: "a-1",
    name: "ELE1",
    building: "C Blok",
    area: "Elektrik-Elektronik",
  });
  a = m.addLocation(a, { id: "a-2", name: "Depo", type: "storage", building: "A Blok" });
  return m.addRow(a, "a-1", { id: "r-1", hazard: "Çarpma", likelihood: 3, severity: 5 });
}

describe("assessment", () => {
  test("empty assessment has five default signatories", () => {
    const a = m.emptyAssessment("2026-2027");
    expect(a.version).toBe(3);
    expect(a.inspections).toEqual([]);
    expect(a.period).toBe("2026-2027");
    expect(a.school.signatories).toHaveLength(5);
    expect(a.locations).toEqual([]);
  });

  test("operations do not mutate the input", () => {
    const a = sample();
    const snapshot = JSON.stringify(a);
    m.addLocation(a, { name: "X" });
    m.updateLocation(a, "a-1", { name: "Y" });
    m.removeLocation(a, "a-2");
    m.moveLocation(a, "a-2", -1);
    m.addRow(a, "a-1", {});
    m.updateRow(a, "a-1", "r-1", { likelihood: 1 });
    m.removeRow(a, "a-1", "r-1");
    m.updateSchool(a, { name: "Z" });
    m.addSignatory(a, "X");
    m.updateMeta(a, { period: "q" });
    expect(JSON.stringify(a)).toBe(snapshot);
  });

  test("adds, updates and removes locations", () => {
    let a = sample();
    expect(a.locations).toHaveLength(2);
    expect(a.locations[1].type).toBe("storage");
    a = m.updateLocation(a, "a-1", { name: "ELE1 Haberleşme", id: "bad" } as never);
    expect(a.locations[0].name).toBe("ELE1 Haberleşme");
    expect(a.locations[0].id).toBe("a-1");
    a = m.removeLocation(a, "a-2");
    expect(a.locations.map((l) => l.id)).toEqual(["a-1"]);
  });

  test('blank location name becomes "Yeni mekân" and an id is generated', () => {
    const a = m.addLocation(m.emptyAssessment(), {});
    expect(a.locations[0].name).toBe("Yeni mekân");
    expect(a.locations[0].id).toMatch(/^a-/);
  });

  test("invalid type and unknown ids throw", () => {
    const a = sample();
    expect(() => m.addLocation(a, { type: "kitchen" as never })).toThrow(/Geçersiz mekân türü/);
    expect(() => m.updateLocation(a, "none", { name: "x" })).toThrow(/Mekân bulunamadı/);
    expect(() => m.updateRow(a, "a-1", "none", { likelihood: 1 })).toThrow(/Satır bulunamadı/);
  });

  test("moving a location at an edge returns the same object", () => {
    let a = m.updateSchool(sample(), { grouping: "none" });
    a = m.moveLocation(a, "a-2", -1);
    expect(a.locations.map((l) => l.id)).toEqual(["a-2", "a-1"]);
    expect(m.moveLocation(a, "a-2", -1)).toBe(a);
  });

  test("moving swaps with the neighbour in the same group, skipping other groups", () => {
    let a = m.updateSchool(sample(), { grouping: "building" });
    a = m.addLocation(a, { id: "a-3", name: "ELE2", building: "C Blok" });
    // order: a-1 (C), a-2 (A), a-3 (C)
    expect(m.groupNeighbourId(a, "a-3", -1)).toBe("a-1");
    expect(m.groupNeighbourId(a, "a-2", -1)).toBeNull();
    expect(m.groupNeighbourId(a, "a-2", 1)).toBeNull();
    expect(m.moveLocation(a, "a-2", 1)).toBe(a);
    const moved = m.moveLocation(a, "a-3", -1);
    expect(moved.locations.map((l) => l.id)).toEqual(["a-3", "a-2", "a-1"]);
    expect(m.grouped(moved)[0].locations.map((l) => l.id)).toEqual(["a-3", "a-1"]);
  });

  test("row scores must be 1-5 or null; status must be valid", () => {
    let a = sample();
    a = m.updateRow(a, "a-1", "r-1", { likelihood: null, severityAfter: 4 });
    const row = a.locations[0].rows[0];
    expect(row.likelihood).toBeNull();
    expect(row.severityAfter).toBe(4);
    expect(() => m.updateRow(a, "a-1", "r-1", { severity: 6 as never })).toThrow(/1-5/);
    expect(() => m.updateRow(a, "a-1", "r-1", { status: "x" as never })).toThrow(/Geçersiz durum/);
  });

  test("new row comes with empty fields", () => {
    const row = m.addRow(sample(), "a-2", {}).locations[1].rows[0];
    expect(row.status).toBe("open");
    expect(row.likelihood).toBeNull();
    expect(row.id).toMatch(/^r-/);
  });

  test("adds, updates and removes signatories", () => {
    let a = m.emptyAssessment();
    a = m.updateSignatory(a, 4, { name: "" });
    expect(a.school.signatories[4].name).toBe("");
    a = m.addSignatory(a, "Atölye Öğretmeni");
    expect(a.school.signatories).toHaveLength(6);
    a = m.removeSignatory(a, 0);
    expect(a.school.signatories[0].title).toBe("Çalışan Temsilcisi");
    expect(() => m.removeSignatory(a, 99)).toThrow(/İmzacı bulunamadı/);
  });

  test("labels are unique and sorted", () => {
    const a = sample();
    expect(m.labels(a, "building")).toEqual(["A Blok", "C Blok"]);
    expect(m.labels(a, "area")).toEqual(["Elektrik-Elektronik"]);
  });

  test("grouping by area, building or none", () => {
    let a = sample();
    expect(m.grouped(a).map((g) => g.title)).toEqual(["Elektrik-Elektronik", "(Belirtilmemiş)"]);
    a = m.updateSchool(a, { grouping: "building" });
    expect(m.grouped(a).map((g) => g.title)).toEqual(["C Blok", "A Blok"]);
    a = m.updateSchool(a, { grouping: "none" });
    expect(m.grouped(a)).toHaveLength(1);
    expect(() => m.updateSchool(a, { grouping: "floor" as never })).toThrow(/Geçersiz gruplama/);
  });

  test("location from template gets new ids for location and rows", () => {
    const tpl = {
      name: "ELE1",
      type: "workshop" as const,
      building: "",
      area: "EET",
      rows: [{ equipment: "Matkap", hazard: "Kesik" }],
    };
    const a = m.addLocationFromTemplate(m.emptyAssessment(), tpl);
    expect(a.locations[0].rows[0].equipment).toBe("Matkap");
    expect(a.locations[0].rows[0].id).toBeTruthy();
  });
});

describe("duplicate", () => {
  test("duplicateRow inserts a copy with a fresh id right after the original", () => {
    let a = sample();
    a = m.addRow(a, "a-1", { id: "r-2", hazard: "Yangın" });
    const next = m.duplicateRow(a, "a-1", "r-1", "r-copy");
    expect(next.locations[0].rows.map((r) => r.id)).toEqual(["r-1", "r-copy", "r-2"]);
    expect(next.locations[0].rows[1]).toEqual({ ...a.locations[0].rows[0], id: "r-copy" });
    expect(a.locations[0].rows).toHaveLength(2);
  });

  test("duplicateRow generates a new id when none is given and rejects unknown rows", () => {
    const next = m.duplicateRow(sample(), "a-1", "r-1");
    expect(next.locations[0].rows[1].id).not.toBe("r-1");
    expect(() => m.duplicateRow(sample(), "a-1", "nope")).toThrow();
  });

  test("duplicateLocation copies rows under new ids, adds (kopya) and inserts after the original", () => {
    const a = sample();
    const next = m.duplicateLocation(a, "a-1", "a-copy");
    expect(next.locations.map((l) => l.id)).toEqual(["a-1", "a-copy", "a-2"]);
    const copy = next.locations[1];
    expect(copy.name).toBe("ELE1 (kopya)");
    expect(copy.rows).toHaveLength(1);
    expect(copy.rows[0].id).not.toBe("r-1");
    expect(copy.rows[0].hazard).toBe("Çarpma");
    expect(a.locations).toHaveLength(2);
    expect(() => m.duplicateLocation(a, "nope")).toThrow();
  });
});

describe("isOverdue", () => {
  const today = new Date(2026, 8, 15); // 15.09.2026
  const row = (over: object) => ({ ...m.emptyRow("r"), ...over });

  test("open row with a past due date is overdue", () => {
    expect(m.isOverdue(row({ dueDate: "14.09.2026" }), today)).toBe(true);
  });
  test("due today or later is not overdue", () => {
    expect(m.isOverdue(row({ dueDate: "15.09.2026" }), today)).toBe(false);
    expect(m.isOverdue(row({ dueDate: "01.01.2027" }), today)).toBe(false);
  });
  test("done rows, empty and unparsable dates are not overdue", () => {
    expect(m.isOverdue(row({ dueDate: "01.01.2020", status: "done" }), today)).toBe(false);
    expect(m.isOverdue(row({ dueDate: "" }), today)).toBe(false);
    expect(m.isOverdue(row({ dueDate: "yakında" }), today)).toBe(false);
  });
});

describe("filterRows", () => {
  const today = new Date(2026, 8, 15);
  const rows = [
    { ...m.emptyRow("1"), equipment: "Işık", likelihood: 2 as const, severity: 2 as const },
    { ...m.emptyRow("2"), hazard: "IŞIK kaçağı", dueDate: "01.01.2026" },
    { ...m.emptyRow("3"), responsible: "Ali", status: "done" as const },
  ];

  test("matches case-insensitively with Turkish casing and keeps original numbers", () => {
    const out = m.filterRows(rows, "ışık", "all", today);
    expect(out.map((x) => x.number)).toEqual([1, 2]);
  });
  test("searches responsible and action", () => {
    expect(m.filterRows(rows, "ali", "all", today).map((x) => x.number)).toEqual([3]);
  });
  test("status filters: unscored, open, overdue", () => {
    expect(m.filterRows(rows, "", "unscored", today).map((x) => x.number)).toEqual([2, 3]);
    expect(m.filterRows(rows, "", "open", today).map((x) => x.number)).toEqual([1, 2]);
    expect(m.filterRows(rows, "", "overdue", today).map((x) => x.number)).toEqual([2]);
  });
});
