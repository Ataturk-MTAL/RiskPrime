// Counts behind the "Genel bakış" page: one summary per MEB workflow step.
import { isOverdue } from "./assessment";
import { LEVELS, riskLevel, type LevelKey } from "./matrix";
import { readiness } from "./readiness";
import { countUntransferred } from "./transfer";
import type { Assessment } from "./types";

export type StepState = "done" | "doing" | "todo";

const META_TOTAL = 4;
const SERIOUS: readonly LevelKey[] = ["high", "intolerable"];
const filled = (s: string) => s.trim() !== "";

/** done when everything is complete, todo when nothing has started. */
function stateOf(done: number, total: number): StepState {
  if (total > 0 && done >= total) return "done";
  return done > 0 ? "doing" : "todo";
}

export function progress(a: Assessment, today: Date) {
  const metaFilled = [a.school.name, a.period, a.assessmentDate, a.validUntil].filter(
    filled,
  ).length;
  const signatoriesFilled = a.school.signatories.filter((s) => filled(s.name)).length;
  const signatoriesTotal = a.school.signatories.length;
  const school = {
    metaFilled,
    metaTotal: META_TOTAL,
    signatoriesFilled,
    signatoriesTotal,
    state: stateOf(metaFilled + signatoriesFilled, META_TOTAL + signatoriesTotal),
  };

  const items = a.checklists.flatMap((c) => c.items);
  const answered = items.filter((i) => i.answer !== "").length;
  const incomplete = a.checklists.filter((c) => c.items.some((i) => i.answer === ""));
  const checklists = {
    answered,
    total: items.length,
    missing: items.filter((i) => i.answer === "no").length,
    listsDone: a.checklists.length - incomplete.length,
    listsTotal: a.checklists.length,
    firstIncompleteId: incomplete[0]?.id ?? null,
    state: stateOf(answered, items.length),
  };

  const levels = Object.fromEntries(Object.keys(LEVELS).map((k) => [k, 0])) as Record<
    LevelKey,
    number
  >;
  const rows = a.locations.flatMap((l) => l.rows);
  for (const r of rows) {
    const level = riskLevel(r.likelihood, r.severity);
    if (level) levels[level.key] += 1;
  }
  const scored = Object.values(levels).reduce((n, c) => n + c, 0);
  const untransferred = countUntransferred(a);
  const risk = {
    untransferred,
    scored,
    total: rows.length,
    serious: SERIOUS.reduce((n, k) => n + levels[k], 0),
    overdue: rows.filter((r) => isOverdue(r, today)).length,
    firstUnscoredLocationId:
      a.locations.find((l) => l.rows.some((r) => riskLevel(r.likelihood, r.severity) === null))
        ?.id ?? null,
    // Done needs every row scored and no eksik still waiting to become a row.
    state: (untransferred > 0 && scored === rows.length
      ? "doing"
      : stateOf(scored, rows.length)) as StepState,
  };

  const gaps = readiness(a);
  const gapCount =
    [
      gaps.unscored,
      gaps.missingAction,
      gaps.unanswered,
      gaps.doneWithoutAfter,
      gaps.emptyHazard,
      gaps.noWithoutRow,
      gaps.sourceNowYes,
    ]
      .flat()
      .reduce((n, g) => n + g.count, 0) +
    Number(gaps.invalidDates) +
    gaps.emptySignatories +
    gaps.missingMeta.length;
  const started = school.state !== "todo" || checklists.state !== "todo" || risk.state !== "todo";
  const readinessSummary = {
    hasGaps: gaps.hasGaps,
    gapCount,
    state: (!gaps.hasGaps ? "done" : started ? "doing" : "todo") as StepState,
  };

  return { school, checklists, risk, readiness: readinessSummary, levels };
}
