#!/usr/bin/env node
// Generates src/lib/data/questions.json: every MEB checklist item as a question bank entry
// (key "KL-<list>.<no>", text verbatim). Run after generate-library. Usage: node scripts/generate-questions.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Bump when the bank's content changes; periods record it as meta.bankVersion.
export const BANK_VERSION = "2026.1";

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "data");

// Conservative: only lists that clearly belong to one kind of location.
const LIST_TAGS = {
  "KL-11": ["wet"],
  "KL-19": ["office"],
  "KL-35": ["workshop"],
  "KL-36": ["workshop"],
  "KL-37": ["workshop"],
  "KL-42": ["workshop"],
};

export function buildQuestions(library) {
  return library.checklists
    .filter((l) => l.source === "external")
    .flatMap((l) =>
      l.items.map((i) => ({
        key: i.ref,
        text: i.text,
        source: "meb",
        listCode: l.code,
        tags: LIST_TAGS[l.code] ?? [],
      })),
    )
    .sort((a, b) => a.key.localeCompare(b.key, "en", { numeric: true }));
}

function main() {
  const library = JSON.parse(fs.readFileSync(path.join(DATA, "library.json"), "utf8"));
  const questions = buildQuestions(library);
  const bank = { version: BANK_VERSION, items: questions };
  fs.writeFileSync(path.join(DATA, "questions.json"), JSON.stringify(bank, null, 2) + "\n");
  console.log(`${questions.length} MEB questions`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
