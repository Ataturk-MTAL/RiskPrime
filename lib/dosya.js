// Değerlendirme dosyasını (JSON) okuma, yazma ve doğrulama.
(function (kok) {
  'use strict';

  const dugum = typeof module === 'object' && module.exports;
  const model = dugum ? require('./model.js') : kok.RiskPrime.model;
  const matris = dugum ? require('./matris.js') : kok.RiskPrime.matris;

  const CEVAPLAR = ['evet', 'hayir', 'ud', ''];
  const KAYNAKLAR = ['ic', 'dis'];

  const metinMi = (x) => typeof x === 'string';
  const nesneMi = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  const puanMi = (x) => x === null || matris.gecerliPuan(x);

  function metinAlanlari(nesne, anahtarlar, yol, hatalar) {
    for (const k of anahtarlar) {
      if (!metinMi(nesne[k])) hatalar.push(`${yol}.${k}: metin olmalı.`);
    }
  }

  function okulDogrula(o, h) {
    if (!nesneMi(o)) { h.push('okul: eksik.'); return; }
    metinAlanlari(o, ['okul', 'kapsam'], 'okul', h);
    if (!model.GRUPLAMALAR.includes(o.gruplama)) {
      h.push(`okul.gruplama: ${model.GRUPLAMALAR.join(', ')} değerlerinden biri olmalı.`);
    }
    if (!Array.isArray(o.imzacilar)) { h.push('okul.imzacilar: liste olmalı.'); return; }
    o.imzacilar.forEach((x, i) => {
      if (!nesneMi(x) || !metinMi(x.unvan) || !metinMi(x.ad)) h.push(`okul.imzacilar[${i}]: unvan ve ad metin olmalı.`);
    });
  }

  function satirDogrula(s, yol, h) {
    if (!nesneMi(s)) { h.push(`${yol}: nesne olmalı.`); return; }
    metinAlanlari(s, ['id', 'alet', 'tehlike', 'etkilenen', 'mevcut', 'onlem', 'sorumlu', 'bitis'], yol, h);
    for (const k of ['o', 's', 'o2', 's2']) {
      if (!puanMi(s[k])) h.push(`${yol}.${k}: 1-5 arası tam sayı ya da boş olmalı.`);
    }
    if (!model.DURUMLAR.includes(s.durum)) h.push(`${yol}.durum: ${model.DURUMLAR.join(' ya da ')} olmalı.`);
  }

  function mekanDogrula(m, yol, h) {
    if (!nesneMi(m)) { h.push(`${yol}: nesne olmalı.`); return; }
    metinAlanlari(m, ['id', 'ad', 'bina', 'alan'], yol, h);
    if (!model.TURLER.includes(m.tur)) h.push(`${yol}.tur: ${model.TURLER.join(', ')} değerlerinden biri olmalı.`);
    if (!Array.isArray(m.satirlar)) { h.push(`${yol}.satirlar: liste olmalı.`); return; }
    m.satirlar.forEach((s, j) => satirDogrula(s, `${yol}.satirlar[${j}]`, h));
  }

  function listeDogrula(l, yol, h) {
    if (!nesneMi(l)) { h.push(`${yol}: nesne olmalı.`); return; }
    metinAlanlari(l, ['id', 'kod', 'ad'], yol, h);
    if (!KAYNAKLAR.includes(l.kaynak)) h.push(`${yol}.kaynak: ic ya da dis olmalı.`);
    if (!Array.isArray(l.maddeler)) { h.push(`${yol}.maddeler: liste olmalı.`); return; }
    l.maddeler.forEach((x, j) => {
      const y = `${yol}.maddeler[${j}]`;
      if (!nesneMi(x)) { h.push(`${y}: nesne olmalı.`); return; }
      metinAlanlari(x, ['id', 'no', 'metin', 'aciklama'], y, h);
      if (!CEVAPLAR.includes(x.cevap)) h.push(`${y}.cevap: evet, hayir, ud ya da boş olmalı.`);
    });
  }

  /** Hata listesi döner; boşsa dosya geçerlidir. */
  function dogrula(v) {
    if (!nesneMi(v)) return ['Dosya bir değerlendirme nesnesi değil.'];
    if (Number.isInteger(v.surum) && v.surum > model.SURUM) {
      return [`Bu dosya daha yeni bir RiskPrime sürümüyle oluşturulmuş (sürüm ${v.surum}). Sayfanın güncel sürümünü kullanın.`];
    }
    const h = [];
    if (v.surum !== model.SURUM) h.push(`surum: ${model.SURUM} olmalı.`);
    metinAlanlari(v, ['donem', 'degerlendirmeTarihi', 'gecerlilikTarihi'], 'dosya', h);
    okulDogrula(v.okul, h);
    if (!Array.isArray(v.mekanlar)) h.push('mekanlar: liste olmalı.');
    else v.mekanlar.forEach((m, i) => mekanDogrula(m, `mekanlar[${i}]`, h));
    if (!Array.isArray(v.kontrolListeleri)) h.push('kontrolListeleri: liste olmalı.');
    else v.kontrolListeleri.forEach((l, i) => listeDogrula(l, `kontrolListeleri[${i}]`, h));
    return h;
  }

  /** Metni okur: { degerlendirme } ya da { hatalar }. */
  function oku(metin) {
    let veri;
    try {
      veri = JSON.parse(metin);
    } catch {
      return { hatalar: ['Dosya okunamadı: geçerli bir JSON değil.'] };
    }
    const hatalar = dogrula(veri);
    return hatalar.length ? { hatalar } : { degerlendirme: veri };
  }

  function yaz(d) {
    return `${JSON.stringify(d, null, 2)}\n`;
  }

  function dosyaAdi(d) {
    const donem = (d.donem || '').replace(/[^0-9A-Za-z-]+/g, '-').replace(/^-+|-+$/g, '');
    return `risk-${donem || 'degerlendirme'}.json`;
  }

  const api = Object.freeze({ dogrula, oku, yaz, dosyaAdi });
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { dosya: api });
  if (dugum) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
