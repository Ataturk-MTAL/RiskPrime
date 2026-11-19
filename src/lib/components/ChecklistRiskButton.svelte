<script lang="ts">
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import SelectField from './SelectField.svelte';
  import { defaultLocationId, hasDeficiencyRisk, riskRowFromChecklistItem } from '$lib/domain/checklist-risk';
  import type { Checklist } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  /** locationId = the inspection's scope (null = okul geneli, the row's location is then chosen). */
  let { list, itemId, locationId: scope }: { list: Checklist; itemId: string; locationId: string | null } = $props();

  let open = $state(false);
  let locationId = $state('');
  const options = $derived(store.assessment.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' })));

  function onOpenChange(next: boolean) {
    open = next;
    if (next) locationId = defaultLocationId(store.assessment, list);
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
</script>

{#if scope}
  <Button variant="outline" size="sm" onclick={() => create(scope ?? '')}><ShieldAlert />Riske ekle</Button>
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
        <Button size="sm" onclick={() => create(locationId)}>Satır ekle</Button>
      {:else}
        <p class="text-sm text-muted-foreground">Önce bir mekân ekleyin.</p>
      {/if}
    </Popover.Content>
  </Popover.Root>
{/if}
