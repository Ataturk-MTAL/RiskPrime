import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment, updateRow, updateSchool } from "./assessment";
import { checklistRows, locationSuffix, outputName, pdfData, riskRows } from "./export-data";
import { withAnswers } from "./test-helpers";
import type { Assessment } from "./types";

function sample(): Assessment {
  let a = updateSchool(emptyAssessment("2026-2027"), {
    name: "Örnek MTAL",
    scope: "Elektrik Alanı",
    grouping: "building",
  });
  a = addLocation(a, { id: "a-1", name: "ELE1", building: "C Blok", area: "Elektrik" });
  a = addRow(a, "a-1", {
    id: "r-1",
    equipment: "Matkap",
    hazard: "Kesik",
    likelihood: 3,
    severity: 5,
  });
  return withAnswers(
    {
      ...a,
      checklists: [
        {
          id: "k1",
          code: "KL-11",
          name: "Elektrik",
          source: "external",
          items: [{ id: "m1", no: "1", text: "Pano kapalı mı?" }],
        },
      ],
    },
    "k1",
    null,
    { m1: "yes" },
    { m1: "Tamam" },
  );
}

describe("export-data", () => {
  test("risk rows carry score and level label", () => {
    const rows = riskRows(sample());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      location: "ELE1",
      building: "C Blok",
      score: 15,
      level: "Yüksek",
      no: 1,
      status: "Açık",
    });
  });

  test("unscored row has empty score and level", () => {
    const a = updateRow(sample(), "a-1", "r-1", { likelihood: null });
    const [r] = riskRows(a);
    expect(r.score).toBe("");
    expect(r.level).toBe("");
  });

  test("checklist rows turn the answer into readable text", () => {
    const [r] = checklistRows(sample());
    expect(r.code).toBe("KL-11");
    expect(r.answer).toBe("Evet");
    expect(r.note).toBe("Tamam");
    expect(r.location).toBe("Okul geneli");
  });

  test("checklist rows and pdf blocks come one per inspection, titled with the location", () => {
    let a = sample();
    a = { ...a, checklists: [{ ...a.checklists[0], locationIds: ["a-1"] }] };
    a = withAnswers(a, "k1", "a-1", { m1: "no" });
    expect(checklistRows(a).map((r) => [r.location, r.answer])).toEqual([["ELE1", "Hayır"]]);
    const [block] = pdfData(a, "full").checklists;
    expect(block.name).toBe("Elektrik — ELE1");
    expect(block.items[0]).toMatchObject({ no: "1", answer: "no", note: "" });
    expect(pdfData(a, "blank").checklists[0].items[0].answer).toBe("");
  });

  test("blank pdf data clears scores and answers without touching the source", () => {
    const a = sample();
    const v = pdfData(a, "blank");
    const row = v.groups[0].locations[0].rows[0];
    expect(v.kind).toBe("blank");
    expect(v.groups[0].title).toBe("C Blok");
    expect(row.likelihood).toBeNull();
    expect(row.level).toBeNull();
    expect(v.checklists[0].items[0].answer).toBe("");
    expect(v.checklists[0].name).toBe("Elektrik — Okul geneli");
    expect(a.locations[0].rows[0].likelihood).toBe(3);
    expect(a.inspections[0].answers[0].answer).toBe("yes");
  });

  test("full pdf data carries level key and color", () => {
    const row = pdfData(sample(), "full").groups[0].locations[0].rows[0];
    expect(row.score).toBe(15);
    expect(row.level?.key).toBe("high");
    expect(row.level?.background).toBe("#ff0000");
  });

  test("invalid pdf kind throws", () => {
    expect(() => pdfData(sample(), "xyz" as never)).toThrow(/Geçersiz çıktı türü/);
  });

  test("output name includes period and suffix", () => {
    expect(outputName(sample(), "xlsx")).toBe("risk-2026-2027.xlsx");
    expect(outputName(sample(), "pdf", "bos-form")).toBe("risk-2026-2027-bos-form.pdf");
    expect(outputName(emptyAssessment(""), "docx")).toBe("risk-degerlendirme.docx");
  });
});

describe("pdfData for one location", () => {
  const two = (): Assessment =>
    addLocation(sample(), { id: "a-2", name: "ELE2", building: "D Blok" });

  test("keeps only the chosen location and drops checklists and empty groups", () => {
    const data = pdfData(two(), "full", "a-1");
    expect(data.groups.flatMap((g) => g.locations.map((l) => l.id))).toEqual(["a-1"]);
    expect(data.groups.every((g) => g.locations.length > 0)).toBe(true);
    expect(data.checklists).toEqual([]);
  });

  test("throws for an unknown location", () => {
    expect(() => pdfData(sample(), "full", "yok")).toThrow("Mekân bulunamadı");
  });

  test("without locationId keeps everything", () => {
    const data = pdfData(two(), "full");
    expect(data.groups.flatMap((g) => g.locations)).toHaveLength(2);
    expect(data.checklists).toHaveLength(1);
  });
});

describe("locationSuffix", () => {
  test("transliterates the location name for the file name", () => {
    expect(locationSuffix("Elektrik Atölyesi İ/1")).toBe("mekan-Elektrik-Atolyesi-I-1");
  });
});
