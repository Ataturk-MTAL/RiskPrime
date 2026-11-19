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
