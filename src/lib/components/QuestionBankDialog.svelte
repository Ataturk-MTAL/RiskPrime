<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { LOCATION_TYPE_LABELS, LOCATION_TYPES } from '$lib/domain/assessment';
  import { addBankQuestions, searchBank } from '$lib/domain/question-bank';
  import type { BankSource, LocationType } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import ProposeItemDialog from './ProposeItemDialog.svelte';
  import SelectField from './SelectField.svelte';
  import type { SelectOption } from './score-options';

  let { open = $bindable(false), listId }: { open?: boolean; listId: string } = $props();

  const ALL = 'all';
  const MAX_RESULTS = 100;
  const SOURCE_OPTIONS: SelectOption[] = [
    { value: ALL, label: 'Tümü' },
    { value: 'meb', label: 'MEB' },
    { value: 'riskprime', label: 'RiskPrime eki' },
  ];
  const TAG_OPTIONS: SelectOption[] = [
    { value: ALL, label: 'Tüm mekân türleri' },
    ...LOCATION_TYPES.map((t) => ({ value: t, label: LOCATION_TYPE_LABELS[t] })),
  ];

  let query = $state('');
  let proposeOpen = $state(false);
  let source = $state(ALL);
  let tag = $state(ALL);
  let selected = $state.raw<ReadonlySet<string>>(new Set());
  $effect(() => {
    if (open) {
      query = '';
      source = ALL;
      tag = ALL;
      selected = new Set();
    }
  });

  const present = $derived(
    new Set(store.assessment.checklists.find((l) => l.id === listId)?.items.flatMap((i) => (i.ref ? [i.ref] : []))),
  );
  const results = $derived(
    searchBank(query, {
      ...(source === ALL ? {} : { source: source as BankSource }),
      ...(tag === ALL ? {} : { tags: [tag as LocationType] }),
    }),
  );
  const shown = $derived(results.slice(0, MAX_RESULTS));

  function toggle(key: string, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    selected = next;
  }
  function add() {
    const keys = [...selected];
    if (!store.apply((a) => addBankQuestions(a, listId, keys))) return;
    toast.success(`${keys.length} madde eklendi`);
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90vh] flex-col sm:max-w-3xl">
    <Dialog.Header>
      <Dialog.Title>Kontrol listelerinden madde ekle</Dialog.Title>
      <Dialog.Description class="sr-only">MEB ve RiskPrime kontrol listesi maddelerini arayıp listeye ekleyin.</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-2 sm:grid-cols-[1fr_11rem_14rem]">
      <Input type="search" bind:value={query} placeholder="Ara: lehim, KL-26.06, LOTO…" aria-label="Kontrol listesi maddelerinde ara" />
      <SelectField options={SOURCE_OPTIONS} value={source} onValueChange={(v) => (source = v)} label="Kaynak" />
      <SelectField options={TAG_OPTIONS} value={tag} onValueChange={(v) => (tag = v)} label="Mekân türü" />
    </div>
    <div class="min-h-0 flex-1 space-y-1 overflow-y-auto">
      {#each shown as q (q.key)}
        {@const inList = present.has(q.key)}
        <label class="flex items-start gap-2 rounded-md p-1.5 hover:bg-muted {inList ? 'cursor-default opacity-60' : 'cursor-pointer'}">
          <Checkbox class="mt-0.5" disabled={inList} checked={inList || selected.has(q.key)} onCheckedChange={(v) => toggle(q.key, v === true)} />
          <span class="min-w-0 text-sm">
            <Badge variant="outline" class="mr-1 tabular-nums">{q.key}</Badge>{q.text}
            {#if inList}<Badge variant="secondary">listede</Badge>{/if}
            {#if q.basis}<small class="block text-xs text-muted-foreground">Dayanak: {q.basis}</small>{/if}
          </span>
        </label>
      {:else}
        <p class="py-4 text-sm text-muted-foreground" role="status"><b class="block text-foreground">Sonuç yok</b>Aramaya uyan madde bulunamadı.</p>
        <p class="pb-4 text-sm"><Button variant="link" class="h-auto p-0" onclick={() => (proposeOpen = true)}>Aradığınız madde yok mu? Önerin</Button></p>
      {/each}
      {#if results.length > shown.length}
        <p class="py-2 text-xs text-muted-foreground" role="status">{results.length} sonuçtan ilk {MAX_RESULTS} tanesi gösteriliyor; aramayı daraltın.</p>
      {/if}
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Vazgeç</Button>
      <Button disabled={selected.size === 0} onclick={add}>{selected.size ? `Seçilenleri ekle (${selected.size})` : 'Seçilenleri ekle'}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
<ProposeItemDialog bind:open={proposeOpen} initialText={query.trim()} />
