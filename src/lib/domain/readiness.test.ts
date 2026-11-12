import { describe, expect, test } from "vite-plus/test";
import { emptyAssessment } from "./assessment";
import { readiness } from "./readiness";
import { withAnswers } from "./test-helpers";
import type { Assessment, RiskRow } from "./types";

const row = (over: Partial<RiskRow> = {}): RiskRow => ({
  id: "r",
  equipment: "",
  hazard: "tehlike",
  affected: "",
  existingControls: "",
  likelihood: 1,
  severity: 1,
  action: "",
  responsible: "",
  dueDate: "",
  status: "open",
  likelihoodAfter: null,
  severityAfter: null,
  ...over,
});

function complete(): Assessment {
  const a = emptyAssessment("2026-2027");
  return withAnswers(
    {
      ...a,
      assessmentDate: "01.09.2026",
      validUntil: "01.09.2027",
      school: { ...a.school, name: "Okul", signatories: [{ title: "Müdür", name: "Ali" }] },
      locations: [
        { id: "l1", name: "Atölye", type: "workshop", building: "", area: "", rows: [row()] },
      ],
      checklists: [
        {
          id: "c1",
          code: "KL-01",
          name: "Liste",
          source: "internal",
          items: [{ id: "i", no: "1", text: "t" }],
        },
      ],
    },
    "c1",
    null,
    { i: "yes" },
  );
}

describe("readiness", () => {
  test("complete assessment has no gaps", () => {
    const r = readiness(complete());
    expect(r.hasGaps).toBe(false);
    expect(r.totals).toEqual({ scoredRows: 1, totalRows: 1 });
  });

  test("reports unscored rows per location and counts scored rows", () => {
    const a = complete();
    a.locations[0].rows = [row(), row({ likelihood: null }), row({ severity: null })];
    const r = readiness(a);
    expect(r.unscored).toEqual([{ id: "l1", name: "Atölye", count: 2 }]);
    expect(r.totals).toEqual({ scoredRows: 1, totalRows: 3 });
    expect(r.hasGaps).toBe(true);
  });

  test("high and intolerable rows need action and responsible", () => {
    const a = complete();
    a.locations[0].rows = [
      row({ likelihood: 5, severity: 5 }),
      row({ likelihood: 4, severity: 4, action: "x", responsible: "y" }),
      row({ likelihood: 3, severity: 3 }),
    ];
    expect(readiness(a).missingAction).toEqual([{ id: "l1", name: "Atölye", count: 1 }]);
  });

  test("counts unanswered checklist items", () => {
    const a = complete();
    a.inspections[0].answers = [];
    expect(readiness(a).unanswered).toEqual([{ id: "c1", name: "KL-01 Liste", count: 1 }]);
  });

  test("flags empty signatory names and school meta", () => {
    const a = complete();
    a.school.name = " ";
    a.period = "";
    a.assessmentDate = "";
    a.school.signatories = [{ title: "Müdür", name: "" }];
    const r = readiness(a);
    expect(r.emptySignatories).toBe(1);
    expect(r.missingMeta).toEqual(["school", "period", "assessmentDate"]);
  });

  test("flags empty validUntil and validUntil before assessmentDate", () => {
    const a = complete();
    a.validUntil = "";
    expect(readiness(a).missingMeta).toEqual(["validUntil"]);
    a.validUntil = "01.08.2026";
    const r = readiness(a);
    expect(r.invalidDates).toBe(true);
    expect(r.missingMeta).toEqual([]);
    expect(r.hasGaps).toBe(true);
  });

  test("done rows need after-action scores", () => {
    const a = complete();
    a.locations[0].rows = [
      row({ status: "done" }),
      row({ status: "done", likelihoodAfter: 1, severityAfter: 1 }),
      row({ status: "open" }),
    ];
    expect(readiness(a).doneWithoutAfter).toEqual([{ id: "l1", name: "Atölye", count: 1 }]);
  });

  test("rows with empty hazard are listed per location", () => {
    const a = complete();
    a.locations[0].rows = [row({ hazard: " " }), row()];
    expect(readiness(a).emptyHazard).toEqual([{ id: "l1", name: "Atölye", count: 1 }]);
    expect(readiness(a).hasGaps).toBe(true);
  });
});
