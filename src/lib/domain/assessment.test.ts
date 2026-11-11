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
    expect(a.version).toBe(1);
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
    let a = sample();
    a = m.moveLocation(a, "a-2", -1);
    expect(a.locations.map((l) => l.id)).toEqual(["a-2", "a-1"]);
    expect(m.moveLocation(a, "a-2", -1)).toBe(a);
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
