// RiskPrime arayüzü. Veri işlemleri lib/* içinde; burada yalnız DOM ve olaylar.
(function () {
  'use strict';

  const { matris, model, dosya } = window.RiskPrime;
  const DEPO_ANAHTARI = 'riskprime.calisma';
  const TUR_SECENEKLERI = Object.entries(model.TUR_ADLARI);
  const PUAN_ALANLARI = ['o', 's', 'o2', 's2'];
  const METIN_SUTUNLARI = [
    ['alet', 'Alet / ekipman grubu'],
    ['tehlike', 'Tehlike ve risk'],
    ['etkilenen', 'Etkilenen'],
    ['mevcut', 'Mevcut önlem'],
  ];
  const durum = { d: null, mekanId: null, kirli: false, depoAcik: true };
  const $ = (secici) => document.querySelector(secici);

  function kacis(metin) {
    const tablo = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(metin ?? '').replace(/[&<>"']/g, (c) => tablo[c]);
  }

  function kopya(nesne) {
    return JSON.parse(JSON.stringify(nesne));
  }

  // ─── Kalıcılık ve durum ─────────────────────────────────
  function depoOku() {
    try {
      const metin = localStorage.getItem(DEPO_ANAHTARI);
      return metin ? dosya.oku(metin).degerlendirme || null : null;
    } catch {
      durum.depoAcik = false;
      return null;
    }
  }

  function depoYaz() {
    try {
      localStorage.setItem(DEPO_ANAHTARI, dosya.yaz(durum.d));
    } catch {
      durum.depoAcik = false;
    }
  }

  /** tur: 'hata' (kırmızı) | 'bilgi' (turuncu). Boş metin gizler. */
  function mesaj(metin, tur = 'hata') {
    const el = $('#mesaj');
    el.textContent = metin || '';
    el.className = tur === 'bilgi' ? 'uyari' : 'hata';
    el.hidden = !metin;
  }

  function bayraklariCiz() {
    $('#kirli').hidden = !durum.kirli;
    $('#depo-kapali').hidden = durum.depoAcik;
  }

  /** Yeni değerlendirmeyi uygular. ciz: 'hepsi' | 'mekanlar' | 'yok'. */
  function uygula(yeni, { ciz = 'hepsi', kirli = true } = {}) {
    durum.d = yeni;
    if (!yeni.mekanlar.some((m) => m.id === durum.mekanId)) {
      durum.mekanId = yeni.mekanlar[0] ? yeni.mekanlar[0].id : null;
    }
    durum.kirli = kirli;
    depoYaz();
    mesaj('');
    if (ciz === 'hepsi') hepsiniCiz();
    if (ciz === 'mekanlar') mekanlariCiz();
    bayraklariCiz();
  }

  /** Model işlemini dener; hata olursa veri değişmez, mesaj gösterilir. */
  function dene(islem, secenek) {
    try {
      uygula(islem(durum.d), secenek);
      return true;
    } catch (hata) {
      mesaj(hata.message);
      return false;
    }
  }

  // ─── Çizim ──────────────────────────────────────────────
  function secenekler(liste, secili) {
    return liste
      .map(([deger, ad]) => `<option value="${kacis(deger)}"${deger === secili ? ' selected' : ''}>${kacis(ad)}</option>`)
      .join('');
  }

  function ustCiz() {
    const { d } = durum;
    for (const el of document.querySelectorAll('[data-okul]')) el.value = d.okul[el.dataset.okul];
    for (const el of document.querySelectorAll('[data-ust]')) el.value = d[el.dataset.ust];
    const dolu = d.okul.imzacilar.filter((x) => x.ad).length;
    $('#okul-ozet').textContent = [d.okul.okul, d.donem, `${dolu}/${d.okul.imzacilar.length} imzacı`].filter(Boolean).join(' · ');
    $('#imzacilar').innerHTML = d.okul.imzacilar.map((x, i) => `
      <div class="imzaci">
        <input data-imzaci="${i}" data-k="unvan" value="${kacis(x.unvan)}" aria-label="Unvan">
        <input data-imzaci="${i}" data-k="ad" value="${kacis(x.ad)}" placeholder="Ad Soyad" aria-label="Ad soyad">
        <button type="button" data-imzaci-sil="${i}">Sil</button>
      </div>`).join('');
  }

  function etiketListeleriCiz() {
    const secenek = (x) => `<option value="${kacis(x)}">`;
    $('#bina-listesi').innerHTML = model.etiketler(durum.d, 'bina').map(secenek).join('');
    $('#alan-listesi').innerHTML = model.etiketler(durum.d, 'alan').map(secenek).join('');
  }

  function mekanlariCiz() {
    const html = model.gruplu(durum.d).map((g) => `
      ${g.baslik ? `<h3>${kacis(g.baslik)}</h3>` : ''}
      <ul>${g.mekanlar.map((m) => `
        <li><button type="button" data-mekan="${kacis(m.id)}" class="${m.id === durum.mekanId ? 'secili' : ''}">
          <span>${kacis(m.ad)}</span><span class="sayac">${m.satirlar.length}</span>
        </button></li>`).join('')}
      </ul>`).join('');
    $('#mekan-listesi').innerHTML = durum.d.mekanlar.length ? html : '<p class="bos">Henüz mekân yok.</p>';
    etiketListeleriCiz();
  }

  function duzeyHtml(o, s) {
    const dz = matris.duzey(o, s);
    return dz
      ? `<span class="duzey" style="background:${dz.zemin};color:${dz.yazi}">${dz.ad}</span>`
      : '<span class="duzey bos">—</span>';
  }

  function puanSecimi(satir, alan) {
    const secenek = ['', 1, 2, 3, 4, 5].map((p) => {
      const secili = satir[alan] === (p === '' ? null : p);
      return `<option value="${p}"${secili ? ' selected' : ''}>${p === '' ? '—' : p}</option>`;
    }).join('');
    return `<select data-satir="${kacis(satir.id)}" data-k="${alan}" aria-label="${alan}">${secenek}</select>`;
  }

  function metinKutusu(satir, alan, etiket) {
    return `<textarea data-satir="${kacis(satir.id)}" data-k="${alan}" aria-label="${etiket}" rows="2">${kacis(satir[alan])}</textarea>`;
  }

  function satirHtml(satir, sira) {
    const id = kacis(satir.id);
    return `<tr data-satir-satiri="${id}">
      <td class="no">${sira}</td>
      ${METIN_SUTUNLARI.map(([k, e]) => `<td>${metinKutusu(satir, k, e)}</td>`).join('')}
      <td>${puanSecimi(satir, 'o')}</td>
      <td>${puanSecimi(satir, 's')}</td>
      <td class="skor" data-skor>${matris.skor(satir.o, satir.s) ?? ''}</td>
      <td data-duzey="1">${duzeyHtml(satir.o, satir.s)}</td>
      <td>${metinKutusu(satir, 'onlem', 'Düzeltici önlem')}</td>
      <td>${metinKutusu(satir, 'sorumlu', 'Sorumlu')}</td>
      <td><input data-satir="${id}" data-k="bitis" value="${kacis(satir.bitis)}" placeholder="GG.AA.YYYY" size="10" aria-label="Bitiş tarihi"></td>
      <td><select data-satir="${id}" data-k="durum" aria-label="Durum">${secenekler([['acik', 'Açık'], ['tamam', 'Tamam']], satir.durum)}</select></td>
      <td>${puanSecimi(satir, 'o2')}</td>
      <td>${puanSecimi(satir, 's2')}</td>
      <td data-duzey="2">${duzeyHtml(satir.o2, satir.s2)}</td>
      <td><button type="button" data-satir-sil="${id}">Sil</button></td>
    </tr>`;
  }

  function seciliMekan() {
    return durum.d.mekanlar.find((m) => m.id === durum.mekanId) || null;
  }

  function satirlariCiz() {
    const kutu = $('#satirlar');
    const mekan = seciliMekan();
    if (!mekan) {
      kutu.innerHTML = '<p class="bos">Soldan bir mekân seçin ya da yeni mekân ekleyin.</p>';
      return;
    }
    kutu.innerHTML = `
      <div class="mekan-baslik">
        <label>Mekân adı <input data-mekan-k="ad" value="${kacis(mekan.ad)}"></label>
        <label>Tür <select data-mekan-k="tur">${secenekler(TUR_SECENEKLERI, mekan.tur)}</select></label>
        <label>Bina <input data-mekan-k="bina" list="bina-listesi" value="${kacis(mekan.bina)}" placeholder="ör. C Blok"></label>
        <label>Alan <input data-mekan-k="alan" list="alan-listesi" value="${kacis(mekan.alan)}"></label>
        <div class="dugmeler">
          <button type="button" data-mekan-tasi="-1" title="Yukarı taşı">↑</button>
          <button type="button" data-mekan-tasi="1" title="Aşağı taşı">↓</button>
          <button type="button" data-mekan-sil class="tehlikeli">Mekânı sil</button>
        </div>
      </div>
      <div class="tablo-kap">
        <table class="risk">
          <thead>
            <tr>
              <th rowspan="2">No</th>
              ${METIN_SUTUNLARI.map(([, e]) => `<th rowspan="2">${e}</th>`).join('')}
              <th colspan="4">Mevcut risk</th>
              <th rowspan="2">Düzeltici / önleyici faaliyet</th>
              <th rowspan="2">Sorumlu</th>
              <th rowspan="2">Bitiş</th>
              <th rowspan="2">Durum</th>
              <th colspan="3">Önlem sonrası</th>
              <th rowspan="2"></th>
            </tr>
            <tr><th>O</th><th>Ş</th><th>Skor</th><th>Düzey</th><th>O</th><th>Ş</th><th>Düzey</th></tr>
          </thead>
          <tbody>${mekan.satirlar.map((s, i) => satirHtml(s, i + 1)).join('')}</tbody>
        </table>
      </div>
      <button type="button" id="satir-ekle" class="birincil">Satır ekle</button>`;
  }

  // Diğer ekranlar (kontrol-ekrani.js) tam çizimde kendini yeniler.
  const ekCizimler = [];

  function hepsiniCiz() {
    ustCiz();
    mekanlariCiz();
    satirlariCiz();
    ekCizimler.forEach((ciz) => ciz());
    bayraklariCiz();
  }

  function puanHucreleriniGuncelle(satirId) {
    const satir = seciliMekan().satirlar.find((s) => s.id === satirId);
    const tr = [...document.querySelectorAll('[data-satir-satiri]')].find((x) => x.dataset.satirSatiri === satirId);
    if (!satir || !tr) return;
    tr.querySelector('[data-skor]').textContent = matris.skor(satir.o, satir.s) ?? '';
    tr.querySelector('[data-duzey="1"]').innerHTML = duzeyHtml(satir.o, satir.s);
    tr.querySelector('[data-duzey="2"]').innerHTML = duzeyHtml(satir.o2, satir.s2);
  }

  // ─── Dosya işlemleri ────────────────────────────────────
  function kayipOnayi() {
    return !durum.kirli || window.confirm('İndirilmemiş değişiklikler kaybolacak. Devam edilsin mi?');
  }

  function yeniAc(uret) {
    if (kayipOnayi()) uygula(uret(), { kirli: false });
  }

  function hataListesi(baslik, hatalar) {
    const kalan = hatalar.length - 8;
    return `${baslik}\n${hatalar.slice(0, 8).join('\n')}${kalan > 0 ? `\n… ve ${kalan} hata daha` : ''}`;
  }

  /** Excel içe alma: mevcut değerlendirmeye ekler (hepsi-ya-hiç). */
  async function excelIceAl(f) {
    const { excel, disari } = window.RiskPrime;
    let sayfalar;
    try {
      sayfalar = await disari.excelOku(f);
    } catch (hata) {
      mesaj(`"${f.name}" okunamadı: ${hata.message}`);
      return;
    }
    const cakisan = excel.cakisanKodlar(durum.d, sayfalar);
    const ayniKod = cakisan.length && window.confirm(
      `${cakisan.join(', ')} kodlu liste zaten var.\nTamam: mevcut listeyi değiştir (cevaplar silinir)\nİptal: yanına yeni liste olarak ekle`,
    ) ? 'degistir' : 'ekle';
    const sonuc = excel.oku(durum.d, sayfalar, { ayniKod });
    if (sonuc.hatalar) {
      mesaj(hataListesi(`"${f.name}" içe alınamadı, hiçbir şey eklenmedi:`, sonuc.hatalar));
      return;
    }
    uygula(sonuc.degerlendirme);
    const o = sonuc.ozet;
    mesaj(`İçe alındı: ${o.liste} kontrol listesi (${o.madde} madde), ${o.satir} risk satırı, ${o.mekan} yeni mekân.`, 'bilgi');
  }

  async function dosyaAc(f) {
    if (/\.xlsx?$/i.test(f.name)) {
      await excelIceAl(f);
      return;
    }
    let metin;
    try {
      metin = await f.text();
    } catch {
      mesaj(`"${f.name}" okunamadı.`);
      return;
    }
    const sonuc = dosya.oku(metin);
    if (sonuc.hatalar) {
      mesaj(hataListesi(`"${f.name}" açılamadı:`, sonuc.hatalar));
      return;
    }
    if (kayipOnayi()) uygula(sonuc.degerlendirme, { kirli: false });
  }

  function jsonIndir() {
    window.RiskPrime.disari.indirBlob(new Blob([dosya.yaz(durum.d)], { type: 'application/json' }), dosya.dosyaAdi(durum.d));
    durum.kirli = false;
    bayraklariCiz();
  }

  const CIKTI_ISLERI = {
    tam: (d) => window.RiskPrime.disari.pdfIndir(d, 'tam'),
    kontrol: (d) => window.RiskPrime.disari.pdfIndir(d, 'kontrol'),
    bos: (d) => window.RiskPrime.disari.pdfIndir(d, 'bos'),
    xlsx: (d) => window.RiskPrime.disari.excelIndir(d),
    docx: (d) => window.RiskPrime.disari.wordIndir(d),
    sablon: () => window.RiskPrime.disari.sablonIndir(),
  };

  /** PDF/Excel/Word üretir; JSON indirilmemişse uyarı (#kirli) zaten görünür kalır. */
  async function ciktiAl(bicim) {
    if (bicim === 'json') return jsonIndir();
    const durumYazisi = $('#calisiyor');
    const dugmeler = document.querySelectorAll('#pdf-indir, #bicimler button');
    durumYazisi.textContent = ['tam', 'kontrol', 'bos'].includes(bicim)
      ? 'PDF hazırlanıyor… (ilk seferde derleyici indirilir, biraz sürebilir)'
      : 'Dosya hazırlanıyor…';
    durumYazisi.hidden = false;
    dugmeler.forEach((b) => { b.disabled = true; });
    mesaj('');
    try {
      await CIKTI_ISLERI[bicim](durum.d);
    } catch (hata) {
      mesaj(`Çıktı alınamadı: ${hata.message}`);
    } finally {
      durumYazisi.hidden = true;
      dugmeler.forEach((b) => { b.disabled = false; });
    }
    return undefined;
  }

  // ─── Olaylar ────────────────────────────────────────────
  function okulOlaylari() {
    $('#okul').addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.okul) {
        const ciz = el.dataset.okul === 'gruplama' ? 'mekanlar' : 'yok';
        dene((d) => model.okulGuncelle(d, { [el.dataset.okul]: el.value.trim() }), { ciz });
      } else if (el.dataset.ust) {
        dene((d) => model.ustBilgiGuncelle(d, { [el.dataset.ust]: el.value.trim() }), { ciz: 'yok' });
      } else if (el.dataset.imzaci) {
        dene((d) => model.imzaciGuncelle(d, Number(el.dataset.imzaci), { [el.dataset.k]: el.value.trim() }), { ciz: 'yok' });
      }
    });
    $('#okul').addEventListener('click', (e) => {
      const sil = e.target.closest('[data-imzaci-sil]');
      if (sil) dene((d) => model.imzaciSil(d, Number(sil.dataset.imzaciSil)));
    });
    $('#imzaci-ekle').addEventListener('click', () => dene((d) => model.imzaciEkle(d, '')));
  }

  function mekanOlaylari() {
    $('#mekan-listesi').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mekan]');
      if (!b) return;
      durum.mekanId = b.dataset.mekan;
      mekanlariCiz();
      satirlariCiz();
    });
    $('#yeni-mekan').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const id = model.yeniId('a');
      const girdi = { id, ad: f.ad.value, tur: f.tur.value, bina: f.bina.value, alan: f.alan.value };
      if (!dene((d) => model.mekanEkle(d, girdi), { ciz: 'yok' })) return;
      durum.mekanId = id;
      f.reset();
      mekanlariCiz();
      satirlariCiz();
    });
  }

  function satirOlaylari() {
    const kutu = $('#satirlar');
    kutu.addEventListener('change', (e) => {
      const el = e.target;
      const mekanId = durum.mekanId;
      if (el.dataset.mekanK) {
        dene((d) => model.mekanGuncelle(d, mekanId, { [el.dataset.mekanK]: el.value.trim() }), { ciz: 'mekanlar' });
        return;
      }
      if (!el.dataset.satir) return;
      const k = el.dataset.k;
      const puanMi = PUAN_ALANLARI.includes(k);
      const deger = puanMi ? (el.value === '' ? null : Number(el.value)) : el.value;
      if (dene((d) => model.satirGuncelle(d, mekanId, el.dataset.satir, { [k]: deger }), { ciz: 'yok' }) && puanMi) {
        puanHucreleriniGuncelle(el.dataset.satir);
      }
    });
    kutu.addEventListener('click', (e) => {
      const mekanId = durum.mekanId;
      if (e.target.closest('#satir-ekle')) {
        if (dene((d) => model.satirEkle(d, mekanId, {}))) {
          const son = kutu.querySelector('tbody tr:last-child textarea');
          if (son) son.focus();
        }
        return;
      }
      const sil = e.target.closest('[data-satir-sil]');
      if (sil) {
        if (window.confirm('Bu satır silinsin mi?')) dene((d) => model.satirSil(d, mekanId, sil.dataset.satirSil));
        return;
      }
      const tasi = e.target.closest('[data-mekan-tasi]');
      if (tasi) {
        dene((d) => model.mekanTasi(d, mekanId, Number(tasi.dataset.mekanTasi)), { ciz: 'mekanlar' });
        return;
      }
      if (e.target.closest('[data-mekan-sil]')) {
        const mekan = seciliMekan();
        if (window.confirm(`"${mekan.ad}" ve ${mekan.satirlar.length} satırı silinsin mi?`)) {
          dene((d) => model.mekanSil(d, mekanId));
        }
      }
    });
  }

  function dosyaOlaylari() {
    $('#pdf-indir').addEventListener('click', () => ciktiAl('tam'));
    $('#json-indir').addEventListener('click', jsonIndir);
    $('#bicimler').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-bicim]');
      if (!b) return;
      $('#bicimler').open = false;
      ciktiAl(b.dataset.bicim);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#bicimler')) $('#bicimler').open = false;
    });
    $('#yeni-baslangic').addEventListener('click', () => yeniAc(() => kopya(window.RiskPrime.baslangic)));
    $('#yeni-bos').addEventListener('click', () => yeniAc(() => model.bosDegerlendirme('')));
    $('#dosya-ac').addEventListener('change', (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (f) dosyaAc(f);
    });
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) dosyaAc(f);
    });
    window.addEventListener('beforeunload', (e) => {
      if (!durum.kirli) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  function baslat() {
    $('#yeni-mekan').tur.innerHTML = secenekler(TUR_SECENEKLERI, 'atolye');
    durum.d = depoOku() || kopya(window.RiskPrime.baslangic);
    durum.mekanId = durum.d.mekanlar[0] ? durum.d.mekanlar[0].id : null;
    $('#okul').open = !durum.d.okul.okul; // okul bilgisi girilmişse kart katlı açılır, tablo ilk ekranda görünür
    okulOlaylari();
    mekanOlaylari();
    satirOlaylari();
    dosyaOlaylari();
    hepsiniCiz();
  }

  // Ek ekranlar (kontrol-ekrani.js) bu yardımcıları kullanır; app.js'ten sonra yüklenir.
  window.RiskPrime = Object.assign({}, window.RiskPrime, {
    arayuz: Object.freeze({
      durum, $, kacis, secenekler, mesaj, dene, uygula, hepsiniCiz,
      cizimEkle: (fn) => ekCizimler.push(fn),
      mekanSec: (id) => { durum.mekanId = id; mekanlariCiz(); satirlariCiz(); },
    }),
  });
  document.addEventListener('DOMContentLoaded', baslat);
})();
