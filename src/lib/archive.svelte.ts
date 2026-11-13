import type { Assessment } from "$lib/domain/types";
import { getPeriodStore } from "$lib/storage";
import { periodKey, type PeriodStore, type PeriodSummary } from "$lib/storage/types";

export const ARCHIVE_DEBOUNCE_MS = 1000;
const keyOf = (a: Assessment) => periodKey(a.period, a.meta.revision);
const message = (error: unknown) => (error instanceof Error ? error.message : "Beklenmeyen hata.");

/** Period-snapshot archive: wraps a PeriodStore with a reactive list and a debounced auto-save. */
export class Archive {
  periods = $state.raw<PeriodSummary[]>([]);
  available: boolean;
  #store: PeriodStore;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #pending: Assessment | null = null;
  #fail: (errors: string[]) => void;

  constructor(
    fail: (errors: string[]) => void,
    { store, available }: { store: PeriodStore; available: boolean } = getPeriodStore(),
  ) {
    this.#fail = fail;
    this.#store = store;
    this.available = available;
  }

  async refresh() {
    try {
      this.periods = await this.#store.list();
    } catch (error) {
      this.#fail([`Dönem arşivi okunamadı: ${message(error)}`]);
    }
  }

  /** Saves the snapshot now (immediate) or after a quiet second (edits). */
  async save(a: Assessment, immediate: boolean) {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    // A pending edit of another snapshot must not be lost when this one replaces it.
    const pending = this.#pending;
    this.#pending = null;
    if (pending && keyOf(pending) !== keyOf(a)) await this.#write(pending);
    if (immediate) return this.#write(a);
    this.#pending = a;
    this.#timer = setTimeout(() => {
      this.#pending = null;
      void this.#write(a);
    }, ARCHIVE_DEBOUNCE_MS);
  }

  /** Writes a debounced edit now, e.g. before the desktop app locks and refuses archive calls. */
  async flush() {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const pending = this.#pending;
    this.#pending = null;
    if (pending) await this.#write(pending);
  }

  async #write(a: Assessment) {
    try {
      await this.#store.save(a);
      await this.refresh();
    } catch (error) {
      this.#fail([`Dönem arşive kaydedilemedi: ${message(error)}`]);
    }
  }

  load(id: string) {
    return this.#store.load(id).catch((error: unknown) => {
      this.#fail([`Dönem açılamadı: ${message(error)}`]);
      return null;
    });
  }

  /** Refuses the snapshot that is currently open. */
  async remove(id: string, current: Assessment): Promise<void> {
    if (id === keyOf(current)) return this.#fail(["Açık olan dönem silinemez."]);
    try {
      await this.#store.remove(id);
      await this.refresh();
    } catch (error) {
      this.#fail([`Dönem silinemedi: ${message(error)}`]);
    }
  }
}
