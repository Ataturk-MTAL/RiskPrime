<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { answerOf } from '$lib/domain/inspections';
  import { itemRiskRows } from '$lib/domain/checklist-risk';
  import type { Checklist, ChecklistItem } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import { nav } from '$lib/nav.svelte';
  import ChecklistExistingRowButton from './ChecklistExistingRowButton.svelte';
  import ChecklistRiskButton from './ChecklistRiskButton.svelte';

  let { list, item, locationId }: { list: Checklist; item: ChecklistItem; locationId: string | null } = $props();

  // Sibling-aware: a common item linked from another list at this location counts too.
  const rows = $derived(itemRiskRows(store.assessment, list.id, item.id, locationId));
  const answer = $derived(answerOf(store.assessment, list.id, locationId, item.id).answer);

  const openRow = (locationId: string, rowId: string) => nav.openRow(locationId, rowId);
</script>

{#each rows as r (r.rowId)}
  <Button variant="link" size="sm" class="h-auto justify-start p-0 text-left whitespace-normal" onclick={() => openRow(r.locationId, r.rowId)}>
    Risk satırı: {r.locationName || 'Adsız mekân'} #{r.number}
  </Button>
{/each}
{#if answer === 'yes' && rows.some((r) => store.assessment.locations.find((l) => l.id === r.locationId)?.rows.find((x) => x.id === r.rowId)?.status !== 'done')}
  <span class="text-xs text-muted-foreground">Bağlı satır hâlâ açık</span>
{/if}
{#if answer === 'no'}
  <div class="flex flex-wrap gap-2">
    {#if !rows.length}<ChecklistRiskButton {list} itemId={item.id} {locationId} />{/if}
    <ChecklistExistingRowButton {list} itemId={item.id} {locationId} />
  </div>
{/if}
