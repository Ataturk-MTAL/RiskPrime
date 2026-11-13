import type { Assessment } from "$lib/domain/types";
import { isBackup, restoreBackup } from "$lib/domain/excel-backup";
import { conflictingCodes, read as readExcel } from "$lib/domain/excel-import";
import { errorList, type ConflictChoice } from "$lib/store-support";
import { excelModule } from "$lib/export-jobs";

/** What the store should do with an opened Excel file. */
export type ExcelOutcome =
  | { kind: "errors"; errors: string[] }
  | { kind: "nothing" }
  | { kind: "info"; message: string }
  | { kind: "restore"; assessment: Assessment; message: string }
  | { kind: "merge"; assessment: Assessment; message: string };

type Sheets = Record<string, unknown[][]>;

function restore(name: string, sheets: Sheets): ExcelOutcome {
  const result = restoreBackup(sheets);
  if ("errors" in result)
    return { kind: "errors", errors: errorList(`"${name}" geri yüklenemedi:`, result.errors) };
  return {
    kind: "restore",
    assessment: result.assessment,
    message: `Kayıt dosyası geri yüklendi: ${name}`,
  };
}

/** Reads an Excel file as a backup (replace) or an import (merge); never touches the store. */
export async function openExcel(
  file: File,
  current: Assessment,
  askConflict: (codes: string[]) => Promise<ConflictChoice>,
): Promise<ExcelOutcome> {
  let sheets: Sheets;
  try {
    sheets = await (await excelModule()).readWorkbook(file);
  } catch (error) {
    return {
      kind: "errors",
      errors: [`"${file.name}" okunamadı: ${error instanceof Error ? error.message : ""}`],
    };
  }
  if (isBackup(sheets)) return restore(file.name, sheets);
  const codes = conflictingCodes(current, sheets);
  const choice = codes.length ? await askConflict(codes) : "append";
  if (!choice) return { kind: "nothing" };
  const result = readExcel(current, sheets, { sameCode: choice });
  if ("errors" in result)
    return {
      kind: "errors",
      errors: errorList(`"${file.name}" içe alınamadı, hiçbir şey eklenmedi:`, result.errors),
    };
  const s = result.summary;
  const skipped = (s as { skippedRows?: number }).skippedRows ?? 0;
  if (!s.school && !s.lists && !s.rows && !s.locations)
    return { kind: "info", message: "Dosyada içe alınacak veri yok." };
  return {
    kind: "merge",
    assessment: result.assessment,
    message: `İçe alındı: ${s.school ? "okul ve imzacı bilgileri, " : ""}${s.lists} kontrol listesi (${s.items} madde), ${s.rows} risk satırı, ${s.locations} yeni mekân.${skipped > 0 ? ` ${skipped} satır zaten vardı, atlandı.` : ""}`,
  };
}
