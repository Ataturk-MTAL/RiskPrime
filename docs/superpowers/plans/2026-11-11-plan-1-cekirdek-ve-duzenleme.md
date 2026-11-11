# RiskPrime Plan 1 — Çekirdek ve Düzenleme Ekranı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tarayıcıda açılan, mekân ve risk satırı ekleyip düzenleyip silinebilen, O/Ş ile düzeyi anında gösteren, değerlendirmeyi JSON olarak indirip açabilen ilk denenebilir RiskPrime.

**Architecture:** Build adımı olmayan statik sayfa. `lib/*.js` saf mantık (DOM yok), hem tarayıcıda klasik `<script>` ile (global `window.RiskPrime`) hem Node'da `require` ile yüklenir; böylece `file://` ile de açılır ve `node --test` ile sınanır. `app.js` yalnız DOM ve olaylar. Başlangıç verisi `Planlar/RISK-ANALIZ` Typst verisinden bir betikle üretilir.

**Tech Stack:** Düz JavaScript (ES2022), HTML, CSS; Node ≥ 20 `node:test`; Typst 0.15 (`typst eval`) yalnız başlangıç verisini üretmek için.

## Global Constraints

- Şartname: `docs/superpowers/specs/2026-11-11-riskprime-design.md`.
- L matris birebir: O\Ş satırları `A D D D D / D D D O O / D D O O Y / D O O Y Y / D O Y Y T` (A Anlamsız, D Düşük, O Orta, Y Yüksek, T Tolere edilemez).
- O, Ş, O2, Ş2: 1-5 tam sayı ya da `null`.
- Mekân türleri: `atolye | depo | ofis | islak | ortak`. Gruplama: `alan | bina | yok`. Durum: `acik | tamam`. Kontrol cevabı: `evet | hayir | ud | ""`. Liste kaynağı: `ic | dis`.
- `surum: 1`.
- Model işlemleri girdiyi değiştirmez; her biri yeni kopya döner.
- Arayüz metni Türkçe; kullanıcı metni HTML'e kaçışlanarak basılır.
- Kişisel öğrenci verisi yok; hiçbir veri sunucuya gönderilmez.
- Commit mesajı: `<tür>: <açıklama>` (feat, fix, docs, test, chore); Claude co-author satırı yok.

## Kapsam dışı (sonraki planlar)

- Plan 2: kontrol listeleri ekranı + MEB KL kütüphanesi.
- Plan 3: Excel içe alma şablonu (SheetJS).
- Plan 4: PDF (typst.ts): tam belge, yalnız kontrol listesi, boş form.
- Plan 5: yeni yıla kopyalama + iki yılı karşılaştırma.

## Dosya yapısı

| Dosya                              | Sorumluluk                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `package.json`                     | test komutu                                                                  |
| `lib/matris.js`                    | `gecerliPuan`, `skor`, `duzey`, `MATRIS`, `DUZEYLER`                         |
| `lib/model.js`                     | değerlendirme oluşturma; mekân/satır/imzacı işlemleri; `etiketler`, `gruplu` |
| `lib/dosya.js`                     | `dogrula`, `oku`, `yaz`, `dosyaAdi`                                          |
| `scripts/baslangic-uret.js`        | Typst verisinden `veri/baslangic.js` üretir                                  |
| `veri/baslangic.js`                | üretilmiş başlangıç değerlendirmesi                                          |
| `index.html`, `stil.css`, `app.js` | arayüz                                                                       |
| `tests/*.test.js`                  | `node --test`                                                                |

Kod bloklarının tam içeriği uygulama sırasında depoya yazılan dosyalardır; plan, her görevin dosyalarını, arayüzlerini, test komutlarını ve beklenen sonuçlarını tanımlar. Dosyaların tam içeriği ilgili commit'lerdedir (`git show <commit>`); aşağıda her görev için test kodu, uygulama kodu ve doğrulama adımları yer alır.

---

### Task 1: Risk matrisi

**Files:** Create `package.json`, `.gitignore`, `lib/matris.js`; Test `tests/matris.test.js`

**Interfaces:**

- Produces: `RiskPrime.matris` / `require('./lib/matris.js')` → `{ MATRIS, DUZEYLER, gecerliPuan(p): boolean, skor(o, s): number|null, duzey(o, s): {kod, ad, zemin, yazi}|null }`

- [ ] Step 1: `package.json` (`"test": "node --test"`), `.gitignore` (`node_modules/`, `.DS_Store`).
- [ ] Step 2: Failing test `tests/matris.test.js`: 25 hücrenin düzeyi rehber tablosuyla birebir; `skor(3,5)=15`; `[null,3] [3,null] [0,3] [6,1] [2.5,2] ['3',3]` için skor ve düzey `null`; `gecerliPuan` yalnız 1-5 tam sayı.
- [ ] Step 3: `npm test` → FAIL `Cannot find module '../lib/matris.js'`.
- [ ] Step 4: `lib/matris.js`: dondurulmuş `MATRIS` ve `DUZEYLER` (A `#d9d9d9`, D `#92d050`, O `#ffff00`, Y `#ff0000`, T `#000000` beyaz yazı); `duzey = DUZEYLER[MATRIS[o-1][s-1]]`; UMD sarmalayıcı (`window.RiskPrime.matris` + `module.exports`).
- [ ] Step 5: `npm test` → 4 pass.
- [ ] Step 6: Commit `feat: L tipi risk matrisi`.

### Task 2: Değerlendirme modeli

**Files:** Create `lib/model.js`; Test `tests/model.test.js`

**Interfaces:**

- Consumes: `matris.gecerliPuan`.
- Produces: `RiskPrime.model` → `SURUM, TURLER, GRUPLAMALAR, DURUMLAR, yeniId(onek), bosDegerlendirme(donem), bosSatir(id), ustBilgiGuncelle(d, {donem, degerlendirmeTarihi, gecerlilikTarihi}), okulGuncelle(d, {okul, kapsam, gruplama}), imzaciEkle(d, unvan), imzaciGuncelle(d, sira, {unvan, ad}), imzaciSil(d, sira), mekanEkle(d, {id?, ad, tur, bina, alan}), mekanGuncelle(d, id, {ad, tur, bina, alan}), mekanSil(d, id), mekanTasi(d, id, -1|1), satirEkle(d, mekanId, girdi), satirGuncelle(d, mekanId, satirId, degisiklik), satirSil(d, mekanId, satirId), etiketler(d, 'bina'|'alan'): string[], gruplu(d): {baslik, mekanlar}[]`. Hepsi yeni kopya döner; bilinmeyen kimlikte `Error` (`Mekân bulunamadı`, `Satır bulunamadı`, `İmzacı bulunamadı`); geçersiz tür/gruplama/durum/puanda `Error`. Güncellemeler yalnız izinli alanları alır (`id` değişmez).

- [ ] Step 1: Failing test (11 test): varsayılan 5 imzacı; hiçbir işlem girdiyi değiştirmez (JSON anlık görüntü karşılaştırması); mekân ekle/güncelle/sil, `id` değişmez; boş ad → "Yeni mekân", `a-` önekli id; geçersiz tür ve bilinmeyen kimlik hataları; taşıma uçta aynı nesne; puan 1-5/null, durum `acik|tamam`; yeni satır boş; imzacı ekle/güncelle/sil; etiketler tekil-alfabetik (`tr`); gruplama alan/bina/yok, `(Belirtilmemiş)` başlığı.
- [ ] Step 2: `npm test` → FAIL.
- [ ] Step 3: `lib/model.js` (spread ile kopya; `sec()` izinli alan süzgeci; `crypto.randomUUID` ya da zaman+rastgele).
- [ ] Step 4: `npm test` → pass.
- [ ] Step 5: Commit `feat: değerlendirme modeli (mekân, satır, imzacı işlemleri)`.

### Task 3: Dosya okuma, yazma, doğrulama

**Files:** Create `lib/dosya.js`; Test `tests/dosya.test.js`

**Interfaces:**

- Consumes: `model.SURUM/TURLER/GRUPLAMALAR/DURUMLAR`, `matris.gecerliPuan`.
- Produces: `RiskPrime.dosya` → `dogrula(v): string[]`, `oku(metin): {degerlendirme} | {hatalar}`, `yaz(d): string` (2 boşluk girintili JSON + satır sonu), `dosyaAdi(d): "risk-<dönem>.json"` (dönem boşsa `risk-degerlendirme.json`).

- [ ] Step 1: Failing test (7 test): yaz→oku gidiş-dönüş; bozuk JSON → `Dosya okunamadı: geçerli bir JSON değil.`; dizi → `Dosya bir değerlendirme nesnesi değil.`; hatalar yol ile (`mekanlar[0].tur:`, `mekanlar[0].satirlar[0].s:`); `surum: 99` → "daha yeni bir RiskPrime"; kontrol listesi cevabı doğrulanır (`kontrolListeleri[0].maddeler[0].cevap:`); dosya adı.
- [ ] Step 2: `npm test` → FAIL.
- [ ] Step 3: `lib/dosya.js`.
- [ ] Step 4: `npm test` → pass.
- [ ] Step 5: Commit `feat: değerlendirme dosyası okuma, yazma, doğrulama`.

### Task 4: Başlangıç verisi

**Files:** Create `scripts/baslangic-uret.js`, `veri/baslangic.js` (üretilir); Test `tests/baslangic.test.js`

**Interfaces:**

- Consumes: `Planlar/RISK-ANALIZ/atolye-verisi.typ` (`labs`, `gruplar`), `okul.json`; `dosya.dogrula`.
- Produces: `RiskPrime.baslangic` / `require('./veri/baslangic.js')`.

Üretim: geçici `.riskprime-uret.typ` → `typst eval 'query(<veri>).first().value' --in <geçici> --root <klasör> --format json` → dönüştür. Satır demeti `(alet, tehlike, etkilenen, mevcut, O, Ş, önlem, sorumlu, O2, Ş2)`; puanlar `null` yazılır (ekip yerinde puanlar). Tür adlardan: `tüm…` ortak, `depo` depo, `tuvalet` islak, ` odas`/` odala` ofis, diğerleri atolye. Kimlikler kararlı: `a-01`, `r-01-01`, `k-01`, `m-01-01`. Alan etiketi `Elektrik-Elektronik Teknolojisi`, bina boş, dönem `2026-2027`, kapsam `okul.alan`, imzacılar `okul.json` sırasıyla.

- [ ] Step 1: Failing test (5 test): `dogrula` boş; 18 mekân, ilki ortak, >80 satır, tüm puanlar null; tür çıkarımı (depo, islak, ofis×2, ELE13 atolye); tekil kimlikler; okul ve 5 imzacı.
- [ ] Step 2: `npm test` → FAIL.
- [ ] Step 3: `scripts/baslangic-uret.js`.
- [ ] Step 4: `node scripts/baslangic-uret.js ../Planlar/RISK-ANALIZ` → `18 mekân, … satır, 14 kontrol listesi`.
- [ ] Step 5: `npm test` → pass.
- [ ] Step 6: Commit `feat: Atatürk MTAL Elektrik-Elektronik başlangıç verisi`.

### Task 5: Düzenleme ekranı

**Files:** Create `index.html`, `stil.css`, `app.js`

**Interfaces:** Consumes `RiskPrime.matris/model/dosya/baslangic`. DOM kodu birim testsiz; elle doğrulanır.

Ekran: üst çubuk (Yeni okul verisiyle / Yeni boş / Dosya aç / Değerlendirmeyi indir), uyarılar (indirilmemiş değişiklik, tarayıcı hafızası kapalı, hata), "Okul ve kapsam" kartı (okul, kapsam, gruplama, dönem, tarihler, imzacılar), solda gruplu mekân listesi + yeni mekân formu (bina/alan öneri listesi), sağda seçili mekânın başlık alanları (ad, tür, bina, alan, ↑ ↓, sil) ve risk tablosu (No, alet, tehlike, etkilenen, mevcut önlem, O, Ş, skor, renkli düzey, düzeltici önlem, sorumlu, bitiş, durum, önlem sonrası O, Ş, düzey, sil) + "Satır ekle". Değişiklikler `change` olayında modele işlenir; puan değişince yalnız o satırın skor/düzey hücreleri güncellenir (odak kaybolmaz). Her değişiklik localStorage'a yazılır (`riskprime.calisma`), kayıp uyarısı (`beforeunload`), sürükle-bırak ile dosya açma, silmelerde onay. Kullanıcı metni `kacis()` ile basılır.

- [ ] Step 1-3: `index.html`, `stil.css`, `app.js`.
- [ ] Step 4: Elle doğrulama — `python3 -m http.server 8765` ve `http://localhost:8765/`:
  1. 18 mekân "Elektrik-Elektronik Teknolojisi" başlığı altında; ilk mekân seçili, satırlar görünür.
  2. O=3, Ş=5 → Skor 15, "Yüksek" kırmızı; O=5, Ş=5 → "Tolere edilemez" siyah.
  3. "Satır ekle" → boş satır, imleç ilk kutuda; "Sil" → onay → satır gider.
  4. Yeni mekân "Test", bina "C Blok" → seçili gelir; gruplama "Binaya göre" → "C Blok" ve "(Belirtilmemiş)".
  5. Mekânı sil → onay → liste güncel.
  6. İndir → `risk-2026-2027.json`, uyarı kalkar; yenile → veri duruyor.
  7. İndirilen dosyayı aç → aynı veri; bozuk `.json` → hata kutusu, veri değişmez.
  8. `file://` ile aç → düzenleme çalışır.
- [ ] Step 5: Commit `feat: mekân ve risk satırı düzenleme ekranı`.

### Task 6: README

- [ ] Step 1: `README.md`: amaç, kullanım (aç, düzenle, indir/aç), gizlilik, geliştirme (`npm test`, başlangıç verisi üretimi, şartname yolu).
- [ ] Step 2: Commit `docs: README ve plan 1`.

## Self-review

- Kapsam: mekân/satır/imzacı düzenleme, gruplama, JSON doğrulama, localStorage, kayıp uyarısı, başlangıç verisi. Kontrol listesi ekranı, Excel, PDF, yıl kopyalama ve karşılaştırma Plan 2-5'te. `kontrolListeleri` veri modelinde ve doğrulamada var.
- Adlar: `app.js` yalnız Task 1-3 Interfaces'teki adları kullanır.
