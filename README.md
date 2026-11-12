# RiskPrime — İSG Risk Değerlendirmesi

Okul mekânlarının (atölye, depo, oda, ıslak hacim) iş sağlığı ve güvenliği risk değerlendirmesini tarayıcıda hazırlamak için tek sayfalık araç. Yöntem: MEB Risk Değerlendirme Rehberi L tipi matris (Risk = Olasılık × Şiddet).

Mersin Atatürk Mesleki ve Teknik Anadolu Lisesi Elektrik-Elektronik Teknolojisi Alanı'nda geliştirildi. Her MEB okulu ve alanı kendi verisiyle kullanabilir.

## Kullanım

1. Yayınlanmış sayfayı açın (ya da yerelde `pnpm dev`).
2. Mekânları (bina ve alan etiketiyle) ve risk satırlarını ekleyin, düzenleyin, silin. O ve Ş seçince skor ve renkli düzey görünür.
   - "+ Hazır formdan ekle": elektrik-elektronik hazır mekânları (risk satırlarıyla) ve kontrol listelerini, MEB KL-01–KL-43 listelerini seçip ekleyin; istemediğinizi silin.
   - "Kontrol listeleri" sekmesi: Evet / Hayır / U-D işaretleyin, açıklama yazın. MEB listesinin hazır metni kilitlidir; madde eklenip çıkarılabilir.
   - Excel üç sayfadır: "Okul Bilgileri" (okul, dönem, tarihler, gruplama, imzacılar), "Kontrol Listesi", "Risk Satırları". Menüdeki "Excel şablonu: MEB KL-01–KL-43" dosyasında MEB kontrol listelerinin tamamı hazır; okul sayfasını doldurup "Dosya aç" ile yükleyin.
   - Kendi listeniz ya da risk satırlarınız için "diğer biçimler → Excel içe alma şablonu"nu doldurup "Dosya aç" ile yükleyin.
3. "PDF indir" tam belgeyi verir. "▾ diğer biçimler" menüsünde: kayıt dosyası (`risk-<dönem>.json`), yalnız kontrol listeleri PDF'i, boş form PDF'i, Excel ve Word. Kayıt olarak iki biçim tekrar açılabilir: `.json` ve Excel (`.xlsx`); ikisi de çalışmayı eksiksiz geri yükler (Excel, sayfa ve sütun adları değiştirilmeden Excel'de de düzenlenebilir). Sonraki sefer "Dosya aç" ile ya da sayfaya sürükleyerek açın; açılan kayıt mevcut çalışmanın yerine geçer. PDF ve Word yalnız çıktıdır.
4. PDF tarayıcıda Typst (typst.ts) ile üretilir; sayfa bir adresle açılmalıdır (GitHub Pages ya da yerel sunucu). İlk PDF'te derleyici (~28 MB) bir kez indirilir.

## Gizlilik

Veriler yalnız tarayıcıda işlenir; hiçbir sunucuya gönderilmez. Kişisel öğrenci verisi kullanılmaz. Tarayıcı çalışma kopyasını hatırlar; kalıcı kayıt indirilen dosyadır.

## Geliştirme

Yığın: Vite+ (`vp`) + Svelte 5 + TypeScript + Tailwind 4 + shadcn-svelte (bits-ui). Paket yöneticisi pnpm. Kod İngilizce, arayüz Türkçe.

| Komut                                         | İş                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm install`                                | Bağımlılıklar (SheetJS `vendor/xlsx-0.20.3.tgz`'den gelir)                            |
| `pnpm dev`                                    | Geliştirme sunucusu                                                                   |
| `pnpm build` / `pnpm preview`                 | Statik derleme `dist/` (GitHub Pages) ve önizleme                                     |
| `pnpm test`                                   | vitest: alan mantığı ve üreteç testleri                                               |
| `pnpm check`                                  | svelte-check tip denetimi                                                             |
| `pnpm lint` / `pnpm fmt`                      | Vite+ lint (oxlint) ve biçimlendirme                                                  |
| `pnpm lint:english`                           | ast-grep: kodda Türkçe tanımlayıcı yasak (`tools/ast-grep/`)                          |
| `pnpm generate:starter <Planlar/RISK-ANALIZ>` | `src/lib/data/starter.json` (Typst 0.15 gerekir)                                      |
| `pnpm generate:library <KL01-KL43 PDF>`       | `src/lib/data/library.json` (pdftotext gerekir; starter'dan sonra)                    |
| `pnpm generate:sample`                        | `public/samples/riskprime-meb-kl-sablonu.xlsx`: MEB KL-01–KL-43 dolu içe alma şablonu |

Yapı:

- `src/lib/domain/`: veri modeli (`types.ts` = kayıt dosyası biçimi), matris, değerlendirme, kontrol listesi, dosya doğrulama, çıktı verisi, Excel içe alma. Saf, test edilir.
- `src/lib/export/`: PDF (typst.ts, ilk kullanımda yüklenir), Excel, Word, indirme.
- `src/lib/state.svelte.ts`: uygulama durumu, tarayıcı hafızası, dosya aç/indir.
- `src/lib/components/`: ekranlar; `ui/` shadcn-svelte'ten üretilir (`pnpm dlx shadcn-svelte@1.8.0 add <ad> --yes --no-deps-install`).
- `public/template/report.typ`: PDF şablonu; `public/fonts/`: IBM Plex Sans (OFL).
- Tasarım: `docs/superpowers/specs/2026-11-11-riskprime-design.md`.

## Kontrol listelerini güncelleme

1. `content/questions/*.toml` dosyalarını düzenleyin (`meb.toml`: MEB maddeleri, `riskprime-*.toml`: RiskPrime maddeleri; `common.toml`: farklı listelerde aynı şeyi soran MEB maddelerinin ortak grupları, `[[common]] id, title, keys`).
2. `content/questions/bank.toml` içindeki `version` değerini artırın.
3. `content/CHANGELOG.md` dosyasına aynı sürümle bir `## <sürüm>` girişi ekleyin.
4. `pnpm bank:build` çalıştırın: doğrular, `src/lib/data/questions.json` dosyasını (ve `library.json` metinlerini) yeniden üretir. CI `pnpm bank:check` ile güncelliği denetler.
