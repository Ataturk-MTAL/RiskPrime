#!/usr/bin/env node
// Writes public/samples/riskprime-meb-kl-sablonu.xlsx: an import template that carries no
// school data. Sheets: empty "Okul Bilgileri" (labels and default signatory titles only),
// "Kontrol Listesi" filled with the MEB KL-01–KL-43 series (published openly by MEB, text
// verbatim from src/lib/data/library.json) and an empty "Risk Satırları" (header only).
// Usage: pnpm generate:sample (after generate:library)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "samples", "riskprime-meb-kl-sablonu.xlsx");
const library = JSON.parse(readFileSync(join(root, "src", "lib", "data", "library.json"), "utf8"));

// Same labels as src/lib/domain/school-sheet.ts; values left empty on purpose.
const schoolRows = [
  ["Bilgi", "Değer"],
  ["Okul", ""],
  ["Kapsam", ""],
  ["Dönem", ""],
  ["Değerlendirme Tarihi", ""],
  ["Geçerlilik Tarihi", ""],
  ["Gruplama", ""],
  [],
  ["İmzacı Unvanı", "Ad Soyad"],
  ["İş Güvenliği Uzmanı", ""],
  ["Çalışan Temsilcisi", ""],
  ["Destek Elemanı", ""],
  ["İşveren / Okul Müdürü", ""],
];

const mebLists = library.checklists.filter((l) => l.source === "external");
const checklistRows = [
  ["Liste Kodu", "Liste Adı", "Madde No", "Madde"],
  ...mebLists.flatMap((l) =>
    l.items.map((item, i) => [l.code, i === 0 ? l.name : "", item.no, item.text]),
  ),
];

const riskRows = [
  [
    "Mekân",
    "Mekân Türü",
    "Bina",
    "Alan",
    "Alet / Ekipman Grubu",
    "Tehlike ve Risk",
    "Etkilenen",
    "Mevcut Önlem",
    "Düzeltici Önlem",
    "Sorumlu",
    "O",
    "Ş",
  ],
];

const widths = {
  "Okul Bilgileri": [24, 50],
  "Kontrol Listesi": [11, 60, 10, 90],
  "Risk Satırları": [24, 14, 12, 24, 28, 40, 18, 28, 40, 20, 5, 5],
};
const book = XLSX.utils.book_new();
for (const [name, rows] of [
  ["Okul Bilgileri", schoolRows],
  ["Kontrol Listesi", checklistRows],
  ["Risk Satırları", riskRows],
]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = widths[name].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(book, sheet, name);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
console.log(`${out}: ${mebLists.length} MEB lists, ${checklistRows.length - 1} items`);
