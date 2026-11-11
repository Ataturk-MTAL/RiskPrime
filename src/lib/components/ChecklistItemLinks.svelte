<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { rowsForItem } from '$lib/domain/links';
  import type { Checklist, ChecklistItem } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import ChecklistExistingRowButton from './ChecklistExistingRowButton.svelte';
  import ChecklistRiskButton from './ChecklistRiskButton.svelte';

  let { list, item }: { list: Checklist; item: ChecklistItem } = $props();

  const rows = $derived(rowsForItem(store.assessment, list.id, item.id));

  const openRow = (locationId: string, rowId: string) => store.openRow(locationId, rowId);
</script>

{#each rows as r (r.rowId)}
  <Button variant="link" size="sm" class="h-auto justify-start p-0 text-left whitespace-normal" onclick={() => openRow(r.locationId, r.rowId)}>
    Risk satırı: {r.locationName || 'Adsız mekân'} #{r.number}
  </Button>
{/each}
{#if item.answer === 'yes' && rows.some((r) => store.assessment.locations.find((l) => l.id === r.locationId)?.rows.find((x) => x.id === r.rowId)?.status !== 'done')}
  <span class="text-xs text-muted-foreground">Bağlı satır hâlâ açık</span>
{/if}
{#if item.answer === 'no'}
  <div class="flex flex-wrap gap-2">
    {#if !rows.length}<ChecklistRiskButton {list} itemId={item.id} />{/if}
    <ChecklistExistingRowButton {list} itemId={item.id} />
  </div>
{/if}
