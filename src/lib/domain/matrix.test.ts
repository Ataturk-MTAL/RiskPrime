import { describe, expect, test } from 'vitest';
import { isScore, riskLevel, riskScore } from './matrix';

// Guide p. 9: row = likelihood, column = severity.
const EXPECTED = [
  ['Anlamsız', 'Düşük', 'Düşük', 'Düşük', 'Düşük'],
  ['Düşük', 'Düşük', 'Düşük', 'Orta', 'Orta'],
  ['Düşük', 'Düşük', 'Orta', 'Orta', 'Yüksek'],
  ['Düşük', 'Orta', 'Orta', 'Yüksek', 'Yüksek'],
  ['Düşük', 'Orta', 'Yüksek', 'Yüksek', 'Tolere edilemez'],
];

describe('matrix', () => {
  test('level of all 25 cells matches the guide table', () => {
    for (let l = 1; l <= 5; l++) {
      for (let s = 1; s <= 5; s++) {
        expect(riskLevel(l, s)?.label, `L=${l} S=${s}`).toBe(EXPECTED[l - 1][s - 1]);
      }
    }
  });

  test('score is likelihood times severity', () => {
    expect(riskScore(3, 5)).toBe(15);
    expect(riskScore(1, 1)).toBe(1);
  });

  test('score and level are null for missing or invalid scores', () => {
    for (const [l, s] of [[null, 3], [3, null], [0, 3], [6, 1], [2.5, 2], ['3', 3]]) {
      expect(riskScore(l, s)).toBeNull();
      expect(riskLevel(l, s)).toBeNull();
    }
  });

  test('isScore accepts only integers 1-5', () => {
    expect(isScore(1) && isScore(5)).toBe(true);
    expect([0, 6, null, '2'].some(isScore)).toBe(false);
  });
});
