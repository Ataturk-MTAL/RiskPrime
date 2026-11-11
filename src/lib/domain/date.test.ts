import { describe, expect, test } from "vite-plus/test";
import { isBefore, normalizeTrDate, parseTrDate, toIso, trToIso } from "./date";

describe("date", () => {
  test("parses DD.MM.YYYY", () => {
    expect(parseTrDate("15.09.2026")).toEqual({ y: 2026, m: 9, d: 15 });
    expect(parseTrDate(" 1.2.2026 ")).toEqual({ y: 2026, m: 2, d: 1 });
  });
  test("rejects empty, free text and impossible days", () => {
    for (const s of ["", "Eylül 2026", "31.02.2026", "2026-09-15", "15.13.2026"]) {
      expect(parseTrDate(s)).toBeNull();
    }
  });
  test("converts DD.MM.YYYY to ISO", () => {
    expect(toIso({ y: 2026, m: 9, d: 5 })).toBe("2026-09-05");
    expect(trToIso("5.9.2026")).toBe("2026-09-05");
    expect(trToIso("bozuk")).toBeNull();
  });
  test("isBefore compares only parseable dates", () => {
    expect(isBefore("01.09.2026", "15.09.2026")).toBe(true);
    expect(isBefore("15.09.2026", "15.09.2026")).toBe(false);
    expect(isBefore("", "15.09.2026")).toBe(false);
    expect(isBefore("x", "15.09.2026")).toBe(false);
  });
});

describe("normalizeTrDate", () => {
  test("accepts digits, slashes, dashes and single-digit day/month", () => {
    expect(normalizeTrDate("15092026")).toBe("15.09.2026");
    expect(normalizeTrDate("15/9/2026")).toBe("15.09.2026");
    expect(normalizeTrDate("5-9-2026")).toBe("05.09.2026");
    expect(normalizeTrDate(" 15.09.2026 ")).toBe("15.09.2026");
  });

  test("keeps empty, impossible days and free text as typed", () => {
    expect(normalizeTrDate("")).toBe("");
    expect(normalizeTrDate("31.02.2026")).toBe("31.02.2026");
    expect(normalizeTrDate("yarın")).toBe("yarın");
  });
});
