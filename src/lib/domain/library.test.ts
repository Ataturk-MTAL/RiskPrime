import { describe, expect, test } from "vite-plus/test";
import { addLocation, emptyAssessment } from "./assessment";
import { addChecklist } from "./checklist";
import { addFromLibrary, previewLibraryAdd } from "./library";
import { setChecklistLocations } from "./links";
import libraryData from "../data/library.json";
import areaLocations from "../data/locations.json";
import starter from "../data/starter.json";
import type { Assessment, ChecklistTemplate, Library, LocationTemplate } from "./types";

const meb = (code: string): ChecklistTemplate => ({
  code,
  name: `${code} listesi`,
  source: "external",
  items: [{ no: "1.01", text: "Madde?", ref: `${code}.01` }],
});
const MEB = [meb("KL-26"), meb("KL-37"), meb("KL-40")];
const tpl = (name: string, checklists?: string[]): LocationTemplate => ({
  name,
  type: "workshop",
  building: "",
  area: "Makine Teknolojisi",
  rows: [{ equipment: "Tezgâh", hazard: "Kesilme", action: "Koruyucu" }],
  ...(checklists ? { checklists } : {}),
});
const loc = (a: Assessment, name: string) => a.locations.find((l) => l.name === name)!;
const lists = (a: Assessment, code: string) => a.checklists.filter((c) => c.code === code);

describe("addFromLibrary", () => {
  test("adds the location with its rows and binds the lists it names", () => {
    const a = addFromLibrary(emptyAssessment(), [tpl("CNC", ["KL-26", "KL-37"])], [], MEB);
    const cnc = loc(a, "CNC");
    expect(cnc.rows.map((r) => r.equipment)).toEqual(["Tezgâh"]);
    expect(lists(a, "KL-26")[0].locationIds).toEqual([cnc.id]);
    expect(lists(a, "KL-37")[0].locationIds).toEqual([cnc.id]);
    expect(lists(a, "KL-40")).toHaveLength(0);
  });

  test("two locations naming the same list share one copy of it", () => {
    const a = addFromLibrary(
      emptyAssessment(),
      [tpl("CNC", ["KL-37"]), tpl("Torna", ["KL-37"])],
      [],
      MEB,
    );
    expect(lists(a, "KL-37")).toHaveLength(1);
    expect(lists(a, "KL-37")[0].locationIds).toEqual([loc(a, "CNC").id, loc(a, "Torna").id]);
  });

  test("appends to a list already bound to other locations", () => {
    const start = addChecklist(
      addLocation(emptyAssessment(), { id: "x", name: "Eski" }),
      meb("KL-40"),
    );
    const bound = setChecklistLocations(start, start.checklists[0].id, ["x"]);
    const a = addFromLibrary(bound, [tpl("Kaynak", ["KL-40"])], [], MEB);
    expect(lists(a, "KL-40")).toHaveLength(1);
    expect(lists(a, "KL-40")[0].locationIds).toEqual(["x", loc(a, "Kaynak").id]);
  });

  test("leaves a school-wide list school-wide: it already covers the new location", () => {
    const a = addFromLibrary(emptyAssessment(), [tpl("CNC", ["KL-26"])], [meb("KL-26")], MEB);
    expect(lists(a, "KL-26")).toHaveLength(1);
    expect(lists(a, "KL-26")[0].locationIds).toBeUndefined();
  });

  test("a location without lists adds only itself", () => {
    const a = addFromLibrary(emptyAssessment(), [tpl("Oda")], [], MEB);
    expect(a.locations).toHaveLength(1);
    expect(a.checklists).toHaveLength(0);
  });

  test("every shipped area template adds cleanly to the starter with its lists bound", () => {
    const library = libraryData as unknown as Library;
    const templates = areaLocations as LocationTemplate[];
    const start = structuredClone(starter) as unknown as Assessment;
    const a = addFromLibrary(start, templates, [], library.checklists);
    expect(a.locations).toHaveLength(start.locations.length + templates.length);
    for (const t of templates) {
      const id = loc(a, t.name).id;
      for (const code of t.checklists ?? []) {
        const list = lists(a, code)[0];
        expect(list.locationIds ?? [], `${t.name} ${code}`).toContain(id);
      }
    }
  });

  test("throws when a named list is not in the library", () => {
    expect(() => addFromLibrary(emptyAssessment(), [tpl("CNC", ["KL-99"])], [], MEB)).toThrow(
      "KL-99",
    );
  });
});

describe("previewLibraryAdd", () => {
  test("names the lists a new location brings", () => {
    const names = previewLibraryAdd(emptyAssessment(), [tpl("CNC", ["KL-26", "KL-37"])], [], MEB);
    expect(names).toEqual(["KL-26", "KL-37"]);
  });

  test("is empty when the lists already exist and are bound elsewhere", () => {
    const start = addChecklist(
      addLocation(emptyAssessment(), { id: "x", name: "Eski" }),
      meb("KL-40"),
    );
    const bound = setChecklistLocations(start, start.checklists[0].id, ["x"]);
    expect(previewLibraryAdd(bound, [tpl("Kaynak", ["KL-40"])], [], MEB)).toEqual([]);
  });

  test("agrees with the lists addFromLibrary really adds", () => {
    const locations = [tpl("CNC", ["KL-26"]), tpl("Torna", ["KL-26", "KL-37"])];
    const before = emptyAssessment();
    const real = addFromLibrary(before, locations, [meb("KL-40")], MEB);
    const names = previewLibraryAdd(before, locations, [meb("KL-40")], MEB);
    expect(names).toHaveLength(real.checklists.length - before.checklists.length);
  });

  test("does not change the assessment it is given", () => {
    const before = emptyAssessment();
    previewLibraryAdd(before, [tpl("CNC", ["KL-26"])], [], MEB);
    expect(before.checklists).toHaveLength(0);
  });
});
