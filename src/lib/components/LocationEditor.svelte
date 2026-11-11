<script lang="ts">
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import SelectField from './SelectField.svelte';
  import RiskRowCard from './RiskRowCard.svelte';
  import RiskRowSheet from './RiskRowSheet.svelte';
  import RiskTable from './RiskTable.svelte';
  import { addRow, LOCATION_TYPES, LOCATION_TYPE_LABELS, moveLocation, newId, removeLocation, updateLocation } from '$lib/domain/assessment';
  import type { LocationType } from '$lib/domain/types';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { focusFirstField, store } from '$lib/state.svelte';

  const TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: LOCATION_TYPE_LABELS[value] }));
  const loc = $derived(store.location);
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();

  let openId = $state<string | null>(null);
  let metaOpen = $state(false);
  const isDesktop = new MediaQuery('min-width: 48rem');
  const typeLabel = $derived(loc ? LOCATION_TYPE_LABELS[loc.type] : '');

  function addNewRow(locationId: string) {
    const id = newId('r');
    if (!store.apply((a) => addRow(a, locationId, { id }))) return;
    openId = id;
    focusFirstField('row-sheet-body', 300);
  }
</script>

<section class="@container min-w-0 space-y-3 rounded-xl border bg-card p-3">
  {#if loc}
    {@const locId = loc.id}
    {#key locId}
      <Collapsible.Root open={isDesktop.current || metaOpen} onOpenChange={(o) => (metaOpen = o)}>
      <Collapsible.Trigger class="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm md:hidden">
        <span class="min-w-0 truncate"><b>{loc.name}</b> · {typeLabel}{loc.building ? ` · ${loc.building}` : ''}{loc.area ? ` · ${loc.area}` : ''}</span>
        <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">Mekân bilgileri<ChevronsUpDown class="size-4" aria-hidden="true" /></span>
      </Collapsible.Trigger>
      <Collapsible.Content class="mt-2 md:mt-0">
      <div class="grid items-end gap-2 @lg:grid-cols-2 @3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Label class="flex flex-col items-start gap-1 @lg:col-span-2 @3xl:col-span-1">Mekân adı
          <Input value={loc.name} onchange={(e) => store.apply((a) => updateLocation(a, locId, { name: value(e) }))} />
        </Label>
        <Label class="flex flex-col items-start gap-1">Tür
          <SelectField label="Tür" options={TYPE_OPTIONS} value={loc.type} onValueChange={(v) => store.apply((a) => updateLocation(a, locId, { type: v as LocationType }))} />
        </Label>
        <Label class="flex flex-col items-start gap-1">Bina
          <Input list="building-list" value={loc.building} placeholder="ör. C Blok" onchange={(e) => store.apply((a) => updateLocation(a, locId, { building: value(e) }))} />
        </Label>
        <Label class="flex flex-col items-start gap-1">Alan
          <Input list="area-list" value={loc.area} onchange={(e) => store.apply((a) => updateLocation(a, locId, { area: value(e) }))} />
        </Label>
        <div class="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Mekânı yukarı taşı" onclick={() => store.apply((a) => moveLocation(a, locId, -1))}><ArrowUp /></Button>
          <Button variant="outline" size="icon" aria-label="Mekânı aşağı taşı" onclick={() => store.apply((a) => moveLocation(a, locId, 1))}><ArrowDown /></Button>
          <ConfirmDialog
            label="Mekânı sil"
            variant="destructive"
            size="default"
            title="Mekân silinsin mi?"
            description={`"${loc.name}" ve ${loc.rows.length} satırı silinecek.`}
            onconfirm={() => store.apply((a) => removeLocation(a, locId))}
          ><Trash2 />Mekânı sil</ConfirmDialog>
        </div>
      </div>
      </Collapsible.Content>
      </Collapsible.Root>
    {/key}

    {#if loc.rows.length === 0}
      <p class="py-6 text-center text-sm text-muted-foreground">Bu mekânda risk satırı yok. "Satır ekle" ile başlayın ya da "+ Hazır formdan ekle".</p>
    {/if}
    <div class="hidden @3xl:block">
      {#if loc.rows.length}<RiskTable rows={loc.rows} locationId={locId} {openId} onopen={(id) => (openId = id)} />{/if}
    </div>
    <div class="space-y-3 @3xl:hidden">
      {#each loc.rows as row, i (row.id)}
        <RiskRowCard {row} index={i + 1} locationId={locId} onopen={(id) => (openId = id)} />
      {/each}
    </div>
    <RiskRowSheet rows={loc.rows} locationId={locId} bind:openId />
    <Button onclick={() => addNewRow(locId)}><Plus />Satır ekle</Button>
  {:else}
    <p class="py-8 text-center text-sm text-muted-foreground">Soldan bir mekân seçin ya da yeni mekân ekleyin.</p>
  {/if}
</section>
