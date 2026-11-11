import { riskLevel } from "./matrix";
import type { Assessment } from "./types";

export interface GapEntry {
  id: string;
  name: string;
  count: number;
}

export type MetaField = "school" | "period" | "assessmentDate";

export interface Readiness {
  /** Locations with rows missing likelihood or severity. */
  unscored: GapEntry[];
  /** Locations with high/intolerable rows lacking action or responsible. */
  missingAction: GapEntry[];
  /** Checklists with unanswered items. */
  unanswered: GapEntry[];
  emptySignatories: number;
  missingMeta: MetaField[];
  totals: { scoredRows: number; totalRows: number };
  hasGaps: boolean;
}

const blank = (s: string) => s.trim() === "";
const withCount = (list: GapEntry[]) => list.filter((g) => g.count > 0);

export function readiness(a: Assessment): Readiness {
  const rows = a.locations.map((l) => ({
    l,
    scored: l.rows.filter((r) => riskLevel(r.likelihood, r.severity) !== null),
  }));
  const unscored = withCount(
    rows.map(({ l, scored }) => ({ id: l.id, name: l.name, count: l.rows.length - scored.length })),
  );
  const missingAction = withCount(
    rows.map(({ l, scored }) => ({
      id: l.id,
      name: l.name,
      count: scored.filter((r) => {
        const key = riskLevel(r.likelihood, r.severity)?.key;
        return (key === "high" || key === "intolerable") && (blank(r.action) || blank(r.responsible));
      }).length,
    })),
  );
  const unanswered = withCount(
    a.checklists.map((c) => ({
      id: c.id,
      name: `${c.code} ${c.name}`.trim(),
      count: c.items.filter((i) => i.answer === "").length,
    })),
  );
  const emptySignatories = a.school.signatories.filter((s) => blank(s.name)).length;
  const missingMeta: MetaField[] = [];
  if (blank(a.school.name)) missingMeta.push("school");
  if (blank(a.period)) missingMeta.push("period");
  if (blank(a.assessmentDate)) missingMeta.push("assessmentDate");
  const totals = {
    scoredRows: rows.reduce((n, { scored }) => n + scored.length, 0),
    totalRows: a.locations.reduce((n, l) => n + l.rows.length, 0),
  };
  return {
    unscored,
    missingAction,
    unanswered,
    emptySignatories,
    missingMeta,
    totals,
    hasGaps:
      unscored.length + missingAction.length + unanswered.length + emptySignatories + missingMeta.length > 0,
  };
}
