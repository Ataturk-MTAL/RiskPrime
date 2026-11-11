#!/usr/bin/env node
// Generates src/lib/data/library.json:
//  - MEB Risk Değerlendirme Kontrol Listeleri (KL-01..KL-43) parsed verbatim from the PDF text (source 'external').
//  - Elektrik-Elektronik ready checklists and locations (from src/lib/data/starter.json).
// Usage: node scripts/generate-library.mjs <MEB-Risk-Degerlendirme-Kontrol-Listeleri-KL01-KL43.pdf>  (needs pdftotext)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ITEM = /^\s{0,3}(\d{1,2})[.,](\d{1,2})\s+(\S.*)$/;
const CONTINUATION = /^\s{4,}[^\s*]/;
const TITLE_NOISE = /^(Tarih|Kontrol|Listesi|GEREKLİ|DEĞİL|KL\s*-?\s*\d+|\.)/;
const PAGE_START = "RİSK DEĞERLENDİRME KONTROL LİSTELERİ";
const OHS = "İŞ SAĞLIĞI VE GÜVENLİĞİ";

const here = path.dirname(fileURLToPath(import.meta.url));
const STARTER_PATH = path.join(here, "..", "src", "lib", "data", "starter.json");
const LIBRARY_PATH = path.join(here, "..", "src", "lib", "data", "library.json");

// Drop the right-hand Date/YES/NO columns: first chunk before 3+ spaces.
const leftPart = (line) => line.trim().split(/\s{3,}/)[0];
const itemNo = (a, b) => `${Number(a)}.${b.padEnd(2, "0")}`;

/** Turns pdftotext -layout output into [{code, name, items[{no, text}]}]. */
export function parseKlText(text) {
  const lists = new Map();
  let title = null; // line array while a title is being collected
  let pendingTitle = null;
  let inItems = false;
  let stopped = false; // after NOT/ÖNERİLER, until the next S.NO
  let last = null;

  for (const line of text.split("\n")) {
    const plain = line.trim();
    if (plain.startsWith(PAGE_START)) {
      inItems = !stopped;
      continue;
    }
    if (plain.includes(OHS)) {
      title = [];
      inItems = false;
      const rest = leftPart(plain.slice(plain.indexOf(OHS) + OHS.length));
      if (rest && !TITLE_NOISE.test(rest)) title.push(rest);
      continue;
    }
    if (plain.startsWith("S.NO")) {
      if (title) {
        pendingTitle = title
          .join(" ")
          .replace(/\s*K[Ll]\s*[–-]\s*\d+\s*/g, " ") // "KL – 03" leaking into the title
          .replace(/\.{3,}/g, "…")
          .replace(/\s+/g, " ")
          .trim();
      }
      title = null;
      inItems = true;
      stopped = false;
      continue;
    }
    if (title) {
      const part = leftPart(line);
      if (part && !TITLE_NOISE.test(part)) title.push(part);
      continue;
    }
    if (/^(NOT:|ÖNERİLER)/.test(plain)) {
      stopped = true;
      inItems = false;
      last = null;
      continue;
    }
    if (/İş Güvenliği Uzmanı|^İmza/.test(plain)) {
      inItems = false;
      last = null;
      continue;
    }
    if (!inItems) continue;
    const m = line.match(ITEM);
    if (m) {
      const code = `KL-${m[1].padStart(2, "0")}`;
      if (!lists.has(code)) lists.set(code, { code, name: pendingTitle || code, items: [] });
      pendingTitle = null;
      last = { no: itemNo(m[1], m[2]), text: leftPart(m[3]) };
      lists.get(code).items.push(last);
    } else if (last && CONTINUATION.test(line)) {
      last.text = `${last.text} ${leftPart(line)}`;
    }
  }
  return [...lists.values()];
}

export function buildLibrary(klText, starter) {
  const meb = parseKlText(klText).map((l) => ({
    ...l,
    source: "external",
    group: "MEB Kontrol Listeleri",
  }));
  const internal = starter.checklists.map(({ code, name, source, items }) => ({
    code,
    name,
    source,
    group: "Elektrik-Elektronik hazır form",
    items: items.map(({ no, text }) => ({ no, text })),
  }));
  const locations = starter.locations.map(({ name, type, building, area, rows }) => ({
    name,
    type,
    building,
    area,
    rows: rows.map(({ id, ...row }) => row),
  }));
  return { checklists: [...internal, ...meb], locations };
}

function main() {
  const pdf = process.argv[2];
  if (!pdf) {
    console.error("Kullanım: node scripts/generate-library.mjs <KL01-KL43 PDF>");
    process.exit(1);
  }
  const text = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" });
  const starter = JSON.parse(fs.readFileSync(STARTER_PATH, "utf8"));
  const lib = buildLibrary(text, starter);
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(lib, null, 1) + "\n");
  const meb = lib.checklists.filter((l) => l.source === "external");
  console.log(
    `${lib.locations.length} locations, ${lib.checklists.length - meb.length} internal lists, ${meb.length} MEB lists (${meb.reduce((t, l) => t + l.items.length, 0)} items)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
