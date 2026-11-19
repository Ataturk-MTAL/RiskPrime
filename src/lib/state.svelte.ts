import { toast } from "svelte-sonner";
import { tick } from "svelte";
import type { ChecklistTemplate, LocationTemplate } from "$lib/domain/types";
import { emptyAssessment } from "$lib/domain/assessment";
import { addChecklist as addChecklistFromTemplate } from "$lib/domain/checklist";
import { addFromLibrary } from "$lib/domain/library";
import {
  applyBankChanges,
  bankChanges,
  hasBankChanges,
  type BankChanges,
  type BankSelection,
} from "$lib/domain/bank-sync";
import { startNextPeriod } from "$lib/domain/rollover";
import { APP_VERSION, nowIso } from "$lib/domain/app-version";
import { signSnapshot, reviseDraft, touch } from "$lib/domain/snapshot";
import { parse } from "$lib/domain/file";
import { readiness, type Readiness } from "$lib/domain/readiness";
import { nav } from "$lib/nav.svelte";
import { runExport, isPdfKind } from "$lib/export-jobs";
import { openExcel } from "$lib/excel-import-flow";
import { StoreCore } from "$lib/store-core.svelte";
import {
  errorList,
  starterAssessment,
  type ConflictChoice,
  type DiscardChoice,
  type ExportKind,
} from "$lib/store-support";

export type { ConflictChoice, DiscardChoice, ExportKind };

class Store extends StoreCore {
  busy = $state("");
  /** Gaps found before a full PDF; non-null opens the readiness dialog. */
  readinessGaps = $state.raw<Readiness | null>(null);
  conflict = $state.raw<{ codes: string[]; resolve: (choice: ConflictChoice) => void } | null>(
    null,
  );
  discard = $state.raw<{ resolve: (choice: DiscardChoice) => void } | null>(null);
  /** Bank updates offered to the school; non-null opens the bank-updates dialog. */
  bankOffer = $state.raw<BankChanges | null>(null);

  async openPeriod(id: string) {
    const loaded = await this.archive.load(id);
    if (!loaded) return;
    if (await this.#confirmDiscard()) this.loadAssessment(loaded, "Dönem açıldı.");
  }

  deletePeriod(id: string) {
    return this.archive.remove(id, this.assessment);
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

  async newFromStarter() {
    if (await this.#confirmDiscard())
      this.loadAssessment(starterAssessment(), "Örnek çalışma açıldı.");
  }

  async newPeriod() {
    if (!(await this.#confirmDiscard())) return;
    this.loadAssessment(startNextPeriod(this.assessment, nowIso()), "Yeni dönem açıldı.");
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
    const ok = this.applyUndoable(
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
    this.applyUndoable((a) => reviseDraft(a, nowIso()), "Düzeltme taslağı açıldı.", {
      restore: true,
    });
  }

  async newEmpty() {
    if (await this.#confirmDiscard())
      this.loadAssessment(emptyAssessment(""), "Boş çalışma açıldı.");
  }

  addBlankChecklist() {
    const before = this.assessment.checklists.length;
    if (!this.apply((a) => addChecklistFromTemplate(a))) return;
    nav.openLibrary(this.assessment.checklists[before]?.id ?? null);
  }

  /** `library`: where the MEB lists named by location templates are taken from. */
  addFromLibrary(
    locations: LocationTemplate[],
    checklists: ChecklistTemplate[],
    library: ChecklistTemplate[],
  ) {
    const beforeLocations = this.assessment.locations.length;
    const beforeLists = this.assessment.checklists.length;
    const ok = this.apply((a) => addFromLibrary(a, locations, checklists, library));
    if (!ok) return;
    const addedLists = this.assessment.checklists.length - beforeLists;
    toast.info(
      `Eklendi: ${locations.length} mekân, ${addedLists} kontrol listesi. İstemediğinizi ilgili ekrandan silebilirsiniz.`,
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
    if (await this.#confirmDiscard())
      this.loadAssessment(result.assessment, `Açıldı: ${file.name}`);
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

  async #importExcel(file: File) {
    const outcome = await openExcel(file, this.assessment, (codes) => this.askConflict(codes));
    if (outcome.kind === "errors") return this.fail(outcome.errors);
    if (outcome.kind === "info") return void toast.info(outcome.message);
    if (outcome.kind === "merge")
      return void this.applyUndoable(() => outcome.assessment, outcome.message, {
        notify: toast.info,
      });
    // A backup replaces everything, like opening a .json file.
    if (outcome.kind === "restore" && (await this.#confirmDiscard()))
      this.loadAssessment(outcome.assessment, outcome.message);
  }

  /** Full PDF: ask first when the assessment has gaps. */
  requestFullPdf() {
    const gaps = readiness(this.assessment);
    if (gaps.hasGaps) this.readinessGaps = gaps;
    else void this.exportAs("pdf-full");
  }

  async exportAs(kind: ExportKind) {
    if (kind === "json") {
      if (await runExport(kind, this.assessment)) this.markSaved();
      return;
    }
    this.busy = isPdfKind(kind)
      ? "PDF hazırlanıyor… (ilk seferde derleyici indirilir, biraz sürebilir)"
      : "Dosya hazırlanıyor…";
    this.clearErrors();
    try {
      const saved = await runExport(kind, this.assessment);
      if (saved && kind === "xlsx") this.markSaved(); // the Excel file is a full backup, like .json
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
