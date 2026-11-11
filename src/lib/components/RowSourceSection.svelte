<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { linkRow, listsForLocation, sourceOf } from '$lib/domain/links';
  import type { RiskRow } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import SelectField from './SelectField.svelte';
  import { SOURCE_ANSWER_TEXT } from './SourceBadge.svelte';

  let { row, locationId }: { row: RiskRow; locationId: string } = $props();

  const info = $derived(sourceOf(store.assessment, row));
  const listName = $derived(info ? (store.assessment.checklists.find((c) => c.id === info.listId)?.name ?? '') : '');

  // Lists tied to this location first, then the rest.
  const orderedLists = $derived.by(() => {
    const own = listsForLocation(store.assessment, locationId).lists;
    return [...own, ...store.assessment.checklists.filter((c) => !own.includes(c))];
  });
  const listOptions = $derived(orderedLists.map((c) => ({ value: c.id, label: `${c.code ? `${c.code} · ` : ''}${c.name || 'Adsız liste'}` })));
  let pickedListId = $state('');
  const listId = $derived(orderedLists.some((c) => c.id === pickedListId) ? pickedListId : (orderedLists[0]?.id ?? ''));
  const itemOptions = $derived.by(() => {
    const items = orderedLists.find((c) => c.id === listId)?.items ?? [];
    // "Hayır" items first: those are the ones that normally need a risk row.
    return [...items.filter((i) => i.answer === 'no'), ...items.filter((i) => i.answer !== 'no')].map((i) => ({
      value: i.id,
      label: `${i.no}. ${i.text}`,
      hint: SOURCE_ANSWER_TEXT[i.answer],
    }));
  });

  const link = (source: { listId: string; itemId: string } | null) => store.apply((a) => linkRow(a, locationId, row.id, source));
</script>

<section class="space-y-2 rounded-lg border p-3 text-sm" aria-label="Kaynak">
  <h3 class="text-xs font-semibold text-muted-foreground">Kaynak</h3>
  {#if info}
    <p><b>{listName}</b> ({info.code || 'kodsuz'}) · madde {info.no} · cevap: <b>{SOURCE_ANSWER_TEXT[info.answer]}</b></p>
    <p class="text-muted-foreground">{info.text}</p>
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onclick={() => store.selectChecklist(info.listId)}>Maddeye git</Button>
      <Button variant="outline" size="sm" onclick={() => link(null)}>Bağlantıyı kaldır</Button>
    </div>
  {:else if orderedLists.length}
    <p class="text-xs text-muted-foreground">Kontrol maddesine bağla</p>
    <SelectField label="Kontrol listesi" options={listOptions} value={listId} onValueChange={(v) => (pickedListId = v)} />
    <SelectField label="Kontrol maddesi" options={itemOptions} value="" onValueChange={(v) => link({ listId, itemId: v })} />
  {:else}
    <p class="text-muted-foreground">Bağlanacak kontrol listesi yok.</p>
  {/if}
</section>
