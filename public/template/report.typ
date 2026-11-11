// RiskPrime PDF şablonu. Veri: /data.json (lib/cikti.js pdfVerisi çıktısı).
// kind: "full" = tam belge, "checklists" = yalnız kontrol listeleri, "blank" = puan/cevap kutuları boş form.
// typst.ts (tarayıcı) ve typst CLI ile derlenir; 0.13+ ile uyumlu kalmalı.

#let V = json("/data.json")
#let KIND = V.kind
#let SCHOOL = V.school.name
#let SCOPE = V.school.scope
#let tr-upper(s) = upper(s.replace("i", "İ").replace("ı", "I"))
#let is-blank(x) = x == none or x == ""
#let COLOR-TITLE = rgb("#1f3b63")
#let COLOR-ACCENT = rgb("#e8711a")
#let COLOR-LABEL = rgb("#f2f2f2")
#let COLOR-GROUP = rgb("#c9d7ea")
#let COLOR-LOCATION = rgb("#dce6f2")
#let LINE = 0.5pt + black
#let DATE-BLANK = [\_\_ / \_\_ / 20\_\_]

#let MATRIX = (
  ("A", "D", "D", "D", "D"),
  ("D", "D", "D", "O", "O"),
  ("D", "D", "O", "O", "Y"),
  ("D", "O", "O", "Y", "Y"),
  ("D", "O", "Y", "Y", "T"),
)
#let LEVELS = (
  A: (label: "Anlamsız", background: "#d9d9d9", text: "#000000"),
  D: (label: "Düşük", background: "#92d050", text: "#000000"),
  O: (label: "Orta", background: "#ffff00", text: "#000000"),
  Y: (label: "Yüksek", background: "#ff0000", text: "#000000"),
  T: (label: "Tolere edilemez", background: "#000000", text: "#ffffff"),
)
// d: (label, background, text) or none.
#let level-cell(d) = if d == none { [] } else {
  table.cell(fill: rgb(d.background), align: center + horizon, text(fill: rgb(d.text), weight: "bold", d.label))
}
#let matrix-cell(o, s) = level-cell(LEVELS.at(MATRIX.at(o - 1).at(s - 1)))

#set document(title: "Risk Değerlendirmesi ve Kontrol Listesi")
#set page(
  paper: "a4", flipped: true,
  margin: (x: 1.3cm, top: 1.5cm, bottom: 1.5cm),
  header: context if counter(page).get().first() > 1 {
    set text(8pt, fill: luma(90))
    [#SCHOOL · #SCOPE #h(1fr) Risk Değerlendirmesi ve Kontrol Listesi #if not is-blank(V.period) [· #V.period]]
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
  inset: (bottom: 5pt), stroke: (bottom: 0.6pt + COLOR-TITLE.lighten(55%)),
)[
  #box(width: 4pt, height: 1em, fill: COLOR-ACCENT, radius: 1.5pt, baseline: 0.15em)
  #h(6pt)
  #text(13pt, weight: "bold", fill: COLOR-TITLE, it.body)
]
#set table(stroke: LINE, inset: (x: 4pt, y: 3pt), align: left + horizon)

#let cell-label(it) = table.cell(fill: COLOR-LABEL)[*#it*]
#let box-empty = box(width: 8pt, height: 8pt, stroke: 0.7pt + black, baseline: 1pt)
#let box-checked = box(width: 8pt, height: 8pt, stroke: 0.7pt + black, baseline: 1pt,
  align(center + horizon, text(7pt, weight: "bold")[X]))
#let date-or-blank(x) = if is-blank(x) { DATE-BLANK } else { x }

// ─── Kapak ──────────────────────────────────────────────────
#align(center)[
  #text(10.5pt, weight: "bold")[
    T.C. \
    MİLLÎ EĞİTİM BAKANLIĞI \
    #tr-upper(SCHOOL) \
    #if not is-blank(SCOPE) { tr-upper(SCOPE) }
  ]
  #v(4pt)
  #line(length: 3cm, stroke: 1.5pt + COLOR-ACCENT)
  #v(2pt)
  #text(15pt, weight: "bold", fill: COLOR-TITLE)[
    #if KIND == "checklists" [RİSK DEĞERLENDİRME KONTROL LİSTELERİ] else [RİSK DEĞERLENDİRMESİ VE KONTROL LİSTESİ]
  ]
]
#v(4pt)
#let location-names = V.groups.map(g => g.locations.map(m => m.name)).flatten()
#table(
  columns: (auto, 1fr, auto, auto, auto, auto),
  cell-label[Kapsam], [#location-names.join(" · ")],
  cell-label[Değerlendirme tarihi], date-or-blank(if KIND == "blank" { none } else { V.assessmentDate }),
  cell-label[Geçerlilik tarihi], date-or-blank(if KIND == "blank" { none } else { V.validUntil }),
)

// ─── 1-2. Yöntem ve periyodik kontroller (tam ve boş formda) ─
#if KIND != "checklists" [
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
    table.header(table.cell(colspan: 2, fill: COLOR-LABEL)[*Olasılık (O)*]),
    [1], [Hemen hemen hiç],
    [2], [Çok az (yılda bir, yalnız anormal durumlarda)],
    [3], [Az (ayda bir veya yılda birkaç kez)],
    [4], [Sıklıkla (haftada bir veya ayda birkaç kez)],
    [5], [Çok sıklıkla (her gün, haftada birkaç kez, normal çalışmada)],
  ),
  table(columns: (auto, 1fr),
    table.header(table.cell(colspan: 2, fill: COLOR-LABEL)[*Şiddet (Ş)*]),
    [1], [İş saati kaybı yok, hemen giderilebilir, ilk yardım yeterli],
    [2], [İş günü kaybı yok, kalıcı etkisi olmayan, ayakta tedavi],
    [3], [Hafif yaralanma, yatarak tedavi gerekir],
    [4], [Ciddi yaralanma, uzun süreli tedavi, meslek hastalığı, uzuv kaybı],
    [5], [Bir veya daha fazla kişinin ölümü],
  ),
  table(columns: (auto,) + (1fr,) * 5, align: center + horizon,
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*O*], table.cell(colspan: 5, fill: COLOR-LABEL)[*Şiddet*],
    ..range(1, 6).map(s => cell-label(str(s))),
    ..range(1, 6).map(o => (cell-label(str(o)), ..range(1, 6).map(s => matrix-cell(o, s)))).flatten(),
  ),
)
#v(2pt)
#text(8.5pt)[Düzey çarpımdan değil matris hücresinden okunur (rehber s. 9).]

#v(4pt)
#table(columns: (auto, 1fr),
  table.header(cell-label[Risk düzeyi], cell-label[Rehbere göre gereken eylem]),
  matrix-cell(5, 5), [Kabul edilebilir düzeye inene kadar iş başlatılmaz; sürüyorsa derhal durdurulur. Önlemle düşürülemiyorsa faaliyet engellenir.],
  matrix-cell(4, 4), [Risk azalana kadar iş başlatılmaz; sürüyorsa derhal durdurulur, acil önlem alınır, önlem sonrası devam kararı verilir.],
  matrix-cell(3, 3), [Riski düşürmek için faaliyetler başlatılır. Önlemler zaman alabilir.],
  matrix-cell(2, 2), [İlave kontrole gerek olmayabilir; mevcut kontroller sürdürülür ve denetlenir.],
  matrix-cell(1, 1), [Kontrol planlamaya ve kayıt tutmaya gerek olmayabilir.],
)
#text(8.5pt)[*Önlem sırası (Yön. md. 10):* tehlikeyi ortadan kaldır, daha az tehlikeliyle değiştir, kaynağında mücadele et, tecrit/havalandırma/organizasyon, en son kişisel koruyucu donanım (KKD). Toplu önlem bireysel önlemden önce gelir.]

#pagebreak()

= 2. Periyodik kontroller

#table(columns: (auto, auto, 1fr),
  table.header(cell-label[Konu], cell-label[Sıklık], cell-label[Dayanak / not]),
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

#if KIND == "blank" [
  #text(8.5pt)[*Nasıl doldurulur:* *O* ve *Ş* 1. bölümdeki ölçeklerden 1-5 arası seçilir; *Skor = O × Ş*; *Düzey* matristen (O satırı, Ş sütunu) okunur. Önlem sonrası risk aynı şekilde doldurulur. Tabloda olmayan tehlike boş satırlara eklenir.]
] else [
  #text(8.5pt)[Düzey L tipi matristen okunur. Tabloda olmayan, yerinde bulunan tehlikeler boş satırlara eklenir.]
]
#v(2pt)

#let score-cell(x) = if x == none { [] } else { align(center)[#x] }
#let scores(l, s, score, d) = (score-cell(l), score-cell(s), score-cell(score), level-cell(d))
// Blank form: status is filled by hand, so leave it empty.
#let status-cell(s) = if KIND == "blank" { [] } else if s.status == "done" { [Tamam] } else { [Açık] }
#let body-cells = {
  let cells = ()
  let no = 0
  for g in V.groups {
    if g.title != "" { cells.push(table.cell(colspan: 17, fill: COLOR-GROUP)[*#g.title*]) }
    for m in g.locations {
      cells.push(table.cell(colspan: 17, fill: COLOR-LOCATION)[*#m.name*])
      for s in m.rows {
        no += 1
        cells += (
          [#no], [*#s.equipment*], s.hazard, s.affected, s.existingControls,
          ..scores(s.likelihood, s.severity, s.score, s.level),
          s.action, s.responsible, date-or-blank(s.dueDate), status-cell(s),
          ..scores(s.likelihoodAfter, s.severityAfter, s.scoreAfter, s.levelAfter),
        )
      }
    }
  }
  cells.push(table.cell(colspan: 17, fill: COLOR-LOCATION)[*Ekip tarafından eklenen tehlikeler*])
  for _ in range(6) {
    no += 1
    cells += ([#no], [#v(0.9cm)]) + ([],) * 15
  }
  cells
}

#[
#show table.cell: set text(size: 7.5pt)
#table(
  columns: (0.6cm, 2.6cm, 3.8cm, 1.5cm, 1.6cm, 0.75cm, 0.75cm, 0.95cm, 1.5cm, 1fr, 1.9cm, 1.2cm, 1.5cm, 0.75cm, 0.75cm, 0.95cm, 1.5cm),
  inset: (x: 2.5pt, y: 2.5pt),
  table.header(
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*No*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Alet / ekipman grubu*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Tehlike ve risk*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Etkilenen*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Mevcut önlem*],
    table.cell(colspan: 4, fill: COLOR-LABEL, align: center)[*Mevcut risk*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Düzeltici / önleyici faaliyet*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Sorumlu*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Bitiş tarihi*],
    table.cell(rowspan: 2, fill: COLOR-LABEL)[*Durum*],
    table.cell(colspan: 4, fill: COLOR-LABEL, align: center)[*Önlem sonrası risk*],
    cell-label[O], cell-label[Ş], cell-label[Skor], cell-label[Düzey],
    cell-label[O], cell-label[Ş], cell-label[Skor], cell-label[Düzey],
  ),
  ..body-cells,
)
]

#pagebreak()
]

// ─── Kontrol listeleri ──────────────────────────────────────
#if V.checklists.len() > 0 [
= #if KIND == "checklists" [Kontrol listeleri] else [4. Kontrol listeleri]

#text(8.5pt)[Her madde yerinde gözlemle işaretlenir. "Hayır" işaretlenen madde için risk analiz tablosuna satır açılır veya mevcut satır güncellenir. U/D: uygulanamaz.]
#v(2pt)

#let check-box(m, value) = if m.answer == value { box-checked } else { box-empty }
#for k in V.checklists {
  table(
    columns: (0.9cm, 1fr, 1cm, 1cm, 1cm, 5cm),
    align: (center + horizon, left + horizon, center + horizon, center + horizon, center + horizon, left + horizon),
    table.header(
      table.cell(colspan: 6, fill: COLOR-LABEL)[*#k.code #if not is-blank(k.code) [—] #k.name*],
      cell-label[No], cell-label[Kontrol maddesi], cell-label[Evet], cell-label[Hayır], cell-label[U/D], cell-label[Açıklama / tarih / sorumlu],
    ),
    ..k.items.map(m => (
      [#m.no], [#m.text], check-box(m, "yes"), check-box(m, "no"), check-box(m, "na"), [#m.note],
    )).flatten(),
  )
  v(6pt)
}
]

// ─── İmza ───────────────────────────────────────────────────
#v(4pt)
#let signatories = V.school.signatories
#if signatories.len() > 0 {
  block(breakable: false)[
    *Risk değerlendirme ekibi* (Yön. md. 6, md. 11: sayfalar paraflanır, son sayfa imzalanır)
    #v(2pt)
    #table(
      columns: (1fr,) * signatories.len(), align: center + horizon,
      table.header(..signatories.map(k => cell-label(k.title))),
      ..signatories.map(k => if is-blank(k.name) [Ad Soyad:] else [*#k.name*]),
      ..signatories.map(_ => [#v(1.2cm) İmza]),
    )
  ]
}
