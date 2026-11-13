import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { emptyAssessment } from "$lib/domain/assessment";
import { Archive, ARCHIVE_DEBOUNCE_MS } from "./archive.svelte";
import { createMemoryStore } from "./storage/memory";
import { fromRecord, toRecord } from "./storage/indexeddb";
import { compareSummaries, periodKey } from "./storage/types";

const period = (name: string, revision = 1) => {
  const a = emptyAssessment(name);
  return { ...a, period: name, meta: { ...a.meta, revision } };
};

describe("memory store", () => {
  it("sorts newest period then revision first", async () => {
    const s = createMemoryStore();
    await s.save(period("2025-2026"));
    await s.save(period("2026-2027", 1));
    await s.save(period("2026-2027", 2));
    expect((await s.list()).map((x) => x.id)).toEqual([
      "2026-2027#r2",
      "2026-2027#r1",
      "2025-2026#r1",
    ]);
  });
  it("round-trips through serialize/parse and returns null when missing", async () => {
    const s = createMemoryStore();
    const sum = await s.save(period("2026-2027"));
    expect((await s.load(sum.id))?.period).toBe("2026-2027");
    expect(await s.load("yok")).toBeNull();
  });
  it("removes snapshots", async () => {
    const s = createMemoryStore();
    const sum = await s.save(period("2026-2027"));
    await s.remove(sum.id);
    expect(await s.list()).toEqual([]);
  });
});

describe("indexeddb record helpers", () => {
  it("round-trips a record and rejects garbage", () => {
    const a = period("2026-2027");
    expect(toRecord(a).summary.id).toBe(periodKey("2026-2027", 1));
    expect(fromRecord(toRecord(a))?.period).toBe("2026-2027");
    expect(fromRecord({ summary: toRecord(a).summary, text: "{" })).toBeNull();
    expect(fromRecord(undefined)).toBeNull();
  });
  it("compareSummaries orders by period then revision", () => {
    const a = toRecord(period("2026-2027", 1)).summary;
    const b = toRecord(period("2026-2027", 2)).summary;
    expect(compareSummaries(a, b)).toBeGreaterThan(0);
  });
});

describe("Archive", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces edits and saves immediately on request", async () => {
    const fail = vi.fn();
    const archive = new Archive(fail, { store: createMemoryStore(), available: true });
    void archive.save(period("2026-2027"), false);
    expect(archive.periods).toEqual([]);
    await vi.advanceTimersByTimeAsync(ARCHIVE_DEBOUNCE_MS);
    expect(archive.periods).toHaveLength(1);
    await archive.save(period("2027-2028"), true);
    expect(archive.periods).toHaveLength(2);
    expect(fail).not.toHaveBeenCalled();
  });

  it("flushes a pending edit of another snapshot before an immediate save", async () => {
    const archive = new Archive(vi.fn(), { store: createMemoryStore(), available: true });
    void archive.save(period("2026-2027"), false);
    await archive.save(period("2027-2028"), true);
    expect(archive.periods).toHaveLength(2);
  });

  it("flush writes a pending edit at once and cancels the timer", async () => {
    const store = createMemoryStore();
    const archive = new Archive(vi.fn(), { store, available: true });
    void archive.save(period("2026-2027"), false);
    await archive.flush();
    expect(archive.periods).toHaveLength(1);
    const save = vi.spyOn(store, "save");
    await vi.advanceTimersByTimeAsync(ARCHIVE_DEBOUNCE_MS);
    expect(save).not.toHaveBeenCalled();
  });

  it("refuses to delete the open snapshot", async () => {
    const fail = vi.fn();
    const archive = new Archive(fail, { store: createMemoryStore(), available: true });
    const a = period("2026-2027");
    await archive.save(a, true);
    await archive.remove(periodKey(a.period, 1), a);
    expect(fail).toHaveBeenCalled();
    expect(archive.periods).toHaveLength(1);
    await archive.remove(periodKey(a.period, 1), period("2030-2031"));
    expect(archive.periods).toHaveLength(0);
  });
});
