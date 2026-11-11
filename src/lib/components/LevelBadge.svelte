<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { riskLevel, riskScore } from '$lib/domain/matrix';
  import type { Score } from '$lib/domain/types';

  let { likelihood, severity, showScore = false }: { likelihood: Score | null; severity: Score | null; showScore?: boolean } = $props();

  const level = $derived(riskLevel(likelihood, severity));
  const score = $derived(riskScore(likelihood, severity));
</script>

{#if level}
  <Badge style="background:{level.background};color:{level.text}" title="Skor = O × Ş">{showScore ? `${score} ` : ''}{level.label}</Badge>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
