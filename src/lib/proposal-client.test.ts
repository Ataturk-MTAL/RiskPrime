import { describe, expect, it } from "vite-plus/test";
import type { Proposal } from "./domain/proposal";
import { NETWORK_ERROR, proposalConfig, sendProposal } from "./proposal-client";

const proposal: Proposal = {
  text: "x".repeat(20),
  listCode: "",
  tags: [],
  basis: "",
  reason: "y".repeat(20),
};
const cfg = { enabled: true, url: "https://relay.test", siteKey: "k" } as const;
const reply =
  (body: unknown, status = 200) =>
  async () =>
    new Response(JSON.stringify(body), { status });

describe("proposalConfig", () => {
  it("is enabled only when both variables are set", () => {
    expect(
      proposalConfig({ VITE_PROPOSAL_URL: "https://a.test/", VITE_TURNSTILE_SITE_KEY: "k" }),
    ).toEqual({
      enabled: true,
      url: "https://a.test",
      siteKey: "k",
    });
    expect(proposalConfig({ VITE_PROPOSAL_URL: "https://a.test" }).enabled).toBe(false);
    expect(proposalConfig({}).enabled).toBe(false);
  });
});

describe("sendProposal", () => {
  it("posts the proposal with the token and maps created", async () => {
    let seen: { url: string; body: Record<string, unknown> } | undefined;
    const fake = async (url: string | URL | Request, init?: RequestInit) => {
      seen = { url: String(url as string), body: JSON.parse(init?.body as string) };
      return new Response(JSON.stringify({ ok: true, status: "created", url: "https://gh/1" }));
    };
    const r = await sendProposal(proposal, "tok", fake as typeof fetch, cfg);
    expect(r).toEqual({ ok: true, status: "created", url: "https://gh/1" });
    expect(seen?.url).toBe("https://relay.test/proposals");
    expect(seen?.body.turnstileToken).toBe("tok");
    expect(seen?.body.text).toBe(proposal.text);
  });

  it("maps duplicate and exists", async () => {
    expect(
      await sendProposal(
        proposal,
        "t",
        reply({ ok: true, status: "duplicate", url: "u" }) as typeof fetch,
        cfg,
      ),
    ).toEqual({
      ok: true,
      status: "duplicate",
      url: "u",
    });
    expect(
      await sendProposal(
        proposal,
        "t",
        reply({ ok: true, status: "exists", key: "KL-35.02" }) as typeof fetch,
        cfg,
      ),
    ).toEqual({
      ok: true,
      status: "exists",
      key: "KL-35.02",
    });
  });

  it("returns server errors", async () => {
    const r = await sendProposal(
      proposal,
      "t",
      reply({ ok: false, errors: ["a", "b"] }, 400) as typeof fetch,
      cfg,
    );
    expect(r).toEqual({ ok: false, message: "a b" });
  });

  it("maps a network failure to the Turkish message", async () => {
    const fake = async () => {
      throw new TypeError("Failed to fetch");
    };
    expect(await sendProposal(proposal, "t", fake as unknown as typeof fetch, cfg)).toEqual({
      ok: false,
      message: NETWORK_ERROR,
    });
  });

  it("falls back to a generic error on a non-JSON failure", async () => {
    const fake = async () => new Response("oops", { status: 500 });
    const r = await sendProposal(proposal, "t", fake as typeof fetch, cfg);
    expect(r.ok).toBe(false);
  });
});
