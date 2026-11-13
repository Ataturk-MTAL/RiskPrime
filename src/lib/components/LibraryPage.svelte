<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Plus from '@lucide/svelte/icons/plus';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import ChecklistEditor from './ChecklistEditor.svelte';
  import LibraryDialog from './LibraryDialog.svelte';
  import ProposeItemDialog from './ProposeItemDialog.svelte';
  import { bankChanges } from '$lib/domain/bank-sync';
  import { liveLocationIds } from '$lib/domain/inspections';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  let libraryOpen = $state(false);
  let proposeOpen = $state(false);
  const lists = $derived(store.assessment.checklists);
  const changes = $derived(bankChanges(store.assessment));
  const changeCount = $derived(changes.updated.length + changes.added.length);
  const openId = $derived(nav.place.listId);

  function addBlank() {
    const before = lists.length;
    store.addBlankChecklist();
    const created = store.assessment.checklists[before];
    if (created) nav.openLibrary(created.id);
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <h1 class="text-2xl font-semibold">Kütüphane</h1>

  {#if openId}
    <div>
      <Button variant="ghost" size="sm" onclick={() => nav.openLibrary()}><ArrowLeft />Kütüphane</Button>
    </div>
    <ChecklistEditor listId={openId} />
  {:else}
    <p class="max-w-2xl text-sm text-muted-foreground">
      Kontrol listesi şablonları burada durur. Bir şablonu hangi mekânlarda denetleyeceğinizi şablondan seçersiniz; cevaplar Mekânlar bölümünde girilir.
    </p>
    <div class="flex flex-wrap gap-2">
      <Button onclick={addBlank}><Plus />Boş liste ekle</Button>
      <Button variant="outline" onclick={() => (libraryOpen = true)}>Hazır listelerden ekle</Button>
      <Button variant="outline" onclick={() => (proposeOpen = true)}>Madde öner</Button>
      {#if changeCount > 0}
        <Button variant="outline" onclick={() => store.openBankOffer()}>Kontrol listeleri güncellemeleri ({changeCount})</Button>
      {/if}
    </div>
    {#if lists.length}
      <div class="rounded-xl border bg-card">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Kod</Table.Head>
              <Table.Head>Ad</Table.Head>
              <Table.Head>Kaynak</Table.Head>
              <Table.Head class="text-right">Madde</Table.Head>
              <Table.Head class="text-right">Uygulandığı mekân</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each lists as list (list.id)}
              {@const count = liveLocationIds(store.assessment, list).length}
              <Table.Row>
                <Table.Cell class="tabular-nums">{list.code}</Table.Cell>
                <Table.Cell class="whitespace-normal">
                  <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => nav.openLibrary(list.id)}>{list.name || 'Adsız liste'}</Button>
                </Table.Cell>
                <Table.Cell><Badge variant={list.source === 'external' ? 'secondary' : 'outline'}>{list.source === 'external' ? 'MEB' : 'Okul'}</Badge></Table.Cell>
                <Table.Cell class="text-right tabular-nums">{list.items.length}</Table.Cell>
                <Table.Cell class="text-right">{count || 'Okul geneli'}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {:else}
      <p class="py-8 text-sm text-muted-foreground" role="status">Henüz liste yok. "Hazır listelerden ekle" ile MEB listelerini ekleyin ya da boş bir liste başlatın.</p>
    {/if}
    <LibraryDialog bind:open={libraryOpen} />
    <ProposeItemDialog bind:open={proposeOpen} />
  {/if}
</div>
