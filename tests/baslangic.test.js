const test = require('node:test');
const assert = require('node:assert/strict');
const baslangic = require('../veri/baslangic.js');
const dosya = require('../lib/dosya.js');

test('başlangıç verisi geçerli bir değerlendirme', () => {
  assert.deepEqual(dosya.dogrula(baslangic), []);
});

test('18 mekân, ilki ortak, puanlar boş', () => {
  assert.equal(baslangic.mekanlar.length, 18);
  assert.equal(baslangic.mekanlar[0].tur, 'ortak');
  const satirlar = baslangic.mekanlar.flatMap((m) => m.satirlar);
  assert.ok(satirlar.length > 80, `satır sayısı ${satirlar.length}`);
  assert.ok(satirlar.every((s) => s.o === null && s.s === null && s.o2 === null && s.s2 === null));
});

test('mekân türleri adlardan doğru çıkarılmış', () => {
  const tur = (bas) => baslangic.mekanlar.find((m) => m.ad.startsWith(bas)).tur;
  assert.equal(tur('Elektronik deposu'), 'depo');
  assert.equal(tur('Öğrenci tuvaleti'), 'islak');
  assert.equal(tur('Öğretmen odaları'), 'ofis');
  assert.equal(tur('Şef odası'), 'ofis');
  assert.equal(tur('ELE13'), 'atolye');
});

test('kimlikler tekil', () => {
  const idler = baslangic.mekanlar.flatMap((m) => [m.id, ...m.satirlar.map((s) => s.id)]);
  assert.equal(new Set(idler).size, idler.length);
});

test('okul ve imzacılar okul.json ile dolu', () => {
  assert.equal(baslangic.okul.okul, 'Atatürk Mesleki ve Teknik Anadolu Lisesi');
  assert.equal(baslangic.okul.kapsam, 'Elektrik-Elektronik Teknolojisi Alanı');
  assert.equal(baslangic.okul.imzacilar.length, 5);
});
