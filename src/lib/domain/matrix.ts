// L-type risk matrix (MEB Risk Değerlendirme Rehberi): risk = likelihood × severity.
// The level is read from the matrix cell, not derived from the product.
import type { Score } from "./types";

export type LevelKey = "negligible" | "low" | "medium" | "high" | "intolerable";

export interface Level {
  key: LevelKey;
  /** Turkish label shown in the UI and documents. */
  label: string;
  background: string;
  text: string;
}

export const LEVELS: Readonly<Record<LevelKey, Level>> = Object.freeze({
  negligible: { key: "negligible", label: "Anlamsız", background: "#d9d9d9", text: "#000000" },
  low: { key: "low", label: "Düşük", background: "#92d050", text: "#000000" },
  medium: { key: "medium", label: "Orta", background: "#ffff00", text: "#000000" },
  high: { key: "high", label: "Yüksek", background: "#ff0000", text: "#000000" },
  intolerable: {
    key: "intolerable",
    label: "Tolere edilemez",
    background: "#000000",
    text: "#ffffff",
  },
});

const N: LevelKey = "negligible";
const L: LevelKey = "low";
const M: LevelKey = "medium";
const H: LevelKey = "high";
const I: LevelKey = "intolerable";

/** Row = likelihood 1..5, column = severity 1..5 (guide p. 9). */
export const MATRIX: readonly (readonly LevelKey[])[] = Object.freeze([
  [N, L, L, L, L],
  [L, L, L, M, M],
  [L, L, M, M, H],
  [L, M, M, H, H],
  [L, M, H, H, I],
]);

export function isScore(value: unknown): value is Score {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;
}

/** likelihood × severity; null if either score is missing or invalid. */
export function riskScore(likelihood: unknown, severity: unknown): number | null {
  return isScore(likelihood) && isScore(severity) ? likelihood * severity : null;
}

/** Level from the matrix cell; null if either score is missing or invalid. */
export function riskLevel(likelihood: unknown, severity: unknown): Level | null {
  return isScore(likelihood) && isScore(severity)
    ? LEVELS[MATRIX[likelihood - 1][severity - 1]]
    : null;
}
