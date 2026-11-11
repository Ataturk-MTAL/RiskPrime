<script lang="ts">
  import LevelBadge from './LevelBadge.svelte';
  import NativeSelect from './NativeSelect.svelte';
  import { readScore, SCORE_OPTIONS } from './score-options';
  import { riskScore } from '$lib/domain/matrix';
  import type { Score } from '$lib/domain/types';

  let {
    title,
    likelihood,
    severity,
    onchange,
  }: {
    title: string;
    likelihood: Score | null;
    severity: Score | null;
    onchange: (patch: { likelihood?: Score | null; severity?: Score | null }) => void;
  } = $props();
</script>

<div class="space-y-2 self-start rounded-lg border bg-muted/40 p-2">
  <span class="text-xs font-semibold text-muted-foreground">{title}</span>
  <div class="grid grid-cols-2 gap-2">
    <label class="flex items-center gap-1.5 text-sm font-medium">O
      <NativeSelect aria-label="{title}: olasılık" options={SCORE_OPTIONS} value={String(likelihood ?? '')} onchange={(e) => onchange({ likelihood: readScore(e) })} />
    </label>
    <label class="flex items-center gap-1.5 text-sm font-medium">Ş
      <NativeSelect aria-label="{title}: şiddet" options={SCORE_OPTIONS} value={String(severity ?? '')} onchange={(e) => onchange({ severity: readScore(e) })} />
    </label>
  </div>
  <div class="flex items-center gap-2">
    <span class="min-w-6 text-lg font-bold tabular-nums" title="Skor = O × Ş">{riskScore(likelihood, severity) ?? ''}</span>
    <LevelBadge {likelihood} {severity} />
  </div>
</div>
