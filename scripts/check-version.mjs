#!/usr/bin/env node
// Release guard: package.json and src-tauri/Cargo.toml carry the same version, and a release tag
// (if given) is exactly "v<version>". Usage: node scripts/check-version.mjs [v1.2.3]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The `version = "x"` line of the [package] section. */
export const cargoVersion = (toml) =>
  toml.match(/^\[package\][^[]*?^version\s*=\s*"([^"]+)"/ms)?.[1];

/** Problems as Turkish messages; empty when everything agrees. */
export function versionProblems({ pkg, cargo, tag }) {
  const out = [];
  if (!cargo) out.push("src-tauri/Cargo.toml içinde sürüm bulunamadı.");
  else if (cargo !== pkg)
    out.push(`Sürümler farklı: package.json ${pkg}, src-tauri/Cargo.toml ${cargo}.`);
  if (tag && tag !== `v${pkg}`)
    out.push(`Etiket ${tag}, package.json sürümü v${pkg} ile aynı olmalı.`);
  return out;
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
  const cargo = cargoVersion(fs.readFileSync(path.join(ROOT, "src-tauri", "Cargo.toml"), "utf8"));
  const problems = versionProblems({ pkg, cargo, tag: process.argv[2] });
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`Sürüm ${pkg} tutarlı.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
