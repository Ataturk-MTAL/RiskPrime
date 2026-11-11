<script lang="ts">
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import NativeSelect from './NativeSelect.svelte';
  import RiskRowCard from './RiskRowCard.svelte';
  import { addRow, LOCATION_TYPES, LOCATION_TYPE_LABELS, moveLocation, newId, removeLocation, updateLocation } from '$lib/domain/assessment';
  import type { LocationType } from '$lib/domain/types';
  import { focusFirstField, store } from '$lib/state.svelte';

  const TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: LOCATION_TYPE_LABELS[value] }));
  const loc = $derived(store.location);
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();

  function addNewRow(locationId: string) {
    const id = newId('r');
    if (store.apply((a) => addRow(a, locationId, { id }))) focusFirstField(`row-${id}`);
  }
</script>

<section class="@container min-w-0 space-y-3 rounded-xl border bg-card p-3">
  {#if loc}
    {@const locId = loc.id}
    {#key locId}
      <div class="grid items-end gap-2 @lg:grid-cols-2 @3xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <Label class="flex flex-col items-start gap-1 @lg:col-span-2 @3xl:col-span-1">Mekân adı
          <Input value={loc.name} onchange={(e) => store.apply((a) => updateLocation(a, locId, { name: value(e) }))} />
        </Label>
        <Label class="flex flex-col items-start gap-1">Tür
          <NativeSelect options={TYPE_OPTIONS} value={loc.type} onchange={(e) => store.apply((a) => updateLocation(a, locId, { type: e.currentTarget.value as LocationType }))} />
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
          >Mekânı sil</ConfirmDialog>
        </div>
      </div>
    {/key}

    <div class="space-y-3">
      {#each loc.rows as row, i (row.id)}
        <RiskRowCard {row} index={i + 1} locationId={locId} />
      {:else}
        <p class="py-6 text-center text-sm text-muted-foreground">Bu mekânda risk satırı yok. "Satır ekle" ile başlayın ya da "+ Hazır formdan ekle".</p>
      {/each}
    </div>
    <Button onclick={() => addNewRow(locId)}><Plus />Satır ekle</Button>
  {:else}
    <p class="py-8 text-center text-sm text-muted-foreground">Soldan bir mekân seçin ya da yeni mekân ekleyin.</p>
  {/if}
</section>
