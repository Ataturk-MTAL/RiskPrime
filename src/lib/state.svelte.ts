import { toast } from 'svelte-sonner';
import { tick } from 'svelte';
import type { Assessment, ChecklistTemplate, LocationTemplate } from '$lib/domain/types';
import { addLocationFromTemplate, emptyAssessment } from '$lib/domain/assessment';
import { addChecklist as addChecklistFromTemplate } from '$lib/domain/checklist';
import { fileName, parse, serialize } from '$lib/domain/file';
import { conflictingCodes, read as readExcel } from '$lib/domain/excel-import';
import { downloadBlob } from '$lib/export/download';
// Heavy export libraries (xlsx, docx, typst.ts loader) load on first use, not on page load.
const pdfModule = () => import('$lib/export/pdf');
const excelModule = () => import('$lib/export/excel');
const wordModule = () => import('$lib/export/word');
import starter from '$lib/data/starter.json';

export type Tab = 'risk' | 'checklists';
export type ExportKind = 'json' | 'pdf-full' | 'pdf-checklists' | 'pdf-blank' | 'xlsx' | 'docx' | 'template';
export type ConflictChoice = 'replace' | 'append' | null;

const STORAGE_KEY = 'riskprime.assessment';
const MAX_SHOWN_ERRORS = 8;
const PDF_KINDS = { 'pdf-full': 'full', 'pdf-checklists': 'checklists', 'pdf-blank': 'blank' } as const;
const LEAVE_PROMPT = 'İndirilmemiş değişiklikler kaybolacak. Devam edilsin mi?';

const starterAssessment = (): Assessment => structuredClone(starter) as unknown as Assessment;

function errorList(title: string, errors: string[]): string[] {
  const rest = errors.length - MAX_SHOWN_ERRORS;
  return [title, ...errors.slice(0, MAX_SHOWN_ERRORS), ...(rest > 0 ? [`… ve ${rest} hata daha`] : [])];
}

class Store {
  assessment = $state.raw<Assessment>(starterAssessment());
  dirty = $state(false);
  storageOk = $state(true);
  errors = $state.raw<string[]>([]);
  busy = $state('');
  tab = $state<Tab>('risk');
  locationId = $state<string | null>(null);
  checklistId = $state<string | null>(null);
  /** Incremented whenever a whole assessment is loaded (not on edits). */
  loadCount = $state(0);
  conflict = $state.raw<{ codes: string[]; resolve: (choice: ConflictChoice) => void } | null>(null);

  constructor() {
    const saved = this.#readStorage();
    if (saved) this.assessment = saved;
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
      return 'assessment' in result ? result.assessment : null;
    } catch {
      this.storageOk = false;
      return null;
    }
  }

  #persist() {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(this.assessment));
    } catch {
      this.storageOk = false;
    }
  }

  /** Keep selections pointing at existing items. */
  #settle() {
    const { locations, checklists } = this.assessment;
    if (!locations.some((l) => l.id === this.locationId)) this.locationId = locations[0]?.id ?? null;
    if (!checklists.some((c) => c.id === this.checklistId)) this.checklistId = checklists[0]?.id ?? null;
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
      this.fail([error instanceof Error ? error.message : 'Beklenmeyen hata.']);
      return false;
    }
    this.dirty = dirty;
    this.errors = [];
    this.#settle();
    this.#persist();
    return true;
  }

  #confirmDiscard(): boolean {
    return !this.dirty || window.confirm(LEAVE_PROMPT);
  }

  #load(next: Assessment) {
    if (this.apply(() => next, { dirty: false })) this.loadCount += 1;
  }

  newFromStarter() {
    if (this.#confirmDiscard()) this.#load(starterAssessment());
  }

  newEmpty() {
    if (this.#confirmDiscard()) this.#load(emptyAssessment(''));
  }

  selectLocation(id: string) {
    this.locationId = id;
    this.tab = 'risk';
  }

  selectChecklist(id: string) {
    this.checklistId = id;
    this.tab = 'checklists';
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
      checklists.reduce((acc, tpl) => addChecklistFromTemplate(acc, tpl), locations.reduce(addLocationFromTemplate, a)),
    );
    if (!ok) return;
    toast.info(`Eklendi: ${locations.length} mekân, ${checklists.length} kontrol listesi. İstemediğinizi ilgili ekrandan silebilirsiniz.`);
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
    if ('errors' in result) return this.fail(errorList(`"${file.name}" açılamadı:`, result.errors));
    if (this.#confirmDiscard()) this.#load(result.assessment);
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
    let sheets: Record<string, unknown[][]>;
    try {
      sheets = await (await excelModule()).readWorkbook(file);
    } catch (error) {
      return this.fail([`"${file.name}" okunamadı: ${error instanceof Error ? error.message : ''}`]);
    }
    const codes = conflictingCodes(this.assessment, sheets);
    const choice = codes.length ? await this.askConflict(codes) : 'append';
    if (!choice) return;
    const result = readExcel(this.assessment, sheets, { sameCode: choice });
    if ('errors' in result) return this.fail(errorList(`"${file.name}" içe alınamadı, hiçbir şey eklenmedi:`, result.errors));
    if (!this.apply(() => result.assessment)) return;
    const s = result.summary;
    toast.info(`İçe alındı: ${s.lists} kontrol listesi (${s.items} madde), ${s.rows} risk satırı, ${s.locations} yeni mekân.`);
  }

  async exportAs(kind: ExportKind) {
    if (kind === 'json') {
      downloadBlob(new Blob([serialize(this.assessment)], { type: 'application/json' }), fileName(this.assessment));
      this.dirty = false;
      return;
    }
    const a = this.assessment;
    const jobs: Record<Exclude<ExportKind, 'json'>, () => Promise<void> | void> = {
      'pdf-full': async () => (await pdfModule()).downloadPdf(a, PDF_KINDS['pdf-full']),
      'pdf-checklists': async () => (await pdfModule()).downloadPdf(a, PDF_KINDS['pdf-checklists']),
      'pdf-blank': async () => (await pdfModule()).downloadPdf(a, PDF_KINDS['pdf-blank']),
      xlsx: async () => (await excelModule()).downloadExcel(a),
      docx: async () => (await wordModule()).downloadWord(a),
      template: async () => (await excelModule()).downloadImportTemplate(),
    };
    this.busy = kind in PDF_KINDS ? 'PDF hazırlanıyor… (ilk seferde derleyici indirilir, biraz sürebilir)' : 'Dosya hazırlanıyor…';
    this.clearErrors();
    try {
      await jobs[kind]();
    } catch (error) {
      this.fail([`Çıktı alınamadı: ${error instanceof Error ? error.message : ''}`]);
    } finally {
      this.busy = '';
    }
  }
}

export const store = new Store();

/** Focus the first text field of an element id once it has rendered. */
export async function focusFirstField(elementId: string, delayMs = 0) {
  await tick();
  if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs)); // portaled content (sheet) mounts late
  document.getElementById(elementId)?.querySelector<HTMLElement>('textarea, input')?.focus();
}
