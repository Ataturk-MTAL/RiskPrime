import type { Assessment } from "$lib/domain/types";
import { fileName, serialize } from "$lib/domain/file";
import { downloadBlob } from "$lib/export/download";
import type { ExportKind } from "$lib/store-support";

// Heavy export libraries (xlsx, docx, typst.ts loader) load on first use, not on page load.
const pdfModule = () => import("$lib/export/pdf");
export const excelModule = () => import("$lib/export/excel");
const wordModule = () => import("$lib/export/word");

const PDF_KINDS = {
  "pdf-full": "full",
  "pdf-checklists": "checklists",
  "pdf-blank": "blank",
} as const;

export const isPdfKind = (kind: ExportKind) => kind in PDF_KINDS;

/** Produces one export; resolves true when a file was actually saved. */
export async function runExport(kind: ExportKind, a: Assessment): Promise<boolean> {
  if (kind === "json")
    return downloadBlob(new Blob([serialize(a)], { type: "application/json" }), fileName(a));
  if (kind === "xlsx") return (await excelModule()).downloadExcel(a);
  if (kind === "docx") return (await wordModule()).downloadWord(a);
  if (kind === "template") return (await excelModule()).downloadImportTemplate();
  return (await pdfModule()).downloadPdf(a, PDF_KINDS[kind]);
}
