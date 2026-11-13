import type { Assessment } from "$lib/domain/types";
import { parse, serialize } from "$lib/domain/file";

export const STORAGE_KEY = "riskprime.assessment";
/** Survives reloads so New/Open still warn about work that was never downloaded. */
export const DIRTY_KEY = "riskprime.dirty";
export const SAVED_AT_KEY = "riskprime.savedAt";
/** Raw text of a stored assessment that failed validation, kept so it can be recovered. */
export const UNREADABLE_KEY = "riskprime.assessment.unreadable";
export const RECOVERY_FILE = "riskprime-kurtarma.json";

/** The stored assessment, or null; `ok` is false when localStorage itself failed. */
export function readStoredAssessment(): { assessment: Assessment | null; ok: boolean } {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return { assessment: null, ok: true };
    const result = parse(text);
    if ("assessment" in result) return { assessment: result.assessment, ok: true };
    // Never silently replace a stored work: keep the raw text once.
    if (localStorage.getItem(UNREADABLE_KEY) === null) localStorage.setItem(UNREADABLE_KEY, text);
    return { assessment: null, ok: true };
  } catch {
    return { assessment: null, ok: false };
  }
}

/** Writes the assessment and its flags; returns false when storage is unavailable or full. */
export function persistAssessment(
  assessment: Assessment,
  dirty: boolean,
  savedAt: string | null,
): boolean {
  try {
    // Small keys first: they must land even when the big write hits the quota.
    if (dirty) localStorage.setItem(DIRTY_KEY, "1");
    else localStorage.removeItem(DIRTY_KEY);
    if (savedAt) localStorage.setItem(SAVED_AT_KEY, savedAt);
    else localStorage.removeItem(SAVED_AT_KEY);
    localStorage.setItem(STORAGE_KEY, serialize(assessment));
    return true;
  } catch {
    return false;
  }
}
