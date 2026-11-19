import { describe, expect, test } from "vite-plus/test";
import { emptyAssessment } from "./assessment";
import { nextStep, progress, type StepState } from "./progress";
import { withAnswers } from "./test-helpers";
import type { Assessment, ChecklistItem, RiskRow } from "./types";

const today = new Date(2026, 8, 15);
const row = (over: Partial<RiskRow> = {}): RiskRow => ({
  id: "r",
  equipment: "",
  hazard: "tehlike",
  affected: "",
  existingControls: "",
  likelihood: null,
  severity: null,
  action: "",
  responsible: "",
  dueDate: "",
  status: "open",
  likelihoodAfter: null,
  severityAfter: null,
  ...over,
});
const item = (id: string): ChecklistItem => ({ id, no: id, text: id });

function sample(): Assessment {
  const a = emptyAssessment("2026-2027");
  const base: Assessment = {
    ...a,
    assessmentDate: "01.09.2026",
    school: {
      ...a.school,
      name: "Okul",
      signatories: [
        { title: "M", name: "Ali" },
        { title: "Y", name: "" },
      ],
    },
    locations: [
      {
        id: "l1",
        name: "A",
        type: "workshop",
        building: "",
        area: "",
        rows: [row({ id: "a", likelihood: 5, severity: 5 })],
      },
      {
        id: "l2",
        name: "B",
        type: "office",
        building: "",
        area: "",
        rows: [
          row({ id: "b" }),
          row({ id: "c", likelihood: 1, severity: 1, dueDate: "01.09.2026" }),
        ],
      },
    ],
    checklists: [
      {
        id: "c1",
        code: "K1",
        name: "x",
        source: "internal",
        items: [item("1"), item("2")],
      },
      {
        id: "c2",
        code: "K2",
        name: "y",
        source: "internal",
        items: [item("3"), item("4")],
      },
    ],
  };
  const first = withAnswers(base, "c1", null, { "1": "yes", "2": "na" });
  return withAnswers(first, "c2", null, { "3": "no" });
}

describe("progress", () => {
  test("empty assessment starts every step as todo", () => {
    const p = progress(emptyAssessment(""), today);
    expect(p.school.state).toBe("todo");
    expect(p.checklists.state).toBe("todo");
    expect(p.risk.state).toBe("todo");
  });

  test("counts school meta fields and signatories", () => {
    const { school } = progress(sample(), today);
    expect(school).toMatchObject({
      metaFilled: 3,
      metaTotal: 4,
      signatoriesFilled: 1,
      signatoriesTotal: 2,
      state: "doing",
    });
  });

  test("counts answers, eksik items and the first incomplete list", () => {
    const { checklists } = progress(sample(), today);
    expect(checklists).toMatchObject({
      answered: 3,
      total: 4,
      missing: 1,
      listsDone: 1,
      listsTotal: 2,
      firstIncompleteId: "c2",
      state: "doing",
    });
  });

  test("counts scored rows, serious levels, overdue rows, untransferred eksik and first unscored location", () => {
    const { risk } = progress(sample(), today);
    expect(risk).toMatchObject({
      scored: 2,
      total: 3,
      serious: 1,
      overdue: 1,
      untransferred: 1,
      firstUnscoredLocationId: "l2",
      state: "doing",
    });
  });

  test("levels count scored rows per MEB level", () => {
    const { levels } = progress(sample(), today);
    expect(levels.intolerable).toBe(1);
    expect(levels.negligible).toBe(1);
    expect(levels.high).toBe(0);
  });

  test("readiness sums gaps from every source", () => {
    const { readiness } = progress(sample(), today);
    expect(readiness.hasGaps).toBe(true);
    expect(readiness.gapCount).toBeGreaterThan(0);
  });

  test("fully answered lists are done", () => {
    const a = sample();
    const done = { ...a, checklists: [a.checklists[0]], inspections: [a.inspections[0]] };
    expect(progress(done, today).checklists).toMatchObject({
      state: "done",
      firstIncompleteId: null,
    });
  });

  test("counts open serious risks, the transfer step and school-wide inspections", () => {
    const p = progress(sample(), today);
    expect(p.risk.openSerious).toBe(1);
    expect(p.transfer).toEqual({ total: 1, transferred: 0, untransferred: 1, state: "todo" });
    expect(p.schoolWide).toEqual({ count: 2, answered: 3, total: 4, missing: 1 });
  });

  test("a done risk row is not an open serious risk", () => {
    const a = sample();
    const locations = a.locations.map((l, i) =>
      i === 0 ? { ...l, rows: l.rows.map((r) => ({ ...r, status: "done" as const })) } : l,
    );
    expect(progress({ ...a, locations }, today).risk.openSerious).toBe(0);
  });

  test("the signing review is blocked until an earlier step has begun", () => {
    expect(progress(emptyAssessment(""), today).readiness.state).toBe("blocked");
    expect(progress(sample(), today).readiness.state).toBe("doing");
  });
});

describe("nextStep", () => {
  const steps = (
    school: StepState,
    checklists: StepState,
    transfer: StepState,
    risk: StepState,
    readiness: StepState,
  ) => ({
    school: { state: school },
    checklists: { state: checklists },
    transfer: { state: transfer },
    risk: { state: risk },
    readiness: { state: readiness },
  });

  test("returns the first step that is not done", () => {
    // Arrange
    const input = steps("done", "doing", "todo", "todo", "doing");
    // Act
    const next = nextStep(input);
    // Assert
    expect(next).toBe("checklists");
  });

  test("an empty assessment starts with the school step", () => {
    expect(nextStep(progress(emptyAssessment(""), today))).toBe("school");
  });

  test("returns null when every step is done", () => {
    expect(nextStep(steps("done", "done", "done", "done", "done"))).toBeNull();
  });
});
