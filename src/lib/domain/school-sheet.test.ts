import { describe, expect, test } from "vite-plus/test";
import { emptyAssessment } from "./assessment";
import { applySchoolPatch, readSchoolSheet, schoolSheet } from "./school-sheet";

describe("school sheet", () => {
  test("round-trips school info, dates, grouping and signatories", () => {
    const a = {
      ...emptyAssessment("2026-2027"),
      assessmentDate: "01.09.2026",
      school: {
        name: "Örnek MTAL",
        scope: "Elektrik Alanı",
        grouping: "building" as const,
        signatories: [{ title: "Okul Müdürü", name: "Ad SOYAD" }],
      },
    };
    const errors: string[] = [];
    const back = applySchoolPatch(emptyAssessment(""), readSchoolSheet(schoolSheet(a), errors));
    expect(errors).toEqual([]);
    expect(back.school).toEqual(a.school);
    expect([back.period, back.assessmentDate]).toEqual(["2026-2027", "01.09.2026"]);
  });

  test("keeps current values for empty cells and keeps signatories when none are listed", () => {
    const base = {
      ...emptyAssessment("2025-2026"),
      school: { ...emptyAssessment().school, name: "Eski Ad" },
    };
    const errors: string[] = [];
    const patch = readSchoolSheet(
      [
        ["Bilgi", "Değer"],
        ["Okul", ""],
        ["Dönem", "2026-2027"],
      ],
      errors,
    );
    const next = applySchoolPatch(base, patch);
    expect(next.school.name).toBe("Eski Ad");
    expect(next.period).toBe("2026-2027");
    expect(next.school.signatories).toEqual(base.school.signatories);
    expect(base.period).toBe("2025-2026");
  });

  test("reports unknown labels and grouping values with row numbers", () => {
    const errors: string[] = [];
    readSchoolSheet(
      [
        ["Bilgi", "Değer"],
        ["Müdür", "X"],
        ["Gruplama", "Kata göre"],
      ],
      errors,
    );
    expect(errors).toEqual([
      "Okul Bilgileri, satır 2: 'Müdür' tanınmadı.",
      "Okul Bilgileri, satır 3: Gruplama 'Kata göre' tanınmadı; Alana göre, Binaya göre ya da Gruplama yok yazın.",
    ]);
  });
});
