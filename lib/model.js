// Değerlendirme verisi üzerinde işlemler. Her işlem girdiyi değiştirmez, yeni kopya döner.
(function (kok) {
  'use strict';

  const dugum = typeof module === 'object' && module.exports;
  const matris = dugum ? require('./matris.js') : kok.RiskPrime.matris;

  const SURUM = 1;
  const TURLER = Object.freeze(['atolye', 'depo', 'ofis', 'islak', 'ortak']);
  const GRUPLAMALAR = Object.freeze(['alan', 'bina', 'yok']);
  const DURUMLAR = Object.freeze(['acik', 'tamam']);
  const VARSAYILAN_IMZACILAR = Object.freeze([
    'İş Güvenliği Uzmanı', 'Çalışan Temsilcisi', 'Destek Elemanı', 'Alan Şefi', 'İşveren / Okul Müdürü',
  ]);
  const UST_ALANLAR = ['donem', 'degerlendirmeTarihi', 'gecerlilikTarihi'];
  const OKUL_ALANLAR = ['okul', 'kapsam', 'gruplama'];
  const MEKAN_ALANLAR = ['ad', 'tur', 'bina', 'alan'];
  const SATIR_ALANLAR = ['alet', 'tehlike', 'etkilenen', 'mevcut', 'o', 's', 'onlem', 'sorumlu', 'bitis', 'durum', 'o2', 's2'];
  const PUAN_ALANLAR = ['o', 's', 'o2', 's2'];

  function yeniId(onek) {
    const c = kok.crypto;
    const govde = c && typeof c.randomUUID === 'function'
      ? c.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    return `${onek}-${govde}`;
  }

  /** Nesneden yalnız izinli anahtarları alır. */
  function sec(nesne, anahtarlar) {
    return Object.fromEntries(anahtarlar.filter((k) => k in nesne).map((k) => [k, nesne[k]]));
  }

  function bosDegerlendirme(donem = '') {
    return {
      surum: SURUM,
      donem,
      degerlendirmeTarihi: '',
      gecerlilikTarihi: '',
      okul: {
        okul: '',
        kapsam: '',
        gruplama: 'alan',
        imzacilar: VARSAYILAN_IMZACILAR.map((unvan) => ({ unvan, ad: '' })),
      },
      mekanlar: [],
      kontrolListeleri: [],
    };
  }

  function bosSatir(id) {
    return {
      id: id || yeniId('r'),
      alet: '', tehlike: '', etkilenen: '', mevcut: '',
      o: null, s: null,
      onlem: '', sorumlu: '', bitis: '', durum: 'acik',
      o2: null, s2: null,
    };
  }

  function ustBilgiGuncelle(d, degisiklik) {
    return { ...d, ...sec(degisiklik, UST_ALANLAR) };
  }

  function okulGuncelle(d, degisiklik) {
    const yeni = sec(degisiklik, OKUL_ALANLAR);
    if ('gruplama' in yeni && !GRUPLAMALAR.includes(yeni.gruplama)) {
      throw new Error(`Geçersiz gruplama: ${yeni.gruplama}`);
    }
    return { ...d, okul: { ...d.okul, ...yeni } };
  }

  function imzacilariDegistir(d, fn) {
    return { ...d, okul: { ...d.okul, imzacilar: fn(d.okul.imzacilar) } };
  }

  function siraKontrol(liste, sira) {
    if (!Number.isInteger(sira) || sira < 0 || sira >= liste.length) {
      throw new Error(`İmzacı bulunamadı: ${sira}`);
    }
  }

  function imzaciEkle(d, unvan = '') {
    return imzacilariDegistir(d, (ls) => [...ls, { unvan, ad: '' }]);
  }

  function imzaciGuncelle(d, sira, degisiklik) {
    return imzacilariDegistir(d, (ls) => {
      siraKontrol(ls, sira);
      return ls.map((x, i) => (i === sira ? { ...x, ...sec(degisiklik, ['unvan', 'ad']) } : x));
    });
  }

  function imzaciSil(d, sira) {
    return imzacilariDegistir(d, (ls) => {
      siraKontrol(ls, sira);
      return ls.filter((_, i) => i !== sira);
    });
  }

  function mekanBul(d, id) {
    const m = d.mekanlar.find((x) => x.id === id);
    if (!m) throw new Error(`Mekân bulunamadı: ${id}`);
    return m;
  }

  function turKontrol(tur) {
    if (!TURLER.includes(tur)) throw new Error(`Geçersiz mekân türü: ${tur}`);
  }

  function mekanEkle(d, girdi = {}) {
    const tur = girdi.tur || 'atolye';
    turKontrol(tur);
    const mekan = {
      id: girdi.id || yeniId('a'),
      ad: (girdi.ad || '').trim() || 'Yeni mekân',
      tur,
      bina: (girdi.bina || '').trim(),
      alan: (girdi.alan || '').trim(),
      satirlar: [],
    };
    return { ...d, mekanlar: [...d.mekanlar, mekan] };
  }

  function mekanGuncelle(d, id, degisiklik) {
    mekanBul(d, id);
    const yeni = sec(degisiklik, MEKAN_ALANLAR);
    if ('tur' in yeni) turKontrol(yeni.tur);
    return { ...d, mekanlar: d.mekanlar.map((m) => (m.id === id ? { ...m, ...yeni } : m)) };
  }

  function mekanSil(d, id) {
    mekanBul(d, id);
    return { ...d, mekanlar: d.mekanlar.filter((m) => m.id !== id) };
  }

  /** yon: -1 yukarı, +1 aşağı. Uçtaysa aynı nesneyi döner. */
  function mekanTasi(d, id, yon) {
    const i = d.mekanlar.findIndex((m) => m.id === id);
    if (i < 0) throw new Error(`Mekân bulunamadı: ${id}`);
    const j = i + yon;
    if (j < 0 || j >= d.mekanlar.length) return d;
    const yeni = [...d.mekanlar];
    [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
    return { ...d, mekanlar: yeni };
  }

  function satirDegerKontrol(degisiklik) {
    for (const k of PUAN_ALANLAR) {
      if (k in degisiklik && degisiklik[k] !== null && !matris.gecerliPuan(degisiklik[k])) {
        throw new Error(`${k} 1-5 arası tam sayı ya da boş olmalı: ${degisiklik[k]}`);
      }
    }
    if ('durum' in degisiklik && !DURUMLAR.includes(degisiklik.durum)) {
      throw new Error(`Geçersiz durum: ${degisiklik.durum}`);
    }
  }

  function satirlariDegistir(d, mekanId, fn) {
    mekanBul(d, mekanId);
    return {
      ...d,
      mekanlar: d.mekanlar.map((m) => (m.id === mekanId ? { ...m, satirlar: fn(m.satirlar) } : m)),
    };
  }

  function satirVarMi(satirlar, satirId) {
    if (!satirlar.some((x) => x.id === satirId)) throw new Error(`Satır bulunamadı: ${satirId}`);
  }

  function satirEkle(d, mekanId, girdi = {}) {
    const deger = sec(girdi, SATIR_ALANLAR);
    satirDegerKontrol(deger);
    const satir = { ...bosSatir(girdi.id), ...deger };
    return satirlariDegistir(d, mekanId, (ss) => [...ss, satir]);
  }

  function satirGuncelle(d, mekanId, satirId, degisiklik) {
    const deger = sec(degisiklik, SATIR_ALANLAR);
    satirDegerKontrol(deger);
    return satirlariDegistir(d, mekanId, (ss) => {
      satirVarMi(ss, satirId);
      return ss.map((x) => (x.id === satirId ? { ...x, ...deger } : x));
    });
  }

  function satirSil(d, mekanId, satirId) {
    return satirlariDegistir(d, mekanId, (ss) => {
      satirVarMi(ss, satirId);
      return ss.filter((x) => x.id !== satirId);
    });
  }

  /** Mekânlarda kullanılmış bina ya da alan etiketleri, alfabetik. */
  function etiketler(d, anahtar) {
    const kume = new Set(d.mekanlar.map((m) => m[anahtar]).filter(Boolean));
    return [...kume].sort((a, b) => a.localeCompare(b, 'tr'));
  }

  /** okul.gruplama'ya göre mekân grupları; sıra mekân sırasını izler. */
  function gruplu(d) {
    const g = d.okul.gruplama;
    if (g === 'yok') return [{ baslik: '', mekanlar: d.mekanlar }];
    const gruplar = new Map();
    for (const m of d.mekanlar) {
      const baslik = m[g] || '(Belirtilmemiş)';
      gruplar.set(baslik, [...(gruplar.get(baslik) || []), m]);
    }
    return [...gruplar].map(([baslik, mekanlar]) => ({ baslik, mekanlar }));
  }

  const api = Object.freeze({
    SURUM, TURLER, GRUPLAMALAR, DURUMLAR,
    yeniId, bosDegerlendirme, bosSatir,
    ustBilgiGuncelle, okulGuncelle,
    imzaciEkle, imzaciGuncelle, imzaciSil,
    mekanEkle, mekanGuncelle, mekanSil, mekanTasi,
    satirEkle, satirGuncelle, satirSil,
    etiketler, gruplu,
  });
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { model: api });
  if (dugum) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
