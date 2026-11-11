import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment } from "./assessment";
import { addChecklist } from "./checklist";
import { fileName, parse, serialize, validate } from "./file";

function valid() {
  const a = addLocation(emptyAssessment("2026-2027"), { id: "a-1", name: "ELE1" });
  return addRow(a, "a-1", { id: "r-1", likelihood: 2, severity: 4 });
}

describe("file", () => {
  test("a written file reads back", () => {
    const a = valid();
    const r = parse(serialize(a));
    expect("assessment" in r && r.assessment).toEqual(a);
  });

  test("broken JSON gives a clear error", () => {
    expect(parse("{bozuk")).toEqual({ errors: ["Dosya okunamadı: geçerli bir JSON değil."] });
  });

  test("non-object content is rejected", () => {
    expect(parse("[1,2]")).toEqual({ errors: ["Dosya bir değerlendirme nesnesi değil."] });
  });

  test("invalid fields are listed with their path", () => {
    const a = valid();
    const loc = a.locations[0];
    const bad = {
      ...a,
      locations: [{ ...loc, type: "kitchen", rows: [{ ...loc.rows[0], severity: 6 }] }],
    };
    const e = validate(bad);
    expect(e.some((x) => x.startsWith("locations[0].type:"))).toBe(true);
    expect(e.some((x) => x.startsWith("locations[0].rows[0].severity:"))).toBe(true);
  });

  test("a newer version is not opened", () => {
    expect(validate({ ...valid(), version: 99 })[0]).toMatch(/daha yeni bir RiskPrime/);
  });

  test("checklists are validated", () => {
    const a = addChecklist(valid(), {
      code: "KL-26",
      name: "Elektrik",
      source: "external",
      items: [{ no: "1", text: "x" }],
    });
    const list = { ...a.checklists[0], items: [{ ...a.checklists[0].items[0], answer: "maybe" }] };
    const e = validate({ ...a, checklists: [list] });
    expect(e.some((x) => x.startsWith("checklists[0].items[0].answer:"))).toBe(true);
  });

  test("file name derives from the period", () => {
    expect(fileName(valid())).toBe("risk-2026-2027.json");
    expect(fileName(emptyAssessment(""))).toBe("risk-degerlendirme.json");
  });

  test("file name transliterates Turkish letters", () => {
    expect(fileName({ ...emptyAssessment(""), period: "Güz-2026" })).toBe("risk-Guz-2026.json");
    expect(fileName({ ...emptyAssessment(""), period: "ÇĞİÖŞÜ çğıöşü" })).toBe(
      "risk-CGIOSU-cgiosu.json",
    );
  });
});
