// Kontrol listeleri ekranı, sekmeler ve "Hazır formdan ekle" kütüphanesi.
// Ortak durum ve yardımcılar app.js'teki RiskPrime.arayuz'dan gelir.
(function () {
  'use strict';

  const { kontrol, kutuphane } = window.RiskPrime;
  const { durum, $, kacis, mesaj, dene, cizimEkle, mekanSec } = window.RiskPrime.arayuz;
  const CEVAP_DUGMELERI = [['evet', 'Evet'], ['hayir', 'Hayır'], ['ud', 'U/D']];
  const yerel = { listeId: null };

  // ─── Sekmeler ──────────────────────────────────────────
  function sekmeAc(sekme) {
    $('#ekran-risk').hidden = sekme !== 'risk';
    $('#ekran-kontrol').hidden = sekme !== 'kontrol';
    for (const b of document.querySelectorAll('[data-sekme]')) {
      b.setAttribute('aria-selected', String(b.dataset.sekme === sekme));
    }
  }

  function sayilariCiz() {
    const satir = durum.d.mekanlar.reduce((t, m) => t + m.satirlar.length, 0);
    $('#sayi-risk').textContent = `${durum.d.mekanlar.length} mekân · ${satir} satır`;
    $('#sayi-kontrol').textContent = String(durum.d.kontrolListeleri.length);
  }

  // ─── Liste listesi (sol) ───────────────────────────────
  function seciliListe() {
    return durum.d.kontrolListeleri.find((l) => l.id === yerel.listeId) || null;
  }

  function listeleriCiz() {
    const ls = durum.d.kontrolListeleri;
    if (!ls.some((l) => l.id === yerel.listeId)) yerel.listeId = ls[0] ? ls[0].id : null;
    $('#liste-listesi').innerHTML = ls.length ? `<ul>${ls.map((l) => {
      const o = kontrol.ozet(l);
      const hayir = o.hayir ? `<span class="rozet hayir" title="Hayır cevabı">${o.hayir}</span>` : '';
      return `<li><button type="button" data-liste="${kacis(l.id)}" class="${l.id === yerel.listeId ? 'secili' : ''}">
        <span>${l.kod ? `<b>${kacis(l.kod)}</b> ` : ''}${kacis(l.ad)}</span>
        <span class="sayac">${hayir}${o.cevaplanan}/${o.toplam}</span>
      </button></li>`;
    }).join('')}</ul>` : '<p class="bos">Henüz kontrol listesi yok. "+ Hazır formdan ekle" ile MEB ya da elektrik-elektronik listelerini ekleyin.</p>';
  }

  // ─── Liste ayrıntısı (sağ) ─────────────────────────────
  function cevapDugmeleri(m) {
    return CEVAP_DUGMELERI.map(([deger, ad]) => `<button type="button" class="cevap ${deger}" data-cevap="${deger}"
      data-madde="${kacis(m.id)}" aria-pressed="${m.cevap === deger}">${ad}</button>`).join('');
  }

  function maddeSatiri(l, m) {
    const kilitli = l.kaynak === 'dis' && !m.eklenen;
    const id = kacis(m.id);
    const metin = kilitli
      ? `<span class="madde-metni">${kacis(m.metin)}</span>`
      : `<textarea data-madde="${id}" data-k="metin" rows="1" aria-label="Madde metni" placeholder="Kontrol maddesi">${kacis(m.metin)}</textarea>`;
    const no = kilitli
      ? kacis(m.no)
      : `<input data-madde="${id}" data-k="no" value="${kacis(m.no)}" size="4" aria-label="Madde no">`;
    return `<tr data-madde-satiri="${id}">
      <td class="no">${no}</td>
      <td>${metin}</td>
      <td class="cevaplar" role="group" aria-label="Cevap">${cevapDugmeleri(m)}</td>
      <td><textarea data-madde="${id}" data-k="aciklama" rows="1" aria-label="Açıklama" placeholder="Açıklama / tarih / sorumlu">${kacis(m.aciklama)}</textarea></td>
      <td><button type="button" class="ikon tehlikeli" data-madde-sil="${id}" title="Maddeyi sil" aria-label="Maddeyi sil">✕</button></td>
    </tr>`;
  }

  function ilerlemeHtml(l) {
    const o = kontrol.ozet(l);
    const yuzde = o.toplam ? Math.round((100 * o.cevaplanan) / o.toplam) : 0;
    return `<div class="ilerleme" title="${o.cevaplanan}/${o.toplam} madde cevaplandı"><span style="width:${yuzde}%"></span></div>
      <span class="soluk">${o.cevaplanan}/${o.toplam} cevaplandı${o.hayir ? ` · <b class="hayir-yazi">${o.hayir} hayır</b>` : ''}</span>`;
  }

  function detayCiz() {
    const kutu = $('#liste-detay');
    const l = seciliListe();
    if (!l) {
      kutu.innerHTML = '<p class="bos">Soldan bir liste seçin ya da "+ Hazır formdan ekle" ile liste ekleyin.</p>';
      return;
    }
    const baslik = l.kaynak === 'dis'
      ? `<div class="liste-adi"><span class="etiket-kilit" title="MEB formunun hazır metni değiştirilemez; madde eklenip çıkarılabilir">MEB · metin kilitli</span>
          <h2>${kacis(l.kod)} ${kacis(l.ad)}</h2></div>`
      : `<label>Kod <input data-liste-k="kod" value="${kacis(l.kod)}" size="8"></label>
         <label class="genis">Liste adı <input data-liste-k="ad" value="${kacis(l.ad)}"></label>`;
    kutu.innerHTML = `
      <div class="mekan-baslik">
        ${baslik}
        <div class="dugmeler"><button type="button" data-liste-sil class="tehlikeli">Listeyi sil</button></div>
      </div>
      <div class="ilerleme-satiri" id="ilerleme">${ilerlemeHtml(l)}</div>
      <div class="tablo-kap">
        <table class="kontrol">
          <thead><tr><th>No</th><th>Kontrol maddesi</th><th>Cevap</th><th>Açıklama</th><th><span class="gizli">Sil</span></th></tr></thead>
          <tbody>${l.maddeler.map((m) => maddeSatiri(l, m)).join('')}</tbody>
        </table>
      </div>
      <p class="soluk">"Hayır" cevaplanan madde için risk tablosuna satır açın. U/D: uygulanamaz. Seçili cevaba tekrar basınca cevap silinir.</p>
      <button type="button" id="madde-ekle">Madde ekle</button>`;
  }

  function ciz() {
    sayilariCiz();
    listeleriCiz();
    detayCiz();
  }

  // ─── Olaylar ───────────────────────────────────────────
  function cevapVer(dugme) {
    const l = seciliListe();
    const m = l.maddeler.find((x) => x.id === dugme.dataset.madde);
    const yeni = m.cevap === dugme.dataset.cevap ? '' : dugme.dataset.cevap;
    if (!dene((d) => kontrol.maddeGuncelle(d, l.id, m.id, { cevap: yeni }), { ciz: 'yok' })) return;
    // Odak kaybolmasın: yalnız bu satırın düğmelerini ve ilerlemeyi yenile.
    for (const b of dugme.parentElement.querySelectorAll('[data-cevap]')) {
      b.setAttribute('aria-pressed', String(b.dataset.cevap === yeni));
    }
    $('#ilerleme').innerHTML = ilerlemeHtml(seciliListe());
    listeleriCiz();
  }

  function detayTiklama(e) {
    const kutu = $('#liste-detay');
    const l = seciliListe();
    const cevap = e.target.closest('[data-cevap]');
    if (cevap) { cevapVer(cevap); return; }
    if (e.target.closest('#madde-ekle')) {
      if (dene((d) => kontrol.maddeEkle(d, l.id))) {
        const son = kutu.querySelector('tbody tr:last-child textarea');
        if (son) son.focus();
      }
      return;
    }
    const sil = e.target.closest('[data-madde-sil]');
    if (sil) {
      if (window.confirm('Bu madde silinsin mi?')) dene((d) => kontrol.maddeSil(d, l.id, sil.dataset.maddeSil));
      return;
    }
    if (e.target.closest('[data-liste-sil]') && window.confirm(`"${l.kod} ${l.ad}" listesi ve cevapları silinsin mi?`)) {
      dene((d) => kontrol.listeSil(d, l.id));
    }
  }

  function detayOlaylari() {
    const kutu = $('#liste-detay');
    kutu.addEventListener('click', detayTiklama);
    kutu.addEventListener('change', (e) => {
      const el = e.target;
      const l = seciliListe();
      if (el.dataset.listeK) {
        dene((d) => kontrol.listeGuncelle(d, l.id, { [el.dataset.listeK]: el.value.trim() }), { ciz: 'yok' });
        listeleriCiz();
      } else if (el.dataset.madde && el.dataset.k) {
        dene((d) => kontrol.maddeGuncelle(d, l.id, el.dataset.madde, { [el.dataset.k]: el.value.trim() }), { ciz: 'yok' });
      }
    });
  }

  function listeOlaylari() {
    $('#liste-listesi').addEventListener('click', (e) => {
      const b = e.target.closest('[data-liste]');
      if (!b) return;
      yerel.listeId = b.dataset.liste;
      listeleriCiz();
      detayCiz();
    });
    $('#liste-ekle').addEventListener('click', () => {
      if (!dene((d) => kontrol.listeEkle(d, { ad: 'Yeni kontrol listesi' }), { ciz: 'yok' })) return;
      yerel.listeId = durum.d.kontrolListeleri[durum.d.kontrolListeleri.length - 1].id;
      ciz();
      $('#liste-detay [data-liste-k="ad"]').select();
    });
    for (const b of document.querySelectorAll('[data-sekme]')) {
      b.addEventListener('click', () => sekmeAc(b.dataset.sekme));
    }
  }

  // ─── Kütüphane ─────────────────────────────────────────
  const sade = (x) => String(x).toLocaleLowerCase('tr');

  function kutuphaneSecenegi(anahtar, baslik, alt, varMi) {
    return `<label class="secenek" data-ara="${kacis(sade(`${baslik} ${alt}`))}">
      <input type="checkbox" data-sec="${anahtar}">
      <span><b>${kacis(baslik)}</b>${varMi ? ' <span class="rozet">eklendi</span>' : ''}<small>${kacis(alt)}</small></span>
    </label>`;
  }

  function grupBasligi(ad) {
    return `<p class="grup-baslik">${kacis(ad)} <button type="button" class="baglanti" data-hepsi>tümünü seç</button></p>`;
  }

  function kutuphaneCiz() {
    const mevcutMekan = new Set(durum.d.mekanlar.map((m) => sade(m.ad)));
    const mevcutListe = new Set(durum.d.kontrolListeleri.map((l) => sade(`${l.kod}|${l.ad}`)));
    $('#kutuphane-mekanlar').innerHTML = grupBasligi('Elektrik-Elektronik hazır form') + kutuphane.mekanlar
      .map((m, i) => kutuphaneSecenegi(`m:${i}`, m.ad, `${m.satirlar.length} risk satırı`, mevcutMekan.has(sade(m.ad))))
      .join('');
    const gruplar = [...new Set(kutuphane.kontrolListeleri.map((l) => l.grup))];
    $('#kutuphane-listeler').innerHTML = gruplar.map((g) => grupBasligi(g) + kutuphane.kontrolListeleri
      .map((l, i) => (l.grup !== g ? '' : kutuphaneSecenegi(
        `l:${i}`, `${l.kod ? `${l.kod} ` : ''}${l.ad}`, `${l.maddeler.length} madde`, mevcutListe.has(sade(`${l.kod}|${l.ad}`)),
      ))).join('')).join('');
    $('#kutuphane-ara').value = '';
    seciliSayisiniCiz();
  }

  function seciliSayisiniCiz() {
    const n = document.querySelectorAll('#kutuphane [data-sec]:checked').length;
    const b = $('#kutuphane-ekle');
    b.disabled = n === 0;
    b.textContent = n ? `Seçilenleri ekle (${n})` : 'Seçilenleri ekle';
  }

  function kutuphaneUygula() {
    const secilen = [...document.querySelectorAll('#kutuphane [data-sec]:checked')].map((x) => x.dataset.sec.split(':'));
    const mekanlar = secilen.filter(([t]) => t === 'm').map(([, i]) => kutuphane.mekanlar[Number(i)]);
    const listeler = secilen.filter(([t]) => t === 'l').map(([, i]) => kutuphane.kontrolListeleri[Number(i)]);
    const oncekiMekan = durum.d.mekanlar.length;
    const oncekiListe = durum.d.kontrolListeleri.length;
    const tamam = dene((d) => listeler.reduce(
      (acc, l) => kontrol.listeEkle(acc, l),
      mekanlar.reduce((acc, m) => kontrol.mekanSablondanEkle(acc, m), d),
    ));
    if (!tamam) return;
    mesaj(`Eklendi: ${mekanlar.length} mekân, ${listeler.length} kontrol listesi. İstemediğinizi ilgili ekrandan silebilirsiniz.`, 'bilgi');
    if (mekanlar.length) {
      sekmeAc('risk');
      mekanSec(durum.d.mekanlar[oncekiMekan].id);
    } else {
      yerel.listeId = durum.d.kontrolListeleri[oncekiListe].id;
      sekmeAc('kontrol');
      ciz();
    }
  }

  function grubuSec(baslik) {
    const kutular = [];
    // Başlıktan sonraki seçenekleri bir sonraki başlığa kadar topla (aramada gizlenenler hariç).
    for (let el = baslik.nextElementSibling; el && !el.classList.contains('grup-baslik'); el = el.nextElementSibling) {
      if (!el.hidden) kutular.push(el.querySelector('[data-sec]'));
    }
    const hepsiSecili = kutular.every((k) => k.checked);
    kutular.forEach((k) => { k.checked = !hepsiSecili; });
    seciliSayisiniCiz();
  }

  function kutuphaneOlaylari() {
    const pencere = $('#kutuphane');
    $('#kutuphane-ac').addEventListener('click', () => {
      kutuphaneCiz();
      pencere.showModal();
      $('#kutuphane-ara').focus();
    });
    pencere.addEventListener('change', (e) => { if (e.target.dataset.sec) seciliSayisiniCiz(); });
    pencere.addEventListener('click', (e) => {
      const hepsi = e.target.closest('[data-hepsi]');
      if (hepsi) grubuSec(hepsi.parentElement);
    });
    $('#kutuphane-ara').addEventListener('input', (e) => {
      const q = sade(e.target.value.trim());
      for (const s of pencere.querySelectorAll('.secenek')) s.hidden = Boolean(q) && !s.dataset.ara.includes(q);
      // Aramada hiç seçeneği kalmayan grubun başlığını da gizle.
      for (const b of pencere.querySelectorAll('.grup-baslik')) {
        let el = b.nextElementSibling;
        while (el && !el.classList.contains('grup-baslik') && el.hidden) el = el.nextElementSibling;
        b.hidden = !el || el.classList.contains('grup-baslik');
      }
    });
    pencere.addEventListener('close', () => {
      if (pencere.returnValue === 'ekle') kutuphaneUygula();
    });
  }

  listeOlaylari();
  detayOlaylari();
  kutuphaneOlaylari();
  cizimEkle(ciz);
})();
