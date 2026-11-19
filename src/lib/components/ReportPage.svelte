<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import type { Snippet } from 'svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import InspectionEditor from './InspectionEditor.svelte';
  import ReadinessList from './ReadinessList.svelte';
  import SchoolCard from './SchoolCard.svelte';
  import { inspectionSummary, inspectionsForList } from '$lib/domain/inspections';
  import { APP_VERSION } from '$lib/domain/app-version';
  import { isLocked, verifySnapshot, type Verification } from '$lib/domain/snapshot';
  import { progress } from '$lib/domain/progress';
  import { readiness } from '$lib/domain/readiness';
  import { formatStamp } from '$lib/lock-format';
  import { lock } from '$lib/lock.svelte';
  import { nav } from '$lib/nav.svelte';
  import { isDesktop } from '$lib/platform';
  import { periodKey } from '$lib/storage/types';
  import { store, type ExportKind } from '$lib/state.svelte';

  const OTHER_OUTPUTS: { kind: ExportKind; label: string }[] = [
    { kind: 'json', label: 'Kayıt dosyası (.json)' },
    { kind: 'xlsx', label: 'Excel kayıt (.xlsx)' },
    { kind: 'docx', label: 'Word (.docx)' },
    { kind: 'pdf-blank', label: 'Boş form (PDF)' },
    { kind: 'pdf-checklists', label: 'Yalnız kontrol listeleri (PDF)' },
  ];

  let { onPeriods }: { onPeriods: () => void } = $props();

  const a = $derived(store.assessment);
  const locked = $derived(isLocked(a));
  const day = (iso: string) => new Date(iso).toLocaleDateString('tr-TR');
  const hash = $derived(a.meta.contentHash ?? '');
  let verification = $state<Verification>('unsigned');
  // Re-verified live: an edit of a signed snapshot flips this to "modified".
  $effect(() => {
    const snapshot = a;
    let isStale = false;
    verifySnapshot(snapshot).then((v) => {
      if (!isStale) verification = v;
    });
    return () => (isStale = true);
  });
  // Desktop only: who last edited the open period (the web build has no users).
  let lastEditor = $state<{ userName: string; at: string } | null>(null);
  let editorPeriodId = '';
  // Refreshed when the assessment changes (debounced, after the 1 s archive save) and on unlock.
  const EDITOR_REFRESH_MS = 2000;
  $effect(() => {
    if (!isDesktop()) return;
    if (lock.state !== 'unlocked') {
      editorPeriodId = ''; // next unlock reloads at once
      return;
    }
    const id = periodKey(a.period, a.meta.revision);
    // First load of a period is immediate; later edits of the same period wait for the save.
    const delay = id === editorPeriodId ? EDITOR_REFRESH_MS : 0;
    editorPeriodId = id;
    let isStale = false;
    const timer = setTimeout(() => {
      lock
        .lastEditor(id)
        .then((editor) => {
          if (!isStale) lastEditor = editor;
        })
        .catch(() => {
          if (!isStale) lastEditor = null;
        });
    }, delay);
    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  });
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
  <h1 class="text-2xl font-semibold">Rapor</h1>

  {@render section('report-school', 'Okul bilgileri ve imzacılar', null, schoolBody)}
  {@render section('report-wide', 'Okul geneli denetimler', null, schoolWideBody)}
  {@render section('report-inspections', 'Denetimler özeti', { label: 'Değiştir', run: () => nav.go('locations') }, inspectionsBody)}
  {@render section('report-risk', 'Risk tablosu özeti', { label: 'Değiştir', run: () => nav.openRegister() }, riskBody)}
  {@render section('report-gaps', 'İmza öncesi açık noktalar', null, gapsBody)}

  <Card.Root>
    <Card.Header>
      <Card.Title>Dönem</Card.Title>
      <Card.Description>{a.period.trim() || 'Dönem girilmedi'} · Revizyon {a.meta.revision}</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col items-start gap-3">
      <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 text-sm">
        <dt class="text-muted-foreground">Durum</dt>
        <dd><Badge variant={locked ? 'default' : 'secondary'}>{locked ? `İmzalandı${a.meta.signedAt ? ` · ${day(a.meta.signedAt)}` : ''}` : 'Taslak'}</Badge></dd>
        {#if isDesktop() && lastEditor}
          <dt class="text-muted-foreground max-md:hidden">Son düzenleyen</dt>
          <dd class="max-md:hidden">{lastEditor.userName}, {formatStamp(lastEditor.at)}</dd>
        {/if}
        <dt class="text-muted-foreground">Kontrol listeleri sürümü</dt>
        <dd>{a.meta.bankVersion}</dd>
        <dt class="text-muted-foreground">Uygulama sürümü</dt>
        <dd>{a.meta.appVersion || APP_VERSION}</dd>
        {#if locked && hash}
          <dt class="text-muted-foreground">Özet (SHA-256)</dt>
          <dd class="font-mono" title={hash}>{hash.slice(0, 12)}</dd>
        {/if}
      </dl>
      {#if locked && verification === 'ok'}
        <Badge variant="outline"><CircleCheck aria-hidden="true" />Bütünlük doğrulandı</Badge>
      {:else if locked && verification === 'modified'}
        <Badge variant="destructive">İçerik imzadan sonra değişmiş!</Badge>
      {/if}
      <div class="flex flex-wrap gap-2">
        {#if locked}
          <Button disabled={busy} onclick={() => store.reviseLocked()}>Düzeltme taslağı aç</Button>
        {:else}
          <AlertDialog.Root>
            <AlertDialog.Trigger class={buttonVariants()} disabled={busy}>Dönemi kapat (imzalandı)</AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Dönem kapatılsın mı?</AlertDialog.Title>
                <AlertDialog.Description>
                  Dönem kilitlenir ve içeriğin özeti (mühür) saklanır. Sonradan değişiklik için düzeltme taslağı açmanız gerekir. Kapatmadan önce PDF'i ve .json kayıt dosyasını indirmeniz önerilir.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
                <AlertDialog.Action onclick={() => store.closePeriod()}>Dönemi kapat</AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        {/if}
        <Button variant="outline" onclick={onPeriods}>Önceki dönemler</Button>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Çıktılar</Card.Title>
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
