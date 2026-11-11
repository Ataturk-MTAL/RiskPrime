import { describe, it, expect } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { detectType } from "./generate-starter.mjs";

const starter = JSON.parse(
  readFileSync(new URL("../src/lib/data/starter.json", import.meta.url), "utf8"),
);
const TYPES = ["workshop", "storage", "office", "wet", "common"];

describe("starter.json", () => {
  it("has 18 locations, the first is common, and 98 rows with empty scores", () => {
    expect(starter.locations).toHaveLength(18);
    expect(starter.locations[0].type).toBe("common");
    const rows = starter.locations.flatMap((l) => l.rows);
    expect(rows).toHaveLength(98);
    expect(
      rows.every(
        (r) =>
          r.likelihood === null &&
          r.severity === null &&
          r.likelihoodAfter === null &&
          r.severityAfter === null,
      ),
    ).toBe(true);
    expect(rows.every((r) => r.status === "open")).toBe(true);
  });

  it("has 15 internal checklists with empty answers", () => {
    expect(starter.checklists).toHaveLength(15);
    expect(starter.checklists.every((c) => c.source === "internal")).toBe(true);
    expect(
      starter.checklists.flatMap((c) => c.items).every((i) => i.answer === "" && i.note === ""),
    ).toBe(true);
  });

  it("uses valid enums", () => {
    expect(starter.locations.every((l) => TYPES.includes(l.type))).toBe(true);
    expect(starter.school.grouping).toBe("area");
    expect(starter.school.signatories).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = [
      ...starter.locations.flatMap((l) => [l.id, ...l.rows.map((r) => r.id)]),
      ...starter.checklists.flatMap((c) => [c.id, ...c.items.map((i) => i.id)]),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("detectType", () => {
  it("derives location types from names", () => {
    expect(detectType("Elektronik deposu")).toBe("storage");
    expect(detectType("Öğrenci tuvaleti")).toBe("wet");
    expect(detectType("Öğretmen odaları")).toBe("office");
    expect(detectType("Şef odası")).toBe("office");
    expect(detectType("Tüm mekânlar")).toBe("common");
    expect(detectType("ELE13")).toBe("workshop");
  });
});
