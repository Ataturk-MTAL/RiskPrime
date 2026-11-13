// Cloudflare Worker: receives checklist-item proposals and opens GitHub issues as a GitHub App.
// Never logs proposal content or IPs.

import { findSimilar } from "../../src/lib/domain/similarity";
import {
  issueTitle,
  parseIssueBody,
  renderIssueBody,
  validateProposal,
} from "../../src/lib/domain/proposal";
import bank from "../../src/lib/data/questions.json";
import {
  addComment,
  createIssue,
  installationToken,
  listOpenProposals,
  type GithubEnv,
} from "./github";

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env extends GithubEnv {
  ALLOWED_ORIGINS: string;
  TURNSTILE_SECRET: string;
  PROPOSAL_LIMITER: RateLimiter;
}

interface Reply {
  ok: boolean;
  status?: "created" | "duplicate" | "exists";
  url?: string;
  key?: string;
  errors?: string[];
}

const MAX_BODY_BYTES = 8 * 1024;
const BANK_EXISTS_SCORE = 0.8;
const OPEN_DUPLICATE_SCORE = 0.6;
const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RELAY_MARKER = "<!-- riskprime-relay -->";
const UPSTREAM_ERROR = "Öneri şu an gönderilemedi, lütfen sonra tekrar deneyin.";

const sha256Hex = async (s: string): Promise<string> =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

function reply(body: Reply, status: number, origin: string | null): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

const fail = (status: number, message: string, origin: string | null) =>
  reply({ ok: false, errors: [message] }, status, origin);

async function turnstileOk(env: Env, token: unknown, ip: string): Promise<boolean> {
  if (typeof token !== "string" || !token) return false;
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  const res = await fetch(TURNSTILE_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error(`turnstile ${res.status}`);
  return ((await res.json()) as { success: boolean }).success === true;
}

async function handleProposal(request: Request, env: Env, origin: string): Promise<Response> {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES)
    return fail(413, "Öneri çok büyük.", origin);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "Geçersiz istek.", origin);
  }

  const checked = validateProposal(json);
  if (!checked.ok) return reply({ ok: false, errors: checked.errors }, 400, origin);
  const proposal = checked.value;

  try {
    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    const token = (json as { turnstileToken?: unknown }).turnstileToken;
    if (!(await turnstileOk(env, token, ip)))
      return fail(403, "Doğrulama başarısız, lütfen tekrar deneyin.", origin);

    const { success } = await env.PROPOSAL_LIMITER.limit({ key: await sha256Hex(ip) });
    if (!success) return fail(429, "Çok fazla öneri gönderdiniz, lütfen biraz bekleyin.", origin);

    const [inBank] = findSimilar(proposal.text, bank.items, BANK_EXISTS_SCORE, 1);
    if (inBank) return reply({ ok: true, status: "exists", key: inBank.key }, 200, origin);

    const ghToken = await installationToken(env);
    const open = await listOpenProposals(ghToken, env.GITHUB_REPO);
    const candidates = open.map((i) => ({
      key: String(i.number),
      text: parseIssueBody(i.body ?? "").text,
    }));
    const [dup] = findSimilar(proposal.text, candidates, OPEN_DUPLICATE_SCORE, 1);
    if (dup) {
      const issue = open.find((i) => String(i.number) === dup.key)!;
      await addComment(
        ghToken,
        env.GITHUB_REPO,
        issue.number,
        `Uygulamadan benzer bir öneri daha geldi.\n\n> ${proposal.text}\n\nGerekçe: ${proposal.reason}`,
      );
      return reply({ ok: true, status: "duplicate", url: issue.html_url }, 200, origin);
    }

    const url = await createIssue(
      ghToken,
      env.GITHUB_REPO,
      issueTitle(proposal),
      `${renderIssueBody(proposal)}\n\n${RELAY_MARKER}`,
    );
    return reply({ ok: true, status: "created", url }, 200, origin);
  } catch (err) {
    console.error("relay upstream failure:", err instanceof Error ? err.message : "unknown");
    return fail(502, UPSTREAM_ERROR, origin);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    const origin = request.headers.get("Origin");
    const originOk = origin !== null && allowed.includes(origin);

    if (url.pathname !== "/proposals" || !["POST", "OPTIONS"].includes(request.method))
      return fail(404, "Bulunamadı.", null);
    if (!originOk) return fail(403, "Bu kaynağa izin verilmiyor.", null);

    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    return handleProposal(request, env, origin);
  },
};
