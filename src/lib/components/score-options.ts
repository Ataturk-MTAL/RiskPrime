import type { Score } from '$lib/domain/types';

/** Options for a 1-5 score select; the empty value means "not scored". */
export const SCORE_OPTIONS = [{ value: '', label: '—' }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))];

export function readScore(e: Event): Score | null {
  const v = (e.currentTarget as HTMLSelectElement).value;
  return v === '' ? null : (Number(v) as Score);
}
