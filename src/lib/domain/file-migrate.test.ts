import { describe, expect, test } from "vite-plus/test";
import { parse, serialize, validate } from "./file";
import { sourcesOf } from "./links";
import { deficiencies } from "./inspections";

const row = (id: string, over: object = {}) => ({
  id,
  equipment: "Matkap",
  hazard: "Tehlike",
  affected: "Öğrenci",
  existingControls: "",
  likelihood: null,
  severity: null,
  action: "",
  responsible: "",
  dueDate: "",
  status: "open",
  likelihoodAfter: null,
  severityAfter: null,
  ...over,
});

/** A version 1 file shaped like the starter: a list on two locations, a general list, answers on items. */
function v1File() {
  return {
    version: 1,
    period: "2026-2027",
    assessmentDate: "",
    validUntil: "",
    school: {
      name: "Örnek MTAL",
      scope: "Elektrik-Elektronik Teknolojisi",
      grouping: "area",
      signatories: [{ title: "Okul Müdürü", name: "" }],
    },
    locations: [
      { id: "a-01", name: "Tüm mekânlar", type: "common", building: "", area: "EET", rows: [] },
      {
        id: "a-02",
        name: "ELE16 Elektrik Atölyesi",
        type: "workshop",
        building: "",
        area: "EET",
        rows: [
          row("r-02-01", { sources: [{ listId: "k-01", itemId: "m-01-01" }] }),
          // legacy single `source`, pointing at a list that is not on this location
          row("r-02-02", { source: { listId: "k-01", itemId: "m-01-02" } }),
          row("r-02-03", { sources: [{ listId: "k-02", itemId: "m-02-01" }] }),
          row("r-02-04", { sources: [{ listId: "k-gone", itemId: "x" }] }),
        ],
      },
      {
        id: "a-03",
        name: "ELE17 Elektronik Atölyesi",
        type: "workshop",
        building: "",
        area: "EET",
        rows: [row("r-03-01", { sources: [{ listId: "k-01", itemId: "m-01-01" }] })],
      },
      {
        id: "a-04",
        name: "Depo",
        type: "storage",
        building: "",
        area: "EET",
        rows: [row("r-04-01", { sources: [{ listId: "k-01", itemId: "m-01-02" }] })],
      },
    ],
    checklists: [
      {
        id: "k-01",
        code: "",
        name: "Atölye genel",
        source: "internal",
        locationIds: ["gone", "a-03", "a-02"],
        items: [
          { id: "m-01-01", no: "1", text: "Pano kapalı mı?", answer: "no", note: "Kapatılacak" },
          {
            id: "m-01-02",
            no: "2",
            text: "Topraklama var mı?",
            answer: "yes",
            note: "",
            ref: "KL-26.07",
          },
          { id: "m-01-03", no: "3", text: "Söndürücü var mı?", answer: "", note: "" },
        ],
      },
      {
        id: "k-02",
        code: "KL-01",
        name: "Ortak liste",
        source: "external",
        items: [{ id: "m-02-01", no: "1.1", text: "Acil çıkış açık mı?", answer: "na", note: "" }],
      },
      { id: "k-03", code: "", name: "Boş liste", source: "internal", items: [] },
    ],
  };
}

const open = (value: unknown) => {
  const r = parse(JSON.stringify(value));
  if (!("assessment" in r)) throw new Error(r.errors.join("\n"));
  return r.assessment;
};

describe("migration v1 -> v2", () => {
  test("opens the file as version 2 and serializes version 2", () => {
    const a = open(v1File());
    expect(a.version).toBe(2);
    expect(JSON.parse(serialize(a)).version).toBe(2);
    expect(validate(JSON.parse(serialize(a)))).toEqual([]);
  });

  test("answers and notes move into the inspection of the list's first live location", () => {
    const a = open(v1File());
    // locationIds ["gone", "a-03", "a-02"] -> live ["a-03", "a-02"], first = a-03
    const answers = (listId: string, locationId: string | null) =>
      a.inspections.find((i) => i.checklistId === listId && i.locationId === locationId)?.answers;
    expect(answers("k-01", "a-03")).toEqual([
      { itemId: "m-01-01", answer: "no", note: "Kapatılacak" },
      { itemId: "m-01-02", answer: "yes", note: "" },
    ]);
    expect(answers("k-01", "a-02")).toEqual([]);
  });

  test("a general list's answers go to its school-wide inspection", () => {
    const a = open(v1File());
    expect(a.inspections.find((i) => i.checklistId === "k-02")).toMatchObject({
      locationId: null,
      answers: [{ itemId: "m-02-01", answer: "na", note: "" }],
    });
    expect(a.inspections.find((i) => i.checklistId === "k-03")).toMatchObject({
      locationId: null,
      answers: [],
    });
  });

  test("every list ends up with exactly its live locations as inspections", () => {
    const a = open(v1File());
    expect(a.inspections.map((i) => [i.checklistId, i.locationId])).toEqual([
      ["k-01", "a-03"],
      ["k-01", "a-02"],
      ["k-02", null],
      ["k-03", null],
    ]);
    expect(new Set(a.inspections.map((i) => i.id)).size).toBe(4);
  });

  test("items lose answer and note; everything else is kept", () => {
    const a = open(v1File());
    expect(a.checklists[0].items[1]).toEqual({
      id: "m-01-02",
      no: "2",
      text: "Topraklama var mı?",
      ref: "KL-26.07",
    });
    expect(a.locations[1].rows[0]).toMatchObject({ equipment: "Matkap", hazard: "Tehlike" });
    expect(a.school.name).toBe("Örnek MTAL");
  });

  test("a row source gets its row's location when that inspection exists, else the list's answered one", () => {
    const a = open(v1File());
    const sources = (id: string) =>
      a.locations.flatMap((l) => l.rows).find((r) => r.id === id)?.sources;
    // r-02-01 sits in a-02, which is an inspection of k-01
    expect(sources("r-02-01")).toEqual([{ listId: "k-01", itemId: "m-01-01", locationId: "a-02" }]);
    // r-03-01 sits in a-03
    expect(sources("r-03-01")).toEqual([{ listId: "k-01", itemId: "m-01-01", locationId: "a-03" }]);
    // the legacy `source` becomes `sources`, in a-02 too
    expect(sources("r-02-02")).toEqual([{ listId: "k-01", itemId: "m-01-02", locationId: "a-02" }]);
    // r-04-01 is in Depo, which k-01 does not cover -> the inspection that got the answers
    expect(sources("r-04-01")).toEqual([{ listId: "k-01", itemId: "m-01-02", locationId: "a-03" }]);
    // a general list's inspection is school-wide
    expect(sources("r-02-03")).toEqual([{ listId: "k-02", itemId: "m-02-01", locationId: null }]);
    // a dangling list stays dangling (and is ignored by the helpers)
    expect(sources("r-02-04")).toEqual([{ listId: "k-gone", itemId: "x", locationId: null }]);
    expect(serialize(a)).not.toContain('"source": {');
  });

  test("migrated sources resolve to the moved answers", () => {
    const a = open(v1File());
    const viaA03 = a.locations[3].rows[0];
    expect(sourcesOf(a, viaA03)[0]).toMatchObject({ no: "2", locationId: "a-03", answer: "yes" });
    // an eksik that was "Hayır" in v1 is still a deficiency, now in a-03
    expect(deficiencies(a).map((d) => [d.itemNo, d.locationId, d.rowIds])).toEqual([
      ["1", "a-03", ["r-03-01"]],
    ]);
  });

  test("migrating twice (v2 re-read) changes nothing", () => {
    const once = open(v1File());
    expect(open(JSON.parse(serialize(once)))).toEqual(once);
  });

  test("a broken v1 file is still reported, not swallowed", () => {
    const bad = v1File();
    (bad.checklists[0].items[0] as { answer: string }).answer = "belki";
    (bad.locations[1] as { rows: unknown }).rows = "yok";
    const r = parse(JSON.stringify(bad));
    expect("errors" in r && r.errors).toEqual([
      "locations[1].rows: liste olmalı.",
      "inspections[0].answers[0].answer: yes, no, na ya da boş olmalı.",
    ]);
  });
});
