<script lang="ts">
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import FunnelX from '@lucide/svelte/icons/funnel-x';
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import DeficiencyItem from './DeficiencyItem.svelte';
  import EmptyState from './EmptyState.svelte';
  import SelectField from './SelectField.svelte';
  import { SECTION_TITLE } from './shared-classes';
  import { defaultLocationId } from '$lib/domain/checklist-risk';
  import { addRowsForDeficiencies } from '$lib/domain/transfer';
  import { deficienciesWithState, deficiencyCounts, filterDeficiencies, groupByLocation, isTransferred, SCHOOL_WIDE_FILTER } from '$lib/domain/filters';
  import { SCHOOL_WIDE_LABEL } from '$lib/domain/inspections';
  import { nav, type DeficiencyFilter } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const ALL = 'all';

  const a = $derived(store.assessment);
  const filter = $derived(nav.deficiencyFilter);
  const everything = $derived(deficienciesWithState(a));
  const shown = $derived(filterDeficiencies(everything, filter));
  const counts = $derived(deficiencyCounts(everything, filter));
  const pending = $derived(shown.filter((d) => !isTransferred(d)));

  const locationOptions = $derived([
    { value: ALL, label: 'Tüm mekânlar' },
    { value: SCHOOL_WIDE_FILTER, label: SCHOOL_WIDE_LABEL },
    ...a.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' })),
  ]);
  const listOptions = $derived([{ value: ALL, label: 'Tüm listeler' }, ...a.checklists.map((c) => ({ value: c.id, label: c.name }))]);
  const stateOptions = $derived([
    { value: 'all', label: `Tümü (${counts.all})` },
    { value: 'untransferred', label: `Risk tablosuna aktarılmamış (${counts.untransferred})` },
    { value: 'transferred', label: `Aktarılmış (${counts.transferred})` },
  ]);

  const groups = $derived(groupByLocation(shown));

  const patch = (changes: Partial<DeficiencyFilter>) => (nav.deficiencyFilter = { ...filter, ...changes });
  const reset = () => (nav.deficiencyFilter = { locationId: null, listId: null, state: 'all', query: '' });
  const isFiltered = $derived(filter.locationId !== null || filter.listId !== null || filter.state !== 'all' || filter.query !== '');

  function transferShown() {
    const targets = pending.flatMap((d) => {
      const list = a.checklists.find((c) => c.id === d.listId);
      const target = d.locationId ?? (list ? defaultLocationId(a, list) : '');
      return target ? [{ listId: d.listId, itemId: d.itemId, locationId: d.locationId, target }] : [];
    });
    if (!targets.length) {
      toast.info('Risk satırı açılacak mekân yok; önce bir mekân ekleyin.');
      return;
    }
    const { assessment, created } = addRowsForDeficiencies(a, targets);
    if (!created) {
      toast.info('Görünen eksiklerin hepsinin risk satırı zaten var.');
      return;
    }
    store.applyWithUndo(() => assessment, `${created} risk satırı oluşturuldu; puanlamak için Riskler'e geçin.`);
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex justify-end">
    <Button variant="outline" disabled={!pending.length} onclick={transferShown}><ShieldAlert />Görünenleri riske ekle ({pending.length})</Button>
  </div>

  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
    <SelectField label="Mekân" options={locationOptions} value={filter.locationId ?? ALL} onValueChange={(v) => patch({ locationId: v === ALL ? null : v })} />
    <SelectField label="Liste" options={listOptions} value={filter.listId ?? ALL} onValueChange={(v) => patch({ listId: v === ALL ? null : v })} />
    <SelectField label="Durum" options={stateOptions} value={filter.state} onValueChange={(v) => patch({ state: v as DeficiencyFilter['state'] })} />
    <Input type="search" aria-label="Eksiklerde ara" placeholder="Ara…" value={filter.query} oninput={(e) => patch({ query: e.currentTarget.value })} />
  </div>

  {#if !shown.length}
    {#if everything.length}
      <EmptyState icon={FunnelX} text="Bu süzgece uyan eksik yok." action={isFiltered ? { label: 'Süzgeçleri temizle', run: reset } : undefined} />
    {:else}
      <EmptyState icon={ClipboardCheck} text="Henüz eksik yok." action={{ label: "Mekânlar'a git", run: () => nav.go('locations') }} />
    {/if}
  {:else}
    {#each groups as group (group.key)}
      <section class="space-y-2" aria-label={group.name}>
        <h2 class={SECTION_TITLE}>{group.name} <span class="font-normal">({group.items.length})</span></h2>
        {#each group.items as d (d.listId + d.itemId + (d.locationId ?? ''))}
          <DeficiencyItem {d} />
        {/each}
      </section>
    {/each}
  {/if}
</div>
