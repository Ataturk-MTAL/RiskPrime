import { toast } from "svelte-sonner";
import type { Assessment } from "$lib/domain/types";
import { APP_VERSION, nowIso } from "$lib/domain/app-version";
import { isLocked, touch } from "$lib/domain/snapshot";
import { parse } from "$lib/domain/file";
import { downloadBlob } from "$lib/export/download";
import { nav } from "$lib/nav.svelte";
import { Archive } from "$lib/archive.svelte";
import { isDesktop } from "$lib/platform";
import {
  DIRTY_KEY,
  RECOVERY_FILE,
  SAVED_AT_KEY,
  STORAGE_KEY,
  UNREADABLE_KEY,
  persistAssessment,
  readStoredAssessment,
} from "$lib/store-storage";
import { LOCKED_MESSAGE, UNDO_TOAST_MS, errorList, starterAssessment } from "$lib/store-support";

/** Document state, persistence, the edit/undo core and the period archive; flows live in `Store`. */
export class StoreCore {
  assessment = $state.raw<Assessment>(starterAssessment());
  dirty = $state(false);
  /** ISO time of the last .json / .xlsx download, if any. */
  savedAt = $state<string | null>(null);
  storageOk = $state(true);
  errors = $state.raw<string[]>([]);
  busy = $state("");
  /** Incremented whenever a whole assessment is loaded (not on edits). */
  loadCount = $state(0);
  /** Incremented when an edit is refused (locked period) so pages re-render the unchanged values. */
  refusedEdits = $state(0);
  /** True while an unreadable stored assessment is backed up under UNREADABLE_KEY. */
  hasUnreadable = $state(false);
  /** Another tab wrote the assessment; offered, never applied automatically. */
  changedElsewhere = $state(false);
  #undoToast: string | number | null = null;
  protected archive = new Archive((errors) => this.fail(errors));

  /** Archived period snapshots, newest first. */
  get periods() {
    return this.archive.periods;
  }
  /** False when IndexedDB is unavailable (private mode): the archive then lasts one session only. */
  get archiveAvailable() {
    return this.archive.available;
  }

  refreshPeriods() {
    return this.archive.refresh();
  }

  flushArchive() {
    return this.archive.flush();
  }

  constructor() {
    const stored = readStoredAssessment();
    if (!stored.ok) this.storageOk = false;
    if (stored.assessment) this.assessment = stored.assessment;
    try {
      this.dirty = localStorage.getItem(DIRTY_KEY) === "1";
      this.savedAt = localStorage.getItem(SAVED_AT_KEY);
    } catch {
      this.storageOk = false;
    }
    try {
      this.hasUnreadable = localStorage.getItem(UNREADABLE_KEY) !== null;
    } catch {
      this.storageOk = false;
    }
    this.settle();
    // Desktop: the archive stays locked until the PIN is entered; App refreshes it after unlock.
    if (!isDesktop()) void this.archive.refresh();
    if (typeof window !== "undefined") window.addEventListener("storage", this.#onStorage);
  }

  #onStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && event.key === STORAGE_KEY && event.newValue)
      this.changedElsewhere = true;
  };

  /** Loads what another tab saved (no undo: the other tab holds that version). */
  loadFromOtherTab() {
    this.changedElsewhere = false;
    try {
      const result = parse(localStorage.getItem(STORAGE_KEY) ?? "");
      if ("errors" in result)
        return this.fail(errorList("Diğer sekmedeki çalışma açılamadı:", result.errors));
      this.dismissUndo();
      this.assessment = result.assessment;
      this.dirty = localStorage.getItem(DIRTY_KEY) === "1";
      this.savedAt = localStorage.getItem(SAVED_AT_KEY);
      this.errors = [];
      this.loadCount += 1;
      this.settle();
    } catch {
      this.storageOk = false;
    }
  }

  dismissChangedElsewhere() {
    this.changedElsewhere = false;
  }

  downloadUnreadable() {
    try {
      const text = localStorage.getItem(UNREADABLE_KEY);
      if (text !== null)
        void downloadBlob(new Blob([text], { type: "application/json" }), RECOVERY_FILE);
    } catch {
      this.fail(["Eski veri tarayıcıdan okunamadı."]);
    }
  }

  dismissUnreadable() {
    try {
      localStorage.removeItem(UNREADABLE_KEY);
    } catch {
      this.storageOk = false;
    }
    this.hasUnreadable = false;
  }

  dismissUndo() {
    if (this.#undoToast !== null) toast.dismiss(this.#undoToast);
    this.#undoToast = null;
  }

  protected persist() {
    this.storageOk = persistAssessment(this.assessment, this.dirty, this.savedAt);
  }

  /** Keep the navigation place pointing at existing items. */
  protected settle() {
    const { locations, checklists } = this.assessment;
    const place = nav.place;
    const hasLocation = locations.some((l) => l.id === place.locationId);
    const hasList = checklists.some((c) => c.id === place.listId);
    if ((place.locationId && !hasLocation) || (place.listId && !hasList))
      nav.place = {
        ...place,
        locationId: hasLocation ? place.locationId : null,
        listId: hasList && (!place.locationId || hasLocation) ? place.listId : null,
      };
  }

  fail(errors: string[]) {
    this.errors = errors;
  }

  clearErrors() {
    this.errors = [];
  }

  /** Runs a domain update; on a thrown Error the data stays untouched and the message is shown. */
  apply(
    update: (a: Assessment) => Assessment,
    {
      dirty = true,
      savedAt,
      restore = false,
    }: { dirty?: boolean; savedAt?: string | null; restore?: boolean } = {},
  ): boolean {
    // restore = loading a document, undo or a snapshot step: not an edit, so no lock check and no touch.
    if (!restore && isLocked(this.assessment)) {
      this.fail([LOCKED_MESSAGE]);
      this.refusedEdits += 1;
      return false;
    }
    this.dismissUndo(); // a pending undo would drop edits made after its action
    try {
      const next = update(this.assessment);
      this.assessment = restore ? next : touch(next, nowIso(), APP_VERSION);
    } catch (error) {
      this.fail([error instanceof Error ? error.message : "Beklenmeyen hata."]);
      return false;
    }
    this.dirty = dirty;
    if (savedAt !== undefined) this.savedAt = savedAt;
    this.errors = [];
    this.settle();
    this.persist();
    void this.archive.save(this.assessment, restore); // loads, signing and undo archive at once; edits debounce
    return true;
  }

  protected markSaved() {
    this.dirty = false;
    this.savedAt = new Date().toISOString();
    this.persist();
  }

  /**
   * Applies an edit and offers a one-step undo toast. A document replacement also resets
   * savedAt (the new document was never saved) and restores it on undo.
   */
  protected applyUndoable(
    update: (a: Assessment) => Assessment,
    message: string,
    { replacesDocument = false, restore = false, notify = toast as typeof toast.success } = {},
  ): boolean {
    const previous = this.assessment;
    const previousDirty = this.dirty;
    const previousSavedAt = this.savedAt;
    const options = replacesDocument ? { dirty: false, savedAt: null } : {};
    if (!this.apply(update, { ...options, restore: restore || replacesDocument })) return false;
    if (replacesDocument) this.loadCount += 1;
    const savedAtAtAction = this.savedAt;
    this.#undoToast = notify(message, {
      duration: UNDO_TOAST_MS,
      action: {
        label: "Geri al",
        onClick: () => {
          const savedSince = this.savedAt !== savedAtAtAction;
          const ok = this.apply(() => previous, {
            dirty: previousDirty || savedSince,
            savedAt: replacesDocument ? previousSavedAt : undefined,
            restore: true,
          });
          if (ok && replacesDocument) this.loadCount += 1;
        },
      },
    });
    return true;
  }

  protected loadAssessment(next: Assessment, message: string) {
    this.applyUndoable(() => next, message, { replacesDocument: true, notify: toast.success });
  }

  /** Applies a destructive edit without a dialog; the toast offers undo instead. */
  applyWithUndo(update: (a: Assessment) => Assessment, message: string) {
    this.applyUndoable(update, message);
  }
}
