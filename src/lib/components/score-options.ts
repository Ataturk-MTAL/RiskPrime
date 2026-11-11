import type { Score } from "$lib/domain/types";

export type SelectOption = { value: string; label: string; hint?: string };

/** Select value for "not scored" (bits-ui treats "" as no selection). */
export const NO_SCORE = "none";

// Scales from the MEB Risk Değerlendirme Rehberi.
const LIKELIHOOD_HINTS = ["Hemen hemen hiç", "Çok az", "Az", "Sıklıkla", "Çok sıklıkla"];
const SEVERITY_HINTS = ["İlk yardım", "Ayakta tedavi", "Yatarak tedavi", "Ciddi yaralanma", "Ölüm"];

const scoreOptions = (hints: string[]): SelectOption[] => [
  { value: NO_SCORE, label: "—", hint: "Puanlanmadı" },
  ...hints.map((hint, i) => ({ value: String(i + 1), label: String(i + 1), hint })),
];

export const LIKELIHOOD_OPTIONS = scoreOptions(LIKELIHOOD_HINTS);
export const SEVERITY_OPTIONS = scoreOptions(SEVERITY_HINTS);

export const scoreValue = (s: Score | null): string => (s === null ? NO_SCORE : String(s));

export function parseScore(value: string): Score | null {
  return value === NO_SCORE ? null : (Number(value) as Score);
}
