// Çıktı biçimleri (PDF, Excel, Word) için ortak, saf veri dönüşümleri.
(function (kok) {
  'use strict';

  const dugum = typeof module === 'object' && module.exports;
  const model = dugum ? require('./model.js') : kok.RiskPrime.model;
  const matris = dugum ? require('./matris.js') : kok.RiskPrime.matris;
  const dosya = dugum ? require('./dosya.js') : kok.RiskPrime.dosya;

  const PDF_TURLERI = Object.freeze(['tam', 'kontrol', 'bos']);
  const CEVAP_METNI = Object.freeze({ evet: 'Evet', hayir: 'Hayır', ud: 'U.D.', '': '' });
  const DURUM_METNI = Object.freeze({ acik: 'Açık', tamam: 'Tamamlandı' });

  function bosIse(deger) {
    return deger === null || deger === undefined ? '' : deger;
  }

  /** Excel/Word için düz risk satırları (mekân bilgisi her satırda). */
  function riskSatirlari(d) {
    return d.mekanlar.flatMap((m) => m.satirlar.map((s, i) => {
      const dz = matris.duzey(s.o, s.s);
      const dz2 = matris.duzey(s.o2, s.s2);
      return {
        mekan: m.ad, bina: m.bina || '', alan: m.alan || '', no: i + 1,
        alet: s.alet, tehlike: s.tehlike, etkilenen: s.etkilenen, mevcut: s.mevcut,
        o: bosIse(s.o), s: bosIse(s.s), skor: bosIse(matris.skor(s.o, s.s)), duzey: dz ? dz.ad : '',
        onlem: s.onlem, sorumlu: s.sorumlu, bitis: s.bitis, durum: DURUM_METNI[s.durum] || '',
        o2: bosIse(s.o2), s2: bosIse(s.s2), skor2: bosIse(matris.skor(s.o2, s.s2)), duzey2: dz2 ? dz2.ad : '',
      };
    }));
  }

  /** Excel/Word için düz kontrol listesi satırları. */
  function kontrolSatirlari(d) {
    return (d.kontrolListeleri || []).flatMap((k) => k.maddeler.map((m) => ({
      kod: k.kod, ad: k.ad, no: m.no, metin: m.metin,
      cevap: CEVAP_METNI[m.cevap] || '', aciklama: m.aciklama || '',
    })));
  }

  function pdfSatiri(s, bos) {
    if (bos) return { ...s, o: null, s: null, skor: null, duzey: null, o2: null, s2: null, skor2: null, duzey2: null };
    return {
      ...s,
      skor: matris.skor(s.o, s.s), duzey: matris.duzey(s.o, s.s),
      skor2: matris.skor(s.o2, s.s2), duzey2: matris.duzey(s.o2, s.s2),
    };
  }

  /** Typst şablonuna verilecek veri. tur: tam | kontrol | bos. Girdiyi değiştirmez. */
  function pdfVerisi(d, tur) {
    if (!PDF_TURLERI.includes(tur)) throw new Error(`Geçersiz çıktı türü: ${tur}`);
    const bos = tur === 'bos';
    const gruplar = model.gruplu(d).map((g) => ({
      baslik: g.baslik,
      mekanlar: g.mekanlar.map((m) => ({ ...m, satirlar: m.satirlar.map((s) => pdfSatiri(s, bos)) })),
    }));
    const kontrolListeleri = (d.kontrolListeleri || []).map((k) => ({
      ...k,
      maddeler: k.maddeler.map((m) => (bos ? { ...m, cevap: '', aciklama: '' } : m)),
    }));
    return {
      tur, okul: d.okul, donem: d.donem,
      degerlendirmeTarihi: d.degerlendirmeTarihi, gecerlilikTarihi: d.gecerlilikTarihi,
      gruplar, kontrolListeleri,
    };
  }

  /** risk-<dönem>[-ek].<uzantı> */
  function ciktiAdi(d, uzanti, ek) {
    const kok = dosya.dosyaAdi(d).replace(/\.json$/, '');
    return `${kok}${ek ? `-${ek}` : ''}.${uzanti}`;
  }

  const api = Object.freeze({ PDF_TURLERI, riskSatirlari, kontrolSatirlari, pdfVerisi, ciktiAdi });
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { cikti: api });
  if (dugum) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
