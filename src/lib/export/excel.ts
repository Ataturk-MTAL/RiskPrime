// Excel export, import template and workbook reading (SheetJS).
import * as XLSX from "xlsx";
import { template } from "../domain/excel-import";
import { checklistRows, outputName, riskRows } from "../domain/export-data";
import type { Assessment } from "../domain/types";
import { CHECKLIST_COLUMNS, RISK_COLUMNS, toTable } from "./columns";

const TEMPLATE_FILE = "riskprime-ice-alma-sablonu.xlsx";

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

export function downloadExcel(a: Assessment): void {
  const book = XLSX.utils.book_new();
  const risks = XLSX.utils.aoa_to_sheet(toTable(riskRows(a), RISK_COLUMNS));
  const checklists = XLSX.utils.aoa_to_sheet(toTable(checklistRows(a), CHECKLIST_COLUMNS));
  XLSX.utils.book_append_sheet(book, risks, "Risk Tablosu");
  XLSX.utils.book_append_sheet(book, checklists, "Kontrol Listeleri");
  XLSX.writeFile(book, outputName(a, "xlsx"));
}
