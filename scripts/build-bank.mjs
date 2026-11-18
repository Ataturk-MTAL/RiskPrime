#!/usr/bin/env node
// Compiles content/questions/*.toml into src/lib/data/questions.json, syncs the text of external
// items in library.json and compiles content/locations/*.toml into src/lib/data/locations.json.
// Usage: node scripts/build-bank.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";
import {
  LOCATION_TYPES,
  buildLocations,
  parseLocationFiles,
  validateLocations,
} from "./location-templates.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS_DIR = path.join(ROOT, "content", "questions");
const CHANGELOG = path.join(ROOT, "content", "CHANGELOG.md");
const BANK_JSON = path.join(ROOT, "src", "lib", "data", "questions.json");
const LIBRARY_JSON = path.join(ROOT, "src", "lib", "data", "library.json");
const LOCATIONS_DIR = path.join(ROOT, "content", "locations");
const LOCATIONS_JSON = path.join(ROOT, "src", "lib", "data", "locations.json");
const KEY_PATTERNS = { meb: /^KL-\d{2}\.\d{2}$/, riskprime: /^[A-Z]{2,}-\d{2,}$/ };
const BANK_FILE = "bank.toml";
const COMMON_FILE = "common.toml";
const COMMON_ID = /^OM-\d{2,}$/;

/** Source implied by file name: meb.toml => "meb", riskprime-*.toml => "riskprime"; else null. */
export function sourceOf(file) {
  if (file === "meb.toml") return "meb";
  return /^riskprime-.+\.toml$/.test(file) ? "riskprime" : null;
}

/** files: [{ name, content }] -> { version, questions: [{ file, source, ...raw }], problems } */
export function parseSources(files) {
  const problems = [];
  const questions = [];
  let common = [];
  let version;
  for (const { name, content } of files) {
    let doc;
    try {
      doc = parse(content);
    } catch (e) {
      problems.push(`${name}: TOML okunamadı: ${e.message}`);
      continue;
    }
    if (name === BANK_FILE) {
      version = doc.bank?.version;
      continue;
    }
    if (name === COMMON_FILE) {
      common = doc.common ?? [];
      continue;
    }
    const source = sourceOf(name);
    if (!source) {
      problems.push(`${name}: dosya adı meb.toml veya riskprime-*.toml olmalı`);
      continue;
    }
    questions.push(...(doc.question ?? []).map((q) => ({ ...q, file: name, source })));
  }
  return { version, questions, common, problems };
}

function questionProblems(q, where) {
  const out = [];
  const pattern = KEY_PATTERNS[q.source];
  if (typeof q.key !== "string" || !pattern.test(q.key)) {
    out.push(`${where}: anahtar ${pattern} desenine uymuyor`);
  }
  if (typeof q.text !== "string" || q.text.trim() === "" || q.text !== q.text.trim()) {
    out.push(`${where}: metin boş veya baş/sonunda boşluk var`);
  }
  if (!Array.isArray(q.tags) || q.tags.some((t) => !LOCATION_TYPES.includes(t))) {
    out.push(`${where}: etiketler şunlardan olmalı: ${LOCATION_TYPES.join(", ")}`);
  }
  if (q.source === "meb" && typeof q.key === "string" && q.list !== q.key.split(".")[0]) {
    out.push(`${where}: list (${q.list}) anahtarın önekiyle eşleşmiyor`);
  }
  return out;
}

/** Returns every problem found; empty array means valid. */
export function validate({ version, questions, common = [], problems }, changelog) {
  const out = [...problems];
  if (typeof version !== "string" || version === "") {
    out.push(`${BANK_FILE}: [bank] version eksik`);
  } else if (!new RegExp(`^## ${version.replace(/\./g, "\\.")}\\s*$`, "m").test(changelog)) {
    out.push(`CHANGELOG.md: "## ${version}" başlığı yok`);
  }
  const seen = new Set();
  for (const q of questions) {
    out.push(...questionProblems(q, `${q.file} ${q.key}`));
    if (seen.has(q.key)) out.push(`${q.file} ${q.key}: yinelenen anahtar`);
    seen.add(q.key);
  }
  out.push(...commonProblems(common, questions));
  return out;
}

function commonProblems(common, questions) {
  const out = [];
  const byQuestionKey = new Map(questions.map((q) => [q.key, q]));
  const ids = new Set();
  const owner = new Map();
  for (const g of common) {
    const where = `${COMMON_FILE} ${g.id}`;
    if (typeof g.id !== "string" || !COMMON_ID.test(g.id)) {
      out.push(`${where}: kimlik ${COMMON_ID} desenine uymuyor`);
    }
    if (ids.has(g.id)) out.push(`${where}: yinelenen kimlik`);
    ids.add(g.id);
    if (typeof g.title !== "string" || g.title.trim() === "") out.push(`${where}: başlık boş`);
    const keys = Array.isArray(g.keys) ? g.keys : [];
    if (keys.length < 2) out.push(`${where}: en az 2 anahtar gerekli`);
    const lists = new Set();
    for (const k of keys) {
      const q = byQuestionKey.get(k);
      if (!q) out.push(`${where}: ${k} bankada yok`);
      else if (lists.has(q.list)) out.push(`${where}: ${k} aynı listeden (${q.list}) ikinci madde`);
      else lists.add(q.list);
      if (owner.has(k)) out.push(`${where}: ${k} zaten ${owner.get(k)} grubunda`);
      else owner.set(k, g.id);
    }
  }
  return out;
}

const byKey = (a, b) => a.key.localeCompare(b.key, "en", { numeric: true });

/** { version, items, common }: MEB items sorted by key, then riskprime items in file order. */
export function buildBank({ version, questions, common = [] }) {
  const groupOf = new Map(common.flatMap((g) => g.keys.map((k) => [k, g.id])));
  const withCommon = (item) =>
    groupOf.has(item.key) ? { ...item, common: groupOf.get(item.key) } : item;
  const meb = questions
    .filter((q) => q.source === "meb")
    .map((q) => ({ key: q.key, text: q.text, source: "meb", listCode: q.list, tags: q.tags }))
    .sort(byKey);
  const own = questions
    .filter((q) => q.source === "riskprime")
    .map((q) => ({
      key: q.key,
      text: q.text,
      source: "riskprime",
      tags: q.tags,
      ...(q.basis ? { basis: q.basis } : {}),
    }));
  return {
    version,
    items: [...meb, ...own].map(withCommon),
    common: common.map(({ id, title, keys }) => ({ id, title, keys })),
  };
}

/** Copy of the library with external item texts taken from the bank (by ref). */
export function syncLibrary(library, bank) {
  const texts = new Map(bank.items.map((i) => [i.key, i.text]));
  return {
    ...library,
    checklists: library.checklists.map((l) =>
      l.source !== "external"
        ? l
        : { ...l, items: l.items.map((i) => ({ ...i, text: texts.get(i.ref) ?? i.text })) },
    ),
  };
}

const toJson = (v) => JSON.stringify(v, null, 2) + "\n";

function readSources(dir) {
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".toml"))
    .sort()
    .map((name) => ({ name, content: fs.readFileSync(path.join(dir, name), "utf8") }));
}

function fail(what, problems) {
  console.error(`${what} geçersiz:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}

function main() {
  const check = process.argv.includes("--check");
  const parsed = parseSources(readSources(QUESTIONS_DIR));
  const problems = validate(parsed, fs.readFileSync(CHANGELOG, "utf8"));
  if (problems.length) fail("Kontrol listeleri kaynağı", problems);
  const bank = buildBank(parsed);
  const library = syncLibrary(JSON.parse(fs.readFileSync(LIBRARY_JSON, "utf8")), bank);
  const locationSources = parseLocationFiles(readSources(LOCATIONS_DIR));
  const locationProblems = validateLocations(locationSources, {
    mebCodes: new Set(library.checklists.filter((c) => c.source === "external").map((c) => c.code)),
    takenNames: new Set(library.locations.map((l) => l.name)),
  });
  if (locationProblems.length) fail("Mekân şablonları", locationProblems);
  const outputs = [
    [BANK_JSON, toJson(bank)],
    [LIBRARY_JSON, toJson(library)],
    [LOCATIONS_JSON, toJson(buildLocations(locationSources))],
  ];
  // Compare content, not bytes: the formatter may re-wrap the committed JSON.
  const same = (file, text) =>
    fs.existsSync(file) &&
    JSON.stringify(JSON.parse(fs.readFileSync(file, "utf8"))) === JSON.stringify(JSON.parse(text));
  const stale = outputs.filter(([file, text]) => !same(file, text));
  if (check) {
    if (stale.length) {
      const names = stale.map(([file]) => path.basename(file)).join(", ");
      console.error(`${names} güncel değil: pnpm bank:build çalıştırın`);
      process.exit(1);
    }
    return;
  }
  stale.forEach(([file, text]) => fs.writeFileSync(file, text));
  console.log(
    `${bank.items.length} soru, sürüm ${bank.version}; ${locationSources.areas.length} alan şablonu`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
