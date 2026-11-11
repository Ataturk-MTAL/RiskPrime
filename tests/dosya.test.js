const test = require('node:test');
const assert = require('node:assert/strict');
const dosya = require('../lib/dosya.js');
const model = require('../lib/model.js');

function gecerli() {
  let d = model.bosDegerlendirme('2026-2027');
  d = model.mekanEkle(d, { id: 'a-1', ad: 'ELE1' });
  return model.satirEkle(d, 'a-1', { id: 'r-1', o: 2, s: 4 });
}

test('yazılan dosya geri okunur', () => {
  const d = gecerli();
  const r = dosya.oku(dosya.yaz(d));
  assert.deepEqual(r.degerlendirme, d);
  assert.equal(r.hatalar, undefined);
});

test('bozuk JSON anlaşılır hata verir', () => {
  assert.deepEqual(dosya.oku('{bozuk').hatalar, ['Dosya okunamadı: geçerli bir JSON değil.']);
});

test('nesne olmayan içerik reddedilir', () => {
  assert.deepEqual(dosya.oku('[1,2]').hatalar, ['Dosya bir değerlendirme nesnesi değil.']);
});

test('hatalı alanlar yoluyla listelenir', () => {
  const d = gecerli();
  const mekan = d.mekanlar[0];
  const bozuk = { ...d, mekanlar: [{ ...mekan, tur: 'mutfak', satirlar: [{ ...mekan.satirlar[0], s: 6 }] }] };
  const h = dosya.oku(JSON.stringify(bozuk)).hatalar;
  assert.ok(h.some((x) => x.startsWith('mekanlar[0].tur:')));
  assert.ok(h.some((x) => x.startsWith('mekanlar[0].satirlar[0].s:')));
});

test('daha yeni sürüm açılmaz', () => {
  const h = dosya.oku(JSON.stringify({ ...gecerli(), surum: 99 })).hatalar;
  assert.match(h[0], /daha yeni bir RiskPrime/);
});

test('kontrol listesi doğrulanır', () => {
  const liste = {
    id: 'k-1', kod: 'KL-26', ad: 'Elektrik', kaynak: 'dis',
    maddeler: [{ id: 'm-1', no: '26.01', metin: 'x', cevap: 'belki', aciklama: '' }],
  };
  const h = dosya.oku(JSON.stringify({ ...gecerli(), kontrolListeleri: [liste] })).hatalar;
  assert.ok(h.some((x) => x.startsWith('kontrolListeleri[0].maddeler[0].cevap:')));
});

test('dosya adı dönemden üretilir', () => {
  assert.equal(dosya.dosyaAdi(gecerli()), 'risk-2026-2027.json');
  assert.equal(dosya.dosyaAdi(model.bosDegerlendirme('')), 'risk-degerlendirme.json');
});
