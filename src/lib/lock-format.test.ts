import { describe, expect, it } from "vite-plus/test";
import { formatStamp, formatTimeRange, initials } from "./lock-format";

const at = (h: number, m: number, day = 13) => new Date(2026, 10, day, h, m).toISOString();

describe("initials", () => {
  it("takes the first letters of the first two words, Turkish-aware", () => {
    expect(initials("ayşe yılmaz")).toBe("AY");
    expect(initials("  ismail  Hakkı Kara ")).toBe("İH");
    expect(initials("Mehmet")).toBe("M");
  });
  it("falls back to a question mark", () => expect(initials("   ")).toBe("?"));
});

describe("time formatting", () => {
  it("formats a stamp as date and time", () =>
    expect(formatStamp(at(14, 2))).toBe("13.11.2026 14:02"));
  it("shows a same-day range with one date", () =>
    expect(formatTimeRange(at(14, 2), at(14, 20))).toBe("13.11.2026 14:02–14:20"));
  it("collapses an instant to one stamp", () =>
    expect(formatTimeRange(at(14, 2), at(14, 2))).toBe("13.11.2026 14:02"));
  it("keeps both dates across midnight", () =>
    expect(formatTimeRange(at(23, 50), at(0, 10, 14))).toBe("13.11.2026 23:50–14.11.2026 00:10"));
});
