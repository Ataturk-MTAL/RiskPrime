<script lang="ts">
  import Link from '@lucide/svelte/icons/link';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import SelectField from './SelectField.svelte';
  import { defaultLocationId } from '$lib/domain/checklist-risk';
  import { addRowSource, rowsForItem } from '$lib/domain/links';
  import type { Checklist } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  const LABEL_LENGTH = 40;

  let { list, itemId }: { list: Checklist; itemId: string } = $props();

  let open = $state(false);
  let locationId = $state('');
  const locationOptions = $derived(store.assessment.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' })));
  const rowOptions = $derived.by(() => {
    const linked = new Set(rowsForItem(store.assessment, list.id, itemId).map((r) => r.rowId));
    const rows = store.assessment.locations.find((l) => l.id === locationId)?.rows ?? [];
    return rows.flatMap((r, i) =>
      linked.has(r.id) ? [] : [{ value: r.id, label: `#${i + 1} · ${(r.equipment || r.hazard || 'Boş satır').slice(0, LABEL_LENGTH)}` }],
    );
  });

  function onOpenChange(next: boolean) {
    open = next;
    if (next) locationId = defaultLocationId(store.assessment, list);
  }

  function link(rowId: string) {
    open = false;
    if (!store.apply((a) => addRowSource(a, locationId, rowId, { listId: list.id, itemId }))) return;
    toast.success('Madde var olan satıra bağlandı');
  }
</script>

<Popover.Root {open} {onOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="sm"><Link />Var olan satıra bağla</Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-72 space-y-3">
    {#if locationOptions.length}
      <SelectField label="Mekân" options={locationOptions} value={locationId} onValueChange={(v) => (locationId = v)} />
      {#if rowOptions.length}
        <SelectField label="Risk satırı" options={rowOptions} value="" onValueChange={link} />
      {:else}
        <p class="text-sm text-muted-foreground">Bu mekânda bağlanabilecek satır yok.</p>
      {/if}
    {:else}
      <p class="text-sm text-muted-foreground">Önce bir mekân ekleyin.</p>
    {/if}
  </Popover.Content>
</Popover.Root>
