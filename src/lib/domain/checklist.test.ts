import { describe, expect, test } from "vite-plus/test";
import { emptyAssessment, addLocationFromTemplate } from "./assessment";
import * as c from "./checklist";
import { validate } from "./file";

const MEB = {
  code: "KL-26",
  name: "ELEKTRİKLİ TESİSAT",
  source: "external" as const,
  items: [{ no: "26.01", text: "Topraklama var mı?" }],
};
const ready = () => c.addChecklist(emptyAssessment("2026-2027"), MEB);

describe("checklist", () => {
  test("adds a library list with new ids, an empty school-wide inspection and kept source", () => {
    const a = ready();
    const [l] = a.checklists;
    expect(l.code).toBe("KL-26");
    expect(l.source).toBe("external");
    expect(l.id && l.items[0].id).toBeTruthy();
    expect(a.inspections).toHaveLength(1);
    expect(a.inspections[0]).toMatchObject({ checklistId: l.id, locationId: null, answers: [] });
    expect(validate(a)).toEqual([]);
  });

  test("adding the same list twice gives different ids", () => {
    const a = c.addChecklist(ready(), MEB);
    expect(a.checklists[0].id).not.toBe(a.checklists[1].id);
  });

  test("answer and note are set per inspection; invalid answer is rejected", () => {
    let a = ready();
    const l = a.checklists[0];
    a = c.setAnswer(a, l.id, null, l.items[0].id, "no");
    a = c.setNote(a, l.id, null, l.items[0].id, "Pano 2");
    expect(a.inspections[0].answers).toEqual([
      { itemId: l.items[0].id, answer: "no", note: "Pano 2" },
    ]);
    expect(() => c.setAnswer(a, l.id, null, l.items[0].id, "maybe" as never)).toThrow(
      /Geçersiz cevap/,
    );
  });

  test("an item without answer and note is not stored; unknown inspection or item throws", () => {
    const base = ready();
    const l = base.checklists[0];
    let a = c.setAnswer(base, l.id, null, l.items[0].id, "yes");
    a = c.setAnswer(a, l.id, null, l.items[0].id, "");
    expect(a.inspections[0].answers).toEqual([]);
    expect(() => c.setAnswer(base, l.id, "l9", l.items[0].id, "yes")).toThrow(/Denetim bulunamadı/);
    expect(() => c.setNote(base, l.id, null, "none", "x")).toThrow(/Madde bulunamadı/);
  });

  test("removeItem drops that item's answers; removeChecklist drops the inspections", () => {
    let a = c.addChecklist(emptyAssessment(), {
      items: [
        { no: "1", text: "a" },
        { no: "2", text: "b" },
      ],
    });
    const l = a.checklists[0];
    a = c.setAnswer(
      c.setAnswer(a, l.id, null, l.items[0].id, "yes"),
      l.id,
      null,
      l.items[1].id,
      "no",
    );
    a = c.removeItem(a, l.id, l.items[0].id);
    expect(a.inspections[0].answers.map((x) => x.itemId)).toEqual([l.items[1].id]);
    expect(c.removeChecklist(a, l.id).inspections).toEqual([]);
  });

  test("ready-made MEB item text and list name are locked", () => {
    const a = ready();
    const l = a.checklists[0];
    expect(() => c.updateItem(a, l.id, l.items[0].id, { text: "x" })).toThrow(/değiştirilemez/);
    expect(() => c.updateChecklist(a, l.id, { name: "x" })).toThrow(/değiştirilemez/);
  });

  test("items can be added to an MEB list, edited when added, and removed", () => {
    let a = ready();
    const id = a.checklists[0].id;
    a = c.addItem(a, id);
    const added = a.checklists[0].items[1];
    expect(added.no).toBe("2");
    expect(added.added).toBe(true);
    a = c.updateItem(a, id, added.id, { text: "Okul maddesi" });
    expect(a.checklists[0].items[1].text).toBe("Okul maddesi");
    a = c.removeItem(a, id, a.checklists[0].items[0].id);
    expect(a.checklists[0].items).toHaveLength(1);
  });

  test("the school own list is fully editable and removable", () => {
    let a = c.addChecklist(emptyAssessment(""), { name: "Yeni liste" });
    const l = a.checklists[0];
    expect(l.source).toBe("internal");
    a = c.updateChecklist(a, l.id, { code: "OK-1", name: "Atölye girişi" });
    expect(a.checklists[0].name).toBe("Atölye girişi");
    a = c.removeChecklist(a, l.id);
    expect(a.checklists).toHaveLength(0);
  });

  test("unknown list or item throws; input is not mutated", () => {
    const a = ready();
    const snapshot = JSON.stringify(a);
    const l = a.checklists[0];
    expect(() => c.removeChecklist(a, "none")).toThrow(/Kontrol listesi bulunamadı/);
    expect(() => c.removeItem(a, l.id, "none")).toThrow(/Madde bulunamadı/);
    c.setAnswer(a, l.id, null, l.items[0].id, "yes");
    expect(JSON.stringify(a)).toBe(snapshot);
  });

  test("library location is added with rows and new ids", () => {
    const tpl = {
      name: "ELE1",
      type: "workshop" as const,
      building: "",
      area: "EET",
      rows: [{ equipment: "Matkap", hazard: "Kesik" }],
    };
    const a = addLocationFromTemplate(emptyAssessment(""), tpl);
    expect(a.locations[0].name).toBe("ELE1");
    expect(validate(a)).toEqual([]);
  });

  test('summary counts total, answered and "no"', () => {
    let a = c.addChecklist(emptyAssessment(), {
      items: [
        { no: "1", text: "a" },
        { no: "2", text: "b" },
        { no: "3", text: "c" },
      ],
    });
    const l = a.checklists[0];
    a = c.setAnswer(a, l.id, null, l.items[0].id, "yes");
    a = c.setAnswer(a, l.id, null, l.items[1].id, "no");
    expect(c.summary(a, l.id)).toEqual({ total: 3, answered: 2, no: 1 });
  });
});
