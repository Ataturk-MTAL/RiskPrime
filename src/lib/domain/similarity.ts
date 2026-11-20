// Text similarity for checklist items: Turkish-aware word overlap (Jaccard).
// Shared by the in-app proposal form, the proposal relay and the GitHub duplicate check,
// so it must stay plain (erasable) TypeScript with no imports.

/** Words shorter than this ("mi", "ve", "var") carry no meaning for matching. */
const MIN_WORD_LENGTH = 4;

/** Prefix length compared when stemming: Turkish is agglutinative. Opt-in, stemming merges roots like "elektrik"/"elektronik". */
const STEM_LENGTH = 5;

/** Default score from which two items count as similar (the item-proposal form; the relay and triage use their own stricter scores). */
export const SIMILAR_THRESHOLD = 0.35;

export interface SimilarHit {
  key: string;
  text: string;
  score: number;
}

export const normalizeText = (s: string): string =>
  s
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (s: string, stem: boolean): Set<string> =>
  new Set(
    normalizeText(s)
      .split(" ")
      .filter((w) => w.length >= MIN_WORD_LENGTH)
      .map((w) => (stem ? w.slice(0, STEM_LENGTH) : w)),
  );

/** Jaccard overlap of the meaningful words, 0..1. With `stem`, words match on their first letters. */
export function similarity(a: string, b: string, stem = false): number {
  const wa = words(a, stem);
  const wb = words(b, stem);
  if (!wa.size || !wb.size) return normalizeText(a) === normalizeText(b) ? 1 : 0;
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared / (wa.size + wb.size - shared);
}

export interface SimilarGroup {
  keys: string[];
  text: string;
  score: number;
}

/** Like findSimilar, but candidates with the same text (e.g. one MEB item in many lists) count once. */
export function findSimilarGrouped(
  text: string,
  candidates: readonly { key: string; text: string }[],
  threshold = SIMILAR_THRESHOLD,
  limit = 5,
): SimilarGroup[] {
  const groups = new Map<string, SimilarGroup>();
  for (const c of candidates) {
    const id = normalizeText(c.text);
    const g = groups.get(id);
    groups.set(
      id,
      g ? { ...g, keys: [...g.keys, c.key] } : { keys: [c.key], text: c.text, score: 0 },
    );
  }
  return [...groups.values()]
    .map((g) => ({ ...g, score: similarity(text, g.text) }))
    .filter((g) => g.score >= threshold)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

/** Candidates at or above the threshold, best first. */
export function findSimilar(
  text: string,
  candidates: readonly { key: string; text: string }[],
  threshold = SIMILAR_THRESHOLD,
  limit = 5,
  stem = false,
): SimilarHit[] {
  return candidates
    .map((c) => ({ key: c.key, text: c.text, score: similarity(text, c.text, stem) }))
    .filter((h) => h.score >= threshold)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
