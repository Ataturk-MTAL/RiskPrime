<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import SelectField from './SelectField.svelte';
  import { summary } from '$lib/domain/checklist';
  import { liveLocationIds, rowsForItem } from '$lib/domain/links';
  import type { Checklist } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  // "Hayır" items that still have no risk row.
  const unlinked = (list: Checklist) =>
    list.items.filter((i) => i.answer === 'no' && !rowsForItem(store.assessment, list.id, i.id).length).length;
  const locationText = (list: Checklist) =>
    liveLocationIds(store.assessment, list)
      .map((id) => store.assessment.locations.find((l) => l.id === id)?.name || 'Adsız mekân')
      .join(', ');

  const options = $derived(
    store.assessment.checklists.map((list) => {
      const s = summary(list);
      return { value: list.id, label: `${list.code ? `${list.code} ` : ''}${list.name}`, hint: `${s.answered}/${s.total}` };
    }),
  );
</script>

<aside class="space-y-3 rounded-xl border bg-card p-3 md:hidden">
  <h2 class="sr-only">Kontrol listeleri</h2>
  {#if options.length}
    <SelectField label="Kontrol listesi" {options} value={store.checklistId ?? ''} onValueChange={(v) => store.selectChecklist(v)} />
  {:else}
    <p class="text-sm text-muted-foreground">Henüz kontrol listesi yok.</p>
  {/if}
  <Button variant="outline" class="w-full" onclick={() => store.addBlankChecklist()}><Plus />Boş liste ekle</Button>
</aside>

<aside class="hidden space-y-3 rounded-xl border bg-card p-3 md:sticky md:top-4 md:block">
  <h2 class="font-semibold">Kontrol listeleri</h2>
  <ul class="space-y-0.5">
    {#each store.assessment.checklists as list (list.id)}
      {@const s = summary(list)}
      {@const places = locationText(list)}
      {@const orphan = unlinked(list)}
      <li>
        <button
          type="button"
          aria-current={list.id === store.checklistId}
          class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
          onclick={() => store.selectChecklist(list.id)}
        >
          <span class="min-w-0">
            {#if list.code}<b>{list.code}</b>{' '}{/if}{list.name}
            {#if places}<span class="block truncate text-xs opacity-70" title={places}>{places}</span>{/if}
            {#if orphan}<span class="block text-xs opacity-80">{orphan} satırsız</span>{/if}
          </span>
          <span class="flex shrink-0 items-center gap-1 text-xs">
            {#if s.no}<span class="rounded-full bg-red-600 px-1.5 py-0.5 text-white" title="Hayır cevabı">{s.no}</span>{/if}
            <span class="opacity-70">{s.answered}/{s.total}</span>
          </span>
        </button>
      </li>
    {:else}
      <li class="px-2 text-sm text-muted-foreground">Henüz kontrol listesi yok. "+ Hazır formdan ekle" ile MEB ya da elektrik-elektronik listelerini ekleyin.</li>
    {/each}
  </ul>
  <Button variant="outline" class="w-full" onclick={() => store.addBlankChecklist()}><Plus />Boş liste ekle</Button>
</aside>
