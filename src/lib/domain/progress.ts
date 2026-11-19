// Counts behind the "Genel bakış" page: one summary per MEB workflow step.
import { isOverdue } from "./assessment";
import { summary } from "./checklist";
import { inspectionSummary } from "./inspections";
import { LEVELS, riskLevel, type LevelKey } from "./matrix";
import { readiness } from "./readiness";
import { countUntransferred } from "./transfer";
import type { Assessment } from "./types";

/** "blocked" = cannot start yet (the signing review while nothing earlier has begun). */
export type StepState = "done" | "doing" | "todo" | "blocked";

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

  // Counted over inspections: every list counts once per location it is inspected in.
  const stats = a.checklists.map((c) => ({ id: c.id, ...summary(a, c.id) }));
  const answered = stats.reduce((n, s) => n + s.answered, 0);
  const total = stats.reduce((n, s) => n + s.total, 0);
  const incomplete = stats.filter((s) => s.answered < s.total);
  const checklists = {
    answered,
    total,
    missing: stats.reduce((n, s) => n + s.no, 0),
    listsDone: a.checklists.length - incomplete.length,
    listsTotal: a.checklists.length,
    firstIncompleteId: incomplete[0]?.id ?? null,
    state: stateOf(answered, total),
  };

  // The eksik (Hayır) answers waiting to become risk rows.
  const untransferred = countUntransferred(a);
  const transferred = Math.max(0, checklists.missing - untransferred);
  const transfer = {
    total: checklists.missing,
    transferred,
    untransferred,
    state: (untransferred > 0
      ? stateOf(transferred, checklists.missing)
      : checklists.state === "todo"
        ? "todo"
        : "done") as StepState,
  };
  // School-wide inspections (lists without locations) are answered on the report page.
  const wide = a.inspections
    .filter((i) => i.locationId === null)
    .map((i) => inspectionSummary(a, i));
  const schoolWide = {
    count: wide.length,
    answered: wide.reduce((n, s) => n + s.answered, 0),
    total: wide.reduce((n, s) => n + s.total, 0),
    missing: wide.reduce((n, s) => n + s.no, 0),
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
  const risk = {
    untransferred,
    scored,
    total: rows.length,
    serious: SERIOUS.reduce((n, k) => n + levels[k], 0),
    openSerious: rows.filter((r) => {
      const level = riskLevel(r.likelihood, r.severity);
      return r.status === "open" && level !== null && SERIOUS.includes(level.key);
    }).length,
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
    state: (!gaps.hasGaps ? "done" : started ? "doing" : "blocked") as StepState,
  };

  return { school, checklists, schoolWide, transfer, risk, readiness: readinessSummary, levels };
}

export type StepKey = "school" | "checklists" | "transfer" | "risk" | "readiness";
const STEP_ORDER: readonly StepKey[] = ["school", "checklists", "transfer", "risk", "readiness"];

/** The step the overview points at: the first one not done yet, or null when all are done. */
export function nextStep(steps: Record<StepKey, { state: StepState }>): StepKey | null {
  return STEP_ORDER.find((k) => steps[k].state !== "done") ?? null;
}
