# RiskPrime — İSG Risk Değerlendirmesi

Okul mekânlarının (atölye, depo, oda, ıslak hacim) iş sağlığı ve güvenliği risk değerlendirmesini tarayıcıda hazırlamak için tek sayfalık araç. Yöntem: MEB Risk Değerlendirme Rehberi L tipi matris (Risk = Olasılık × Şiddet).

## Kullanım

1. `index.html` dosyasını açın (ya da yayınlanmış sayfayı).
2. Mekânları (bina ve alan etiketiyle) ve risk satırlarını ekleyin, düzenleyin, silin. O ve Ş seçince skor ve renkli düzey görünür.
3. "PDF indir" tam belgeyi verir. "▾ diğer biçimler" menüsünde: kayıt dosyası (`risk-<dönem>.json`), yalnız kontrol listeleri PDF'i, boş form PDF'i, Excel ve Word. Uygulamada tekrar açılabilen tek biçim `.json`'dur; sonraki sefer "Dosya aç" ile ya da sayfaya sürükleyerek açın.
4. PDF tarayıcıda Typst (typst.ts) ile üretilir; sayfa bir adresle açılmalıdır (GitHub Pages ya da yerel sunucu). İlk PDF'te derleyici (~28 MB) bir kez indirilir.

## Gizlilik

Veriler yalnız tarayıcıda işlenir; hiçbir sunucuya gönderilmez. Kişisel öğrenci verisi kullanılmaz. Tarayıcı çalışma kopyasını hatırlar; kalıcı kayıt indirilen dosyadır.

## Geliştirme

- Testler: `npm test` (Node ≥ 20).
- Başlangıç verisini yeniden üretmek: `node scripts/baslangic-uret.js <Planlar/RISK-ANALIZ klasörü>` (Typst 0.15 gerekir).
- Yerelde çalıştırma: `python3 -m http.server 8766` ve `http://127.0.0.1:8766/`.
- Tasarım: `docs/superpowers/specs/2026-11-11-riskprime-design.md`; plan: `docs/superpowers/plans/`.
