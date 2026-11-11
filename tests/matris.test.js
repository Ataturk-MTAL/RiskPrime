const test = require('node:test');
const assert = require('node:assert/strict');
const { skor, duzey, gecerliPuan } = require('../lib/matris.js');

// Rehber s. 9 tablosu: satır = O, sütun = Ş.
const BEKLENEN = [
  ['Anlamsız', 'Düşük', 'Düşük', 'Düşük', 'Düşük'],
  ['Düşük', 'Düşük', 'Düşük', 'Orta', 'Orta'],
  ['Düşük', 'Düşük', 'Orta', 'Orta', 'Yüksek'],
  ['Düşük', 'Orta', 'Orta', 'Yüksek', 'Yüksek'],
  ['Düşük', 'Orta', 'Yüksek', 'Yüksek', 'Tolere edilemez'],
];

test('25 hücrenin düzeyi rehber tablosuyla aynı', () => {
  for (let o = 1; o <= 5; o++) {
    for (let s = 1; s <= 5; s++) {
      assert.equal(duzey(o, s).ad, BEKLENEN[o - 1][s - 1], `O=${o} Ş=${s}`);
    }
  }
});

test('skor O ile Ş çarpımıdır', () => {
  assert.equal(skor(3, 5), 15);
  assert.equal(skor(1, 1), 1);
});

test('eksik ya da geçersiz puanda skor ve düzey null', () => {
  for (const [o, s] of [[null, 3], [3, null], [0, 3], [6, 1], [2.5, 2], ['3', 3]]) {
    assert.equal(skor(o, s), null);
    assert.equal(duzey(o, s), null);
  }
});

test('gecerliPuan yalnız 1-5 tam sayıyı kabul eder', () => {
  assert.ok(gecerliPuan(1) && gecerliPuan(5));
  assert.ok(!gecerliPuan(0) && !gecerliPuan(6) && !gecerliPuan(null) && !gecerliPuan('2'));
});
