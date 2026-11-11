<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import NativeSelect from './NativeSelect.svelte';
  import { addLocation, grouped, labels, LOCATION_TYPES, LOCATION_TYPE_LABELS, newId } from '$lib/domain/assessment';
  import type { LocationType } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  const TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: LOCATION_TYPE_LABELS[value] }));
  const groups = $derived(grouped(store.assessment));
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
  }
</script>

<aside class="space-y-4 rounded-xl border bg-card p-3 md:sticky md:top-4">
  <h2 class="font-semibold">Mekânlar</h2>
  {#each groups as group (group.title)}
    <div class="space-y-1">
      {#if group.title}<h3 class="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>{/if}
      <ul class="space-y-0.5">
        {#each group.locations as loc (loc.id)}
          <li>
            <button
              type="button"
              aria-current={loc.id === store.locationId}
              class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
              onclick={() => store.selectLocation(loc.id)}
            >
              <span class="truncate">{loc.name}</span>
              <span class="text-xs opacity-70">{loc.rows.length}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Henüz mekân yok.</p>
  {/each}

  <form class="space-y-2 border-t pt-3" onsubmit={submit}>
    <h3 class="text-sm font-semibold">Yeni mekân</h3>
    <Input bind:value={name} required placeholder="Mekân adı, ör. ELE16" aria-label="Mekân adı" />
    <NativeSelect options={TYPE_OPTIONS} value={type} aria-label="Mekân türü" onchange={(e) => (type = e.currentTarget.value as LocationType)} />
    <Input bind:value={building} list="building-list" placeholder="Bina, ör. C Blok" aria-label="Bina" />
    <Input bind:value={area} list="area-list" placeholder="Alan" aria-label="Alan" />
    <Button type="submit" variant="outline" class="w-full"><Plus />Mekân ekle</Button>
    <datalist id="building-list">{#each labels(store.assessment, 'building') as v (v)}<option value={v}></option>{/each}</datalist>
    <datalist id="area-list">{#each labels(store.assessment, 'area') as v (v)}<option value={v}></option>{/each}</datalist>
  </form>
</aside>
