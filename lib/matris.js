// L tipi risk matrisi (MEB Risk Değerlendirme Rehberi): Risk = Olasılık × Şiddet.
// Düzey çarpımdan değil matris hücresinden okunur.
(function (kok) {
  'use strict';

  // Satır = olasılık 1..5, sütun = şiddet 1..5.
  const MATRIS = Object.freeze([
    Object.freeze(['A', 'D', 'D', 'D', 'D']),
    Object.freeze(['D', 'D', 'D', 'O', 'O']),
    Object.freeze(['D', 'D', 'O', 'O', 'Y']),
    Object.freeze(['D', 'O', 'O', 'Y', 'Y']),
    Object.freeze(['D', 'O', 'Y', 'Y', 'T']),
  ]);

  const DUZEYLER = Object.freeze({
    A: Object.freeze({ kod: 'A', ad: 'Anlamsız', zemin: '#d9d9d9', yazi: '#000000' }),
    D: Object.freeze({ kod: 'D', ad: 'Düşük', zemin: '#92d050', yazi: '#000000' }),
    O: Object.freeze({ kod: 'O', ad: 'Orta', zemin: '#ffff00', yazi: '#000000' }),
    Y: Object.freeze({ kod: 'Y', ad: 'Yüksek', zemin: '#ff0000', yazi: '#000000' }),
    T: Object.freeze({ kod: 'T', ad: 'Tolere edilemez', zemin: '#000000', yazi: '#ffffff' }),
  });

  /** Puan 1-5 arası tam sayı mı? */
  function gecerliPuan(p) {
    return Number.isInteger(p) && p >= 1 && p <= 5;
  }

  /** O × Ş; puanlardan biri eksik ya da geçersizse null. */
  function skor(o, s) {
    return gecerliPuan(o) && gecerliPuan(s) ? o * s : null;
  }

  /** Matris hücresindeki düzey; puanlardan biri eksik ya da geçersizse null. */
  function duzey(o, s) {
    return gecerliPuan(o) && gecerliPuan(s) ? DUZEYLER[MATRIS[o - 1][s - 1]] : null;
  }

  const api = Object.freeze({ MATRIS, DUZEYLER, gecerliPuan, skor, duzey });
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { matris: api });
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
