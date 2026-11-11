<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Input } from '$lib/components/ui/input';
  import SelectField from './SelectField.svelte';
  import { addLocation, grouped, isOverdue, labels, LOCATION_TYPES, LOCATION_TYPE_LABELS, newId } from '$lib/domain/assessment';
  import { isScore } from '$lib/domain/matrix';
  import type { Location, LocationType } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  const TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: LOCATION_TYPE_LABELS[value] }));
  const groups = $derived(grouped(store.assessment));
  const mobileOptions = $derived(
    groups.flatMap((g) =>
      g.locations.map((loc) => ({ value: loc.id, label: `${g.title ? `${g.title} · ` : ''}${loc.name}`, hint: progressText(loc) })),
    ),
  );
  let name = $state('');
  let type = $state<LocationType>('workshop');
  let building = $state('');
  let area = $state('');
  let addOpen = $state(false);

  const today = new Date();
  const overdueCount = (loc: Location) => loc.rows.filter((r) => isOverdue(r, today)).length;
  const scoredCount = (loc: Location) => loc.rows.filter((r) => isScore(r.likelihood) && isScore(r.severity)).length;
  const isComplete = (loc: Location) => loc.rows.length > 0 && scoredCount(loc) === loc.rows.length;
  const progressText = (loc: Location) => `${scoredCount(loc)}/${loc.rows.length}`;

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const id = newId('a');
    if (!store.apply((a) => addLocation(a, { id, name, type, building, area }))) return;
    store.selectLocation(id);
    name = building = area = '';
    addOpen = false;
  }
</script>

{#snippet newLocationForm()}
  <form class="space-y-2" onsubmit={submit}>
    <Input bind:value={name} required placeholder="Mekân adı, ör. ELE16" aria-label="Mekân adı" />
    <SelectField label="Mekân türü" options={TYPE_OPTIONS} value={type} onValueChange={(v) => (type = v as LocationType)} />
    <Input bind:value={building} list="building-list" placeholder="Bina, ör. C Blok" aria-label="Bina" />
    <Input bind:value={area} list="area-list" placeholder="Alan" aria-label="Alan" />
    <Button type="submit" variant="outline" class="w-full"><Plus />Mekân ekle</Button>
  </form>
{/snippet}

<datalist id="building-list">{#each labels(store.assessment, 'building') as v (v)}<option value={v}></option>{/each}</datalist>
<datalist id="area-list">{#each labels(store.assessment, 'area') as v (v)}<option value={v}></option>{/each}</datalist>

<aside class="space-y-3 rounded-xl border bg-card p-3 md:hidden">
  <h2 class="sr-only">Mekânlar</h2>
  {#if mobileOptions.length}
    <div class="space-y-1 text-xs text-muted-foreground">
      <span aria-hidden="true">Mekân</span>
      <SelectField label="Mekân" options={mobileOptions} value={store.locationId ?? ''} onValueChange={(v) => store.selectLocation(v)} />
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Henüz mekân yok.</p>
  {/if}
  <Collapsible.Root bind:open={addOpen}>
    <Collapsible.Trigger class="flex min-h-11 w-full items-center justify-center gap-1 rounded-md border text-sm font-medium"><Plus class="size-4" aria-hidden="true" />Mekân ekle</Collapsible.Trigger>
    <Collapsible.Content class="pt-2">{@render newLocationForm()}</Collapsible.Content>
  </Collapsible.Root>
</aside>

<aside class="hidden space-y-4 rounded-xl border bg-card p-3 md:sticky md:top-4 md:block">
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
              <span class="flex shrink-0 items-center gap-1 text-xs opacity-70">
                {#if isComplete(loc)}<Check class="size-3.5" aria-hidden="true" /><span class="sr-only">tamamlandı</span>{/if}
                {#if overdueCount(loc) > 0}<span class="font-semibold opacity-100">{overdueCount(loc)} süresi geçmiş</span>{/if}
                {progressText(loc)}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Henüz mekân yok.</p>
  {/each}

  <div class="space-y-2 border-t pt-3">
    <h3 class="text-sm font-semibold">Yeni mekân</h3>
    {@render newLocationForm()}
  </div>
</aside>
