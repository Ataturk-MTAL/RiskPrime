import { describe, expect, test } from "vite-plus/test";
import starter from "../data/starter.json";
import { autoAssign, suggestLocations } from "./auto-assign";
import type { Assessment } from "./types";

const base = () => structuredClone(starter) as unknown as Assessment;
const names = (a: Assessment, ids: string[]) =>
  ids.map((id) => a.locations.find((l) => l.id === id)!.name);
const list = (a: Assessment, prefix: string) =>
  a.checklists.find((c) => c.name.startsWith(prefix))!;

describe("suggestLocations", () => {
  const a = base();
  test("matches a single workshop code", () => {
    expect(names(a, suggestLocations(a, list(a, "ELE1 ·")))).toEqual([
      "ELE1 · Haberleşme ve Görüntü Sistemleri",
    ]);
  });
  test("matches several codes in one name", () => {
    expect(suggestLocations(a, list(a, "ELE2, ELE4"))).toHaveLength(4);
    expect(suggestLocations(a, list(a, "ELE13, ELE15"))).toHaveLength(2);
  });
  test("does not confuse ELE1 with ELE10..ELE15", () => {
    expect(suggestLocations(a, { name: "ELE1 · x" })).toHaveLength(1);
  });
  test("depot lists go to the storage locations", () => {
    expect(names(a, suggestLocations(a, list(a, "Elektronik ve elektrik depoları")))).toEqual([
      "Elektronik deposu",
      "Elektrik deposu",
    ]);
  });
  test("teacher and chief room lists go to the office locations", () => {
    expect(names(a, suggestLocations(a, list(a, "Öğretmen odaları")))).toEqual([
      "Öğretmen odaları (2)",
      "Şef odası (1)",
    ]);
  });
  test("identical name matches the location", () => {
    expect(names(a, suggestLocations(a, list(a, "Öğrenci tuvaleti")))).toEqual([
      "Öğrenci tuvaleti (KL-11)",
    ]);
  });
  test("Ortak and unmatched lists stay general", () => {
    expect(suggestLocations(a, list(a, "Ortak: pano"))).toEqual([]);
    expect(suggestLocations(a, list(a, "Eğitim, belge"))).toEqual([]);
    expect(suggestLocations(a, { name: "ELE99 · yok" })).toEqual([]);
  });
});

describe("autoAssign", () => {
  const stripped = () => {
    const a = base();
    return { ...a, checklists: a.checklists.map(({ locationIds: _l, ...c }) => c) };
  };
  test("assigns unassigned lists and leaves general ones alone", () => {
    const out = autoAssign(stripped());
    expect(out.checklists.filter((c) => c.locationIds?.length)).toHaveLength(12);
    expect(list(out, "Ortak: pano").locationIds).toBeUndefined();
  });
  test("keeps existing assignments", () => {
    const a = stripped();
    const id = list(a, "ELE1 ·").id;
    const kept = {
      ...a,
      checklists: a.checklists.map((c) => (c.id === id ? { ...c, locationIds: ["a-16"] } : c)),
    };
    expect(list(autoAssign(kept), "ELE1 ·").locationIds).toEqual(["a-16"]);
  });
  test("onlyListIds restricts the scope", () => {
    const a = stripped();
    const out = autoAssign(a, [list(a, "ELE1 ·").id]);
    expect(out.checklists.filter((c) => c.locationIds?.length)).toHaveLength(1);
  });
  test("starter.json assignments equal suggestLocations (drift guard)", () => {
    const raw = base();
    const bare = stripped();
    for (const c of bare.checklists) {
      const actual = raw.checklists.find((x) => x.id === c.id)!.locationIds ?? [];
      expect(actual).toEqual(suggestLocations(bare, c));
    }
  });
});
