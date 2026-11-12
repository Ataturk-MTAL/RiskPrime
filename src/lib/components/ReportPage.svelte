<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import type { Snippet } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import InspectionEditor from './InspectionEditor.svelte';
  import ReadinessList from './ReadinessList.svelte';
  import SchoolCard from './SchoolCard.svelte';
  import { inspectionSummary, inspectionsForList } from '$lib/domain/inspections';
  import { progress } from '$lib/domain/progress';
  import { readiness } from '$lib/domain/readiness';
  import { nav } from '$lib/nav.svelte';
  import { store, type ExportKind } from '$lib/state.svelte';

  const OTHER_OUTPUTS: { kind: ExportKind; label: string }[] = [
    { kind: 'json', label: 'Kayıt dosyası (.json)' },
    { kind: 'xlsx', label: 'Excel kayıt (.xlsx)' },
    { kind: 'docx', label: 'Word (.docx)' },
    { kind: 'pdf-blank', label: 'Boş form (PDF)' },
    { kind: 'pdf-checklists', label: 'Yalnız kontrol listeleri (PDF)' },
  ];

  const a = $derived(store.assessment);
  const p = $derived(progress(a, new Date()));
  const gaps = $derived(readiness(a));
  const busy = $derived(store.busy !== '');
  /** School-wide list whose inspection is open for answering on this page. */
  let openWideId = $state<string | null>(null);
  const schoolWideLists = $derived(
    a.checklists.flatMap((list) =>
      inspectionsForList(a, list.id)
        .filter((i) => i.locationId === null)
        .map((i) => ({ list, ...inspectionSummary(a, i) })),
    ),
  );
</script>

{#snippet section(id: string, title: string, change: { label: string; run: () => void } | null, body: Snippet)}
  <section class="flex flex-col gap-3 rounded-xl border bg-card p-4" aria-labelledby={id}>
    <div class="flex items-center justify-between gap-2">
      <h2 {id} class="text-lg font-medium">{title}</h2>
      {#if change}<Button variant="link" class="h-auto p-0" onclick={change.run}>{change.label}</Button>{/if}
    </div>
    {@render body()}
  </section>
{/snippet}

{#snippet schoolBody()}
  <SchoolCard />
{/snippet}

{#snippet schoolWideBody()}
  {#if schoolWideLists.length}
    <ul class="flex flex-col gap-1 text-sm">
      {#each schoolWideLists as item (item.list.id)}
        <li>
          <Button
            variant="link"
            class="h-auto p-0 text-left whitespace-normal"
            aria-expanded={openWideId === item.list.id}
            onclick={() => (openWideId = openWideId === item.list.id ? null : item.list.id)}
          >
            {item.list.code} {item.list.name}
          </Button>
          <span class="text-muted-foreground">: {item.answered}/{item.total} madde yanıtlandı{item.no ? `, ${item.no} eksik` : ''}</span>
          {#if openWideId === item.list.id}
            <div class="mt-3 rounded-lg border p-3"><InspectionEditor listId={item.list.id} locationId={null} /></div>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="text-sm text-muted-foreground">Bu listeler okulun tamamı için bir kez doldurulur; açmak için listenin adına tıklayın.</p>
  {:else}
    <p class="text-sm text-muted-foreground">Okul genelinde denetlenen liste yok; tüm listeler mekânlara atanmış.</p>
  {/if}
{/snippet}

{#snippet inspectionsBody()}
  <p class="text-sm">
    {p.checklists.answered}/{p.checklists.total} madde yanıtlandı, {p.checklists.missing} eksik (Hayır),
    {p.transfer.untransferred} eksik risk tablosuna aktarılmadı.
  </p>
{/snippet}

{#snippet riskBody()}
  <p class="text-sm">
    {p.risk.scored}/{p.risk.total} satır puanlandı; {p.risk.openSerious} açık yüksek/tolere edilemez risk,
    {p.risk.overdue} süresi geçmiş satır.
  </p>
{/snippet}

{#snippet gapsBody()}
  {#if gaps.hasGaps}
    <p class="text-sm text-muted-foreground">İmzalanacak belgede şu açık noktalar var:</p>
    <ReadinessList {gaps} />
  {:else}
    <p class="flex items-center gap-2 text-sm font-medium"><CircleCheck class="size-4" aria-hidden="true" />Açık nokta yok, PDF imzaya hazır.</p>
  {/if}
{/snippet}

<div class="flex max-w-3xl flex-col gap-4 p-4">
  <div class="flex flex-col gap-2">
    <h1 class="text-2xl font-semibold">Rapor</h1>
    <p class="text-sm text-muted-foreground">İmzaya göndermeden önce her bölümü kontrol edin; yanlış olanı "Değiştir" ile düzeltin.</p>
  </div>

  {@render section('report-school', 'Okul bilgileri ve imzacılar', null, schoolBody)}
  {@render section('report-wide', 'Okul geneli denetimler', null, schoolWideBody)}
  {@render section('report-inspections', 'Denetimler özeti', { label: 'Değiştir', run: () => nav.go('locations') }, inspectionsBody)}
  {@render section('report-risk', 'Risk tablosu özeti', { label: 'Değiştir', run: () => nav.openRegister() }, riskBody)}
  {@render section('report-gaps', 'İmza öncesi açık noktalar', null, gapsBody)}

  <Card.Root>
    <Card.Header>
      <Card.Title>Çıktılar</Card.Title>
      <Card.Description>İmzalanacak belge PDF'tir; kayıt dosyası ve Excel uygulamada tekrar açılabilir.</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col items-start gap-3">
      <Button disabled={busy} onclick={() => store.requestFullPdf()}>İmzaya hazır PDF oluştur</Button>
      <div class="flex flex-wrap gap-2">
        {#each OTHER_OUTPUTS as out (out.kind)}
          <Button variant="outline" disabled={busy} onclick={() => store.exportAs(out.kind)}>{out.label}</Button>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Yeni dönem başlat</Card.Title>
      <Card.Description>
        Dönem: {a.period.trim() || 'girilmedi'} · Geçerlilik: {a.validUntil.trim() || 'girilmedi'}. Mekânlar, listeler ve risk satırları kalır; önlem sonrası puanlar yeni puan olur, kontrol listesi cevapları ve tarihler sıfırlanır.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <Button variant="outline" disabled={busy} onclick={() => store.newPeriod()}>Yeni dönem başlat</Button>
    </Card.Content>
  </Card.Root>
</div>
