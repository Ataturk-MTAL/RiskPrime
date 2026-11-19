<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import ExportMenu from './ExportMenu.svelte';
  import PageHeader from './PageHeader.svelte';
  import ReadinessList from './ReadinessList.svelte';
  import { SECTION_TITLE } from './shared-classes';
  import { APP_VERSION } from '$lib/domain/app-version';
  import { isLocked, verifySnapshot, type Verification } from '$lib/domain/snapshot';
  import { readiness } from '$lib/domain/readiness';
  import { formatStamp } from '$lib/lock-format';
  import { lock } from '$lib/lock.svelte';
  import { isDesktop } from '$lib/platform';
  import { periodKey } from '$lib/storage/types';
  import { store } from '$lib/state.svelte';

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
  const gaps = $derived(readiness(a));
  const busy = $derived(store.busy !== '');
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
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
          <Button variant="link" class="h-auto p-0" disabled={busy} onclick={() => store.newPeriod()}>Yeni dönem başlat</Button>
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
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header><Card.Title>Çıktılar</Card.Title></Card.Header>
    <Card.Content><ExportMenu /></Card.Content>
  </Card.Root>
</div>
