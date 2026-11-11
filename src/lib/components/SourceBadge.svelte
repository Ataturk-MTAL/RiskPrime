<script lang="ts" module>
  import type { Answer } from '$lib/domain/types';

  export const SOURCE_ANSWER_TEXT: Record<Answer, string> = { yes: 'Evet', no: 'Hayır', na: 'U.D.', '': 'cevapsız' };
</script>

<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { sourceText } from '$lib/domain/export-data';
  import { sourceOf } from '$lib/domain/links';
  import type { RiskRow } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let { row }: { row: RiskRow } = $props();

  const info = $derived(sourceOf(store.assessment, row));
  const nowYes = $derived(info?.answer === 'yes' && row.status === 'open');
</script>

{#if info}
  <span class="flex flex-wrap items-center gap-1">
    <button type="button" class="rounded-4xl focus-visible:outline-none" title="{info.no}. {info.text}" aria-label="Kontrol maddesine git: {sourceText(store.assessment, row)}, cevap {SOURCE_ANSWER_TEXT[info.answer]}" onclick={() => store.selectChecklist(info.listId)}>
      <Badge variant="outline">{sourceText(store.assessment, row)} · {SOURCE_ANSWER_TEXT[info.answer]}</Badge>
    </button>
    {#if nowYes}<Badge variant="destructive">Madde Evet oldu</Badge>{/if}
  </span>
{/if}
