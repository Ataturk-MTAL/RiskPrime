import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment, updateRow } from "./assessment";
import { addChecklist } from "./checklist";
import { hazardOf, riskRowFromChecklistItem } from "./checklist-risk";
import { setChecklistLocations } from "./links";
import {
  SCHOOL_WIDE_FILTER,
  deficiencyCounts,
  filterDeficiencies,
  filterRegister,
  levelCounts,
  deficienciesWithState,
  isTransferred,
} from "./filters";
import { deficiencies, riskRegister } from "./inspections";
import { withAnswers } from "./test-helpers";
import { ALL_DEFICIENCIES, ALL_RISKS } from "../nav.svelte";

const TODAY = new Date(2026, 5, 15);

function sample() {
  let a = emptyAssessment("2026-2027");
  a = addLocation(a, { id: "l1", name: "Depo" });
  a = addLocation(a, { id: "l2", name: "Atölye" });
  a = addChecklist(a, {
    code: "KL-26",
    name: "Elektrik",
    source: "external",
    items: [
      { no: "1", text: "Pano kapalı mı?" },
      { no: "2", text: "IŞIK yeterli mi?" },
    ],
  });
  const list = a.checklists[0];
  a = { ...a, checklists: [{ ...list, locationIds: ["l1", "l2"] }] };
  const [i1, i2] = list.items.map((i) => i.id);
  a = withAnswers(a, list.id, "l1", { [i1]: "no", [i2]: "no" }, { [i2]: "Karanlık" });
  a = withAnswers(a, list.id, "l2", { [i1]: "no" });
  return { a, listId: list.id, i1, i2 };
}

describe("filterDeficiencies", () => {
  test("returns every Hayır answer with the default filter", () => {
    const { a } = sample();
    expect(filterDeficiencies(deficiencies(a), ALL_DEFICIENCIES)).toHaveLength(3);
  });

  test("filters by location and by state", () => {
    const { a, listId, i1 } = sample();
    const b = riskRowFromChecklistItem(a, listId, i1, "l1");
    const all = deficiencies(b);
    expect(filterDeficiencies(all, { ...ALL_DEFICIENCIES, locationId: "l2" })).toHaveLength(1);
    expect(filterDeficiencies(all, { ...ALL_DEFICIENCIES, state: "transferred" })).toHaveLength(1);
    expect(filterDeficiencies(all, { ...ALL_DEFICIENCIES, state: "untransferred" })).toHaveLength(
      2,
    );
    expect(deficiencyCounts(all, ALL_DEFICIENCIES)).toEqual({
      all: 3,
      transferred: 1,
      untransferred: 2,
    });
  });

  test("searches Turkish-aware in text and notes", () => {
    const { a } = sample();
    const all = deficiencies(a);
    expect(filterDeficiencies(all, { ...ALL_DEFICIENCIES, query: "ışık" })).toHaveLength(1);
    expect(filterDeficiencies(all, { ...ALL_DEFICIENCIES, query: "karanlık" })).toHaveLength(1);
  });
});

describe("filterRegister", () => {
  function register() {
    let a = emptyAssessment("2026-2027");
    a = addLocation(a, { id: "l1", name: "Depo" });
    a = addLocation(a, { id: "l2", name: "Atölye" });
    a = addRow(a, "l1", { id: "r1", hazard: "Düşük risk", likelihood: 1, severity: 1 });
    a = addRow(a, "l1", { id: "r2", hazard: "Puansız" });
    a = addRow(a, "l2", { id: "r3", hazard: "Ağır risk", likelihood: 5, severity: 5 });
    a = updateRow(a, "l1", "r1", { dueDate: "01.01.2026" });
    return riskRegister(a);
  }

  test("sorts worst level first and unscored last", () => {
    const ids = filterRegister(register(), ALL_RISKS, TODAY).map((e) => e.row.id);
    expect(ids).toEqual(["r3", "r1", "r2"]);
  });

  test("serious keeps only high and intolerable", () => {
    const ids = filterRegister(register(), { ...ALL_RISKS, level: "serious" }, TODAY);
    expect(ids.map((e) => e.row.id)).toEqual(["r3"]);
  });

  test("overdue keeps open rows past their due date", () => {
    const ids = filterRegister(register(), { ...ALL_RISKS, overdue: true }, TODAY);
    expect(ids.map((e) => e.row.id)).toEqual(["r1"]);
  });

  test("filters by location and Turkish-aware query", () => {
    const e = register();
    expect(filterRegister(e, { ...ALL_RISKS, locationId: "l2" }, TODAY)).toHaveLength(1);
    expect(filterRegister(e, { ...ALL_RISKS, query: "AĞIR" }, TODAY)).toHaveLength(1);
  });

  test("level counts ignore the level facet but respect the others", () => {
    const e = register();
    expect(levelCounts(e, { ...ALL_RISKS, level: "serious" }, TODAY)).toMatchObject({
      all: 3,
      serious: 1,
      unscored: 1,
    });
    expect(levelCounts(e, { ...ALL_RISKS, locationId: "l1" }, TODAY).all).toBe(2);
  });
});

describe("school-wide filter", () => {
  test("matches only okul geneli deficiencies", () => {
    const { a } = sample();
    const all = deficiencies(a);
    const wide = { ...all[0], locationId: null };
    const filter = { ...ALL_DEFICIENCIES, locationId: SCHOOL_WIDE_FILTER };
    expect(filterDeficiencies([wide, all[1]], filter)).toEqual([wide]);
  });
});

describe("deficienciesWithState", () => {
  test("an unlinked row with the same hazard text counts as transferred, like the bulk transfer", () => {
    let a = emptyAssessment("2026-2027");
    a = addLocation(a, { id: "l1", name: "Depo" });
    a = addChecklist(a, {
      code: "KL-1",
      name: "Liste",
      source: "external",
      items: [{ no: "01", text: "Pano kapalı" }],
    });
    const list = a.checklists[0];
    a = setChecklistLocations(a, list.id, ["l1"]);
    a = withAnswers(a, list.id, "l1", { [list.items[0].id]: "no" });
    expect(deficienciesWithState(a).map(isTransferred)).toEqual([false]);
    a = addRow(a, "l1", { hazard: hazardOf(list, list.items[0]) });
    expect(deficienciesWithState(a).map(isTransferred)).toEqual([true]);
  });
});

describe("filterDeficiencies with merged common items", () => {
  const merged = {
    listId: "k1",
    listName: "A",
    listCode: "A",
    itemId: "m1",
    itemNo: "1",
    text: "Ortak soru",
    locationId: "l1",
    locationName: "Depo",
    note: "",
    rowIds: [],
    siblings: [{ listId: "k2", itemId: "m2", ref: "X" }],
  };
  const filter = (listId: string) => ({ ...ALL_DEFICIENCIES, listId });

  test("matches by the representative's list", () => {
    expect(filterDeficiencies([merged], filter("k1"))).toHaveLength(1);
  });

  test("matches by a sibling's list, and counts agree", () => {
    expect(filterDeficiencies([merged], filter("k2"))).toHaveLength(1);
    expect(deficiencyCounts([merged], filter("k2")).all).toBe(1);
  });

  test("does not match an unrelated list", () => {
    expect(filterDeficiencies([merged], filter("k3"))).toHaveLength(0);
  });
});
