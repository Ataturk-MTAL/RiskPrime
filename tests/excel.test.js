const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../lib/model.js');
const excel = require('../lib/excel.js');
const dosya = require('../lib/dosya.js');

const KL_BASLIK = ['Liste Kodu', 'Liste Adı', 'Madde No', 'Madde'];
const RISK_BASLIK = ['Mekân', 'Mekân Türü', 'Bina', 'Alan', 'Alet / Ekipman Grubu', 'Tehlike ve Risk', 'Etkilenen', 'Mevcut Önlem', 'Düzeltici Önlem', 'Sorumlu', 'O', 'Ş'];

function bos() {
  return model.bosDegerlendirme('2026-2027');
}

test('şablon iki sayfa, başlık ve ÖRNEK satırı içerir', () => {
  const s = excel.sablon();
  assert.deepEqual(Object.keys(s), ['Kontrol Listesi', 'Risk Satırları']);
  assert.deepEqual(s['Kontrol Listesi'][0], KL_BASLIK);
  assert.match(String(s['Risk Satırları'][1][0]), /^ÖRNEK/);
});

test('kontrol listesi satırları koda göre gruplanır, dış kaynak olur, ÖRNEK atlanır', () => {
  const sonuc = excel.oku(bos(), {
    'Kontrol Listesi': [
      KL_BASLIK,
      ['ÖRNEK: KL-00', 'x', '1', 'y'],
      ['KL-26', 'Elektrik', '26.01', 'Topraklama var mı?'],
      ['KL-26', 'Elektrik', '26.02', 'Pano kapalı mı?'],
      ['OK-1', 'Okul listesi', '1', 'Kapı açık mı?'],
    ],
  });
  assert.equal(sonuc.hatalar, undefined);
  const l = sonuc.degerlendirme.kontrolListeleri;
  assert.deepEqual(l.map((x) => [x.kod, x.maddeler.length, x.kaynak]), [['KL-26', 2, 'dis'], ['OK-1', 1, 'dis']]);
  assert.deepEqual(dosya.dogrula(sonuc.degerlendirme), []);
});

test('risk satırları mekânı oluşturur ya da adla eşleştirir; sütun sırası serbest', () => {
  let d = model.mekanEkle(bos(), { ad: 'ELE1', tur: 'atolye' });
  const sonuc = excel.oku(d, {
    'Risk Satırları': [
      ['Ş', 'O', ...RISK_BASLIK.slice(0, 10)],
      [5, '3', 'ELE1', 'Atölye', '', '', 'Matkap', 'Kesik', 'Öğrenci', 'Yok', 'Siper', 'Öğretmen'],
      ['', '', 'Depo 1', 'Depo', 'C Blok', 'EET', 'Raf', 'Devrilme', '', '', '', ''],
    ],
  });
  assert.equal(sonuc.hatalar, undefined);
  d = sonuc.degerlendirme;
  assert.equal(d.mekanlar.length, 2);
  assert.deepEqual([d.mekanlar[0].satirlar[0].o, d.mekanlar[0].satirlar[0].s], [3, 5]);
  assert.equal(d.mekanlar[1].tur, 'depo');
  assert.equal(d.mekanlar[1].bina, 'C Blok');
  assert.equal(d.mekanlar[1].satirlar[0].o, null);
  assert.deepEqual(sonuc.ozet, { liste: 0, madde: 0, mekan: 1, satir: 2 });
});

test('hatalı satırda hiçbir şey eklenmez, sayfa ve satır numarasıyla hata verir', () => {
  const d = bos();
  const sonuc = excel.oku(d, {
    'Risk Satırları': [
      RISK_BASLIK,
      ['ELE1', 'Atölye', '', '', 'Matkap', 'Kesik', '', '', '', '', 3, 6],
      ['', 'Uzay', '', '', '', 'Kesik', '', '', '', '', '', ''],
    ],
    'Kontrol Listesi': [KL_BASLIK, ['KL-1', 'A', '1', '']],
  });
  assert.equal(sonuc.degerlendirme, undefined);
  assert.ok(sonuc.hatalar.includes("Risk Satırları, satır 2: Ş 1-5 arası olmalı, '6' yazılmış."));
  assert.ok(sonuc.hatalar.some((h) => h.startsWith('Risk Satırları, satır 3: Mekân boş')));
  assert.ok(sonuc.hatalar.some((h) => h.startsWith('Risk Satırları, satır 3: Mekân Türü')));
  assert.ok(sonuc.hatalar.some((h) => h.startsWith('Kontrol Listesi, satır 2: Madde boş')));
  assert.equal(d.mekanlar.length, 0);
});

test('eksik başlık ya da tanınmayan sayfa hata verir', () => {
  assert.match(excel.oku(bos(), { 'Kontrol Listesi': [['Liste Kodu', 'Madde']] }).hatalar[0], /Liste Adı/);
  assert.match(excel.oku(bos(), { Sayfa1: [['a']] }).hatalar[0], /"Kontrol Listesi" ya da "Risk Satırları"/);
});

test('aynı koddaki liste değiştirilir ya da yanına eklenir', () => {
  const sayfalar = { 'Kontrol Listesi': [KL_BASLIK, ['KL-26', 'Yeni ad', '1', 'Yeni madde']] };
  let d = excel.oku(bos(), sayfalar).degerlendirme;
  assert.deepEqual(excel.cakisanKodlar(d, sayfalar), ['KL-26']);
  const degisti = excel.oku(d, sayfalar, { ayniKod: 'degistir' }).degerlendirme;
  assert.equal(degisti.kontrolListeleri.length, 1);
  assert.equal(degisti.kontrolListeleri[0].ad, 'Yeni ad');
  d = excel.oku(d, sayfalar, { ayniKod: 'ekle' }).degerlendirme;
  assert.equal(d.kontrolListeleri.length, 2);
});
