# RiskPrime Arayüz Yeniden Yapılandırma — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aynı işin birden çok yerde yapıldığı, sayfaları aşırı yüklü RiskPrime arayüzünü; tek iş = tek yer ilkesiyle Başla / Okul / Mekânlar / Riskler / Rapor yapısına taşımak. Veri modeli ve dosya biçimi değişmeyecek.

**Architecture:** Değişiklik yalnız Svelte bileşenlerinde, gezinme katmanında (`nav-route.ts`, `nav.svelte.ts`, `nav-items.ts`) ve birkaç küçük saf domain fonksiyonunda (`progress.ts`, `filters.ts`, `checklist-risk.ts`). Her zaman önce var olan bileşen yeniden kullanılır (`LocationEditor`, `RiskTable`, `LibraryDialog`, `ChecklistItemLinks`, `ExportMenu`, `ReadinessList`, `similarity.ts`); bir sayfa birleşirken yenisi yazılmaz, var olan genişletilir ve fazlası silinir. Toplamda üç yeni bileşen (`SchoolPage.svelte`, `EmptyState.svelte`, `PageHeader.svelte`), bir Tailwind sınıf dizisi dosyası (`shared-classes.ts`) ve tema için iki küçük modül (`theme-choice.ts` saf + testli, `theme.svelte.ts`) eklenir; iki dosya (`transfer-inspection.ts` ve testi) silinir. Stil yalnız shadcn tema yöntemiyle: `src/app.css` değişkenleri + bileşenlerde Tailwind sınıfları; görsel katman bunun üzerine kurulur ve açık + koyu temayı destekler (Görsel yön bölümü).

**Referans tasarım (bakıcı onaylı):** claude.ai artifact "RiskPrime Yeni Arayüz Taslağı" — https://claude.ai/artifact/RnpP7sa8ni6K5aUGuXnD7v. Kaynak dosyalar: `/private/tmp/claude-501/-Users-hakan-VSCodeProjects-RiskPrime/59742d32-7fe6-4214-b5fc-65b2e4e5e3ed/scratchpad/design/project/*.dc.html` (`Main`, `Mekan`, `Riskler`, `Telefon`). Token değerleri ve düzen oradan okunabilir; bu plandaki değerler onunla aynıdır, tek bilinçli fark `--input` (taslakta `oklch(0.66 0.01 85)` = 2.98:1 ölçüldü; plan `0.64` = 3.22:1 kullanır).

**Tech Stack:** Svelte 5 (runes) + TypeScript, Tailwind 4, shadcn-svelte (`src/lib/components/ui`, üretilmiş — elle düzenlenmez), Vite+ (`vp`), vitest (`vite-plus/test`), pnpm, Tauri masaüstü kabuğu (aynı web arayüzü).

## Global Constraints

- Paket yöneticisi pnpm: her komut `pnpm run …`. npm çalışmaz.
- **Kapılar (her görevden sonra hepsi geçmeli; aşağıda "kapılar" denince bu satır kastedilir):** `pnpm run check && pnpm run test && pnpm run lint && pnpm run fmt:check && pnpm run lint:english && pnpm run bank:check && pnpm run build` — `fmt:check` düşerse önce `pnpm run fmt`.
- Arayüz metinleri Türkçe, kod (tanımlayıcı, yorum, commit) İngilizce; `lint:english` Türkçe tanımlayıcıya izin vermez.
- Domain fonksiyonları saf ve değiştirmez (immutable): her fonksiyon yeni nesne döndürür; `push`/yerinde değiştirme yok.
- Yeni bağımlılık yok. Var olan shadcn bileşenleri ve Tailwind sınıfları kullanılır; `src/lib/components/ui/**` elle düzenlenmez.
- Dosya biçimi (`.json` dönem dosyası, Excel) değişmez; `src/lib/domain/types.ts`, `file.ts`, `file-migrate.ts`, `excel-*.ts` bu planda dokunulmaz.
- Masaüstü (`isDesktop()`) dalları korunur (`ReportPage` son düzenleyen bilgisi, `AppTopbar` kullanıcı menüsü, `App.svelte` kilit akışı).
- Dosyalar küçük kalır (tipik <400 satır).
- Testler AAA düzeninde, `import { describe, expect, test } from "vite-plus/test";`.
- Commit: önce ayrı komutla `git add …`, sonra yalın `git commit -q -m "type: description"`; zincirleme (`&&`), `--amend`, `--no-edit` yok (hook engeller). Commit mesajı İngilizce, **Co-Authored-By / Claude satırı yok**.
- Her görevde "Silinecekler" listesi uygulanır; silme eklemeden önce gelir.
- Faz 1.5'ten sonra her görsel kontrol **açık ve koyu** iki temada yapılır; PDF/Excel renkleri temadan etkilenmez.
- Stil: yalnız shadcn tema değişkenleri (`app.css`) + bileşenlerde Tailwind sınıfları; özel `@utility`/elle CSS ve `ui/**` düzenlemesi yasak. Yeni renk shadcn "Adding new colors" yoluyla eklenir (`--deficiency` + `@theme inline` içinde `--color-deficiency: var(--deficiency)`); hareket `motion-safe:`/`motion-reduce:` önekleri ve `tw-animate-css` sınıflarıyla.

---

## Doğrulama notları (uzman raporunun kodla karşılaştırılması)

Raporun iddiaları koda karşı tek tek kontrol edildi. Doğru olanlar plana girdi; yanlış ya da eksik olanlar düzeltildi:

| İddia                                                                                  | Sonuç                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ExportMenu.svelte:20` `location` reaktif değil                                        | **Doğru** (satır 19). `AppTopbar` bir kez bağlanır; `const location = (…)` uygulama açılışında bir kez hesaplanır, "PDF: yalnız bu mekân" neredeyse hep devre dışı kalır. Kök neden: mekâna özgü bir çıktının genel menüde durması. Görev 2 bunu mekân sayfasına taşıyarak çözer.                                                                           |
| Toast `App.svelte:146` sağ altta, diyaloğu örtüyor                                     | **Kısmen doğru.** Satır 133; telefonda zaten `top-center` (satır 90-91), yalnız masaüstünde `bottom-right`.                                                                                                                                                                                                                                                 |
| `AppSidebar.svelte:22` okul adı sabit                                                  | **Doğru** (satır 24).                                                                                                                                                                                                                                                                                                                                       |
| Eksik → risk üç yerden                                                                 | **Eksik sayılmış: beş yer.** `ChecklistItemLinks` (`ChecklistRiskButton` + `ChecklistExistingRowButton`), `InspectionEditor.svelte:86` toplu aktar (`transferInspection`), `DeficiencyItem.svelte:41-99` (aynı popover'ların kopyası), `DeficienciesPage.svelte:69` toplu aktar, `ReadinessList.svelte:98` "Tüm eksikleri aktar" (`store.transferMissing`). |
| Risk tablosu iki kez                                                                   | **Doğru:** `LocationDetail.svelte:126,157-159` (`LocationEditor` + satır içi O/Ş, `RiskTable.svelte:50-55`) ve salt okunur `RiskRegisterPage.svelte:78-131`.                                                                                                                                                                                                |
| `ReportPage.svelte:155-245` sekiz bölüm                                                | **Doğru:** 161-165 beş bölüm + 167-244 üç kart.                                                                                                                                                                                                                                                                                                             |
| Üçlü geri gezinme `LocationDetail.svelte:165`, `InspectionEditor.svelte:320`           | **Doğru, satır numaraları yanlış:** `AppTopbar.svelte:73-74` "Denetimler" kırıntısı, `LocationDetail.svelte:70` ←, `InspectionEditor.svelte:64` "← Denetimler". `InspectionEditor` 120 satır; raporun ~320/342/372 numaraları yok.                                                                                                                          |
| Açıklama paragrafları `LibraryPage:288`, `InspectionEditor:372`, `ChecklistEditor:579` | **Var, satırlar yanlış:** `LibraryPage.svelte:43-45`, `InspectionEditor.svelte:116`, `ChecklistEditor.svelte:98`. `OverviewPage:66-68`, `ReportPage:158,222` doğru. Rapor şunları atlamış: `ReportPage.svelte:126`, `LocationEditor.svelte:45`.                                                                                                             |
| `LibraryDialog` bir mekân eklerken ~9 listeyi sessizce ekliyor                         | **Kısmen yanlış.** Her mekân satırında liste kodları yazıyor (`LibraryDialog.svelte:35`), eklemeden sonra toast sayı veriyor (`state.svelte.ts:192-194`). Gerçek eksik: ekleme öncesi toplam görünmüyor; var olan listelerin yeni mekâna bağlanması (`library.ts:20-24`) hiç görünmüyor. Görev 14 bu kadarını çözer.                                        |
| "Ortak" mekân ile "Okul geneli" liste iki ayrı kavram                                  | **Doğru:** `LocationType "common"` = "Ortak (tüm mekânlar)" (`assessment.ts:30`) ile `Inspection.locationId === null` = okul geneli (`inspections.ts:7`). Karar 1.                                                                                                                                                                                          |
| Dışa aktarımlar iki menüde + Rapor'da                                                  | **Doğru, eksik sayılmış:** `AppTopbar.svelte:108` Kaydet, `:109` `ExportMenu`, `ReportPage.svelte:23-29,225-229`. Dönem işleri de iki yerde: `AppTopbar.svelte:117-118` ile `ReportPage.svelte:214,234-244`.                                                                                                                                                |
| Sayfa iskeleti tutarsız                                                                | **Doğru, ek bulgu:** `App.svelte:103` zaten `p-4` veriyor; çoğu sayfa ikinci bir `p-4` ekliyor (çift boşluk). Genişlikler: `max-w-2xl` (Overview), `max-w-3xl` (Rapor), `max-w-5xl` (Eksikler), `max-w-6xl` (Risk kaydı), yok (Mekânlar). h1: `text-2xl` ve `text-xl` karışık.                                                                              |
| Genel bakış adım bağlantıları 26 px                                                    | **Doğru:** `OverviewPage.svelte:76` `variant="link" h-auto p-0`.                                                                                                                                                                                                                                                                                            |
| Risk kaydı satırı yalnız numara düğmesiyle klavyeden açılıyor                          | **Doğru.** Görev 7'de bu tablo silinir; yerine gelen `RiskTable` her satırda etiketli bir düzenle düğmesi taşır (`RiskTable.svelte:65`).                                                                                                                                                                                                                    |

---

## Dosya haritası

| Dosya                                                                                                                                                                                                                     | Sorumluluk / değişiklik                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/domain/progress.ts` (+test)                                                                                                                                                                                      | `nextStep()` — Başla'da "sıradaki adım" (Görev 3)                                                                        |
| `src/lib/domain/filters.ts` (+test)                                                                                                                                                                                       | `groupByLocation()`, `level: "unscored"` (Görev 7)                                                                       |
| `src/lib/domain/checklist-risk.ts` (+test)                                                                                                                                                                                | `similarRows()` — benzer satır önerisi (Görev 12)                                                                        |
| `src/lib/domain/assessment.ts` (+test)                                                                                                                                                                                    | `filterRows`/`ROW_FILTERS` **silinir** (Görev 7)                                                                         |
| `src/lib/domain/transfer-inspection.ts` (+test)                                                                                                                                                                           | **dosya silinir** (Görev 11)                                                                                             |
| `src/lib/nav-route.ts` (+test)                                                                                                                                                                                            | `LocationView` silinir; `#riskler/<mekân>`, `#okul`; eski `#mekanlar/<id>/risk` uyumu (Görev 8, 9)                       |
| `src/lib/nav.svelte.ts`                                                                                                                                                                                                   | `openLocation(id, listId)`, `openRegister` yeri yazar, `openSchool()`; `openReport` silinir                              |
| `src/lib/nav-items.ts`                                                                                                                                                                                                    | Bölümler: Başla, Okul, Mekânlar, Riskler, Rapor; `isSectionActive()`                                                     |
| `src/lib/components/SchoolPage.svelte`                                                                                                                                                                                    | **yeni** — `ReportPage`'den taşınan okul bilgileri + okul geneli listeler (Görev 9)                                      |
| `src/lib/components/RiskRegisterPage.svelte`                                                                                                                                                                              | Riskler: süzgeçler + mekâna göre gruplu, satır içi düzenlenebilir `LocationEditor`'lar + eksikler görünümü               |
| `src/lib/components/LocationEditor.svelte`                                                                                                                                                                                | süzgeç UI'si silinir, `items` prop alır                                                                                  |
| `src/lib/components/DeficienciesPage.svelte`                                                                                                                                                                              | Riskler içine gömülür (kendi başlığı/kabı silinir)                                                                       |
| `src/lib/components/LocationDetail.svelte`                                                                                                                                                                                | risk sekmesi silinir; kontrol listeleri akordeon; mekân PDF'i                                                            |
| `src/lib/components/ReportPage.svelte`                                                                                                                                                                                    | açık noktalar + dönem + `ExportMenu`; okul/özet/yeni dönem silinir                                                       |
| `src/lib/components/DeficiencyItem.svelte`                                                                                                                                                                                | kendi popover kopyaları silinir, `ChecklistItemLinks` kullanır                                                           |
| `src/lib/components/ChecklistRiskButton.svelte`                                                                                                                                                                           | tek tıkla ekleme + benzer satır önerisi                                                                                  |
| `src/lib/components/LibraryDialog.svelte`                                                                                                                                                                                 | eklenecekleri önceden gösterir                                                                                           |
| `src/app.css`                                                                                                                                                                                                             | yalnız shadcn tema değişkenleri: açık + koyu token'lar, risk/eksik renkleri, `@theme inline` eşlemeleri (Görev 5)        |
| `src/lib/components/PageHeader.svelte`, `src/lib/components/shared-classes.ts`                                                                                                                                            | **yeni** — sayfa başlığı bileşeni; `SECTION_TITLE`, `INTERACTIVE_ROW`, `RISK_TONE` Tailwind sınıf dizileri (Görev 5, 16) |
| `src/lib/theme-choice.ts` (+test), `src/lib/theme.svelte.ts`                                                                                                                                                              | **yeni** — Açık/Koyu/Sistem seçimi, `.dark` sınıfı (Görev 6)                                                             |
| `src/lib/components/EmptyState.svelte`                                                                                                                                                                                    | **yeni** — tek boş durum bileşeni (Görev 17)                                                                             |
| `src/lib/domain/progress.ts`                                                                                                                                                                                              | ayrıca `unansweredScope()` (Görev 9)                                                                                     |
| `src/lib/domain/filters.ts`                                                                                                                                                                                               | ayrıca `pinRegister()`/`keepPinned()`/`matchesRegisterFilter()` — süzgeçte satır kümesi sabit (Görev 7)                  |
| Kabuk: `App.svelte`, `AppSidebar.svelte`, `AppTopbar.svelte`, `BottomNav.svelte`, `ExportMenu.svelte`, `ReadinessList.svelte`, `OverviewPage.svelte`, `LocationList.svelte`, `InspectionEditor.svelte`, `state.svelte.ts` | adım adım aşağıda                                                                                                        |

---

# FAZ 1 — Hızlı kazanımlar

**Boyut:** S (4 görev). **Kırılabilecekler:** yok denecek kadar az; `progress.test.ts` genişler. Ekranlar: Genel bakış, Mekânlar listesi, mekân "…" menüsü, üst çubuk PDF menüsü. **Geri alma:** her görev tek commit; `git revert <sha>` yeterli, veri etkilenmez.

### Görev 1: Metin ve kabuk düzeltmeleri (toast, okul adı, açıklama paragrafları, "Riskler" adı, iç geri düğmesi)

**Files:**

- Modify: `src/App.svelte:24,90-91,133`
- Modify: `src/lib/components/AppSidebar.svelte:12-13,24`
- Modify: `src/lib/components/InspectionEditor.svelte:2,49-50,63-65,107,116`
- Modify: `src/lib/components/OverviewPage.svelte:66-68`
- Modify: `src/lib/components/LibraryPage.svelte:43-45`
- Modify: `src/lib/components/ChecklistEditor.svelte:98`
- Modify: `src/lib/components/ReportPage.svelte:126,156-159,222`
- Modify: `src/lib/components/NewLocationDialog.svelte:38`
- Modify: `src/lib/components/LocationEditor.svelte:45`
- Modify: `src/lib/nav-items.ts:26,34`
- Modify: `src/lib/components/RiskRegisterPage.svelte:46,61,73`
- Modify: `src/lib/state.svelte.ts:90,96`
- Modify: `src/lib/components/DeficienciesPage.svelte:61`

**Interfaces:**

- Consumes: yok.
- Produces: bölüm etiketi `"Riskler"` (`SECTION_LABELS.register`). Sonraki görevler bu metni varsayar.

**Silinecekler:** `MediaQuery` importu ve `isPhone`; altı açıklama paragrafı; `InspectionEditor`'daki "← Denetimler" düğmesi ve `ArrowLeft` importu.

- [ ] **Step 1: Toast her ekranda üstte ortada**

`src/App.svelte`: satır 24'ü (`import { MediaQuery } from 'svelte/reactivity';`) ve satır 90-91'i (yorum + `const isPhone = …`) sil. Satır 133:

```svelte
<Toaster position="top-center" />
```

- [ ] **Step 2: Kenar çubuğunda açık dosyanın okulu**

`src/lib/components/AppSidebar.svelte` `<script>` içine, `counts` satırından sonra ekle:

```ts
const schoolLine = $derived(
  [store.assessment.school.name, store.assessment.school.scope]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · "),
);
```

Satır 24'ü değiştir:

```svelte
            {#if schoolLine}<span class="truncate text-xs text-muted-foreground">{schoolLine}</span>{/if}
```

- [ ] **Step 3: Açıklama paragraflarını sil**

- `OverviewPage.svelte` 66-68 (`<p …>Yıllık risk değerlendirmesi beş adımda…</p>`) sil.
- `LibraryPage.svelte` 43-45 (`<p …>Kontrol listesi şablonları burada durur…</p>`) sil.
- `ChecklistEditor.svelte` 98 (`<p …>Bu bir şablondur; …</p>`) sil.
- `ReportPage.svelte` 126 (`<p …>Bu listeler okulun tamamı için…</p>`) sil; 156-159 bloğunu yalnız başlığa indir:

```svelte
  <h1 class="text-2xl font-semibold">Rapor</h1>
```

222 (`<Card.Description>İmzalanacak belge PDF'tir…</Card.Description>`) sil.

- `InspectionEditor.svelte` 116 (`<p …>"Hayır" cevaplanan her madde…</p>`) sil. "U.D." açıklaması kaybolmasın: satır 107'deki öğeye `title` ekle:

```svelte
                <ToggleGroup.Item value={choice.value} class={choice.tone} title={choice.value === 'na' ? 'Uygulanamaz' : undefined}>{ANSWER_LABELS[choice.value]}</ToggleGroup.Item>
```

- `NewLocationDialog.svelte` 38: açıklama ekran okuyucu için kalsın, görünmesin:

```svelte
      <Dialog.Description class="sr-only">Yeni mekân ekleyin.</Dialog.Description>
```

- `LocationEditor.svelte` 45 metnini kısalt:

```svelte
      <p class="py-6 text-center text-sm text-muted-foreground">Bu mekânda risk satırı yok.</p>
```

- [ ] **Step 4: "← Denetimler" iç düğmesini sil**

`InspectionEditor.svelte` 63-65 (`{#if locationId}<Button … ><ArrowLeft />Denetimler</Button>{/if}`) ve satır 2 (`import ArrowLeft …`) sil. Geri dönüş kırıntı ve `LocationDetail` ← düğmesinde kalır.

- [ ] **Step 5: "Risk kaydı" → "Riskler"**

- `nav-items.ts:26` → `{ section: "register", label: "Riskler", icon: Table2 },`; `:34` → `register: "Riskler",`
- `RiskRegisterPage.svelte:46` → `<h1 class="text-xl font-semibold">Riskler</h1>`; `:61` `aria-label="Risklerde ara"`; `:73` metni → `Henüz risk satırı yok.`
- `state.svelte.ts:90` → `` `${result.created} risk satırı oluşturuldu; puanlamak için Riskler'e geçin.` ``; `:96` → `label: "Riskleri aç"`
- `InspectionEditor.svelte:49-50` iki dalı tek metne indir:

```ts
store.applyWithUndo(
  () => result.assessment,
  `${result.created} risk satırı oluşturuldu; Riskler'de puanlayın.`,
);
```

- `DeficienciesPage.svelte:61` → `` `${targets.length} risk satırı oluşturuldu; puanlamak için Riskler'e geçin.` ``

- [ ] **Step 6: Kalıntı taraması**

Run: `rg -n "Risk kaydı|risk kaydı|MediaQuery|Mersin Atatürk" src --glob '!*.json'`
Expected: çıktı yok.

- [ ] **Step 7: Kapılar + elle kontrol**

Kapıları çalıştır (Global Constraints). `pnpm run dev` ile: masaüstü genişlikte bir eksik aktar → toast üstte ortada; kenar çubuğunda okul adı dosyadan geliyor (Dosya → Yeni (boş) açınca alt satır kaybolur); bir kontrol listesinde "U.D." üzerine gelince "Uygulanamaz" ipucu.

- [ ] **Step 8: Commit**

```bash
git add src/App.svelte src/lib/components src/lib/nav-items.ts src/lib/state.svelte.ts
```

```bash
git commit -q -m "fix: calmer shell copy, school name from file, top toasts"
```

### Görev 2: Mekân PDF'ini mekân sayfasına taşı (bayat `location` hatası)

**Files:**

- Modify: `src/lib/components/ExportMenu.svelte:7,18-19,22-35,53-56`
- Modify: `src/lib/components/LocationDetail.svelte:63-65,77-82`

**Interfaces:**

- Consumes: `downloadPdf(assessment, 'full', locationId)` (`src/lib/export/pdf.ts`, değişmez).
- Produces: `ExportMenu` artık hiçbir prop/konum bilgisi taşımaz (Görev 10 onu Rapor'a koyar).

**Silinecekler:** `ExportMenu`'den `nav` importu, `location` sabiti, `exportLocationPdf`, "PDF: yalnız bu mekân" öğesi.

- [ ] **Step 1: `ExportMenu`'den mekân bölümünü sil**

`ExportMenu.svelte`: satır 7 (`import { nav } …`), 18-19 (`location`), 22-35 (`exportLocationPdf`), 53-56 (son `DropdownMenu.Item`) sil.

- [ ] **Step 2: `LocationDetail`'e ekle**

`remove()` fonksiyonundan (satır 63-65) sonra:

```ts
// The shared store has no per-location export kind, so this drives the PDF module itself.
async function exportPdf() {
  store.busy = "PDF hazırlanıyor… (ilk seferde derleyici indirilir, biraz sürebilir)";
  store.clearErrors();
  try {
    await (await import("$lib/export/pdf")).downloadPdf(store.assessment, "full", id);
  } catch (error) {
    store.fail([`Çıktı alınamadı: ${error instanceof Error ? error.message : ""}`]);
  } finally {
    store.busy = "";
  }
}
```

"Mekânı çoğalt" öğesinden (satır 80) önce:

```svelte
        <DropdownMenu.Item disabled={store.busy !== ''} onSelect={exportPdf}>Bu mekânın PDF'i</DropdownMenu.Item>
```

- [ ] **Step 3: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: Mekânlar → bir mekân → "…" → "Bu mekânın PDF'i" → PDF iner ve yalnız o mekânın risk tablosu vardır; başka bir mekâna geçip tekrar dene → doğru mekân. Üst çubuk PDF menüsünde mekân öğesi yok.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/ExportMenu.svelte src/lib/components/LocationDetail.svelte
```

```bash
git commit -q -m "fix: move per-location PDF to the location menu"
```

### Görev 3: Genel bakış sıradaki adımı öne çıkarır, sıfır kutuları gizler

**Files:**

- Modify: `src/lib/domain/progress.ts` (sona ekleme)
- Test: `src/lib/domain/progress.test.ts` (sona ekleme)
- Modify: `src/lib/components/OverviewPage.svelte` (tamamı)

**Interfaces:**

- Consumes: `progress(a, today)` dönüşü; anahtarlar `school | checklists | transfer | risk | readiness`, her biri `{ state: StepState }`.
- Produces: `export type StepKey = "school" | "checklists" | "transfer" | "risk" | "readiness";` ve `export function nextStep(steps: Record<StepKey, { state: StepState }>): StepKey | null`.

**Silinecekler:** `OverviewPage`'deki `STATES` tablosu ve adım rozetleri; değeri `0` olan kutular.

- [ ] **Step 1: Başarısız testi yaz**

`progress.test.ts` başındaki import satırına `nextStep` ekle (`import { nextStep, progress } from "./progress";` biçiminde), dosya sonuna:

```ts
describe("nextStep", () => {
  const steps = (
    school: StepState,
    checklists: StepState,
    transfer: StepState,
    risk: StepState,
    readiness: StepState,
  ) => ({
    school: { state: school },
    checklists: { state: checklists },
    transfer: { state: transfer },
    risk: { state: risk },
    readiness: { state: readiness },
  });

  test("returns the first step that is not done", () => {
    // Arrange
    const input = steps("done", "doing", "todo", "todo", "doing");
    // Act
    const next = nextStep(input);
    // Assert
    expect(next).toBe("checklists");
  });

  test("an empty assessment starts with the school step", () => {
    expect(nextStep(progress(emptyAssessment(""), today))).toBe("school");
  });

  test("returns null when every step is done", () => {
    expect(nextStep(steps("done", "done", "done", "done", "done"))).toBeNull();
  });
});
```

`StepState` tipi import edilmemişse import satırına ekle: `import { nextStep, progress, type StepState } from "./progress";`.

- [ ] **Step 2: Testin düştüğünü gör**

Run: `pnpm run test -- src/lib/domain/progress.test.ts`
Expected: FAIL — `nextStep` export edilmemiş.

- [ ] **Step 3: Uygula**

`progress.ts` sonuna:

```ts
export type StepKey = "school" | "checklists" | "transfer" | "risk" | "readiness";
const STEP_ORDER: readonly StepKey[] = ["school", "checklists", "transfer", "risk", "readiness"];

/** The step the overview points at: the first one not done yet, or null when all are done. */
export function nextStep(steps: Record<StepKey, { state: StepState }>): StepKey | null {
  return STEP_ORDER.find((k) => steps[k].state !== "done") ?? null;
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `pnpm run test -- src/lib/domain/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: `OverviewPage.svelte`'yi yeniden yaz**

Dosyanın tamamı:

```svelte
<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { nextStep, progress, type StepKey } from '$lib/domain/progress';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const p = $derived(progress(store.assessment, new Date()));
  const next = $derived(nextStep(p));
  const periodLine = $derived(
    `Dönem ${store.assessment.period.trim() || 'girilmedi'} · Revizyon ${store.assessment.meta.revision} · ${store.assessment.meta.status === 'signed' ? 'İmzalandı' : 'Taslak'}`,
  );
  const validUntil = $derived(store.assessment.validUntil.trim());

  const tasks = $derived<{ key: StepKey; title: string; detail: string; run: () => void }[]>([
    {
      key: 'school',
      title: 'Okul bilgilerini girin',
      detail: `Bilgi ${p.school.metaFilled}/${p.school.metaTotal}, imzacı ${p.school.signatoriesFilled}/${p.school.signatoriesTotal} dolu`,
      run: () => nav.openReport(true),
    },
    {
      key: 'checklists',
      title: 'Mekânları denetleyin',
      detail: `${p.checklists.answered}/${p.checklists.total} madde yanıtlandı, ${p.checklists.missing} eksik`,
      run: () => nav.go('locations'),
    },
    {
      key: 'transfer',
      title: 'Eksikleri risk tablosuna aktarın',
      detail: `${p.transfer.untransferred} aktarılmamış eksik`,
      run: () => nav.openDeficiencies({ state: 'untransferred' }),
    },
    {
      key: 'risk',
      title: 'Riskleri puanlayın',
      detail: `${p.risk.scored}/${p.risk.total} satır puanlandı`,
      run: () => (p.risk.firstUnscoredLocationId ? nav.openLocation(p.risk.firstUnscoredLocationId, 'risk') : nav.openRegister()),
    },
    {
      key: 'readiness',
      title: 'Gözden geçirin ve imzalayın',
      detail: p.readiness.hasGaps ? 'Açık noktaları Rapor sayfasında görün' : 'Açık nokta yok',
      run: () => nav.go('report'),
    },
  ]);

  // Counters only when they lead somewhere: zero tiles are hidden.
  const tiles = $derived(
    [
      { label: 'Yüksek/tolere edilemez açık riskler', value: p.risk.openSerious, run: () => nav.openRegister({ level: 'serious', status: 'open' }) },
      { label: 'Süresi geçmiş', value: p.risk.overdue, run: () => nav.openRegister({ overdue: true }) },
      { label: 'Aktarılmamış eksik', value: p.transfer.untransferred, run: () => nav.openDeficiencies({ state: 'untransferred' }) },
    ].filter((t) => t.value > 0),
  );
</script>

<div class="flex flex-col gap-6 p-4">
  <div class="flex max-w-2xl flex-col gap-1">
    <h1 class="text-2xl font-semibold">Genel bakış</h1>
    <p class="text-sm text-muted-foreground">{periodLine}{validUntil ? ` · Geçerlilik ${validUntil}` : ''}</p>
  </div>

  <ol class="flex max-w-2xl flex-col divide-y rounded-xl border bg-card" aria-label="Yıllık değerlendirme adımları">
    {#each tasks as task, i (task.key)}
      {@const isNext = task.key === next}
      {@const isDone = p[task.key].state === 'done'}
      <li>
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-between gap-4 p-4 text-left hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none {isNext ? 'border-l-4 border-l-primary' : ''}"
          aria-current={isNext ? 'step' : undefined}
          onclick={task.run}
        >
          <span class="flex min-w-0 flex-col">
            <span class={isNext ? 'font-semibold' : isDone ? 'text-muted-foreground' : 'font-medium'}>{i + 1}. {task.title}</span>
            <span class="text-sm text-muted-foreground">{task.detail}</span>
          </span>
          {#if isNext}
            <Badge>Sıradaki</Badge>
          {:else if isDone}
            <CircleCheck class="size-4 shrink-0 text-muted-foreground" aria-label="Tamamlandı" />
          {/if}
        </button>
      </li>
    {/each}
  </ol>

  {#if tiles.length}
    <section class="flex flex-col gap-3" aria-labelledby="quick-links">
      <h2 id="quick-links" class="text-lg font-medium">Dikkat edilecekler</h2>
      <ul class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {#each tiles as tile (tile.label)}
          <li>
            <Button variant="outline" class="h-full w-full flex-col items-start gap-1 p-4 whitespace-normal" onclick={tile.run}>
              <span class="text-sm font-normal text-muted-foreground">{tile.label}</span>
              <span class="text-2xl font-semibold">{tile.value}</span>
            </Button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
```

(Geçerlilik kutusu silindi; tarih dönem satırına taşındı. "207 açık nokta" sayısı adım satırından kalktı; ayrıntı Rapor'da.)

- [ ] **Step 6: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: boş çalışmada 1. adım "Sıradaki" ve vurgulu; okul bilgileri tamamlanınca vurgu 2. adıma geçer, 1. adım soluk + onay simgesi; hiç risk yokken "Dikkat edilecekler" bölümü görünmez. Klavyeyle Tab: her adım satırı tam genişlikte ve en az 44 px.

- [ ] **Step 7: Commit**

```bash
git add src/lib/domain/progress.ts src/lib/domain/progress.test.ts src/lib/components/OverviewPage.svelte
```

```bash
git commit -q -m "feat: overview highlights the next step and hides zero counters"
```

### Görev 4: Mekânlar'da "Hazır mekân ekle"

**Files:**

- Modify: `src/lib/components/LocationList.svelte:1-20,44-48`

**Interfaces:**

- Consumes: `LibraryDialog` (`bind:open`), değişmeden.
- Produces: yok.

**Silinecekler:** yok (tek düğme + var olan diyalog).

- [ ] **Step 1: Düğmeyi ve diyaloğu ekle**

Importlara:

```ts
import Library from "@lucide/svelte/icons/library";
import LibraryDialog from "./LibraryDialog.svelte";
```

`let dialogOpen = $state(false);` altına: `let libraryOpen = $state(false);`

Satır 46'daki "Mekân ekle" düğmesinin önüne:

```svelte
    <Button variant="outline" onclick={() => (libraryOpen = true)}><Library />Hazır mekân ekle</Button>
```

Satır 48'deki `<NewLocationDialog …/>` altına:

```svelte
  <LibraryDialog bind:open={libraryOpen} />
```

- [ ] **Step 2: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: Mekânlar → "Hazır mekân ekle" → bir mekân seç → ekle → yeni mekân sayfası açılır.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/LocationList.svelte
```

```bash
git commit -q -m "feat: add ready-made locations from the locations page"
```

---

# Görsel yön

Bu bölüm Faz 4'ün (ve Faz 1-3'te dokunulan ekranların) ölçütüdür. "En küçük değişiklik" kuralı **kod** için geçerlidir; görsel kalite için değil. Hedef sade ama özenli, kullanırken keyif veren bir arayüz.

- **Amaç:** Bir İSG sorumlusu öğretmenin yıllık risk değerlendirmesini kaybolmadan, sırayla ve kendinden emin bitirmesi.
- **Kitle:** MEB meslek lisesi öğretmenleri ve müdür yardımcıları; çoğu 40 yaş üstü, kâğıt formlara alışkın, uygulamayı yılda birkaç hafta yoğun kullanıyor; masaüstünde (Tauri) ve atölyede telefonda.
- **Ton:** sakin, güven veren; resmi bir kâğıt form ya da iş defteri gibi düzenli. Sıkıcı değil: sıcak kâğıt zemin, mürekkep rengi metin, tek bir lacivert vurgu ve renkli kenar şeritleri yaşam katar.
- **Akılda kalan tek ayrıntı:** _defter marjı._ Her risk satırı ve risk düzeyi rozeti, kâğıt defterin sol kenarındaki renkli sekme gibi ince bir şerit taşır: şerit güçlü renk (MEB matrisinin rengi), satırın kendisi soluk ton. Ekran sakin kalır, risk düzeyi yine ilk bakışta okunur. PDF/Excel'deki doygun MEB dolguları değişmez (`src/lib/domain/matrix.ts` `LEVELS` dokunulmaz).
- **Kısıtlar:** yeni bağımlılık yok; stil yalnız shadcn tema değişkenleri (`src/app.css`: `:root`, `.dark`, `@theme inline`) + bileşenlerde Tailwind sınıfları; `@utility`/elle CSS yok; shadcn `ui/**` elle düzenlenmez; Atkinson Hyperlegible Next yazı tipi kalır; WCAG AA kontrast (gövde ≥4.5:1, büyük metin ve odak halkası ≥3:1); `prefers-reduced-motion` her harekette geçerli.

**Renk kuralları:** Kırmızı yalnız risk düzeyinde (yüksek) ve gerçek hatada. "Hayır"/eksik nötr amber. Sayfa başına tek dolu (`default`) düğme; birincil vurgu = lacivert `--primary`. Rozet yalnız istisna için (sıfır sayaç gösterilmez).

**Tipografi ölçeği (Görev 5'te bileşen ve sabit olarak gelir; CSS sınıfı tanımlanmaz):**

| Rol              | Nerede                                                 | Tailwind sınıfları                                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| Sayfa başlığı    | `PageHeader.svelte` (`title`, `subtitle?`, `actions?`) | `text-xl leading-7 font-semibold tracking-tight` (20/28)      |
| Bölüm başlığı    | `class={SECTION_TITLE}` (`shared-classes.ts`)          | `text-sm leading-5 font-medium text-muted-foreground` (14/20) |
| Gövde            | varsayılan                                             | `text-sm leading-6` (14/24) — tablo ve listelerde             |
| Küçük / yardımcı | doğrudan                                               | `text-xs text-muted-foreground` (12/16)                       |

Sayılar her yerde `tabular-nums` (`<body class="tabular-nums">`; yazı tipinde `tnum` özelliği var).

**Eğik çizgili sıfır (Ø) araştırması:** Yazı tipinin GSUB özellikleri `node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2` dosyasından okundu (WOFF2 tablo dizini + Node `zlib.brotliDecompressSync` ile GSUB FeatureList): yalnız `ccmp frac locl pnum tnum`. **`zero` ya da `ss01…ss20` yok**, yani eğik çizgili sıfır yazı tipinin varsayılan glifi ve `font-feature-settings` ile kapatılamaz. Tek teknik yol `unicode-range: U+0030` ile sıfırı yerel bir sistem yazı tipinden almak; ancak değişken ağırlıkla uyumsuz, rakamlar karışık görünür — **önerilmez**. Öneri: korumak (app.css:80'deki gerekçe: O/0 karışmasın). Karar 7.

**Boşluk ölçeği (Tailwind 4 px tabanı):** `gap-1` (4) simge–metin; `gap-2` (8) bir grup içindeki denetimler; `gap-3` (12) bölüm içi; `gap-6` (24) sayfadaki bölümler arası; sayfa kenar boşluğu `p-4` (telefon) / `md:p-6` (masaüstü). Başlık bloğu (h1 + alt satır) `gap-1`.

**Tek sayfa iskeleti:** kap genişliği ve dolgu yalnız `App.svelte`'de (`max-w-6xl`, `p-4 md:p-6`); sayfa kökü `flex flex-col gap-6`; ilk öğe `PageHeader` (başlık + isteğe bağlı tek satır + eylemler); bölümler `SECTION_TITLE` başlık + içerik; listeler kart değil `divide-y rounded-md border` (kart içinde kart yok).

**Boş durumlar:** simge (`size-8 text-muted-foreground`) + tek cümle + en çok tek eylem (`outline sm`), kesik kenarlı sakin kutu. Tek bileşen: `EmptyState.svelte` (Görev 17).

**Hareket:** durum değişimini anlatan ölçülü hareket; 150–200 ms, `ease-out`; yalnız Tailwind sınıfları (`tw-animate-css` zaten yüklü: `animate-collapsible-down/up`, `animate-in fade-in slide-in-from-top-1`). Her hareketli sınıf `motion-reduce:` öneki ile kapatılır (`motion-reduce:animate-none`, `motion-reduce:transition-none`); genel CSS kuralı yok. Hareket gerektirmeyen bilgi hiçbir zaman yalnız hareketle verilmez.

**Etkileşim durumları:** özel tıklanabilir satırlar (adım satırı, akordeon tetikleyici, mekân kartı, grup başlığı) aynı Tailwind sınıf dizisini, `shared-classes.ts`'teki `INTERACTIVE_ROW` sabitini kullanır: hover `bg-accent`, active `bg-accent/80`, odak opak `ring-2 ring-ring` (yarı saydam halka 1.98:1 ölçüldü), renk geçişi 150 ms. shadcn düğmeleri kendi durumlarıyla kalır; odak halkası rengi `--ring` ile ikisi aynı görünür.

## Görsel doğrulama aracı (her görsel görevde kullanılır)

Depoya eklenmez (bağımlılık değil); bakıcının makinesinde Chrome ve puppeteer-core var. Bir kez kur:

```bash
mkdir -p "$TMPDIR/riskprime-shots" && cd "$TMPDIR/riskprime-shots" && pnpm init >/dev/null && pnpm add puppeteer-core@24
```

`$TMPDIR/riskprime-shots/ui-shots.mjs`:

```js
// node ui-shots.mjs <label> [dark] — needs `pnpm run dev` (http://localhost:5173) in the repo.
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const [label = "shot", scheme = "light"] = process.argv.slice(2);
const OUT = new URL(`./shots/${label}-${scheme}/`, import.meta.url).pathname;
const BASE = "http://localhost:5173/";
const VIEWPORTS = {
  desk: { width: 1440, height: 900 },
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
// Unknown hashes fall back to the overview, so the same list works before and after Faz 2.
const ROUTES = ["#genel", "#okul", "#mekanlar", "#riskler", "#eksikler", "#rapor", "#kutuphane"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--lang=tr-TR"],
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
const click = (text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll("button, [role=menuitem]")].find((e) =>
      e.textContent.trim().startsWith(t),
    );
    el?.click();
    return !!el;
  }, text);

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  await page.setViewport(viewport);
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await click("Dosya");
  await wait(300);
  await click("Yeni (okul verisiyle)");
  await wait(1200);
  for (const hash of ROUTES) {
    await page.evaluate((h) => (location.hash = h), hash);
    await wait(700);
    await page.screenshot({ path: `${OUT}${name}-${hash.slice(1)}.png`, fullPage: true });
  }
  // First location, first checklist open: the densest screen.
  await page.evaluate((h) => (location.hash = h), "#mekanlar");
  await wait(500);
  await page.evaluate(() => document.querySelector("main li button, ul li button")?.click());
  await wait(700);
  await page.screenshot({ path: `${OUT}${name}-mekan.png`, fullPage: true });
}
await browser.close();
console.log(`saved to ${OUT}`);
```

Kullanım: Görev 5'e başlamadan önce `node ui-shots.mjs before`; her görsel görevin sonunda `node ui-shots.mjs after-<görev no>` (Görev 6'dan sonra ayrıca `… dark`). Önce/sonra görüntüleri yan yana açılır; görevdeki kontrol listesi bakıcıya bu görüntülerle sunulur.

---

# FAZ 1.5 — Görsel temel ve tema

**Boyut:** M (2 görev). Faz 1'in hemen ardından gelir ki Faz 2-3'te yazılan ya da baştan yazılan bileşenler (`SchoolPage`, `RiskRegisterPage`, `LocationEditor`, akordeonlar, `EmptyState`) ilk günden `PageHeader`, `SECTION_TITLE`, `INTERACTIVE_ROW` ve yeni renk token'larıyla yazılsın; Faz 4 yalnız eski sayfaları hizalar. **Kırılabilecekler:** yeni `theme-choice.test.ts` dışında test yok; tüm ekranların renkleri değişir. **Geri alma:** Görev 5 geri alınırsa sonraki görevlerin `PageHeader`/`shared-classes` importları ve `bg-deficiency` gibi sınıfları çözülmez; 5 ancak sonraki tüm görevlerle birlikte geri alınır. Görev 6 tek başına geri alınabilir (koyu sınıfı hiç eklenmez, açık tema kalır).

### Görev 5: Görsel temel — shadcn tema değişkenleri, sayfa başlığı ve ortak sınıflar

Stil yalnız shadcn tema yöntemiyle (https://ui.shadcn.com/docs/theming): `app.css`'te `:root` / `.dark` değişkenleri ve `@theme inline` eşlemeleri; yeni renkler dokümandaki "Adding new colors" yoluyla (`--deficiency` + `--color-deficiency: var(--deficiency)`). Tekrar eden sınıf grupları CSS'e değil, bileşene ya da Tailwind sınıf dizisi sabitine gider.

**Files:**

- Modify: `src/app.css` (`:root` 12-45, `.dark` 46-78, `@theme inline` 79-120 — yalnız değişken değerleri ve eşlemeler)
- Modify: `index.html:17` (`<body class="tabular-nums">`)
- Create: `src/lib/components/PageHeader.svelte` (sayfa başlığı bloğu)
- Create: `src/lib/components/shared-classes.ts` (birden çok bileşenin kullandığı Tailwind sınıf dizileri)
- Modify: `src/lib/components/OverviewPage.svelte`, `src/lib/components/LocationList.svelte:61` (özel satırlar ortak sınıfa)

**Interfaces:**

- Produces (sonraki görevler bu adları kullanır):
  - Renkler: `--deficiency`, `--deficiency-foreground`, `--deficiency-soft` → Tailwind `bg-deficiency`, `text-deficiency`, `text-deficiency-foreground`, `bg-deficiency-soft`, `border-l-deficiency`; `--risk-<key>` ve `--risk-<key>-soft` (`key` = `negligible | low | medium | high | intolerable`), `--risk-intolerable-foreground` → `bg-risk-<key>-soft`, `bg-risk-intolerable`, `text-risk-intolerable-foreground`, `var(--color-risk-<key>)`.
  - `PageHeader` props: `{ title: string; subtitle?: string; actions?: Snippet }`.
  - `shared-classes.ts`: `export const SECTION_TITLE: string`, `export const INTERACTIVE_ROW: string` (Görev 16 buraya `RISK_TONE` ekler).

**Silinecekler:** turuncu odak halkası (`--ring: oklch(0.7 0.17 50)`) — tek vurgu rengine geçer; nötr gri `--sidebar-primary` (vurgu `--primary` ile aynı olur).

- [ ] **Step 1: Önce görüntüleri**

Run (repo'da `pnpm run dev` açıkken): `node "$TMPDIR/riskprime-shots/ui-shots.mjs" before`
Expected: `shots/before-light/` altında 16 PNG.

- [ ] **Step 2: Açık tema token'ları**

`src/app.css` `:root` bloğunda aşağıdaki değerleri değiştir/ekle (`--radius`, `--primary`, `--primary-foreground`, `--destructive`, `--chart-*` aynı kalır):

```css
--background: oklch(0.985 0.004 85);
--foreground: oklch(0.2 0.01 260);
--card: oklch(1 0 0);
--card-foreground: oklch(0.2 0.01 260);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.2 0.01 260);
--secondary: oklch(0.955 0.008 85);
--secondary-foreground: oklch(0.25 0.01 260);
--muted: oklch(0.96 0.006 85);
--muted-foreground: oklch(0.5 0.01 260);
/* Hover/selection: cool neutral grey, so it never reads as the amber "eksik". */
--accent: oklch(0.945 0.006 250);
--accent-foreground: oklch(0.2 0.01 260);
--border: oklch(0.89 0.01 85);
/* Form field edge: >= 3:1 against paper and card (the mock-up's 0.66 measured 2.98:1). */
--input: oklch(0.64 0.01 85);
/* Focus ring = the one accent colour, opaque (ring/50 measured 1.98:1). */
--ring: oklch(0.34 0.08 258);
--sidebar: oklch(0.97 0.006 85);
--sidebar-foreground: oklch(0.2 0.01 260);
--sidebar-primary: oklch(0.34 0.08 258);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.935 0.008 250);
--sidebar-accent-foreground: oklch(0.2 0.01 260);
--sidebar-border: oklch(0.89 0.01 85);
--sidebar-ring: oklch(0.34 0.08 258);
/* "Hayır" / eksik: neutral amber, never red. */
--deficiency: oklch(0.52 0.12 65);
--deficiency-foreground: oklch(0.99 0.01 85);
--deficiency-soft: oklch(0.96 0.04 85);
/* Risk levels on screen: strong = ledger stripe, soft = fill. PDF/Excel keep the MEB fills in matrix.ts. */
--risk-negligible: oklch(0.78 0 0);
--risk-negligible-soft: oklch(0.955 0 0);
--risk-low: oklch(0.7 0.16 135);
--risk-low-soft: oklch(0.95 0.045 135);
--risk-medium: oklch(0.83 0.16 95);
--risk-medium-soft: oklch(0.965 0.06 95);
--risk-high: oklch(0.58 0.21 27);
--risk-high-soft: oklch(0.94 0.035 27);
--risk-intolerable: oklch(0.2 0.01 260);
/* Row fill only; the intolerable badge is the solid --risk-intolerable. */
--risk-intolerable-soft: oklch(0.9 0.02 27);
--risk-intolerable-foreground: oklch(0.985 0 0);
```

- [ ] **Step 3: Koyu tema token'ları**

`.dark` bloğunda aynı adlar (`--destructive`, `--chart-*` aynı kalır):

```css
--background: oklch(0.17 0.005 85);
--foreground: oklch(0.94 0.006 85);
--card: oklch(0.205 0.006 85);
--card-foreground: oklch(0.94 0.006 85);
--popover: oklch(0.23 0.006 85);
--popover-foreground: oklch(0.94 0.006 85);
--primary: oklch(0.78 0.08 258);
--primary-foreground: oklch(0.18 0.03 258);
--secondary: oklch(0.25 0.006 85);
--secondary-foreground: oklch(0.94 0.006 85);
--muted: oklch(0.25 0.006 85);
--muted-foreground: oklch(0.72 0.01 85);
--accent: oklch(0.27 0.008 250);
--accent-foreground: oklch(0.94 0.006 85);
--border: oklch(1 0 0 / 10%);
/* Opaque: the old 16 % white measured below 3:1 on cards. */
--input: oklch(0.52 0.01 85);
--ring: oklch(0.72 0.1 258);
--sidebar: oklch(0.19 0.006 85);
--sidebar-foreground: oklch(0.94 0.006 85);
--sidebar-primary: oklch(0.78 0.08 258);
--sidebar-primary-foreground: oklch(0.18 0.03 258);
--sidebar-accent: oklch(0.26 0.008 250);
--sidebar-accent-foreground: oklch(0.94 0.006 85);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.72 0.1 258);
--deficiency: oklch(0.8 0.13 75);
--deficiency-foreground: oklch(0.2 0.03 60);
--deficiency-soft: oklch(0.3 0.05 70);
--risk-negligible: oklch(0.62 0 0);
--risk-negligible-soft: oklch(0.28 0 0);
--risk-low: oklch(0.74 0.15 135);
--risk-low-soft: oklch(0.29 0.05 135);
--risk-medium: oklch(0.86 0.15 95);
--risk-medium-soft: oklch(0.31 0.06 95);
--risk-high: oklch(0.68 0.19 27);
--risk-high-soft: oklch(0.31 0.08 27);
--risk-intolerable: oklch(0.94 0.006 85);
--risk-intolerable-soft: oklch(0.34 0.06 27);
--risk-intolerable-foreground: oklch(0.17 0.005 85);
```

Koyu blok bugün hiçbir yerde etkin değil; Görev 6 `.dark` sınıfını ekleyince devreye girer.

**Ölçülen kontrastlar** (WCAG oranı, OKLCH → sRGB → bağıl parlaklık; `scratchpad/fontcheck/contrast.mjs` ile hesaplandı, uygulamada DevTools ile doğrulanır):

| Çift                                                         | Açık                                             | Koyu                                              | Hedef       |
| ------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------- | ----------- |
| gövde metni / zemin                                          | 17.34                                            | 16.04                                             | ≥4.5        |
| `--muted-foreground` / zemin · kart · `--muted` · `--accent` | 5.75 · — · 5.34 · 5.11                           | 7.71 · 7.22 · 6.45 · 6.07                         | ≥4.5        |
| odak halkası `--ring` / zemin · kart                         | 11.32 · 11.81                                    | 7.70 · —                                          | ≥3          |
| form kenarlığı `--input` / zemin · kart                      | 3.22 · 3.36                                      | 3.47 · 3.25 (popover 3.07)                        | ≥3          |
| `--deficiency` metin / zemin                                 | 5.44                                             | 10.06                                             | ≥4.5        |
| "Hayır" düğmesi metni / `--deficiency`                       | 5.52                                             | 9.57                                              | ≥4.5        |
| `--deficiency` metin / `--deficiency-soft`                   | 5.06                                             | 7.24                                              | ≥4.5        |
| gövde / risk soluk tonları (en kötü)                         | 13.34 (tolere edilemez satır)                    | 10.12 (tolere edilemez satır)                     | ≥4.5        |
| `--primary-foreground` / `--primary`                         | 11.32                                            | 9.40                                              | ≥4.5        |
| risk şeritleri / kart                                        | düşük 2.54, orta 1.69, önemsiz 2.00, yüksek 4.76 | önemsiz 4.92, düşük 8.14, orta 11.73, yüksek 5.71 | tamamlayıcı |

Şeritler **tamamlayıcıdır**: düzey adı her zaman rozette yazılıdır (WCAG 1.4.1 renge tek başına dayanmaz), bu yüzden 1.4.11 grafik eşiği zorunlu değil; koyu temada beş şerit ve soluk ton birbirinden ayırt edilir.

- [ ] **Step 4: Tailwind renk adları**

`@theme inline` bloğunun sonuna:

```css
--color-deficiency: var(--deficiency);
--color-deficiency-foreground: var(--deficiency-foreground);
--color-deficiency-soft: var(--deficiency-soft);
--color-risk-negligible: var(--risk-negligible);
--color-risk-negligible-soft: var(--risk-negligible-soft);
--color-risk-low: var(--risk-low);
--color-risk-low-soft: var(--risk-low-soft);
--color-risk-medium: var(--risk-medium);
--color-risk-medium-soft: var(--risk-medium-soft);
--color-risk-high: var(--risk-high);
--color-risk-high-soft: var(--risk-high-soft);
--color-risk-intolerable: var(--risk-intolerable);
--color-risk-intolerable-soft: var(--risk-intolerable-soft);
--color-risk-intolerable-foreground: var(--risk-intolerable-foreground);
```

`app.css`'te başka hiçbir şey değişmez: `@layer base` olduğu gibi kalır, `@utility` ya da özel kural eklenmez.

- [ ] **Step 5: Tabular rakamlar, sayfa başlığı, ortak sınıflar**

`index.html:17` → `<body class="tabular-nums">` (dialog ve toast'lar `body`'ye taşındığı için hepsi kapsanır; yazı tipinde `tnum` var).

`src/lib/components/PageHeader.svelte`:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  // Page title block: one h1 size on every page, an optional line under it, actions on the right.
  let { title, subtitle = '', actions }: { title: string; subtitle?: string; actions?: Snippet } = $props();
</script>

<div class="flex flex-wrap items-start gap-2">
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <h1 class="text-xl leading-7 font-semibold tracking-tight break-words">{title}</h1>
    {#if subtitle}<p class="text-sm text-muted-foreground">{subtitle}</p>{/if}
  </div>
  {#if actions}<div class="flex shrink-0 flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</div>
```

`src/lib/components/shared-classes.ts`:

```ts
// Tailwind class strings used by several components; colours come from the theme variables in app.css.

/** Section heading inside a page. */
export const SECTION_TITLE = "text-sm leading-5 font-medium text-muted-foreground";

/** Custom clickable rows (steps, accordion triggers, location cards): same hover, press and focus as buttons. */
export const INTERACTIVE_ROW =
  "transition-colors duration-150 motion-reduce:transition-none hover:bg-accent active:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
```

(Tailwind 4 kaynak taraması `.ts` dosyalarındaki sabit dizgeleri de görür; sınıflar üretilir.)

- [ ] **Step 6: Var olan özel satırları ortak sınıfa bağla**

Run: `rg -n "hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" src/lib/components --glob '!ui/**'`
Expected: `OverviewPage.svelte` (adım düğmesi, Görev 3) ve `LocationList.svelte:61` (mekân kartı). Her isabette bu dört sınıfı kaldırıp `class="{INTERACTIVE_ROW} …kalan sınıflar…"` yaz ve `import { INTERACTIVE_ROW } from './shared-classes';` ekle. Faz 2-3'te yazılan tetikleyiciler (`SchoolPage`, `LocationDetail` akordeonu, Riskler grup başlıkları, Mekânlar'daki okul geneli satırı) plan kodunda zaten `INTERACTIVE_ROW` kullanır.

- [ ] **Step 7: Kapılar + görsel kontrol**

Kapıları çalıştır. `node "$TMPDIR/riskprime-shots/ui-shots.mjs" after-5` (koyu karşılaştırma Görev 6'dan sonra). Bakıcı kontrol listesi:

- [ ] Zemin sıcak kâğıt tonu, kartlar/popover'lar beyaz "kâğıt yaprağı"; kenarlıklar seçilebiliyor ama bağırmıyor.
- [ ] Odak halkası (Tab) lacivert; düğmede ve özel satırlarda aynı görünüyor.
- [ ] Tablo sayıları alt alta hizalı (O, Ş, No sütunları).
- [ ] Kontrast: `--muted-foreground` metni zemin üzerinde ≥4.5:1 (Chrome DevTools > Inspect > kontrast).
- [ ] `git diff src/app.css` yalnız değişken değerleri ve `@theme inline` satırları gösteriyor (kural, `@utility`, `@media` yok).

- [ ] **Step 8: Commit**

```bash
git add src/app.css index.html src/lib/components
```

```bash
git commit -q -m "style: paper-and-ink theme variables, page header and shared classes"
```

### Görev 6: Koyu tema — sistem tercihi + Dosya menüsünde Açık / Koyu / Sistem

Bugün `.dark` sınıfını hiçbir kod eklemiyor (`app.css:4` sınıf tabanlı varyant; `rg "classList|ModeWatcher" src` boş), yani koyu token'lar hiç görünmüyor. `mode-watcher` paketi kurulu (yalnız `ui/sonner` kullanıyor) ama `localStorage`'a `try/catch`'siz erişiyor (`node_modules/mode-watcher/dist/mode-states.svelte.js:8`); depolama kapalı bir pencerede uygulamayı düşürmemek için küçük bir yerel modül yazılır. Sınıf tabanlı varyant kalır, çünkü kullanıcı sistemden farklı seçebilmeli.

**Files:**

- Create: `src/lib/theme-choice.ts` (saf), `src/lib/theme-choice.test.ts`
- Create: `src/lib/theme.svelte.ts` (canlı durum)
- Modify: `src/main.ts` (açılışta sınıf, yanıp sönme olmasın)
- Modify: `src/App.svelte` (sınıfı canlı tut, `Toaster` teması)
- Modify: `src/lib/components/AppTopbar.svelte` (Dosya menüsünde tema seçimi)

**Interfaces:**

- Produces:
  - `export type ThemeChoice = "light" | "dark" | "system";`
  - `export function parseThemeChoice(stored: string | null): ThemeChoice` — bilinmeyen/boş değer `"system"`.
  - `export function isDarkFor(choice: ThemeChoice, systemPrefersDark: boolean): boolean`
  - `theme` (tekil): `theme.choice: ThemeChoice`, `theme.isDark: boolean`, `theme.set(choice: ThemeChoice): void`.

**Silinecekler:** yok.

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/theme-choice.test.ts`:

```ts
import { describe, expect, test } from "vite-plus/test";
import { isDarkFor, parseThemeChoice } from "./theme-choice";

describe("theme choice", () => {
  test("reads a stored choice and falls back to system", () => {
    // Arrange
    const stored = ["light", "dark", "system", null, "mavi"];
    // Act
    const parsed = stored.map(parseThemeChoice);
    // Assert
    expect(parsed).toEqual(["light", "dark", "system", "system", "system"]);
  });

  test("system follows the operating system, explicit choices win", () => {
    expect(isDarkFor("system", true)).toBe(true);
    expect(isDarkFor("system", false)).toBe(false);
    expect(isDarkFor("light", true)).toBe(false);
    expect(isDarkFor("dark", false)).toBe(true);
  });
});
```

- [ ] **Step 2: Testin düştüğünü gör**

Run: `pnpm run test -- src/lib/theme-choice.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: Uygula**

`src/lib/theme-choice.ts`:

```ts
// Light / dark / system: the pure part, unit tested; theme.svelte.ts keeps the live state.
export type ThemeChoice = "light" | "dark" | "system";

export const parseThemeChoice = (stored: string | null): ThemeChoice =>
  stored === "light" || stored === "dark" ? stored : "system";

export const isDarkFor = (choice: ThemeChoice, systemPrefersDark: boolean): boolean =>
  choice === "dark" || (choice === "system" && systemPrefersDark);
```

`src/lib/theme.svelte.ts`:

```ts
// The theme the user picked (Dosya menu). The .dark class on <html> switches the tokens in app.css.
import { MediaQuery } from "svelte/reactivity";
import { isDarkFor, parseThemeChoice, type ThemeChoice } from "./theme-choice";

const STORAGE_KEY = "riskprime-theme";
const systemDark = new MediaQuery("(prefers-color-scheme: dark)");

function stored(): ThemeChoice {
  try {
    return parseThemeChoice(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "system"; // storage blocked (private window, locked-down profile): follow the system
  }
}

class Theme {
  choice = $state<ThemeChoice>(stored());

  get isDark(): boolean {
    return isDarkFor(this.choice, systemDark.current);
  }

  set(choice: ThemeChoice) {
    this.choice = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // not persisted; the choice still applies until the app closes
    }
  }
}

export const theme = new Theme();

/** Puts the current theme on <html>; Tailwind's scheme-dark also themes scrollbars and native inputs. */
export function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("scheme-dark", isDark);
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `pnpm run test -- src/lib/theme-choice.test.ts`
Expected: PASS.

- [ ] **Step 5: Bağla**

`src/main.ts` — `mount`tan önce (ilk karede doğru tema, beyaz parlama yok):

```ts
import { applyTheme, theme } from "./lib/theme.svelte";

applyTheme(theme.isDark);
```

`src/App.svelte` betiğine:

```ts
import { applyTheme, theme } from "$lib/theme.svelte";

// System changes (choice "system") and menu picks both land here.
$effect(() => applyTheme(theme.isDark));
```

ve son satırı:

```svelte
<Toaster position="top-center" theme={theme.isDark ? 'dark' : 'light'} />
```

(`ui/sonner` içindeki `theme={mode.current}` değerini sonradan gelen `{...restProps}` ezer; `ui/**` düzenlenmez.)

`src/lib/components/AppTopbar.svelte` — Dosya menüsünde "Dosya aç…" bloğundan önce:

```svelte
        <DropdownMenu.Label class="text-xs text-muted-foreground">Görünüm</DropdownMenu.Label>
        <DropdownMenu.RadioGroup value={theme.choice} onValueChange={(v) => theme.set(v as ThemeChoice)}>
          <DropdownMenu.RadioItem value="light" closeOnSelect={false}>Açık</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="dark" closeOnSelect={false}>Koyu</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="system" closeOnSelect={false}>Sistem</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.Separator />
```

Importlar: `import { theme } from '$lib/theme.svelte';`, `import type { ThemeChoice } from '$lib/theme-choice';`. (`closeOnSelect` bits-ui `RadioItem` prop'u; svelte-check reddederse kaldır — menü seçimden sonra kapanır, işlev aynı.)

- [ ] **Step 6: Kapılar + görsel kontrol (iki tema)**

Kapıları çalıştır. `node "$TMPDIR/riskprime-shots/ui-shots.mjs" after-6 light` ve `… after-6 dark`. Bakıcı kontrol listesi:

- [ ] Dosya → Görünüm: Açık / Koyu / Sistem; seçim yeniden yüklemeden sonra korunuyor; varsayılan Sistem.
- [ ] Sistem seçiliyken macOS görünümü değişince uygulama anında izliyor.
- [ ] Gizli pencerede (depolama kapalı) uygulama açılıyor, Sistem'e düşüyor, hata yok.
- [ ] Koyu temada açılışta beyaz parlama yok.
- [ ] Toast'lar koyu temada koyu.
- [ ] Görev 5'teki kontrast tablosunun koyu satırları DevTools'ta tutuyor (gövde ≥4.5:1, odak halkası ve form kenarlığı ≥3:1).
- [ ] Riskler'de beş düzey koyu zeminde ayırt ediliyor (düzey adı rozette yazılı; şerit tamamlayıcı).
- [ ] PDF ve Excel çıktısı koyu temada da öncekiyle aynı renkte.
- [ ] Tauri (`pnpm run tauri dev`): pencere içeriği macOS/Windows görünüm ayarını izliyor, Dosya menüsü seçimi çalışıyor.

- [ ] **Step 7: Commit**

```bash
git add src/lib/theme-choice.ts src/lib/theme-choice.test.ts src/lib/theme.svelte.ts src/main.ts src/App.svelte src/lib/components/AppTopbar.svelte
```

```bash
git commit -q -m "feat: dark theme with a light, dark or system choice"
```

---

# FAZ 2 — Bilgi mimarisi

**Boyut:** L (4 görev). **Kırılabilecekler:** `nav-route.test.ts` (yeniden yazılır), `filters.test.ts` (genişler), `assessment.test.ts` (`filterRows` bloğu silinir). Ekranlar: kenar çubuğu, alt çubuk, Riskler, Eksikler, mekân sayfası, Rapor, üst çubuk. Kaydedilmiş yer imleri: `#genel`, `#mekanlar/...`, `#eksikler`, `#riskler`, `#rapor`, `#kutuphane/...` çalışmaya devam eder; `#mekanlar/<id>/risk` Riskler'i o mekâna süzülmüş açar. **Geri alma:** görevler sırayla commit'lenir; faz bütünüyle `git revert` ile geri alınabilir (veri biçimi değişmediği için kayıtlar etkilenmez). Görev sırası önemlidir: 7 → 8 → 9 → 10. **Faz 2 tek sürümdür:** Görev 7-10 arasında sürüm (tag/yayın) çıkılmaz; menü ve rotalar yarı geçişteyken kullanıcıya gitmemeli.

### Görev 7: Riskler = gruplu, katlanır, düzenlenebilir tablo + eksikler görünümü

**Files:**

- Modify: `src/lib/domain/filters.ts` (`filterRegister` + yeni `groupByLocation`, `pinRegister`, `keepPinned`, `matchesRegisterFilter`)
- Test: `src/lib/domain/filters.test.ts` (sona ekleme)
- Modify: `src/lib/nav.svelte.ts:7-8` (`RegisterFilter.level`)
- Modify: `src/lib/domain/assessment.ts:385-415` (silme)
- Modify: `src/lib/domain/assessment.test.ts` (`describe("filterRows"` bloğu silinir, satır 192'den bloğun sonuna)
- Modify: `src/lib/components/LocationEditor.svelte` (tamamı)
- Modify: `src/lib/components/RiskTable.svelte:17,46-47` (soluk satır)
- Modify: `src/lib/components/RiskRowCard.svelte:14,20-22` (soluk kart)
- Modify: `src/lib/components/RiskRowSheet.svelte:43`
- Modify: `src/lib/components/RiskRegisterPage.svelte` (tamamı)
- Modify: `src/lib/components/DeficienciesPage.svelte:35-43,66-70`
- Modify: `src/lib/components/LocationDetail.svelte:158`
- Modify: `src/lib/nav-items.ts`, `src/lib/components/AppSidebar.svelte`, `src/lib/components/BottomNav.svelte`, `src/App.svelte:10,111-114`

**Interfaces:**

- Consumes: `riskRegister(a): RegisterEntry[]`, `levelCounts`, `deficienciesWithState`, `RiskTable`, `RiskRowCard`, `RiskRowSheet`, `Collapsible`; Görev 5'teki `PageHeader`, `INTERACTIVE_ROW`.
- Produces:
  - `RegisterFilter.level: "all" | "serious" | "unscored"`
  - `export function groupByLocation<T extends { locationId: string | null; locationName: string }>(items: readonly T[]): { key: string; name: string; items: T[] }[]` — `key` = `locationId ?? SCHOOL_WIDE_FILTER`, ilk görülme sırası korunur.
  - `export interface RegisterPin { shown: readonly string[]; known: ReadonlySet<string>; locationId: string | null }`
  - `export function pinRegister(entries: readonly RegisterEntry[], f: RegisterFilter, today: Date): RegisterPin`
  - `export function keepPinned(entries: readonly RegisterEntry[], pin: RegisterPin): RegisterEntry[]`
  - `export const matchesRegisterFilter = (e: RegisterEntry, f: RegisterFilter, today: Date): boolean`
  - `LocationEditor` props: `{ locationId: string; items: { row: RiskRow; number: number }[]; dimIds?: ReadonlySet<string>; dimLabel?: string }`
  - `RiskTable` ek props: `dimIds?: ReadonlySet<string>; dimLabel?: string`; `RiskRowCard` ek prop: `dimLabel?: string` (verilmişse kart soluk).
  - `export const isSectionActive = (item: Section, current: Section): boolean` (`nav-items.ts`)

**Silinecekler:** `RiskRegisterPage` tablo ve kart işaretlemesi (78-131) ile seviye rozet satırı (52-55); `LocationEditor` arama/süzgeç UI'si; `assessment.ts` `RowFilter`, `ROW_FILTERS`, `ROW_FILTER_LABELS`, `filterRows` ve testleri; `DeficienciesPage` kendi `h1`'i, dış kabı ve değiştiren `reduce`'u; menüden "Eksikler" bölümü (`SECTION_ITEMS`, `ClipboardX`, `sectionBadges.deficiencies`).

**Neden sabitlenmiş satır kümesi:** "Puansız" süzgecinde bir satırı puanlayınca satır listeden anında kaybolursa odaklanılan O/Ş seçicisi DOM'dan düşer, klavye kullanıcısı yerini kaybeder ve "ne oldu?" duygusu doğar. Süzgeç seçildiği anda görünen satır kimlikleri tutulur; sonradan uymayan satır yerinde kalır ve "puanlandı" diye soluklaşır; süzgeç yeniden seçilince küme yenilenir.

- [ ] **Step 1: Başarısız testleri yaz**

`filters.test.ts` importlarına `groupByLocation`, `keepPinned`, `matchesRegisterFilter`, `pinRegister` (`./filters`) ve `removeRow` (`./assessment`) ekle. Dosya sonuna:

```ts
describe("groupByLocation", () => {
  test("groups by location in first-seen order and keeps item order", () => {
    // Arrange
    const items = [
      { locationId: "l2", locationName: "Atölye", n: 1 },
      { locationId: "l1", locationName: "Depo", n: 2 },
      { locationId: "l2", locationName: "Atölye", n: 3 },
    ];
    // Act
    const groups = groupByLocation(items);
    // Assert
    expect(groups.map((g) => [g.key, g.name, g.items.map((i) => i.n)])).toEqual([
      ["l2", "Atölye", [1, 3]],
      ["l1", "Depo", [2]],
    ]);
  });

  test("okul geneli items share the school-wide key", () => {
    const groups = groupByLocation([{ locationId: null, locationName: "Okul geneli" }]);
    expect(groups[0].key).toBe(SCHOOL_WIDE_FILTER);
  });
});

describe("filterRegister unscored", () => {
  test("keeps only rows without a level", () => {
    // Arrange
    let a = emptyAssessment("2026-2027");
    a = addLocation(a, { id: "l1", name: "Depo" });
    a = addRow(a, "l1", { id: "r1", hazard: "Puanlı" });
    a = addRow(a, "l1", { id: "r2", hazard: "Puansız" });
    a = updateRow(a, "l1", "r1", { likelihood: 3, severity: 4 });
    // Act
    const out = filterRegister(riskRegister(a), { ...ALL_RISKS, level: "unscored" }, TODAY);
    // Assert
    expect(out.map((e) => e.row.id)).toEqual(["r2"]);
  });
});

describe("pinned register rows", () => {
  function twoUnscored() {
    let a = emptyAssessment("2026-2027");
    a = addLocation(a, { id: "l1", name: "Depo" });
    a = addLocation(a, { id: "l2", name: "Atölye" });
    a = addRow(a, "l1", { id: "r1", hazard: "Bir" });
    return addRow(a, "l1", { id: "r2", hazard: "İki" });
  }
  const unscored = { ...ALL_RISKS, level: "unscored" as const };

  test("a row scored under Puansız stays listed and no longer matches", () => {
    // Arrange
    const before = twoUnscored();
    const pin = pinRegister(riskRegister(before), unscored, TODAY);
    const after = updateRow(before, "l1", "r1", { likelihood: 3, severity: 4 });
    // Act
    const shown = keepPinned(riskRegister(after), pin);
    // Assert
    expect(shown.map((e) => e.row.id)).toEqual(["r1", "r2"]);
    expect(shown.map((e) => matchesRegisterFilter(e, unscored, TODAY))).toEqual([false, true]);
  });

  test("rows added since come last, only for the filtered location", () => {
    const before = twoUnscored();
    const pin = pinRegister(riskRegister(before), { ...unscored, locationId: "l1" }, TODAY);
    const after = addRow(addRow(before, "l1", { id: "r3" }), "l2", { id: "r4" });
    expect(keepPinned(riskRegister(after), pin).map((e) => e.row.id)).toEqual(["r1", "r2", "r3"]);
  });

  test("a deleted row drops out", () => {
    const before = twoUnscored();
    const pin = pinRegister(riskRegister(before), unscored, TODAY);
    const after = removeRow(before, "l1", "r2");
    expect(keepPinned(riskRegister(after), pin).map((e) => e.row.id)).toEqual(["r1"]);
  });
});
```

- [ ] **Step 2: Testlerin düştüğünü gör**

Run: `pnpm run test -- src/lib/domain/filters.test.ts`
Expected: FAIL — `groupByLocation`, `pinRegister`, `keepPinned`, `matchesRegisterFilter` yok; `"unscored"` tip hatası.

- [ ] **Step 3: Uygula**

`nav.svelte.ts:7-8`:

```ts
/** "serious" = Yüksek + Tolere edilemez; "unscored" = olasılık ya da şiddet boş. */
level: "all" | "serious" | "unscored";
```

`filters.ts` `filterRegister` içindeki level satırı:

```ts
    .filter(
      (e) =>
        f.level === "all" ||
        (f.level === "unscored" ? !e.level : !!e.level && SERIOUS.includes(e.level.key)),
    )
```

`filters.ts` sonuna:

```ts
/** Items grouped by location (okul geneli under SCHOOL_WIDE_FILTER), groups in first-seen order. */
export function groupByLocation<T extends { locationId: string | null; locationName: string }>(
  items: readonly T[],
): { key: string; name: string; items: T[] }[] {
  const keyOf = (i: T) => i.locationId ?? SCHOOL_WIDE_FILTER;
  return [...new Set(items.map(keyOf))].map((key) => {
    const members = items.filter((i) => keyOf(i) === key);
    return { key, name: members[0].locationName, items: members };
  });
}

/** What a Riskler filter showed when it was chosen, every row id known then, and its location. */
export interface RegisterPin {
  shown: readonly string[];
  known: ReadonlySet<string>;
  locationId: string | null;
}

export function pinRegister(
  entries: readonly RegisterEntry[],
  f: RegisterFilter,
  today: Date,
): RegisterPin {
  return {
    shown: filterRegister([...entries], f, today).map((e) => e.row.id),
    known: new Set(entries.map((e) => e.row.id)),
    locationId: f.locationId,
  };
}

/**
 * Pinned rows in pinned order (deleted ones drop out), then rows added since in the pinned location:
 * a row scored under "Puansız" stays where it is instead of vanishing under the cursor.
 */
export function keepPinned(entries: readonly RegisterEntry[], pin: RegisterPin): RegisterEntry[] {
  const byId = new Map(entries.map((e) => [e.row.id, e]));
  const kept = pin.shown.flatMap((id) => byId.get(id) ?? []);
  const added = entries.filter(
    (e) => !pin.known.has(e.row.id) && (pin.locationId === null || e.locationId === pin.locationId),
  );
  return [...kept, ...added];
}

export const matchesRegisterFilter = (e: RegisterEntry, f: RegisterFilter, today: Date): boolean =>
  filterRegister([e], f, today).length > 0;
```

Dosya başındaki yorumu `// Pure filters of Riskler and its deficiency view. Filter shapes live in nav.svelte.ts.` yap.

- [ ] **Step 4: Testlerin geçtiğini gör**

Run: `pnpm run test -- src/lib/domain/filters.test.ts`
Expected: PASS.

- [ ] **Step 5: `filterRows` ve testlerini sil**

`assessment.ts` 385-415 (`RowFilter` … `filterRows` sonu) sil (`isScore` importu satır 253'te hâlâ kullanılıyor, kalır). `assessment.test.ts` içinde `describe("filterRows", () => {` bloğunu kapanan `});`'ye kadar sil.

Run: `rg -n "filterRows|ROW_FILTER|RowFilter" src`
Expected: yalnız `LocationEditor.svelte` (sonraki adımda temizlenir).

- [ ] **Step 6: `LocationEditor`, `RiskTable`, `RiskRowCard` — `items` ve soluk satır**

`LocationEditor.svelte` dosyanın tamamı:

```svelte
<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import RiskRowCard from './RiskRowCard.svelte';
  import RiskRowSheet, { ADD_ROW_BUTTON_ID } from './RiskRowSheet.svelte';
  import RiskTable from './RiskTable.svelte';
  import { addRow, newId } from '$lib/domain/assessment';
  import type { RiskRow } from '$lib/domain/types';
  import { focusFirstField, store } from '$lib/state.svelte';
  import { nav } from '$lib/nav.svelte';

  // One location's rows inside Riskler; `items` come filtered and numbered by the page, `dimIds` no longer match its filter.
  let {
    locationId,
    items,
    dimIds = new Set<string>(),
    dimLabel = '',
  }: { locationId: string; items: { row: RiskRow; number: number }[]; dimIds?: ReadonlySet<string>; dimLabel?: string } = $props();

  const loc = $derived(store.assessment.locations.find((l) => l.id === locationId));
  let openId = $state<string | null>(null);

  // nav.openRow asks for a row sheet; a request for another location is left for that one.
  $effect(() => {
    const req = nav.rowRequest;
    if (!req || req.locationId !== locationId) return;
    openId = req.rowId;
    nav.rowRequest = null;
  });

  function addNewRow() {
    const id = newId('r');
    if (!store.apply((a) => addRow(a, locationId, { id }))) return;
    openId = id;
    focusFirstField('row-sheet-body', 300);
  }
</script>

{#if loc}
  <div class="@container flex min-w-0 flex-col gap-3">
    {#if loc.rows.length === 0}
      <p class="py-6 text-center text-sm text-muted-foreground">Bu mekânda risk satırı yok.</p>
    {/if}
    <div class="hidden @3xl:block">
      {#if items.length}<RiskTable {items} {locationId} {openId} {dimIds} {dimLabel} onopen={(id) => (openId = id)} />{/if}
    </div>
    <div class="flex flex-col gap-3 @3xl:hidden">
      {#each items as { row, number } (row.id)}
        <RiskRowCard {row} index={number} {locationId} dimLabel={dimIds.has(row.id) ? dimLabel : undefined} onopen={(id) => (openId = id)} />
      {/each}
    </div>
    <RiskRowSheet rows={loc.rows} {locationId} bind:openId />
    <div><Button id="{ADD_ROW_BUTTON_ID}-{locationId}" variant="outline" size="sm" onclick={addNewRow}><Plus />Satır ekle</Button></div>
  </div>
{/if}
```

`RiskTable.svelte:17` prop listesine `dimIds = new Set<string>(), dimLabel = ''` ve tiplerine `dimIds?: ReadonlySet<string>; dimLabel?: string` ekle. Satır 46'daki `Table.Row` sınıfının sonuna `{dimIds.has(row.id) ? 'opacity-60' : ''}`; satır 47'deki No hücresinin içeriğini:

```svelte
{n}{#if dimIds.has(row.id)}<span class="block text-xs font-normal">{dimLabel}</span>{/if}
```

`RiskRowCard.svelte:14` prop listesine `dimLabel` (`dimLabel?: string`); satır 20 `<article …>`'a `class:opacity-60={dimLabel !== undefined}`; satır 22'deki numara `<span>`'inden sonra `{#if dimLabel}<span class="text-xs text-muted-foreground">{dimLabel}</span>{/if}`.

`RiskRowSheet.svelte:43` (birden çok editör aynı sayfada; id tekil olmalı):

```ts
void tick().then(() => document.getElementById(`${ADD_ROW_BUTTON_ID}-${locationId}`)?.focus());
```

`LocationDetail.svelte:158` (risk sekmesi Görev 8'de silinene kadar geçici):

```svelte
      {#key id}<LocationEditor locationId={id} items={loc.rows.map((row, i) => ({ row, number: i + 1 }))} />{/key}
```

- [ ] **Step 7: `DeficienciesPage`'yi Riskler'e gömülebilir yap**

`DeficienciesPage.svelte`: importa `groupByLocation` ekle (`filters` importuna). 35-43 (`const groups = $derived(shown.reduce(…))`) yerine:

```ts
const groups = $derived(groupByLocation(shown));
```

66-70 yerine (başlık ve dış kap Riskler'de):

```svelte
<div class="flex flex-col gap-4">
  <div class="flex justify-end">
    <Button variant="outline" disabled={!pending.length} onclick={transferShown}><ShieldAlert />Görünenleri riske ekle ({pending.length})</Button>
  </div>
```

Grup başlıklarının sınıfı `{SECTION_TITLE}` (`import { SECTION_TITLE } from './shared-classes';`). `Deficiency` tip importu artık kullanılmıyorsa lint uyarısına göre kaldır.

- [ ] **Step 8: `RiskRegisterPage.svelte`'yi yeniden yaz**

Dosyanın tamamı:

```svelte
<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Funnel from '@lucide/svelte/icons/funnel';
  import { untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import DeficienciesPage from './DeficienciesPage.svelte';
  import LocationEditor from './LocationEditor.svelte';
  import PageHeader from './PageHeader.svelte';
  import SelectField from './SelectField.svelte';
  import { INTERACTIVE_ROW } from './shared-classes';
  import { STATUS_LABELS } from '$lib/domain/assessment';
  import { filterRegister, groupByLocation, keepPinned, levelCounts, matchesRegisterFilter, pinRegister, type RegisterPin } from '$lib/domain/filters';
  import { riskRegister } from '$lib/domain/inspections';
  import { countUntransferred } from '$lib/domain/transfer';
  import { nav, type RegisterFilter } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  type LevelFilter = { level: RegisterFilter['level']; label: string; count: number };

  const ALL = 'all';
  const today = new Date();

  const a = $derived(store.assessment);
  const filter = $derived(nav.registerFilter);
  const everything = $derived(riskRegister(a));
  const counts = $derived(levelCounts(everything, filter, today));
  const untransferred = $derived(countUntransferred(a));
  const isDeficiencyView = $derived(nav.section === 'deficiencies');
  const isNarrowed = $derived(filter.level !== 'all' || filter.status !== 'all' || filter.overdue || filter.query !== '');

  let pin = $state<RegisterPin | null>(null);
  /** Groups the user opened or closed under the current filter; others use the default below. */
  let openOverrides = $state<Record<string, boolean>>({});
  // Every new filter object (a facet change, or re-choosing the same filter) pins what it shows now.
  $effect.pre(() => {
    const f = nav.registerFilter;
    untrack(() => {
      pin = pinRegister(everything, f, today);
      openOverrides = {};
    });
  });
  const shown = $derived(pin ? keepPinned(everything, pin) : filterRegister(everything, filter, today));
  const dimIds = $derived(new Set(shown.filter((e) => !matchesRegisterFilter(e, filter, today)).map((e) => e.row.id)));
  const dimLabel = $derived(filter.level === 'unscored' ? 'puanlandı' : 'güncellendi');
  const groups = $derived(groupByLocation(shown));
  const unscoredIn = (items: typeof shown) => items.filter((e) => !e.level).length;
  // Unfiltered, only groups with unscored rows start open; a narrowed list opens everything it shows.
  const isGroupOpen = (key: string, items: typeof shown) => openOverrides[key] ?? (isNarrowed || unscoredIn(items) > 0);
  const filteredLocation = $derived(a.locations.find((l) => l.id === filter.locationId));

  // A filter with nothing behind it is not offered (except "Tümü" and the active one).
  const levelFilters = $derived.by(() => {
    const all: LevelFilter[] = [
      { level: 'all', label: 'Tümü', count: counts.all },
      { level: 'serious', label: 'Yüksek ve tolere edilemez', count: counts.serious },
      { level: 'unscored', label: 'Puansız', count: counts.unscored },
    ];
    return all.filter((f) => f.level === 'all' || f.level === filter.level || f.count > 0);
  });

  const locationOptions = $derived([{ value: ALL, label: 'Tüm mekânlar' }, ...a.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' }))]);
  const statusOptions = [
    { value: 'all', label: 'Tüm durumlar' },
    { value: 'open', label: STATUS_LABELS.open },
    { value: 'done', label: STATUS_LABELS.done },
  ];

  const patch = (changes: Partial<RegisterFilter>) => (nav.registerFilter = { ...filter, ...changes });
  const isFiltered = $derived(isNarrowed || filter.locationId !== null);
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-1">
    {#if filteredLocation}
      <Button variant="link" class="h-auto self-start p-0" onclick={() => nav.openLocation(filteredLocation.id)}><ArrowLeft />{filteredLocation.name || 'Adsız mekân'} kontrol listeleri</Button>
    {/if}
    <PageHeader title="Riskler" />
  </div>

  <div class="flex flex-wrap gap-2" role="group" aria-label="Görünüm">
    <Button variant={isDeficiencyView ? 'outline' : 'secondary'} size="sm" aria-pressed={!isDeficiencyView} onclick={() => nav.openRegister(filter)}>Risk satırları</Button>
    <Button variant={isDeficiencyView ? 'secondary' : 'outline'} size="sm" aria-pressed={isDeficiencyView} onclick={() => nav.openDeficiencies({ state: 'untransferred' })}>
      Riske eklenmemiş eksikler{untransferred ? ` (${untransferred})` : ''}
    </Button>
  </div>

  {#if isDeficiencyView}
    <DeficienciesPage />
  {:else}
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Düzey">
        {#each levelFilters as f (f.level)}
          <Button variant={filter.level === f.level ? 'default' : 'outline'} size="sm" aria-pressed={filter.level === f.level} onclick={() => patch({ level: f.level })}>{f.label} ({f.count})</Button>
        {/each}
      </div>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto]">
        <SelectField label="Mekân" options={locationOptions} value={filter.locationId ?? ALL} onValueChange={(v) => nav.openRegister({ ...filter, locationId: v === ALL ? null : v })} />
        <SelectField label="Durum" options={statusOptions} value={filter.status} onValueChange={(v) => patch({ status: v as RegisterFilter['status'] })} />
        <Input type="search" aria-label="Risklerde ara" placeholder="Ara…" value={filter.query} oninput={(e) => patch({ query: e.currentTarget.value })} />
        <Label class="flex min-h-9 items-center gap-2 text-sm">
          <Checkbox checked={filter.overdue} onCheckedChange={(v) => patch({ overdue: v === true })} />Süresi geçmiş
        </Label>
      </div>
    </div>

    {#if filter.locationId}
      <LocationEditor locationId={filter.locationId} items={shown} {dimIds} {dimLabel} />
    {:else if !shown.length}
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
        {#if everything.length}
          <p class="text-sm text-muted-foreground">Bu süzgece uyan risk satırı yok.</p>
          {#if isFiltered}<Button variant="outline" size="sm" onclick={() => nav.openRegister()}>Süzgeçleri temizle</Button>{/if}
        {:else}
          <p class="text-sm text-muted-foreground">Henüz risk satırı yok.</p>
          <Button variant="outline" size="sm" onclick={() => nav.openDeficiencies({ state: 'untransferred' })}>Eksiklere git</Button>
        {/if}
      </div>
    {:else}
      <div class="flex flex-col divide-y rounded-md border">
        {#each groups as g (g.key)}
          {@const isOpen = isGroupOpen(g.key, g.items)}
          {@const name = g.name || 'Adsız mekân'}
          <Collapsible.Root open={isOpen} onOpenChange={(o) => (openOverrides = { ...openOverrides, [g.key]: o })}>
            <div class="flex items-center gap-1 pr-2">
              <h2 class="flex-1">
                <Collapsible.Trigger class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center gap-2 px-3 text-left">
                  <ChevronDown class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none {isOpen ? '' : '-rotate-90'}" aria-hidden="true" />
                  <span class="font-medium">{name}</span>
                  <span class="text-xs text-muted-foreground">{g.items.length} satır · {unscoredIn(g.items)} puansız</span>
                </Collapsible.Trigger>
              </h2>
              <Button variant="ghost" size="icon-sm" aria-label="Yalnız {name}" title="Yalnız bu mekân" onclick={() => nav.openRegister({ ...filter, locationId: g.key })}><Funnel /></Button>
            </div>
            <Collapsible.Content class="px-3 pb-3">
              <LocationEditor locationId={g.key} items={g.items} {dimIds} {dimLabel} />
            </Collapsible.Content>
          </Collapsible.Root>
        {/each}
      </div>
    {/if}
  {/if}
</div>
```

(Not: mekân süzgecinin `nav.openRegister` ile değişmesi Görev 8'de URL'ye yansır; bu görevde `openRegister` yalnız süzgeci kurar ve bölüme gider. Boş durum kutuları Görev 17'de `EmptyState`'e geçer.)

- [ ] **Step 9: Menüden "Eksikler"i kaldır, Riskler iki görünümde etkin**

`nav-items.ts`: `ClipboardX` importunu, `SECTION_ITEMS` içindeki `deficiencies` satırını, `countUntransferred` importunu, `SectionBadges.deficiencies` alanını ve `sectionBadges` içindeki `deficiencies:` satırını sil; `SECTION_LABELS.deficiencies` → `"Riske eklenmemiş eksikler"`. Sona ekle:

```ts
/** Riskler stays highlighted on its deficiency view (section "deficiencies"). */
export const isSectionActive = (item: Section, current: Section): boolean =>
  item === current || (item === "register" && current === "deficiencies");
```

`AppSidebar.svelte`: importu `import { isSectionActive, SECTION_ITEMS, sectionBadges } from '$lib/nav-items';` yap; `counts` satırını sil; satır 37'yi `{@const count = item.section === 'register' ? badges.register : 0}` yap (rozet = açık yüksek + tolere edilemez); `isActive` ve `aria-current` içinde `nav.section === item.section` yerine `isSectionActive(item.section, nav.section)`; satır 48 sr-only metni `yüksek ve tolere edilemez açık risk` (koşulsuz).

`BottomNav.svelte`: aynı import ve `count`/`active` değişikliği (`{@const active = isSectionActive(item.section, nav.section)}`), `counts` satırını sil, satır 29 sr-only metni koşulsuz `yüksek ve tolere edilemez açık risk`; satır 15 sabit sütun sayısı yerine:

```svelte
  <ul class="grid" style="grid-template-columns: repeat({SECTION_ITEMS.length}, minmax(0, 1fr))">
```

`App.svelte`: satır 10 (`DeficienciesPage` importu) sil; 111-114 yerine:

```svelte
      {:else if nav.section === 'deficiencies' || nav.section === 'register'}
        <RiskRegisterPage />
```

- [ ] **Step 10: Kapılar + elle kontrol (açık ve koyu)**

Kapıları çalıştır. `ui-shots.mjs after-7 light` ve `… dark`. Elle (`pnpm run dev`, Dosya → Yeni (okul verisiyle)):

1. Riskler: satırlar katlanır mekân grupları altında; başlıkta "N satır · M puansız"; süzgeçsizken yalnız puansızı olan gruplar açık başlıyor; O/Ş satır içinde değişiyor; satıra tıklayınca yan sayfa açılıyor; her grupta "Satır ekle".
2. "Puansız" seçiliyken bir satırı klavyeyle puanla: satır yerinde kalıyor, soluklaşıyor ve "puanlandı" yazıyor, odak seçicide kalıyor; "Puansız"a yeniden basınca puanlanan satır listeden çıkıyor.
3. Sayısı 0 olan süzgeç düğmesi görünmüyor.
4. Grup başlığındaki huni → süzgeç o mekân, başlıkta "← <mekân> kontrol listeleri" bağlantısı mekân sayfasına dönüyor; boş bir mekân seçilince yine "Satır ekle" görünüyor.
5. "Riske eklenmemiş eksikler" → eski Eksikler listesi; kenar çubuğunda "Riskler" etkin kalıyor; `#eksikler` adresi aynı görünümü açıyor.
6. Telefon genişliği (≤767 px): alt çubukta 4 eşit sekme, kartlar görünüyor.
7. Mekân sayfasının "Risk tablosu" sekmesi hâlâ çalışıyor (Görev 8'e kadar).

- [ ] **Step 11: Commit**

```bash
git add src/lib src/App.svelte
```

```bash
git commit -q -m "feat: one Riskler page with grouped, pinned, inline-editable rows and a deficiency view"
```

### Görev 8: Mekân sayfasından risk sekmesini kaldır, eski bağlantıları Riskler'e yönlendir

**Files:**

- Modify: `src/lib/nav-route.ts` (tamamı)
- Test: `src/lib/nav-route.test.ts` (tamamı)
- Modify: `src/lib/nav.svelte.ts:2-4,50-76`
- Modify: `src/App.svelte:46-55`
- Modify: `src/lib/components/AppTopbar.svelte:61-75`
- Modify: `src/lib/components/LocationDetail.svelte` (sekmeler)
- Modify: çağıranlar — `InspectionEditor.svelte:56`, `ReadinessList.svelte:25`, `OverviewPage.svelte` (risk adımı), `ChecklistRiskButton.svelte:34`, `RowSourceSection.svelte:54`, `SourceBadge.svelte:25`, `state.svelte.ts:84-87,163-165,167-169`

**Interfaces:**

- Consumes: `isSectionActive`, `LocationEditor` (Görev 7).
- Produces:
  - `Place = { section: Section; locationId: string | null; listId: string | null }` — `locationId`: Mekânlar'da açık mekân, Riskler'de mekân süzgeci.
  - `nav.openLocation(locationId: string, listId: string | null = null)`
  - `nav.openRegister(filter?: Partial<RegisterFilter>)` artık `place.locationId`'yi de yazar; `nav.go("register")` = `openRegister()`.
  - Hash: `#riskler/<mekân>`; `#mekanlar/<mekân>/risk[/...]` → Riskler (o mekân).

**Silinecekler:** `LocationView` tipi ve `VIEW_SEGMENTS`; `Place.locationView`; `LocationDetail` `Tabs` ve `LocationEditor` kullanımı (Görev 7'deki geçici satır dahil); `AppTopbar` "Risk tablosu" kırıntısı; `store.selectLocation`, `store.openRow` sarmalayıcıları (çağıranı yok).

- [ ] **Step 1: Başarısız testleri yaz**

`nav-route.test.ts` dosyasının tamamı:

```ts
import { describe, expect, test } from "vite-plus/test";
import { HOME, formatHash, parseHash, type Place } from "./nav-route";

const place = (p: Partial<Place>): Place => ({ ...HOME, ...p });

describe("nav routes", () => {
  test("round-trips every kind of place", () => {
    const places: Place[] = [
      HOME,
      place({ section: "locations" }),
      place({ section: "locations", locationId: "a-11" }),
      place({ section: "locations", locationId: "a-11", listId: "k-3" }),
      place({ section: "deficiencies" }),
      place({ section: "register" }),
      place({ section: "register", locationId: "a-11" }),
      place({ section: "report" }),
      place({ section: "library" }),
      place({ section: "library", listId: "k 3/ö" }),
    ];
    for (const p of places) expect(parseHash(formatHash(p))).toEqual(p);
  });

  test("formats readable Turkish segments", () => {
    expect(formatHash(place({ section: "locations", locationId: "a-11", listId: "k-3" }))).toBe(
      "#mekanlar/a-11/denetim/k-3",
    );
    expect(formatHash(place({ section: "register", locationId: "a-11" }))).toBe("#riskler/a-11");
    expect(formatHash(place({ section: "register" }))).toBe("#riskler");
  });

  test("unknown or empty hashes open the overview", () => {
    expect(parseHash("")).toEqual(HOME);
    expect(parseHash("#yok")).toEqual(HOME);
  });

  test("a saved location risk link opens Riskler for that location", () => {
    const expected = place({ section: "register", locationId: "a-1" });
    expect(parseHash("#mekanlar/a-1/risk")).toEqual(expected);
    expect(parseHash("#mekanlar/a-1/risk/k-9")).toEqual(expected);
  });
});
```

- [ ] **Step 2: Testlerin düştüğünü gör**

Run: `pnpm run test -- src/lib/nav-route.test.ts`
Expected: FAIL — `locationView` alanı fazladan, `#riskler/a-11` biçimlenmiyor.

- [ ] **Step 3: `nav-route.ts`'yi yeniden yaz**

Dosyanın tamamı:

```ts
// URL hash <-> navigation place. Pure, so it is unit tested; nav.svelte.ts keeps the live state.

export type Section = "overview" | "locations" | "deficiencies" | "register" | "report" | "library";

export interface Place {
  section: Section;
  /** Mekânlar: the open location (null = the list). Riskler: the location filter (null = all). */
  locationId: string | null;
  /** Checklist: the one open in a location, or the template opened in Kütüphane. */
  listId: string | null;
}

export const HOME: Place = { section: "overview", locationId: null, listId: null };

const SEGMENTS: Record<Section, string> = {
  overview: "genel",
  locations: "mekanlar",
  deficiencies: "eksikler",
  register: "riskler",
  report: "rapor",
  library: "kutuphane",
};
const INSPECTION_SEGMENT = "denetim";
/** "#mekanlar/<loc>/risk" was a location's risk tab; saved links now open Riskler for it. */
const LEGACY_RISK_SEGMENT = "risk";

const sectionOf = (segment: string): Section | null =>
  (Object.keys(SEGMENTS) as Section[]).find((s) => SEGMENTS[s] === segment) ?? null;

/**
 * "#mekanlar/<loc>/denetim/<list>", "#riskler/<loc>", "#kutuphane/<list>", "#eksikler", ...
 * Unknown hashes open the overview.
 */
export function parseHash(hash: string): Place {
  const parts = hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const section = sectionOf(parts[0] ?? "");
  if (!section) return HOME;
  const locationId = parts[1] || null;
  if (section === "locations" && parts[2] === LEGACY_RISK_SEGMENT)
    return { ...HOME, section: "register", locationId };
  if (section === "locations") return { section, locationId, listId: parts[3] || null };
  if (section === "register") return { ...HOME, section, locationId };
  if (section === "library") return { ...HOME, section, listId: parts[1] || null };
  return { ...HOME, section };
}

export function formatHash(p: Place): string {
  const enc = encodeURIComponent;
  const base = `#${SEGMENTS[p.section]}`;
  if (p.section === "locations" && p.locationId) {
    const list = p.listId ? `/${enc(p.listId)}` : "";
    return `${base}/${enc(p.locationId)}/${INSPECTION_SEGMENT}${list}`;
  }
  if (p.section === "register" && p.locationId) return `${base}/${enc(p.locationId)}`;
  if (p.section === "library" && p.listId) return `${base}/${enc(p.listId)}`;
  return base;
}
```

- [ ] **Step 4: Testlerin geçtiğini gör**

Run: `pnpm run test -- src/lib/nav-route.test.ts`
Expected: PASS.

- [ ] **Step 5: `nav.svelte.ts`'yi güncelle**

Satır 2-4:

```ts
import { HOME, type Place, type Section } from "./nav-route";

export type { Place, Section } from "./nav-route";
```

`go`, `openLocation`, `openRow`, `openRegister` (50-76) yerine:

```ts
  go(section: Section) {
    if (section === "register") return this.openRegister();
    this.place = { ...HOME, section };
  }

  openLocation(locationId: string, listId: string | null = null) {
    this.place = { section: "locations", locationId, listId };
  }

  /** Opens Riskler on the row's location and asks for that row's sheet. */
  openRow(locationId: string, rowId: string) {
    this.openRegister({ locationId });
    this.rowRequest = { locationId, rowId };
  }

  /** Riskler with a fresh filter; the location filter is part of the URL. */
  openRegister(filter: Partial<RegisterFilter> = {}) {
    this.registerFilter = { ...ALL_RISKS, ...filter };
    this.place = { ...HOME, section: "register", locationId: this.registerFilter.locationId };
  }
```

`rowRequest` yorumunu `/** Set to open a risk row's sheet; the row's LocationEditor in Riskler clears it. */` yap.

- [ ] **Step 6: `App.svelte` hash → süzgeç eşitlemesi**

`applyHash` içinde `nav.place = {…};` atamasından sonra, `history.replaceState` öncesine:

```ts
// Riskler keeps its location filter in the URL (back button, saved links).
if (nav.place.section === "register")
  nav.registerFilter = { ...nav.registerFilter, locationId: nav.place.locationId };
```

- [ ] **Step 7: Kırıntılar**

`AppTopbar.svelte` 61-75 (`crumbs`) yerine:

```ts
/** Section, then the location (Mekânlar or the Riskler filter) and the open checklist; the last crumb is the current page. */
const crumbs = $derived.by((): Crumb[] => {
  const p = nav.place;
  const root: Crumb = {
    label: SECTION_LABELS[p.section],
    href: formatHash({ ...HOME, section: p.section }),
  };
  if (p.section === "library") {
    const list = templateLabel(p.listId);
    return list ? [root, { label: list }] : [{ label: root.label }];
  }
  const register: Crumb = {
    label: SECTION_LABELS.register,
    href: formatHash({ ...HOME, section: "register" }),
  };
  // The deficiency view lives under Riskler.
  if (p.section === "deficiencies") return [register, { label: SECTION_LABELS.deficiencies }];
  const loc = store.assessment.locations.find((l) => l.id === p.locationId);
  if (!loc) return [{ label: root.label }];
  const locName = loc.name || "Adsız mekân";
  // Riskler filtered to one location: the location crumb leads back to its checklists.
  if (p.section === "register") {
    const locHref = formatHash({ ...HOME, section: "locations", locationId: loc.id });
    return [register, { label: locName, href: locHref }, { label: "Risk satırları" }];
  }
  const list = templateLabel(p.listId);
  if (!list) return [root, { label: locName }];
  return [root, { label: locName, href: formatHash({ ...p, listId: null }) }, { label: list }];
});
```

- [ ] **Step 8: `LocationDetail` — sekmeleri sil, Riskler'e bağlantı**

`LocationDetail.svelte`:

- Importlardan `* as Tabs`, `LocationEditor`, `type LocationView` sil (`import { nav } from '$lib/nav.svelte';`).
- 123-127 (`<Tabs.Root …>` … `</Tabs.List>`), 128'deki `<Tabs.Content value="inspections" …>` açılışı, 156-160 (`</Tabs.Content>` … `</Tabs.Root>`) sil; arada kalan içerik `<div class="space-y-3">` içinde kalsın.
- Başlıktaki `DropdownMenu.Root`'tan (satır 75) önce:

```svelte
    <Button variant="outline" onclick={() => nav.openRegister({ locationId: id })}>Riskler ({scoredRows}/{loc.rows.length} puanlı)</Button>
```

- `openLocation` çağrıları: satır 55 → `nav.openLocation(id, listId)`, 138 → `nav.openLocation(id, i.list.id)`.

- [ ] **Step 9: Diğer çağıranlar**

- `InspectionEditor.svelte:56` → `nav.openLocation(locationId)`
- `ReadinessList.svelte:25` → `const openRisks = (id: string) => go(() => nav.openRegister({ locationId: id }));`
- `OverviewPage.svelte` risk adımı `run` → `() => nav.openRegister({ level: 'unscored' })`
- `ChecklistRiskButton.svelte:34` → `action: { label: 'Git', onClick: () => nav.openRegister({ locationId: target.id }) },`
- `RowSourceSection.svelte:54` ve `SourceBadge.svelte:25` → `nav.openLocation(info.locationId ?? locationId, info.listId)`
- `state.svelte.ts:84-87`:

```ts
const open = () =>
  grown.length === 1
    ? nav.openRegister({ locationId: grown[0].id })
    : nav.openRegister({ status: "open" });
```

- `state.svelte.ts` `selectLocation` (163-165) ve `openRow` (167-169) sil.

Run: `rg -n "locationView|LocationView|'risk'\)|selectLocation|store\.openRow" src`
Expected: çıktı yok.

- [ ] **Step 10: Kapılar + elle kontrol**

Kapıları çalıştır. Elle:

1. Adres çubuğuna `#mekanlar/<var olan id>/risk` yaz → Riskler açılır, mekân süzgeci o mekân, adres `#riskler/<id>` olur.
2. Mekân sayfası: sekme yok; "Riskler (x/y puanlı)" → Riskler o mekâna süzülü; tarayıcı Geri → mekân sayfası.
3. Bir kontrol maddesindeki "Risk satırı: … #3" bağlantısı → Riskler'de o satırın yan sayfası açık.
4. Kenar çubuğundan "Riskler" → süzgeçsiz tüm satırlar.
5. Kırıntı: `Riskler › <mekân> › Risk satırları` (mekân öğesi `#mekanlar/<id>`'ye gider); eksikler görünümünde `Riskler › Riske eklenmemiş eksikler`; `Mekânlar › <mekân> › <liste>`.
6. Riskler mekâna süzülüyken başlıktaki "← <mekân> kontrol listeleri" bağlantısı mekân sayfasını açıyor.
7. Açık ve koyu temada `ui-shots.mjs after-8` görüntüleri.

- [ ] **Step 11: Commit**

```bash
git add src/lib src/App.svelte
```

```bash
git commit -q -m "refactor: locations hold checklists only; risk links open Riskler"
```

### Görev 9: Okul sayfası (Rapor'dan ayrılır)

**Files:**

- Create: `src/lib/components/SchoolPage.svelte`
- Modify: `src/lib/nav-route.ts` (`Section`, `SEGMENTS`)
- Test: `src/lib/nav-route.test.ts`
- Modify: `src/lib/nav.svelte.ts:41-42,83-86`
- Modify: `src/lib/nav-items.ts` (`SECTION_ITEMS`, `SECTION_LABELS`)
- Modify: `src/App.svelte` (bölüm dalı)
- Modify: `src/lib/components/ReportPage.svelte:8,10-11,81-89,102-130,161-162`
- Modify: `src/lib/domain/progress.ts:65` (yorum) + yeni `unansweredScope`
- Test: `src/lib/domain/progress.test.ts`
- Modify: `src/lib/components/LocationList.svelte` (başta okul geneli köprü satırı)
- Modify: çağıranlar — `OverviewPage.svelte` (okul ve kontrol listesi adımları), `ReadinessList.svelte:24,27`, `DeficiencyItem.svelte:100`, `SchoolCard.svelte:23`, `state.svelte.ts:158-161`

**Interfaces:**

- Consumes: `SchoolCard` (değişmez), `InspectionEditor`, `inspectionsForList`, `inspectionSummary`, `progress()` dönüşündeki `checklists` ve `schoolWide`.
- Produces: `Section` + `"school"` (hash `#okul`); `nav.openSchool(): void` (bölümü açar, ilk boş alanı odaklar); `export function unansweredScope(p: { checklists: { answered: number; total: number }; schoolWide: { answered: number; total: number } }): "locations" | "school" | null`. `nav.openReport` **silinir**.

**Karar 1 (A):** "Ortak" mekân ile okul geneli listeler veri olarak ayrı kalır (dosya biçimi değişmez); kullanıcı ikisine tek yerden, Okul sayfasından ulaşır. Mekânlar listesinin başındaki köprü satır, mekân arayan kullanıcıyı okul geneli listelere yönlendirir.

**Silinecekler:** `ReportPage`'deki okul ve okul geneli bölümleri, `openWideId`, `schoolWideLists`, ilgili importlar; `nav.openReport`; `store.openSchool`, `store.selectChecklist` sarmalayıcıları (çağıranı yok); "Genel bakış" adı (→ "Başla").

- [ ] **Step 1: Başarısız testi yaz**

`nav-route.test.ts` round-trip dizisine `place({ section: "school" }),` ekle; "formats" testine:

```ts
expect(formatHash(place({ section: "school" }))).toBe("#okul");
```

`progress.test.ts` importuna `unansweredScope` ekle; dosya sonuna:

```ts
describe("unansweredScope", () => {
  const counts = (answered: number, total: number, wideAnswered: number, wideTotal: number) => ({
    checklists: { answered, total },
    schoolWide: { answered: wideAnswered, total: wideTotal },
  });

  test("locations come first while any location item is open", () => {
    // Arrange: 10 items, 4 of them okul geneli; 2 location items and 1 school-wide item open
    const input = counts(7, 10, 3, 4);
    // Act
    const scope = unansweredScope(input);
    // Assert
    expect(scope).toBe("locations");
  });

  test("only okul geneli items left points to the school page", () => {
    expect(unansweredScope(counts(9, 10, 3, 4))).toBe("school");
  });

  test("nothing left is null", () => {
    expect(unansweredScope(counts(10, 10, 4, 4))).toBeNull();
  });
});
```

- [ ] **Step 2: Testlerin düştüğünü gör**

Run: `pnpm run test -- src/lib/nav-route.test.ts src/lib/domain/progress.test.ts`
Expected: FAIL — `"school"` `Section` değil (tip hatası) / `#okul` overview'e düşüyor; `unansweredScope` yok.

- [ ] **Step 3: Rotayı ve yardımcıyı ekle**

`nav-route.ts`: `export type Section = "overview" | "school" | "locations" | "deficiencies" | "register" | "report" | "library";` ve `SEGMENTS` içine `school: "okul",`.

`progress.ts:65` yorumunu `// School-wide inspections (lists without locations) are answered on the Okul page.` yap; dosya sonuna:

```ts
/** Where unanswered checklist items are left: locations first, then okul geneli; null when none. */
export function unansweredScope(p: {
  checklists: { answered: number; total: number };
  schoolWide: { answered: number; total: number };
}): "locations" | "school" | null {
  const open = p.checklists.total - p.checklists.answered;
  const wideOpen = p.schoolWide.total - p.schoolWide.answered;
  if (open - wideOpen > 0) return "locations";
  return wideOpen > 0 ? "school" : null;
}
```

(`checklists` sayıları her listenin tüm denetimlerini, okul geneli dahil, sayar — `progress.ts:38`; bu yüzden fark yalnız mekân maddeleridir.)

- [ ] **Step 4: Testlerin geçtiğini gör**

Run: `pnpm run test -- src/lib/nav-route.test.ts src/lib/domain/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: `SchoolPage.svelte` oluştur (içerik `ReportPage`'den taşınır)**

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import InspectionEditor from './InspectionEditor.svelte';
  import PageHeader from './PageHeader.svelte';
  import SchoolCard from './SchoolCard.svelte';
  import { SECTION_TITLE } from './shared-classes';
  import { inspectionSummary, inspectionsForList } from '$lib/domain/inspections';
  import { store } from '$lib/state.svelte';

  const a = $derived(store.assessment);
  /** School-wide list whose inspection is open for answering. */
  let openWideId = $state<string | null>(null);
  const schoolWideLists = $derived(
    a.checklists.flatMap((list) =>
      inspectionsForList(a, list.id)
        .filter((i) => i.locationId === null)
        .map((i) => ({ list, ...inspectionSummary(a, i) })),
    ),
  );
</script>

<div class="flex max-w-3xl flex-col gap-6">
  <PageHeader title="Okul" />
  <SchoolCard />
  <section class="flex flex-col gap-3" aria-labelledby="school-wide">
    <h2 id="school-wide" class={SECTION_TITLE}>Okul geneli kontrol listeleri</h2>
    {#if schoolWideLists.length}
      <ul class="flex flex-col gap-1 text-sm">
        {#each schoolWideLists as item (item.list.id)}
          <li>
            <Button variant="link" class="h-auto p-0 text-left whitespace-normal" aria-expanded={openWideId === item.list.id} onclick={() => (openWideId = openWideId === item.list.id ? null : item.list.id)}>
              {item.list.code} {item.list.name}
            </Button>
            <span class="text-muted-foreground">: {item.answered}/{item.total} madde yanıtlandı{item.no ? `, ${item.no} eksik` : ''}</span>
            {#if openWideId === item.list.id}
              <div class="mt-3 rounded-lg border p-3"><InspectionEditor listId={item.list.id} locationId={null} /></div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-muted-foreground">Okul genelinde denetlenen liste yok.</p>
    {/if}
  </section>
</div>
```

- [ ] **Step 6: `ReportPage`'den taşınanları sil**

`ReportPage.svelte`: satır 8 (`InspectionEditor`), 10 (`SchoolCard`), 11 (`inspections` importu), 81-89 (`openWideId`, `schoolWideLists`), 102-130 (`schoolBody`, `schoolWideBody` snippet'leri), 161-162 (iki `{@render section(…)}`) sil.

- [ ] **Step 7: Gezinme**

`nav.svelte.ts`: 41-42 yorumunu `/** Incremented to ask the school page to focus its first empty field. */` yap; `openReport` (83-86) yerine:

```ts
  openSchool() {
    this.go("school");
    this.schoolRequest += 1;
  }
```

`nav-items.ts`: `import School from "@lucide/svelte/icons/school";` ekle;

```ts
export const SECTION_ITEMS: readonly SectionItem[] = [
  { section: "overview", label: "Başla", icon: House },
  { section: "school", label: "Okul", icon: School },
  { section: "locations", label: "Mekânlar", icon: MapPin },
  { section: "register", label: "Riskler", icon: Table2 },
  { section: "report", label: "Rapor", icon: FileText },
];

export const SECTION_LABELS: Readonly<Record<Section, string>> = {
  overview: "Başla",
  school: "Okul",
  locations: "Mekânlar",
  deficiencies: "Riske eklenmemiş eksikler",
  register: "Riskler",
  report: "Rapor",
  library: "Kütüphane",
};
```

Dosya başı yorumu `// The five primary sections (Başla, Okul, Mekânlar, Riskler, Rapor), shared by the sidebar and the phone bottom bar, plus their badges.` yap.

`App.svelte`: `import SchoolPage from '$lib/components/SchoolPage.svelte';` ekle; `{#if nav.section === 'overview'} <OverviewPage />` dalından sonra:

```svelte
      {:else if nav.section === 'school'}
        <SchoolPage />
```

- [ ] **Step 8: Çağıranlar**

- `OverviewPage.svelte`: `<h1>` → `Başla`; okul adımı `run: () => nav.openSchool(),`; kontrol listesi adımı (2.) `run: () => (unansweredScope(p) === 'school' ? nav.openSchool() : nav.go('locations')),` (`unansweredScope` importu `progress` importuna).
- `ReadinessList.svelte:24` → `const openSchool = () => go(() => nav.openSchool());`; `:27` →

```ts
// Gap ids of checklist entries are template ids; send the user where the open items are.
const openUnanswered = () =>
  go(() =>
    unansweredScope(progress(store.assessment, new Date())) === "school"
      ? nav.openSchool()
      : nav.go("locations"),
  );
```

(`import { progress, unansweredScope } from '$lib/domain/progress';`)

- `LocationList.svelte`: başlık satırından sonra, mekân listesinden önce, okul geneli listeler varsa sabit köprü satırı:

```svelte
  {#if schoolWide.total}
    <button type="button" class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center gap-3 rounded-md border p-3 text-left" onclick={() => nav.openSchool()}>
      <School class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span class="min-w-0 flex-1 font-medium">Okul geneli kontrol listeleri</span>
      <span class="text-sm text-muted-foreground">{schoolWide.answered}/{schoolWide.total} cevaplı · Okul</span>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  {/if}
```

Betiğe (`INTERACTIVE_ROW` importu Görev 5'ten var): `import School from '@lucide/svelte/icons/school';`, `import ChevronRight from '@lucide/svelte/icons/chevron-right';`, `import { progress } from '$lib/domain/progress';` ve `const schoolWide = $derived(progress(store.assessment, today).schoolWide);`.

- `DeficiencyItem.svelte:100` → `d.locationId ? nav.openLocation(d.locationId, d.listId) : nav.openSchool()`
- `SchoolCard.svelte:23` yorumu `// Opened from elsewhere (Başla, readiness list): focus the first empty field once the page has rendered.`
- `state.svelte.ts`: "Thin wrappers" yorumu + `openSchool` (158-161) ve `selectChecklist` sil.

Run: `rg -n "openReport|store\.openSchool|selectChecklist|Genel bakış" src`
Expected: çıktı yok.

- [ ] **Step 9: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: kenar çubuğu Başla / Okul / Mekânlar / Riskler / Rapor; Okul sayfasında okul bilgileri, imzacılar ve okul geneli listeler (bir listeyi açıp cevap ver); Başla'da 1. adım → Okul, ilk boş alan odaklı; Rapor'da okul bölümleri yok; `#okul` adresi Okul'u açıyor; telefon alt çubuğu 5 sekme. Mekânlar'ın başında "Okul geneli kontrol listeleri → Okul" satırı Okul'u açıyor. Yalnız okul geneli madde boş kalmışken Başla 2. adım ve Rapor'daki "Cevaplanmamış kontrol listesi maddeleri" Okul'a götürüyor; mekân maddesi boşken Mekânlar'a. Açık ve koyu temada `ui-shots.mjs after-9`.

- [ ] **Step 10: Commit**

```bash
git add src/lib src/App.svelte
```

```bash
git commit -q -m "feat: Okul section split out of the report page"
```

### Görev 10: İnce Rapor ve tek Dosya menüsü

**Files:**

- Modify: `src/lib/components/ReportPage.svelte` (betik silmeleri + işaretleme)
- Modify: `src/lib/components/ReadinessList.svelte` (tamamı)
- Modify: `src/lib/components/AppTopbar.svelte:12,109`
- Modify: `src/App.svelte` (`ReportPage` çağrısı)

**Interfaces:**

- Consumes: `ExportMenu` (Görev 2'den sonra konumsuz), `ReadinessList` `{ gaps, onpick? }`.
- Produces: `ReportPage` prop almaz.

**Silinecekler:** `ReportPage` — `section` snippet'i ve `Snippet` importu, "Denetimler özeti" ve "Risk tablosu özeti" bölümleri (`inspectionsBody`, `riskBody`, `progress` importu, `p`), `nav` importu, `OTHER_OUTPUTS` ve altı düğme, "Önceki dönemler" düğmesi, "Yeni dönem başlat" kartı (imzalı dönemde tek bir bağlantı olarak kalır), `onPeriods` prop'u; `AppTopbar`'dan `ExportMenu`; `ReadinessList`'teki altı yinelenen `<section>` bloğu.

- [ ] **Step 1: `ReportPage` betiğini sadeleştir**

Sil: satır 3 (`Snippet`), 23-29 (`OTHER_OUTPUTS`), 31 (`let { onPeriods } …`), 14 (`progress` importu), 18 (`nav` importu), 21'deki `type ExportKind` (`import { store } from '$lib/state.svelte';` kalır), `const p = $derived(progress(…))`, `section`/`inspectionsBody`/`riskBody` snippet'leri. Ekle: `import ExportMenu from './ExportMenu.svelte';`, `import PageHeader from './PageHeader.svelte';`, `import { SECTION_TITLE } from './shared-classes';`. Doğrulama (`verification`) ve son düzenleyen (`lastEditor`) efektleri **aynen kalır**.

- [ ] **Step 2: `ReportPage` işaretlemesi**

`{#snippet gapsBody()}` bloğu ve sonrasındaki tüm işaretleme yerine:

```svelte
<div class="flex max-w-3xl flex-col gap-6 p-4">
  <PageHeader title="Rapor" />

  <section class="flex flex-col gap-3" aria-labelledby="report-gaps">
    <h2 id="report-gaps" class={SECTION_TITLE}>İmza öncesi açık noktalar</h2>
    {#if gaps.hasGaps}
      <ReadinessList {gaps} />
    {:else}
      <p class="flex items-center gap-2 text-sm font-medium"><CircleCheck class="size-4" aria-hidden="true" />Açık nokta yok, PDF imzaya hazır.</p>
    {/if}
  </section>

  <Card.Root>
    <Card.Header>
      <Card.Title>Dönem</Card.Title>
      <Card.Description>{a.period.trim() || 'Dönem girilmedi'} · Revizyon {a.meta.revision}</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col items-start gap-3">
      <!-- the <dl>, verification badges and the close / revise buttons of the old lines 173-213 stay exactly as they are -->
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header><Card.Title>Çıktılar</Card.Title></Card.Header>
    <Card.Content><ExportMenu /></Card.Content>
  </Card.Root>
</div>
```

`Dönem` kartının içine eski 173-213 satırları (dl, rozetler, `{#if locked}` … `{/if}`) **taşınır, değiştirilmez**; yalnız eski 214 (`Önceki dönemler`) dışarıda kalır ve eski düğme sarmalayıcı `<div class="flex flex-wrap gap-2">` korunur. Yukarıdaki HTML yorumunu yerine koyduğun içerikle değiştir (yorum dosyada kalmasın).

İmzalı dönemde sıradaki doğal iş yeni dönemdir; Dosya menüsündeki aynı eylem burada bir bağlantı olarak kalır. Taşınan `{#if locked}` dalındaki "Düzeltme taslağı aç" düğmesinin hemen ardına:

```svelte
          <Button variant="link" class="h-auto p-0" disabled={busy} onclick={() => store.newPeriod()}>Yeni dönem başlat</Button>
```

(`store.newPeriod()` Dosya → "Yeni dönem (bu çalışmadan)" ile aynı akış: kaydedilmemiş iş varsa aynı onay diyaloğu.)

- [ ] **Step 3: `ReadinessList` gruplu ve katlanır**

Dosyanın tamamı (Görev 8 ve 7'deki `openRisks`/`openSchool` değişiklikleri dahil):

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { countUntransferred } from '$lib/domain/transfer';
  import type { GapEntry, MetaField, Readiness } from '$lib/domain/readiness';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const META_LABELS: Record<MetaField, string> = {
    school: 'Okul adı',
    period: 'Dönem',
    assessmentDate: 'Değerlendirme tarihi',
    validUntil: 'Geçerlilik tarihi',
  };

  /** `onpick` runs after any jump or transfer, so the dialog can close itself. */
  let { gaps, onpick = () => {} }: { gaps: Readiness; onpick?: () => void } = $props();

  const untransferred = $derived(countUntransferred(store.assessment));
  const total = (list: GapEntry[]) => list.reduce((n, g) => n + g.count, 0);

  function go(select: () => void) {
    select();
    onpick();
  }
  const openSchool = () => go(() => nav.openSchool());
  const openRisks = (id: string) => go(() => nav.openRegister({ locationId: id }));
  // Gap ids of checklist entries are template ids; the answers live in the locations.
  const openUnanswered = () => go(() => nav.go('locations'));
  const openUntransferred = (listId: string) => go(() => nav.openDeficiencies({ listId, state: 'untransferred' }));
</script>

{#snippet entries(list: GapEntry[], suffix: string, select: (id: string) => void)}
  <ul class="flex flex-col items-start gap-0.5 pt-1 pl-4">
    {#each list as g (g.id)}
      <li>
        <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => select(g.id)}>{g.name || 'Adsız'}</Button>
        <span class="text-muted-foreground">: {g.count} {suffix}{g.detail ? ` (${g.detail})` : ''}</span>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet group(title: string, list: GapEntry[], suffix: string, select: (id: string) => void)}
  {#if list.length}
    <details>
      <summary class="flex min-h-9 cursor-pointer items-center gap-1 font-semibold">{title}<span class="font-normal text-muted-foreground">({total(list)})</span></summary>
      {@render entries(list, suffix, select)}
    </details>
  {/if}
{/snippet}

<div class="flex flex-col gap-2 text-sm">
  {#if gaps.missingMeta.length || gaps.invalidDates || gaps.emptySignatories}
    <section>
      <h3 class="font-semibold">Okul bilgileri</h3>
      <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={openSchool}>
        {[
          gaps.missingMeta.length ? `Boş: ${gaps.missingMeta.map((m) => META_LABELS[m]).join(', ')}` : '',
          gaps.invalidDates ? 'Geçerlilik tarihi değerlendirme tarihinden önce' : '',
          gaps.emptySignatories ? `${gaps.emptySignatories} imzacının adı boş` : '',
        ].filter(Boolean).join(' · ')}
      </Button>
    </section>
  {/if}
  {@render group('Olasılık ya da şiddet puanı boş satırlar', gaps.unscored, 'satır', openRisks)}
  {@render group('Yüksek/tolere edilemez riskte önlem ya da sorumlu boş', gaps.missingAction, 'satır', openRisks)}
  {@render group('Tehlike ve risk alanı boş satırlar', gaps.emptyHazard, 'satır', openRisks)}
  {@render group('Tamamlandı ama önlem sonrası puanı yok', gaps.doneWithoutAfter, 'satır', openRisks)}
  {#if gaps.noWithoutRow.length}
    <details>
      <summary class="flex min-h-9 cursor-pointer items-center gap-1 font-semibold">Risk tablosuna aktarılmamış eksikler<span class="font-normal text-muted-foreground">({total(gaps.noWithoutRow)})</span></summary>
      {@render entries(gaps.noWithoutRow, 'eksik', openUntransferred)}
      <Button variant="outline" size="sm" class="mt-1" disabled={untransferred === 0} onclick={() => go(() => store.transferMissing())}>Tüm eksikleri aktar ({untransferred})</Button>
    </details>
  {/if}
  {@render group('Eksiği giderilmiş (Evet olmuş) ama açık satırlar', gaps.sourceNowYes, 'satır', openRisks)}
  {@render group('Cevaplanmamış kontrol listesi maddeleri', gaps.unanswered, 'madde', openUnanswered)}
</div>
```

- [ ] **Step 4: Üst çubuk ve App**

`AppTopbar.svelte`: satır 12 (`import ExportMenu …`) ve 109 (`<ExportMenu />`) sil. (Dosya menüsü zaten yeni / yeni dönem / dönemler / aç / şablonlar içerir; değişmez.)
`App.svelte`: `<ReportPage onPeriods={() => (periodsOpen = true)} />` → `<ReportPage />`.

- [ ] **Step 5: Kapılar + elle kontrol**

Kapıları çalıştır. Elle (okul verisiyle yeni çalışma):

1. Rapor: üç blok (açık noktalar, dönem, çıktılar); açık noktalar katlanmış başlıklar + toplam sayılar; bir başlığı aç → mekân bağlantısı Riskler'i süzülü açar.
2. Çıktılar: "PDF indir" + açılır menüde .json / Excel / Word / boş form / yalnız listeler.
3. Üst çubuk: yalnız kayıt durumu, Kaydet, Dosya; Dosya → Dönemler… ve Yeni dönem çalışıyor.
4. Masaüstü (`pnpm run tauri dev` varsa): Rapor'da "Son düzenleyen" satırı hâlâ görünüyor.
5. `requestFullPdf` açık noktalı durumda ReadinessDialog'u açıyor ve içindeki katlanır liste çalışıyor.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/ReportPage.svelte src/lib/components/ReadinessList.svelte src/lib/components/AppTopbar.svelte src/App.svelte
```

```bash
git commit -q -m "refactor: slim report page and a single file menu for exports and periods"
```

---

# FAZ 3 — İş akışı

**Boyut:** M (4 görev). **Kırılabilecekler:** `common-items.test.ts` (bir test silinir), `transfer-inspection.test.ts` (dosya silinir), `checklist-risk.test.ts` (genişler). Ekranlar: kontrol listesi satırları, Riskler › eksikler, Rapor açık noktaları, mekân sayfası, Okul sayfası, Kütüphane diyaloğu. **Geri alma:** görev başına commit; `git revert`. Toplu aktarım kaldırıldığı için geri almak isteyen yalnız Görev 11'i geri alır.

### Görev 11: Eksik → risk tek eylem, tek bileşen

**Files:**

- Modify: `src/lib/components/ChecklistRiskButton.svelte` (tamamı)
- Modify: `src/lib/components/ChecklistExistingRowButton.svelte:35,42`
- Modify: `src/lib/components/DeficiencyItem.svelte` (tamamı)
- Modify: `src/lib/components/InspectionEditor.svelte:17,35,45-51,81-87`
- Modify: `src/lib/components/DeficienciesPage.svelte:49-63` (`transferShown`)
- Delete: `src/lib/domain/transfer-inspection.ts`, `src/lib/domain/transfer-inspection.test.ts`
- Modify: `src/lib/domain/common-items.test.ts:14,158-168`
- Modify: `src/lib/components/ReadinessList.svelte` (eksik grubu)
- Modify: `src/lib/state.svelte.ts:19,70-101`

**Interfaces:**

- Consumes: `ChecklistItemLinks` `{ list: Checklist; item: ChecklistItem; locationId: string | null }`, `hasChecklistRisk`, `riskRowFromChecklistItem`.
- Produces: tek tekil eylem "Riske ekle" (`ChecklistRiskButton`) + "Var olan riske bağla" (`ChecklistExistingRowButton`), hem kontrol listesinde hem eksikler görünümünde aynı bileşen. Tek toplu eylem: Riskler › eksikler "Görünenleri riske ekle" (karar 5: kalır, `hasChecklistRisk` ile yineleneni atlar); liste başlığı oraya süzülmüş bir bağlantı verir.

**Silinecekler:** `DeficiencyItem` içindeki iki popover kopyası ve `create`/`link` (≈45 satır); `InspectionEditor` "Eksikleri risk tablosuna aktar" düğmesi + `transfer()` + `pending`; `transfer-inspection.ts` ve testi; `common-items.test.ts` "single-inspection transfer" testi; `ReadinessList` "Tüm eksikleri aktar" düğmesi, `countUntransferred`/`store` importları; `store.transferMissing` ve `transferMissing` importu.

- [ ] **Step 1: `ChecklistRiskButton` — mekânı belli denetimde tek tık**

Dosyanın tamamı:

```svelte
<script lang="ts">
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import SelectField from './SelectField.svelte';
  import { defaultLocationId, hasChecklistRisk, riskRowFromChecklistItem } from '$lib/domain/checklist-risk';
  import type { Checklist } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  /** locationId = the inspection's scope (null = okul geneli, the row's location is then chosen). */
  let { list, itemId, locationId: scope }: { list: Checklist; itemId: string; locationId: string | null } = $props();

  let open = $state(false);
  let locationId = $state('');
  const options = $derived(store.assessment.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' })));

  function onOpenChange(next: boolean) {
    open = next;
    if (next) locationId = defaultLocationId(store.assessment, list);
  }

  function create(targetId: string) {
    const target = store.assessment.locations.find((l) => l.id === targetId);
    if (!target) return;
    open = false;
    if (hasChecklistRisk(store.assessment, list.id, itemId, scope, target.id)) {
      toast.info('Bu madde için satır zaten var');
      return;
    }
    // Undoable like every other bulk-ish edit: the toast carries "Geri al" (store-core.svelte.ts:199-226).
    store.applyWithUndo((a) => riskRowFromChecklistItem(a, list.id, itemId, scope, target.id), `Riske eklendi: ${target.name}`);
  }
</script>

{#if scope}
  <Button variant="outline" size="sm" onclick={() => create(scope ?? '')}><ShieldAlert />Riske ekle</Button>
{:else}
  <Popover.Root {open} {onOpenChange}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline" size="sm"><ShieldAlert />Riske ekle</Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-72 space-y-3">
      {#if options.length}
        <SelectField label="Hedef mekân" {options} value={locationId} onValueChange={(v) => (locationId = v)} />
        <Button size="sm" onclick={() => create(locationId)}>Satır ekle</Button>
      {:else}
        <p class="text-sm text-muted-foreground">Önce bir mekân ekleyin.</p>
      {/if}
    </Popover.Content>
  </Popover.Root>
{/if}
```

(Eski davranışta mekânı belli denetimde de hedef seçimi gösteriliyordu ama `riskRowFromChecklistItem` `locationId ?? rowLocationId` kuralıyla seçimi yok sayıyordu — gereksiz bir tık siliniyor. `store.applyWithUndo` var ve `void` döner; toast'ta "Geri al" eylemi gelir. Eski "Git" eylemi yerine yeni satırın bağlantısı "Risk satırı: … #n" olarak maddenin altında hemen belirir.)

`ChecklistExistingRowButton.svelte`: satır 42 düğme metni `Var olan riske bağla`; satır 35 `toast.success('Eksik var olan riske bağlandı');`.

- [ ] **Step 2: `DeficiencyItem` aynı bileşeni kullanır**

Dosyanın tamamı:

```svelte
<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import ChecklistItemLinks from './ChecklistItemLinks.svelte';
  import type { Deficiency } from '$lib/domain/inspections';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  let { d }: { d: Deficiency } = $props();

  const list = $derived(store.assessment.checklists.find((c) => c.id === d.listId));
  const item = $derived(list?.items.find((i) => i.id === d.itemId));
  const refs = $derived([d.ref, ...(d.siblings ?? []).map((s) => s.ref)].filter(Boolean));
</script>

<article class="space-y-2 rounded-lg border bg-background p-3">
  <div class="flex flex-wrap items-start gap-2">
    <p class="min-w-0 flex-1 text-sm font-semibold"><span class="text-muted-foreground">{d.itemNo}.</span> {d.text}</p>
    {#if refs.length}<Badge variant="outline">{refs.join(' · ')}</Badge>{/if}
  </div>
  <p class="text-xs text-muted-foreground">{d.listCode ? `${d.listCode} · ` : ''}{d.listName}</p>
  {#if d.note}<p class="text-sm">{d.note}</p>{/if}
  <div class="flex flex-wrap items-center gap-2">
    {#if list && item}<ChecklistItemLinks {list} {item} locationId={d.locationId} />{/if}
    <Button variant="ghost" size="sm" onclick={() => (d.locationId ? nav.openLocation(d.locationId, d.listId) : nav.openSchool())}><ExternalLink />Listede aç</Button>
  </div>
</article>
```

- [ ] **Step 3: `InspectionEditor` toplu düğmesi → toplu eklemeye yönlendiren bağlantı**

Satır 17 (`transfer-inspection` importu), 35 (`pending`), 45-51 (`transfer()`) sil; 81-87 bloğunda `Button` satırını (86) aşağıdakiyle değiştir. Toplu ekleme tek yerde (Riskler › eksikler) kalır; liste başlığı oraya, bu liste ve mekâna süzülmüş olarak götürür:

```svelte
      {#if pendingCount}
        <Button variant="link" size="sm" class="h-auto p-0" onclick={() => nav.openDeficiencies({ locationId: locationId ?? SCHOOL_WIDE_FILTER, listId, state: 'untransferred' })}>
          {pendingCount} eksik riske eklenmedi — topluca ekle
        </Button>
      {/if}
```

Betiğe:

```ts
import { SCHOOL_WIDE_FILTER } from "$lib/domain/filters";
import { pending } from "$lib/domain/transfer";
// Deficiencies of this inspection with no risk row yet (common items counted once, like the bulk add).
const pendingCount = $derived(inspection ? pending(store.assessment, inspection).length : 0);
```

Satır 18'deki `Answer` importu ve diğerleri kullanılmaya devam eder.

- [ ] **Step 3b: Toplu ekleme yinelenen satır açmaz**

`DeficienciesPage.svelte` `transferShown()` (49-63) — `hasChecklistRisk` ile zaten satırı olan maddeyi atlar (aynı koşuda önce eklenen ortak madde kardeşi ya da eski bağlantısız satır):

```ts
function transferShown() {
  const targets = pending.flatMap((d) => {
    const list = a.checklists.find((c) => c.id === d.listId);
    const target = d.locationId ?? (list ? defaultLocationId(a, list) : "");
    return target ? [{ d, target }] : [];
  });
  if (!targets.length) {
    toast.info("Risk satırı açılacak mekân yok; önce bir mekân ekleyin.");
    return;
  }
  const next = targets.reduce(
    (acc, { d, target }) =>
      hasChecklistRisk(acc, d.listId, d.itemId, d.locationId, target)
        ? acc
        : riskRowFromChecklistItem(acc, d.listId, d.itemId, d.locationId, target),
    a,
  );
  const rowCount = (x: typeof a) => x.locations.reduce((n, l) => n + l.rows.length, 0);
  const created = rowCount(next) - rowCount(a);
  if (!created) {
    toast.info("Görünen eksiklerin hepsinin risk satırı zaten var.");
    return;
  }
  store.applyWithUndo(
    () => next,
    `${created} risk satırı oluşturuldu; puanlamak için Riskler'e geçin.`,
  );
}
```

Importa `hasChecklistRisk` ekle (`$lib/domain/checklist-risk`).

- [ ] **Step 4: `transfer-inspection` dosyalarını ve testini sil**

```bash
git rm -q src/lib/domain/transfer-inspection.ts src/lib/domain/transfer-inspection.test.ts
```

`common-items.test.ts`: satır 14 (`import { countUntransferredInspection, transferInspection } …`) ve 158-168 (`test("single-inspection transfer marks the siblings transferred", …)`) sil. Aynı davranış 141-156'daki `transferMissing` testleriyle kapsanıyor. `rowsForItem`/`isUntransferred` importları başka testte kullanılmıyorsa lint'e göre kaldır.

- [ ] **Step 5: Rapor'daki toplu aktarımı ve store yöntemini sil**

`ReadinessList.svelte`: `countUntransferred` ve `store` importlarını, `untransferred` sabitini sil; `{#if gaps.noWithoutRow.length} … {/if}` bloğunu tek satırla değiştir:

```svelte
  {@render group('Riske eklenmemiş eksikler', gaps.noWithoutRow, 'eksik', openUntransferred)}
```

`onpick` yorumunu `/** `onpick` runs after any jump, so the dialog can close itself. */` yap.

`state.svelte.ts`: satır 19 (`import { transferMissing } …`) ve 70-101 (`transferMissing` yöntemi) sil.

Run: `rg -n "transferInspection|countUntransferredInspection|store\.transferMissing|Riske çevir|Eksikleri risk tablosuna aktar" src`
Expected: çıktı yok.

- [ ] **Step 6: Kapılar + elle kontrol**

Kapıları çalıştır. Elle:

1. Mekândaki bir listede maddeye "Hayır" → satır altında "Riske ekle" + "Var olan riske bağla"; "Riske ekle" tek tıkla satır açar, toast'ta "Geri al" satırı geri alır, madde altında "Risk satırı: … #n" bağlantısı belirir.
2. Okul geneli bir listede "Hayır" → "Riske ekle" hedef mekân sorar.
3. Riskler › Riske eklenmemiş eksikler: her eksikte aynı iki düğme; "Görünenleri riske ekle" çalışıyor ve ikinci kez basınca yeni satır açmıyor (yinelenen satır yok).
4. Liste başlığında "N eksik riske eklenmedi — topluca ekle" bağlantısı eksikler görünümünü bu liste ve mekâna süzülmüş açıyor; Rapor açık noktalarında toplu düğme yok.

- [ ] **Step 7: Commit**

```bash
git add -A src/lib
```

```bash
git commit -q -m "refactor: one deficiency-to-risk action shared by checklists and Riskler"
```

### Görev 12: Riske eklerken benzer satır öner (yinelenen satırları önle)

**Files:**

- Modify: `src/lib/domain/checklist-risk.ts` (sona ekleme)
- Test: `src/lib/domain/checklist-risk.test.ts` (sona ekleme)
- Modify: `src/lib/components/ChecklistRiskButton.svelte`

**Interfaces:**

- Consumes: `findSimilar(text, candidates, threshold?, limit?)` (`similarity.ts`, değişmez), `hazardOf(list, item)`, `addRowSource(a, locationId, rowId, source)` (`links.ts`).
- Produces: `export const ROW_SIMILAR_THRESHOLD = 0.45;`, `export interface SimilarRow { rowId: string; number: number; text: string; score: number }` ve `export function similarRows(a: Assessment, listId: string, itemId: string, rowLocationId: string): SimilarRow[]` — hedef mekânın, bu maddeye henüz bağlı olmayan satırlarından tehlike metni benzer olanlar (skor ≥ 0.45, en çok 5, en iyi önce). Mekân yoksa `[]`.

**Karar 6:** eşik 0.45 (madde önerisinin 0.35'inden sıkı: risk satırında yanlış "benzer" ipucu, yanlış bağlamaya götürür). Sabit ve testli; ilk gerçek okul dosyasıyla ölçülüp gerekirse yalnız bu sabit ayarlanır (ölçüm: hazır satırlı 3 mekânda "Hayır" → öneri isabeti elle sayılır).

**Silinecekler:** yok (öneri, var olan bağlama işlevini kullanır).

- [ ] **Step 1: Başarısız testi yaz**

`checklist-risk.test.ts` importuna `similarRows`, `ROW_SIMILAR_THRESHOLD` ekle (`./checklist-risk`); `addLocation`, `addRow`, `emptyAssessment` ve `addChecklist` importları yoksa ekle (`./assessment`, `./checklist`). Dosya sonuna:

```ts
describe("similarRows", () => {
  function sample() {
    let a = emptyAssessment("2026-2027");
    a = addLocation(a, { id: "l1", name: "ELE9" });
    a = addChecklist(a, {
      code: "KL-27",
      name: "Ekranlı araçlar",
      source: "external",
      items: [{ no: "1", text: "Ekranlar ayarlanabilir, yansımasız; mesafe 50-80 cm" }],
    });
    const list = a.checklists[0];
    a = addRow(a, "l1", { id: "r1", hazard: "Yangın tüpü eksik" });
    a = addRow(a, "l1", { id: "r2", hazard: "Ekranlar ayarlanabilir ve yansımasız olmalı" });
    // 2 of 5 meaningful words shared = 0.40: similar enough for the old 0.35, not for rows.
    a = addRow(a, "l1", { id: "r3", hazard: "Ekranlar ayarlanabilir olmalı" });
    return { a, listId: list.id, itemId: list.items[0].id };
  }

  test("suggests rows of the target location whose hazard is similar", () => {
    // Arrange
    const { a, listId, itemId } = sample();
    // Act
    const hits = similarRows(a, listId, itemId, "l1");
    // Assert
    expect(hits.map((h) => [h.rowId, h.number])).toEqual([["r2", 2]]);
  });

  test("a borderline row below the row threshold is not suggested", () => {
    const { a, listId, itemId } = sample();
    expect(ROW_SIMILAR_THRESHOLD).toBe(0.45);
    expect(similarRows(a, listId, itemId, "l1").some((h) => h.rowId === "r3")).toBe(false);
  });

  test("skips rows already linked to the item", () => {
    const { a, listId, itemId } = sample();
    const linked = addRowSource(a, "l1", "r2", { listId, itemId, locationId: "l1" });
    expect(similarRows(linked, listId, itemId, "l1")).toEqual([]);
  });

  test("an unknown location has no suggestions", () => {
    const { a, listId, itemId } = sample();
    expect(similarRows(a, listId, itemId, "yok")).toEqual([]);
  });
});
```

`addRowSource` importunu `./links`'ten ekle.

- [ ] **Step 2: Testin düştüğünü gör**

Run: `pnpm run test -- src/lib/domain/checklist-risk.test.ts`
Expected: FAIL — `similarRows` export edilmemiş.

- [ ] **Step 3: Uygula**

`checklist-risk.ts` importlarına `import { findSimilar } from "./similarity";` ekle; dosya sonuna:

```ts
/** Stricter than the item-proposal threshold (0.35): a wrong "similar row" hint leads to a wrong link. Measure on a real school file. */
export const ROW_SIMILAR_THRESHOLD = 0.45;

export interface SimilarRow {
  rowId: string;
  /** 1-based row number inside its location. */
  number: number;
  text: string;
  score: number;
}

/** Rows of the target location not yet linked to the item whose hazard reads like the item: link instead of duplicating. */
export function similarRows(
  a: Assessment,
  listId: string,
  itemId: string,
  rowLocationId: string,
): SimilarRow[] {
  const loc = a.locations.find((l) => l.id === rowLocationId);
  if (!loc) return [];
  const { list, item } = find(a, listId, itemId);
  const isLinked = (r: RiskRow) =>
    !!r.sources?.some((s) => s.listId === listId && s.itemId === itemId);
  const candidates = loc.rows.flatMap((r) =>
    isLinked(r) || !r.hazard.trim() ? [] : [{ key: r.id, text: r.hazard }],
  );
  return findSimilar(hazardOf(list, item), candidates, ROW_SIMILAR_THRESHOLD).map((h) => ({
    rowId: h.key,
    number: loc.rows.findIndex((r) => r.id === h.key) + 1,
    text: h.text,
    score: h.score,
  }));
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `pnpm run test -- src/lib/domain/checklist-risk.test.ts`
Expected: PASS. (r2: 3/5 = 0,60 ≥ 0,45; r3: 2/5 = 0,40 < 0,45; r1: 0.)

- [ ] **Step 5: `ChecklistRiskButton`'a öneriyi ekle**

Görev 11'deki dosyada:

- Importlar: `import Link from '@lucide/svelte/icons/link';`, `similarRows` (`checklist-risk` importuna), `import { addRowSource } from '$lib/domain/links';`.
- `options` satırından sonra:

```ts
const target = $derived(scope ?? locationId);
const similar = $derived(target ? similarRows(store.assessment, list.id, itemId, target) : []);

function link(rowId: string) {
  open = false;
  store.applyWithUndo(
    (a) => addRowSource(a, target, rowId, { listId: list.id, itemId, locationId: scope }),
    "Eksik var olan riske bağlandı",
  );
}
```

- `onOpenChange` içinde: `if (next) locationId = scope ?? defaultLocationId(store.assessment, list);`

- Öneri düğmenin davranışını değiştirmez (mekânı belli denetimde "Riske ekle" tek tık kalır); satır içinde en iyi eşleşme için tek satırlık bir ipucu gösterilir. İşaretlemenin en sonuna (`{/if}` kapanışından sonra):

```svelte
{#if similar[0]}
  {@const s = similar[0]}
  <p class="flex w-full min-w-0 items-center gap-1 text-xs text-muted-foreground">
    <span class="truncate">Benzer: #{s.number} {s.text}</span>
    <span aria-hidden="true">·</span>
    <Button variant="link" size="sm" class="h-auto shrink-0 p-0 text-xs" aria-label="Benzer satır #{s.number} ile bağla" onclick={() => link(s.rowId)}><Link class="size-3" />Bağla</Button>
  </p>
{/if}
```

- Okul geneli (hedef mekân seçilen) popover'da da aynı ipucu, `SelectField`'in altında görünür (aynı `{#if similar[0]}` bloğunu `Popover.Content` içinde "Satır ekle" düğmesinin üstüne koy).

- [ ] **Step 6: Kapılar + elle kontrol**

Kapıları çalıştır. Elle (okul verisiyle; hazır satırlı bir mekân, ör. kütüphaneden eklenen bir atölye): o mekânın bir listesinde hazır satıra çok benzeyen bir maddeye "Hayır" → maddenin altında "Benzer: #n … · Bağla" ipucu; "Bağla" → madde satıra bağlanır, yeni satır açılmaz, Riskler'de satır sayısı değişmez; "Riske ekle" yine tek tıkla yeni satır açar. Benzeri olmayan maddede ipucu yok. Açık ve koyu temada ipucu okunur.

- [ ] **Step 7: Commit**

```bash
git add src/lib/domain/checklist-risk.ts src/lib/domain/checklist-risk.test.ts src/lib/components/ChecklistRiskButton.svelte
```

```bash
git commit -q -m "feat: suggest a similar existing row before adding a risk"
```

### Görev 13: Mekân ve Okul sayfasında kontrol listeleri akordeon

**Files:**

- Modify: `src/lib/components/LocationDetail.svelte` (kontrol listeleri bölümü)
- Modify: `src/lib/components/SchoolPage.svelte` (liste bölümü)
- Modify: `src/lib/components/InspectionEditor.svelte:62-66` (başlık satırı)
- Modify: `src/lib/components/AppTopbar.svelte` (kırıntı yorumu değişmez; davranış aynı)

**Interfaces:**

- Consumes: `Collapsible` (`$lib/components/ui/collapsible`), `nav.openLocation(id, listId)`, `nav.place.listId`.
- Produces: açık liste = `nav.place.listId` (tek açık öğe, adres paylaşılabilir: `#mekanlar/<id>/denetim/<liste>`).

**Silinecekler:** `LocationDetail`'deki "liste görünümü / tek liste görünümü" `{#if openListId} … {:else} … {/if}` ikiliği; `ChevronRight` importu; `InspectionEditor`'daki `h2` (başlık akordeon tetikleyicisinde); `SchoolPage`'deki bağlantı-düğmesi + iç içe kutu.

- [ ] **Step 1: `LocationDetail` akordeon**

Importlarda `ChevronRight` yerine `import ChevronDown from '@lucide/svelte/icons/chevron-down';` ve `import { INTERACTIVE_ROW, SECTION_TITLE } from './shared-classes';` (`Collapsible` zaten import ediliyor). Görev 8'den kalan `<div class="space-y-3">` içindeki `{#if openListId} … {/if}` bloğunun tamamı yerine:

```svelte
  <section class="space-y-2" aria-labelledby="location-lists">
    <h2 id="location-lists" class={SECTION_TITLE}>Kontrol listeleri</h2>
    {#if inspections.length === 0}
      <p class="py-4 text-center text-sm text-muted-foreground">Bu mekâna atanmış kontrol listesi yok.</p>
    {:else}
      <ul class="divide-y rounded-md border">
        {#each inspections as i (i.list.id)}
          {@const isOpen = openListId === i.list.id}
          <li>
            <Collapsible.Root open={isOpen} onOpenChange={(o) => nav.openLocation(id, o ? i.list.id : null)}>
              <Collapsible.Trigger class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center justify-between gap-2 p-3 text-left">
                <span class="min-w-0 font-medium">{listLabel(i.list.code, i.list.name)}</span>
                <span class="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  {i.answered}/{i.total}{#if i.no}{' '}· {i.no} eksik{/if}
                  <ChevronDown class="size-4 transition-transform motion-reduce:transition-none {isOpen ? 'rotate-180' : ''}" aria-hidden="true" />
                </span>
              </Collapsible.Trigger>
              <Collapsible.Content class="border-t p-3">
                {#if isOpen}<InspectionEditor listId={i.list.id} locationId={id} />{/if}
              </Collapsible.Content>
            </Collapsible.Root>
          </li>
        {/each}
      </ul>
    {/if}
    {#if addable.length}
      <div class="max-w-sm space-y-1">
        <span class="text-xs text-muted-foreground" aria-hidden="true">Bu mekâna liste ekle</span>
        <SelectField label="Bu mekâna liste ekle" options={addable} value="" onValueChange={addList} />
      </div>
    {/if}
  </section>
```

`Badge` importu artık kullanılmıyorsa sil.

- [ ] **Step 2: `InspectionEditor` başlık satırı**

62-66'daki sarmalayıcıyı `<div class="flex flex-wrap items-center justify-end gap-2">` yap ve `<h2 …>{list.code …}</h2>` satırını sil (kalan: "Listeyi düzenle" ve mekândaysa "Listeyi bu mekândan kaldır").

- [ ] **Step 3: `SchoolPage` aynı desen**

`SchoolPage.svelte`: importlara `import ChevronDown from '@lucide/svelte/icons/chevron-down';` ve `import * as Collapsible from '$lib/components/ui/collapsible';` ekle, `shared-classes` importuna `INTERACTIVE_ROW` ekle (`import { INTERACTIVE_ROW, SECTION_TITLE } from './shared-classes';`), `Button` importunu sil. `{#if schoolWideLists.length}` dalındaki `<ul>` yerine:

```svelte
      <ul class="divide-y rounded-md border">
        {#each schoolWideLists as item (item.list.id)}
          {@const isOpen = openWideId === item.list.id}
          <li>
            <Collapsible.Root open={isOpen} onOpenChange={(o) => (openWideId = o ? item.list.id : null)}>
              <Collapsible.Trigger class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center justify-between gap-2 p-3 text-left">
                <span class="min-w-0 font-medium">{item.list.code} {item.list.name}</span>
                <span class="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  {item.answered}/{item.total}{#if item.no}{' '}· {item.no} eksik{/if}
                  <ChevronDown class="size-4 transition-transform motion-reduce:transition-none {isOpen ? 'rotate-180' : ''}" aria-hidden="true" />
                </span>
              </Collapsible.Trigger>
              <Collapsible.Content class="border-t p-3">
                {#if isOpen}<InspectionEditor listId={item.list.id} locationId={null} />{/if}
              </Collapsible.Content>
            </Collapsible.Root>
          </li>
        {/each}
      </ul>
```

- [ ] **Step 4: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: mekân sayfasında listeler alt alta; birini aç → maddeler aynı sayfada, adres `…/denetim/<liste>`; başkasını aç → önceki kapanır; Geri → önceki durum; "Maddeye git" (`SourceBadge`) doğru listeyi açık getirir; Okul sayfasında okul geneli listeler aynı biçimde; klavye: Enter/Space ile aç-kapa.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/LocationDetail.svelte src/lib/components/SchoolPage.svelte src/lib/components/InspectionEditor.svelte
```

```bash
git commit -q -m "feat: checklists open as an accordion on location and school pages"
```

### Görev 14: Kütüphane diyaloğu eklenecekleri önceden gösterir

**Files:**

- Modify: `src/lib/components/LibraryDialog.svelte:1-10,75-83,135-145`

**Interfaces:**

- Consumes: `addFromLibrary(a, locations, checklists, library)` (`library.ts`, saf; olduğu gibi "kuru çalıştırma" için kullanılır).
- Produces: yok.

**Silinecekler:** `add()` içindeki yerel `pick` (yukarı taşınır, kopya kalmaz).

- [ ] **Step 1: Seçimi ve önizlemeyi türet**

Importlara `import { addFromLibrary } from '$lib/domain/library';` ekle. `toggle` fonksiyonundan önce:

```ts
const pick = (prefix: string) =>
  [...selected].filter((k) => k.startsWith(prefix)).map((k) => Number(k.slice(2)));
const chosenLocations = $derived(pick("m:").map((i) => locationTemplates[i]));
const chosenLists = $derived(pick("l:").map((i) => library.checklists[i]));
// Dry run of the real add, so the footer names exactly the lists that will appear.
const preview = $derived.by(() => {
  if (!selected.size) return null;
  try {
    const next = addFromLibrary(store.assessment, chosenLocations, chosenLists, library.checklists);
    return next.checklists.slice(store.assessment.checklists.length).map((c) => c.code || c.name);
  } catch {
    return null; // the add itself reports the error through store.apply
  }
});
```

`add()`'ı şöyle sadeleştir:

```ts
function add() {
  store.addFromLibrary(chosenLocations, chosenLists, library.checklists);
  open = false;
}
```

- [ ] **Step 2: Altbilgide göster**

Footer'daki ilk `<span …>Kendi listeniz mi var? …</span>` bloğunun başına, aynı span içinde ilk satır olarak:

```svelte
        {#if preview}
          <span class="w-full text-sm text-foreground">
            Eklenecek: {chosenLocations.length} mekân, {preview.length} yeni kontrol listesi{preview.length ? ` (${preview.join(', ')})` : ''}
          </span>
        {/if}
```

- [ ] **Step 3: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: Mekânlar → "Hazır mekân ekle" → bir atölye seç → altbilgi "Eklenecek: 1 mekân, N yeni kontrol listesi (KL-…)" der; "Ekle"den sonra toast'taki sayı aynı. Listeleri zaten olan bir çalışmada aynı mekân → "0 yeni kontrol listesi".

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/LibraryDialog.svelte
```

```bash
git commit -q -m "feat: library dialog previews the lists a location brings"
```

---

# FAZ 4 — Görsel tutarlılık ve özen

**Boyut:** M (6 görev). Token'lar ve tema Faz 1.5'te geldi; bu faz eski sayfaları aynı iskelete ve renk anlamına getirir. **Kırılabilecekler:** domain testi yok. Ekranlar: tümü — `ui-shots.mjs` önce/sonra karşılaştırması **açık ve koyu** iki temada zorunlu. PDF/Excel çıktısı değişmemeli (risk renkleri `matrix.ts`'de kalır). **Geri alma:** görev başına commit; birbirinden bağımsız geri alınabilir. Sıra: 15 → 16 → 17 → 18 → 19 → 20.

### Görev 15: Tek sayfa iskeleti ve tipografi ölçeği

**Files:**

- Modify: `src/App.svelte:103`
- Modify: `src/lib/components/OverviewPage.svelte`, `SchoolPage.svelte`, `LocationList.svelte`, `LocationDetail.svelte`, `RiskRegisterPage.svelte`, `DeficienciesPage.svelte`, `ReportPage.svelte`, `LibraryPage.svelte`, `SchoolCard.svelte`

**Interfaces:**

- Consumes: `PageHeader`, `SECTION_TITLE` (Görev 5).
- Produces: iskelet kuralı (Görsel yön).

**Silinecekler:** sayfa köklerindeki ikinci `p-4`, `mx-auto w-full max-w-*`, `max-w-2xl`; Rapor'daki `Card` kabukları ve `Card` importu; elle yazılmış başlık sınıfları.

- [ ] **Step 1: Kap**

`App.svelte:103` → `<div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6 max-md:pb-24">`

Kap `max-w-6xl` (1152 px) kalır. **Okuma sayfaları** (Başla, Okul, Rapor, mekân sayfası) satır uzunluğu rahat okunsun diye sola hizalı `max-w-3xl` iç sarmalayıcı kullanır; **tablo sayfaları** (Riskler, Mekânlar listesi, Kütüphane) kap genişliğinin tamamını kullanır. Ortalanmış dar sütun yok: sol kenar her sayfada aynı yerde başlar.

- [ ] **Step 2: Sayfa kökleri ve başlıklar**

(Görev 7-10'da yazılan `SchoolPage`, `RiskRegisterPage`, `ReportPage` zaten `PageHeader`/`SECTION_TITLE` ve `gap-6` kullanır; aşağıdaki tablo eski sayfalar içindir.)

| Dosya                                                                                                                                                                                         | Eski                                                                                          | Yeni                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OverviewPage.svelte` kök                                                                                                                                                                     | `flex flex-col gap-6 p-4`                                                                     | `flex max-w-3xl flex-col gap-6`                                                                                                                                                                                                                            |
| `OverviewPage.svelte` başlık kabı, `<ol>`                                                                                                                                                     | `flex max-w-2xl flex-col gap-1`, `flex max-w-2xl flex-col divide-y …`                         | `flex flex-col gap-1`, `flex flex-col divide-y …`                                                                                                                                                                                                          |
| `ReportPage.svelte` kök (Görev 10)                                                                                                                                                            | `flex max-w-3xl flex-col gap-6 p-4`                                                           | `flex max-w-3xl flex-col gap-6`                                                                                                                                                                                                                            |
| her sayfanın `<h1>` sınıfı (Overview, School, LocationList `mr-auto …`, LocationDetail `truncate …`, RiskRegister, Report, Library)                                                           | `text-2xl font-semibold` / `text-xl font-semibold`                                            | `<PageHeader title=… subtitle=… actions=… />` (LocationList: "Hazır mekân ekle" + "Mekân ekle" `actions` snippet'inde; LocationDetail: alt satır = tür · bina · alan, "Riskler" düğmesi ve "…" menüsü `actions`'ta; ← düğmesi PageHeader'ın solunda kalır) |
| her bölüm/grup `<h2>` (Overview "Dikkat edilecekler", School ×2, LocationList grup, LocationDetail "Kontrol listeleri", RiskRegister grup, Deficiencies grup, SchoolCard "İmzacılar", Report) | `text-lg font-medium`, `text-sm font-semibold …`, `text-sm font-medium text-muted-foreground` | `class={SECTION_TITLE}` (+ `import { SECTION_TITLE } from './shared-classes';`)                                                                                                                                                                            |
| `LibraryPage.svelte` kök                                                                                                                                                                      | `flex flex-col gap-4 p-4`                                                                     | `flex flex-col gap-6`                                                                                                                                                                                                                                      |
| `LocationList.svelte` kök (tablo sayfası)                                                                                                                                                     | `space-y-4`                                                                                   | `flex flex-col gap-6`                                                                                                                                                                                                                                      |
| `LocationDetail.svelte` kök (okuma sayfası)                                                                                                                                                   | `min-w-0 space-y-3`                                                                           | `flex max-w-3xl min-w-0 flex-col gap-6`                                                                                                                                                                                                                    |

- [ ] **Step 3: Rapor — kart yerine düz bölümler, tek birincil düğme**

`ReportPage.svelte` (kök ve başlıklar Step 2'de): iki `Card.Root`'u şu biçime çevir (Card içindeki çocuklar **taşınır, değiştirilmez**):

```svelte
  <section class="flex flex-col gap-3 border-t pt-6" aria-labelledby="report-period">
    <h2 id="report-period" class={SECTION_TITLE}>Dönem · {a.period.trim() || 'girilmedi'} · Revizyon {a.meta.revision}</h2>
    <!-- move the former Card.Content children here unchanged -->
  </section>
  <section class="flex flex-col gap-3 border-t pt-6" aria-labelledby="report-outputs">
    <h2 id="report-outputs" class={SECTION_TITLE}>Çıktılar</h2>
    <div><ExportMenu /></div>
  </section>
```

(HTML yorumunu taşınan içerikle değiştir; yorum dosyada kalmasın.) `Card` importunu sil. Birincil düğme `ExportMenu`'deki "PDF indir": "Dönemi kapat (imzalandı)" tetikleyicisi `buttonVariants({ variant: 'outline' })`, "Düzeltme taslağı aç" `variant="outline"`.

- [ ] **Step 4: Sayfa başına tek dolu düğme**

Run: `rg -n "<Button(?![^>]*variant=)" src/lib/components --glob '!ui/**' -P`
Her sayfada en çok bir varsayılan (`default`) düğme kalmalı: LocationList "Mekân ekle", LibraryPage "Boş liste ekle", ExportMenu "PDF indir"; diyalog içindeki birincil düğmeler sayılmaz. Fazlasını `variant="outline"` yap.

- [ ] **Step 5: Kapılar + görsel kontrol**

Kapıları çalıştır; `node "$TMPDIR/riskprime-shots/ui-shots.mjs" after-15 light` ve `… after-15 dark`. Bakıcı kontrol listesi:

- [ ] Bütün sayfalarda sol kenar ve başlık hizası aynı (görüntüleri hızlıca ileri-geri çevirince başlık "zıplamıyor").
- [ ] Başla, Okul, Rapor ve mekân sayfası 1440 px'te sola hizalı okunur bir sütun (≈768 px); Riskler, Mekânlar ve Kütüphane tam genişlik.
- [ ] h1 tüm sayfalarda aynı boyda; bölüm başlıkları aynı gri, küçük ve sakin.
- [ ] Telefonda (390 px) yatay kaydırma yok; alt çubuk içeriği örtmüyor.
- [ ] Riskler tablosu 1440 px'te taşmadan sığıyor (taşarsa yalnız tablo kabı kayıyor).
- [ ] Her sayfada en çok bir dolu düğme.

- [ ] **Step 6: Commit**

```bash
git add src/App.svelte src/lib/components
```

```bash
git commit -q -m "style: one page skeleton and type scale"
```

### Görev 16: Renk anlamı — defter marjı şeritleri, soluk risk tonları, amber eksik

**Files:**

- Modify: `src/lib/components/shared-classes.ts` (`RISK_TONE` eklenir)
- Modify: `src/lib/components/LevelBadge.svelte:13`
- Modify: `src/lib/components/RiskTable.svelte:44-47,61`
- Modify: `src/lib/components/RiskRowCard.svelte:20,40`
- Modify: `src/lib/components/InspectionEditor.svelte` (`CHOICES`, eksik sayısı, madde satırı)
- Modify: `src/lib/components/LocationList.svelte:64`
- Modify: `src/lib/components/AppSidebar.svelte`, `src/lib/components/BottomNav.svelte` (rapor uyarı simgesi)

**Interfaces:**

- Consumes: Görev 5'teki tema renkleri (`bg-risk-<key>-soft`, `bg-risk-intolerable`, `text-risk-intolerable-foreground`, `var(--color-risk-<key>)`, `bg-deficiency`, `text-deficiency`, `bg-deficiency-soft`, `border-l-deficiency`); `LevelKey` (`matrix.ts`, değişmez).
- Produces: `export const RISK_TONE: Record<LevelKey, { fill: string; stripe: string; badge: string }>` (`shared-classes.ts`).

**Silinecekler:** ekranda `level.background` / `level.text` (doygun Excel dolguları) ve satır içi `style` ile renk verme; tablo/kart `border-l-4` şeritleri (yerine tema rengiyle `shadow-[inset_…]` şerit); "Hayır", "eksik", "süresi geçti", "eksik bilgi" için `red-600`, `green-700`, `gray-500`, `destructive`.

Kural (referans tasarımla aynı): **satırın kendisi soluk ton, ilk hücrede güçlü şerit; düzey adı rozette yazılı.** Şerit ve ton tamamlayıcıdır — renk görmeyen kullanıcı düzeyi rozetteki addan okur (WCAG 1.4.1). Puansız satırda ton ve şerit yok. Renkler yalnız tema değişkenlerinden Tailwind sınıflarıyla gelir; sınıflar Tailwind'in görebilmesi için tam dizge olarak yazılır (`bg-risk-${key}` gibi birleştirilmiş sınıf üretilmez).

- [ ] **Step 1: Düzey → sınıf tablosu**

`shared-classes.ts` sonuna:

```ts
import type { LevelKey } from "$lib/domain/matrix";

/** Risk level on screen: soft row fill, strong ledger stripe, badge. Full literals so Tailwind generates them. */
export const RISK_TONE: Record<LevelKey, { fill: string; stripe: string; badge: string }> = {
  negligible: {
    fill: "bg-risk-negligible-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-negligible)]",
    badge:
      "bg-risk-negligible-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-negligible)]",
  },
  low: {
    fill: "bg-risk-low-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-low)]",
    badge: "bg-risk-low-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-low)]",
  },
  medium: {
    fill: "bg-risk-medium-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-medium)]",
    badge: "bg-risk-medium-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-medium)]",
  },
  high: {
    fill: "bg-risk-high-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-high)]",
    badge: "bg-risk-high-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-high)]",
  },
  intolerable: {
    fill: "bg-risk-intolerable-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-intolerable)]",
    badge: "bg-risk-intolerable text-risk-intolerable-foreground",
  },
};
```

(`import` satırını dosyanın başına taşı.)

- [ ] **Step 2: Rozet, tablo satırı, kart, süresi geçmiş**

`LevelBadge.svelte:13` (tolere edilemez tek düz koyu rozet; diğerleri soluk ton + 3 px şerit):

```svelte
  <Badge class="h-auto min-h-5 whitespace-normal border-0 text-center leading-tight {RISK_TONE[level.key].badge}" title="Skor = O × Ş">{showScore ? `${score} ` : ''}{level.label}</Badge>
```

(`import { RISK_TONE } from './shared-classes';`)

`RiskTable.svelte` satır 44-47 (satır tonu, ilk hücrede şerit, seçili satırda zemin yerine halka; satır 56'daki çağrılar aynı kalır):

```svelte
      {#each items as { row, number: n } (row.id)}
        {@const tone = toneOf(row)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <Table.Row
          id="trow-{row.id}"
          class="cursor-pointer align-top transition-colors duration-150 motion-reduce:transition-none data-[state=selected]:ring-2 data-[state=selected]:ring-ring data-[state=selected]:ring-inset {tone?.fill ?? ''} {dimIds.has(row.id) ? 'opacity-60' : ''}"
          data-state={openId === row.id ? 'selected' : undefined}
          onclick={(e: MouseEvent) => !isControl(e) && onopen(row.id)}
        >
          <Table.Cell class="font-semibold text-muted-foreground {tone?.stripe ?? ''}">
            {n}{#if dimIds.has(row.id)}<span class="block text-xs font-normal">{dimLabel}</span>{/if}
          </Table.Cell>
```

Betiğe (`import { RISK_TONE } from './shared-classes';` ile):

```ts
const toneOf = (r: RiskRow) => {
  const level = riskLevel(r.likelihood, r.severity);
  return level ? RISK_TONE[level.key] : null;
};
```

`RiskTable.svelte:61` ve `RiskRowCard.svelte:40` süresi geçti rozeti → nötr çerçeve + saat (amber de kırmızı da değil; süre bir durum, risk değil):

```svelte
<Badge variant="outline" class="mt-1"><Clock aria-hidden="true" />Süresi geçti</Badge>
```

(`import Clock from '@lucide/svelte/icons/clock';`; `CircleAlert` importu kullanılmıyorsa sil.)

`RiskRowCard.svelte:20` (`border-l-4` ve `style:border-left-color` silinir; Görev 7'deki `class:opacity-60` kalır):

```svelte
<article id="row-{row.id}" class="rounded-lg border bg-background {level ? `${RISK_TONE[level.key].fill} ${RISK_TONE[level.key].stripe}` : ''}" class:opacity-60={dimLabel !== undefined}>
```

(`import { RISK_TONE } from './shared-classes';`)

- [ ] **Step 3: Cevap düğmeleri ve eksik metni**

`InspectionEditor.svelte` `CHOICES`:

```ts
const CHOICES: { value: Exclude<Answer, "">; tone: string }[] = [
  { value: "yes", tone: "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground" },
  { value: "no", tone: "data-[state=on]:bg-deficiency data-[state=on]:text-deficiency-foreground" },
  { value: "na", tone: "data-[state=on]:bg-muted-foreground data-[state=on]:text-background" },
];
```

`ToggleGroup.Item` sınıfına `transition-colors duration-150 motion-reduce:transition-none` ekle (`class="{choice.tone} transition-colors duration-150 motion-reduce:transition-none"`). Eksik sayısı `<b class="text-red-600">` → `<b class="text-deficiency">`. Madde satırı (`<div id="item-{item.id}" class="grid … rounded-lg border p-2 …">`): cevap "Hayır" iken soluk amber zemin ve defter marjı:

```svelte
        <div id="item-{item.id}" class="grid items-start gap-2 rounded-lg border p-2 transition-colors duration-150 motion-reduce:transition-none {ROW_GRID} {current.answer === 'no' ? 'border-l-4 border-l-deficiency bg-deficiency-soft' : ''}">
```

`LocationList.svelte:64` `<b class="text-red-600">` → `<b class="text-deficiency">`.
`AppSidebar.svelte` ve `BottomNav.svelte` rapor `TriangleAlert` `text-destructive` → `text-deficiency`.

- [ ] **Step 4: Kalıntı taraması**

Run: `rg -n "red-600|green-700|gray-500|level\.background|level\.text|LEVELS\[" src/lib/components --glob '!ui/**'`
Expected: çıktı yok.
Run: `rg -n "destructive" src/lib/components --glob '!ui/**'`
Expected: yalnız silme eylemleri ("Mekânı sil", imzacı sil hover), `LocationList` yüksek risk rozeti, `ReportPage` "İçerik imzadan sonra değişmiş!", `BottomNav` risk sayacı.

- [ ] **Step 5: Kapılar + görsel kontrol**

Kapıları çalıştır; `node "$TMPDIR/riskprime-shots/ui-shots.mjs" after-16 light` ve `… after-16 dark`; bir PDF ve Excel indir. Bakıcı kontrol listesi:

- [ ] Riskler'de puanlı her satır soluk tonlu, ilk hücresinde güçlü şerit; düzey adı her satırda rozette yazılı (şerit tamamlayıcı); "Tolere edilemez" tek düz koyu rozet olarak öne çıkıyor.
- [ ] Koyu temada beş düzeyin tonu ve şeridi birbirinden ayırt ediliyor.
- [ ] Seçili satır (yan sayfa açık) lacivert halkayla belli.
- [ ] "Süresi geçti" nötr çerçeve + saat simgesi; amber ya da kırmızı değil.
- [ ] "Evet" lacivert, "Hayır" amber, "U.D." gri; "Hayır" satırı solda amber şerit + soluk zemin; kırmızı yalnız yüksek risk ve gerçek hata.
- [ ] PDF ve Excel'deki risk renkleri öncekiyle aynı (MEB dolguları).
- [ ] "Hayır" seçili düğmede metin kontrastı ≥4.5:1 (açık: `--deficiency` üzerinde beyaz; koyu: açık amber üzerinde koyu metin).

- [ ] **Step 6: Commit**

```bash
git add src/lib/components
```

```bash
git commit -q -m "style: ledger stripes and soft risk tints on screen, amber deficiencies"
```

### Görev 17: Sakin, yönlendirici boş durumlar

**Files:**

- Create: `src/lib/components/EmptyState.svelte`
- Modify: `LocationList.svelte:50-52,77-79`, `RiskRegisterPage.svelte` (boş durum bloğu), `DeficienciesPage.svelte:79-89`, `LocationDetail.svelte` (liste yok), `SchoolPage.svelte` (liste yok), `LibraryPage.svelte:83`, `LocationEditor.svelte` (satır yok)

**Interfaces:**

- Produces: `EmptyState` props `{ icon: Component<any>; text: string; action?: { label: string; run: () => void } }`.

**Silinecekler:** yedi elle yazılmış boş durum işaretlemesi (`border-dashed p-6 text-center` kutuları ve `py-8 text-center` paragrafları).

- [ ] **Step 1: Bileşeni oluştur**

```svelte
<script lang="ts">
  import type { Component } from 'svelte';
  import { Button } from '$lib/components/ui/button';

  // One calm empty state: icon, one sentence, at most one way forward.
  // oxlint-disable-next-line no-explicit-any -- lucide icons take their own prop type
  let { icon: Icon, text, action }: { icon: Component<any>; text: string; action?: { label: string; run: () => void } } = $props();
</script>

<div class="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
  <Icon class="size-8 text-muted-foreground" aria-hidden="true" />
  <p class="max-w-sm text-sm text-muted-foreground">{text}</p>
  {#if action}<Button variant="outline" size="sm" onclick={action.run}>{action.label}</Button>{/if}
</div>
```

- [ ] **Step 2: Kullan**

| Yer                                | `icon` (import `@lucide/svelte/icons/<ad>`) | `text`                                   | `action`                                                                                  |
| ---------------------------------- | ------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `LocationList` hiç mekân yok       | `map-pin`                                   | `Henüz mekân yok.`                       | `{ label: 'Hazır mekân ekle', run: () => (libraryOpen = true) }`                          |
| `LocationList` arama sonucu yok    | `search-x`                                  | `Bu adla mekân yok.`                     | `{ label: 'Aramayı temizle', run: () => (query = '') }`                                   |
| `RiskRegisterPage` hiç satır yok   | `table-2`                                   | `Henüz risk satırı yok.`                 | `{ label: 'Eksiklere git', run: () => nav.openDeficiencies({ state: 'untransferred' }) }` |
| `RiskRegisterPage` süzgeç boş      | `funnel-x`                                  | `Bu süzgece uyan risk satırı yok.`       | `isFiltered ? { label: 'Süzgeçleri temizle', run: () => nav.openRegister() } : undefined` |
| `DeficienciesPage` hiç eksik yok   | `clipboard-check`                           | `Henüz eksik yok.`                       | `{ label: "Mekânlar'a git", run: () => nav.go('locations') }`                             |
| `DeficienciesPage` süzgeç boş      | `funnel-x`                                  | `Bu süzgece uyan eksik yok.`             | `isFiltered ? { label: 'Süzgeçleri temizle', run: reset } : undefined`                    |
| `LocationDetail` liste yok         | `list-checks`                               | `Bu mekâna atanmış kontrol listesi yok.` | yok (altındaki "Bu mekâna liste ekle" seçicisi eylemdir)                                  |
| `SchoolPage` okul geneli liste yok | `list-checks`                               | `Okul genelinde doldurulan liste yok.`   | yok                                                                                       |
| `LibraryPage` liste yok            | `library`                                   | `Henüz liste yok.`                       | `{ label: 'Hazır listelerden ekle', run: () => (libraryOpen = true) }`                    |
| `LocationEditor` satır yok         | `table-2`                                   | `Bu mekânda risk satırı yok.`            | yok (altında "Satır ekle")                                                                |

Örnek (`RiskRegisterPage`, Görev 7'deki `<div class="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center"> … </div>` bloğunun yerine):

```svelte
      {#if everything.length}
        <EmptyState icon={FunnelX} text="Bu süzgece uyan risk satırı yok." action={isFiltered ? { label: 'Süzgeçleri temizle', run: () => nav.openRegister() } : undefined} />
      {:else}
        <EmptyState icon={Table2} text="Henüz risk satırı yok." action={{ label: 'Eksiklere git', run: () => nav.openDeficiencies({ state: 'untransferred' }) }} />
      {/if}
```

(`import FunnelX from '@lucide/svelte/icons/funnel-x'; import Table2 from '@lucide/svelte/icons/table-2'; import EmptyState from './EmptyState.svelte';` — diğer satırlar aynı desenle.)

Run: `rg -n "border-dashed p-6|py-8 text-center|py-6 text-center|py-4 text-center" src/lib/components --glob '!ui/**'`
Expected: yalnız `EmptyState.svelte` dışı kalan, boş durum olmayan yerler (ör. `InspectionEditor` "böyle bir kontrol listesi yok" hata metni, `ChecklistEditor` "Liste bulunamadı" — bunlar hata durumu, olduğu gibi kalır).

- [ ] **Step 3: Kapılar + görsel kontrol**

Kapıları çalıştır. `Dosya → Yeni (boş)` ile `node "$TMPDIR/riskprime-shots/ui-shots.mjs" after-17` (betikte `Yeni (okul verisiyle)` yerine geçici olarak `Yeni (boş)` yaz). Bakıcı kontrol listesi:

- [ ] Boş Mekânlar, Riskler, eksikler ve Kütüphane: simge + tek cümle + tek düğme; düğme doğru yere götürüyor.
- [ ] Hiçbir boş durumda açıklama paragrafı yok; ton sakin (gri simge, kesik kenar).
- [ ] Boş durumlar canlı bölge değil (`role="status"` yok): sayfa açılınca ekran okuyucu yalnız normal okuma sırasında okuyor, araya girmiyor.
- [ ] Koyu temada simge ve kesik kenar seçilebiliyor (`… after-17 dark`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/components
```

```bash
git commit -q -m "feat: calm empty states with one way forward"
```

### Görev 18: Durum değişimini anlatan ölçülü hareket

**Files:**

- Modify: `src/lib/components/LocationDetail.svelte`, `src/lib/components/SchoolPage.svelte`, `src/lib/components/RiskRegisterPage.svelte` (akordeon içerik ve ok)
- Modify: `src/lib/components/ChecklistItemLinks.svelte:20` (yeni risk bağlantısı)
- Modify: `src/lib/components/RiskTable.svelte:46` (seçili satır)

**Interfaces:**

- Consumes: `tw-animate-css` sınıfları (`animate-collapsible-down/up`, `animate-in`, `fade-in`, `slide-in-from-top-1`) , `data-open`/`data-closed` özel varyantları (`app.css:7-8`, var olan) ve Tailwind `motion-safe:`/`motion-reduce:` önekleri. Genel CSS kuralı yok: her hareketli sınıf kendi `motion-reduce:` karşılığını taşır.
- Produces: yok.

**Silinecekler:** akordeondaki `{#if isOpen}` korumaları (bits-ui `Collapsible.Content` kapalıyken zaten içeriği bağlamaz; koruma kapanış animasyonunu engelliyordu) — Step 1'deki doğrulamadan sonra.

- [ ] **Step 1: Akordeon aç/kapa**

Her iki dosyada ve Riskler grup başlıklarında (`RiskRegisterPage.svelte`) `Collapsible.Content` sınıfına `overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up motion-reduce:animate-none` ekle; `{#if isOpen}…{/if}` sarmalını kaldır (yalnız içteki `InspectionEditor` kalsın). Ok simgesindeki `transition-transform motion-reduce:transition-none` sınıfına `duration-200` ekle.
Doğrula (DevTools Elements): kapalı bir öğenin içinde `InspectionEditor` DOM'u yok. Varsa (bits-ui sürümü içeriği bağlı tutuyorsa) korumayı geri koy ve yalnız açılış animasyonu kalsın.

- [ ] **Step 2: Riske ekleme sonucu**

`ChecklistItemLinks.svelte:20` `Button` sınıfına `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200` ekle: "Riske ekle"den sonra "Risk satırı: … #n" bağlantısı yumuşakça belirir (sayfa ilk açılırken de 200 ms solarak gelir; ölçülü).

- [ ] **Step 3: Seçili satır**

`RiskTable.svelte:46` `Table.Row` sınıfına `transition-colors duration-150 motion-reduce:transition-none` ekle (yan sayfa açılınca seçili satır vurgusu yumuşak geçer).

- [ ] **Step 4: Kapılar + görsel kontrol**

Kapıları çalıştır. Elle (görüntü yetmez, hareket görülmeli): bakıcı kontrol listesi:

- [ ] Liste açılırken/kapanırken içerik 200 ms'de kayarak açılıyor, ok dönüyor; zıplama/titreme yok.
- [ ] "Evet/Hayır/U.D." renk değişimi yumuşak; "Hayır" satırının amber zemini yumuşak geliyor.
- [ ] "Riske ekle" sonrası bağlantı yumuşak beliriyor.
- [ ] macOS Sistem Ayarları › Erişilebilirlik › Ekran › "Hareketi azalt" açıkken hepsi anında, hareketsiz.
- [ ] Hiçbir hareket 300 ms'yi aşmıyor; döngüsel animasyon yok.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components
```

```bash
git commit -q -m "style: measured motion for accordions, answers and new risk links"
```

### Görev 19: Terim birliği

**Files:**

- Modify: `src/lib/components/OverviewPage.svelte`, `DeficienciesPage.svelte`, `InspectionEditor.svelte:119`, `LocationList.svelte:64`

**Interfaces:** yok. **Produces (sözlük):** _kontrol listesi_ (şablon da, mekânda doldurulan da), _eksik_ ("Hayır" cevabı), _riske ekle_ (eksikten satır açma), _risk satırı_, _Riskler_ (sayfa), _U.D._ (ipucu: Uygulanamaz). "Denetim", "risk tablosu", "aktar", "risk kaydı" arayüzde kullanılmaz (PDF/Excel'deki MEB form başlıkları hariç).

**Silinecekler:** eski terimler.

- [ ] **Step 1: Değiştir**

| Dosya                         | Eski                                                                   | Yeni                                                            |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `OverviewPage.svelte`         | `'Mekânları denetleyin'`                                               | `'Kontrol listelerini doldurun'`                                |
| `OverviewPage.svelte`         | `'Eksikleri risk tablosuna aktarın'`                                   | `'Eksikleri riske ekleyin'`                                     |
| `OverviewPage.svelte`         | `` `${p.transfer.untransferred} aktarılmamış eksik` ``                 | `` `${p.transfer.untransferred} eksik riske eklenmedi` ``       |
| `OverviewPage.svelte`         | `'Aktarılmamış eksik'` (kutu)                                          | `'Riske eklenmemiş eksik'`                                      |
| `DeficienciesPage.svelte`     | `` `Risk tablosuna aktarılmamış (${…})` `` / `` `Aktarılmış (${…})` `` | `` `Riske eklenmemiş (${…})` `` / `` `Riske eklenmiş (${…})` `` |
| `InspectionEditor.svelte:119` | `Bu mekânda böyle bir denetim yok.`                                    | `Bu mekânda böyle bir kontrol listesi yok.`                     |
| `LocationList.svelte:64`      | `Denetim: {s.answered}/{s.total} cevaplı`                              | `Kontrol listeleri: {s.answered}/{s.total} cevaplı`             |

- [ ] **Step 2: Kalıntı taraması**

Run: `rg -n "Risk tablosu|risk tablosu|Risk kaydı|risk kaydı|aktar|Denetim|denetle" src/lib/components src/App.svelte --glob '!ui/**'`
Expected: çıktı yok. (Kalan isabet varsa sözlüğe göre düzelt. `src/lib/export/**` ve `src/lib/domain/**` taramaya dahil değil — çıktı başlıkları ve domain hata metinleri testlere bağlı, ör. `checklist.test.ts:50` "Denetim bulunamadı".)

- [ ] **Step 3: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: Başla, Mekânlar, bir liste, Riskler › eksikler ve Rapor'da sözlük dışı terim yok.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components
```

```bash
git commit -q -m "style: one vocabulary for checklists, deficiencies and risks"
```

### Görev 20: "Ortak" mekânı "Okul geneli" ile aynı adla göster (karar 1 = A)

**Files:**

- Modify: `src/lib/domain/assessment.ts:30`
- Modify: `src/lib/components/SchoolPage.svelte`

**Interfaces:**

- Consumes: `LOCATION_TYPE_LABELS`, `nav.openRegister`.
- Produces: yok. Dosya biçimi değişmez (`type: "common"` aynen saklanır).

**Silinecekler:** "Ortak (tüm mekânlar)" etiketi.

- [ ] **Step 1: Etiket**

`assessment.ts:30` → `common: "Okul geneli (tüm mekânlar)",`

Run: `rg -n "Ortak \(tüm" src`
Expected: çıktı yok (testte bu metin aranıyorsa testi yeni etikete göre düzelt).

- [ ] **Step 2: Okul sayfasında okul geneli satırlar**

`SchoolPage.svelte` betiğine:

```ts
import { Button } from "$lib/components/ui/button";
import { nav } from "$lib/nav.svelte";
const commonLocations = $derived(a.locations.filter((l) => l.type === "common"));
```

"Okul geneli kontrol listeleri" bölümünden sonra:

```svelte
  {#if commonLocations.length}
    <section class="flex flex-col gap-3" aria-labelledby="school-wide-rows">
      <h2 id="school-wide-rows" class={SECTION_TITLE}>Okul geneli risk satırları</h2>
      <ul class="flex flex-col items-start gap-1 text-sm">
        {#each commonLocations as l (l.id)}
          <li><Button variant="link" class="h-auto p-0" onclick={() => nav.openRegister({ locationId: l.id })}>{l.name || 'Adsız mekân'} ({l.rows.length} satır)</Button></li>
        {/each}
      </ul>
    </section>
  {/if}
```

- [ ] **Step 3: Kapılar + elle kontrol**

Kapıları çalıştır. Elle: okul verisiyle Okul sayfasında "Okul geneli risk satırları" altında "Tüm mekânlar"; tıklayınca Riskler o mekâna süzülü. Eski bir `.json` dosyasını aç → hata yok, mekân türü seçicide "Okul geneli (tüm mekânlar)".

- [ ] **Step 4: Commit**

```bash
git add src/lib/domain/assessment.ts src/lib/components/SchoolPage.svelte
```

```bash
git commit -q -m "feat: show common locations as school-wide on the school page"
```

---

## Atlananlar (rapordaki öneriler, plana alınmadı)

- **Diyalog açıkken toast'u ertelemek** — üstte ortada konum diyalog düğmelerini zaten örtmüyor; ek durum mantığı gereksiz.
- **"Hakkında"yı yalnız Dosya menüsüne taşımak** — kenar çubuğu alt bölümünde zaten ikincil; kazanç yok.
- **Kütüphane'yi ayrıca "ikincil" yapmak için iş** — zaten kenar çubuğu alt bölümünde (`AppSidebar.svelte:60-71`) ve telefonda Dosya menüsünde; Görev 4 ile hazır mekân Mekânlar'a geldi.
- **`#genel` yerine `#basla` adresi** — yer imlerini kırar, değer katmaz.
- **Eksikler süzgecini URL'ye yazmak** — istenmedi; yalnız mekân süzgeci (Görev 8) URL'de.
- **Kart-içinde-kart temizliği (genel)** — kodda tek gerçek örnek Rapor'du (Görev 15).
- **Svelte JS geçişleri (`transition:slide`) ve ayrı bir hareket modülü** — `tw-animate-css` zaten yüklü ve `--bits-collapsible-content-height` destekliyor; Tailwind sınıflarıyla aynı sonuç; azaltılmış hareket her sınıfın `motion-reduce:` karşılığıyla.
- **Eğik çizgisiz sıfır için yazı tipi değişikliği** — yazı tipinde `zero`/`ss*` özelliği yok (Görsel yön); `unicode-range` yaması rakamları karıştırır. Karar 7.
- **Kütüphane mekânlarının hazır satırlarını kaldırmak/eklemeyi değiştirmek** — veri ve kütüphane içeriği değişikliği; yinelenme sorunu Görev 12'deki öneriyle çözülüyor.

## Verilen kararlar (bakıcı onaylı)

1. **"Ortak" mekân ile "Okul geneli": A.** Yalnız ad ve görünüm birleşir, dosya biçimi değişmez: `common` türünün etiketi "Okul geneli (tüm mekânlar)" (Görev 20); Okul sayfası okul geneli listeleri ve okul geneli risk satırlarını birlikte gösterir (Görev 9, 20); Mekânlar listesinin başında "Okul geneli kontrol listeleri → Okul" köprü satırı (Görev 9).
2. **PDF üst çubuktan kalkar,** Rapor'daki "Çıktılar"da durur (Görev 2, 10). Üst çubukta yalnız kayıt durumu, Kaydet ve Dosya.
3. **Riskler rozeti** = açık yüksek + tolere edilemez risk sayısı (Görev 7).
4. **"Hayır"/eksik amber;** kırmızı yalnız risk düzeyinde ve gerçek hatada (Görev 5, 16). "Süresi geçti" nötr çerçeve + saat simgesi.
5. **Toplu ekleme kalır** (Riskler › eksikler "Görünenleri riske ekle"); `hasChecklistRisk` ile zaten satırı olan maddeyi atlar (Görev 11). Liste başlığı oraya süzülmüş bağlantı verir.
6. **Benzerlik eşiği 0.45** (`ROW_SIMILAR_THRESHOLD`, testli). İlk gerçek okul dosyasıyla ölçülecek; gerekirse yalnız bu sabit ayarlanır (Görev 12).
7. **Eğik çizgili sıfır kalır** — yazı tipinde kapatma özelliği yok (Görsel yön).
8. **Koyu tema: evet.** Sistem tercihini izler; Dosya menüsünde Açık / Koyu / Sistem (tercih `localStorage`'da, `try/catch`'li, varsayılan Sistem); `Toaster` temaya bağlı; PDF/Excel etkilenmez; Tauri'de de çalışır; her görsel kontrol iki temada (Görev 5, 6).

## Kalan açık sorular

- **Benzerlik eşiğinin gerçek dosyada ölçümü** (karar 6): kim, hangi okul dosyasıyla, hangi isabet oranı yeterli? Görev 12'nin elle kontrolünde sayılıp bu satıra yazılır.
- **Tauri penceresinin başlık çubuğu rengi:** Tauri pencere teması varsayılan olarak sistemi izler; kullanıcı uygulamada "Koyu" seçip sistem açıkken başlık çubuğu açık kalır. Kabul mü, yoksa `@tauri-apps/api` `getCurrentWindow().setTheme()` ile eşitlensin mi (kurulu paket, yeni bağımlılık değil; ayrı küçük görev)?

## Self-review sonuçları

**1. Kapsam (istek → görev):**

- Faz 1 hızlı kazanımlar: toast, açıklama paragrafları, "Riskler" adı, iç geri düğmesi, okul adı (G1); bayat mekân PDF'i (G2); sıradaki adım lacivert sol şeritle, tamamlanan soluk, sıfır kutu gizli (G3); "Hazır mekân ekle" (G4). ✔
- Görsel yön + doğrulama aracı (Faz 1.5'ten önce): amaç, kitle, ton, akılda kalan ayrıntı, kısıtlar; tipografi ve boşluk ölçeği; eğik sıfır araştırması; boş durum ve hareket kuralları; açık+koyu ekran görüntüsü betiği. ✔
- Faz 1.5 (M6): yalnız shadcn tema değişkenleri (açık + koyu, risk/eksik renkleri "Adding new colors" yoluyla) + ölçülen kontrast tablosu, `PageHeader` bileşeni ve `SECTION_TITLE`/`INTERACTIVE_ROW` Tailwind sınıf dizileri (G5); koyu tema seçimi (G6, karar 8). `@utility`, genel CSS ve `ui/**` düzenlemesi yok; hareket `motion-safe:`/`motion-reduce:` önekleriyle (G17, G18). Faz 2-3 bileşenleri baştan `PageHeader`/`SECTION_TITLE`/`INTERACTIVE_ROW` ile yazılı. ✔
- Faz 2 bilgi mimarisi, tek sürüm (M6): Riskler birleşik, katlanır gruplar (M9), sabit satır kümesi (H2), eksik görünümü + kırıntı (L14) (G7); risk sekmesi kalkar, rota uyumu, Riskler'den mekâna dönüş (H3) (G8); Okul sayfası, köprü satır, okul geneli yönlendirmesi (H4) (G9); ince Rapor, imzalı dönemde "Yeni dönem başlat" (M12), PDF üst çubuktan kalkar (G10). ✔
- Faz 3 iş akışı: tek eksik→risk eylemi, `applyWithUndo` + "Geri al" (M7), liste başlığında toplu ekleme bağlantısı (M8), toplu eklemede yinelenen atlama (karar 5) (G11); benzer satır satır içi ipucu (L17), eşik 0.45 (G12); akordeon (G13); kütüphane önizlemesi (G14). ✔
- Faz 4: iskelet + okuma/tablo genişliği (H5) (G15); satır tonu + şerit, tamamlayıcı şerit kuralı (M11), süresi geçmiş nötr (L15) (G16); boş durumlar, `role="status"` yok (L16) (G17); hareket (G18); terimler (G19); Ortak = Okul geneli (G20). ✔
- Yüksek bulgular: H1 opak `ring-2 ring-ring` (`INTERACTIVE_ROW`, G5) ✔, H2 (G7) ✔, H3 (G7 başlık + G8 kırıntı) ✔, H4 (G9) ✔, H5 (G15) ✔. Orta: M6 ✔, M7 ✔, M8 ✔, M9 ✔, M10 (`--input` 0.64 — taslağın 0.66'sı 2.98:1 ölçüldüğü için; "Sıradaki" sol şerit; `--accent` soğuk gri, iki temada) ✔, M11 ✔, M12 ✔. Düşük: L13 yeniden numaralama ✔, L14 ✔, L15 ✔, L16 ✔, L17 ✔, L18 sonner koyu (G6) ✔.
- Referans tasarım bağlantısı ve kaynak dosyaları başlıkta; değerler eşit (tek fark `--input`, gerekçeli). ✔

**2. Yer tutucu taraması:** "TBD/TODO/sonra" yok. HTML yorumu ile "eski satırlar aynen taşınır" deyen yerler (G10 Step 2, G15 Step 3) taşınan satır aralığını açıkça veriyor ve yorumun dosyada kalmamasını söylüyor — yeni kod değil, taşıma.

**3. Tip/ad tutarlılığı:** `nextStep`/`StepKey` (G3); `unansweredScope` (G9) OverviewPage ve ReadinessList'te aynı imzayla; `groupByLocation`, `RegisterFilter.level "unscored"`, `RegisterPin`, `pinRegister`, `keepPinned`, `matchesRegisterFilter`, `isSectionActive`, `LocationEditor { locationId, items, dimIds?, dimLabel? }` (G7) G8-G16'da aynı adlarla; `RiskTable`'ın `dimIds`/`dimLabel` prop'ları G16'daki satır kodunda korunuyor; `Place` `locationView`'suz ve `openLocation(id, listId)` (G8) G9, G11, G13'te; `nav.openSchool()` (G9) G10, G11'de; `ROW_SIMILAR_THRESHOLD`, `similarRows`/`SimilarRow` (G12) yalnız `ChecklistRiskButton`'da; `ThemeChoice`, `parseThemeChoice`, `isDarkFor`, `theme`, `applyTheme` (G6) yalnız `main.ts`, `App.svelte`, `AppTopbar.svelte`'de; G5'teki `bg-deficiency`/`text-deficiency`/`bg-deficiency-soft`, `bg-risk-<key>-soft`/`var(--color-risk-<key>)`, `PageHeader`, `SECTION_TITLE`, `INTERACTIVE_ROW` ve G16'daki `RISK_TONE` adları G7-G20'de aynı yazımla. G3'teki `nav.openReport(true)` ve `openLocation(…, 'risk')` çağrıları G8 ve G9'da açıkça güncelleniyor.

**Fazlar:** Faz 1 (4 görev, S) · Faz 1.5 (2 görev, M) · Faz 2 (4 görev, L, tek sürüm) · Faz 3 (4 görev, M) · Faz 4 (6 görev, M) — toplam 20 görev, numaralar 1-20 boşluksuz.

**Yeni dosya:** 6 (`SchoolPage.svelte`, `EmptyState.svelte`, `PageHeader.svelte`, `shared-classes.ts`, `theme-choice.ts` + testi, `theme.svelte.ts`); `SectionTitle.svelte`/`InteractiveRow.svelte` yerine tek sınıf dizisi dosyası seçildi (daha az dosya, aynı tutarlılık). **Silinen dosya:** 2 (`transfer-inspection.ts` + testi). **Yeni dışa açık API:** `nextStep`, `StepKey`, `unansweredScope`, `groupByLocation`, `RegisterPin`, `pinRegister`, `keepPinned`, `matchesRegisterFilter`, `isSectionActive`, `ROW_SIMILAR_THRESHOLD`, `similarRows`, `SimilarRow`, `nav.openSchool`, `ThemeChoice`, `parseThemeChoice`, `isDarkFor`, `theme`, `applyTheme`, `PageHeader`, `SECTION_TITLE`, `INTERACTIVE_ROW`, `RISK_TONE` (22). **Silinen API:** `filterRows`, `RowFilter`, `ROW_FILTERS`, `ROW_FILTER_LABELS`, `transferInspection`, `countUntransferredInspection`, `LocationView`, `nav.openReport`, `store.transferMissing`, `store.openSchool`, `store.selectLocation`, `store.openRow`, `store.selectChecklist` (13).
