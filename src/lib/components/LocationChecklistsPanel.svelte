<script lang="ts">
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import { Button } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { listsForLocation, rowsForItem } from '$lib/domain/links';
  import { store } from '$lib/state.svelte';

  let { locationId }: { locationId: string } = $props();

  const linked = $derived(listsForLocation(store.assessment, locationId));
  const summaries = $derived(
    linked.lists.map((c) => {
      const noItems = c.items.filter((i) => i.answer === 'no');
      return {
        id: c.id,
        label: `${c.code ? `${c.code} · ` : ''}${c.name || 'Adsız liste'}`,
        answered: c.items.filter((i) => i.answer !== '').length,
        total: c.items.length,
        no: noItems.length,
        noWithoutRow: noItems.filter((i) => rowsForItem(store.assessment, c.id, i.id).length === 0).length,
      };
    }),
  );
</script>

<Collapsible.Root class="rounded-md border">
  <Collapsible.Trigger class="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm">
    <span>Bu mekânın kontrol listeleri ({summaries.length}){#if linked.generalCount}{' '}· + {linked.generalCount} genel liste{/if}</span>
    <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  </Collapsible.Trigger>
  <Collapsible.Content class="space-y-1 border-t px-3 py-2 text-sm">
    {#each summaries as s (s.id)}
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => store.selectChecklist(s.id)}>{s.label}</Button>
        <span class="text-xs text-muted-foreground">
          {s.answered}/{s.total} cevaplı · Hayır: {s.no}{#if s.noWithoutRow} · satırı açılmamış: {s.noWithoutRow}{/if}
        </span>
      </div>
    {:else}
      <p class="text-muted-foreground">Bu mekâna atanmış liste yok; kontrol listesi ekranından atayabilirsiniz.</p>
    {/each}
  </Collapsible.Content>
</Collapsible.Root>
