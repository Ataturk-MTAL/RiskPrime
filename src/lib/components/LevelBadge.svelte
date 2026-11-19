<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { riskLevel, riskScore } from '$lib/domain/matrix';
  import type { Score } from '$lib/domain/types';
  import { RISK_TONE } from './shared-classes';

  let { likelihood, severity, showScore = false }: { likelihood: Score | null; severity: Score | null; showScore?: boolean } = $props();

  const level = $derived(riskLevel(likelihood, severity));
  const score = $derived(riskScore(likelihood, severity));
</script>

{#if level}
  <Badge class="h-auto min-h-5 whitespace-normal border-0 text-center leading-tight {RISK_TONE[level.key].badge}" title="Skor = O × Ş">{showScore ? `${score} ` : ''}{level.label}</Badge>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
