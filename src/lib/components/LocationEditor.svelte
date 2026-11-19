<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import SelectField from './SelectField.svelte';
  import RiskRowCard from './RiskRowCard.svelte';
  import RiskRowSheet, { ADD_ROW_BUTTON_ID } from './RiskRowSheet.svelte';
  import RiskTable from './RiskTable.svelte';
  import { addRow, filterRows, ROW_FILTERS, ROW_FILTER_LABELS, newId, type RowFilter } from '$lib/domain/assessment';
  import { focusFirstField, store } from '$lib/state.svelte';
  import { nav } from '$lib/nav.svelte';

  // The risk table of one location (the "Risk tablosu" tab of LocationDetail).
  let { locationId }: { locationId: string } = $props();

  const loc = $derived(store.assessment.locations.find((l) => l.id === locationId));
  let openId = $state<string | null>(null);

  const FILTER_OPTIONS = ROW_FILTERS.map((value) => ({ value, label: ROW_FILTER_LABELS[value] }));
  let query = $state('');
  let filter = $state<RowFilter>('all');
  const today = new Date();
  const shown = $derived(loc ? filterRows(loc.rows, query, filter, today) : []);

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
  <div class="@container min-w-0 space-y-3">
    {#if loc.rows.length === 0}
      <p class="py-6 text-center text-sm text-muted-foreground">Bu mekânda risk satırı yok.</p>
    {:else}
      <div class="flex flex-wrap items-end gap-2">
        <Label class="flex min-w-48 flex-1 flex-col items-start gap-1 text-xs text-muted-foreground">Satırlarda ara
          <Input type="search" class="text-foreground" placeholder="Ekipman, tehlike, faaliyet, sorumlu" bind:value={query} />
        </Label>
        <div class="w-44 space-y-1 text-xs text-muted-foreground">
          <span aria-hidden="true">Göster</span>
          <SelectField label="Göster" options={FILTER_OPTIONS} value={filter} onValueChange={(v) => (filter = v as RowFilter)} />
        </div>
        <p class="pb-2 text-sm text-muted-foreground" role="status">{shown.length} / {loc.rows.length} satır</p>
      </div>
      {#if shown.length === 0}
        <p class="py-6 text-center text-sm text-muted-foreground">Eşleşen satır yok.</p>
      {/if}
    {/if}
    <div class="hidden @3xl:block">
      {#if shown.length}<RiskTable items={shown} {locationId} {openId} onopen={(id) => (openId = id)} />{/if}
    </div>
    <div class="space-y-3 @3xl:hidden">
      {#each shown as { row, number } (row.id)}
        <RiskRowCard {row} index={number} {locationId} onopen={(id) => (openId = id)} />
      {/each}
    </div>
    <RiskRowSheet rows={loc.rows} {locationId} bind:openId />
    <Button id={ADD_ROW_BUTTON_ID} onclick={addNewRow}><Plus />Satır ekle</Button>
  </div>
{/if}
