<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import LibraryIcon from '@lucide/svelte/icons/library';
  import Plus from '@lucide/svelte/icons/plus';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import ChecklistEditor from './ChecklistEditor.svelte';
  import EmptyState from './EmptyState.svelte';
  import LibraryDialog from './LibraryDialog.svelte';
  import PageHeader from './PageHeader.svelte';
  import ProposeItemDialog from './ProposeItemDialog.svelte';
  import { bankChanges } from '$lib/domain/bank-sync';
  import { LIMITS } from '$lib/domain/proposal';
  import { liveLocationIds } from '$lib/domain/inspections';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  let libraryOpen = $state(false);
  // The desktop app hands a proposal over as ?oner=<text>; open the dialog prefilled, then drop the param.
  const prefill = new URLSearchParams(location.search).get('oner')?.trim().slice(0, LIMITS.textMax) ?? '';
  let proposeOpen = $state(prefill !== '');
  if (prefill) history.replaceState(null, '', location.pathname + location.hash);
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

<div class="flex flex-col gap-6">
  <PageHeader title="Kütüphane" />

  {#if openId}
    <div>
      <Button variant="ghost" size="sm" onclick={() => nav.openLibrary()}><ArrowLeft />Kütüphane</Button>
    </div>
    <ChecklistEditor listId={openId} />
  {:else}
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
      <EmptyState icon={LibraryIcon} text="Henüz liste yok." action={{ label: 'Hazır listelerden ekle', run: () => (libraryOpen = true) }} />
    {/if}
    <LibraryDialog bind:open={libraryOpen} />
    <ProposeItemDialog bind:open={proposeOpen} initialText={prefill} />
  {/if}
</div>
