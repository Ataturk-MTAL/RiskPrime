import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import relay, { type Env } from "./index";
import bank from "../../src/lib/data/questions.json";
import { renderIssueBody } from "../../src/lib/domain/proposal";

const ORIGIN = "https://pages.example";
let limiterOk = true;
const env: Env = {
  ALLOWED_ORIGINS: `${ORIGIN},tauri://localhost`,
  TURNSTILE_SECRET: "s",
  GITHUB_REPO: "o/r",
  GITHUB_APP_ID: "1",
  GITHUB_INSTALLATION_ID: "2",
  GITHUB_APP_PRIVATE_KEY: "",
  PROPOSAL_LIMITER: { limit: async () => ({ success: limiterOk }) },
};

const good = {
  text: "Elektrik panosunun önünde bir metre boş alan bırakılmış mı?",
  listCode: "KL-35",
  tags: ["workshop"],
  basis: "",
  reason: "Acil müdahale için panoya erişim gerekir.",
  turnstileToken: "tok",
};

const post = (body: unknown, origin: string | null = ORIGIN) =>
  relay.fetch(
    new Request("https://relay.example/proposals", {
      method: "POST",
      headers: origin ? { Origin: origin } : {},
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    env,
  );

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

let privateKeyPem = "";
let github: (url: string, init?: RequestInit) => Response;
let turnstile = true;

beforeEach(async () => {
  limiterOk = true;
  turnstile = true;
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der))}\n-----END PRIVATE KEY-----`;
  env.GITHUB_APP_PRIVATE_KEY = privateKeyPem;
  github = () => json({}, 404);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("turnstile")) return json({ success: turnstile });
    if (url.endsWith("/access_tokens")) return json({ token: "ghs" }, 201);
    return github(url, init);
  });
});
afterEach(() => vi.restoreAllMocks());

const githubCalls = () =>
  vi.mocked(fetch).mock.calls.filter(([u]) => String(u).includes("api.github.com"));

describe("relay", () => {
  it("rejects unknown origins", async () => {
    expect((await post(good, "https://evil.example")).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("answers CORS preflight for allowed origins", async () => {
    const res = await relay.fetch(
      new Request("https://relay.example/proposals", {
        method: "OPTIONS",
        headers: { Origin: ORIGIN },
      }),
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });

  it("returns 404 for other paths", async () => {
    const res = await relay.fetch(
      new Request("https://relay.example/x", { headers: { Origin: ORIGIN } }),
      env,
    );
    expect(res.status).toBe(404);
  });

  it("rejects invalid proposals with Turkish errors", async () => {
    const res = await post({ ...good, text: "kısa" });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { errors: string[] }).errors[0]).toContain("Madde metni");
  });

  it("rejects oversized bodies", async () => {
    expect((await post({ ...good, reason: "x".repeat(9000) })).status).toBe(413);
  });

  it("rejects failed Turnstile", async () => {
    turnstile = false;
    expect((await post(good)).status).toBe(403);
    expect(githubCalls()).toHaveLength(0);
  });

  it("rate limits", async () => {
    limiterOk = false;
    expect((await post(good)).status).toBe(429);
  });

  it("reports an item already in the bank without opening an issue", async () => {
    const item = bank.items[0];
    const res = await post({ ...good, text: item.text });
    expect(await res.json()).toEqual({ ok: true, status: "exists", key: item.key });
    expect(githubCalls()).toHaveLength(0);
  });

  it("comments on a similar open proposal", async () => {
    const open = [
      {
        number: 7,
        html_url: "https://gh/7",
        body: renderIssueBody({ ...good, tags: ["workshop"] }),
      },
    ];
    github = (url, init) => (init?.method === "POST" ? json({}, 201) : json(open));
    const res = await post({ ...good, text: good.text.replace("bir metre", "1 metre") });
    expect(await res.json()).toEqual({ ok: true, status: "duplicate", url: "https://gh/7" });
    const post_ = githubCalls().find(([u]) => String(u).endsWith("/issues/7/comments"))!;
    expect(String((post_[1] as RequestInit).body)).toContain(
      "Uygulamadan benzer bir öneri daha geldi.",
    );
  });

  it("creates an issue with the section headings", async () => {
    github = (url, init) =>
      init?.method === "POST" ? json({ html_url: "https://gh/9" }, 201) : json([]);
    const res = await post(good);
    expect(await res.json()).toEqual({ ok: true, status: "created", url: "https://gh/9" });
    const create = githubCalls().find(([u]) => String(u).endsWith("/repos/o/r/issues"))!;
    const sent = JSON.parse(String((create[1] as RequestInit).body));
    expect(sent.labels).toEqual(["madde-onerisi"]);
    expect(sent.body).toContain("### Madde metni");
    expect(sent.body).toContain("### Gerekçe");
    expect(sent.body.endsWith("<!-- riskprime-relay -->")).toBe(true);
  });

  it("authenticates as the app with a signed JWT, then with the installation token", async () => {
    github = (url, init) =>
      init?.method === "POST" ? json({ html_url: "https://gh/9" }, 201) : json([]);
    await post(good);
    const auth = (u: string) => {
      const call = githubCalls().find(([c]) => String(c).endsWith(u))!;
      return ((call[1] as RequestInit).headers as Record<string, string>).Authorization;
    };
    expect(auth("/access_tokens")).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
    expect(auth("/repos/o/r/issues")).toBe("Bearer ghs");
  });

  it("returns 502 when GitHub fails", async () => {
    github = () => json({}, 500);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(good);
    expect(res.status).toBe(502);
    expect(((await res.json()) as { errors: string[] }).errors[0]).toContain("gönderilemedi");
  });
});
