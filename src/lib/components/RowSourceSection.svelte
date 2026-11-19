<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import X from '@lucide/svelte/icons/x';
  import { answerOf, scopesOf } from '$lib/domain/inspections';
  import { addRowSource, listsForLocation, removeRowSource, sourceLabel, sourcesOf } from '$lib/domain/links';
  import type { RiskRow, RiskSource } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import { nav } from '$lib/nav.svelte';
  import SelectField from './SelectField.svelte';
  import { SOURCE_ANSWER_TEXT } from './SourceBadge.svelte';

  let { row, locationId }: { row: RiskRow; locationId: string } = $props();

  const infos = $derived(sourcesOf(store.assessment, row));

  // Lists tied to this location first, then the rest.
  const orderedLists = $derived.by(() => {
    const own = listsForLocation(store.assessment, locationId).lists;
    return [...own, ...store.assessment.checklists.filter((c) => !own.includes(c))];
  });
  const listOptions = $derived(orderedLists.map((c) => ({ value: c.id, label: `${c.code ? `${c.code} · ` : ''}${c.name || 'Adsız liste'}` })));
  let pickedListId = $state('');
  const listId = $derived(orderedLists.some((c) => c.id === pickedListId) ? pickedListId : (orderedLists[0]?.id ?? ''));
  // The inspection to link to: this row's location when the list has it, else the list's first scope.
  const scopeId = $derived.by(() => {
    const list = orderedLists.find((c) => c.id === listId);
    const scopes = list ? scopesOf(store.assessment, list) : [];
    return scopes.includes(locationId) ? locationId : (scopes[0] ?? null);
  });
  const itemOptions = $derived.by(() => {
    const linkedIds = new Set(infos.filter((s) => s.listId === listId && s.locationId === scopeId).map((s) => s.itemId));
    const items = (orderedLists.find((c) => c.id === listId)?.items ?? [])
      .filter((i) => !linkedIds.has(i.id))
      .map((i) => ({ item: i, answer: answerOf(store.assessment, listId, scopeId, i.id).answer }));
    // "Hayır" items first: those are the ones that normally need a risk row.
    return [...items.filter((x) => x.answer === 'no'), ...items.filter((x) => x.answer !== 'no')].map(({ item, answer }) => ({
      value: item.id,
      label: `${item.no}. ${item.text}`,
      hint: SOURCE_ANSWER_TEXT[answer],
    }));
  });

  const link = (source: RiskSource) => store.apply((a) => addRowSource(a, locationId, row.id, source));
  const unlink = (source: RiskSource) => store.apply((a) => removeRowSource(a, locationId, row.id, source));
</script>

<section class="space-y-2 rounded-lg border p-3 text-sm" aria-label="Kaynak">
  <h3 class="text-xs font-semibold text-muted-foreground">Kaynak</h3>
  {#each infos as info (info.listId + info.itemId + info.locationId)}
    <div class="space-y-1">
      <p><b>{info.listName}</b> ({info.code || 'kodsuz'}) · madde {info.no} · cevap: <b>{SOURCE_ANSWER_TEXT[info.answer]}</b></p>
      <p class="text-muted-foreground">{info.text}</p>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onclick={() => nav.openLocation(info.locationId ?? locationId, info.listId)}>Maddeye git</Button>
        <Button variant="outline" size="icon-sm" aria-label="Bağlantıyı kaldır: {sourceLabel(info)}" onclick={() => unlink(info)}><X /></Button>
      </div>
    </div>
  {/each}
  {#if orderedLists.length}
    <p class="text-xs text-muted-foreground">Kontrol maddesine bağla</p>
    <SelectField label="Kontrol listesi" options={listOptions} value={listId} onValueChange={(v) => (pickedListId = v)} />
    <SelectField label="Kontrol maddesi" options={itemOptions} value="" onValueChange={(v) => link({ listId, itemId: v, locationId: scopeId })} />
  {:else}
    <p class="text-muted-foreground">Bağlanacak kontrol listesi yok.</p>
  {/if}
</section>
