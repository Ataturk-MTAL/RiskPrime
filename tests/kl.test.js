const test = require('node:test');
const assert = require('node:assert/strict');
const { klAyristir } = require('../scripts/kl-uret.js');

// pdftotext -layout çıktısından kısaltılmış gerçek parça.
const ORNEK = [
  '                            RİSK DEĞERLENDİRME KONTROL LİSTELERİ',
  '                     İŞ SAĞLIĞI VE GÜVENLİĞİ',
  '                OKUL ORTAK KULLANIM ALANLARI                                                                       KL - 01',
  '              GENEL KONTROL LİSTESİ (TÜM OKULLAR)                                  ..…/.…./ 2015',
  'S.NO                             TEHLİKE/PROBLEM                                   EVET      HAYIR               AÇIKLAMALAR',
  '                                                                                                      DEĞİL',
  '1,01      Havalandırmaya ihtiyaç olan yerlerde pencereler açılabiliyor',
  '          mu?',
  '1,2       Tırabzanlar standartlara uygun mu?',
  '      İş Güvenliği Uzmanı               Çalışan Temsilcisi',
  '                          RİSK DEĞERLENDİRME KONTROL LİSTELERİ',
  '1,25    Deprem veya sarsıntı gibi durumlarda devrilebilecek',
  '        ekipmanlar duvara sabitlenmiş mi?',
  'NOT:    Bu forma ekleme veya çıkarma yapılabilir.',
  'ÖNERİLER',
  '* Yeterli havalandırma teçhiz edin.',
  '                  İŞ SAĞLIĞI VE GÜVENLİĞİ                                         Tarih',
  '             ISLAK HACİMLER ( WC VE DUŞLAR )                                 ..…/..……./ 2015     Listesi',
  '                                                                                                              KL - 11',
  '              KONTROL LİSTESİ (TÜM OKULLAR)',
  'S.NO                           TEHLİKE/PROBLEM                                EVET      HAYIR               AÇIKLAMALAR',
  '11.01 Yeterli aydınlatma sağlanmış mı?',
].join('\n');

test('listeleri madde numarasının ön ekine göre ayırır', () => {
  const l = klAyristir(ORNEK);
  assert.deepEqual(l.map((k) => k.kod), ['KL-01', 'KL-11']);
});

test('başlığı sağ sütun gürültüsü olmadan alır', () => {
  const [kl1, kl11] = klAyristir(ORNEK);
  assert.equal(kl1.ad, 'OKUL ORTAK KULLANIM ALANLARI GENEL KONTROL LİSTESİ (TÜM OKULLAR)');
  assert.equal(kl11.ad, 'ISLAK HACİMLER ( WC VE DUŞLAR ) KONTROL LİSTESİ (TÜM OKULLAR)');
});

test('çok satırlı maddeyi birleştirir, sayfa geçişinde devam eder, önerileri almaz', () => {
  const [kl1] = klAyristir(ORNEK);
  assert.deepEqual(kl1.maddeler, [
    { no: '1.01', metin: 'Havalandırmaya ihtiyaç olan yerlerde pencereler açılabiliyor mu?' },
    { no: '1.20', metin: 'Tırabzanlar standartlara uygun mu?' },
    { no: '1.25', metin: 'Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?' },
  ]);
});
