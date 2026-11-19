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
  // Every new filter object (a facet change, or re-choosing the same filter) or a newly opened document pins what it shows now.
  $effect.pre(() => {
    const f = nav.registerFilter;
    void store.loadCount;
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
    <Button variant={isDeficiencyView ? 'outline' : 'default'} size="sm" aria-pressed={!isDeficiencyView} onclick={() => nav.openRegister(filter)}>Risk satırları</Button>
    <Button variant={isDeficiencyView ? 'default' : 'outline'} size="sm" aria-pressed={isDeficiencyView} onclick={() => nav.openDeficiencies({ state: 'untransferred' })}>
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
