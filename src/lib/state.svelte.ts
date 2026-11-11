import { toast } from "svelte-sonner";
import { tick } from "svelte";
import type { Assessment, ChecklistTemplate, LocationTemplate } from "$lib/domain/types";
import { addLocationFromTemplate, emptyAssessment } from "$lib/domain/assessment";
import { addChecklist as addChecklistFromTemplate } from "$lib/domain/checklist";
import { fileName, parse, serialize } from "$lib/domain/file";
import { isBackup, restoreBackup } from "$lib/domain/excel-backup";
import { conflictingCodes, read as readExcel } from "$lib/domain/excel-import";
import { readiness, type Readiness } from "$lib/domain/readiness";
import { downloadBlob } from "$lib/export/download";
// Heavy export libraries (xlsx, docx, typst.ts loader) load on first use, not on page load.
const pdfModule = () => import("$lib/export/pdf");
const excelModule = () => import("$lib/export/excel");
const wordModule = () => import("$lib/export/word");
import starter from "$lib/data/starter.json";

export type Tab = "risk" | "checklists";
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
const UNDO_TOAST_MS = 10_000;
const MAX_SHOWN_ERRORS = 8;
const PDF_KINDS = {
  "pdf-full": "full",
  "pdf-checklists": "checklists",
  "pdf-blank": "blank",
} as const;

const starterAssessment = (): Assessment => structuredClone(starter) as unknown as Assessment;

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
  tab = $state<Tab>("risk");
  locationId = $state<string | null>(null);
  checklistId = $state<string | null>(null);
  /** Incremented whenever a whole assessment is loaded (not on edits). */
  loadCount = $state(0);
  conflict = $state.raw<{ codes: string[]; resolve: (choice: ConflictChoice) => void } | null>(
    null,
  );
  discard = $state.raw<{ resolve: (choice: DiscardChoice) => void } | null>(null);

  constructor() {
    const saved = this.#readStorage();
    if (saved) this.assessment = saved;
    try {
      this.dirty = localStorage.getItem(DIRTY_KEY) === "1";
      this.savedAt = localStorage.getItem(SAVED_AT_KEY);
    } catch {
      this.storageOk = false;
    }
    this.#settle();
  }

  get location() {
    return this.assessment.locations.find((l) => l.id === this.locationId) ?? null;
  }

  get checklist() {
    return this.assessment.checklists.find((c) => c.id === this.checklistId) ?? null;
  }

  #readStorage(): Assessment | null {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) return null;
      const result = parse(text);
      return "assessment" in result ? result.assessment : null;
    } catch {
      this.storageOk = false;
      return null;
    }
  }

  #persist() {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(this.assessment));
      if (this.dirty) localStorage.setItem(DIRTY_KEY, "1");
      else localStorage.removeItem(DIRTY_KEY);
      if (this.savedAt) localStorage.setItem(SAVED_AT_KEY, this.savedAt);
      else localStorage.removeItem(SAVED_AT_KEY);
    } catch {
      this.storageOk = false;
    }
  }

  /** Keep selections pointing at existing items. */
  #settle() {
    const { locations, checklists } = this.assessment;
    if (!locations.some((l) => l.id === this.locationId))
      this.locationId = locations[0]?.id ?? null;
    if (!checklists.some((c) => c.id === this.checklistId))
      this.checklistId = checklists[0]?.id ?? null;
  }

  fail(errors: string[]) {
    this.errors = errors;
  }

  clearErrors() {
    this.errors = [];
  }

  /** Runs a domain update; on a thrown Error the data stays untouched and the message is shown. */
  apply(update: (a: Assessment) => Assessment, { dirty = true } = {}): boolean {
    try {
      this.assessment = update(this.assessment);
    } catch (error) {
      this.fail([error instanceof Error ? error.message : "Beklenmeyen hata."]);
      return false;
    }
    this.dirty = dirty;
    this.errors = [];
    this.#settle();
    this.#persist();
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

  /** Replaces the whole assessment and offers a one-step undo. */
  #load(next: Assessment, message: string) {
    const previous = this.assessment;
    const previousDirty = this.dirty;
    if (!this.apply(() => next, { dirty: false })) return;
    this.loadCount += 1;
    toast.success(message, {
      duration: UNDO_TOAST_MS,
      action: { label: "Geri al", onClick: () => this.#restore(previous, previousDirty) },
    });
  }

  #restore(previous: Assessment, wasDirty: boolean) {
    if (this.apply(() => previous, { dirty: wasDirty })) this.loadCount += 1;
  }

  /** Applies a destructive edit without a dialog; the toast offers undo instead. */
  applyWithUndo(update: (a: Assessment) => Assessment, message: string) {
    const previous = this.assessment;
    const previousDirty = this.dirty;
    if (!this.apply(update)) return;
    toast(message, {
      duration: UNDO_TOAST_MS,
      action: {
        label: "Geri al",
        onClick: () => this.apply(() => previous, { dirty: previousDirty }),
      },
    });
  }

  async newFromStarter() {
    if (await this.#confirmDiscard()) this.#load(starterAssessment(), "Örnek çalışma açıldı.");
  }

  async newEmpty() {
    if (await this.#confirmDiscard()) this.#load(emptyAssessment(""), "Boş çalışma açıldı.");
  }

  selectLocation(id: string) {
    this.locationId = id;
    this.tab = "risk";
  }

  selectChecklist(id: string) {
    this.checklistId = id;
    this.tab = "checklists";
  }

  addBlankChecklist() {
    const before = this.assessment.checklists.length;
    if (!this.apply((a) => addChecklistFromTemplate(a))) return;
    this.checklistId = this.assessment.checklists[before]?.id ?? null;
  }

  addFromLibrary(locations: LocationTemplate[], checklists: ChecklistTemplate[]) {
    const beforeLocations = this.assessment.locations.length;
    const beforeLists = this.assessment.checklists.length;
    const ok = this.apply((a) =>
      checklists.reduce(
        (acc, tpl) => addChecklistFromTemplate(acc, tpl),
        locations.reduce(addLocationFromTemplate, a),
      ),
    );
    if (!ok) return;
    toast.info(
      `Eklendi: ${locations.length} mekân, ${checklists.length} kontrol listesi. İstemediğinizi ilgili ekrandan silebilirsiniz.`,
    );
    if (locations.length) this.selectLocation(this.assessment.locations[beforeLocations].id);
    else this.selectChecklist(this.assessment.checklists[beforeLists].id);
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
    if (!this.apply(() => result.assessment)) return;
    const s = result.summary;
    toast.info(
      `İçe alındı: ${s.school ? "okul ve imzacı bilgileri, " : ""}${s.lists} kontrol listesi (${s.items} madde), ${s.rows} risk satırı, ${s.locations} yeni mekân.`,
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
      downloadBlob(
        new Blob([serialize(this.assessment)], { type: "application/json" }),
        fileName(this.assessment),
      );
      this.#markSaved();
      return;
    }
    const a = this.assessment;
    const jobs: Record<Exclude<ExportKind, "json">, () => Promise<void> | void> = {
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
      await jobs[kind]();
      if (kind === "xlsx") this.#markSaved(); // the Excel file is a full backup, like .json
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
