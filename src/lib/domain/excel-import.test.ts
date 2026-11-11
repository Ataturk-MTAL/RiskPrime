import { describe, expect, test } from "vite-plus/test";
import { addLocation, emptyAssessment } from "./assessment";
import { conflictingCodes, read, template } from "./excel-import";
import { validate } from "./file";

const CL_HEADER = ["Liste Kodu", "Liste Adı", "Madde No", "Madde"];
const RISK_HEADER = [
  "Mekân",
  "Mekân Türü",
  "Bina",
  "Alan",
  "Alet / Ekipman Grubu",
  "Tehlike ve Risk",
  "Etkilenen",
  "Mevcut Önlem",
  "Düzeltici Önlem",
  "Sorumlu",
  "O",
  "Ş",
];
const empty = () => emptyAssessment("2026-2027");
const ok = (r: ReturnType<typeof read>) => {
  if ("errors" in r) throw new Error(r.errors.join("\n"));
  return r;
};

describe("excel-import", () => {
  test("imports school info and signatories from the Okul Bilgileri sheet", () => {
    const r = ok(
      read(empty(), {
        "Okul Bilgileri": [
          ["Bilgi", "Değer"],
          ["Okul", "Örnek MTAL"],
          ["Gruplama", "Binaya göre"],
          ["Değerlendirme Tarihi", "15.09.2026"],
          [],
          ["İmzacı Unvanı", "Ad Soyad"],
          ["Okul Müdürü", "Ad SOYAD"],
        ],
      }),
    );
    expect(r.assessment.school.name).toBe("Örnek MTAL");
    expect(r.assessment.school.grouping).toBe("building");
    expect(r.assessment.assessmentDate).toBe("15.09.2026");
    expect(r.assessment.school.signatories).toEqual([{ title: "Okul Müdürü", name: "Ad SOYAD" }]);
    expect(r.summary.school).toBe(true);
    expect(validate(r.assessment)).toEqual([]);
  });

  test("a bad Okul Bilgileri row blocks the whole import", () => {
    const r = read(empty(), {
      "Okul Bilgileri": [["Gruplama", "Kata göre"]],
      "Risk Satırları": [RISK_HEADER, ["ELE1", "", "", "", "", "Kesik", "", "", "", "", "", ""]],
    });
    expect("errors" in r && r.errors[0]).toMatch(/^Okul Bilgileri, satır 1: Gruplama/);
  });

  test("template has school, checklist and risk sheets with header rows", () => {
    const t = template();
    expect(Object.keys(t)).toEqual(["Okul Bilgileri", "Kontrol Listesi", "Risk Satırları"]);
    expect(t["Okul Bilgileri"][0]).toEqual(["Bilgi", "Değer"]);
    expect(t["Kontrol Listesi"][0]).toEqual(CL_HEADER);
    expect(String(t["Risk Satırları"][1][0])).toMatch(/^ÖRNEK/);
  });

  test("checklist rows group by code, become external, example is skipped", () => {
    const r = ok(
      read(empty(), {
        "Kontrol Listesi": [
          CL_HEADER,
          ["ÖRNEK: KL-00", "x", "1", "y"],
          ["KL-26", "Elektrik", "26.01", "Topraklama var mı?"],
          ["KL-26", "Elektrik", "26.02", "Pano kapalı mı?"],
          ["OK-1", "Okul listesi", "1", "Kapı açık mı?"],
        ],
      }),
    );
    expect(r.assessment.checklists.map((x) => [x.code, x.items.length, x.source])).toEqual([
      ["KL-26", 2, "external"],
      ["OK-1", 1, "external"],
    ]);
    expect(validate(r.assessment)).toEqual([]);
  });

  test("risk rows create or match locations by name; column order is free", () => {
    const base = addLocation(empty(), { name: "ELE1", type: "workshop" });
    const r = ok(
      read(base, {
        "Risk Satırları": [
          ["Ş", "O", ...RISK_HEADER.slice(0, 10)],
          [
            5,
            "3",
            "ELE1",
            "Atölye",
            "",
            "",
            "Matkap",
            "Kesik",
            "Öğrenci",
            "Yok",
            "Siper",
            "Öğretmen",
          ],
          ["", "", "Depo 1", "Depo", "C Blok", "EET", "Raf", "Devrilme", "", "", "", ""],
        ],
      }),
    );
    const a = r.assessment;
    expect(a.locations).toHaveLength(2);
    expect([a.locations[0].rows[0].likelihood, a.locations[0].rows[0].severity]).toEqual([3, 5]);
    expect(a.locations[1].type).toBe("storage");
    expect(a.locations[1].building).toBe("C Blok");
    expect(a.locations[1].rows[0].likelihood).toBeNull();
    expect(r.summary).toEqual({
      lists: 0,
      items: 0,
      locations: 1,
      rows: 2,
      skippedRows: 0,
      school: false,
    });
  });

  test("a bad row adds nothing and errors carry sheet and row number", () => {
    const a = empty();
    const r = read(a, {
      "Risk Satırları": [
        RISK_HEADER,
        ["ELE1", "Atölye", "", "", "Matkap", "Kesik", "", "", "", "", 3, 6],
        ["", "Uzay", "", "", "", "Kesik", "", "", "", "", "", ""],
      ],
      "Kontrol Listesi": [CL_HEADER, ["KL-1", "A", "1", ""]],
    });
    if (!("errors" in r)) throw new Error("expected errors");
    expect(r.errors).toContain("Risk Satırları, satır 2: Ş 1-5 arası olmalı, '6' yazılmış.");
    expect(r.errors.some((e) => e.startsWith("Risk Satırları, satır 3: Mekân boş"))).toBe(true);
    expect(r.errors.some((e) => e.startsWith("Risk Satırları, satır 3: Mekân Türü"))).toBe(true);
    expect(r.errors.some((e) => e.startsWith("Kontrol Listesi, satır 2: Madde boş"))).toBe(true);
    expect(a.locations).toHaveLength(0);
  });

  test("missing header or unknown sheet gives an error", () => {
    const missing = read(empty(), { "Kontrol Listesi": [["Liste Kodu", "Madde"]] });
    expect("errors" in missing && missing.errors[0]).toMatch(/Liste Adı/);
    const unknown = read(empty(), { Sayfa1: [["a"]] });
    expect("errors" in unknown && unknown.errors[0]).toMatch(
      /"Kontrol Listesi" ya da "Risk Satırları"/,
    );
  });

  test("a list with the same code is replaced or appended", () => {
    const sheets = { "Kontrol Listesi": [CL_HEADER, ["KL-26", "Yeni ad", "1", "Yeni madde"]] };
    const first = ok(read(empty(), sheets)).assessment;
    expect(conflictingCodes(first, sheets)).toEqual(["KL-26"]);
    const replaced = ok(read(first, sheets, { sameCode: "replace" })).assessment;
    expect(replaced.checklists).toHaveLength(1);
    expect(replaced.checklists[0].name).toBe("Yeni ad");
    expect(ok(read(first, sheets, { sameCode: "append" })).assessment.checklists).toHaveLength(2);
  });

  test("same-named locations in different buildings stay separate", () => {
    const sheets = {
      "Risk Satırları": [
        RISK_HEADER,
        ["Atölye", "Atölye", "A Blok", "", "", "Tehlike", "", "", "", "", 2, 2],
        ["Atölye", "Atölye", "B Blok", "", "", "Tehlike", "", "", "", "", 2, 2],
      ],
    };
    const r = ok(read(empty(), sheets));
    expect(r.assessment.locations.map((l) => l.building)).toEqual(["A Blok", "B Blok"]);
    expect(r.summary.locations).toBe(2);
  });

  test("importing the same template twice skips the existing risk rows", () => {
    const sheets = {
      "Risk Satırları": [
        RISK_HEADER,
        ["ELE1", "Atölye", "", "", "Matkap", "Saç kapılması", "", "", "", "", 3, 4],
        ["ELE1", "Atölye", "", "", "Pense", "Kesik", "", "", "", "", 2, 2],
      ],
    };
    const first = ok(read(empty(), sheets));
    const second = ok(read(first.assessment, sheets));
    expect(second.assessment.locations).toHaveLength(1);
    expect(second.assessment.locations[0].rows).toHaveLength(2);
    expect(second.summary).toMatchObject({ rows: 0, skippedRows: 2, locations: 0 });
  });
});
