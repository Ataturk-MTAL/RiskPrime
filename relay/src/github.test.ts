import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { listOpenProposals, MAX_PAGES } from "./github";

const issues = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ number: from + i, html_url: "u", body: null }));
const json = (data: unknown) =>
  new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });

afterEach(() => vi.restoreAllMocks());

describe("listOpenProposals paging", () => {
  it("follows pages until a short page", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) =>
        String(input).endsWith("&page=1") ? json(issues(1, 100)) : json(issues(101, 5)),
      );
    const all = await listOpenProposals("t", "o/r");
    expect(all).toHaveLength(105);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(String(spy.mock.calls[1][0])).toContain("page=2");
  });

  it("stops at the page cap", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(issues(1, 100)));
    await listOpenProposals("t", "o/r");
    expect(spy).toHaveBeenCalledTimes(MAX_PAGES);
  });
});
