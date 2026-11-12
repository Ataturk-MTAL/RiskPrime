import { describe, expect, test } from "vite-plus/test";
import {
  addLocation,
  duplicateLocation,
  duplicateRow,
  emptyAssessment,
  removeLocation,
  updateRow,
} from "./assessment";
import { removeChecklist, removeItem, setAnswer } from "./checklist";
import { defaultLocationId, hasChecklistRisk, riskRowFromChecklistItem } from "./checklist-risk";
import { backupSheets, restoreBackup } from "./excel-backup";
import { pdfData } from "./export-data";
import { parse, serialize, validate } from "./file";
import { ensureInspections } from "./inspections";
import {
  addRowSource,
  clearRowSources,
  listsForLocation,
  removeRowSource,
  rowsForItem,
  setChecklistLocations,
  sourceLabel,
  sourcesOf,
} from "./links";
import { readiness } from "./readiness";
import { rollover } from "./rollover";
import { withAnswers } from "./test-helpers";
import type { Assessment } from "./types";

/** Two locations; k1 (general, so one school-wide inspection) has two "Hayır" items. */
function sample(): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Atölye" });
  return withAnswers(
    {
      ...a,
      checklists: [
        {
          id: "k1",
          code: "KL-26",
          name: "Elektrik",
          source: "external",
          items: [
            { id: "m1", no: "06", text: "Pano kapalı mı?" },
            { id: "m2", no: "07", text: "Topraklama var mı?" },
          ],
        },
        { id: "k2", code: "", name: "Okul içi liste", source: "internal", items: [] },
      ],
    },
    "k1",
    null,
    { m1: "no", m2: "no" },
  );
}

/** m1 of the school-wide inspection became a risk row in both locations. */
const linked = () => {
  let a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1");
  a = riskRowFromChecklistItem(a, "k1", "m1", null, "l2");
  return a;
};

/** k1 inspected in l1 and l2 with different answers; m1 is a row in each location. */
const perLocation = () => {
  let a = setChecklistLocations(sample(), "k1", ["l1", "l2"]);
  a = withAnswers(a, "k1", "l1", { m1: "no", m2: "yes" });
  a = withAnswers(a, "k1", "l2", { m1: "yes", m2: "no" });
  return riskRowFromChecklistItem(riskRowFromChecklistItem(a, "k1", "m1", "l1"), "k1", "m2", "l2");
};

describe("links", () => {
  test("riskRowFromChecklistItem sets the sources with the inspection scope", () => {
    expect(linked().locations[0].rows[0].sources).toEqual([
      { listId: "k1", itemId: "m1", locationId: null },
    ]);
  });

  test("sourceLabel takes the MEB reference from the text of codeless lists", () => {
    const info = { code: "", listName: "Okul içi liste", no: "4", text: "Dolap (KL-26.02/26.03)" };
    const full = { listId: "k", itemId: "i", locationId: null, answer: "no" as const, ...info };
    expect(sourceLabel(full)).toBe("KL-26.02");
    expect(sourceLabel({ ...full, text: "Pano (KL-26.06) ve (KL-26.07)" })).toBe("KL-26.06");
    expect(sourceLabel({ ...full, text: "Dolap sabit mi?" })).toBe("Okul içi lis md.4");
    expect(sourceLabel({ ...full, code: "KL-26", text: "x (KL-99.01)" })).toBe("KL-26.4");
  });

  test("hazard keeps the MEB reference only for coded lists; source text for codeless lists", () => {
    const base = sample();
    const withCodeless = withAnswers(
      ensureInspections({
        ...base,
        checklists: [
          base.checklists[0],
          { ...base.checklists[1], items: [{ id: "x1", no: "1", text: "Dolap sabit mi?" }] },
        ],
      }),
      "k2",
      null,
      { x1: "no" },
    );
    const a = riskRowFromChecklistItem(
      riskRowFromChecklistItem(withCodeless, "k1", "m1", null, "l1"),
      "k2",
      "x1",
      null,
      "l1",
    );
    expect(a.locations[0].rows.map((r) => r.hazard)).toEqual([
      "Pano kapalı mı? (KL-26.06)",
      "Dolap sabit mi?",
    ]);
    expect(
      pdfData(a, "full").groups.flatMap((g) =>
        g.locations.flatMap((l) => l.rows.map((r) => r.source)),
      ),
    ).toEqual(["KL-26.06", "Okul içi lis md.1"]);
  });

  test("rowsForItem lists the rows of one inspection across locations", () => {
    const rows = rowsForItem(linked(), "k1", "m1", null);
    expect(rows.map((r) => [r.locationId, r.locationName, r.number])).toEqual([
      ["l1", "Depo", 1],
      ["l2", "Atölye", 1],
    ]);
    expect(rowsForItem(linked(), "k1", "m2", null)).toEqual([]);
    expect(rowsForItem(linked(), "k1", "m1", "l1")).toEqual([]);
  });

  test("sourcesOf returns the items in order with their inspection's answer, drops dangling", () => {
    const a = linked();
    expect(sourcesOf(a, a.locations[0].rows[0])).toEqual([
      {
        listId: "k1",
        itemId: "m1",
        locationId: null,
        code: "KL-26",
        listName: "Elektrik",
        no: "06",
        answer: "no",
        text: "Pano kapalı mı?",
      },
    ]);
    const row = a.locations[0].rows[0];
    const dangling = {
      ...row,
      sources: [
        { listId: "k1", itemId: "zz", locationId: null },
        { listId: "k1", itemId: "m2", locationId: null },
        { listId: "k1", itemId: "m1", locationId: "l9" },
        { listId: "k1", itemId: "m1", locationId: null },
      ],
    };
    expect(sourcesOf(a, dangling).map((s) => s.no)).toEqual(["07", "06"]);
    expect(sourcesOf(a, { ...row, sources: undefined })).toEqual([]);
  });

  test("the same item has a different answer in each location's inspection", () => {
    const a = perLocation();
    const [first] = sourcesOf(a, a.locations[0].rows[0]);
    const [second] = sourcesOf(a, a.locations[1].rows[0]);
    expect([first.no, first.locationId, first.answer]).toEqual(["06", "l1", "no"]);
    expect([second.no, second.locationId, second.answer]).toEqual(["07", "l2", "no"]);
    // m1 in l2's inspection is "yes", so a source pointing there reads "yes"
    const toL2 = {
      ...a.locations[0].rows[0],
      sources: [{ listId: "k1", itemId: "m1", locationId: "l2" }],
    };
    expect(sourcesOf(a, toL2)[0].answer).toBe("yes");
  });

  test("hasChecklistRisk uses the source, falls back to hazard text", () => {
    const a = linked();
    expect(hasChecklistRisk(a, "k1", "m1", null, "l1")).toBe(true);
    expect(hasChecklistRisk(a, "k1", "m2", null, "l1")).toBe(false);
    expect(hasChecklistRisk(perLocation(), "k1", "m1", "l2")).toBe(false);
    const legacy = updateRow(a, "l1", a.locations[0].rows[0].id, {});
    const { sources: _s, ...bare } = legacy.locations[0].rows[0];
    expect(
      hasChecklistRisk(
        { ...legacy, locations: [{ ...legacy.locations[0], rows: [bare] }, legacy.locations[1]] },
        "k1",
        "m1",
        null,
        "l1",
      ),
    ).toBe(true);
  });

  test("setChecklistLocations keeps the inspections in step; listsForLocation / defaultLocationId", () => {
    let a = setChecklistLocations(sample(), "k1", ["zz", "l2", "l2"]);
    expect(a.checklists[0].locationIds).toEqual(["l2"]);
    expect(a.inspections.filter((i) => i.checklistId === "k1").map((i) => i.locationId)).toEqual([
      "l2",
    ]);
    expect(listsForLocation(a, "l2")).toEqual({ lists: [a.checklists[0]], generalCount: 1 });
    expect(listsForLocation(a, "l1")).toEqual({ lists: [], generalCount: 1 });
    expect(defaultLocationId(a, a.checklists[0])).toBe("l2");
    a = setChecklistLocations(a, "k1", []);
    expect("locationIds" in a.checklists[0]).toBe(false);
    expect(a.inspections.filter((i) => i.checklistId === "k1").map((i) => i.locationId)).toEqual([
      null,
    ]);
    expect(() => setChecklistLocations(a, "x", [])).toThrow();
  });

  test("dangling locationIds count as general", () => {
    const a = { ...sample(), checklists: [{ ...sample().checklists[0], locationIds: ["gone"] }] };
    expect(listsForLocation(a, "l1")).toEqual({ lists: [], generalCount: 1 });
  });

  test("addRowSource appends without duplicates; removeRowSource / clearRowSources shrink", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1");
    const rowId = a.locations[0].rows[0].id;
    const m2 = { listId: "k1", itemId: "m2", locationId: null };
    const m1 = { listId: "k1", itemId: "m1", locationId: null };
    const two = addRowSource(a, "l1", rowId, m2);
    expect(two.locations[0].rows[0].sources?.map((s) => s.itemId)).toEqual(["m1", "m2"]);
    expect(addRowSource(two, "l1", rowId, m1)).toEqual(two);
    const one = removeRowSource(two, "l1", rowId, m1);
    expect(one.locations[0].rows[0].sources).toEqual([m2]);
    const none = removeRowSource(one, "l1", rowId, m2);
    expect("sources" in none.locations[0].rows[0]).toBe(false);
    expect("sources" in clearRowSources(two, "l1", rowId).locations[0].rows[0]).toBe(false);
    expect(a.locations[0].rows[0].sources).toHaveLength(1);
    expect(() => addRowSource(a, "l1", rowId, { ...m2, itemId: "zz" })).toThrow();
    expect(() => addRowSource(a, "l1", rowId, { ...m2, locationId: "l2" })).toThrow();
    expect(() => addRowSource(a, "l1", "zz", m2)).toThrow();
    expect(() => clearRowSources(a, "zz", rowId)).toThrow();
  });

  test("the same item in two inspections is two different sources", () => {
    const a = perLocation();
    const rowId = a.locations[0].rows[0].id;
    const both = addRowSource(a, "l1", rowId, { listId: "k1", itemId: "m1", locationId: "l2" });
    expect(both.locations[0].rows[0].sources).toHaveLength(2);
    expect(rowsForItem(both, "k1", "m1", "l2").map((r) => r.locationId)).toEqual(["l1"]);
    expect(rowsForItem(both, "k1", "m1", "l1").map((r) => r.locationId)).toEqual(["l1"]);
  });

  test("rowsForItem finds rows by any of their sources", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1");
    const b = addRowSource(a, "l1", a.locations[0].rows[0].id, {
      listId: "k1",
      itemId: "m2",
      locationId: null,
    });
    expect(rowsForItem(b, "k1", "m2", null).map((r) => r.number)).toEqual([1]);
    expect(rowsForItem(b, "k1", "m1", null).map((r) => r.number)).toEqual([1]);
  });
});

describe("link consistency", () => {
  test("removeItem and removeChecklist clear sources", () => {
    const a = linked();
    expect(
      removeItem(a, "k1", "m1")
        .locations.flatMap((l) => l.rows)
        .every((r) => !r.sources),
    ).toBe(true);
    expect(
      removeChecklist(a, "k1")
        .locations.flatMap((l) => l.rows)
        .every((r) => !r.sources),
    ).toBe(true);
    expect(a.locations[0].rows[0].sources).toBeDefined();
  });

  test("removeItem only drops that item from a multi-source row", () => {
    const a0 = linked();
    const m2 = { listId: "k1", itemId: "m2", locationId: null };
    const a = addRowSource(a0, "l1", a0.locations[0].rows[0].id, m2);
    expect(removeItem(a, "k1", "m1").locations[0].rows[0].sources).toEqual([m2]);
  });

  test("removeLocation drops the id from lists, its inspections and the sources pointing at them", () => {
    const a = perLocation();
    const next = removeLocation(a, "l1");
    expect(next.checklists[0].locationIds).toEqual(["l2"]);
    expect(next.inspections.filter((i) => i.checklistId === "k1").map((i) => i.locationId)).toEqual(
      ["l2"],
    );
    // the row in l2 pointed at l2's inspection and stays linked
    expect(next.locations[0].rows[0].sources).toEqual([
      { listId: "k1", itemId: "m2", locationId: "l2" },
    ]);
    // a row in l2 linked to l1's inspection loses just that source
    const cross = addRowSource(a, "l2", a.locations[1].rows[0].id, {
      listId: "k1",
      itemId: "m1",
      locationId: "l1",
    });
    expect(removeLocation(cross, "l1").locations[0].rows[0].sources).toEqual([
      { listId: "k1", itemId: "m2", locationId: "l2" },
    ]);
    // the last location removed turns the list general again
    const general = removeLocation(setChecklistLocations(sample(), "k1", ["l1"]), "l1");
    expect("locationIds" in general.checklists[0]).toBe(false);
    expect(
      general.inspections.filter((i) => i.checklistId === "k1").map((i) => i.locationId),
    ).toEqual([null]);
  });

  test("duplicateRow keeps sources; a duplicated location gets fresh empty inspections", () => {
    const a = perLocation();
    const rowId = a.locations[0].rows[0].id;
    const source = { listId: "k1", itemId: "m1", locationId: "l1" };
    const dupRow = duplicateRow(a, "l1", rowId, "copy");
    expect(dupRow.locations[0].rows[1].sources).toEqual([source]);
    const dupLoc = duplicateLocation(a, "l1", "l1b");
    expect(dupLoc.checklists[0].locationIds).toEqual(["l1", "l2", "l1b"]);
    const copyInspection = dupLoc.inspections.find((i) => i.locationId === "l1b");
    expect(copyInspection?.answers).toEqual([]);
    expect(dupLoc.inspections.find((i) => i.locationId === "l1")?.answers).toHaveLength(2);
    expect(dupLoc.locations[1].rows[0].sources).toEqual([{ ...source, locationId: "l1b" }]);
  });

  test("rollover keeps sources and locationIds and clears the answers", () => {
    const a = perLocation();
    const next = rollover(a);
    expect(next.locations[0].rows[0].sources).toEqual(a.locations[0].rows[0].sources);
    expect(next.checklists[0].locationIds).toEqual(["l1", "l2"]);
    expect(next.inspections.every((i) => i.answers.length === 0)).toBe(true);
  });
});

describe("file format", () => {
  test("files round-trip", () => {
    const a = sample();
    expect(validate(JSON.parse(serialize(a)))).toEqual([]);
    const b = perLocation();
    const r = parse(serialize(b));
    expect("assessment" in r && r.assessment).toEqual(b);
  });

  test("malformed fields are reported", () => {
    const bad = JSON.parse(serialize(linked()));
    bad.locations[0].rows[0].sources = [{ listId: 1 }];
    bad.locations[1].rows[0].sources = [{ listId: "k1", itemId: "m1" }];
    bad.checklists[0].locationIds = "l1";
    expect(validate(bad)).toEqual([
      "locations[0].rows[0].sources: her kayıt için listId, itemId metin; locationId metin ya da null olmalı.",
      "locations[1].rows[0].sources: her kayıt için listId, itemId metin; locationId metin ya da null olmalı.",
      "checklists[0].locationIds: metin listesi olmalı.",
    ]);
  });
});

describe("readiness gaps", () => {
  test("Hayır items without a row are listed per checklist", () => {
    const r = readiness(riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1"));
    expect(r.noWithoutRow).toEqual([{ id: "k1", name: "KL-26 Elektrik", count: 1 }]);
    expect(r.hasGaps).toBe(true);
  });

  test("an eksik in one location is counted per inspection", () => {
    const a = perLocation();
    // l1: m1 has a row; l2: m2 has a row; nothing else is "no"
    expect(readiness(a).noWithoutRow).toEqual([]);
    expect(readiness(withAnswers(a, "k1", "l2", { m1: "no" })).noWithoutRow[0].count).toBe(1);
  });

  test("open row whose item became Evet is flagged; done rows are not", () => {
    let a = setAnswer(linked(), "k1", null, "m1", "yes");
    expect(readiness(a).sourceNowYes.map((g) => [g.id, g.count])).toEqual([
      ["l1", 1],
      ["l2", 1],
    ]);
    a = updateRow(a, "l1", a.locations[0].rows[0].id, { status: "done" });
    expect(readiness(a).sourceNowYes.map((g) => g.id)).toEqual(["l2"]);
  });

  test("sourceNowYes counts a row once and names the items that became Evet", () => {
    const base = linked();
    let a = addRowSource(base, "l1", base.locations[0].rows[0].id, {
      listId: "k1",
      itemId: "m2",
      locationId: null,
    });
    a = withAnswers(a, "k1", null, { m1: "yes", m2: "yes" });
    const gap = readiness(a).sourceNowYes.find((g) => g.id === "l1");
    expect([gap?.count, gap?.detail]).toEqual([1, "KL-26.06, KL-26.07"]);
  });

  test("a Hayır item inside a multi-source row is not missing a row", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1");
    const b = addRowSource(a, "l1", a.locations[0].rows[0].id, {
      listId: "k1",
      itemId: "m2",
      locationId: null,
    });
    expect(readiness(b).noWithoutRow).toEqual([]);
  });
});

describe("pdf data", () => {
  test("rows carry a source string; checklist blocks are one per inspection", () => {
    const base = sample();
    let a = ensureInspections({
      ...base,
      checklists: [
        base.checklists[0],
        { ...base.checklists[1], items: [{ id: "x", no: "3", text: "t" }] },
      ],
    });
    a = withAnswers(riskRowFromChecklistItem(a, "k1", "m1", null, "l1"), "k2", null, { x: "no" });
    a = riskRowFromChecklistItem(a, "k2", "x", null, "l1");
    const d = pdfData(a, "full");
    expect(d.groups[0].locations[0].rows.map((r) => r.source)).toEqual([
      "KL-26.06",
      "Okul içi lis md.3",
    ]);
    expect(d.checklists.map((c) => c.name)).toEqual([
      "Elektrik — Okul geneli",
      "Okul içi liste — Okul geneli",
    ]);
    const unlinked = pdfData(clearRowSources(a, "l1", a.locations[0].rows[0].id), "full");
    expect(unlinked.groups[0].locations[0].rows[0].source).toBe("");
    const two = addRowSource(a, "l1", a.locations[0].rows[0].id, {
      listId: "k1",
      itemId: "m2",
      locationId: null,
    });
    expect(pdfData(two, "full").groups[0].locations[0].rows[0].source).toBe("KL-26.06, KL-26.07");
  });

  test("a list with locations gets one block per location", () => {
    const d = pdfData(perLocation(), "full");
    expect(d.checklists.map((c) => c.name)).toEqual([
      "Elektrik — Depo",
      "Elektrik — Atölye",
      "Okul içi liste — Okul geneli",
    ]);
    expect(d.checklists[0].items.map((i) => i.answer)).toEqual(["no", "yes"]);
    expect(d.checklists[1].items.map((i) => i.answer)).toEqual(["yes", "no"]);
  });
});

describe("excel backup links", () => {
  test("round-trips sources, locationIds and the answers of each inspection", () => {
    let a = perLocation();
    a = addRowSource(a, "l1", a.locations[0].rows[0].id, {
      listId: "k1",
      itemId: "m1",
      locationId: "l2",
    });
    const result = restoreBackup(backupSheets(a) as Record<string, unknown[][]>);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    const b = result.assessment;
    expect(b.checklists[0].locationIds).toEqual(b.locations.map((l) => l.id));
    expect("locationIds" in b.checklists[1]).toBe(false);
    const sources = b.locations.flatMap((l) =>
      l.rows.map((r) => sourcesOf(b, r).map((s) => [s.no, s.locationId === b.locations[1].id])),
    );
    expect(sources).toEqual([
      [
        ["06", false],
        ["06", true],
      ],
      [["07", true]],
    ]);
    const answers = (id: string) =>
      b.inspections.find((i) => i.locationId === id)?.answers.map((x) => x.answer);
    expect([answers(b.locations[0].id), answers(b.locations[1].id)]).toEqual([
      ["no", "yes"],
      ["yes", "no"],
    ]);
    expect(validate(b)).toEqual([]);
  });

  test("several sources share one cell separated by '; '", () => {
    let a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1");
    a = addRowSource(a, "l1", a.locations[0].rows[0].id, {
      listId: "k1",
      itemId: "m2",
      locationId: null,
    });
    const sheets = backupSheets(a) as Record<string, unknown[][]>;
    expect(sheets["Risk Satırları"][1].at(-1)).toBe("1/06@; 1/07@");
    const result = restoreBackup(sheets);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    const b = result.assessment;
    expect(sourcesOf(b, b.locations[0].rows[0]).map((s) => s.no)).toEqual(["06", "07"]);
  });

  test("an unknown ref inside a multi-ref cell is reported", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l1");
    const sheets = backupSheets(a) as Record<string, unknown[][]>;
    sheets["Risk Satırları"][1][sheets["Risk Satırları"][1].length - 1] = "1/06@; 9/99@";
    const result = restoreBackup(sheets);
    expect("errors" in result && result.errors[0]).toContain("'9/99@' bulunamadı");
  });

  test("repeated item numbers fall back to the position", () => {
    let a = sample();
    a = {
      ...a,
      checklists: [
        { ...a.checklists[0], items: a.checklists[0].items.map((m) => ({ ...m, no: "1" })) },
        a.checklists[1],
      ],
    };
    a = riskRowFromChecklistItem(a, "k1", "m2", null, "l1");
    const result = restoreBackup(backupSheets(a) as Record<string, unknown[][]>);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    const row = result.assessment.locations[0].rows[0];
    expect(sourcesOf(result.assessment, row)[0]?.text).toBe("Topraklama var mı?");
  });

  test("backups without the optional source column still restore", () => {
    const sheets = backupSheets(linked()) as Record<string, unknown[][]>;
    const risk = sheets["Risk Satırları"].map((r) => r.slice(0, r.length - 1));
    const result = restoreBackup({ ...sheets, "Risk Satırları": risk });
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    expect(result.assessment.locations[0].rows[0].sources).toBeUndefined();
  });
});

describe("assigning a general list keeps its answers", () => {
  test("school-wide answers and row links move to the first assigned location", () => {
    const before = riskRowFromChecklistItem(sample(), "k1", "m1", null, "l2");
    const after = setChecklistLocations(before, "k1", ["l1"]);
    const insp = after.inspections.find((i) => i.checklistId === "k1" && i.locationId === "l1");
    expect(insp?.answers.map((x) => [x.itemId, x.answer])).toEqual([
      ["m1", "no"],
      ["m2", "no"],
    ]);
    expect(after.inspections.some((i) => i.checklistId === "k1" && i.locationId === null)).toBe(
      false,
    );
    expect(rowsForItem(after, "k1", "m1", "l1")).toHaveLength(1);
  });

  test("an already assigned list is not touched", () => {
    const one = setChecklistLocations(sample(), "k1", ["l1"]);
    const two = setChecklistLocations(one, "k1", ["l1", "l2"]);
    const l2 = two.inspections.find((i) => i.checklistId === "k1" && i.locationId === "l2");
    expect(l2?.answers).toEqual([]);
  });
});
