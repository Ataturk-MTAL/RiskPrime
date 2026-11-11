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

const two = (n) => String(n).padStart(2, "0");

export function convert(data, school) {
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
    items: items.map((text, j) => ({
      id: `m-${two(i + 1)}-${two(j + 1)}`,
      no: String(j + 1),
      text,
      answer: "",
      note: "",
    })),
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
  const result = convert(readTypstData(source), school);
  const target = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "lib",
    "data",
    "starter.json",
  );
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(result, null, 1) + "\n");
  const rowCount = result.locations.reduce((t, l) => t + l.rows.length, 0);
  console.log(
    `${target}: ${result.locations.length} locations, ${rowCount} rows, ${result.checklists.length} checklists`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
