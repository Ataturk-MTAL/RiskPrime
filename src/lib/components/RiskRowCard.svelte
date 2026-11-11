<script lang="ts">
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import NativeSelect from './NativeSelect.svelte';
  import RiskScoreBox from './RiskScoreBox.svelte';
  import { removeRow, STATUS_LABELS, STATUSES, updateRow } from '$lib/domain/assessment';
  import { riskLevel } from '$lib/domain/matrix';
  import type { RiskRow, RowStatus } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let { row, index, locationId }: { row: RiskRow; index: number; locationId: string } = $props();

  const STATUS_OPTIONS = STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
  const level = $derived(riskLevel(row.likelihood, row.severity));
  const patch = (changes: Partial<RiskRow>) => store.apply((a) => updateRow(a, locationId, row.id, changes));
  const text = (field: 'equipment' | 'hazard' | 'affected' | 'existingControls' | 'action' | 'responsible' | 'dueDate') =>
    (e: Event) => patch({ [field]: (e.currentTarget as HTMLInputElement).value.trim() });
  const fieldClass = 'flex flex-col items-start gap-1 text-xs text-muted-foreground';
  const areaClass = 'min-h-9 py-1.5 text-foreground';
</script>

<article id="row-{row.id}" class="@container rounded-lg border border-l-4 bg-background p-3" style:border-left-color={level?.background}>
  <div class="mb-2 flex items-center justify-between">
    <span class="text-xs font-semibold text-muted-foreground">Satır {index}</span>
    <ConfirmDialog label="Satır {index}: sil" title="Satır silinsin mi?" description="Bu risk satırı kalıcı olarak silinecek." onconfirm={() => store.apply((a) => removeRow(a, locationId, row.id))}>
      <Trash2 />
    </ConfirmDialog>
  </div>
  <div class="grid gap-3 @md:grid-cols-[minmax(0,1fr)_11rem] @3xl:grid-cols-[minmax(0,1.5fr)_10rem_minmax(0,1fr)_10rem]">
    <div class="space-y-2">
      <Label class={fieldClass}>Alet / ekipman grubu
        <Textarea class="{areaClass} font-semibold" rows={1} value={row.equipment} placeholder="ör. Havya istasyonu" onchange={text('equipment')} />
      </Label>
      <Label class={fieldClass}>Tehlike ve risk
        <Textarea class={areaClass} rows={1} value={row.hazard} placeholder="Ne olabilir? Sonucu?" onchange={text('hazard')} />
      </Label>
      <div class="grid gap-2 @lg:grid-cols-2">
        <Label class={fieldClass}>Etkilenen
          <Textarea class={areaClass} rows={1} value={row.affected} placeholder="Öğrenci, öğretmen" onchange={text('affected')} />
        </Label>
        <Label class={fieldClass}>Mevcut önlem
          <Textarea class={areaClass} rows={1} value={row.existingControls} onchange={text('existingControls')} />
        </Label>
      </div>
    </div>
    <RiskScoreBox title="Mevcut risk" likelihood={row.likelihood} severity={row.severity} onchange={patch} />
    <div class="space-y-2">
      <Label class={fieldClass}>Düzeltici / önleyici faaliyet
        <Textarea class={areaClass} rows={1} value={row.action} onchange={text('action')} />
      </Label>
      <div class="grid grid-cols-2 gap-2">
        <Label class="{fieldClass} col-span-2">Sorumlu
          <Textarea class={areaClass} rows={1} value={row.responsible} onchange={text('responsible')} />
        </Label>
        <Label class={fieldClass}>Bitiş
          <Input class="text-foreground" value={row.dueDate} placeholder="GG.AA.YYYY" onchange={text('dueDate')} />
        </Label>
        <Label class={fieldClass}>Durum
          <NativeSelect options={STATUS_OPTIONS} value={row.status} onchange={(e) => patch({ status: e.currentTarget.value as RowStatus })} />
        </Label>
      </div>
    </div>
    <RiskScoreBox
      title="Önlem sonrası"
      likelihood={row.likelihoodAfter}
      severity={row.severityAfter}
      onchange={(p) => patch('likelihood' in p ? { likelihoodAfter: p.likelihood } : { severityAfter: p.severity })}
    />
  </div>
</article>
