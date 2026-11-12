#!/usr/bin/env node
// Compiles content/questions/*.toml into src/lib/data/questions.json and syncs the text of
// external items in library.json. Usage: node scripts/build-bank.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS_DIR = path.join(ROOT, "content", "questions");
const CHANGELOG = path.join(ROOT, "content", "CHANGELOG.md");
const BANK_JSON = path.join(ROOT, "src", "lib", "data", "questions.json");
const LIBRARY_JSON = path.join(ROOT, "src", "lib", "data", "library.json");

// Keep in sync with LocationType in src/lib/domain/types.ts.
const LOCATION_TYPES = ["workshop", "storage", "office", "wet", "common"];
const KEY_PATTERNS = { meb: /^KL-\d{2}\.\d{2}$/, riskprime: /^[A-Z]{2,}-\d{2,}$/ };
const BANK_FILE = "bank.toml";

/** Source implied by file name: meb.toml => "meb", riskprime-*.toml => "riskprime"; else null. */
export function sourceOf(file) {
  if (file === "meb.toml") return "meb";
  return /^riskprime-.+\.toml$/.test(file) ? "riskprime" : null;
}

/** files: [{ name, content }] -> { version, questions: [{ file, source, ...raw }], problems } */
export function parseSources(files) {
  const problems = [];
  const questions = [];
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
    const source = sourceOf(name);
    if (!source) {
      problems.push(`${name}: dosya adı meb.toml veya riskprime-*.toml olmalı`);
      continue;
    }
    questions.push(...(doc.question ?? []).map((q) => ({ ...q, file: name, source })));
  }
  return { version, questions, problems };
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
export function validate({ version, questions, problems }, changelog) {
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
  return out;
}

const byKey = (a, b) => a.key.localeCompare(b.key, "en", { numeric: true });

/** { version, items }: MEB items sorted by key, then riskprime items in file order. */
export function buildBank({ version, questions }) {
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
  return { version, items: [...meb, ...own] };
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

function readSources() {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((n) => n.endsWith(".toml"))
    .sort()
    .map((name) => ({ name, content: fs.readFileSync(path.join(QUESTIONS_DIR, name), "utf8") }));
}

function main() {
  const check = process.argv.includes("--check");
  const parsed = parseSources(readSources());
  const problems = validate(parsed, fs.readFileSync(CHANGELOG, "utf8"));
  if (problems.length) {
    console.error(
      `Kontrol listeleri kaynağı geçersiz:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    process.exit(1);
  }
  const bank = buildBank(parsed);
  const library = syncLibrary(JSON.parse(fs.readFileSync(LIBRARY_JSON, "utf8")), bank);
  const outputs = [
    [BANK_JSON, toJson(bank)],
    [LIBRARY_JSON, toJson(library)],
  ];
  // Compare content, not bytes: the formatter may re-wrap the committed JSON.
  const same = (file, text) =>
    JSON.stringify(JSON.parse(fs.readFileSync(file, "utf8"))) === JSON.stringify(JSON.parse(text));
  const stale = outputs.filter(([file, text]) => !same(file, text));
  if (check) {
    if (stale.length) {
      console.error("questions.json güncel değil: pnpm bank:build çalıştırın");
      process.exit(1);
    }
    return;
  }
  stale.forEach(([file, text]) => fs.writeFileSync(file, text));
  console.log(`${bank.items.length} soru, sürüm ${bank.version}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
