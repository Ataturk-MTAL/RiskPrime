// GitHub App auth (WebCrypto only) and the few issue calls the relay needs.

const API = "https://api.github.com";
const HEADERS = {
  "User-Agent": "riskprime-relay",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export interface GithubEnv {
  GITHUB_REPO: string;
  GITHUB_APP_ID: string;
  GITHUB_INSTALLATION_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
}

export interface OpenIssue {
  number: number;
  html_url: string;
  body: string | null;
}

const b64url = (data: ArrayBuffer | string): string => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function signJwt(appId: string, pem: string): Promise<string> {
  const der = Uint8Array.from(
    atob(pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "")),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${head}.${body}`),
  );
  return `${head}.${body}.${b64url(sig)}`;
}

async function call(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`github ${init.method ?? "GET"} ${res.status}`);
  return res;
}

export async function installationToken(env: GithubEnv): Promise<string> {
  const jwt = await signJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const res = await call(jwt, `/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`, {
    method: "POST",
  });
  return ((await res.json()) as { token: string }).token;
}

/** Open proposals, newest first (first 100 are enough for duplicate detection). */
export async function listOpenProposals(token: string, repo: string): Promise<OpenIssue[]> {
  const res = await call(
    token,
    `/repos/${repo}/issues?state=open&labels=madde-onerisi&per_page=100`,
  );
  return (await res.json()) as OpenIssue[];
}

export async function addComment(
  token: string,
  repo: string,
  issue: number,
  body: string,
): Promise<void> {
  await call(token, `/repos/${repo}/issues/${issue}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function createIssue(
  token: string,
  repo: string,
  title: string,
  body: string,
): Promise<string> {
  const res = await call(token, `/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body, labels: ["madde-onerisi"] }),
  });
  return ((await res.json()) as { html_url: string }).html_url;
}
