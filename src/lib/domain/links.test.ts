import { describe, expect, test } from "vite-plus/test";
import {
  addLocation,
  duplicateLocation,
  duplicateRow,
  emptyAssessment,
  removeLocation,
  updateRow,
} from "./assessment";
import { removeChecklist, removeItem, updateItem } from "./checklist";
import { defaultLocationId, hasChecklistRisk, riskRowFromChecklistItem } from "./checklist-risk";
import { backupSheets, restoreBackup } from "./excel-backup";
import { pdfData } from "./export-data";
import { parse, serialize, validate } from "./file";
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
import type { Assessment } from "./types";

function sample(): Assessment {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Atölye" });
  return {
    ...a,
    checklists: [
      {
        id: "k1",
        code: "KL-26",
        name: "Elektrik",
        source: "external",
        items: [
          { id: "m1", no: "06", text: "Pano kapalı mı?", answer: "no", note: "" },
          { id: "m2", no: "07", text: "Topraklama var mı?", answer: "no", note: "" },
        ],
      },
      { id: "k2", code: "", name: "Okul içi liste", source: "internal", items: [] },
    ],
  };
}

const linked = () => {
  let a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
  a = riskRowFromChecklistItem(a, "k1", "m1", "l2");
  return a;
};

describe("links", () => {
  test("riskRowFromChecklistItem sets the sources", () => {
    expect(linked().locations[0].rows[0].sources).toEqual([{ listId: "k1", itemId: "m1" }]);
  });

  test("sourceLabel takes the MEB reference from the text of codeless lists", () => {
    const info = { code: "", listName: "Okul içi liste", no: "4", text: "Dolap (KL-26.02/26.03)" };
    const full = { listId: "k", itemId: "i", answer: "no" as const, ...info };
    expect(sourceLabel(full)).toBe("KL-26.02");
    expect(sourceLabel({ ...full, text: "Pano (KL-26.06) ve (KL-26.07)" })).toBe("KL-26.06");
    expect(sourceLabel({ ...full, text: "Dolap sabit mi?" })).toBe("Okul içi lis md.4");
    expect(sourceLabel({ ...full, code: "KL-26", text: "x (KL-99.01)" })).toBe("KL-26.4");
  });

  test("hazard keeps the MEB reference only for coded lists; source text for codeless lists", () => {
    const withCodeless: Assessment = {
      ...sample(),
      checklists: [
        sample().checklists[0],
        {
          ...sample().checklists[1],
          items: [{ id: "x1", no: "1", text: "Dolap sabit mi?", answer: "no", note: "" }],
        },
      ],
    };
    const a = riskRowFromChecklistItem(
      riskRowFromChecklistItem(withCodeless, "k1", "m1", "l1"),
      "k2",
      "x1",
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

  test("rowsForItem lists every row across locations", () => {
    const rows = rowsForItem(linked(), "k1", "m1");
    expect(rows.map((r) => [r.locationId, r.locationName, r.number])).toEqual([
      ["l1", "Depo", 1],
      ["l2", "Atölye", 1],
    ]);
    expect(rowsForItem(linked(), "k1", "m2")).toEqual([]);
  });

  test("sourcesOf returns the items in order, drops dangling, [] when unlinked", () => {
    const a = linked();
    expect(sourcesOf(a, a.locations[0].rows[0])).toEqual([
      {
        listId: "k1",
        itemId: "m1",
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
        { listId: "k1", itemId: "zz" },
        { listId: "k1", itemId: "m2" },
        { listId: "k1", itemId: "m1" },
      ],
    };
    expect(sourcesOf(a, dangling).map((s) => s.no)).toEqual(["07", "06"]);
    expect(sourcesOf(a, { ...row, sources: undefined })).toEqual([]);
  });

  test("hasChecklistRisk uses the source, falls back to hazard text", () => {
    const a = linked();
    expect(hasChecklistRisk(a, "k1", "m1", "l1")).toBe(true);
    expect(hasChecklistRisk(a, "k1", "m2", "l1")).toBe(false);
    const legacy = updateRow(a, "l1", a.locations[0].rows[0].id, {});
    const { sources: _s, ...bare } = legacy.locations[0].rows[0];
    expect(
      hasChecklistRisk(
        { ...legacy, locations: [{ ...legacy.locations[0], rows: [bare] }, legacy.locations[1]] },
        "k1",
        "m1",
        "l1",
      ),
    ).toBe(true);
  });

  test("setChecklistLocations / listsForLocation / defaultLocationId", () => {
    let a = setChecklistLocations(sample(), "k1", ["zz", "l2", "l2"]);
    expect(a.checklists[0].locationIds).toEqual(["l2"]);
    expect(listsForLocation(a, "l2")).toEqual({ lists: [a.checklists[0]], generalCount: 1 });
    expect(listsForLocation(a, "l1")).toEqual({ lists: [], generalCount: 1 });
    expect(defaultLocationId(a, a.checklists[0])).toBe("l2");
    a = setChecklistLocations(a, "k1", []);
    expect("locationIds" in a.checklists[0]).toBe(false);
    expect(() => setChecklistLocations(a, "x", [])).toThrow();
  });

  test("dangling locationIds count as general", () => {
    const a = { ...sample(), checklists: [{ ...sample().checklists[0], locationIds: ["gone"] }] };
    expect(listsForLocation(a, "l1")).toEqual({ lists: [], generalCount: 1 });
  });

  test("addRowSource appends without duplicates; removeRowSource / clearRowSources shrink", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
    const rowId = a.locations[0].rows[0].id;
    const two = addRowSource(a, "l1", rowId, { listId: "k1", itemId: "m2" });
    expect(two.locations[0].rows[0].sources?.map((s) => s.itemId)).toEqual(["m1", "m2"]);
    expect(addRowSource(two, "l1", rowId, { listId: "k1", itemId: "m1" })).toEqual(two);
    const one = removeRowSource(two, "l1", rowId, { listId: "k1", itemId: "m1" });
    expect(one.locations[0].rows[0].sources).toEqual([{ listId: "k1", itemId: "m2" }]);
    const none = removeRowSource(one, "l1", rowId, { listId: "k1", itemId: "m2" });
    expect("sources" in none.locations[0].rows[0]).toBe(false);
    expect("sources" in clearRowSources(two, "l1", rowId).locations[0].rows[0]).toBe(false);
    expect(a.locations[0].rows[0].sources).toHaveLength(1);
    expect(() => addRowSource(a, "l1", rowId, { listId: "k1", itemId: "zz" })).toThrow();
    expect(() => addRowSource(a, "l1", "zz", { listId: "k1", itemId: "m2" })).toThrow();
    expect(() => clearRowSources(a, "zz", rowId)).toThrow();
  });

  test("rowsForItem finds rows by any of their sources", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
    const b = addRowSource(a, "l1", a.locations[0].rows[0].id, { listId: "k1", itemId: "m2" });
    expect(rowsForItem(b, "k1", "m2").map((r) => r.number)).toEqual([1]);
    expect(rowsForItem(b, "k1", "m1").map((r) => r.number)).toEqual([1]);
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
    const a = addRowSource(a0, "l1", a0.locations[0].rows[0].id, { listId: "k1", itemId: "m2" });
    expect(removeItem(a, "k1", "m1").locations[0].rows[0].sources).toEqual([
      { listId: "k1", itemId: "m2" },
    ]);
  });

  test("removeLocation drops the id from lists", () => {
    const a = setChecklistLocations(sample(), "k1", ["l1", "l2"]);
    expect(removeLocation(a, "l1").checklists[0].locationIds).toEqual(["l2"]);
    expect(
      "locationIds" in removeLocation(setChecklistLocations(a, "k1", ["l1"]), "l1").checklists[0],
    ).toBe(false);
  });

  test("duplicates keep source; duplicated location joins its lists", () => {
    const a = setChecklistLocations(linked(), "k1", ["l1"]);
    const rowId = a.locations[0].rows[0].id;
    const dupRow = duplicateRow(a, "l1", rowId, "copy");
    expect(dupRow.locations[0].rows[1].sources).toEqual([{ listId: "k1", itemId: "m1" }]);
    const dupLoc = duplicateLocation(a, "l1", "l1b");
    expect(dupLoc.locations[1].rows[0].sources).toEqual([{ listId: "k1", itemId: "m1" }]);
    expect(dupLoc.checklists[0].locationIds).toEqual(["l1", "l1b"]);
  });

  test("rollover keeps sources and locationIds", () => {
    const a = setChecklistLocations(linked(), "k1", ["l1"]);
    const next = rollover(a);
    expect(next.locations[0].rows[0].sources).toEqual([{ listId: "k1", itemId: "m1" }]);
    expect(next.checklists[0].locationIds).toEqual(["l1"]);
  });
});

describe("file format", () => {
  test("old files without the fields load unchanged", () => {
    const a = sample();
    expect(validate(JSON.parse(serialize(a)))).toEqual([]);
  });

  test("new files with the fields round-trip", () => {
    const a = setChecklistLocations(linked(), "k1", ["l2"]);
    const r = parse(serialize(a));
    expect("assessment" in r && r.assessment).toEqual(a);
  });

  test("malformed fields are reported", () => {
    const a = linked();
    const bad = JSON.parse(serialize(a));
    bad.locations[0].rows[0].sources = [{ listId: 1 }];
    bad.locations[1].rows[0].source = { listId: 1 };
    bad.checklists[0].locationIds = "l1";
    expect(validate(bad)).toEqual([
      "locations[0].rows[0].sources: her kayıt için listId ve itemId metin olmalı.",
      "locations[1].rows[0].source: listId ve itemId metin olmalı.",
      "checklists[0].locationIds: metin listesi olmalı.",
    ]);
  });

  test("old files with a single `source` open as `sources`; writing only emits `sources`", () => {
    const original = linked();
    const old = JSON.parse(serialize(original));
    for (const l of old.locations)
      for (const r of l.rows) {
        r.source = r.sources[0];
        delete r.sources;
      }
    const r = parse(JSON.stringify(old));
    if (!("assessment" in r)) throw new Error(r.errors.join("\n"));
    expect(r.assessment.locations[0].rows[0].sources).toEqual([{ listId: "k1", itemId: "m1" }]);
    expect(serialize(r.assessment)).not.toContain('"source": {');
    expect(r.assessment).toEqual(original);
  });
});

describe("readiness gaps", () => {
  test("Hayır items without a row are listed per checklist", () => {
    const r = readiness(riskRowFromChecklistItem(sample(), "k1", "m1", "l1"));
    expect(r.noWithoutRow).toEqual([{ id: "k1", name: "KL-26 Elektrik", count: 1 }]);
    expect(r.hasGaps).toBe(true);
  });

  test("open row whose item became Evet is flagged; done rows are not", () => {
    let a = updateItem(linked(), "k1", "m1", { answer: "yes" });
    expect(readiness(a).sourceNowYes.map((g) => [g.id, g.count])).toEqual([
      ["l1", 1],
      ["l2", 1],
    ]);
    a = updateRow(a, "l1", a.locations[0].rows[0].id, { status: "done" });
    expect(readiness(a).sourceNowYes.map((g) => g.id)).toEqual(["l2"]);
  });

  test("sourceNowYes counts a row once and names the items that became Evet", () => {
    const base = linked();
    let a = addRowSource(base, "l1", base.locations[0].rows[0].id, { listId: "k1", itemId: "m2" });
    a = updateItem(updateItem(a, "k1", "m1", { answer: "yes" }), "k1", "m2", { answer: "yes" });
    const gap = readiness(a).sourceNowYes.find((g) => g.id === "l1");
    expect([gap?.count, gap?.detail]).toEqual([1, "KL-26.06, KL-26.07"]);
  });

  test("a Hayır item inside a multi-source row is not missing a row", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
    const b = addRowSource(a, "l1", a.locations[0].rows[0].id, { listId: "k1", itemId: "m2" });
    expect(readiness(b).noWithoutRow).toEqual([]);
  });
});

describe("pdf data", () => {
  test("rows carry a source string, lists their location names", () => {
    let a = setChecklistLocations(linked(), "k1", ["l1", "l2"]);
    a = {
      ...a,
      checklists: [
        a.checklists[0],
        { ...a.checklists[1], items: [{ id: "x", no: "3", text: "t", answer: "", note: "" }] },
      ],
    };
    a = riskRowFromChecklistItem(a, "k2", "x", "l1");
    const d = pdfData(a, "full");
    expect(d.groups[0].locations[0].rows.map((r) => r.source)).toEqual([
      "KL-26.06",
      "Okul içi lis md.3",
    ]);
    expect(d.checklists.map((c) => c.locationNames)).toEqual(["Depo, Atölye", ""]);
    const unlinked = pdfData(clearRowSources(a, "l1", a.locations[0].rows[0].id), "full");
    expect(unlinked.groups[0].locations[0].rows[0].source).toBe("");
    const two = addRowSource(a, "l1", a.locations[0].rows[0].id, { listId: "k1", itemId: "m2" });
    expect(pdfData(two, "full").groups[0].locations[0].rows[0].source).toBe("KL-26.06, KL-26.07");
  });
});

describe("excel backup links", () => {
  test("round-trips sources and locationIds", () => {
    let a = setChecklistLocations(linked(), "k1", ["l2"]);
    a = riskRowFromChecklistItem(a, "k1", "m2", "l2");
    const result = restoreBackup(backupSheets(a) as Record<string, unknown[][]>);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    const b = result.assessment;
    expect(b.checklists[0].locationIds).toEqual([b.locations[1].id]);
    expect("locationIds" in b.checklists[1]).toBe(false);
    const sources = b.locations.flatMap((l) => l.rows.map((r) => sourcesOf(b, r).map((s) => s.no)));
    expect(sources).toEqual([["06"], ["06"], ["07"]]);
    expect(validate(b)).toEqual([]);
  });

  test("several sources share one cell separated by '; '", () => {
    let a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
    a = addRowSource(a, "l1", a.locations[0].rows[0].id, { listId: "k1", itemId: "m2" });
    const sheets = backupSheets(a) as Record<string, unknown[][]>;
    expect(sheets["Risk Satırları"][1].at(-1)).toBe("1/06; 1/07");
    const result = restoreBackup(sheets);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    const b = result.assessment;
    expect(sourcesOf(b, b.locations[0].rows[0]).map((s) => s.no)).toEqual(["06", "07"]);
  });

  test("an unknown ref inside a multi-ref cell is reported, the rest still link", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
    const sheets = backupSheets(a) as Record<string, unknown[][]>;
    sheets["Risk Satırları"][1][sheets["Risk Satırları"][1].length - 1] = "1/06; 9/99";
    const result = restoreBackup(sheets);
    expect("errors" in result && result.errors[0]).toContain("'9/99' bulunamadı");
  });

  test("repeated item numbers fall back to the position", () => {
    let a = sample();
    a = {
      ...a,
      checklists: [
        { ...a.checklists[0], items: a.checklists[0].items.map((m) => ({ ...m, no: "1" })) },
      ],
    };
    a = riskRowFromChecklistItem(a, "k1", "m2", "l1");
    const result = restoreBackup(backupSheets(a) as Record<string, unknown[][]>);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    const row = result.assessment.locations[0].rows[0];
    expect(sourcesOf(result.assessment, row)[0]?.text).toBe("Topraklama var mı?");
  });

  test("old backups without the columns still restore", () => {
    const sheets = backupSheets(linked()) as Record<string, unknown[][]>;
    const strip = (rows: unknown[][], n: number) => rows.map((r) => r.slice(0, r.length - n));
    const old = {
      ...sheets,
      "Risk Satırları": strip(sheets["Risk Satırları"], 1),
      "Kontrol Listesi": strip(sheets["Kontrol Listesi"], 1),
    };
    const result = restoreBackup(old);
    if ("errors" in result) throw new Error(result.errors.join("\n"));
    expect(result.assessment.locations[0].rows[0].sources).toBeUndefined();
  });
});
