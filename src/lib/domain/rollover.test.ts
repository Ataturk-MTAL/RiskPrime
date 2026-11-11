import { describe, expect, test } from "vite-plus/test";
import { addLocation, addRow, emptyAssessment, updateMeta, updateSignatory } from "./assessment";
import { nextPeriod, rollover } from "./rollover";

function sample() {
  let a = updateMeta(emptyAssessment("2026-2027"), {
    assessmentDate: "01.09.2026",
    validUntil: "01.09.2027",
  });
  a = updateSignatory(a, 0, { name: "Ayşe" });
  a = addLocation(a, { id: "a-1", name: "ELE1" });
  a = addRow(a, "a-1", {
    id: "r-1",
    likelihood: 4,
    severity: 4,
    likelihoodAfter: 2,
    severityAfter: 3,
    dueDate: "01.01.2027",
    status: "done",
  });
  a = addRow(a, "a-1", { id: "r-2", likelihood: 3, severity: 3, status: "done" });
  return {
    ...a,
    checklists: [
      {
        id: "c-1",
        code: "KL-01",
        name: "Liste",
        source: "external" as const,
        items: [{ id: "i-1", no: "1", text: "Madde", answer: "yes" as const, note: "not" }],
      },
    ],
  };
}

describe("nextPeriod", () => {
  test("increments YYYY-YYYY", () => expect(nextPeriod("2026-2027")).toBe("2027-2028"));
  test("keeps odd values unchanged", () => {
    expect(nextPeriod("Güz 2026")).toBe("Güz 2026");
    expect(nextPeriod("")).toBe("");
    expect(nextPeriod("2026-2028")).toBe("2026-2028");
  });
});

describe("rollover", () => {
  test("sets the next period, clears dates and keeps school, signatories and locations", () => {
    const a = sample();
    const r = rollover(a);
    expect(r.period).toBe("2027-2028");
    expect(r.assessmentDate).toBe("");
    expect(r.validUntil).toBe("");
    expect(r.school).toEqual(a.school);
    expect(r.locations).toHaveLength(1);
  });

  test("after-scores become current scores; status and due date reset", () => {
    const [r1, r2] = rollover(sample()).locations[0].rows;
    expect(r1).toMatchObject({
      likelihood: 2,
      severity: 3,
      likelihoodAfter: null,
      severityAfter: null,
      status: "open",
      dueDate: "",
    });
    expect(r2).toMatchObject({ likelihood: 3, severity: 3, status: "open" });
  });

  test("clears checklist answers and notes but keeps items", () => {
    const item = rollover(sample()).checklists[0].items[0];
    expect(item).toMatchObject({ id: "i-1", text: "Madde", answer: "", note: "" });
  });

  test("does not mutate the input", () => {
    const a = sample();
    rollover(a);
    expect(a.period).toBe("2026-2027");
    expect(a.locations[0].rows[0].likelihood).toBe(4);
  });
});
