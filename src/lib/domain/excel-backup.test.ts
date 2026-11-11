import { describe, expect, test } from "vite-plus/test";
import starter from "../data/starter.json";
import { backupSheets, isBackup, restoreBackup } from "./excel-backup";
import { read, template } from "./excel-import";
import { validate } from "./file";
import type { Assessment } from "./types";

type Sheets = Record<string, unknown[][]>;

/** Deep copy without any "id" keys, so regenerated ids do not matter. */
function stripIds<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value), (key, v) => (key === "id" ? undefined : v));
}

function fullAssessment(): Assessment {
  const a = structuredClone(starter) as unknown as Assessment;
  const [first, second, ...rest] = a.locations;
  const row = first.rows[0];
  const scored = {
    ...row,
    likelihood: 3 as const,
    severity: 4 as const,
    likelihoodAfter: 1 as const,
    severityAfter: 2 as const,
    dueDate: "01.10.2026",
    status: "done" as const,
  };
  return {
    ...a,
    period: "2026-2027",
    assessmentDate: "15.09.2026",
    school: {
      ...a.school,
      grouping: "building",
      signatories: [...a.school.signatories, { title: "Okul Müdürü", name: "" }],
    },
    locations: [
      { ...first, building: "C Blok", rows: [scored, ...first.rows.slice(1)] },
      { ...second, rows: [] },
      ...rest,
    ],
    checklists: [
      {
        id: "k1",
        code: "KL-01",
        name: "Elektrik",
        source: "external",
        items: [
          { id: "m1", no: "01.01", text: "Soru bir?", answer: "yes", note: "Tamam" },
          { id: "m2", no: "01.02", text: "Soru iki?", answer: "no", note: "" },
          { id: "m3", no: "01.03", text: "Soru üç?", answer: "na", note: "" },
          { id: "m4", no: "01.04", text: "Eklenen", answer: "", note: "", added: true },
        ],
      },
      {
        id: "k2",
        code: "",
        name: "Okul içi liste",
        source: "internal",
        items: [{ id: "m5", no: "1", text: "Kendi sorumuz", answer: "yes", note: "not" }],
      },
      { id: "k3", code: "KL-02", name: "Boş liste", source: "external", items: [] },
    ],
  };
}

const sheetsOf = (a: Assessment) => backupSheets(a) as Sheets;
const ok = (r: ReturnType<typeof restoreBackup>) => {
  if ("errors" in r) throw new Error(r.errors.join("\n"));
  return r.assessment;
};

describe("excel-backup", () => {
  test("round-trips a complete assessment (ids aside)", () => {
    const a = fullAssessment();
    const restored = ok(restoreBackup(sheetsOf(a)));
    expect(stripIds(restored)).toEqual(stripIds(a));
    expect(validate(restored)).toEqual([]);
  });

  test("restored assessment gets fresh ids", () => {
    const a = fullAssessment();
    const restored = ok(restoreBackup(sheetsOf(a)));
    expect(restored.locations[0].id).not.toBe(a.locations[0].id);
    expect(restored.checklists[0].items[0].id).not.toBe("m1");
  });

  test("sheets are written in the documented order and detected as a backup", () => {
    const sheets = sheetsOf(fullAssessment());
    expect(Object.keys(sheets)).toEqual([
      "RiskPrime",
      "Okul Bilgileri",
      "Mekânlar",
      "Risk Satırları",
      "Kontrol Listesi",
    ]);
    expect(isBackup(sheets)).toBe(true);
  });

  test("template workbooks are not backups and still merge-import", () => {
    expect(isBackup(template())).toBe(false);
    const r = read(structuredClone(starter) as unknown as Assessment, template());
    expect("assessment" in r).toBe(true);
  });

  test("a bad Durum reports sheet and row", () => {
    const sheets = sheetsOf(fullAssessment());
    const header = sheets["Risk Satırları"][0];
    sheets["Risk Satırları"][1][header.indexOf("Durum")] = "Belki";
    const r = restoreBackup(sheets);
    expect("errors" in r && r.errors[0]).toMatch(/^Risk Satırları, satır 2: Durum 'Belki'/);
  });

  test("a bad Cevap and a bad Kaynak report row numbers", () => {
    const sheets = sheetsOf(fullAssessment());
    const header = sheets["Kontrol Listesi"][0];
    sheets["Kontrol Listesi"][1][header.indexOf("Cevap")] = "Belki";
    sheets["Kontrol Listesi"][2][header.indexOf("Kaynak")] = "Dış";
    const r = restoreBackup(sheets);
    const errors = "errors" in r ? r.errors : [];
    expect(errors[0]).toMatch(/^Kontrol Listesi, satır 2: Cevap 'Belki'/);
    expect(errors[1]).toMatch(/^Kontrol Listesi, satır 3: Kaynak 'Dış'/);
  });

  test("a missing sheet is reported and nothing is restored", () => {
    const { Mekânlar: _omitted, ...rest } = sheetsOf(fullAssessment());
    const r = restoreBackup(rest);
    expect("errors" in r && r.errors[0]).toMatch(/Mekânlar/);
  });

  test("round-trips empty names, hazards and fields", () => {
    const a = fullAssessment();
    const blank = { ...a.locations[0].rows[0], equipment: "", hazard: "", affected: "" };
    const odd: Assessment = {
      ...a,
      locations: [
        { ...a.locations[0], name: "", building: "", area: "", rows: [blank] },
        { ...a.locations[1], name: "", rows: [] },
      ],
    };
    expect(validate(odd)).toEqual([]);
    expect(stripIds(ok(restoreBackup(sheetsOf(odd))))).toEqual(stripIds(odd));
  });

  test("keeps locations with the same name distinct", () => {
    const a = fullAssessment();
    const [one, two] = a.locations;
    const dup: Assessment = {
      ...a,
      locations: [
        { ...one, name: "Atölye", rows: [one.rows[0]] },
        { ...two, name: "Atölye", rows: [one.rows[0]] },
      ],
    };
    const restored = ok(restoreBackup(sheetsOf(dup)));
    expect(stripIds(restored.locations)).toEqual(stripIds(dup.locations));
  });

  test("restores older backups without the location key column", () => {
    const a = fullAssessment();
    const sheets = sheetsOf(a);
    const drop = (rows: unknown[][], n: number) => rows.map((r) => r.slice(0, -n));
    const legacy = {
      ...sheets,
      Mekânlar: drop(sheets["Mekânlar"], 1),
      // Last two columns: Mekân No and Kaynak Madde.
      "Risk Satırları": drop(sheets["Risk Satırları"], 2),
      "Kontrol Listesi": drop(sheets["Kontrol Listesi"], 1),
    };
    expect(stripIds(ok(restoreBackup(legacy)))).toEqual(stripIds(a));
  });
});
