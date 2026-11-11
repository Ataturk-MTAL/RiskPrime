// Column definitions shared by the Excel and Word exports (Turkish headers).
import type { ExportChecklistRow, ExportRiskRow } from "../domain/export-data";

export type Column<T> = readonly [key: keyof T, header: string];

export const RISK_COLUMNS: Column<ExportRiskRow>[] = [
  ["location", "Mekân"],
  ["building", "Bina"],
  ["area", "Alan"],
  ["no", "No"],
  ["equipment", "Alet / ekipman grubu"],
  ["hazard", "Tehlike ve risk"],
  ["affected", "Etkilenen"],
  ["existingControls", "Mevcut önlem"],
  ["likelihood", "O"],
  ["severity", "Ş"],
  ["score", "Skor"],
  ["level", "Düzey"],
  ["action", "Düzeltici / önleyici faaliyet"],
  ["responsible", "Sorumlu"],
  ["dueDate", "Bitiş tarihi"],
  ["status", "Durum"],
  ["likelihoodAfter", "O (sonra)"],
  ["severityAfter", "Ş (sonra)"],
  ["scoreAfter", "Skor (sonra)"],
  ["levelAfter", "Düzey (sonra)"],
];

export const CHECKLIST_COLUMNS: Column<ExportChecklistRow>[] = [
  ["code", "Liste kodu"],
  ["name", "Liste adı"],
  ["no", "Madde no"],
  ["text", "Madde"],
  ["answer", "Cevap"],
  ["note", "Açıklama"],
];

/** Header row followed by one array per data row. */
export function toTable<T>(rows: T[], columns: readonly Column<T>[]): (string | number)[][] {
  return [
    columns.map(([, header]) => header),
    ...rows.map((r) => columns.map(([key]) => r[key] as string | number)),
  ];
}
