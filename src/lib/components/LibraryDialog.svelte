<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { previewLibraryAdd } from '$lib/domain/library';
  import type { Library, LocationTemplate } from '$lib/domain/types';
  import { store } from '$lib/state.svelte';
  import libraryData from '$lib/data/library.json';
  import areaLocations from '$lib/data/locations.json';
  import { downloadBlankTemplate, downloadMebTemplate } from '$lib/templates';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const library = libraryData as unknown as Library;
  // Elektrik-Elektronik templates (library.json) first, then the other areas (content/locations).
  const locationTemplates: LocationTemplate[] = [...library.locations, ...(areaLocations as LocationTemplate[])];
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
    return locationTemplates.map((l, i) => ({
      key: `m:${i}`,
      title: l.name,
      sub: `${l.rows.length} risk satırı${l.checklists?.length ? `, ${l.checklists.length} MEB listesi: ${l.checklists.join(', ')}` : ''}`,
      present: have.has(norm(l.name)),
      group: l.area,
    }));
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

  const matches = (e: Entry) => !query.trim() || norm(`${e.title} ${e.sub} ${e.group}`).includes(norm(query.trim()));
  const byGroup = (entries: Entry[]) => {
    const groups = new Map<string, Entry[]>();
    for (const e of entries.filter(matches)) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);
    return [...groups];
  };
  const locationGroups = $derived(byGroup(locationEntries));
  const checklistGroups = $derived(byGroup(checklistEntries));

  const pick = (prefix: string) => [...selected].filter((k) => k.startsWith(prefix)).map((k) => Number(k.slice(2)));
  const chosenLocations = $derived(pick('m:').map((i) => locationTemplates[i]));
  const chosenLists = $derived(pick('l:').map((i) => library.checklists[i]));
  const preview = $derived.by(() => {
    if (!selected.size) return null;
    try {
      return previewLibraryAdd(store.assessment, chosenLocations, chosenLists, library.checklists);
    } catch {
      return null; // the add itself reports the error through store.apply
    }
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
    store.addFromLibrary(chosenLocations, chosenLists, library.checklists);
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

{#snippet empty()}
  <p class="py-4 text-sm text-muted-foreground" role="status"><b class="block text-foreground">Sonuç yok</b>“{query.trim()}” için sonuç bulunamadı.</p>
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
      <Dialog.Title>Kütüphaneden ekle</Dialog.Title>
      <Dialog.Description class="sr-only">Hazır mekân ve kontrol listelerini seçip ekleyin.</Dialog.Description>
    </Dialog.Header>
    <Input type="search" bind:value={query} placeholder="Ara: CNC, Kimya, ELE9, KL-26…" aria-label="Kütüphanede ara" />
    <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
      <section class="space-y-1">
        <h3 class="font-semibold">Mekânlar (risk satırlarıyla)</h3>
        {#each locationGroups as [group, entries] (group)}
          {@render groupHeading(group, entries)}
          {@render entryList(entries)}
        {/each}
        {#if !locationGroups.length && !checklistGroups.length}
          {@render empty()}
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
      <span class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {#if preview}
          <span class="w-full text-sm text-foreground" role="status">
            Eklenecek: {chosenLocations.length} mekân, {preview.length} yeni kontrol listesi{preview.length ? ` (${preview.join(', ')})` : ''}
          </span>
        {/if}
        Kendi listeniz mi var? Excel şablonu indirin, doldurun, "Dosya aç" ile yükleyin:
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={downloadMebTemplate}>MEB KL-01–KL-43 şablonu</Button>
        ·
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={downloadBlankTemplate}>boş şablon</Button>
      </span>
      <span class="flex gap-2">
        <Button variant="outline" onclick={() => (open = false)}>Vazgeç</Button>
        <Button disabled={selected.size === 0} onclick={add}>{selected.size ? `Seçilenleri ekle (${selected.size})` : 'Seçilenleri ekle'}</Button>
      </span>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
