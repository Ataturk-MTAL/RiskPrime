// Kontrol listeleri ve kütüphaneden ekleme. Her işlem girdiyi değiştirmez, yeni kopya döner.
// Dış kaynaklı (MEB) listede liste adı/kodu ve hazır madde metinleri kilitlidir;
// MEB formundaki nota göre ("Bu forma ekleme veya çıkarma yapılabilir") madde eklenip silinebilir.
(function (kok) {
  'use strict';

  const dugum = typeof module === 'object' && module.exports;
  const model = dugum ? require('./model.js') : kok.RiskPrime.model;

  const CEVAPLAR = Object.freeze(['evet', 'hayir', 'ud', '']);
  const KILIT = 'Dış kaynaklı (MEB) listenin hazır metni değiştirilemez; yalnız cevap ve açıklama girilir.';

  function listeBul(d, id) {
    const l = d.kontrolListeleri.find((x) => x.id === id);
    if (!l) throw new Error(`Kontrol listesi bulunamadı: ${id}`);
    return l;
  }

  function listeleriDegistir(d, id, fn) {
    listeBul(d, id);
    return { ...d, kontrolListeleri: d.kontrolListeleri.map((l) => (l.id === id ? fn(l) : l)) };
  }

  function yeniMadde(no, metin, eklenen) {
    return { id: model.yeniId('m'), no: String(no), metin: metin || '', cevap: '', aciklama: '', ...(eklenen ? { eklenen: true } : {}) };
  }

  /** Kütüphaneden ya da boş liste ekler. sablon: {kod, ad, kaynak, maddeler[{no, metin}]} */
  function listeEkle(d, sablon = {}) {
    const kaynak = sablon.kaynak === 'dis' ? 'dis' : 'ic';
    const liste = {
      id: model.yeniId('k'),
      kod: sablon.kod || '',
      ad: sablon.ad || 'Yeni kontrol listesi',
      kaynak,
      maddeler: (sablon.maddeler || []).map((m) => yeniMadde(m.no, m.metin, false)),
    };
    return { ...d, kontrolListeleri: [...d.kontrolListeleri, liste] };
  }

  function listeGuncelle(d, id, degisiklik) {
    if (listeBul(d, id).kaynak === 'dis') throw new Error(KILIT);
    const yeni = Object.fromEntries(['kod', 'ad'].filter((k) => k in degisiklik).map((k) => [k, String(degisiklik[k])]));
    return listeleriDegistir(d, id, (l) => ({ ...l, ...yeni }));
  }

  function listeSil(d, id) {
    listeBul(d, id);
    return { ...d, kontrolListeleri: d.kontrolListeleri.filter((l) => l.id !== id) };
  }

  function maddeEkle(d, listeId) {
    return listeleriDegistir(d, listeId, (l) => ({
      ...l, maddeler: [...l.maddeler, yeniMadde(l.maddeler.length + 1, '', l.kaynak === 'dis')],
    }));
  }

  function maddeBul(l, maddeId) {
    const m = l.maddeler.find((x) => x.id === maddeId);
    if (!m) throw new Error(`Madde bulunamadı: ${maddeId}`);
    return m;
  }

  /** degisiklik: {cevap, aciklama} her listede; {no, metin} yalnız düzenlenebilir maddede. */
  function maddeGuncelle(d, listeId, maddeId, degisiklik) {
    const l = listeBul(d, listeId);
    const m = maddeBul(l, maddeId);
    if ('cevap' in degisiklik && !CEVAPLAR.includes(degisiklik.cevap)) {
      throw new Error(`Geçersiz cevap: ${degisiklik.cevap}`);
    }
    const metinDegisir = 'metin' in degisiklik || 'no' in degisiklik;
    if (metinDegisir && l.kaynak === 'dis' && !m.eklenen) throw new Error(KILIT);
    const yeni = Object.fromEntries(['no', 'metin', 'cevap', 'aciklama']
      .filter((k) => k in degisiklik).map((k) => [k, String(degisiklik[k])]));
    return listeleriDegistir(d, listeId, (x) => ({
      ...x, maddeler: x.maddeler.map((mm) => (mm.id === maddeId ? { ...mm, ...yeni } : mm)),
    }));
  }

  function maddeSil(d, listeId, maddeId) {
    maddeBul(listeBul(d, listeId), maddeId);
    return listeleriDegistir(d, listeId, (l) => ({ ...l, maddeler: l.maddeler.filter((m) => m.id !== maddeId) }));
  }

  /** Kütüphane mekânını satırlarıyla ekler. sablon: {ad, tur, bina, alan, satirlar[...]} */
  function mekanSablondanEkle(d, sablon) {
    const id = model.yeniId('a');
    const ekli = model.mekanEkle(d, { ...sablon, id });
    return (sablon.satirlar || []).reduce((acc, s) => model.satirEkle(acc, id, s), ekli);
  }

  /** Bir listenin işaretlenme durumu: {toplam, cevaplanan, hayir} */
  function ozet(l) {
    return {
      toplam: l.maddeler.length,
      cevaplanan: l.maddeler.filter((m) => m.cevap).length,
      hayir: l.maddeler.filter((m) => m.cevap === 'hayir').length,
    };
  }

  const api = Object.freeze({
    CEVAPLAR, listeEkle, listeGuncelle, listeSil, maddeEkle, maddeGuncelle, maddeSil, mekanSablondanEkle, ozet,
  });
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { kontrol: api });
  if (dugum) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
