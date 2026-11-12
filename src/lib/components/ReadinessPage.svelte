<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import ReadinessList from './ReadinessList.svelte';
  import { readiness } from '$lib/domain/readiness';
  import { store } from '$lib/state.svelte';

  const gaps = $derived(readiness(store.assessment));
</script>

<section class="max-w-2xl space-y-4 rounded-xl border bg-card p-4">
  <p class="text-sm text-muted-foreground">
    Puanlanan satır: {gaps.totals.scoredRows} / {gaps.totals.totalRows}.
    {gaps.hasGaps ? 'İmzalanacak belgede şu açık noktalar var:' : ''}
  </p>
  {#if gaps.hasGaps}
    <ReadinessList {gaps} />
  {:else}
    <p class="flex items-center gap-2 text-sm font-medium"><CircleCheck class="size-4" aria-hidden="true" />Eksik yok, PDF imzaya hazır.</p>
  {/if}
</section>
