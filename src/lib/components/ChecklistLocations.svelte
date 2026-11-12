<script lang="ts">
  import MapPin from '@lucide/svelte/icons/map-pin';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import * as Popover from '$lib/components/ui/popover';
  import { grouped } from '$lib/domain/assessment';
  import { liveLocationIds } from '$lib/domain/inspections';
  import { setChecklistLocations } from '$lib/domain/links';
  import type { Checklist } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let { list }: { list: Checklist } = $props();

  const selected = $derived(liveLocationIds(store.assessment, list));
  const names = $derived(
    selected.map((id) => store.assessment.locations.find((l) => l.id === id)?.name || 'Adsız mekân'),
  );
  const summary = $derived(names.length ? names.join(', ') : 'Okul geneli');
  const groups = $derived(grouped(store.assessment));

  const toggle = (id: string, on: boolean) =>
    store.apply((a) => setChecklistLocations(a, list.id, on ? [...selected, id] : selected.filter((x) => x !== id)));
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" class="max-w-full" aria-label="Mekânlar: {summary}">
        <MapPin /><span class="truncate">Mekânlar: {summary}</span>
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="max-h-80 w-72 space-y-2 overflow-y-auto">
    <p class="text-xs text-muted-foreground">Her seçili mekânda ayrı denetlenir. Hiçbiri seçili değilse okul genelinde bir kez denetlenir.</p>
    {#each groups as group (group.title)}
      <fieldset class="space-y-1">
        {#if group.title}<legend class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</legend>{/if}
        {#each group.locations as loc (loc.id)}
          <div class="flex items-center gap-2">
            <Checkbox id="cl-{list.id}-{loc.id}" checked={selected.includes(loc.id)} onCheckedChange={(v) => toggle(loc.id, v === true)} />
            <Label for="cl-{list.id}-{loc.id}" class="font-normal">{loc.name || 'Adsız mekân'}</Label>
          </div>
        {/each}
      </fieldset>
    {:else}
      <p class="text-sm text-muted-foreground">Önce bir mekân ekleyin.</p>
    {/each}
  </Popover.Content>
</Popover.Root>
