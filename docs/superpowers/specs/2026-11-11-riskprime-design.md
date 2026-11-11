# RiskPrime — Tasarım

Tarih: 11.11.2026
Durum: Onaylandı (kullanıcı, 11.11.2026)

## Amaç

Okul mekânlarının (atölye, depo, oda, ıslak hacim) İSG risk değerlendirmesini ve kontrol listelerini tarayıcıda hazırlamak, yıllar arasında karşılaştırmak ve imzaya hazır PDF almak. Ölçüt: alan şefi kurulum yapmadan bir linkten açar, alan/tehlike/kontrol maddesi ekler, düzenler, siler; puanlar; PDF alır; gelecek yıl dosyayı açıp yeni yıla kopyalar.

Başlangıç verisi: `Planlar/RISK-ANALIZ` içindeki Typst belgesi (`EET-RISK-DEGERLENDIRME-VE-KONTROL-LISTESI.typ`, `atolye-verisi.typ`, `okul.json`).

## Yöntem (değişmez kurallar)

- MEB Risk Değerlendirme Rehberi L tipi matris: Risk = Olasılık (O) × Şiddet (Ş), O ve Ş 1-5 tam sayı.
- Düzey çarpımdan değil matris hücresinden okunur:

| O \ Ş | 1        | 2     | 3      | 4      | 5               |
| ----- | -------- | ----- | ------ | ------ | --------------- |
| 1     | Anlamsız | Düşük | Düşük  | Düşük  | Düşük           |
| 2     | Düşük    | Düşük | Düşük  | Orta   | Orta            |
| 3     | Düşük    | Düşük | Orta   | Orta   | Yüksek          |
| 4     | Düşük    | Orta  | Orta   | Yüksek | Yüksek          |
| 5     | Düşük    | Orta  | Yüksek | Yüksek | Tolere edilemez |

## Mimari

MetricusPrime ile aynı biçim: build adımı olmayan statik sayfa, `Ataturk-MTAL/RiskPrime` deposundan GitHub Pages ile yayınlanır. Sunucu yok; veri tarayıcıda işlenir.

```
index.html            arayüz
app.js                ekran mantığı ve olaylar (DOM)
lib/matris.js         düzey(o, s), skor(o, s); saf fonksiyonlar
lib/model.js          mekân / satır / liste / madde: ekle, düzenle, sil, taşı; her işlem yeni kopya döner
lib/dosya.js          JSON içe/dışa aktarma, doğrulama, sürüm yükseltme
lib/excel.js          içe alma şablonu üretme ve okuma (SheetJS)
lib/yil.js            yeni yıla kopyalama
lib/karsilastir.js    iki dosyayı satır kimliğiyle eşleştirme
lib/pdf.js            typst.ts sarmalayıcı: veri → PDF
sablon/rapor.typ      tam belge (bugünkü Typst belgesinin JSON okuyan hâli)
sablon/kontrol.typ    yalnız kontrol listesi (MEB KL form düzeni)
veri/kutuphane.json   hazır tehlike satırları ve MEB KL listeleri
veri/baslangic.json   Atatürk MTAL Elektrik-Elektronik alanı 2026 verisi
vendor/               xlsx.full.min.js, typst.ts derleyici (wasm), açık lisanslı yazı tipi
tests/                node --test
```

`lib/*` DOM'a dokunmaz; yalnız `app.js` DOM kullanır. Böylece mantık Node'da test edilir.

## Veri modeli (değerlendirme dosyası)

Dosya adı önerisi: `risk-<dönem>.json` (örnek `risk-2026-2027.json`). Asıl kayıt bu dosyadır.

```json
{
  "surum": 1,
  "donem": "2026-2027",
  "degerlendirmeTarihi": "GG.AA.YYYY",
  "gecerlilikTarihi": "GG.AA.YYYY",
  "okul": {
    "okul": "…",
    "kapsam": "Elektrik-Elektronik Teknolojisi Alanı",
    "gruplama": "alan | bina | yok",
    "imzacilar": [{ "unvan": "İş Güvenliği Uzmanı", "ad": "" }]
  },
  "mekanlar": [
    {
      "id": "a-…",
      "ad": "ELE1 · Haberleşme ve Görüntü Sistemleri",
      "tur": "atolye | depo | ofis | islak | ortak",
      "bina": "Atölyeler Binası",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-…",
          "alet": "…",
          "tehlike": "…",
          "etkilenen": "…",
          "mevcut": "…",
          "o": 3,
          "s": 5,
          "onlem": "…",
          "sorumlu": "…",
          "bitis": "GG.AA.YYYY",
          "durum": "acik | tamam",
          "o2": 1,
          "s2": 5
        }
      ]
    }
  ],
  "kontrolListeleri": [
    {
      "id": "k-…",
      "kod": "KL-26",
      "ad": "Elektrikli Tesisat ve Ekipmanlar",
      "kaynak": "ic | dis",
      "maddeler": [
        {
          "id": "m-…",
          "no": "26.01",
          "metin": "…",
          "cevap": "evet | hayir | ud | (boş)",
          "aciklama": ""
        }
      ]
    }
  ]
}
```

- Yapı bina → alan → mekân ağacı değil, etiketlidir: her mekânın `bina` ve `alan` etiketi vardır (ikisi de boş olabilir). Bir bina birden çok alanı, bir alan birden çok binayı kapsayabilir. Değerlendirmenin kapsamı serbesttir (tek atölye, bir alan, bir bina, tüm okul); `kapsam` kapakta başlık olarak basılır. `gruplama` ekranda ve PDF'te mekânların hangi etikete göre gruplanacağını seçer. `tur: "ortak"` mekân, kapsamdaki tüm mekânlar için ortak satırları taşır.
- `o`, `s`, `o2`, `s2`: 1-5 tam sayı ya da `null` (puanlanmamış). Boş olan PDF'te boş kutu basılır.
- Kimlikler (`id`) yıl kopyalamada korunur; karşılaştırma bunlara dayanır.
- `kaynak: "dis"`: dışarıdan alınan liste. Maddelerin metni arayüzde kilitli gelir, yalnız cevap ve açıklama girilir. Kilit tek tıkla açılabilir.
- Dosyada öğrenci verisi bulunmaz.

## Ekranlar ve akış

1. **Başlangıç:** yeni değerlendirme (başlangıç verisiyle ya da boş), dosya aç (sürükle-bırak), "geçen yılı yeni yıla kopyala".
2. **Okul, kapsam ve imzacılar:** okul, kapsam başlığı, gruplama (alan / bina / yok), dönem, tarihler, imzacılar (ekle/sil/sırala).
3. **Mekânlar:** ekle, adını değiştir, tür, bina ve alan etiketini seç (önceki değerlerden öneri listesi), sil (onaylı), sırala. Liste `gruplama`ya göre bina ya da alan başlıkları altında gösterilir.
4. **Risk satırları (seçili mekân):** ekle, düzenle, sil (onaylı); "kütüphaneden ekle" ile hazır satır seçimi. O ve Ş açılır listeden; skor ve renkli düzey anında görünür. Durum: açık / tamam.
5. **Kontrol listeleri:** liste oluştur (iç), kütüphaneden KL listesi ekle, Excel'den içe al (dış). Maddeler eklenir, düzenlenir, silinir (dış listede kilit açılınca). Cevap: Evet / Hayır / U-D, açıklama.
6. **Karşılaştır:** ikinci bir yılın dosyası yüklenir; satır tablosunda geçen yılın düzeyi yan sütunda görünür. Eşleşmeyen satırlar "yeni" ya da "kaldırıldı" olarak işaretlenir. Karşılaştırma dosyası değiştirilmez.
7. **Çıktı:** ana düğme **"PDF indir"** (varsayılan, tam belge). Yanındaki "▾ diğer biçimler" menüsü:
   - Kayıt dosyası (`.json`) — uygulamada tekrar açılabilen tek biçim; menüde en üstte ve açıklamasıyla.
   - PDF: yalnız kontrol listeleri (seçilenler, MEB KL form düzeni).
   - PDF: boş form (puan ve cevap kutuları boş).
   - Excel (`.xlsx`): risk tablosu (mekân başına satırlar, skor ve düzey dahil) ve kontrol listeleri ayrı sayfalarda; yalnız çıktı, geri açılmaz.
   - Word (`.docx`): tam belgenin düzenlenebilir hâli (MetricusPrime'daki docx kütüphanesiyle); yalnız çıktı.
   - Excel içe alma şablonunu indir.

   PDF, Excel ya da Word indirilirken kayıt dosyası indirilmemişse "Kayıt dosyasını da indirin; PDF/Excel/Word uygulamada açılamaz" uyarısı ve tek tıkla JSON indirme gösterilir.

Çalışma verisi tarayıcıda (localStorage) da tutulur, sayfa açılınca geri yüklenir. Bu yalnız kolaylıktır; ekranda "kaydedilmemiş değişiklik var, dosyayı indirin" uyarısı gösterilir. "Tarayıcıdaki veriyi sil" düğmesi bulunur.

## Excel içe alma şablonu

Tek `.xlsx`, iki sayfa. İlk satır başlık; ikinci satır örnek (içe alırken "ÖRNEK" ile başlayan satır atlanır).

**Sayfa "Kontrol Listesi"**

| Liste Kodu | Liste Adı                        | Madde No | Madde                                   |
| ---------- | -------------------------------- | -------- | --------------------------------------- |
| KL-26      | Elektrikli Tesisat ve Ekipmanlar | 26.01    | Elektrik tesisatının bakım ve onarımı … |

Aynı Liste Kodu'na sahip satırlar tek liste olur. İçe alınan liste `kaynak: "dis"` olur. Aynı kodda liste zaten varsa kullanıcıya "değiştir / yanına ekle / vazgeç" sorulur.

**Sayfa "Risk Satırları"**

| Mekân | Mekân Türü | Bina | Alan | Alet / Ekipman Grubu | Tehlike ve Risk | Etkilenen | Mevcut Önlem | Düzeltici Önlem | Sorumlu | O   | Ş   |
| ----- | ---------- | ---- | ---- | -------------------- | --------------- | --------- | ------------ | --------------- | ------- | --- | --- |

Mekân yoksa oluşturulur (bina ve alan etiketiyle). Bina, Alan, O ve Ş boş bırakılabilir.

Doğrulama hepsi-ya-hiç: tek bir satırda hata varsa hiçbir şey eklenmez, hatalar sayfa ve satır numarasıyla listelenir (ör. "Risk Satırları, satır 7: Ş 1-5 arası olmalı, '6' yazılmış"). Excel dışında CSV de kabul edilir (tek sayfa, ilk satırdaki başlıklardan türü anlaşılır).

## PDF

- typst.ts (tarayıcıda çalışan Typst derleyicisi). Şablona veri `data.json` sanal dosyası olarak verilir; şablon `json("data.json")` ile okur.
- `sablon/rapor.typ`: bugünkü belgenin aynısı, mekân bölümleri `gruplama`ya göre ara başlıklarla (kapak: T.C. / MİLLÎ EĞİTİM BAKANLIĞI / okul / kapsam; dayanak ve yöntem; periyodik kontroller; risk tablosu; kontrol listeleri; imza tablosu).
- `sablon/kontrol.typ`: MEB KL formu düzeni: başlık, liste adı ve kodu, tarih; S.No / Madde / Evet / Hayır / Gerekli Değil / Açıklama; altta imzacılar.
- Yazı tipi: açık lisanslı ve Türkçe karakterleri tam bir sans (Noto Sans ya da Inter), `vendor/` içinde.
- Boş puan ya da cevap kutusu boş basılır; "boş form" seçeneği tüm puan ve cevapları boşaltılmış kopyayla aynı şablonu derler.

## Kütüphane

`veri/kutuphane.json`:

- Tehlike satırları: bugünkü `atolye-verisi.typ` satırları (ortak, kumanda seti, tesisat seti, PLC, depo, ofis …), puansız.
- MEB KL listeleri, `MEB-Risk-Degerlendirme-Kontrol-Listeleri-KL01-KL43.pdf` metninden: KL-11, KL-19, KL-25, KL-26, KL-27, KL-28, KL-30, KL-31, KL-34, KL-35. Madde metinleri kaynakla birebir, madde numaralarıyla.

## Hata yönetimi

- Bozuk JSON, eksik alan, yanlış tür: Türkçe hata mesajı; ekrandaki veri değişmez.
- Eski `surum` değerli dosya: `dosya.js` yükseltir; bilinmeyen yeni sürüm: "bu dosya daha yeni bir RiskPrime ile oluşturulmuş" uyarısı, açılmaz.
- localStorage erişilemezse (gizli pencere vb.) sayfa çalışmaya devam eder, yalnız otomatik hatırlama kapalı uyarısı gösterilir.
- typst.ts yüklenemezse (internetsiz, file:// ile açılmış): PDF düğmeleri devre dışı ve neden yazılır; düzenleme ve JSON indirme çalışır.
- Silme işlemleri onay ister.

## Sınırlar (bilinçli)

- Ortak veritabanı yok: kayıt dosyadır. İki kişi ayrı kopyada çalışırsa birleştirme elle yapılır.
- Değişiklik geçmişi (kim, ne zaman) tutulmaz; yıllık dosyalar geçmiştir.
- PDF için sayfa web adresinden (GitHub Pages ya da yerel sunucu) açılmalıdır; `index.html` çift tıklamayla açılınca wasm yüklenmez.

## Test

- `node --test` ile `lib/*`: matris tablosunun 25 hücresi; model işlemleri ve kopya davranışı (girdi değişmez); dosya doğrulama (geçerli, bozuk, eksik, eski sürüm); Excel okuma (geçerli, hatalı satır, ÖRNEK satırı atlama, aynı kod); yıl kopyalama (puan ve cevap sıfırlanır, kimlik korunur); karşılaştırma (eşleşen, yeni, kaldırılan).
- PDF: başlangıç verisiyle elle; 4 bölüm, tüm satırlar, boş form, yalnız kontrol listesi derlenir.

## Yayın

`dev` dalında geliştirilir; `main`'e birleşince GitHub Pages. GitHub'da depo açma ve itme kullanıcı onayıyla yapılır.
