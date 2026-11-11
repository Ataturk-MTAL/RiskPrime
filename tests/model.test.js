const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../lib/model.js');

function ornek() {
  let d = m.bosDegerlendirme('2026-2027');
  d = m.mekanEkle(d, { id: 'a-1', ad: 'ELE1', bina: 'C Blok', alan: 'Elektrik-Elektronik' });
  d = m.mekanEkle(d, { id: 'a-2', ad: 'Depo', tur: 'depo', bina: 'A Blok' });
  d = m.satirEkle(d, 'a-1', { id: 'r-1', tehlike: 'Çarpma', o: 3, s: 5 });
  return d;
}

test('boş değerlendirme beş varsayılan imzacıyla gelir', () => {
  const d = m.bosDegerlendirme('2026-2027');
  assert.equal(d.surum, 1);
  assert.equal(d.donem, '2026-2027');
  assert.equal(d.okul.imzacilar.length, 5);
  assert.deepEqual(d.mekanlar, []);
});

test('işlemler girdiyi değiştirmez', () => {
  const d = ornek();
  const anlik = JSON.stringify(d);
  m.mekanEkle(d, { ad: 'X' });
  m.mekanGuncelle(d, 'a-1', { ad: 'Y' });
  m.mekanSil(d, 'a-2');
  m.mekanTasi(d, 'a-2', -1);
  m.satirEkle(d, 'a-1', {});
  m.satirGuncelle(d, 'a-1', 'r-1', { o: 1 });
  m.satirSil(d, 'a-1', 'r-1');
  m.okulGuncelle(d, { okul: 'Z' });
  m.imzaciEkle(d, 'X');
  assert.equal(JSON.stringify(d), anlik);
});

test('mekân ekle, güncelle, sil', () => {
  let d = ornek();
  assert.equal(d.mekanlar.length, 2);
  assert.equal(d.mekanlar[1].tur, 'depo');
  d = m.mekanGuncelle(d, 'a-1', { ad: 'ELE1 Haberleşme', id: 'kotu' });
  assert.equal(d.mekanlar[0].ad, 'ELE1 Haberleşme');
  assert.equal(d.mekanlar[0].id, 'a-1', 'id değiştirilemez');
  d = m.mekanSil(d, 'a-2');
  assert.deepEqual(d.mekanlar.map((x) => x.id), ['a-1']);
});

test('boş adlı mekân "Yeni mekân" olur, id üretilir', () => {
  const d = m.mekanEkle(m.bosDegerlendirme(), {});
  assert.equal(d.mekanlar[0].ad, 'Yeni mekân');
  assert.match(d.mekanlar[0].id, /^a-/);
});

test('geçersiz tür ve bilinmeyen kimlik hata verir', () => {
  const d = ornek();
  assert.throws(() => m.mekanEkle(d, { tur: 'mutfak' }), /Geçersiz mekân türü/);
  assert.throws(() => m.mekanGuncelle(d, 'yok', { ad: 'x' }), /Mekân bulunamadı/);
  assert.throws(() => m.satirGuncelle(d, 'a-1', 'yok', { o: 1 }), /Satır bulunamadı/);
});

test('mekân taşıma uçlarda değişmez', () => {
  let d = ornek();
  d = m.mekanTasi(d, 'a-2', -1);
  assert.deepEqual(d.mekanlar.map((x) => x.id), ['a-2', 'a-1']);
  assert.equal(m.mekanTasi(d, 'a-2', -1), d);
});

test('satır puanı 1-5 ya da null olmalı', () => {
  let d = ornek();
  d = m.satirGuncelle(d, 'a-1', 'r-1', { o: null, s2: 4 });
  const s = d.mekanlar[0].satirlar[0];
  assert.equal(s.o, null);
  assert.equal(s.s2, 4);
  assert.throws(() => m.satirGuncelle(d, 'a-1', 'r-1', { s: 6 }), /1-5/);
  assert.throws(() => m.satirGuncelle(d, 'a-1', 'r-1', { durum: 'bitti' }), /Geçersiz durum/);
});

test('yeni satır boş alanlarla gelir', () => {
  const d = m.satirEkle(ornek(), 'a-2', {});
  const s = d.mekanlar[1].satirlar[0];
  assert.equal(s.durum, 'acik');
  assert.equal(s.o, null);
  assert.match(s.id, /^r-/);
});

test('imzacı ekle, güncelle, sil', () => {
  let d = m.bosDegerlendirme();
  d = m.imzaciGuncelle(d, 4, { ad: '' });
  assert.equal(d.okul.imzacilar[4].ad, '');
  d = m.imzaciEkle(d, 'Atölye Öğretmeni');
  assert.equal(d.okul.imzacilar.length, 6);
  d = m.imzaciSil(d, 0);
  assert.equal(d.okul.imzacilar[0].unvan, 'Çalışan Temsilcisi');
  assert.throws(() => m.imzaciSil(d, 99), /İmzacı bulunamadı/);
});

test('etiketler tekil ve alfabetik', () => {
  const d = ornek();
  assert.deepEqual(m.etiketler(d, 'bina'), ['A Blok', 'C Blok']);
  assert.deepEqual(m.etiketler(d, 'alan'), ['Elektrik-Elektronik']);
});

test('gruplama alana, binaya göre ya da yok', () => {
  let d = ornek();
  assert.deepEqual(m.gruplu(d).map((g) => g.baslik), ['Elektrik-Elektronik', '(Belirtilmemiş)']);
  d = m.okulGuncelle(d, { gruplama: 'bina' });
  assert.deepEqual(m.gruplu(d).map((g) => g.baslik), ['C Blok', 'A Blok']);
  d = m.okulGuncelle(d, { gruplama: 'yok' });
  assert.equal(m.gruplu(d).length, 1);
  assert.throws(() => m.okulGuncelle(d, { gruplama: 'kat' }), /Geçersiz gruplama/);
});
