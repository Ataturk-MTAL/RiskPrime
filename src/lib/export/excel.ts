// Excel export (full backup), import template and workbook reading (SheetJS).
import * as XLSX from "xlsx";
import { backupSheets } from "../domain/excel-backup";
import { template } from "../domain/excel-import";
import { outputName } from "../domain/export-data";
import type { Assessment } from "../domain/types";

const TEMPLATE_FILE = "riskprime-ice-alma-sablonu.xlsx";
const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 60;

/** Reads a workbook as {sheetName: array of arrays} (input of excel-import read()). */
export async function readWorkbook(file: File): Promise<Record<string, unknown[][]>> {
  const book = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
  return Object.fromEntries(
    book.SheetNames.map((name) => [
      name,
      XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[name], { header: 1, defval: "", raw: true }),
    ]),
  );
}

export function downloadImportTemplate(): void {
  const book = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(template())) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = rows[0].map((h) => ({ wch: Math.max(10, String(h).length + 4) }));
    XLSX.utils.book_append_sheet(book, sheet, name);
  }
  XLSX.writeFile(book, TEMPLATE_FILE);
}

/** Column widths from the longest cell of each column, within sane limits. */
function columnWidths(rows: (string | number)[][]): { wch: number }[] {
  const columnCount = Math.max(...rows.map((r) => r.length));
  return Array.from({ length: columnCount }, (_, i) => {
    const longest = Math.max(...rows.map((r) => String(r[i] ?? "").length));
    return { wch: Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, longest + 2)) };
  });
}

/** Full backup workbook: "Dosya aç" restores it (see domain/excel-backup). */
export function downloadExcel(a: Assessment): void {
  const book = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(backupSheets(a))) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = columnWidths(rows);
    XLSX.utils.book_append_sheet(book, sheet, name);
  }
  XLSX.writeFile(book, outputName(a, "xlsx"));
}
