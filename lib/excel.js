// Excel içe alma: şablon satırları ve sayfa okuma. SheetJS'ten bağımsız; sayfalar dizi dizisi (aoa) olarak gelir.
// Doğrulama hepsi-ya-hiç: tek satırda hata varsa hiçbir şey eklenmez.
(function (kok) {
  'use strict';

  const dugum = typeof module === 'object' && module.exports;
  const model = dugum ? require('./model.js') : kok.RiskPrime.model;
  const kontrol = dugum ? require('./kontrol.js') : kok.RiskPrime.kontrol;

  const SAYFA_KL = 'Kontrol Listesi';
  const SAYFA_RISK = 'Risk Satırları';
  const KL_SUTUNLARI = [['kod', 'Liste Kodu'], ['ad', 'Liste Adı'], ['no', 'Madde No'], ['metin', 'Madde']];
  const RISK_SUTUNLARI = [
    ['mekan', 'Mekân'], ['tur', 'Mekân Türü'], ['bina', 'Bina'], ['alan', 'Alan'],
    ['alet', 'Alet / Ekipman Grubu'], ['tehlike', 'Tehlike ve Risk'], ['etkilenen', 'Etkilenen'],
    ['mevcut', 'Mevcut Önlem'], ['onlem', 'Düzeltici Önlem'], ['sorumlu', 'Sorumlu'], ['o', 'O'], ['s', 'Ş'],
  ];
  const ORNEK = /^ÖRNEK/i;

  const kucuk = (x) => String(x).toLocaleLowerCase('tr').replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
  const hucre = (x) => (x === null || x === undefined ? '' : String(x).trim());

  // Türkçe ad ya da kod → tür kodu ("Ofis / oda" ve "ofis" ikisi de geçer).
  const TUR_ESLEME = new Map(Object.entries(model.TUR_ADLARI).flatMap(([kod, ad]) => [
    [kucuk(kod), kod], [kucuk(ad), kod], [kucuk(ad.split(/[ /(]/)[0]), kod],
  ]));

  function sablon() {
    return {
      [SAYFA_KL]: [
        KL_SUTUNLARI.map(([, b]) => b),
        ['ÖRNEK: KL-26', 'Elektrikli Tesisat ve Ekipmanlar', '26.01', 'Elektrik tesisatının bakım ve onarımı yetkili kişilerce mi yapılıyor?'],
      ],
      [SAYFA_RISK]: [
        RISK_SUTUNLARI.map(([, b]) => b),
        ['ÖRNEK: ELE16', 'Atölye', 'C Blok', 'Elektrik-Elektronik', 'Matkap', 'Dönen uca saç kapılması', 'Öğrenci', 'Talimat', 'Siperlik, saç bonesi', 'Atölye öğretmeni', 3, 4],
      ],
    };
  }

  /** Başlık satırından {anahtar: sütun no}; eksik başlık varsa hata listesi. */
  function sutunlar(baslikSatiri, tanim, sayfa) {
    const yer = new Map((baslikSatiri || []).map((b, i) => [kucuk(hucre(b)), i]));
    const eksik = tanim.filter(([, b]) => !yer.has(kucuk(b))).map(([, b]) => b);
    if (eksik.length) return { hatalar: [`${sayfa}: başlık satırında eksik sütun: ${eksik.join(', ')}.`] };
    return { yer: Object.fromEntries(tanim.map(([k, b]) => [k, yer.get(kucuk(b))])) };
  }

  /** Veri satırlarını {satirNo, deger} olarak verir; boş satırlar ve ilk hücresi "ÖRNEK" ile başlayanlar atlanır. */
  function satirlar(aoa, yer, ilkAnahtar) {
    return aoa.slice(1).map((r, i) => ({
      satirNo: i + 2,
      deger: Object.fromEntries(Object.entries(yer).map(([k, j]) => [k, hucre(r[j])])),
    })).filter(({ deger }) => Object.values(deger).some(Boolean) && !ORNEK.test(deger[ilkAnahtar]));
  }

  function puan(metin, etiket, h) {
    if (metin === '') return null;
    const p = Number(metin);
    if (!Number.isInteger(p) || p < 1 || p > 5) h.push(`${etiket} 1-5 arası olmalı, '${metin}' yazılmış.`);
    return p;
  }

  function klOku(aoa, h) {
    const s = sutunlar(aoa[0], KL_SUTUNLARI, SAYFA_KL);
    if (s.hatalar) { h.push(...s.hatalar); return []; }
    const gruplar = new Map();
    for (const { satirNo, deger: v } of satirlar(aoa, s.yer, 'kod')) {
      const yaz = (m) => h.push(`${SAYFA_KL}, satır ${satirNo}: ${m}`);
      if (!v.kod) yaz('Liste Kodu boş.');
      if (!v.metin) yaz('Madde boş.');
      const g = gruplar.get(v.kod) || { kod: v.kod, ad: '', kaynak: 'dis', maddeler: [] };
      gruplar.set(v.kod, {
        ...g,
        ad: g.ad || v.ad,
        maddeler: [...g.maddeler, { no: v.no || String(g.maddeler.length + 1), metin: v.metin }],
      });
    }
    return [...gruplar.values()].map((g) => ({ ...g, ad: g.ad || g.kod }));
  }

  function riskOku(aoa, h) {
    const s = sutunlar(aoa[0], RISK_SUTUNLARI, SAYFA_RISK);
    if (s.hatalar) { h.push(...s.hatalar); return []; }
    return satirlar(aoa, s.yer, 'mekan').map(({ satirNo, deger: v }) => {
      const yerel = [];
      if (!v.mekan) yerel.push('Mekân boş.');
      const tur = v.tur ? TUR_ESLEME.get(kucuk(v.tur)) : '';
      if (tur === undefined) yerel.push(`Mekân Türü '${v.tur}' tanınmadı; Atölye, Depo, Ofis, Islak hacim ya da Ortak yazın.`);
      if (!v.tehlike) yerel.push('Tehlike ve Risk boş.');
      const o = puan(v.o, 'O', yerel);
      const sd = puan(v.s, 'Ş', yerel);
      h.push(...yerel.map((m) => `${SAYFA_RISK}, satır ${satirNo}: ${m}`));
      return { ...v, tur, o, s: sd };
    });
  }

  function sayfaAl(sayfalar, ad) {
    const anahtar = Object.keys(sayfalar).find((k) => kucuk(k) === kucuk(ad));
    return anahtar ? sayfalar[anahtar] : null;
  }

  /** İçe alınacak listelerden bu değerlendirmede kodu zaten olanlar. */
  function cakisanKodlar(d, sayfalar) {
    const kl = sayfaAl(sayfalar, SAYFA_KL);
    if (!kl) return [];
    const mevcut = new Set(d.kontrolListeleri.map((l) => l.kod).filter(Boolean));
    return [...new Set(klOku(kl, []).map((l) => l.kod))].filter((k) => mevcut.has(k));
  }

  function riskUygula(d, riskler) {
    let sonuc = d;
    let yeniMekan = 0;
    for (const r of riskler) {
      let m = sonuc.mekanlar.find((x) => kucuk(x.ad) === kucuk(r.mekan));
      if (!m) {
        sonuc = model.mekanEkle(sonuc, { ad: r.mekan, tur: r.tur || 'atolye', bina: r.bina, alan: r.alan });
        m = sonuc.mekanlar[sonuc.mekanlar.length - 1];
        yeniMekan += 1;
      }
      const { alet, tehlike, etkilenen, mevcut, onlem, sorumlu, o, s } = r;
      sonuc = model.satirEkle(sonuc, m.id, { alet, tehlike, etkilenen, mevcut, onlem, sorumlu, o, s });
    }
    return { sonuc, yeniMekan };
  }

  /**
   * sayfalar: {sayfaAdı: aoa}. secenek.ayniKod: 'ekle' (varsayılan) | 'degistir'.
   * Döner: {degerlendirme, ozet} ya da {hatalar}. Girdiyi değiştirmez.
   */
  function oku(d, sayfalar, secenek = {}) {
    const klAoa = sayfaAl(sayfalar, SAYFA_KL);
    const riskAoa = sayfaAl(sayfalar, SAYFA_RISK);
    if (!klAoa && !riskAoa) return { hatalar: [`Dosyada "${SAYFA_KL}" ya da "${SAYFA_RISK}" adlı sayfa yok. Şablonu indirip kullanın.`] };
    const h = [];
    const listeler = klAoa ? klOku(klAoa, h) : [];
    const riskler = riskAoa ? riskOku(riskAoa, h) : [];
    if (h.length) return { hatalar: h };

    const kodlar = new Set(listeler.map((l) => l.kod));
    const taban = secenek.ayniKod === 'degistir'
      ? { ...d, kontrolListeleri: d.kontrolListeleri.filter((l) => !kodlar.has(l.kod)) }
      : d;
    const listeli = listeler.reduce((acc, l) => kontrol.listeEkle(acc, l), taban);
    const { sonuc, yeniMekan } = riskUygula(listeli, riskler);
    return {
      degerlendirme: sonuc,
      ozet: {
        liste: listeler.length,
        madde: listeler.reduce((t, l) => t + l.maddeler.length, 0),
        mekan: yeniMekan,
        satir: riskler.length,
      },
    };
  }

  const api = Object.freeze({ SAYFA_KL, SAYFA_RISK, sablon, oku, cakisanKodlar });
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { excel: api });
  if (dugum) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
