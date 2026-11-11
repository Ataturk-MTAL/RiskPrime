#!/usr/bin/env node
// Planlar/RISK-ANALIZ Typst verisinden veri/baslangic.js üretir.
// Kullanım: node scripts/baslangic-uret.js <RISK-ANALIZ klasörü>
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ALAN = 'Elektrik-Elektronik Teknolojisi';
const DONEM = '2026-2027';
const IMZACI_ANAHTARLARI = ['isGuvenligiUzmani', 'calisanTemsilcisi', 'destekElemani', 'alanSefi', 'okulMuduru'];

function typstVerisi(klasor) {
  const gecici = path.join(klasor, '.riskprime-uret.typ');
  fs.writeFileSync(gecici, '#import "atolye-verisi.typ": labs, gruplar\n#metadata((labs: labs, gruplar: gruplar)) <veri>\n');
  try {
    const cikti = execFileSync(
      'typst',
      ['eval', 'query(<veri>).first().value', '--in', gecici, '--root', klasor, '--format', 'json'],
      { encoding: 'utf8' },
    );
    return JSON.parse(cikti);
  } finally {
    fs.rmSync(gecici, { force: true });
  }
}

function turBul(ad) {
  const kucuk = ad.toLocaleLowerCase('tr');
  if (kucuk.startsWith('tüm')) return 'ortak';
  if (kucuk.includes('depo')) return 'depo';
  if (kucuk.includes('tuvalet')) return 'islak';
  if (kucuk.includes(' odas') || kucuk.includes(' odala')) return 'ofis';
  return 'atolye';
}

const iki = (n) => String(n).padStart(2, '0');

function donustur(veri, okul) {
  const mekanlar = veri.labs.map(([ad, satirlar], i) => ({
    id: `a-${iki(i + 1)}`,
    ad,
    tur: turBul(ad),
    bina: '',
    alan: ALAN,
    // Typst demeti: (alet, tehlike, etkilenen, mevcut, O, Ş, önlem, sorumlu, O2, Ş2); puanlar ekipçe verilir.
    satirlar: satirlar.map(([alet, tehlike, etkilenen, mevcut, , , onlem, sorumlu], j) => ({
      id: `r-${iki(i + 1)}-${iki(j + 1)}`,
      alet, tehlike, etkilenen, mevcut,
      o: null, s: null,
      onlem, sorumlu, bitis: '', durum: 'acik',
      o2: null, s2: null,
    })),
  }));
  const kontrolListeleri = veri.gruplar.map(([ad, maddeler], i) => ({
    id: `k-${iki(i + 1)}`,
    kod: '',
    ad,
    kaynak: 'ic',
    maddeler: maddeler.map((metin, j) => ({
      id: `m-${iki(i + 1)}-${iki(j + 1)}`, no: String(j + 1), metin, cevap: '', aciklama: '',
    })),
  }));
  return {
    surum: 1,
    donem: DONEM,
    degerlendirmeTarihi: '',
    gecerlilikTarihi: '',
    okul: {
      okul: okul.okul,
      kapsam: okul.alan,
      gruplama: 'alan',
      imzacilar: IMZACI_ANAHTARLARI.map((k) => ({ unvan: okul[k].unvan, ad: okul[k].ad })),
    },
    mekanlar,
    kontrolListeleri,
  };
}

function main() {
  const kaynak = process.argv[2];
  if (!kaynak) {
    console.error('Kullanım: node scripts/baslangic-uret.js <RISK-ANALIZ klasörü>');
    process.exit(1);
  }
  const okul = JSON.parse(fs.readFileSync(path.join(kaynak, 'okul.json'), 'utf8'));
  const sonuc = donustur(typstVerisi(kaynak), okul);
  const hedef = path.join(__dirname, '..', 'veri', 'baslangic.js');
  const govde = [
    '// Üretildi: node scripts/baslangic-uret.js <RISK-ANALIZ klasörü>. Elle düzenlemeyin.',
    '(function (kok) {',
    "  'use strict';",
    `  const veri = ${JSON.stringify(sonuc, null, 2)};`,
    '  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { baslangic: veri });',
    "  if (typeof module === 'object' && module.exports) module.exports = veri;",
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.writeFileSync(hedef, govde);
  const satir = sonuc.mekanlar.reduce((t, m) => t + m.satirlar.length, 0);
  console.log(`${hedef}: ${sonuc.mekanlar.length} mekân, ${satir} satır, ${sonuc.kontrolListeleri.length} kontrol listesi`);
}

main();
