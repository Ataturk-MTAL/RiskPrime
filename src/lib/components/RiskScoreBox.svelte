<script lang="ts">
  import LevelBadge from './LevelBadge.svelte';
  import SelectField from './SelectField.svelte';
  import { LIKELIHOOD_OPTIONS, parseScore, scoreValue, SEVERITY_OPTIONS } from './score-options';
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
      <SelectField label="{title}: olasılık" options={LIKELIHOOD_OPTIONS} value={scoreValue(likelihood)} onValueChange={(v) => onchange({ likelihood: parseScore(v) })} />
    </label>
    <label class="flex items-center gap-1.5 text-sm font-medium">Ş
      <SelectField label="{title}: şiddet" options={SEVERITY_OPTIONS} value={scoreValue(severity)} onValueChange={(v) => onchange({ severity: parseScore(v) })} />
    </label>
  </div>
  <div class="flex items-center gap-2">
    <span class="min-w-6 text-lg font-bold tabular-nums" title="Skor = O × Ş">{riskScore(likelihood, severity) ?? ''}</span>
    <LevelBadge {likelihood} {severity} />
  </div>
</div>
