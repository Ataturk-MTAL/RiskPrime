<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import type { Library } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import libraryData from '$lib/data/library.json';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const library = libraryData as unknown as Library;
  const norm = (s: string) => s.toLocaleLowerCase('tr');
  type Entry = { key: string; title: string; sub: string; present: boolean; group: string };

  let query = $state('');
  let selected = $state.raw<ReadonlySet<string>>(new Set());
  $effect(() => {
    if (open) {
      query = '';
      selected = new Set();
    }
  });

  const locationEntries = $derived.by<Entry[]>(() => {
    const have = new Set(store.assessment.locations.map((l) => norm(l.name)));
    return library.locations.map((l, i) => ({ key: `m:${i}`, title: l.name, sub: `${l.rows.length} risk satırı`, present: have.has(norm(l.name)), group: '' }));
  });
  const checklistEntries = $derived.by<Entry[]>(() => {
    const have = new Set(store.assessment.checklists.map((c) => norm(`${c.code}|${c.name}`)));
    return library.checklists.map((c, i) => ({
      key: `l:${i}`,
      title: `${c.code ? `${c.code} ` : ''}${c.name}`,
      sub: `${c.items.length} madde`,
      present: have.has(norm(`${c.code}|${c.name}`)),
      group: c.group ?? '',
    }));
  });

  const matches = (e: Entry) => !query.trim() || norm(`${e.title} ${e.sub}`).includes(norm(query.trim()));
  const visibleLocations = $derived(locationEntries.filter(matches));
  const checklistGroups = $derived.by(() => {
    const groups = new Map<string, Entry[]>();
    for (const e of checklistEntries.filter(matches)) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);
    return [...groups];
  });

  function toggle(key: string, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    selected = next;
  }
  function toggleAll(entries: Entry[]) {
    const all = entries.every((e) => selected.has(e.key));
    const next = new Set(selected);
    for (const e of entries) {
      if (all) next.delete(e.key);
      else next.add(e.key);
    }
    selected = next;
  }
  function add() {
    const pick = (prefix: string) => [...selected].filter((k) => k.startsWith(prefix)).map((k) => Number(k.slice(2)));
    store.addFromLibrary(pick('m:').map((i) => library.locations[i]), pick('l:').map((i) => library.checklists[i]));
    open = false;
  }
</script>

{#snippet entryList(entries: Entry[])}
  {#each entries as e (e.key)}
    <label class="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-muted">
      <Checkbox class="mt-0.5" checked={selected.has(e.key)} onCheckedChange={(v) => toggle(e.key, v === true)} />
      <span class="min-w-0 text-sm">
        <b>{e.title}</b>{#if e.present} <Badge variant="secondary">eklendi</Badge>{/if}
        <small class="block text-xs text-muted-foreground">{e.sub}</small>
      </span>
    </label>
  {/each}
{/snippet}

{#snippet groupHeading(title: string, entries: Entry[])}
  <p class="flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {title}
    <Button variant="link" size="xs" class="h-auto p-0 normal-case" onclick={() => toggleAll(entries)}>tümünü seç</Button>
  </p>
{/snippet}

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90vh] flex-col sm:max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>Hazır formdan ekle</Dialog.Title>
      <Dialog.Description class="sr-only">Hazır mekân ve kontrol listelerini seçip ekleyin.</Dialog.Description>
    </Dialog.Header>
    <Input type="search" bind:value={query} placeholder="Ara: ELE9, pano, KL-26…" aria-label="Kütüphanede ara" />
    <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
      <section class="space-y-1">
        <h3 class="font-semibold">Mekânlar (risk satırlarıyla)</h3>
        {#if visibleLocations.length}
          {@render groupHeading('Elektrik-Elektronik hazır form', visibleLocations)}
          {@render entryList(visibleLocations)}
        {/if}
      </section>
      <section class="space-y-1">
        <h3 class="font-semibold">Kontrol listeleri</h3>
        {#each checklistGroups as [group, entries] (group)}
          {@render groupHeading(group, entries)}
          {@render entryList(entries)}
        {/each}
      </section>
    </div>
    <Dialog.Footer class="items-center sm:justify-between">
      <span class="text-xs text-muted-foreground">Kendi listeniz mi var? "diğer biçimler" menüsünden Excel şablonunu indirin, doldurun, "Dosya aç" ile yükleyin.</span>
      <span class="flex gap-2">
        <Button variant="outline" onclick={() => (open = false)}>Vazgeç</Button>
        <Button disabled={selected.size === 0} onclick={add}>{selected.size ? `Seçilenleri ekle (${selected.size})` : 'Seçilenleri ekle'}</Button>
      </span>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
