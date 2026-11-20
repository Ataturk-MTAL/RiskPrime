<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import ChecklistItemLinks from './ChecklistItemLinks.svelte';
  import type { Deficiency } from '$lib/domain/inspections';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  let { d }: { d: Deficiency } = $props();

  const list = $derived(store.assessment.checklists.find((c) => c.id === d.listId));
  const item = $derived(list?.items.find((i) => i.id === d.itemId));
  const refs = $derived([d.ref, ...(d.siblings ?? []).map((s) => s.ref)].filter(Boolean));
</script>

<article class="space-y-2 rounded-lg border bg-background p-3">
  <div class="flex flex-wrap items-start gap-2">
    <p class="min-w-0 flex-1 text-sm font-semibold"><span class="text-muted-foreground">{d.itemNo}.</span> {d.text}</p>
    {#if refs.length}<Badge variant="outline">{refs.join(' · ')}</Badge>{/if}
  </div>
  <p class="text-xs text-muted-foreground">{d.listCode ? `${d.listCode} · ` : ''}{d.listName}</p>
  {#if d.note}<p class="text-sm">{d.note}</p>{/if}
  <div class="flex flex-wrap items-center gap-2">
    {#if list && item}<ChecklistItemLinks {list} {item} locationId={d.locationId} />{/if}
    <Button variant="ghost" size="sm" onclick={() => nav.openItem(d.locationId, d.listId)}><ExternalLink />Listede aç</Button>
  </div>
</article>
