import { isDesktop } from "$lib/platform";
import { createIndexedDbStore, isIndexedDbAvailable } from "./indexeddb";
import { createMemoryStore } from "./memory";
import { createTauriStore } from "./tauri";
import type { PeriodStore } from "./types";

/** Desktop: SQLite via Tauri commands. Web: IndexedDB when available; otherwise a session-only memory store (available=false: nothing survives a reload). */
export function getPeriodStore(): { store: PeriodStore; available: boolean } {
  if (isDesktop()) return { store: createTauriStore(), available: true };
  if (isIndexedDbAvailable()) return { store: createIndexedDbStore(), available: true };
  return { store: createMemoryStore(), available: false };
}
