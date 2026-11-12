<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import SelectField from './SelectField.svelte';
  import { addLocation, labels, LOCATION_TYPES, LOCATION_TYPE_LABELS, newId } from '$lib/domain/assessment';
  import type { LocationType } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: LOCATION_TYPE_LABELS[value] }));
  let name = $state('');
  let type = $state<LocationType>('workshop');
  let building = $state('');
  let area = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const id = newId('a');
    if (!store.apply((a) => addLocation(a, { id, name, type, building, area }))) return;
    store.selectLocation(id);
    name = building = area = '';
    open = false;
  }
</script>

<!-- Also feed the building/area fields of LocationEditor. -->
<datalist id="building-list">{#each labels(store.assessment, 'building') as v (v)}<option value={v}></option>{/each}</datalist>
<datalist id="area-list">{#each labels(store.assessment, 'area') as v (v)}<option value={v}></option>{/each}</datalist>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Yeni mekân</Dialog.Title>
      <Dialog.Description>Atölye, depo, ofis gibi bir mekân ekleyin; risk satırları mekâna bağlıdır.</Dialog.Description>
    </Dialog.Header>
    <form class="space-y-2" onsubmit={submit}>
      <Input bind:value={name} required placeholder="Mekân adı, ör. ELE16" aria-label="Mekân adı" />
      <SelectField label="Mekân türü" options={TYPE_OPTIONS} value={type} onValueChange={(v) => (type = v as LocationType)} />
      <Input bind:value={building} list="building-list" placeholder="Bina, ör. C Blok" aria-label="Bina" />
      <Input bind:value={area} list="area-list" placeholder="Alan" aria-label="Alan" />
      <Button type="submit" class="w-full"><Plus />Mekân ekle</Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
