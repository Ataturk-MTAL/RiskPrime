import { parse, serialize } from "$lib/domain/file";
import type { Assessment } from "$lib/domain/types";
import { compareSummaries, summaryOf, type PeriodStore, type PeriodSummary } from "./types";

const DB_NAME = "riskprime";
const STORE = "periods";
const DB_VERSION = 1;

/** Stored value: the summary (for listing without parsing) plus the serialized file text. */
export interface PeriodRecord {
  summary: PeriodSummary;
  text: string;
}

export const toRecord = (a: Assessment): PeriodRecord => ({
  summary: summaryOf(a),
  text: serialize(a),
});

/** Parses through file.ts so migrations apply; null when the record is unreadable. */
export const fromText = (text: string): Assessment | null => {
  const result = parse(text);
  return "errors" in result ? null : result.assessment;
};

export const fromRecord = (record: PeriodRecord | undefined): Assessment | null =>
  record ? fromText(record.text) : null;

const wrap = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB hatası"));
  });

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

export function createIndexedDbStore(factory: IDBFactory = indexedDB): PeriodStore {
  let opened: Promise<IDBDatabase> | null = null;
  const db = () =>
    (opened ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        opened = null;
        reject(request.error ?? new Error("IndexedDB açılamadı"));
      };
    }));
  const objects = async (mode: IDBTransactionMode) =>
    (await db()).transaction(STORE, mode).objectStore(STORE);

  return {
    async list() {
      const records = await wrap(
        (await objects("readonly")).getAll() as IDBRequest<PeriodRecord[]>,
      );
      return records.map((r) => r.summary).sort(compareSummaries);
    },
    async load(id) {
      return fromRecord(await wrap((await objects("readonly")).get(id)));
    },
    async save(a) {
      const record = toRecord(a);
      await wrap((await objects("readwrite")).put(record, record.summary.id));
      return record.summary;
    },
    async remove(id) {
      await wrap((await objects("readwrite")).delete(id));
    },
  };
}
