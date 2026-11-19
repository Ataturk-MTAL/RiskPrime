import { describe, expect, test } from "vite-plus/test";
import starter from "../data/starter.json";
import { backupSheets, isBackup, restoreBackup } from "./excel-backup";
import { read, template } from "./excel-import";
import { validate } from "./file";
import { ensureInspections } from "./inspections";
import { withAnswers } from "./test-helpers";
import type { Assessment } from "./types";

type Sheets = Record<string, unknown[][]>;

/** Deep copy without any "id" keys, so regenerated ids do not matter. */
function stripIds<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value), (key, v) => (key === "id" ? undefined : v));
}

/** stripIds, with every id reference (list locations, inspections) turned into positions. */
function normalized(a: Assessment): unknown {
  const place = (id: string) => a.locations.findIndex((l) => l.id === id);
  return stripIds({
    ...a,
    checklists: a.checklists.map((c) => ({ ...c, locationIds: c.locationIds?.map(place) })),
    inspections: a.inspections.map((i) => {
      const list = a.checklists.findIndex((c) => c.id === i.checklistId);
      return {
        list,
        location: i.locationId === null ? null : place(i.locationId),
        answers: i.answers.map((x) => ({
          item: a.checklists[list].items.findIndex((m) => m.id === x.itemId),
          answer: x.answer,
          note: x.note,
        })),
      };
    }),
  });
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
  const full: Assessment = {
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
          { id: "m1", no: "01.01", text: "Soru bir?" },
          { id: "m2", no: "01.02", text: "Soru iki?" },
          { id: "m3", no: "01.03", text: "Soru üç?" },
          { id: "m4", no: "01.04", text: "Eklenen", added: true },
        ],
        locationIds: [first.id, second.id],
      },
      {
        id: "k2",
        code: "",
        name: "Okul içi liste",
        source: "internal",
        items: [{ id: "m5", no: "1", text: "Kendi sorumuz" }],
      },
      { id: "k3", code: "KL-02", name: "Boş liste", source: "external", items: [] },
    ],
  };
  // k1 is inspected in two locations with different answers; k2 and k3 are school-wide.
  const k1First = withAnswers(
    ensureInspections(full),
    "k1",
    first.id,
    { m1: "yes", m2: "no", m3: "na" },
    { m1: "Tamam" },
  );
  const k1Both = withAnswers(k1First, "k1", second.id, { m1: "no", m2: "yes" }, { m4: "Eksik" });
  return withAnswers(k1Both, "k2", null, { m5: "yes" }, { m5: "not" });
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
    expect(normalized(restored)).toEqual(normalized(a));
    expect(restored.inspections).toHaveLength(4);
    expect(validate(restored)).toEqual([]);
  });

  test("Kontrol Listesi has one row per item per inspection with the location number", () => {
    const rows = sheetsOf(fullAssessment())["Kontrol Listesi"];
    const header = rows[0];
    expect(header.at(-1)).toBe("Mekân No");
    // k1: 4 items x 2 locations, k2: 1 item school-wide, k3: empty list (one placeholder row)
    expect(rows.slice(1).map((r) => r.at(-1))).toEqual([1, 1, 1, 1, 2, 2, 2, 2, "", ""]);
    expect(rows[1][header.indexOf("Cevap")]).toBe("Evet");
    expect(rows[5][header.indexOf("Cevap")]).toBe("Hayır");
  });

  test("round-trips ChecklistItem.fromBank", () => {
    const a = fullAssessment();
    const flagged: Assessment = {
      ...a,
      checklists: a.checklists.map((l, i) =>
        i === 0
          ? {
              ...l,
              items: l.items.map((m, j) => (j === 1 ? { ...m, fromBank: true as const } : m)),
            }
          : l,
      ),
    };
    const restored = ok(restoreBackup(sheetsOf(flagged)));
    expect(restored.checklists[0].items.map((m) => m.fromBank)).toEqual([
      undefined,
      true,
      undefined,
      undefined,
    ]);
    expect(normalized(restored)).toEqual(normalized(flagged));
  });

  test("a Kontrol Listesi without the Bankadan column restores with fromBank absent", () => {
    const sheets = sheetsOf(fullAssessment());
    const rows = sheets["Kontrol Listesi"];
    const at = rows[0].indexOf("Bankadan");
    expect(at).toBeGreaterThan(-1);
    const old = { ...sheets, "Kontrol Listesi": rows.map((r) => r.filter((_, j) => j !== at)) };
    const restored = ok(restoreBackup(old));
    expect(restored.checklists.flatMap((l) => l.items).some((m) => m.fromBank)).toBe(false);
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

  test("a backup written with the old Ortak label still restores", () => {
    const base = fullAssessment();
    const withCommon = {
      ...base,
      locations: base.locations.map((l, i) => (i === 0 ? { ...l, type: "common" as const } : l)),
    };
    const sheets = sheetsOf(withCommon);
    const oldSheets = Object.fromEntries(
      Object.entries(sheets).map(([name, rows]) => [
        name,
        rows.map((row) => row.map((c) => (c === "Okul geneli (tüm mekânlar)" ? "Ortak" : c))),
      ]),
    ) as Sheets;
    expect(JSON.stringify(oldSheets)).toContain('"Ortak"');
    const restored = ok(restoreBackup(oldSheets));
    expect(restored.locations[0].type).toBe("common");
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
    expect(normalized(ok(restoreBackup(sheetsOf(odd))))).toEqual(normalized(odd));
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

  test("restores older backups without the location key columns", () => {
    const a = fullAssessment();
    const sheets = sheetsOf(a);
    const drop = (rows: unknown[][], n: number) => rows.map((r) => r.slice(0, -n));
    const lists = sheets["Kontrol Listesi"];
    const locationsAt = lists[0].indexOf("Mekân Nolar");
    // Old backups have neither the location numbers nor the per-location rows.
    const oldLists = lists
      .filter((r, i) => i === 0 || r.at(-1) !== 2)
      .map((r) => drop([r.map((c, j) => (j === locationsAt && r !== lists[0] ? "" : c))], 1)[0]);
    const legacy = {
      ...sheets,
      Mekânlar: drop(sheets["Mekânlar"], 1),
      // Last two columns: Mekân No and Kaynak Madde.
      "Risk Satırları": drop(sheets["Risk Satırları"], 2),
      "Kontrol Listesi": oldLists,
    };
    const restored = ok(restoreBackup(legacy));
    expect(stripIds(restored.locations)).toEqual(stripIds(a.locations));
  });

  test("a version 1 backup puts a list's answers into its first location's inspection", () => {
    const a = fullAssessment();
    const list = sheetsOf(a)["Kontrol Listesi"];
    const keyAt = list[0].length - 1;
    // v1: no "Mekân No" column and one row per item (here: the first location's rows).
    const v1 = list.filter((r, i) => i === 0 || r[keyAt] !== 2).map((r) => r.slice(0, keyAt));
    const restored = ok(restoreBackup({ ...sheetsOf(a), "Kontrol Listesi": v1 }));
    const [first, second] = restored.locations;
    const answers = (locationId: string | null) =>
      restored.inspections.find((i) => i.locationId === locationId)?.answers.map((x) => x.answer);
    expect(answers(first.id)).toEqual(["yes", "no", "na"]);
    expect(answers(second.id)).toEqual([]);
    expect(answers(null)).toEqual(["yes"]);
    expect(validate(restored)).toEqual([]);
  });
});

describe("excel-backup question refs", () => {
  test("keeps bank question refs through a backup round trip", () => {
    const a = starter as unknown as Assessment;
    const refs = (x: Assessment) => x.checklists.flatMap((l) => l.items.map((m) => m.ref ?? ""));
    expect(refs(a).some(Boolean)).toBe(true);
    expect(refs(ok(restoreBackup(sheetsOf(a))))).toEqual(refs(a));
  });
});

const a0 = () => "2026-10-01T08:00:00.000Z";

describe("excel-backup snapshot meta", () => {
  const HASH = "a".repeat(64);
  const withMeta = (meta: Partial<Assessment["meta"]>): Assessment => {
    const a = fullAssessment();
    return { ...a, meta: { ...a.meta, ...meta } };
  };

  test("the marker sheet lists the meta and restore brings it back", () => {
    const a = withMeta({ revision: 3, bankVersion: "2026.1", previousHash: HASH });
    const marker = sheetsOf(a)["RiskPrime"];
    expect(marker).toContainEqual(["Revizyon", 3]);
    expect(marker).toContainEqual(["Önceki özet", HASH]);
    const restored = ok(restoreBackup(sheetsOf(a)));
    expect(restored.meta).toEqual(a.meta);
  });

  test("a signed period is restored as an unsigned draft (ids change, so the seal cannot hold)", () => {
    const a = withMeta({ status: "signed", signedAt: a0(), contentHash: HASH, revision: 2 });
    const restored = ok(restoreBackup(sheetsOf(a)));
    expect(restored.meta).toMatchObject({ status: "draft", revision: 2 });
    expect(restored.meta.signedAt).toBeUndefined();
    expect(restored.meta.contentHash).toBeUndefined();
  });

  test("an older backup without meta rows still restores with a fresh draft meta", () => {
    const sheets = sheetsOf(fullAssessment());
    const old = { ...sheets, RiskPrime: sheets["RiskPrime"].slice(0, 3) };
    expect(ok(restoreBackup(old)).meta).toMatchObject({ status: "draft", revision: 1 });
  });
});
