<script lang="ts">
  import { untrack } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import SelectField from './SelectField.svelte';
  import { addSignatory, removeSignatory, updateMeta, updateSchool, updateSignatory } from '$lib/domain/assessment';
  import type { Grouping } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';

  const GROUPING_OPTIONS = [
    { value: 'area', label: 'Alana göre' },
    { value: 'building', label: 'Binaya göre' },
    { value: 'none', label: 'Gruplama yok' },
  ];

  const a = $derived(store.assessment);
  let open = $state(!store.assessment.school.name);
  // Collapse when a loaded file already has a school name.
  $effect(() => {
    store.loadCount;
    open = !untrack(() => store.assessment.school.name);
  });

  const filled = $derived(a.school.signatories.filter((s) => s.name).length);
  const summary = $derived(
    [a.school.name, a.period, `${filled}/${a.school.signatories.length} imzacı`].filter(Boolean).join(' · '),
  );
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();
</script>

<Collapsible.Root bind:open class="rounded-xl border bg-card">
  <Collapsible.Trigger class="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70 data-[state=open]:rounded-b-none">
    <span class="flex flex-wrap items-baseline gap-x-3">
      <h2 class="font-semibold">Okul ve kapsam</h2>
      <span class="text-sm text-muted-foreground">{summary}</span>
    </span>
    <ChevronDown class="size-4 shrink-0 text-muted-foreground transition-transform {open ? 'rotate-180' : ''}" />
  </Collapsible.Trigger>
  <Collapsible.Content class="space-y-4 border-t px-4 py-4">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Label class="flex flex-col items-start gap-1">Okul
        <Input value={a.school.name} onchange={(e) => store.apply((x) => updateSchool(x, { name: value(e) }))} />
      </Label>
      <Label class="flex flex-col items-start gap-1">Kapsam (kapak başlığı)
        <Input value={a.school.scope} placeholder="ör. Elektrik-Elektronik Teknolojisi Alanı" onchange={(e) => store.apply((x) => updateSchool(x, { scope: value(e) }))} />
      </Label>
      <Label class="flex flex-col items-start gap-1">Gruplama
        <SelectField label="Gruplama" options={GROUPING_OPTIONS} value={a.school.grouping} onValueChange={(v) => store.apply((x) => updateSchool(x, { grouping: v as Grouping }))} />
      </Label>
      <Label class="flex flex-col items-start gap-1">Dönem
        <Input value={a.period} placeholder="2026-2027" onchange={(e) => store.apply((x) => updateMeta(x, { period: value(e) }))} />
      </Label>
      <Label class="flex flex-col items-start gap-1">Değerlendirme tarihi
        <Input value={a.assessmentDate} placeholder="GG.AA.YYYY" onchange={(e) => store.apply((x) => updateMeta(x, { assessmentDate: value(e) }))} />
      </Label>
      <Label class="flex flex-col items-start gap-1">Geçerlilik tarihi
        <Input value={a.validUntil} placeholder="GG.AA.YYYY" onchange={(e) => store.apply((x) => updateMeta(x, { validUntil: value(e) }))} />
      </Label>
    </div>
    <div class="max-w-3xl space-y-2">
      <h3 class="text-sm font-semibold">İmzacılar</h3>
      {#each a.school.signatories as signatory, i (i)}
        <div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input class="col-span-2 sm:col-span-1" aria-label="Unvan" value={signatory.title} onchange={(e) => store.apply((x) => updateSignatory(x, i, { title: value(e) }))} />
          <Input aria-label="Ad soyad" placeholder="Ad Soyad" value={signatory.name} onchange={(e) => store.apply((x) => updateSignatory(x, i, { name: value(e) }))} />
          <Button variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive" aria-label="İmzacıyı sil" onclick={() => store.apply((x) => removeSignatory(x, i))}><Trash2 /></Button>
        </div>
      {/each}
      <Button variant="outline" size="sm" onclick={() => store.apply((x) => addSignatory(x, ''))}><Plus />İmzacı ekle</Button>
    </div>
  </Collapsible.Content>
</Collapsible.Root>
