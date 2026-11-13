// Browser side of the "Madde öner" flow: talks to the school's proposal relay (a Cloudflare Worker).
import type { Proposal } from "./domain/proposal";

export const REPO_URL = "https://github.com/Ataturk-MTAL/RiskPrime";
export const GITHUB_PROPOSAL_URL = `${REPO_URL}/issues/new?template=madde-onerisi.yml`;

export const NETWORK_ERROR = "İnternet bağlantısı yok ya da öneri sunucusuna ulaşılamadı.";
const GENERIC_ERROR = "Öneri gönderilemedi. Lütfen daha sonra tekrar deneyin.";

export type ProposalConfig = { enabled: true; url: string; siteKey: string } | { enabled: false };

export function proposalConfig(
  env: { VITE_PROPOSAL_URL?: string; VITE_TURNSTILE_SITE_KEY?: string } = import.meta.env,
): ProposalConfig {
  const url = env.VITE_PROPOSAL_URL?.trim().replace(/\/+$/, "");
  const siteKey = env.VITE_TURNSTILE_SITE_KEY?.trim();
  return url && siteKey ? { enabled: true, url, siteKey } : { enabled: false };
}

export type SendResult =
  | { ok: true; status: "created" | "duplicate"; url?: string }
  | { ok: true; status: "exists"; key?: string }
  | { ok: false; message: string };

const isString = (v: unknown): v is string => typeof v === "string";

export async function sendProposal(
  proposal: Proposal,
  turnstileToken: string,
  fetchImpl: typeof fetch = fetch,
  config: ProposalConfig = proposalConfig(),
): Promise<SendResult> {
  if (!config.enabled) return { ok: false, message: "Bu kurulumda öneri gönderme açık değil." };
  let res: Response;
  try {
    res = await fetchImpl(`${config.url}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...proposal, turnstileToken }),
    });
  } catch {
    return { ok: false, message: NETWORK_ERROR };
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON body: fall through to the generic error.
  }
  if (res.ok && body.ok === true) {
    const url = isString(body.url) ? body.url : undefined;
    if (body.status === "exists")
      return { ok: true, status: "exists", key: isString(body.key) ? body.key : undefined };
    return { ok: true, status: body.status === "duplicate" ? "duplicate" : "created", url };
  }
  const errors = Array.isArray(body.errors) ? body.errors.filter(isString) : [];
  return { ok: false, message: errors.length ? errors.join(" ") : GENERIC_ERROR };
}
