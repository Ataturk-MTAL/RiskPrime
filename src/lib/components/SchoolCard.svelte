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
  import type { Assessment, Grouping } from '$lib/domain/types';
  import { isBefore } from '$lib/domain/date';
  import DateField from './DateField.svelte';
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
  let root = $state<HTMLElement | null>(null);
  // Opened from elsewhere (readiness list): expand, scroll into view, focus the first empty field.
  $effect(() => {
    if (!store.schoolRequest) return;
    open = true;
    requestAnimationFrame(() => {
      root?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const empty = [...(root?.querySelectorAll<HTMLInputElement>('input') ?? [])].find((i) => !i.value);
      empty?.focus({ preventScroll: true });
    });
  });

  const filled = $derived(a.school.signatories.filter((s) => s.name).length);
  const summary = $derived(
    [a.school.name, a.period, `${filled}/${a.school.signatories.length} imzacı`].filter(Boolean).join(' · '),
  );
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();
  const validUntilError = $derived(
    isBefore(a.validUntil, a.assessmentDate) ? 'Geçerlilik tarihi değerlendirme tarihinden önce olamaz' : '',
  );
</script>

{#snippet dateInput(label: string, id: string, stored: string, make: (x: Assessment, v: string) => Assessment, extraError = '')}
  <div class="flex flex-col items-start gap-1">
    <Label for={id}>{label}</Label>
    <DateField {id} value={stored} error={extraError} onchange={(v) => store.apply((x) => make(x, v))} />
  </div>
{/snippet}

<Collapsible.Root bind:open bind:ref={root} class="scroll-mt-4 rounded-xl border bg-card">
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
      {@render dateInput('Değerlendirme tarihi', 'assessment-date', a.assessmentDate, (x, v) => updateMeta(x, { assessmentDate: v }))}
      {@render dateInput('Geçerlilik tarihi', 'valid-until', a.validUntil, (x, v) => updateMeta(x, { validUntil: v }), validUntilError)}
    </div>
    <div class="max-w-3xl space-y-2">
      <h3 class="text-sm font-semibold">İmzacılar</h3>
      {#each a.school.signatories as signatory, i (i)}
        <div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input class="col-span-2 sm:col-span-1" aria-label="{i + 1}. imzacı unvanı" value={signatory.title} onchange={(e) => store.apply((x) => updateSignatory(x, i, { title: value(e) }))} />
          <Input aria-label="{i + 1}. imzacı adı soyadı" placeholder="Ad Soyad" value={signatory.name} onchange={(e) => store.apply((x) => updateSignatory(x, i, { name: value(e) }))} />
          <Button variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive" aria-label="{i + 1}. imzacıyı sil" onclick={() => store.applyWithUndo((x) => removeSignatory(x, i), `İmzacı silindi: ${signatory.title}`)}><Trash2 /></Button>
        </div>
      {/each}
      <Button variant="outline" size="sm" onclick={() => store.apply((x) => addSignatory(x, ''))}><Plus />İmzacı ekle</Button>
    </div>
  </Collapsible.Content>
</Collapsible.Root>
