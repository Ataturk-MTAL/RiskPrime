const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../lib/model.js');
const kontrol = require('../lib/kontrol.js');
const dosya = require('../lib/dosya.js');

const MEB = { kod: 'KL-26', ad: 'ELEKTRİKLİ TESİSAT', kaynak: 'dis', maddeler: [{ no: '26.01', metin: 'Topraklama var mı?' }] };

function hazir() {
  return kontrol.listeEkle(model.bosDegerlendirme('2026-2027'), MEB);
}

test('kütüphaneden liste ekler: yeni kimlikler, boş cevaplar, kaynak korunur', () => {
  const d = hazir();
  const [l] = d.kontrolListeleri;
  assert.equal(l.kod, 'KL-26');
  assert.equal(l.kaynak, 'dis');
  assert.ok(l.id && l.maddeler[0].id);
  assert.equal(l.maddeler[0].cevap, '');
  assert.deepEqual(dosya.dogrula(d), []);
});

test('aynı listeyi iki kez eklemek ayrı kimlik verir', () => {
  const d = kontrol.listeEkle(hazir(), MEB);
  assert.notEqual(d.kontrolListeleri[0].id, d.kontrolListeleri[1].id);
});

test('cevap ve açıklama işaretlenir, geçersiz cevap reddedilir', () => {
  let d = hazir();
  const l = d.kontrolListeleri[0];
  d = kontrol.maddeGuncelle(d, l.id, l.maddeler[0].id, { cevap: 'hayir', aciklama: 'Pano 2' });
  assert.equal(d.kontrolListeleri[0].maddeler[0].cevap, 'hayir');
  assert.equal(d.kontrolListeleri[0].maddeler[0].aciklama, 'Pano 2');
  assert.throws(() => kontrol.maddeGuncelle(d, l.id, l.maddeler[0].id, { cevap: 'belki' }), /Geçersiz cevap/);
});

test('MEB listesinin hazır madde metni ve liste adı kilitli', () => {
  const d = hazir();
  const l = d.kontrolListeleri[0];
  assert.throws(() => kontrol.maddeGuncelle(d, l.id, l.maddeler[0].id, { metin: 'x' }), /değiştirilemez/);
  assert.throws(() => kontrol.listeGuncelle(d, l.id, { ad: 'x' }), /değiştirilemez/);
});

test('MEB listesine madde eklenir ve eklenen maddenin metni düzenlenir; madde silinir', () => {
  let d = hazir();
  const lid = d.kontrolListeleri[0].id;
  d = kontrol.maddeEkle(d, lid);
  const yeni = d.kontrolListeleri[0].maddeler[1];
  assert.equal(yeni.no, '2');
  d = kontrol.maddeGuncelle(d, lid, yeni.id, { metin: 'Okul maddesi' });
  assert.equal(d.kontrolListeleri[0].maddeler[1].metin, 'Okul maddesi');
  d = kontrol.maddeSil(d, lid, d.kontrolListeleri[0].maddeler[0].id);
  assert.equal(d.kontrolListeleri[0].maddeler.length, 1);
});

test('okulun kendi listesi tamamen düzenlenir ve silinir', () => {
  let d = kontrol.listeEkle(model.bosDegerlendirme(''), { ad: 'Yeni liste' });
  const l = d.kontrolListeleri[0];
  assert.equal(l.kaynak, 'ic');
  d = kontrol.listeGuncelle(d, l.id, { kod: 'OK-1', ad: 'Atölye girişi' });
  assert.equal(d.kontrolListeleri[0].ad, 'Atölye girişi');
  d = kontrol.listeSil(d, l.id);
  assert.equal(d.kontrolListeleri.length, 0);
});

test('bilinmeyen liste ya da madde hata verir; girdi değişmez', () => {
  const d = hazir();
  const once = JSON.stringify(d);
  assert.throws(() => kontrol.listeSil(d, 'yok'), /Kontrol listesi bulunamadı/);
  assert.throws(() => kontrol.maddeSil(d, d.kontrolListeleri[0].id, 'yok'), /Madde bulunamadı/);
  kontrol.maddeGuncelle(d, d.kontrolListeleri[0].id, d.kontrolListeleri[0].maddeler[0].id, { cevap: 'evet' });
  assert.equal(JSON.stringify(d), once);
});

test('kütüphane mekânı satırlarıyla, yeni kimliklerle eklenir', () => {
  const sablon = { ad: 'ELE1', tur: 'atolye', bina: '', alan: 'EET', satirlar: [{ alet: 'Matkap', tehlike: 'Kesik', o: null, s: null }] };
  const d = kontrol.mekanSablondanEkle(model.bosDegerlendirme(''), sablon);
  assert.equal(d.mekanlar[0].ad, 'ELE1');
  assert.equal(d.mekanlar[0].satirlar[0].alet, 'Matkap');
  assert.ok(d.mekanlar[0].satirlar[0].id);
  assert.deepEqual(dosya.dogrula(d), []);
});
