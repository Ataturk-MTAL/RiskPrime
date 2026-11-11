#!/usr/bin/env node
// Hazır kütüphaneyi üretir: veri/kutuphane.js
//  - MEB Risk Değerlendirme Kontrol Listeleri (KL-01..KL-43), PDF metninden aynen (kaynak "dis", metin kilitli).
//  - Elektrik-Elektronik hazır kontrol listeleri ve mekânları (veri/baslangic.js'ten).
// Kullanım: node scripts/kl-uret.js <MEB-Risk-Degerlendirme-Kontrol-Listeleri-KL01-KL43.pdf>  (pdftotext gerekir)
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MADDE = /^\s{0,3}(\d{1,2})[.,](\d{1,2})\s+(\S.*)$/;
const DEVAM = /^\s{4,}[^\s*]/;
const BASLIK_GURULTU = /^(Tarih|Kontrol|Listesi|GEREKLİ|DEĞİL|KL\s*-?\s*\d+|\.)/;
const SAYFA_BASI = 'RİSK DEĞERLENDİRME KONTROL LİSTELERİ';
const ISG = 'İŞ SAĞLIĞI VE GÜVENLİĞİ';

// Sağdaki Tarih/EVET/HAYIR sütunlarını at: 3+ boşluktan önceki ilk parça.
const solParca = (satir) => satir.trim().split(/\s{3,}/)[0];
const maddeNo = (a, b) => `${Number(a)}.${b.padEnd(2, '0')}`;

/** pdftotext -layout metnini [{kod, ad, maddeler[{no, metin}]}] listesine çevirir. */
function klAyristir(metin) {
  const listeler = new Map();
  let baslik = null; // başlık toplanıyorsa satır dizisi
  let bekleyenBaslik = null;
  let maddeAkisi = false;
  let durdu = false; // NOT/ÖNERİLER sonrası, yeni S.NO'ya kadar
  let son = null;

  for (const satir of metin.split('\n')) {
    const duz = satir.trim();
    if (duz.startsWith(SAYFA_BASI)) { maddeAkisi = !durdu; continue; }
    if (duz.includes(ISG)) {
      baslik = [];
      maddeAkisi = false;
      const kalan = solParca(duz.slice(duz.indexOf(ISG) + ISG.length));
      if (kalan && !BASLIK_GURULTU.test(kalan)) baslik.push(kalan);
      continue;
    }
    if (duz.startsWith('S.NO')) {
      if (baslik) {
        bekleyenBaslik = baslik.join(' ')
          .replace(/\s*K[Ll]\s*[–-]\s*\d+\s*/g, ' ') // başlığa karışan "KL – 03"
          .replace(/\.{3,}/g, '…')
          .replace(/\s+/g, ' ').trim();
      }
      baslik = null;
      maddeAkisi = true;
      durdu = false;
      continue;
    }
    if (baslik) {
      const parca = solParca(satir);
      if (parca && !BASLIK_GURULTU.test(parca)) baslik.push(parca);
      continue;
    }
    if (/^(NOT:|ÖNERİLER)/.test(duz)) { durdu = true; maddeAkisi = false; son = null; continue; }
    if (/İş Güvenliği Uzmanı|^İmza/.test(duz)) { maddeAkisi = false; son = null; continue; }
    if (!maddeAkisi) continue;
    const m = satir.match(MADDE);
    if (m) {
      const kod = `KL-${m[1].padStart(2, '0')}`;
      if (!listeler.has(kod)) listeler.set(kod, { kod, ad: bekleyenBaslik || kod, maddeler: [] });
      bekleyenBaslik = null;
      son = { no: maddeNo(m[1], m[2]), metin: solParca(m[3]) };
      listeler.get(kod).maddeler.push(son);
    } else if (son && DEVAM.test(satir)) {
      son.metin = `${son.metin} ${solParca(satir)}`;
    }
  }
  return [...listeler.values()];
}

function baslangicOku() {
  require('../veri/baslangic.js'); // globalThis.RiskPrime.baslangic'i doldurur
  return globalThis.RiskPrime.baslangic;
}

function kutuphaneUret(pdf) {
  const metin = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
  const meb = klAyristir(metin).map((k) => ({ ...k, kaynak: 'dis', grup: 'MEB Kontrol Listeleri' }));
  const b = baslangicOku();
  const eet = b.kontrolListeleri.map(({ kod, ad, kaynak, maddeler }) => ({
    kod, ad, kaynak, grup: 'Elektrik-Elektronik hazır form',
    maddeler: maddeler.map(({ no, metin: mm }) => ({ no, metin: mm })),
  }));
  const mekanlar = b.mekanlar.map(({ ad, tur, bina, alan, satirlar }) => ({
    ad, tur, bina, alan,
    satirlar: satirlar.map(({ id, ...s }) => s),
  }));
  return { kontrolListeleri: [...eet, ...meb], mekanlar };
}

if (require.main === module) {
  const pdf = process.argv[2];
  if (!pdf) {
    console.error('Kullanım: node scripts/kl-uret.js <KL01-KL43 PDF>');
    process.exit(1);
  }
  const k = kutuphaneUret(pdf);
  const govde = `// Üretildi: node scripts/kl-uret.js <KL PDF>. Elle düzenlemeyin.
(function (kok) {
  'use strict';
  const veri = ${JSON.stringify(k, null, 1)};
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { kutuphane: veri });
})(typeof window !== 'undefined' ? window : globalThis);
`;
  fs.writeFileSync(path.join(__dirname, '..', 'veri', 'kutuphane.js'), govde);
  const meb = k.kontrolListeleri.filter((l) => l.kaynak === 'dis');
  console.log(`${k.mekanlar.length} mekân, ${k.kontrolListeleri.length - meb.length} hazır liste, ${meb.length} MEB listesi (${meb.reduce((t, l) => t + l.maddeler.length, 0)} madde)`);
}

module.exports = { klAyristir };
