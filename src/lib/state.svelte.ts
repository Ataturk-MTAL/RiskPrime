import { toast } from "svelte-sonner";
import { tick } from "svelte";
import type { Assessment, ChecklistTemplate, LocationTemplate } from "$lib/domain/types";
import { addLocationFromTemplate, emptyAssessment } from "$lib/domain/assessment";
import { addChecklist as addChecklistFromTemplate } from "$lib/domain/checklist";
import { autoAssign } from "$lib/domain/auto-assign";
import {
  applyBankChanges,
  bankChanges,
  hasBankChanges,
  type BankChanges,
  type BankSelection,
} from "$lib/domain/bank-sync";
import { startNextPeriod } from "$lib/domain/rollover";
import { APP_VERSION, nowIso } from "$lib/domain/app-version";
import { isLocked, reviseDraft, signSnapshot, touch } from "$lib/domain/snapshot";
import { fileName, parse, serialize } from "$lib/domain/file";
import { isBackup, restoreBackup } from "$lib/domain/excel-backup";
import { conflictingCodes, read as readExcel } from "$lib/domain/excel-import";
import { readiness, type Readiness } from "$lib/domain/readiness";
import { transferMissing } from "$lib/domain/transfer";
import { downloadBlob } from "$lib/export/download";
import { nav } from "$lib/nav.svelte";
import { Archive } from "$lib/archive.svelte";
// Heavy export libraries (xlsx, docx, typst.ts loader) load on first use, not on page load.
const pdfModule = () => import("$lib/export/pdf");
const excelModule = () => import("$lib/export/excel");
const wordModule = () => import("$lib/export/word");
import starter from "$lib/data/starter.json";

export type ExportKind =
  | "json"
  | "pdf-full"
  | "pdf-checklists"
  | "pdf-blank"
  | "xlsx"
  | "docx"
  | "template";
export type ConflictChoice = "replace" | "append" | null;
/** Answer to "unsaved changes will be lost": save first, discard, or cancel (null). */
export type DiscardChoice = "save" | "discard" | null;

const STORAGE_KEY = "riskprime.assessment";
/** Survives reloads so New/Open still warn about work that was never downloaded. */
const DIRTY_KEY = "riskprime.dirty";
const SAVED_AT_KEY = "riskprime.savedAt";
/** Raw text of a stored assessment that failed validation, kept so it can be recovered. */
const UNREADABLE_KEY = "riskprime.assessment.unreadable";
const RECOVERY_FILE = "riskprime-kurtarma.json";
const UNDO_TOAST_MS = 10_000;
const MAX_SHOWN_ERRORS = 8;
const PDF_KINDS = {
  "pdf-full": "full",
  "pdf-checklists": "checklists",
  "pdf-blank": "blank",
} as const;

const LOCKED_MESSAGE =
  "Bu dönem imzalandı ve kilitli; değişiklik için Rapor sayfasından düzeltme taslağı açın.";

/** The bundled starter as a new period created now. */
const starterAssessment = (): Assessment => {
  const a = structuredClone(starter) as unknown as Assessment;
  const now = nowIso();
  return { ...a, meta: { ...a.meta, createdAt: now, updatedAt: now, appVersion: APP_VERSION } };
};

function errorList(title: string, errors: string[]): string[] {
  const rest = errors.length - MAX_SHOWN_ERRORS;
  return [
    title,
    ...errors.slice(0, MAX_SHOWN_ERRORS),
    ...(rest > 0 ? [`… ve ${rest} hata daha`] : []),
  ];
}

class Store {
  assessment = $state.raw<Assessment>(starterAssessment());
  dirty = $state(false);
  /** ISO time of the last .json / .xlsx download, if any. */
  savedAt = $state<string | null>(null);
  storageOk = $state(true);
  errors = $state.raw<string[]>([]);
  busy = $state("");
  /** Gaps found before a full PDF; non-null opens the readiness dialog. */
  readinessGaps = $state.raw<Readiness | null>(null);
  /** Incremented whenever a whole assessment is loaded (not on edits). */
  loadCount = $state(0);
  /** Incremented when an edit is refused (locked period) so pages re-render the unchanged values. */
  refusedEdits = $state(0);
  conflict = $state.raw<{ codes: string[]; resolve: (choice: ConflictChoice) => void } | null>(
    null,
  );
  discard = $state.raw<{ resolve: (choice: DiscardChoice) => void } | null>(null);
  /** Bank updates offered to the school; non-null opens the bank-updates dialog. */
  bankOffer = $state.raw<BankChanges | null>(null);
  /** True while an unreadable stored assessment is backed up under UNREADABLE_KEY. */
  hasUnreadable = $state(false);
  /** Another tab wrote the assessment; offered, never applied automatically. */
  changedElsewhere = $state(false);
  #undoToast: string | number | null = null;
  #archive = new Archive((errors) => this.fail(errors));

  /** Archived period snapshots, newest first. */
  get periods() {
    return this.#archive.periods;
  }
  /** False when IndexedDB is unavailable (private mode): the archive then lasts one session only. */
  get archiveAvailable() {
    return this.#archive.available;
  }

  refreshPeriods() {
    return this.#archive.refresh();
  }

  async openPeriod(id: string) {
    const loaded = await this.#archive.load(id);
    if (!loaded) return;
    if (await this.#confirmDiscard()) this.#load(loaded, "Dönem açıldı.");
  }

  deletePeriod(id: string) {
    return this.#archive.remove(id, this.assessment);
  }

  constructor() {
    const saved = this.#readStorage();
    if (saved) this.assessment = saved;
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
    this.#settle();
    void this.#archive.refresh();
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
      this.#settle();
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

  #readStorage(): Assessment | null {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) return null;
      const result = parse(text);
      if ("assessment" in result) return result.assessment;
      // Never silently replace a stored work: keep the raw text once.
      if (localStorage.getItem(UNREADABLE_KEY) === null) localStorage.setItem(UNREADABLE_KEY, text);
      return null;
    } catch {
      this.storageOk = false;
      return null;
    }
  }

  #persist() {
    try {
      // Small keys first: they must land even when the big write hits the quota.
      if (this.dirty) localStorage.setItem(DIRTY_KEY, "1");
      else localStorage.removeItem(DIRTY_KEY);
      if (this.savedAt) localStorage.setItem(SAVED_AT_KEY, this.savedAt);
      else localStorage.removeItem(SAVED_AT_KEY);
      localStorage.setItem(STORAGE_KEY, serialize(this.assessment));
      this.storageOk = true;
    } catch {
      this.storageOk = false;
    }
  }

  /** Keep the navigation place pointing at existing items. */
  #settle() {
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
    this.#settle();
    this.#persist();
    void this.#archive.save(this.assessment, restore); // loads, signing and undo archive at once; edits debounce
    return true;
  }

  #markSaved() {
    this.dirty = false;
    this.savedAt = new Date().toISOString();
    this.#persist();
  }

  /** Resolves true when the current work may be replaced (nothing unsaved, saved first, or discarded). */
  async #confirmDiscard(): Promise<boolean> {
    if (!this.dirty) return true;
    if (this.discard) return false; // a prompt is already open
    const choice = await new Promise<DiscardChoice>((resolve) => {
      this.discard = {
        resolve: (c) => {
          this.discard = null;
          resolve(c);
        },
      };
    });
    if (choice === "save") await this.exportAs("json");
    return choice !== null;
  }

  /**
   * Applies an edit and offers a one-step undo toast. A document replacement also resets
   * savedAt (the new document was never saved) and restores it on undo.
   */
  #applyUndoable(
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

  #load(next: Assessment, message: string) {
    this.#applyUndoable(() => next, message, { replacesDocument: true, notify: toast.success });
  }

  /** Applies a destructive edit without a dialog; the toast offers undo instead. */
  applyWithUndo(update: (a: Assessment) => Assessment, message: string) {
    this.#applyUndoable(update, message);
  }

  /** Moves untransferred deficiencies into the risk table (undoable) and offers a jump to it. */
  transferMissing(listId?: string) {
    const result = transferMissing(this.assessment, listId);
    if (!result.created) {
      toast.info(
        result.skippedNoLocation
          ? "Risk satırı açılacak mekân yok; önce bir mekân ekleyin."
          : "Aktarılacak eksik yok.",
      );
      return;
    }
    const grown = result.assessment.locations.filter(
      (l, i) => l.rows.length > (this.assessment.locations[i]?.rows.length ?? 0),
    );
    const open = () =>
      grown.length === 1
        ? nav.openLocation(grown[0].id, "risk")
        : nav.openRegister({ status: "open" });
    this.#applyUndoable(
      () => result.assessment,
      `${result.created} risk satırı oluşturuldu; puanlamak için risk kaydına geçin.`,
      {
        // The jump is the toast's main action; undo moves to the secondary button.
        notify: ((message, options) =>
          toast.success(message, {
            ...options,
            action: { label: "Risk kaydını aç", onClick: open },
            cancel: options?.action,
          })) as typeof toast.success,
      },
    );
  }

  async newFromStarter() {
    if (await this.#confirmDiscard()) this.#load(starterAssessment(), "Örnek çalışma açıldı.");
  }

  async newPeriod() {
    if (!(await this.#confirmDiscard())) return;
    this.#load(startNextPeriod(this.assessment, nowIso()), "Yeni dönem açıldı.");
    this.openBankOffer();
  }

  /** Opens the bank-updates dialog when the checklists lag behind the question bank. */
  openBankOffer() {
    const changes = bankChanges(this.assessment);
    this.bankOffer = hasBankChanges(changes) ? changes : null;
  }

  dismissBankOffer() {
    this.bankOffer = null;
  }

  /** Applies the chosen bank updates as one undoable edit; the dialog closes only on success. */
  applyBankSelection(selection: BankSelection) {
    const ok = this.#applyUndoable(
      (a) => applyBankChanges(a, selection),
      "Kontrol listeleri güncellemeleri uygulandı.",
    );
    if (ok) this.bankOffer = null;
  }

  /** Signs and locks the period (no undo: the seal must not be silently reverted); persists. */
  async closePeriod() {
    const current = this.assessment;
    try {
      const signed = await signSnapshot(touch(current, nowIso(), APP_VERSION), nowIso());
      if (this.assessment !== current)
        throw new Error("Çalışma imzalanırken değişti; yeniden deneyin.");
      this.apply(() => signed, { restore: true });
    } catch (error) {
      this.fail([error instanceof Error ? error.message : "Beklenmeyen hata."]);
    }
  }

  /** Opens a correction draft of the signed period (undoable). */
  reviseLocked() {
    this.#applyUndoable((a) => reviseDraft(a, nowIso()), "Düzeltme taslağı açıldı.", {
      restore: true,
    });
  }

  async newEmpty() {
    if (await this.#confirmDiscard()) this.#load(emptyAssessment(""), "Boş çalışma açıldı.");
  }

  // Thin wrappers over nav for callers that still go through the store.
  openSchool() {
    nav.openReport(true);
  }

  selectLocation(id: string) {
    nav.openLocation(id, "risk");
  }

  openRow(locationId: string, rowId: string) {
    nav.openRow(locationId, rowId);
  }

  selectChecklist(id: string) {
    nav.openLibrary(id);
  }

  addBlankChecklist() {
    const before = this.assessment.checklists.length;
    if (!this.apply((a) => addChecklistFromTemplate(a))) return;
    nav.openLibrary(this.assessment.checklists[before]?.id ?? null);
  }

  addFromLibrary(locations: LocationTemplate[], checklists: ChecklistTemplate[]) {
    const beforeLocations = this.assessment.locations.length;
    const beforeLists = this.assessment.checklists.length;
    const ok = this.apply((a) => {
      const added = checklists.reduce(
        (acc, tpl) => addChecklistFromTemplate(acc, tpl),
        locations.reduce(addLocationFromTemplate, a),
      );
      return autoAssign(
        added,
        added.checklists.slice(beforeLists).map((c) => c.id),
      );
    });
    if (!ok) return;
    toast.info(
      `Eklendi: ${locations.length} mekân, ${checklists.length} kontrol listesi. İstemediğinizi ilgili ekrandan silebilirsiniz.`,
    );
    if (locations.length) nav.openLocation(this.assessment.locations[beforeLocations].id);
    else nav.openLibrary(this.assessment.checklists[beforeLists]?.id ?? null);
  }

  async openFile(file: File) {
    if (/\.xlsx?$/i.test(file.name)) return this.#importExcel(file);
    let text: string;
    try {
      text = await file.text();
    } catch {
      return this.fail([`"${file.name}" okunamadı.`]);
    }
    const result = parse(text);
    if ("errors" in result) return this.fail(errorList(`"${file.name}" açılamadı:`, result.errors));
    if (await this.#confirmDiscard()) this.#load(result.assessment, `Açıldı: ${file.name}`);
  }

  askConflict(codes: string[]): Promise<ConflictChoice> {
    return new Promise((resolve) => {
      this.conflict = {
        codes,
        resolve: (choice) => {
          this.conflict = null;
          resolve(choice);
        },
      };
    });
  }

  /** Opens an Excel backup like a .json file: confirm, then replace everything. */
  async #restoreExcel(name: string, sheets: Record<string, unknown[][]>) {
    const result = restoreBackup(sheets);
    if ("errors" in result)
      return this.fail(errorList(`"${name}" geri yüklenemedi:`, result.errors));
    if (await this.#confirmDiscard())
      this.#load(result.assessment, `Kayıt dosyası geri yüklendi: ${name}`);
  }

  async #importExcel(file: File) {
    let sheets: Record<string, unknown[][]>;
    try {
      sheets = await (await excelModule()).readWorkbook(file);
    } catch (error) {
      return this.fail([
        `"${file.name}" okunamadı: ${error instanceof Error ? error.message : ""}`,
      ]);
    }
    if (isBackup(sheets)) return this.#restoreExcel(file.name, sheets);
    const codes = conflictingCodes(this.assessment, sheets);
    const choice = codes.length ? await this.askConflict(codes) : "append";
    if (!choice) return;
    const result = readExcel(this.assessment, sheets, { sameCode: choice });
    if ("errors" in result)
      return this.fail(
        errorList(`"${file.name}" içe alınamadı, hiçbir şey eklenmedi:`, result.errors),
      );
    const s = result.summary;
    const skipped = (s as { skippedRows?: number }).skippedRows ?? 0;
    if (!s.school && !s.lists && !s.rows && !s.locations)
      return void toast.info("Dosyada içe alınacak veri yok.");
    this.#applyUndoable(
      () => result.assessment,
      `İçe alındı: ${s.school ? "okul ve imzacı bilgileri, " : ""}${s.lists} kontrol listesi (${s.items} madde), ${s.rows} risk satırı, ${s.locations} yeni mekân.${skipped > 0 ? ` ${skipped} satır zaten vardı, atlandı.` : ""}`,
      { notify: toast.info },
    );
  }

  /** Full PDF: ask first when the assessment has gaps. */
  requestFullPdf() {
    const gaps = readiness(this.assessment);
    if (gaps.hasGaps) this.readinessGaps = gaps;
    else void this.exportAs("pdf-full");
  }

  async exportAs(kind: ExportKind) {
    if (kind === "json") {
      const saved = await downloadBlob(
        new Blob([serialize(this.assessment)], { type: "application/json" }),
        fileName(this.assessment),
      );
      if (saved) this.#markSaved();
      return;
    }
    const a = this.assessment;
    const jobs: Record<Exclude<ExportKind, "json">, () => Promise<boolean>> = {
      "pdf-full": async () => (await pdfModule()).downloadPdf(a, PDF_KINDS["pdf-full"]),
      "pdf-checklists": async () => (await pdfModule()).downloadPdf(a, PDF_KINDS["pdf-checklists"]),
      "pdf-blank": async () => (await pdfModule()).downloadPdf(a, PDF_KINDS["pdf-blank"]),
      xlsx: async () => (await excelModule()).downloadExcel(a),
      docx: async () => (await wordModule()).downloadWord(a),
      template: async () => (await excelModule()).downloadImportTemplate(),
    };
    this.busy =
      kind in PDF_KINDS
        ? "PDF hazırlanıyor… (ilk seferde derleyici indirilir, biraz sürebilir)"
        : "Dosya hazırlanıyor…";
    this.clearErrors();
    try {
      const saved = await jobs[kind]();
      if (saved && kind === "xlsx") this.#markSaved(); // the Excel file is a full backup, like .json
    } catch (error) {
      this.fail([`Çıktı alınamadı: ${error instanceof Error ? error.message : ""}`]);
    } finally {
      this.busy = "";
    }
  }
}

export const store = new Store();

/** Focus the first text field of an element id once it has rendered. */
export async function focusFirstField(elementId: string, delayMs = 0) {
  await tick();
  if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs)); // portaled content (sheet) mounts late
  document.getElementById(elementId)?.querySelector<HTMLElement>("textarea, input")?.focus();
}
