import { describe, expect, it } from "vite-plus/test";
import { formatHash, parseHash } from "./route";

describe("route hash", () => {
  it("round-trips views with and without an id", () => {
    expect(parseHash(formatHash("risk", "a1"))).toEqual({ tab: "risk", id: "a1" });
    expect(parseHash(formatHash("checklists", null))).toEqual({ tab: "checklists", id: null });
    expect(formatHash("school", "ignored")).toBe("#okul");
  });

  it("falls back to the overview for empty or unknown hashes", () => {
    expect(parseHash("")).toEqual({ tab: "overview", id: null });
    expect(parseHash("#nope/1")).toEqual({ tab: "overview", id: null });
  });
});
