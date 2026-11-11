<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import LevelBadge from './LevelBadge.svelte';
  import ScaleInfo from './ScaleInfo.svelte';
  import SelectField from './SelectField.svelte';
  import { LIKELIHOOD_OPTIONS, parseScore, scoreValue, SEVERITY_OPTIONS } from './score-options';
  import { STATUS_LABELS, updateRow } from '$lib/domain/assessment';
  import { riskLevel } from '$lib/domain/matrix';
  import type { RiskRow } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let { rows, locationId, openId, onopen }: { rows: RiskRow[]; locationId: string; openId: string | null; onopen: (rowId: string) => void } = $props();

  const patch = (rowId: string, changes: Partial<RiskRow>) => store.apply((a) => updateRow(a, locationId, rowId, changes));
  // Clicks on the inline score selects or the chevron must not toggle through the row handler twice.
  const isControl = (e: Event) => (e.target as HTMLElement).closest('select, button') !== null;
  const clamp = 'line-clamp-3 whitespace-normal hyphens-auto';
</script>

<div class="[&_[data-slot=table-container]]:max-h-[70vh] [&_[data-slot=table-container]]:overflow-y-auto">
  <Table.Root class="table-fixed">
    <Table.Header class="[&_th]:whitespace-normal [&_th]:align-bottom [&_th]:text-xs [&_th]:text-muted-foreground sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
      <Table.Row class="hover:bg-transparent">
        <Table.Head class="w-9">No</Table.Head>
        <Table.Head class="w-[14%]">Alet / ekipman grubu</Table.Head>
        <Table.Head class="w-[21%]">Tehlike ve risk</Table.Head>
        <Table.Head class="w-14 px-1"><span class="inline-flex items-center gap-0.5">O<ScaleInfo kind="likelihood" /></span></Table.Head>
        <Table.Head class="w-14 px-1"><span class="inline-flex items-center gap-0.5">Ş<ScaleInfo kind="severity" /></span></Table.Head>
        <Table.Head class="w-24">Düzey</Table.Head>
        <Table.Head class="w-[20%]">Düzeltici / önleyici faaliyet</Table.Head>
        <Table.Head class="w-[13%]">Sorumlu</Table.Head>
        <Table.Head class="w-14">Durum</Table.Head>
        <Table.Head class="w-20 whitespace-normal">Önlem sonrası</Table.Head>
        <Table.Head class="w-9"><span class="sr-only">Düzenle</span></Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each rows as row, i (row.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <Table.Row id="trow-{row.id}" class="cursor-pointer align-top" data-state={openId === row.id ? 'selected' : undefined} onclick={(e: MouseEvent) => !isControl(e) && onopen(row.id)}>
          <Table.Cell class="border-l-4 font-semibold text-muted-foreground" style="border-left-color:{riskLevel(row.likelihood, row.severity)?.background ?? 'transparent'}">{i + 1}</Table.Cell>
          <Table.Cell class="font-medium"><div class={clamp} title={row.equipment}>{row.equipment}</div></Table.Cell>
          <Table.Cell><div class={clamp} title={row.hazard}>{row.hazard}</div></Table.Cell>
          <Table.Cell class="px-1">
            <SelectField size="sm" class="px-1.5" label="Satır {i + 1}: olasılık" options={LIKELIHOOD_OPTIONS} value={scoreValue(row.likelihood)} onValueChange={(v) => patch(row.id, { likelihood: parseScore(v) })} />
          </Table.Cell>
          <Table.Cell class="px-1">
            <SelectField size="sm" class="px-1.5" label="Satır {i + 1}: şiddet" options={SEVERITY_OPTIONS} value={scoreValue(row.severity)} onValueChange={(v) => patch(row.id, { severity: parseScore(v) })} />
          </Table.Cell>
          <Table.Cell><LevelBadge likelihood={row.likelihood} severity={row.severity} showScore /></Table.Cell>
          <Table.Cell><div class={clamp} title={row.action}>{row.action}</div></Table.Cell>
          <Table.Cell><div class={clamp} title={row.responsible}>{row.responsible}</div></Table.Cell>
          <Table.Cell>{STATUS_LABELS[row.status]}</Table.Cell>
          <Table.Cell><LevelBadge likelihood={row.likelihoodAfter} severity={row.severityAfter} /></Table.Cell>
          <Table.Cell class="px-1">
            <Button variant="ghost" size="icon-sm" aria-label="Satır {i + 1} düzenle" title="Satır {i + 1} düzenle" onclick={() => onopen(row.id)}><ChevronRight /></Button>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
