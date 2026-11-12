// Period snapshots: a signed assessment is a locked, hash-sealed document (periodicity principle of
// the İSG Risk Değerlendirmesi Yönetmeliği). Storage-independent, so a desktop build can reuse it.
import type { Assessment } from "./types";

export type Verification = "ok" | "modified" | "unsigned";

/** JSON with object keys sorted at every level, so equal content gives equal text. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Everything except the meta fields that change without the content changing. */
export function canonicalContent(a: Assessment): string {
  const { updatedAt: _u, status: _s, signedAt: _g, contentHash: _h, ...sealed } = a.meta;
  return stable({ ...a, meta: sealed });
}

/** Hex SHA-256 of the canonical content. */
export async function contentHash(a: Assessment): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalContent(a));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const isLocked = (a: Assessment): boolean => a.meta.status === "signed";

export async function signSnapshot(a: Assessment, now: string): Promise<Assessment> {
  if (isLocked(a)) throw new Error("Bu dönem zaten imzalanmış.");
  const hash = await contentHash(a);
  return { ...a, meta: { ...a.meta, status: "signed", signedAt: now, contentHash: hash } };
}

export async function verifySnapshot(a: Assessment): Promise<Verification> {
  if (!isLocked(a) || !a.meta.contentHash) return "unsigned";
  return (await contentHash(a)) === a.meta.contentHash ? "ok" : "modified";
}

/** Opens a correction draft of a signed period: revision + 1, pointing back at the signed hash. */
export function reviseDraft(a: Assessment, now: string): Assessment {
  if (!isLocked(a)) throw new Error("Düzeltme taslağı yalnızca imzalanmış dönem için açılır.");
  const { signedAt: _g, contentHash: _h, ...rest } = a.meta;
  return {
    ...a,
    meta: {
      ...rest,
      status: "draft",
      revision: a.meta.revision + 1,
      previousHash: a.meta.contentHash,
      updatedAt: now,
    },
  };
}

/** Marks an edit: refreshes updatedAt and the app version that wrote it. */
export function touch(a: Assessment, now: string, appVersion: string): Assessment {
  return { ...a, meta: { ...a.meta, updatedAt: now, appVersion } };
}
