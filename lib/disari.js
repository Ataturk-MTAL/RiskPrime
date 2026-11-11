// Tarayıcıda dosya üretip indirme: PDF (typst.ts), Excel (SheetJS), Word (docx).
// Yalnız tarayıcıda çalışır; saf veri dönüşümleri lib/cikti.js'te test edilir.
(function (kok) {
  'use strict';

  const cikti = kok.RiskPrime.cikti;
  const TYPST_SURUM = '0.7.0';
  const CDN = 'https://cdn.jsdelivr.net/npm/@myriaddreamin';
  const FONTLAR = ['vendor/fonts/IBMPlexSans-Regular.ttf', 'vendor/fonts/IBMPlexSans-Bold.ttf'];
  const PDF_EKLERI = Object.freeze({ tam: '', kontrol: 'kontrol-listeleri', bos: 'bos-form' });

  function indirBlob(blob, ad) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ad;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function getir(yol, tur) {
    const yanit = await fetch(yol);
    if (!yanit.ok) throw new Error(`${yol} yüklenemedi (${yanit.status})`);
    return tur === 'metin' ? yanit.text() : new Uint8Array(await yanit.arrayBuffer());
  }

  // ─── PDF ───────────────────────────────────────────────
  let typstSozu = null;

  // Derleyici (~28 MB wasm) ilk PDF isteğinde bir kez yüklenir, sonra tarayıcı önbelleğinden gelir.
  function typstHazirla() {
    if (!typstSozu) {
      typstSozu = (async () => {
        if (location.protocol === 'file:') {
          throw new Error('PDF için sayfa bir adresle açılmalı (GitHub Pages ya da yerel sunucu); dosyaya çift tıklayınca PDF üretilemez.');
        }
        const { $typst, TypstSnippet } = await import(`${CDN}/typst.ts@${TYPST_SURUM}/dist/esm/contrib/all-in-one-lite.bundle.js`);
        $typst.setCompilerInitOptions({
          getModule: () => `${CDN}/typst-ts-web-compiler@${TYPST_SURUM}/pkg/typst_ts_web_compiler_bg.wasm`,
        });
        const fontlar = await Promise.all(FONTLAR.map((f) => getir(f)));
        $typst.use(TypstSnippet.preloadFonts(fontlar));
        await $typst.addSource('/rapor.typ', await getir('sablon/rapor.typ', 'metin'));
        return $typst;
      })();
      typstSozu.catch(() => { typstSozu = null; });
    }
    return typstSozu;
  }

  /** tur: tam | kontrol | bos */
  async function pdfIndir(d, tur) {
    const $typst = await typstHazirla();
    const veri = new TextEncoder().encode(JSON.stringify(cikti.pdfVerisi(d, tur)));
    await $typst.mapShadow('/veri.json', veri);
    const pdf = await $typst.pdf({ mainFilePath: '/rapor.typ' });
    if (!pdf) throw new Error('PDF derlenemedi; ayrıntı tarayıcı konsolunda.');
    indirBlob(new Blob([pdf], { type: 'application/pdf' }), cikti.ciktiAdi(d, 'pdf', PDF_EKLERI[tur]));
  }

  // ─── Excel ─────────────────────────────────────────────
  const RISK_SUTUNLARI = [
    ['mekan', 'Mekân'], ['bina', 'Bina'], ['alan', 'Alan'], ['no', 'No'], ['alet', 'Alet / ekipman grubu'],
    ['tehlike', 'Tehlike ve risk'], ['etkilenen', 'Etkilenen'], ['mevcut', 'Mevcut önlem'],
    ['o', 'O'], ['s', 'Ş'], ['skor', 'Skor'], ['duzey', 'Düzey'],
    ['onlem', 'Düzeltici / önleyici faaliyet'], ['sorumlu', 'Sorumlu'], ['bitis', 'Bitiş tarihi'], ['durum', 'Durum'],
    ['o2', 'O (sonra)'], ['s2', 'Ş (sonra)'], ['skor2', 'Skor (sonra)'], ['duzey2', 'Düzey (sonra)'],
  ];
  const KONTROL_SUTUNLARI = [
    ['kod', 'Liste kodu'], ['ad', 'Liste adı'], ['no', 'Madde no'], ['metin', 'Madde'],
    ['cevap', 'Cevap'], ['aciklama', 'Açıklama'],
  ];

  function tablo(satirlar, sutunlar) {
    return [sutunlar.map(([, b]) => b), ...satirlar.map((s) => sutunlar.map(([k]) => s[k]))];
  }

  function excelIndir(d) {
    const XLSX = kok.XLSX;
    if (!XLSX) throw new Error('Excel kütüphanesi yüklenemedi.');
    const kitap = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(kitap, XLSX.utils.aoa_to_sheet(tablo(cikti.riskSatirlari(d), RISK_SUTUNLARI)), 'Risk Tablosu');
    XLSX.utils.book_append_sheet(kitap, XLSX.utils.aoa_to_sheet(tablo(cikti.kontrolSatirlari(d), KONTROL_SUTUNLARI)), 'Kontrol Listeleri');
    XLSX.writeFile(kitap, cikti.ciktiAdi(d, 'xlsx'));
  }

  // ─── Word ──────────────────────────────────────────────
  function wordTablosu(docx, satirlar, sutunlar) {
    const hucre = (metin, kalin) => new docx.TableCell({
      children: [new docx.Paragraph({ children: [new docx.TextRun({ text: String(metin ?? ''), bold: kalin, size: 16 })] })],
    });
    return new docx.Table({
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      rows: tablo(satirlar, sutunlar).map((r, i) => new docx.TableRow({
        tableHeader: i === 0, children: r.map((m) => hucre(m, i === 0)),
      })),
    });
  }

  async function wordIndir(d) {
    const docx = kok.docx;
    if (!docx) throw new Error('Word kütüphanesi yüklenemedi.');
    const baslik = (metin, duzey) => new docx.Paragraph({ text: metin, heading: duzey });
    const imzacilar = d.okul.imzacilar.map((k) => new docx.Paragraph(`${k.unvan}: ${k.ad || '................'}    İmza: ........`));
    const belge = new docx.Document({
      sections: [{
        properties: { page: { size: { orientation: docx.PageOrientation.LANDSCAPE } } },
        children: [
          new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [new docx.TextRun({ text: `T.C. MİLLÎ EĞİTİM BAKANLIĞI — ${d.okul.okul}`, bold: true })] }),
          baslik(`${d.okul.kapsam} Risk Değerlendirmesi ve Kontrol Listesi ${d.donem}`.trim(), docx.HeadingLevel.TITLE),
          new docx.Paragraph(`Değerlendirme tarihi: ${d.degerlendirmeTarihi || '..../..../20....'}    Geçerlilik tarihi: ${d.gecerlilikTarihi || '..../..../20....'}`),
          baslik('Risk analiz tablosu', docx.HeadingLevel.HEADING_1),
          wordTablosu(docx, cikti.riskSatirlari(d), RISK_SUTUNLARI.filter(([k]) => !['bina', 'alan'].includes(k))),
          baslik('Kontrol listeleri', docx.HeadingLevel.HEADING_1),
          wordTablosu(docx, cikti.kontrolSatirlari(d), KONTROL_SUTUNLARI),
          baslik('Risk değerlendirme ekibi', docx.HeadingLevel.HEADING_1),
          ...imzacilar,
        ],
      }],
    });
    indirBlob(await docx.Packer.toBlob(belge), cikti.ciktiAdi(d, 'docx'));
  }

  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { disari: Object.freeze({ pdfIndir, excelIndir, wordIndir, indirBlob }) });
})(window);
