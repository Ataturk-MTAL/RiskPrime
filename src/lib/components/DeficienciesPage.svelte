<script lang="ts">
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import DeficiencyItem from './DeficiencyItem.svelte';
  import SelectField from './SelectField.svelte';
  import { defaultLocationId, riskRowFromChecklistItem } from '$lib/domain/checklist-risk';
  import { deficienciesWithState, deficiencyCounts, filterDeficiencies, isTransferred, SCHOOL_WIDE_FILTER } from '$lib/domain/filters';
  import { SCHOOL_WIDE_LABEL, type Deficiency } from '$lib/domain/inspections';
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

  const groups = $derived(
    shown.reduce<{ key: string; name: string; items: Deficiency[] }[]>((acc, d) => {
      const key = d.locationId ?? SCHOOL_WIDE_FILTER;
      const found = acc.find((g) => g.key === key);
      if (found) found.items.push(d);
      else acc.push({ key, name: d.locationName, items: [d] });
      return acc;
    }, []),
  );

  const patch = (changes: Partial<DeficiencyFilter>) => (nav.deficiencyFilter = { ...filter, ...changes });
  const reset = () => (nav.deficiencyFilter = { locationId: null, listId: null, state: 'all', query: '' });
  const isFiltered = $derived(filter.locationId !== null || filter.listId !== null || filter.state !== 'all' || filter.query !== '');

  function transferShown() {
    const targets = pending.flatMap((d) => {
      const list = a.checklists.find((c) => c.id === d.listId);
      const target = d.locationId ?? (list ? defaultLocationId(a, list) : '');
      return target ? [{ d, target }] : [];
    });
    if (!targets.length) {
      toast.info('Risk satırı açılacak mekân yok; önce bir mekân ekleyin.');
      return;
    }
    store.applyWithUndo(
      (x) => targets.reduce((acc, { d, target }) => riskRowFromChecklistItem(acc, d.listId, d.itemId, d.locationId, target), x),
      `${targets.length} risk satırı oluşturuldu; puanlamak için Riskler'e geçin.`,
    );
  }
</script>

<div class="mx-auto w-full max-w-5xl space-y-4 p-4">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h1 class="text-xl font-semibold">Eksikler</h1>
    <Button disabled={!pending.length} onclick={transferShown}><ShieldAlert />Görünenleri aktar ({pending.length})</Button>
  </div>

  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
    <SelectField label="Mekân" options={locationOptions} value={filter.locationId ?? ALL} onValueChange={(v) => patch({ locationId: v === ALL ? null : v })} />
    <SelectField label="Liste" options={listOptions} value={filter.listId ?? ALL} onValueChange={(v) => patch({ listId: v === ALL ? null : v })} />
    <SelectField label="Durum" options={stateOptions} value={filter.state} onValueChange={(v) => patch({ state: v as DeficiencyFilter['state'] })} />
    <Input type="search" aria-label="Eksiklerde ara" placeholder="Ara…" value={filter.query} oninput={(e) => patch({ query: e.currentTarget.value })} />
  </div>

  {#if !shown.length}
    <div class="space-y-3 rounded-lg border border-dashed p-6 text-center">
      {#if everything.length}
        <p class="text-sm text-muted-foreground">Bu süzgece uyan eksik yok.</p>
        {#if isFiltered}<Button variant="outline" size="sm" onclick={reset}>Süzgeçleri temizle</Button>{/if}
      {:else}
        <p class="text-sm text-muted-foreground">Henüz eksik yok — denetimleri doldurmak için Mekânlar'a gidin.</p>
        <Button variant="outline" size="sm" onclick={() => nav.go('locations')}>Mekânlar'a git</Button>
      {/if}
    </div>
  {:else}
    {#each groups as group (group.key)}
      <section class="space-y-2" aria-label={group.name}>
        <h2 class="text-sm font-semibold text-muted-foreground">{group.name} <span class="font-normal">({group.items.length})</span></h2>
        {#each group.items as d (d.listId + d.itemId + (d.locationId ?? ''))}
          <DeficiencyItem {d} />
        {/each}
      </section>
    {/each}
  {/if}
</div>
