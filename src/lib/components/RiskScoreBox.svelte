<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import NativeSelect from './NativeSelect.svelte';
  import { riskLevel, riskScore } from '$lib/domain/matrix';
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

  const OPTIONS = [{ value: '', label: '—' }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))];
  const level = $derived(riskLevel(likelihood, severity));
  const score = (e: Event) => {
    const v = (e.currentTarget as HTMLSelectElement).value;
    return v === '' ? null : (Number(v) as Score);
  };
</script>

<div class="space-y-2 self-start rounded-lg border bg-muted/40 p-2">
  <span class="text-xs font-semibold text-muted-foreground">{title}</span>
  <div class="grid grid-cols-2 gap-2">
    <label class="flex items-center gap-1.5 text-sm font-medium">O
      <NativeSelect aria-label="{title}: olasılık" options={OPTIONS} value={String(likelihood ?? '')} onchange={(e) => onchange({ likelihood: score(e) })} />
    </label>
    <label class="flex items-center gap-1.5 text-sm font-medium">Ş
      <NativeSelect aria-label="{title}: şiddet" options={OPTIONS} value={String(severity ?? '')} onchange={(e) => onchange({ severity: score(e) })} />
    </label>
  </div>
  <div class="flex items-center gap-2">
    <span class="min-w-6 text-lg font-bold tabular-nums" title="Skor = O × Ş">{riskScore(likelihood, severity) ?? ''}</span>
    {#if level}
      <Badge style="background:{level.background};color:{level.text}">{level.label}</Badge>
    {:else}
      <Badge variant="outline">—</Badge>
    {/if}
  </div>
</div>
