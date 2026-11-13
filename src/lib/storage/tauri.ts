// Desktop period store: the Rust side keeps the snapshots in a local SQLite database.
import { serialize } from "$lib/domain/file";
import { fromText } from "./indexeddb";
import type { PeriodStore, PeriodSummary } from "./types";

export type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

// Dynamic import keeps @tauri-apps/api out of the eagerly loaded web bundle.
const tauriInvoke: Invoke = async (command, args) =>
  (await import("@tauri-apps/api/core")).invoke(command, args);

export function createTauriStore(invoke: Invoke = tauriInvoke): PeriodStore {
  return {
    list: () => invoke<PeriodSummary[]>("periods_list"),
    async load(id) {
      const text = await invoke<string | null>("periods_load", { id });
      return text === null ? null : fromText(text);
    },
    save: (a) => invoke<PeriodSummary>("periods_save", { document: serialize(a) }),
    remove: (id) => invoke<void>("periods_remove", { id }),
  };
}
