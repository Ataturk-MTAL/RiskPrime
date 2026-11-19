<script lang="ts" module>
  import { addRowSource } from '$lib/domain/links';
  import { store } from '$lib/state.svelte';

  /** Links an existing risk row to the checklist item (undoable); shared with ChecklistExistingRowButton. */
  export function linkItemToRow(listId: string, itemId: string, scope: string | null, rowLocationId: string, rowId: string) {
    store.applyWithUndo((a) => addRowSource(a, rowLocationId, rowId, { listId, itemId, locationId: scope }), 'Eksik var olan riske bağlandı');
  }
</script>

<script lang="ts">
  import Link from '@lucide/svelte/icons/link';
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import SelectField from './SelectField.svelte';
  import { defaultLocationId, hasDeficiencyRisk, riskRowFromChecklistItem, similarRows } from '$lib/domain/checklist-risk';
  import type { Checklist } from '$lib/domain/types';

  /** locationId = the inspection's scope (null = okul geneli, the row's location is then chosen). */
  let { list, itemId, locationId: scope }: { list: Checklist; itemId: string; locationId: string | null } = $props();

  let open = $state(false);
  let locationId = $state('');
  const options = $derived(store.assessment.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' })));
  const target = $derived(scope ?? locationId);
  const similar = $derived(target ? similarRows(store.assessment, list.id, itemId, scope, target) : []);

  function onOpenChange(next: boolean) {
    open = next;
    if (next) locationId = scope ?? defaultLocationId(store.assessment, list);
  }

  function create(targetId: string) {
    const target = store.assessment.locations.find((l) => l.id === targetId);
    if (!target) return;
    open = false;
    if (hasDeficiencyRisk(store.assessment, list.id, itemId, scope, target.id)) {
      toast.info('Bu madde için satır zaten var');
      return;
    }
    // Undoable like every other bulk-ish edit: the toast carries "Geri al".
    store.applyWithUndo((a) => riskRowFromChecklistItem(a, list.id, itemId, scope, target.id), `Riske eklendi: ${target.name}`);
  }

  function link(rowId: string) {
    open = false;
    linkItemToRow(list.id, itemId, scope, target, rowId);
  }
</script>

<!-- Shown only where the target location is known: the scoped inspection, or the popover's chosen
     "Hedef mekân". Inline: below the item's buttons; w-0 min-w-full keeps the text from widening the answer column. -->
{#snippet hint(inline: boolean)}
  {#if similar[0]}
    {@const s = similar[0]}
    <p class="flex items-center gap-1 text-xs text-muted-foreground {inline ? 'order-last w-0 min-w-full' : 'w-full min-w-0'}">
      <span class="truncate" title={s.text}>Benzer: #{s.number} {s.text}</span>
      <span aria-hidden="true">·</span>
      <Button variant="link" size="sm" class="h-auto shrink-0 p-0 text-xs" aria-label="Benzer satır #{s.number} ile bağla" onclick={() => link(s.rowId)}><Link class="size-3" />Bağla</Button>
    </p>
  {/if}
{/snippet}

{#if scope}
  <Button variant="outline" size="sm" onclick={() => create(scope ?? '')}><ShieldAlert />Riske ekle</Button>
  {@render hint(true)}
{:else}
  <Popover.Root {open} {onOpenChange}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline" size="sm"><ShieldAlert />Riske ekle</Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-72 space-y-3">
      {#if options.length}
        <SelectField label="Hedef mekân" {options} value={locationId} onValueChange={(v) => (locationId = v)} />
        {@render hint(false)}
        <Button size="sm" onclick={() => create(locationId)}>Satır ekle</Button>
      {:else}
        <p class="text-sm text-muted-foreground">Önce bir mekân ekleyin.</p>
      {/if}
    </Popover.Content>
  </Popover.Root>
{/if}
