<script lang="ts">
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import Clock from '@lucide/svelte/icons/clock';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Library from '@lucide/svelte/icons/library';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Plus from '@lucide/svelte/icons/plus';
  import School from '@lucide/svelte/icons/school';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import EmptyState from './EmptyState.svelte';
  import LibraryDialog from './LibraryDialog.svelte';
  import NewLocationDialog from './NewLocationDialog.svelte';
  import PageHeader from './PageHeader.svelte';
  import { INTERACTIVE_ROW, SECTION_TITLE } from './shared-classes';
  import { grouped, isOverdue, LOCATION_TYPE_LABELS } from '$lib/domain/assessment';
  import { inspectionsForLocation, inspectionSummary } from '$lib/domain/inspections';
  import { riskLevel } from '$lib/domain/matrix';
  import { progress } from '$lib/domain/progress';
  import type { Location } from '$lib/domain/types';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const SERIOUS = ['high', 'intolerable'];
  const today = new Date();

  const schoolWide = $derived(progress(store.assessment, today).schoolWide);

  let query = $state('');
  let dialogOpen = $state(false);
  let libraryOpen = $state(false);

  const groups = $derived(
    grouped(store.assessment)
      .map((g) => ({ ...g, locations: g.locations.filter((l) => (l.name || 'Adsız mekân').toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr'))) }))
      .filter((g) => g.locations.length),
  );

  function statsOf(l: Location) {
    const sums = inspectionsForLocation(store.assessment, l.id).map((i) => inspectionSummary(store.assessment, i));
    const levels = l.rows.map((r) => riskLevel(r.likelihood, r.severity));
    return {
      inspections: sums.length,
      answered: sums.reduce((n, s) => n + s.answered, 0),
      total: sums.reduce((n, s) => n + s.total, 0),
      no: sums.reduce((n, s) => n + s.no, 0),
      scored: levels.filter(Boolean).length,
      serious: levels.filter((v) => v && SERIOUS.includes(v.key)).length,
      overdue: l.rows.filter((r) => isOverdue(r, today)).length,
    };
  }
</script>

<div class="flex flex-col gap-6">
  <PageHeader title="Mekânlar">
    {#snippet actions()}
      <Button variant="outline" onclick={() => (libraryOpen = true)}><Library />Hazır mekân ekle</Button>
      <Button onclick={() => (dialogOpen = true)}><Plus />Mekân ekle</Button>
    {/snippet}
  </PageHeader>
  <NewLocationDialog bind:open={dialogOpen} />
  <LibraryDialog bind:open={libraryOpen} />

  {#if schoolWide.total}
    <button type="button" class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center gap-3 rounded-md border p-3 text-left" onclick={() => nav.openSchool()}>
      <School class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span class="min-w-0 flex-1 font-medium">Okul geneli kontrol listeleri</span>
      <span class="text-sm text-muted-foreground">{schoolWide.answered}/{schoolWide.total} cevaplı · Okul</span>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  {/if}

  {#if store.assessment.locations.length === 0}
    <EmptyState icon={MapPin} text="Henüz mekân yok. Mekân ekleyin ya da hazır mekân listesinden başlayın." action={{ label: 'Hazır mekân ekle', run: () => (libraryOpen = true) }} />
  {:else}
    <Input type="search" class="max-w-sm" aria-label="Mekânlarda ara" placeholder="Mekân adına göre ara" bind:value={query} />
    {#each groups as group (group.title)}
      <section class="space-y-2">
        {#if group.title}<h2 class={SECTION_TITLE}>{group.title}</h2>{/if}
        <ul class="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {#each group.locations as l (l.id)}
            {@const s = statsOf(l)}
            <li>
              <button type="button" class="{INTERACTIVE_ROW} flex min-h-11 w-full flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left" onclick={() => nav.openLocation(l.id)}>
                <span class="font-semibold">{l.name || 'Adsız mekân'}</span>
                <span class="text-xs text-muted-foreground">{LOCATION_TYPE_LABELS[l.type]}{l.building ? ` · ${l.building}` : ''}</span>
                {#if l.type === 'common'}
                  <span class="text-sm text-muted-foreground">Listeler Okul sayfasında</span>
                {:else if s.total}
                  <span class="text-sm">Kontrol listeleri: {s.answered}/{s.total} cevaplı{#if s.no} · <b class="text-deficiency">{s.no} eksik</b>{/if}</span>
                {/if}
                <span class="text-sm">Risk satırı: {s.scored}/{l.rows.length} puanlı</span>
                {#if s.serious || s.overdue}
                  <span class="flex flex-wrap gap-1">
                    {#if s.serious}<Badge variant="destructive"><CircleAlert />{s.serious} yüksek/tolere edilemez</Badge>{/if}
                    {#if s.overdue}<Badge variant="outline"><Clock />{s.overdue} süresi geçmiş</Badge>{/if}
                  </span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      <EmptyState icon={SearchX} text="Bu adla mekân yok." action={{ label: 'Aramayı temizle', run: () => (query = '') }} />
    {/each}
  {/if}
</div>
