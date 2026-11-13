// Triage and approval of checklist item proposals (GitHub issues labelled `madde-onerisi`).
// CLI: node scripts/proposal.mjs triage|approve <issue-number>
// Env: GITHUB_TOKEN, GITHUB_REPOSITORY. Pure helpers are exported for tests.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";
import { parseIssueBody, validateProposal } from "../src/lib/domain/proposal.ts";
import { findSimilar } from "../src/lib/domain/similarity.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS_DIR = path.join(ROOT, "content/questions");
const CHANGELOG = path.join(ROOT, "content/CHANGELOG.md");

export const DUPLICATE_THRESHOLD = 0.6;
const MAX_HITS = 5;
export const PROPOSAL_LABEL = "madde-onerisi";
export const LABEL_INVALID = "eksik-bilgi";
export const LABEL_DUPLICATE = "olası-kopya";
export const TRIAGE_MARKER = "<!-- riskprime-triage -->";

// ---------- pure helpers ----------

/** Next `EE-NN` key: highest existing number + 1, at least two digits. */
export function nextKey(eeToml) {
  const nums = [...eeToml.matchAll(/^key\s*=\s*"EE-(\d+)"/gm)].map((m) => Number(m[1]));
  return `EE-${String(Math.max(0, ...nums) + 1).padStart(2, "0")}`;
}

/** `YYYY.N` -> same year: N+1, new year: `YYYY.1`. */
export function bumpVersion(version, now = new Date()) {
  const [year, n] = version.split(".").map(Number);
  const current = now.getFullYear();
  return year === current ? `${year}.${n + 1}` : `${current}.1`;
}

/** TOML basic string; JSON escapes (\", \\, \n, \uXXXX) are all valid TOML. */
export const tomlString = (s) => JSON.stringify(s);

export function questionBlock(key, proposal) {
  const lines = [
    "[[question]]",
    `key = ${tomlString(key)}`,
    `tags = [${proposal.tags.map(tomlString).join(", ")}]`,
  ];
  if (proposal.basis) lines.push(`basis = ${tomlString(proposal.basis)}`);
  lines.push(`text = ${tomlString(proposal.text)}`);
  return lines.join("\n") + "\n";
}

/** Appends a block without re-serializing the rest of the file. */
export const appendQuestion = (eeToml, block) => `${eeToml.replace(/\s*$/, "\n")}\n${block}`;

export function setBankVersion(bankToml, version) {
  if (!/^version\s*=\s*"[^"]*"/m.test(bankToml)) throw new Error("bank.toml: version bulunamadı");
  return bankToml.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
}

/** Puts a new `## <version>` section above the newest existing one. */
export function insertChangelog(changelog, version, line) {
  const section = `## ${version}\n\n${line}\n\n`;
  const at = changelog.search(/^## /m);
  return at === -1
    ? `${changelog.replace(/\s*$/, "\n")}\n${section}`
    : changelog.slice(0, at) + section + changelog.slice(at);
}

const clip = (s) => (s.length > 160 ? `${s.slice(0, 159)}…` : s);

/**
 * Decides labels and comment for an issue body.
 * bank: [{key,text}], openIssues: [{number,title,body}] (other open proposals, not this one).
 */
export function triageDecision(body, bank, openIssues) {
  const parsed = validateProposal(parseIssueBody(body));
  if (!parsed.ok) {
    return {
      labels: [LABEL_INVALID],
      comment: `Öneri otomatik kontrolden geçemedi:\n\n${parsed.errors.map((e) => `- ${e}`).join("\n")}\n\nİlgili bölümü düzenleyin; kontrol yeniden çalışır.`,
    };
  }
  const { text } = parsed.value;
  const bankHits = findSimilar(text, bank, DUPLICATE_THRESHOLD, MAX_HITS);
  const openHits = findSimilar(
    text,
    openIssues.map((i) => ({ key: `#${i.number}`, text: parseIssueBody(i.body ?? "").text })),
    DUPLICATE_THRESHOLD,
    MAX_HITS,
  );
  if (!bankHits.length && !openHits.length)
    return { labels: [], comment: "Otomatik kontrol: benzer madde bulunamadı." };
  const parts = ["Olası kopya bulundu; kontrol listesinde veya açık önerilerde benzer madde var."];
  if (bankHits.length)
    parts.push(
      `Listede benzer maddeler:\n\n${bankHits.map((h) => `- ${h.key} (${h.score.toFixed(2)}): ${clip(h.text)}`).join("\n")}`,
    );
  if (openHits.length)
    parts.push(
      `Açık benzer öneriler:\n\n${openHits.map((h) => `- ${h.key} (${h.score.toFixed(2)}): ${clip(h.text)}`).join("\n")}`,
    );
  return { labels: [LABEL_DUPLICATE], comment: parts.join("\n\n") };
}

// ---------- GitHub API ----------

function api() {
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo } = process.env;
  if (!token || !repo) throw new Error("GITHUB_TOKEN ve GITHUB_REPOSITORY gerekli");
  return async (route, method = "GET", body) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${route}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (res.status === 404 && method === "DELETE") return null;
    if (!res.ok) throw new Error(`${method} ${route}: ${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  };
}

const hasLabel = (issue, name) =>
  issue.labels.some((l) => (typeof l === "string" ? l : l.name) === name);

function loadBank() {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((n) => n.endsWith(".toml") && n !== "bank.toml")
    .flatMap((n) => parse(fs.readFileSync(path.join(QUESTIONS_DIR, n), "utf8")).question ?? [])
    .map((q) => ({ key: q.key, text: q.text }));
}

async function loadProposalIssue(gh, number) {
  const issue = await gh(`/issues/${number}`);
  if (issue.pull_request || !hasLabel(issue, PROPOSAL_LABEL))
    throw new Error(`#${number} bir madde önerisi değil`);
  return issue;
}

async function triage(number) {
  const gh = api();
  const issue = await loadProposalIssue(gh, number);
  const open = await gh(`/issues?state=open&labels=${PROPOSAL_LABEL}&per_page=100`);
  const others = open.filter((i) => !i.pull_request && i.number !== issue.number);
  const { labels, comment } = triageDecision(issue.body ?? "", loadBank(), others);

  for (const name of [LABEL_INVALID, LABEL_DUPLICATE]) {
    if (labels.includes(name) && !hasLabel(issue, name))
      await gh(`/issues/${number}/labels`, "POST", { labels: [name] });
    if (!labels.includes(name) && hasLabel(issue, name))
      await gh(`/issues/${number}/labels/${encodeURIComponent(name)}`, "DELETE");
  }
  const text = `${TRIAGE_MARKER}\n${comment}`;
  const comments = await gh(`/issues/${number}/comments?per_page=100`);
  const mine = comments.find((c) => c.body?.startsWith(TRIAGE_MARKER));
  if (mine) {
    if (mine.body !== text) await gh(`/issues/comments/${mine.id}`, "PATCH", { body: text });
  } else await gh(`/issues/${number}/comments`, "POST", { body: text });
  console.log(`#${number}: ${labels.join(", ") || "temiz"}`);
}

async function approve(number) {
  const gh = api();
  const issue = await loadProposalIssue(gh, number);
  const parsed = validateProposal(parseIssueBody(issue.body ?? ""));
  if (!parsed.ok) throw new Error(`#${number} geçersiz:\n${parsed.errors.join("\n")}`);

  const eeFile = path.join(QUESTIONS_DIR, "riskprime-ee.toml");
  const bankFile = path.join(QUESTIONS_DIR, "bank.toml");
  const ee = fs.readFileSync(eeFile, "utf8");
  const bank = fs.readFileSync(bankFile, "utf8");
  const key = nextKey(ee);
  const version = bumpVersion(bank.match(/^version\s*=\s*"([^"]*)"/m)?.[1] ?? "");

  fs.writeFileSync(eeFile, appendQuestion(ee, questionBlock(key, parsed.value)));
  fs.writeFileSync(bankFile, setBankVersion(bank, version));
  const line = `- ${key}: ${parsed.value.text} (öneri #${number})`;
  fs.writeFileSync(CHANGELOG, insertChangelog(fs.readFileSync(CHANGELOG, "utf8"), version, line));

  console.log(`${key} eklendi, sürüm ${version}`);
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `key=${key}\nversion=${version}\n`);
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const number = Number(arg);
  const run = { triage, approve }[cmd];
  if (!run || !Number.isInteger(number) || number < 1) {
    console.error("Kullanım: node scripts/proposal.mjs triage|approve <issue-number>");
    process.exit(2);
  }
  try {
    await run(number);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
