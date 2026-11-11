#!/usr/bin/env node
// Generates src/lib/data/starter.json from the Planlar/RISK-ANALIZ Typst data.
// Usage: node scripts/generate-starter.mjs <RISK-ANALIZ folder>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AREA = "Elektrik-Elektronik Teknolojisi";
const PERIOD = "2026-2027";
const SIGNATORY_KEYS = [
  "isGuvenligiUzmani",
  "calisanTemsilcisi",
  "destekElemani",
  "alanSefi",
  "okulMuduru",
];

function readTypstData(folder) {
  const tmp = path.join(folder, ".riskprime-generate.typ");
  fs.writeFileSync(
    tmp,
    '#import "atolye-verisi.typ": labs, gruplar\n#metadata((labs: labs, gruplar: gruplar)) <data>\n',
  );
  try {
    const out = execFileSync(
      "typst",
      ["eval", "query(<data>).first().value", "--in", tmp, "--root", folder, "--format", "json"],
      { encoding: "utf8" },
    );
    return JSON.parse(out);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** Location type from its Turkish name. */
export function detectType(name) {
  const lower = name.toLocaleLowerCase("tr");
  if (lower.startsWith("tüm")) return "common";
  if (lower.includes("depo")) return "storage";
  if (lower.includes("tuvalet")) return "wet";
  if (lower.includes(" odas") || lower.includes(" odala")) return "office";
  return "workshop";
}

const lower = (s) => s.toLocaleLowerCase("tr");
const codeOf = (name) => name.match(/^\s*(ELE\d+)\b/i)?.[1].toUpperCase();

/** JS copy of suggestLocations() in src/lib/domain/auto-assign.ts (a test guards drift). */
function suggestIds(locations, listName) {
  const name = lower(listName);
  if (name.startsWith("ortak")) return [];
  const codes = new Set((listName.match(/\bELE\d+\b/gi) ?? []).map((c) => c.toUpperCase()));
  const pick = (f) => locations.filter(f).map((l) => l.id);
  const byCode = pick((l) => codes.has(codeOf(l.name) ?? ""));
  if (byCode.length) return byCode;
  const byName = pick((l) => lower(l.name) === name);
  if (byName.length) return byName;
  if (name.includes("depo")) return pick((l) => l.type === "storage");
  if (/odalar|odası/.test(name)) return pick((l) => l.type === "office");
  return [];
}

const LIBRARY_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "data",
  "library.json",
);
const MEB_REF = /KL-(\d+)\.(\d+)/;
const EMPTY_INDEX = { byText: new Map(), keys: new Set() };

/** MEB item keys and text -> key, from library.json (generate the library first). */
export function mebIndex(library) {
  const items = library.checklists.filter((c) => c.source === "external").flatMap((c) => c.items);
  return {
    keys: new Set(items.map((i) => i.ref)),
    byText: new Map(items.map((i) => [i.text, i.ref])),
  };
}

/** Bank key for a school item: the first "(KL-xx.yy)" in its text, else an exact MEB text match. */
export function refOf(text, index) {
  const m = text.match(MEB_REF);
  const key = m && `KL-${m[1].padStart(2, "0")}.${m[2].padStart(2, "0")}`;
  return key && index.keys.has(key) ? key : index.byText.get(text);
}

const two = (n) => String(n).padStart(2, "0");

export function convert(data, school, index = EMPTY_INDEX) {
  const locations = data.labs.map(([name, rows], i) => ({
    id: `a-${two(i + 1)}`,
    name,
    type: detectType(name),
    building: "",
    area: AREA,
    // Typst tuple: (equipment, hazard, affected, existing, L, S, action, responsible, L2, S2); scores are filled by the team.
    rows: rows.map(
      ([equipment, hazard, affected, existingControls, , , action, responsible], j) => ({
        id: `r-${two(i + 1)}-${two(j + 1)}`,
        equipment,
        hazard,
        affected,
        existingControls,
        likelihood: null,
        severity: null,
        action,
        responsible,
        dueDate: "",
        status: "open",
        likelihoodAfter: null,
        severityAfter: null,
      }),
    ),
  }));
  const checklists = data.gruplar.map(([name, items], i) => ({
    id: `k-${two(i + 1)}`,
    code: "",
    name,
    source: "internal",
    ...(suggestIds(locations, name).length ? { locationIds: suggestIds(locations, name) } : {}),
    items: items.map((text, j) => {
      const ref = refOf(text, index);
      return {
        id: `m-${two(i + 1)}-${two(j + 1)}`,
        no: String(j + 1),
        text,
        answer: "",
        note: "",
        ...(ref ? { ref } : {}),
      };
    }),
  }));
  return {
    version: 1,
    period: PERIOD,
    assessmentDate: "",
    validUntil: "",
    school: {
      name: school["okul"],
      scope: school.alan,
      grouping: "area",
      signatories: SIGNATORY_KEYS.map((k) => ({ title: school[k].unvan, name: school[k].ad })),
    },
    locations,
    checklists,
  };
}

function main() {
  const source = process.argv[2];
  if (!source) {
    console.error("Kullanım: node scripts/generate-starter.mjs <RISK-ANALIZ klasörü>");
    process.exit(1);
  }
  const school = JSON.parse(fs.readFileSync(path.join(source, "okul.json"), "utf8"));
  const library = JSON.parse(fs.readFileSync(LIBRARY_PATH, "utf8"));
  const result = convert(readTypstData(source), school, mebIndex(library));
  const target = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "lib",
    "data",
    "starter.json",
  );
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(result, null, 2) + "\n");
  const rowCount = result.locations.reduce((t, l) => t + l.rows.length, 0);
  console.log(
    `${target}: ${result.locations.length} locations, ${rowCount} rows, ${result.checklists.length} checklists`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
