<script lang="ts" module>
  import type { Answer } from '$lib/domain/types';

  export const SOURCE_ANSWER_TEXT: Record<Answer, string> = { yes: 'uygun', no: 'eksik', na: 'U.D.', '': 'cevapsız' };
</script>

<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import { Badge } from '$lib/components/ui/badge';
  import { sourceLabel, sourcesOf } from '$lib/domain/links';
  import type { RiskRow } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import { nav } from '$lib/nav.svelte';

  const MAX_BADGES = 3;

  let { row, locationId }: { row: RiskRow; locationId: string } = $props();

  const infos = $derived(sourcesOf(store.assessment, row));
  const nowYes = $derived(row.status === 'open' && infos.some((i) => i.answer === 'yes'));
</script>

{#if infos.length}
  <span class="flex flex-wrap items-center gap-1">
    {#each infos.slice(0, MAX_BADGES) as info (info.listId + info.itemId)}
      <button type="button" class="rounded-4xl focus-visible:outline-none" title="{info.no}. {info.text}" aria-label="Kontrol maddesine git: {sourceLabel(info)}, cevap {SOURCE_ANSWER_TEXT[info.answer]}" onclick={() => nav.openLocation(info.locationId ?? locationId, info.listId)}>
        <Badge variant="outline">{sourceLabel(info)} · {SOURCE_ANSWER_TEXT[info.answer]}</Badge>
      </button>
    {/each}
    {#if infos.length > MAX_BADGES}<Badge variant="outline">+{infos.length - MAX_BADGES}</Badge>{/if}
    {#if nowYes}<Badge variant="outline"><CircleCheck aria-hidden="true" />Madde Evet oldu</Badge>{/if}
  </span>
{/if}
