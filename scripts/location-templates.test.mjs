import { describe, it, expect } from "vite-plus/test";
import { buildLocations, parseLocationFiles, validateLocations } from "./location-templates.mjs";

const ROW = `[[location.row]]
equipment = "CNC tezgâhı"
hazard = "Kesilme"
affected = "Öğrenci"
action = "Kapı kilitli"
responsible = "Atölye öğretmeni"
`;
const loc = (name, extra = "") =>
  `[[location]]\nname = "${name}"\ntype = "workshop"\nchecklists = ["KL-37"]\n${extra}\n${ROW}`;
const file = (body, name = "makine.toml") => ({
  name,
  content: `area = "Makine Teknolojisi"\n\n${body}`,
});
const CONTEXT = { mebCodes: new Set(["KL-37", "KL-40"]), takenNames: new Set(["ELE1 · x"]) };
const problemsOf = (...files) => validateLocations(parseLocationFiles(files), CONTEXT);

describe("location templates", () => {
  it("builds library location templates with the area and default existing controls", () => {
    const out = buildLocations(parseLocationFiles([file(loc("CNC Atölyesi"))]));
    expect(out).toEqual([
      {
        name: "CNC Atölyesi",
        type: "workshop",
        building: "",
        area: "Makine Teknolojisi",
        checklists: ["KL-37"],
        rows: [
          {
            equipment: "CNC tezgâhı",
            hazard: "Kesilme",
            affected: "Öğrenci",
            existingControls: "Yok",
            action: "Kapı kilitli",
            responsible: "Atölye öğretmeni",
          },
        ],
      },
    ]);
  });

  it("accepts valid sources", () => {
    expect(problemsOf(file(loc("CNC")), file(loc("Kaynak"), "metal.toml"))).toEqual([]);
  });

  it("reports unreadable TOML and a missing area", () => {
    const problems = problemsOf(
      { name: "a.toml", content: "x = " },
      { name: "b.toml", content: loc("Y") },
    );
    expect(problems.join("\n")).toMatch(/a\.toml: TOML okunamadı/);
    expect(problems.join("\n")).toMatch(/b\.toml: area boş/);
  });

  it("reports duplicate names, also against existing library locations", () => {
    const problems = problemsOf(file(loc("CNC") + loc("CNC")), file(loc("ELE1 · x"), "b.toml"));
    expect(problems.filter((p) => p.includes("yinelenen mekân adı"))).toHaveLength(2);
  });

  it("reports an unknown type, unknown MEB list and a row without hazard", () => {
    const bad = loc("CNC").replace('"workshop"', '"garage"').replace('"KL-37"', '"KL-99"');
    const noHazard = loc("Torna").replace('hazard = "Kesilme"\n', "");
    const text = problemsOf(file(bad + noHazard)).join("\n");
    expect(text).toMatch(/CNC: tür/);
    expect(text).toMatch(/CNC: KL-99 kütüphanede yok/);
    expect(text).toMatch(/Torna satır 1: hazard boş/);
  });

  it("reports a location without rows and unknown row fields", () => {
    const empty = `[[location]]\nname = "Boş"\ntype = "office"\n`;
    const typo = loc("CNC").replace("action =", "acton =");
    const text = problemsOf(file(empty + "\n" + typo)).join("\n");
    expect(text).toMatch(/Boş: en az bir risk satırı gerekli/);
    expect(text).toMatch(/CNC satır 1: bilinmeyen alan acton/);
  });
});
