// A user's proposal for a new checklist item, and its GitHub issue body format.
// Shared by the in-app form, the proposal relay (Cloudflare Worker) and the GitHub Actions
// that triage/approve proposals, so it must stay plain (erasable) TypeScript with no imports.

/** Mirrors LocationType in types.ts (kept local so the relay can import this file alone). */
export const PROPOSAL_TAGS = ["workshop", "storage", "office", "wet", "common"] as const;
export type ProposalTag = (typeof PROPOSAL_TAGS)[number];

export interface Proposal {
  text: string;
  /** Related MEB list, e.g. "KL-35"; "" when none. */
  listCode: string;
  tags: ProposalTag[];
  /** Regulation or standard the item rests on; "" when none. */
  basis: string;
  reason: string;
}

export type Validation = { ok: true; value: Proposal } | { ok: false; errors: string[] };

export const LIMITS = {
  textMin: 10,
  textMax: 300,
  basisMax: 200,
  reasonMin: 10,
  reasonMax: 1000,
} as const;

const LIST_CODE = /^KL-\d{2}$/;
const EMPTY = new Set(["", "_No response_", "_Yok_"]);

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function problems(p: Proposal): string[] {
  const out: string[] = [];
  if (p.text.length < LIMITS.textMin || p.text.length > LIMITS.textMax)
    out.push(`Madde metni ${LIMITS.textMin}-${LIMITS.textMax} karakter olmalı.`);
  if (p.listCode && !LIST_CODE.test(p.listCode))
    out.push("İlgili MEB listesi KL-01 biçiminde olmalı.");
  if (p.basis.length > LIMITS.basisMax)
    out.push(`Dayanak en çok ${LIMITS.basisMax} karakter olabilir.`);
  if (p.reason.length < LIMITS.reasonMin || p.reason.length > LIMITS.reasonMax)
    out.push(`Gerekçe ${LIMITS.reasonMin}-${LIMITS.reasonMax} karakter olmalı.`);
  return out;
}

/** Normalizes untrusted input (trims, drops unknown tags) and checks the limits. */
export function validateProposal(input: unknown): Validation {
  if (typeof input !== "object" || input === null)
    return { ok: false, errors: ["Geçersiz öneri."] };
  const raw = input as Record<string, unknown>;
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const value: Proposal = {
    text: str(raw.text),
    listCode: str(raw.listCode).toLocaleUpperCase("tr"),
    tags: PROPOSAL_TAGS.filter((t) => tags.includes(t)),
    basis: str(raw.basis),
    reason: str(raw.reason),
  };
  const errors = problems(value);
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

/** Section headings; they match the labels of .github/ISSUE_TEMPLATE/madde-onerisi.yml. */
const HEADINGS = {
  text: "Madde metni",
  listCode: "İlgili MEB listesi",
  tags: "Mekân türleri",
  basis: "Dayanak (mevzuat/standart)",
  reason: "Gerekçe",
} as const;

const orNone = (s: string) => s || "_No response_";

export const issueTitle = (p: Proposal): string =>
  `Madde önerisi: ${p.text.length > 80 ? `${p.text.slice(0, 79)}…` : p.text}`;

export function renderIssueBody(p: Proposal): string {
  const values: Record<keyof typeof HEADINGS, string> = {
    text: p.text,
    listCode: orNone(p.listCode),
    tags: orNone(p.tags.join(", ")),
    basis: orNone(p.basis),
    reason: p.reason,
  };
  return (Object.keys(HEADINGS) as (keyof typeof HEADINGS)[])
    .map((k) => `### ${HEADINGS[k]}\n\n${values[k]}`)
    .join("\n\n");
}

/** Reads a body written by renderIssueBody or by the GitHub issue form. Missing sections are "". */
export function parseIssueBody(body: string): Proposal {
  const sections = new Map<string, string>();
  for (const part of body.replace(/\r\n/g, "\n").split(/^### /m).slice(1)) {
    const [heading, ...rest] = part.split("\n");
    sections.set(heading.trim(), rest.join("\n").trim());
  }
  const get = (k: keyof typeof HEADINGS) => {
    const v = sections.get(HEADINGS[k]) ?? "";
    return EMPTY.has(v) ? "" : v;
  };
  const tagText = get("tags");
  return {
    text: get("text"),
    listCode: get("listCode"),
    tags: PROPOSAL_TAGS.filter((t) => tagText.split(/[,\s]+/).includes(t)),
    basis: get("basis"),
    reason: get("reason"),
  };
}
