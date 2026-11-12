// Yearly rollover: a new period starting from the previous one's results.
import { BANK_VERSION } from "./bank-version";
import type { Assessment, AssessmentMeta, RiskRow } from "./types";

const PERIOD = /^(\d{4})-(\d{4})$/;

/** "2026-2027" -> "2027-2028"; anything else is returned unchanged. */
export function nextPeriod(period: string): string {
  const m = PERIOD.exec(period.trim());
  if (!m || Number(m[2]) !== Number(m[1]) + 1) return period;
  return `${Number(m[1]) + 1}-${Number(m[2]) + 1}`;
}

function rolloverRow(r: RiskRow): RiskRow {
  const hasAfter = r.likelihoodAfter !== null && r.severityAfter !== null;
  return {
    ...r,
    likelihood: hasAfter ? r.likelihoodAfter : r.likelihood,
    severity: hasAfter ? r.severityAfter : r.severity,
    likelihoodAfter: null,
    severityAfter: null,
    status: "open",
    dueDate: "",
  };
}

/**
 * The next period as its own snapshot: a fresh draft (revision 1) on today's question bank version,
 * chained to the source's hash when that was signed.
 */
export function startNextPeriod(
  a: Assessment,
  now: string,
  bankVersion: string = BANK_VERSION,
): Assessment {
  const meta: AssessmentMeta = {
    createdAt: now,
    updatedAt: now,
    appVersion: a.meta.appVersion,
    bankVersion,
    status: "draft",
    revision: 1,
    ...(a.meta.status === "signed" && a.meta.contentHash
      ? { previousHash: a.meta.contentHash }
      : {}),
  };
  return {
    ...a,
    meta,
    period: nextPeriod(a.period),
    assessmentDate: "",
    validUntil: "",
    locations: a.locations.map((l) => ({ ...l, rows: l.rows.map(rolloverRow) })),
    inspections: a.inspections.map((i) => ({ ...i, answers: [] })),
  };
}
