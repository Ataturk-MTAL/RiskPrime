// RiskPrime PDF şablonu. Veri: /veri.json (lib/cikti.js pdfVerisi çıktısı).
// tur: "tam" = tam belge, "kontrol" = yalnız kontrol listeleri, "bos" = puan/cevap kutuları boş form.
// typst.ts (tarayıcı) ve typst CLI ile derlenir; 0.13+ ile uyumlu kalmalı.

#let V = json("/veri.json")
#let TUR = V.tur
#let OKUL = V.okul.okul
#let KAPSAM = V.okul.kapsam
#let tr-upper(s) = upper(s.replace("i", "İ").replace("ı", "I"))
#let bos-mu(x) = x == none or x == ""
#let RENK-BASLIK = rgb("#1f3b63")
#let RENK-VURGU = rgb("#e8711a")
#let RENK-ETIKET = rgb("#f2f2f2")
#let RENK-GRUP = rgb("#c9d7ea")
#let RENK-LAB = rgb("#dce6f2")
#let CIZGI = 0.5pt + black
#let TARIH-BOS = [\_\_ / \_\_ / 20\_\_]

#let MATRIS = (
  ("A", "D", "D", "D", "D"),
  ("D", "D", "D", "O", "O"),
  ("D", "D", "O", "O", "Y"),
  ("D", "O", "O", "Y", "Y"),
  ("D", "O", "Y", "Y", "T"),
)
#let DUZEY = (
  A: (ad: "Anlamsız", zemin: "#d9d9d9", yazi: "#000000"),
  D: (ad: "Düşük", zemin: "#92d050", yazi: "#000000"),
  O: (ad: "Orta", zemin: "#ffff00", yazi: "#000000"),
  Y: (ad: "Yüksek", zemin: "#ff0000", yazi: "#000000"),
  T: (ad: "Tolere edilemez", zemin: "#000000", yazi: "#ffffff"),
)
#let duzey-hucresi(d) = if d == none { [] } else {
  table.cell(fill: rgb(d.zemin), align: center + horizon, text(fill: rgb(d.yazi), weight: "bold", d.ad))
}
#let matris-hucresi(o, s) = duzey-hucresi(DUZEY.at(MATRIS.at(o - 1).at(s - 1)))

#set document(title: "Risk Değerlendirmesi ve Kontrol Listesi")
#set page(
  paper: "a4", flipped: true,
  margin: (x: 1.3cm, top: 1.5cm, bottom: 1.5cm),
  header: context if counter(page).get().first() > 1 {
    set text(8pt, fill: luma(90))
    [#OKUL · #KAPSAM #h(1fr) Risk Değerlendirmesi ve Kontrol Listesi #if not bos-mu(V.donem) [· #V.donem]]
    v(-4pt)
    line(length: 100%, stroke: 0.4pt + luma(150))
  },
  footer: context {
    set text(8pt, fill: luma(90))
    grid(columns: (1fr, auto),
      [Risk giderilmeden iş başlatılmaz. Önce enerjiyi kes, sonra çalış.],
      [Sayfa #counter(page).display("1 / 1", both: true)])
  },
)
#set text(font: ("IBM Plex Sans", "Libertinus Serif"), lang: "tr", size: 9.5pt)
#set par(justify: false, leading: 0.55em, spacing: 0.7em)
#show heading.where(level: 1): it => block(
  width: 100%, above: 1.4em, below: 0.8em, sticky: true,
  inset: (bottom: 5pt), stroke: (bottom: 0.6pt + RENK-BASLIK.lighten(55%)),
)[
  #box(width: 4pt, height: 1em, fill: RENK-VURGU, radius: 1.5pt, baseline: 0.15em)
  #h(6pt)
  #text(13pt, weight: "bold", fill: RENK-BASLIK, it.body)
]
#set table(stroke: CIZGI, inset: (x: 4pt, y: 3pt), align: left + horizon)

#let etiket(it) = table.cell(fill: RENK-ETIKET)[*#it*]
#let kutu-ici = box(width: 8pt, height: 8pt, stroke: 0.7pt + black, baseline: 1pt)
#let isaretli = box(width: 8pt, height: 8pt, stroke: 0.7pt + black, baseline: 1pt,
  align(center + horizon, text(7pt, weight: "bold")[X]))
#let tarih(x) = if bos-mu(x) { TARIH-BOS } else { x }

// ─── Kapak ──────────────────────────────────────────────────
#align(center)[
  #text(10.5pt, weight: "bold")[
    T.C. \
    MİLLÎ EĞİTİM BAKANLIĞI \
    #tr-upper(OKUL) \
    #if not bos-mu(KAPSAM) { tr-upper(KAPSAM) }
  ]
  #v(4pt)
  #line(length: 3cm, stroke: 1.5pt + RENK-VURGU)
  #v(2pt)
  #text(15pt, weight: "bold", fill: RENK-BASLIK)[
    #if TUR == "kontrol" [RİSK DEĞERLENDİRME KONTROL LİSTELERİ] else [RİSK DEĞERLENDİRMESİ VE KONTROL LİSTESİ]
  ]
]
#v(4pt)
#let mekan-adlari = V.gruplar.map(g => g.mekanlar.map(m => m.ad)).flatten()
#table(
  columns: (auto, 1fr, auto, auto, auto, auto),
  etiket[Kapsam], [#mekan-adlari.join(" · ")],
  etiket[Değerlendirme tarihi], tarih(if TUR == "bos" { none } else { V.degerlendirmeTarihi }),
  etiket[Geçerlilik tarihi], tarih(if TUR == "bos" { none } else { V.gecerlilikTarihi }),
)

// ─── 1-2. Yöntem ve periyodik kontroller (tam ve boş formda) ─
#if TUR != "kontrol" [
= 1. Dayanak ve yöntem

#grid(columns: (1fr, 1fr), column-gutter: 14pt,
  [
    *Dayanak*
    - 6331 sayılı İş Sağlığı ve Güvenliği Kanunu (md. 4: işveren yükümlülükleri, risk değerlendirmesi).
    - İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği (RG 29.12.2012, sayı 28512): tehlikelerin tanımlanması (md. 8), risklerin analizi (md. 9), kontrol adımları (md. 10), dokümantasyon (md. 11), yenileme (md. 12).
    - MEB İSG Risk Değerlendirme Rehberi (Okul ve Kurumlar için Risk Analizi): L tipi matris yöntemi ve süreç.
    - MEB Risk Değerlendirme Kontrol Listeleri (KL-01 – KL-43).
  ],
  [
    *Süreç (rehber, 5 adım)*
    + Tehlikelerin tespit edilmesi (fotoğraf + kayıt)
    + Risklerin analizi: *Risk = Olasılık × Şiddet*
    + Kontrol tedbirlerinin belirlenmesi (sorumlu + bitiş tarihi)
    + Kontrol tedbirlerinin uygulanması
    + İzle ve tekrar et: tedbir sonrası riski yeniden derecelendir

    *Yenileme:* kaza, ramak kala, yeni cihaz/teknoloji, mevzuat değişikliği, yer veya kullanım değişikliğinde (Yön. md. 12).
  ],
)

#v(4pt)
#grid(columns: (1fr, 1.25fr, 1.2fr), column-gutter: 10pt,
  table(columns: (auto, 1fr),
    table.header(table.cell(colspan: 2, fill: RENK-ETIKET)[*Olasılık (O)*]),
    [1], [Hemen hemen hiç],
    [2], [Çok az (yılda bir, yalnız anormal durumlarda)],
    [3], [Az (ayda bir veya yılda birkaç kez)],
    [4], [Sıklıkla (haftada bir veya ayda birkaç kez)],
    [5], [Çok sıklıkla (her gün, haftada birkaç kez, normal çalışmada)],
  ),
  table(columns: (auto, 1fr),
    table.header(table.cell(colspan: 2, fill: RENK-ETIKET)[*Şiddet (Ş)*]),
    [1], [İş saati kaybı yok, hemen giderilebilir, ilk yardım yeterli],
    [2], [İş günü kaybı yok, kalıcı etkisi olmayan, ayakta tedavi],
    [3], [Hafif yaralanma, yatarak tedavi gerekir],
    [4], [Ciddi yaralanma, uzun süreli tedavi, meslek hastalığı, uzuv kaybı],
    [5], [Bir veya daha fazla kişinin ölümü],
  ),
  table(columns: (auto,) + (1fr,) * 5, align: center + horizon,
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*O*], table.cell(colspan: 5, fill: RENK-ETIKET)[*Şiddet*],
    ..range(1, 6).map(s => etiket(str(s))),
    ..range(1, 6).map(o => (etiket(str(o)), ..range(1, 6).map(s => matris-hucresi(o, s)))).flatten(),
  ),
)
#v(2pt)
#text(8.5pt)[Düzey çarpımdan değil matris hücresinden okunur (rehber s. 9).]

#v(4pt)
#table(columns: (auto, 1fr),
  table.header(etiket[Risk düzeyi], etiket[Rehbere göre gereken eylem]),
  matris-hucresi(5, 5), [Kabul edilebilir düzeye inene kadar iş başlatılmaz; sürüyorsa derhal durdurulur. Önlemle düşürülemiyorsa faaliyet engellenir.],
  matris-hucresi(4, 4), [Risk azalana kadar iş başlatılmaz; sürüyorsa derhal durdurulur, acil önlem alınır, önlem sonrası devam kararı verilir.],
  matris-hucresi(3, 3), [Riski düşürmek için faaliyetler başlatılır. Önlemler zaman alabilir.],
  matris-hucresi(2, 2), [İlave kontrole gerek olmayabilir; mevcut kontroller sürdürülür ve denetlenir.],
  matris-hucresi(1, 1), [Kontrol planlamaya ve kayıt tutmaya gerek olmayabilir.],
)
#text(8.5pt)[*Önlem sırası (Yön. md. 10):* tehlikeyi ortadan kaldır, daha az tehlikeliyle değiştir, kaynağında mücadele et, tecrit/havalandırma/organizasyon, en son kişisel koruyucu donanım (KKD). Toplu önlem bireysel önlemden önce gelir.]

#pagebreak()

= 2. Periyodik kontroller

#table(columns: (auto, auto, 1fr),
  table.header(etiket[Konu], etiket[Sıklık], etiket[Dayanak / not]),
  [Elektrik tesisatı ve topraklama], [Yılda bir, yetkili kişi], [KL-26],
  [Paratoner tesisatı], [Yılda bir, yetkili kişi], [—],
  [Kaçak akım rölesi], [Test düğmesi ayda bir; açma süresi yıllık tesisat kontrolünde], [KL-26],
  [Yangın söndürme cihazları], [Yılda bir yerinde genel kontrol; 4. yıl sonunda madde yenileme ve hidrostatik test], [TS ISO 11602-2; KL-30],
  [Basınçlı kap (varsa)], [Periyodik muayene, yetkili kişi raporu], [KL-28],
  [Havalandırma ve iklimlendirme], [Tesisat 3 ayda bir, iklimlendirme araçları yılda bir bakım], [—],
  [Seyyar merdiven], [Her kullanım öncesi gözle], [KL-25],
  [El aletleri, ölçü aletleri, yalıtkan KKD], [Dönem başı ve ayda bir; ölçü aletinde kalibrasyon kaydı], [KL-34],
  [Alarm ve tahliye tatbikatı], [Yılda en az bir; tatbikat raporu yazılır], [Acil Durumlar Hakkında Yönetmelik],
  [Acil durum planı], [Az tehlikeli 6, tehlikeli 4, çok tehlikeli 2 yılda bir], [Acil Durumlar Hakkında Yönetmelik],
  [Risk değerlendirmesi], [Az tehlikeli 6, tehlikeli 4, çok tehlikeli 2 yılda bir; kaza, ramak kala, yeni ekipmanda hemen], [Risk Değerlendirmesi Yön. md. 12],
  [Çalışanların İSG eğitimi], [Az tehlikeli 3, tehlikeli 2, çok tehlikeli yılda bir], [Çalışanların İSG Eğitimleri Yön. md. 6],
)

#pagebreak()

= 3. Risk analiz tablosu

#if TUR == "bos" [
  #text(8.5pt)[*Nasıl doldurulur:* *O* ve *Ş* 1. bölümdeki ölçeklerden 1-5 arası seçilir; *Skor = O × Ş*; *Düzey* matristen (O satırı, Ş sütunu) okunur. Önlem sonrası risk aynı şekilde doldurulur. Tabloda olmayan tehlike boş satırlara eklenir.]
] else [
  #text(8.5pt)[Düzey L tipi matristen okunur. Tabloda olmayan, yerinde bulunan tehlikeler boş satırlara eklenir.]
]
#v(2pt)

#let puan(x) = if x == none { [] } else { align(center)[#x] }
#let puanlar(o, s, skor, d) = (puan(o), puan(s), puan(skor), duzey-hucresi(d))
#let govde = {
  let hucreler = ()
  let no = 0
  for g in V.gruplar {
    if g.baslik != "" { hucreler.push(table.cell(colspan: 16, fill: RENK-GRUP)[*#g.baslik*]) }
    for m in g.mekanlar {
      hucreler.push(table.cell(colspan: 16, fill: RENK-LAB)[*#m.ad*])
      for s in m.satirlar {
        no += 1
        hucreler += (
          [#no], [*#s.alet*], s.tehlike, s.etkilenen, s.mevcut,
          ..puanlar(s.o, s.s, s.skor, s.duzey),
          s.onlem, s.sorumlu, tarih(s.bitis),
          ..puanlar(s.o2, s.s2, s.skor2, s.duzey2),
        )
      }
    }
  }
  hucreler.push(table.cell(colspan: 16, fill: RENK-LAB)[*Ekip tarafından eklenen tehlikeler*])
  for _ in range(6) {
    no += 1
    hucreler += ([#no], [#v(0.9cm)]) + ([],) * 14
  }
  hucreler
}

#[
#show table.cell: set text(size: 7.5pt)
#table(
  columns: (0.6cm, 2.6cm, 3.8cm, 1.5cm, 1.6cm, 0.75cm, 0.75cm, 0.95cm, 1.5cm, 1fr, 1.9cm, 1.5cm, 0.75cm, 0.75cm, 0.95cm, 1.5cm),
  inset: (x: 2.5pt, y: 2.5pt),
  table.header(
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*No*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Alet / ekipman grubu*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Tehlike ve risk*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Etkilenen*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Mevcut önlem*],
    table.cell(colspan: 4, fill: RENK-ETIKET, align: center)[*Mevcut risk*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Düzeltici / önleyici faaliyet*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Sorumlu*],
    table.cell(rowspan: 2, fill: RENK-ETIKET)[*Bitiş tarihi*],
    table.cell(colspan: 4, fill: RENK-ETIKET, align: center)[*Önlem sonrası risk*],
    etiket[O], etiket[Ş], etiket[Skor], etiket[Düzey],
    etiket[O], etiket[Ş], etiket[Skor], etiket[Düzey],
  ),
  ..govde,
)
]

#pagebreak()
]

// ─── Kontrol listeleri ──────────────────────────────────────
#if V.kontrolListeleri.len() > 0 [
= #if TUR == "kontrol" [Kontrol listeleri] else [4. Kontrol listeleri]

#text(8.5pt)[Her madde yerinde gözlemle işaretlenir. "Hayır" işaretlenen madde için risk analiz tablosuna satır açılır veya mevcut satır güncellenir. U/D: uygulanamaz.]
#v(2pt)

#let kutu(m, deger) = if m.cevap == deger { isaretli } else { kutu-ici }
#for k in V.kontrolListeleri {
  table(
    columns: (0.9cm, 1fr, 1cm, 1cm, 1cm, 5cm),
    align: (center + horizon, left + horizon, center + horizon, center + horizon, center + horizon, left + horizon),
    table.header(
      table.cell(colspan: 6, fill: RENK-ETIKET)[*#k.kod #if not bos-mu(k.kod) [—] #k.ad*],
      etiket[No], etiket[Kontrol maddesi], etiket[Evet], etiket[Hayır], etiket[U/D], etiket[Açıklama / tarih / sorumlu],
    ),
    ..k.maddeler.map(m => (
      [#m.no], [#m.metin], kutu(m, "evet"), kutu(m, "hayir"), kutu(m, "ud"), [#m.aciklama],
    )).flatten(),
  )
  v(6pt)
}
]

// ─── İmza ───────────────────────────────────────────────────
#v(4pt)
#let imzacilar = V.okul.imzacilar
#if imzacilar.len() > 0 {
  block(breakable: false)[
    *Risk değerlendirme ekibi* (Yön. md. 6, md. 11: sayfalar paraflanır, son sayfa imzalanır)
    #v(2pt)
    #table(
      columns: (1fr,) * imzacilar.len(), align: center + horizon,
      table.header(..imzacilar.map(k => etiket(k.unvan))),
      ..imzacilar.map(k => if bos-mu(k.ad) [Ad Soyad:] else [*#k.ad*]),
      ..imzacilar.map(_ => [#v(1.2cm) İmza]),
    )
  ]
}
