<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Link from '@lucide/svelte/icons/link';
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import SelectField from './SelectField.svelte';
  import { defaultLocationId, riskRowFromChecklistItem } from '$lib/domain/checklist-risk';
  import type { Deficiency } from '$lib/domain/inspections';
  import { addRowSource, rowsForItem } from '$lib/domain/links';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const LABEL_LENGTH = 40;

  let { d }: { d: Deficiency } = $props();

  const a = $derived(store.assessment);
  const list = $derived(a.checklists.find((c) => c.id === d.listId));
  const linked = $derived(
    [{ listId: d.listId, itemId: d.itemId }, ...(d.siblings ?? [])]
      .flatMap((t) => rowsForItem(a, t.listId, t.itemId, d.locationId))
      .filter((r, i, all) => all.findIndex((x) => x.rowId === r.rowId) === i),
  );
  const refs = $derived([d.ref, ...(d.siblings ?? []).map((s) => s.ref)].filter(Boolean));
  const locationOptions = $derived(a.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' })));

  let createOpen = $state(false);
  let linkOpen = $state(false);
  let target = $state('');
  const rowOptions = $derived.by(() => {
    const taken = new Set(linked.map((r) => r.rowId));
    const rows = a.locations.find((l) => l.id === target)?.rows ?? [];
    return rows.flatMap((r, i) => (taken.has(r.id) ? [] : [{ value: r.id, label: `#${i + 1} · ${(r.equipment || r.hazard || 'Boş satır').slice(0, LABEL_LENGTH)}` }]));
  });

  const defaultTarget = () => d.locationId ?? (list ? defaultLocationId(a, list) : '');

  function create(locationId: string) {
    createOpen = false;
    if (!store.apply((x) => riskRowFromChecklistItem(x, d.listId, d.itemId, d.locationId, locationId))) return;
    toast.success('Risk satırı eklendi');
  }

  function link(rowId: string) {
    linkOpen = false;
    if (!store.apply((x) => addRowSource(x, target, rowId, { listId: d.listId, itemId: d.itemId, locationId: d.locationId }))) return;
    toast.success('Eksik var olan riske bağlandı');
  }
</script>

<article class="space-y-2 rounded-lg border bg-background p-3">
  <div class="flex flex-wrap items-start gap-2">
    <p class="min-w-0 flex-1 text-sm font-semibold"><span class="text-muted-foreground">{d.itemNo}.</span> {d.text}</p>
    {#if refs.length}<Badge variant="outline">{refs.join(' · ')}</Badge>{/if}
  </div>
  <p class="text-xs text-muted-foreground">{d.listCode ? `${d.listCode} · ` : ''}{d.listName}</p>
  {#if d.note}<p class="text-sm">{d.note}</p>{/if}
  <div class="flex flex-wrap items-center gap-2">
    {#each linked as r (r.rowId)}
      <Button variant="secondary" size="sm" onclick={() => nav.openRow(r.locationId, r.rowId)}>Risk satırı #{r.number}{d.locationId === null ? ` · ${r.locationName}` : ''}</Button>
    {:else}
      {#if d.locationId === null}
        <Popover.Root bind:open={createOpen} onOpenChange={(o) => o && (target = defaultTarget())}>
          <Popover.Trigger>
            {#snippet child({ props })}<Button {...props} variant="outline" size="sm"><ShieldAlert />Riske çevir</Button>{/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-72 space-y-3">
            {#if locationOptions.length}
              <SelectField label="Hedef mekân" options={locationOptions} value={target} onValueChange={(v) => (target = v)} />
              <Button size="sm" onclick={() => create(target)}>Satır ekle</Button>
            {:else}
              <p class="text-sm text-muted-foreground">Önce bir mekân ekleyin.</p>
            {/if}
          </Popover.Content>
        </Popover.Root>
      {:else}
        <Button variant="outline" size="sm" onclick={() => create(d.locationId!)}><ShieldAlert />Riske çevir</Button>
      {/if}
    {/each}
    <Popover.Root bind:open={linkOpen} onOpenChange={(o) => o && (target = defaultTarget())}>
      <Popover.Trigger>
        {#snippet child({ props })}<Button {...props} variant="outline" size="sm"><Link />Var olan riske bağla</Button>{/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-72 space-y-3">
        {#if locationOptions.length}
          <SelectField label="Mekân" options={locationOptions} value={target} onValueChange={(v) => (target = v)} />
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
    <Button variant="ghost" size="sm" onclick={() => (d.locationId ? nav.openLocation(d.locationId, d.listId) : nav.openSchool())}><ExternalLink />Denetimde aç</Button>
  </div>
</article>
