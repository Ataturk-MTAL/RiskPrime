<script lang="ts" module>
  export const ADD_ROW_BUTTON_ID = 'add-row-button';
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { dateField, storedDate } from '$lib/domain/date';  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Textarea } from '$lib/components/ui/textarea';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import SelectField from './SelectField.svelte';
  import RiskScoreBox from './RiskScoreBox.svelte';
  import { removeRow, STATUS_LABELS, STATUSES, updateRow } from '$lib/domain/assessment';
  import type { RiskRow, RowStatus } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  let {
    rows,
    locationId,
    openId = $bindable(),
  }: { rows: RiskRow[]; locationId: string; openId: string | null } = $props();

  const STATUS_OPTIONS = STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
  const index = $derived(rows.findIndex((r) => r.id === openId));
  const row = $derived(rows[index]);
  const patch = (changes: Partial<RiskRow>) => store.apply((a) => updateRow(a, locationId, row.id, changes));
  const text = (field: 'equipment' | 'hazard' | 'affected' | 'existingControls' | 'action' | 'responsible') =>
    (e: Event) => patch({ [field]: (e.currentTarget as HTMLInputElement).value.trim() });
  const go = (step: -1 | 1) => (openId = rows[index + step]?.id ?? openId);
  // Deleting closes the sheet first, then focus returns to the add button (the sheet's own restore targets a removed trigger).
  function deleteRow() {
    const id = row.id;
    openId = null;
    store.apply((a) => removeRow(a, locationId, id));
    void tick().then(() => document.getElementById(ADD_ROW_BUTTON_ID)?.focus());
  }
  const fieldClass = 'flex flex-col items-start gap-1 text-xs text-muted-foreground';
  const areaClass = 'min-h-9 py-1.5 text-foreground';
</script>

<Sheet.Root open={row !== undefined} onOpenChange={(open) => !open && (openId = null)}>
  <Sheet.Content side="right" class="w-full data-[side=right]:sm:max-w-[36rem]">
    {#if row}
      <Sheet.Header class="pb-0">
        <Sheet.Title>Satır {index + 1} düzenle</Sheet.Title>
        <Sheet.Description class="sr-only">Risk satırının tüm alanları. Değişiklikler alan bırakıldığında kaydedilir.</Sheet.Description>
      </Sheet.Header>
      {#key row.id}
        <div id="row-sheet-body" class="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
          <Label class={fieldClass}>Alet / ekipman grubu
            <Textarea class="{areaClass} field-sizing-content font-semibold" rows={1} value={row.equipment} placeholder="ör. Havya istasyonu" onchange={text('equipment')} />
          </Label>
          <Label class={fieldClass}>Tehlike ve risk
            <Textarea class="{areaClass} field-sizing-content" rows={1} value={row.hazard} placeholder="Ne olabilir? Sonucu?" onchange={text('hazard')} />
          </Label>
          <Label class={fieldClass}>Etkilenen
            <Textarea class="{areaClass} field-sizing-content" rows={1} value={row.affected} placeholder="Öğrenci, öğretmen" onchange={text('affected')} />
          </Label>
          <Label class={fieldClass}>Mevcut önlem
            <Textarea class="{areaClass} field-sizing-content" rows={1} value={row.existingControls} onchange={text('existingControls')} />
          </Label>
          <RiskScoreBox title="Mevcut risk" likelihood={row.likelihood} severity={row.severity} onchange={patch} />
          <Label class={fieldClass}>Düzeltici / önleyici faaliyet
            <Textarea class="{areaClass} field-sizing-content" rows={1} value={row.action} onchange={text('action')} />
          </Label>
          <Label class={fieldClass}>Sorumlu
            <Textarea class="{areaClass} field-sizing-content" rows={1} value={row.responsible} onchange={text('responsible')} />
          </Label>
          <div class="grid grid-cols-2 gap-2">
            <Label class={fieldClass}>Bitiş
              {@const due = dateField(row.dueDate)}
              <Input
                class="text-foreground"
                type={due.type}
                value={due.value}
                placeholder="GG.AA.YYYY"
                aria-invalid={due.legacy ? true : undefined}
                aria-describedby={due.legacy ? 'due-date-error' : undefined}
                onchange={(e) => patch({ dueDate: storedDate(e.currentTarget.type, e.currentTarget.value) })}
              />
              {#if due.legacy}<span id="due-date-error" class="text-destructive">Tarih GG.AA.YYYY olmalı</span>{/if}
            </Label>
            <Label class={fieldClass}>Durum
              <SelectField label="Durum" options={STATUS_OPTIONS} value={row.status} onValueChange={(v) => patch({ status: v as RowStatus })} />
            </Label>
          </div>
          <RiskScoreBox
            title="Önlem sonrası"
            likelihood={row.likelihoodAfter}
            severity={row.severityAfter}
            onchange={(p) => patch('likelihood' in p ? { likelihoodAfter: p.likelihood } : { severityAfter: p.severity })}
          />
        </div>
      {/key}
      <Sheet.Footer class="flex-row flex-wrap items-center justify-between gap-2 border-t">
        <ConfirmDialog
          label="Satırı sil"
          variant="destructive"
          size="default"
          title="Satır silinsin mi?"
          description="Bu risk satırı kalıcı olarak silinecek."
          onconfirm={deleteRow}
        ><Trash2 />Satırı sil</ConfirmDialog>
        <div class="flex gap-1">
          <Button variant="outline" disabled={index === 0} onclick={() => go(-1)}><ChevronLeft /><span class="max-sm:sr-only">Önceki</span></Button>
          <Button variant="outline" disabled={index === rows.length - 1} onclick={() => go(1)}><span class="max-sm:sr-only">Sonraki</span><ChevronRight /></Button>
        </div>
      </Sheet.Footer>
    {/if}
  </Sheet.Content>
</Sheet.Root>
