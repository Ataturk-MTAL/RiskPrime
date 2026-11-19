<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Clock from '@lucide/svelte/icons/clock';
  import { Badge } from '$lib/components/ui/badge';
  import LevelBadge from './LevelBadge.svelte';
  import SelectField from './SelectField.svelte';
  import SourceBadge from './SourceBadge.svelte';
  import { RISK_TONE } from './shared-classes';
  import { LIKELIHOOD_OPTIONS, parseScore, scoreValue, SEVERITY_OPTIONS } from './score-options';
  import { isOverdue, updateRow } from '$lib/domain/assessment';
  import { riskLevel } from '$lib/domain/matrix';
  import type { RiskRow } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let { row, index, locationId, onopen, dimLabel }: { row: RiskRow; index: number; locationId: string; onopen: (rowId: string) => void; dimLabel?: string } = $props();

  const level = $derived(riskLevel(row.likelihood, row.severity));
  const patch = (changes: Partial<RiskRow>) => store.apply((a) => updateRow(a, locationId, row.id, changes));
</script>

<article id="row-{row.id}" class="rounded-lg border bg-background {level ? `${RISK_TONE[level.key].fill} ${RISK_TONE[level.key].stripe}` : ''}" class:opacity-60={dimLabel !== undefined}>
  <button type="button" class="flex min-h-11 w-full items-start gap-2 rounded-t-lg p-3 text-left hover:bg-muted" aria-label="Satır {index} düzenle" onclick={() => onopen(row.id)}>
    <span class="text-xs font-semibold text-muted-foreground">{index}</span>
    {#if dimLabel}<span class="text-xs text-muted-foreground">{dimLabel}</span>{/if}
    <span class="min-w-0 flex-1">
      <span class="line-clamp-1 block text-sm font-semibold">{row.equipment || 'Ekipman girilmedi'}</span>
      <span class="line-clamp-2 block text-sm text-muted-foreground">{row.hazard || 'Tehlike girilmedi'}</span>
    </span>
    <ChevronRight class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  </button>
  <div class="px-3 pb-2 empty:hidden"><SourceBadge {row} /></div>
  <div class="grid grid-cols-[4.5rem_4.5rem_minmax(0,1fr)] items-end gap-2 px-3 pb-3">
    <div class="space-y-1 text-xs text-muted-foreground">
      <span aria-hidden="true">O</span>
      <SelectField label="Satır {index}: olasılık" options={LIKELIHOOD_OPTIONS} value={scoreValue(row.likelihood)} onValueChange={(v) => patch({ likelihood: parseScore(v) })} />
    </div>
    <div class="space-y-1 text-xs text-muted-foreground">
      <span aria-hidden="true">Ş</span>
      <SelectField label="Satır {index}: şiddet" options={SEVERITY_OPTIONS} value={scoreValue(row.severity)} onValueChange={(v) => patch({ severity: parseScore(v) })} />
    </div>
    <div class="flex min-h-9 items-center justify-end">
      {#if isOverdue(row, new Date())}<Badge variant="outline" class="mr-2"><Clock aria-hidden="true" />Süresi geçti</Badge>{/if}
      <LevelBadge likelihood={row.likelihood} severity={row.severity} showScore /></div>
  </div>
</article>
