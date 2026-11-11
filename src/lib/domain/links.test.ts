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
import { linkRow, listsForLocation, rowsForItem, setChecklistLocations, sourceOf } from "./links";
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
  test("riskRowFromChecklistItem sets the source", () => {
    expect(linked().locations[0].rows[0].source).toEqual({ listId: "k1", itemId: "m1" });
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

  test("sourceOf returns the item, null when dangling or unlinked", () => {
    const a = linked();
    expect(sourceOf(a, a.locations[0].rows[0])).toEqual({
      listId: "k1",
      itemId: "m1",
      code: "KL-26",
      no: "06",
      answer: "no",
      text: "Pano kapalı mı?",
    });
    const dangling = { ...a.locations[0].rows[0], source: { listId: "k1", itemId: "zz" } };
    expect(sourceOf(a, dangling)).toBeNull();
    expect(sourceOf(a, { ...dangling, source: undefined })).toBeNull();
  });

  test("hasChecklistRisk uses the source, falls back to hazard text", () => {
    const a = linked();
    expect(hasChecklistRisk(a, "k1", "m1", "l1")).toBe(true);
    expect(hasChecklistRisk(a, "k1", "m2", "l1")).toBe(false);
    const legacy = updateRow(a, "l1", a.locations[0].rows[0].id, {});
    const { source: _s, ...bare } = legacy.locations[0].rows[0];
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

  test("linkRow sets and clears a source", () => {
    const a = riskRowFromChecklistItem(sample(), "k1", "m1", "l1");
    const rowId = a.locations[0].rows[0].id;
    const moved = linkRow(a, "l1", rowId, { listId: "k1", itemId: "m2" });
    expect(moved.locations[0].rows[0].source).toEqual({ listId: "k1", itemId: "m2" });
    const cleared = linkRow(moved, "l1", rowId, null);
    expect("source" in cleared.locations[0].rows[0]).toBe(false);
    expect(a.locations[0].rows[0].source?.itemId).toBe("m1");
    expect(() => linkRow(a, "l1", rowId, { listId: "k1", itemId: "zz" })).toThrow();
    expect(() => linkRow(a, "l1", "zz", null)).toThrow();
  });
});

describe("link consistency", () => {
  test("removeItem and removeChecklist clear sources", () => {
    const a = linked();
    expect(
      removeItem(a, "k1", "m1")
        .locations.flatMap((l) => l.rows)
        .every((r) => !r.source),
    ).toBe(true);
    expect(
      removeChecklist(a, "k1")
        .locations.flatMap((l) => l.rows)
        .every((r) => !r.source),
    ).toBe(true);
    expect(a.locations[0].rows[0].source).toBeDefined();
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
    expect(dupRow.locations[0].rows[1].source).toEqual({ listId: "k1", itemId: "m1" });
    const dupLoc = duplicateLocation(a, "l1", "l1b");
    expect(dupLoc.locations[1].rows[0].source).toEqual({ listId: "k1", itemId: "m1" });
    expect(dupLoc.checklists[0].locationIds).toEqual(["l1", "l1b"]);
  });

  test("rollover keeps sources and locationIds", () => {
    const a = setChecklistLocations(linked(), "k1", ["l1"]);
    const next = rollover(a);
    expect(next.locations[0].rows[0].source).toEqual({ listId: "k1", itemId: "m1" });
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
    bad.locations[0].rows[0].source = { listId: 1 };
    bad.checklists[0].locationIds = "l1";
    expect(validate(bad)).toEqual([
      "locations[0].rows[0].source: listId ve itemId metin olmalı.",
      "checklists[0].locationIds: metin listesi olmalı.",
    ]);
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
    const unlinked = pdfData(linkRow(a, "l1", a.locations[0].rows[0].id, null), "full");
    expect(unlinked.groups[0].locations[0].rows[0].source).toBe("");
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
    const sources = b.locations.flatMap((l) => l.rows.map((r) => sourceOf(b, r)?.no));
    expect(sources).toEqual(["06", "06", "07"]);
    expect(validate(b)).toEqual([]);
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
    expect(sourceOf(result.assessment, row)?.text).toBe("Topraklama var mı?");
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
    expect(result.assessment.locations[0].rows[0].source).toBeUndefined();
  });
});
