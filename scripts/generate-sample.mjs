#!/usr/bin/env node
// Writes public/samples/riskprime-ornek-veri.xlsx: a realistic sample for the Excel import
// (two new checklists, a new workshop, a new room in another building, extra rows for an
// existing location). Usage: pnpm generate:sample
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "samples", "riskprime-ornek-veri.xlsx");

// Same layout as src/lib/domain/school-sheet.ts schoolSheet().
const schoolRows = [
  ["Bilgi", "Değer"],
  ["Okul", "Atatürk Mesleki ve Teknik Anadolu Lisesi"],
  ["Kapsam", "Elektrik-Elektronik Teknolojisi Alanı"],
  ["Dönem", "2026-2027"],
  ["Değerlendirme Tarihi", "15.09.2026"],
  ["Geçerlilik Tarihi", "15.09.2030"],
  ["Gruplama", "Binaya göre"],
  [],
  ["İmzacı Unvanı", "Ad Soyad"],
  ["İş Güvenliği Uzmanı", ""],
  ["Çalışan Temsilcisi", ""],
  ["Destek Elemanı", ""],
  ["Alan Şefi", ""],
  ["İşveren / Okul Müdürü", ""],
];

const checklistHeader = ["Liste Kodu", "Liste Adı", "Madde No", "Madde"];
const checklistRows = [
  ["OK-01", "Atölye kapanış kontrolü", "1", "Ana şalter ve tezgâh sigortaları kapatıldı mı?"],
  ["OK-01", "", "2", "Havya ve sıcak hava istasyonlarının fişleri çekildi mi?"],
  ["OK-01", "", "3", "Ölçü aletleri ve problar dolaba kaldırıldı mı?"],
  ["OK-01", "", "4", "Pencereler kapatıldı, atölye kilitlendi mi?"],
  ["OK-02", "Lehim istasyonu kontrolü", "1", "Duman emici çalışıyor ve filtresi değiştirilmiş mi?"],
  ["OK-02", "", "2", "Havya sehpaları sağlam ve masaya sabit mi?"],
  ["OK-02", "", "3", "Kurşunsuz lehim kullanılıyor, kurşunlu lehim kaldırıldı mı?"],
  ["OK-02", "", "4", "Lehim sonrası el yıkama için lavabo ve sabun var mı?"],
];

const riskHeader = [
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
];
const area = "Elektrik-Elektronik Teknolojisi";
const riskRows = [
  [
    "ELE16 · Yenilenebilir Enerji",
    "Atölye",
    "C Blok",
    area,
    "Güneş paneli ve inverter seti",
    "Panel çıkışında DC gerilim: ışık altında kesilemeyen enerji, ark ve çarpma",
    "Öğrenci, öğretmen",
    "Uyarı etiketi",
    "Montaj ve ölçüm panel örtülüyken yapılır; DC ayırıcı ve sigorta; yalıtkan eldiven",
    "Atölye öğretmeni",
    3,
    4,
  ],
  [
    "ELE16 · Yenilenebilir Enerji",
    "Atölye",
    "C Blok",
    area,
    "Akü grubu (jel / lityum)",
    "Kısa devrede yüksek akım, yanık; lityum hücrede ısıl kaçak ve yangın",
    "Öğrenci",
    "Yok",
    "Kutup başları kapaklı; yalıtımlı anahtar; şarj gözetimli; yanında D sınıfı söndürücü ve kum",
    "Atölye öğretmeni",
    2,
    5,
  ],
  [
    "ELE16 · Yenilenebilir Enerji",
    "Atölye",
    "C Blok",
    area,
    "Çatı / yükseltilmiş panel montajı",
    "Merdiven veya platformdan düşme",
    "Öğretmen",
    "Seyyar merdiven",
    "Öğrenci çatıya çıkmaz; montaj yer seviyesinde eğitim sehpasında yapılır",
    "Okul müdürü",
    "",
    "",
  ],
  [
    "Lehim ve onarım odası",
    "Atölye",
    "D Blok",
    area,
    "Havya ve sıcak hava istasyonu",
    "Yanık; lehim dumanı solunması",
    "Öğrenci",
    "Pencere havalandırması",
    "Masa başı duman emici; havya sehpası; yanık için ilk yardım",
    "Atölye öğretmeni",
    4,
    2,
  ],
  [
    "Lehim ve onarım odası",
    "Atölye",
    "D Blok",
    area,
    "Kimyasal (flux, izopropil alkol)",
    "Göz ve cilt teması; yanıcı buhar",
    "Öğrenci",
    "Yok",
    "Küçük kapaklı şişede, kilitli dolapta; güvenlik bilgi formu asılı; gözlük",
    "Atölye öğretmeni",
    3,
    3,
  ],
  [
    "ELE9 · Bilgisayar Laboratuvarı",
    "Atölye",
    "",
    area,
    "Projeksiyon ve akıllı tahta kabloları",
    "Zeminden geçen kabloya takılıp düşme",
    "Öğrenci, öğretmen",
    "",
    "Kablolar kanal içinden duvar boyunca; geçişte kablo köprüsü",
    "Okul müdürü",
    3,
    2,
  ],
];

const book = XLSX.utils.book_new();
const sheets = [
  ["Okul Bilgileri", schoolRows],
  ["Kontrol Listesi", [checklistHeader, ...checklistRows]],
  ["Risk Satırları", [riskHeader, ...riskRows]],
];
for (const [name, rows] of sheets) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = rows[0].map((_, i) => ({
    wch: Math.min(60, Math.max(...rows.map((r) => String(r[i] ?? "").length), 8) + 2),
  }));
  XLSX.utils.book_append_sheet(book, sheet, name);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
console.log(`${out}: ${checklistRows.length} checklist items, ${riskRows.length} risk rows`);
