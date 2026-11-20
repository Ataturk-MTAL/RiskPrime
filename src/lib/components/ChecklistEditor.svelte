<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import ChecklistLocations from './ChecklistLocations.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import QuestionBankDialog from './QuestionBankDialog.svelte';
  import { applyBankChanges, bankChanges } from '$lib/domain/bank-sync';
  import { addItem,removeChecklist, removeItem, updateChecklist, updateItem } from '$lib/domain/checklist';
  import type { ChecklistItem } from '$lib/domain/types';
  import { nav } from '$lib/nav.svelte';
  import { focusFirstField, store } from '$lib/state.svelte';

  const ROW_GRID = 'grid-cols-[4rem_minmax(0,1fr)_2rem]';

  // The template only: item texts. Answers are entered per location, under Mekânlar.
  let { listId }: { listId: string } = $props();

  let bankOpen = $state(false);
  const list = $derived(store.assessment.checklists.find((l) => l.id === listId));
  const outdated = $derived(new Set(bankChanges(store.assessment).updated.filter((u) => u.listId === listId).map((u) => u.itemId)));
  const takeBankText = (itemId: string) =>
    store.applyWithUndo((a) => applyBankChanges(a, { itemIds: [itemId], addedKeys: [] }), 'Madde metni güncel kontrol listesindeki gibi değiştirildi.');
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();

  const patchItem = (itemId: string, patch: Partial<Pick<ChecklistItem, 'no' | 'text'>>) =>
    store.apply((a) => updateItem(a, listId, itemId, patch));

  function addNewItem() {
    const before = list?.items.length ?? 0;
    if (!store.apply((a) => addItem(a, listId))) return;
    const created = list?.items[before];
    if (created) focusFirstField(`item-${created.id}`);
  }

  function remove() {
    if (store.apply((a) => removeChecklist(a, listId))) nav.openLibrary();
  }
</script>

<section class="min-w-0 space-y-3 rounded-xl border bg-card p-3">
  {#if list}
    {@const locked = list.source === 'external'}
    <div class="flex flex-wrap items-end gap-2">
      {#if locked}
        <div class="min-w-0 flex-1 space-y-1">
          <Badge variant="secondary" title="MEB formunun hazır metni değiştirilemez; madde eklenip çıkarılabilir">MEB · metin kilitli</Badge>
          <h2 class="font-semibold">{list.code} {list.name}</h2>
        </div>
      {:else}
        {#key listId}
          <Label class="flex w-28 flex-col items-start gap-1">Kod
            <Input value={list.code} onchange={(e) => store.apply((a) => updateChecklist(a, listId, { code: value(e) }))} />
          </Label>
          <Label class="flex min-w-48 flex-1 flex-col items-start gap-1">Liste adı
            <Input value={list.name} onchange={(e) => store.apply((a) => updateChecklist(a, listId, { name: value(e) }))} />
          </Label>
        {/key}
      {/if}
      <ChecklistLocations {list} />
      <ConfirmDialog
        label="Listeyi sil"
        variant="destructive"
        size="default"
        title="Liste silinsin mi?"
        description={`"${list.code} ${list.name}" listesi ve tüm mekânlardaki cevapları silinecek.`}
        onconfirm={remove}
      ><Trash2 />Listeyi sil</ConfirmDialog>
    </div>

    <div class="space-y-2">
      {#each list.items as item (item.id)}
        {@const textLocked = locked && !item.added}
        <div id="item-{item.id}" class="grid items-start gap-2 rounded-lg border p-2 {ROW_GRID}">
          {#if textLocked}
            <span class="pt-1.5 text-sm">{item.no}</span>
            <span class="pt-1.5 text-sm">{item.text}</span>
          {:else}
            <Input class="w-16" aria-label="Madde no" value={item.no} onchange={(e) => patchItem(item.id, { no: value(e) })} />
            <Textarea class="min-h-9 py-1.5" rows={1} aria-label="Madde metni" placeholder="Kontrol maddesi" value={item.text} onchange={(e) => patchItem(item.id, { text: value(e) })} />
          {/if}
          <ConfirmDialog label="Maddeyi sil" title="Madde silinsin mi?" description="Bu kontrol maddesi ve cevapları silinecek." onconfirm={() => store.apply((a) => removeItem(a, listId, item.id))}>
            <Trash2 />
          </ConfirmDialog>
          {#if outdated.has(item.id)}
            <div class="col-start-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Güncel metin var</Badge>
              <Button variant="link" size="sm" class="h-auto p-0" onclick={() => takeBankText(item.id)}>Yeni metni al</Button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    <div class="flex flex-wrap gap-2">
      <Button onclick={addNewItem}><Plus />Madde ekle</Button>
      <Button variant="outline" onclick={() => (bankOpen = true)}>Kontrol listelerinden madde ekle</Button>
    </div>
    <QuestionBankDialog bind:open={bankOpen} {listId} />
  {:else}
    <p class="py-8 text-center text-sm text-muted-foreground">Liste bulunamadı. Kütüphane sayfasından bir liste seçin.</p>
  {/if}
</section>
