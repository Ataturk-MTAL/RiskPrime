import { createIndexedDbStore, isIndexedDbAvailable } from "./indexeddb";
import { createMemoryStore } from "./memory";
import type { PeriodStore } from "./types";

/** IndexedDB when available; otherwise a session-only memory store (available=false: nothing survives a reload). */
export function getPeriodStore(): { store: PeriodStore; available: boolean } {
  if (isIndexedDbAvailable()) return { store: createIndexedDbStore(), available: true };
  return { store: createMemoryStore(), available: false };
}
