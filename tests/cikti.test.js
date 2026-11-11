const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../lib/model.js');
const cikti = require('../lib/cikti.js');

function ornek() {
  let d = model.bosDegerlendirme('2026-2027');
  d = model.okulGuncelle(d, { okul: 'Örnek MTAL', kapsam: 'Elektrik Alanı', gruplama: 'bina' });
  d = model.mekanEkle(d, { ad: 'ELE1', tur: 'atolye', bina: 'C Blok', alan: 'Elektrik' });
  const mid = d.mekanlar[0].id;
  d = model.satirEkle(d, mid);
  const sid = d.mekanlar[0].satirlar[0].id;
  d = model.satirGuncelle(d, mid, sid, { alet: 'Matkap', tehlike: 'Kesik', o: 3, s: 5 });
  return {
    ...d,
    kontrolListeleri: [{
      id: 'k1', kod: 'KL-11', ad: 'Elektrik', kaynak: 'dis',
      maddeler: [{ id: 'm1', no: '1', metin: 'Pano kapalı mı?', cevap: 'evet', aciklama: '' }],
    }],
  };
}

test('risk satırları skor ve düzey adını taşır', () => {
  const satirlar = cikti.riskSatirlari(ornek());
  assert.equal(satirlar.length, 1);
  assert.equal(satirlar[0].mekan, 'ELE1');
  assert.equal(satirlar[0].bina, 'C Blok');
  assert.equal(satirlar[0].skor, 15);
  assert.equal(satirlar[0].duzey, 'Yüksek');
  assert.equal(satirlar[0].no, 1);
});

test('puansız satırda skor ve düzey boş metin', () => {
  let d = ornek();
  const m = d.mekanlar[0];
  d = model.satirGuncelle(d, m.id, m.satirlar[0].id, { o: null });
  const [s] = cikti.riskSatirlari(d);
  assert.equal(s.skor, '');
  assert.equal(s.duzey, '');
});

test('kontrol satırları cevabı okunur metne çevirir', () => {
  const [s] = cikti.kontrolSatirlari(ornek());
  assert.equal(s.kod, 'KL-11');
  assert.equal(s.cevap, 'Evet');
});

test('pdf verisi boş formda puan ve cevapları siler, kaynağı değiştirmez', () => {
  const d = ornek();
  const v = cikti.pdfVerisi(d, 'bos');
  assert.equal(v.tur, 'bos');
  assert.equal(v.gruplar[0].baslik, 'C Blok');
  assert.equal(v.gruplar[0].mekanlar[0].satirlar[0].o, null);
  assert.equal(v.gruplar[0].mekanlar[0].satirlar[0].duzey, null);
  assert.equal(v.kontrolListeleri[0].maddeler[0].cevap, '');
  assert.equal(d.mekanlar[0].satirlar[0].o, 3);
  assert.equal(d.kontrolListeleri[0].maddeler[0].cevap, 'evet');
});

test('pdf verisi tam belgede düzey kodunu ve rengini verir', () => {
  const v = cikti.pdfVerisi(ornek(), 'tam');
  const s = v.gruplar[0].mekanlar[0].satirlar[0];
  assert.equal(s.skor, 15);
  assert.equal(s.duzey.kod, 'Y');
  assert.equal(s.duzey.zemin, '#ff0000');
});

test('geçersiz pdf türü hata verir', () => {
  assert.throws(() => cikti.pdfVerisi(ornek(), 'xyz'), /Geçersiz çıktı türü/);
});

test('çıktı dosya adı dönem ve eki içerir', () => {
  assert.equal(cikti.ciktiAdi(ornek(), 'xlsx'), 'risk-2026-2027.xlsx');
  assert.equal(cikti.ciktiAdi(ornek(), 'pdf', 'bos-form'), 'risk-2026-2027-bos-form.pdf');
  assert.equal(cikti.ciktiAdi(model.bosDegerlendirme(''), 'docx'), 'risk-degerlendirme.docx');
});
