import type { Assessment } from "$lib/domain/types";
import { APP_VERSION, nowIso } from "$lib/domain/app-version";
import starter from "$lib/data/starter.json";

export type ExportKind =
  | "json"
  | "pdf-full"
  | "pdf-checklists"
  | "pdf-blank"
  | "xlsx"
  | "docx"
  | "template";
export type ConflictChoice = "replace" | "append" | null;
/** Answer to "unsaved changes will be lost": save first, discard, or cancel (null). */
export type DiscardChoice = "save" | "discard" | null;

export const UNDO_TOAST_MS = 10_000;
const MAX_SHOWN_ERRORS = 8;

export const LOCKED_MESSAGE =
  "Bu dönem imzalandı ve kilitli; değişiklik için Rapor sayfasından düzeltme taslağı açın.";

/** The bundled starter as a new period created now. */
export const starterAssessment = (): Assessment => {
  const a = structuredClone(starter) as unknown as Assessment;
  const now = nowIso();
  return { ...a, meta: { ...a.meta, createdAt: now, updatedAt: now, appVersion: APP_VERSION } };
};

export function errorList(title: string, errors: string[]): string[] {
  const rest = errors.length - MAX_SHOWN_ERRORS;
  return [
    title,
    ...errors.slice(0, MAX_SHOWN_ERRORS),
    ...(rest > 0 ? [`… ve ${rest} hata daha`] : []),
  ];
}
