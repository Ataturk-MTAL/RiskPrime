import { summary } from "./checklist";
import { isBefore } from "./date";
import { inspectionsForList } from "./inspections";
import { sourceLabel, sourcesOf } from "./links";
import { riskLevel } from "./matrix";
import { pending } from "./transfer";
import type { Assessment, RiskRow } from "./types";

export interface GapEntry {
  id: string;
  name: string;
  count: number;
  /** Extra hint, e.g. which linked items are now "Evet". */
  detail?: string;
}

export type MetaField = "school" | "period" | "assessmentDate" | "validUntil";

export interface Readiness {
  /** Locations with rows missing likelihood or severity. */
  unscored: GapEntry[];
  /** Locations with high/intolerable rows lacking action or responsible. */
  missingAction: GapEntry[];
  /** Checklists with unanswered items. */
  unanswered: GapEntry[];
  /** Locations with rows marked done but missing likelihoodAfter or severityAfter. */
  doneWithoutAfter: GapEntry[];
  /** Locations with rows whose hazard text is empty. */
  emptyHazard: GapEntry[];
  /** Checklists with deficiencies ("Hayır" items) that have no risk row ("Risk tablosuna aktarılmamış eksikler"). */
  noWithoutRow: GapEntry[];
  /** Locations with open rows whose source item is now "Evet" ("Eksiği giderilmiş (Evet olmuş) ama açık satırlar"). */
  sourceNowYes: GapEntry[];
  /** validUntil is earlier than assessmentDate. */
  invalidDates: boolean;
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
        return (
          (key === "high" || key === "intolerable") && (blank(r.action) || blank(r.responsible))
        );
      }).length,
    })),
  );
  const perLocation = (pred: (r: RiskRow) => boolean) =>
    withCount(
      a.locations.map((l) => ({ id: l.id, name: l.name, count: l.rows.filter(pred).length })),
    );
  const doneWithoutAfter = perLocation(
    (r) => r.status === "done" && (r.likelihoodAfter === null || r.severityAfter === null),
  );
  const emptyHazard = perLocation((r) => blank(r.hazard));
  const invalidDates = isBefore(a.validUntil, a.assessmentDate);
  // Counted over each list's inspections (one per location, or one school-wide).
  const unanswered = withCount(
    a.checklists.map((c) => {
      const { total, answered } = summary(a, c.id);
      return { id: c.id, name: `${c.code} ${c.name}`.trim(), count: total - answered };
    }),
  );
  const noWithoutRow = withCount(
    a.checklists.map((c) => ({
      id: c.id,
      name: `${c.code} ${c.name}`.trim(),
      count: inspectionsForList(a, c.id).reduce((n, insp) => n + pending(a, insp).length, 0),
    })),
  );
  const sourceNowYes = withCount(
    a.locations.map((l) => {
      const yes = l.rows
        .filter((r) => r.status === "open")
        .map((r) => sourcesOf(a, r).filter((s) => s.answer === "yes"))
        .filter((s) => s.length);
      const labels = [...new Set(yes.flat().map(sourceLabel))];
      return { id: l.id, name: l.name, count: yes.length, detail: labels.join(", ") };
    }),
  );
  const emptySignatories = a.school.signatories.filter((s) => blank(s.name)).length;
  const missingMeta: MetaField[] = [];
  if (blank(a.school.name)) missingMeta.push("school");
  if (blank(a.period)) missingMeta.push("period");
  if (blank(a.assessmentDate)) missingMeta.push("assessmentDate");
  if (blank(a.validUntil)) missingMeta.push("validUntil");
  const totals = {
    scoredRows: rows.reduce((n, { scored }) => n + scored.length, 0),
    totalRows: a.locations.reduce((n, l) => n + l.rows.length, 0),
  };
  return {
    unscored,
    missingAction,
    unanswered,
    doneWithoutAfter,
    emptyHazard,
    noWithoutRow,
    sourceNowYes,
    invalidDates,
    emptySignatories,
    missingMeta,
    totals,
    hasGaps:
      unscored.length +
        missingAction.length +
        unanswered.length +
        doneWithoutAfter.length +
        emptyHazard.length +
        noWithoutRow.length +
        sourceNowYes.length +
        Number(invalidDates) +
        emptySignatories +
        missingMeta.length >
      0,
  };
}
