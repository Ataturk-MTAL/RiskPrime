import { parse, serialize } from "$lib/domain/file";
import { compareSummaries, summaryOf, type PeriodStore } from "./types";

/** In-memory PeriodStore: tests, and the fallback when IndexedDB is unavailable. Stores serialized text like the real one. */
export function createMemoryStore(): PeriodStore {
  const rows = new Map<string, { summary: ReturnType<typeof summaryOf>; text: string }>();
  return {
    async list() {
      return [...rows.values()].map((r) => r.summary).sort(compareSummaries);
    },
    async load(id) {
      const row = rows.get(id);
      if (!row) return null;
      const result = parse(row.text);
      return "errors" in result ? null : result.assessment;
    },
    async save(a) {
      const summary = summaryOf(a);
      rows.set(summary.id, { summary, text: serialize(a) });
      return summary;
    },
    async remove(id) {
      rows.delete(id);
    },
  };
}
