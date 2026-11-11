<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Progress } from '$lib/components/ui/progress';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import ChecklistItemLinks from './ChecklistItemLinks.svelte';
  import ChecklistLocations from './ChecklistLocations.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { countUntransferred } from '$lib/domain/transfer';
  import QuestionBankDialog from './QuestionBankDialog.svelte';
  import { addItem, ANSWER_LABELS, removeChecklist, removeItem, summary, updateChecklist, updateItem } from '$lib/domain/checklist';
  import type { Answer, ChecklistItem } from '$lib/domain/types';
  import { focusFirstField, store } from '$lib/state.svelte';

  const CHOICES: { value: Exclude<Answer, ''>; tone: string }[] = [
    { value: 'yes', tone: 'data-[state=on]:bg-green-700 data-[state=on]:text-white' },
    { value: 'no', tone: 'data-[state=on]:bg-red-600 data-[state=on]:text-white' },
    { value: 'na', tone: 'data-[state=on]:bg-gray-500 data-[state=on]:text-white' },
  ];
  const ROW_GRID = '@3xl:grid-cols-[4rem_minmax(0,2fr)_auto_minmax(0,1.2fr)_2rem]';

  let bankOpen = $state(false);
  const list = $derived(store.checklist);
  const untransferred = $derived(list ? countUntransferred(store.assessment, list.id) : 0);
  const stats = $derived(list ? summary(list) : { total: 0, answered: 0, no: 0 });
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();

  const patchItem = (listId: string, itemId: string, patch: Partial<Pick<ChecklistItem, 'no' | 'text' | 'answer' | 'note'>>) =>
    store.apply((a) => updateItem(a, listId, itemId, patch));

  function addNewItem(listId: string) {
    const before = store.checklist?.items.length ?? 0;
    if (!store.apply((a) => addItem(a, listId))) return;
    const created = store.checklist?.items[before];
    if (created) focusFirstField(`item-${created.id}`);
  }
</script>

<section class="min-w-0 space-y-3 rounded-xl border bg-card p-3">
  {#if list}
    {@const listId = list.id}
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
        description={`"${list.code} ${list.name}" listesi ve cevapları silinecek.`}
        onconfirm={() => store.apply((a) => removeChecklist(a, listId))}
      ><Trash2 />Listeyi sil</ConfirmDialog>
    </div>

    <div class="flex items-center gap-3">
      <Progress value={stats.answered} max={stats.total || 1} class="h-2 max-w-sm" aria-label="Cevaplanan madde oranı" />
      <span class="text-sm text-muted-foreground">
        {stats.answered}/{stats.total} cevaplandı{#if stats.no}{" "}· <b class="text-red-600">{stats.no} eksik</b>{/if}
      </span>
      <Button variant="outline" size="sm" disabled={untransferred === 0} onclick={() => store.transferMissing(listId)}>Eksikleri risk tablosuna aktar ({untransferred})</Button>
    </div>

    <div class="@container space-y-2">
      <div class="hidden gap-2 px-2 text-xs font-semibold text-muted-foreground @3xl:grid {ROW_GRID}">
        <span>No</span><span>Kontrol maddesi</span><span>Cevap</span><span>Açıklama</span><span class="sr-only">Sil</span>
      </div>
      {#each list.items as item (item.id)}
        {@const textLocked = locked && !item.added}
        <div id="item-{item.id}" class="grid items-start gap-2 rounded-lg border p-2 {ROW_GRID}">
          {#if textLocked}
            <span class="pt-1.5 text-sm">{item.no}</span>
            <span class="pt-1.5 text-sm">{item.text}</span>
          {:else}
            <Input class="w-16" aria-label="Madde no" value={item.no} onchange={(e) => patchItem(listId, item.id, { no: value(e) })} />
            <Textarea class="min-h-9 py-1.5" rows={1} aria-label="Madde metni" placeholder="Kontrol maddesi" value={item.text} onchange={(e) => patchItem(listId, item.id, { text: value(e) })} />
          {/if}
          <div class="flex flex-col items-start gap-1.5">
            <ToggleGroup.Root type="single" variant="outline" aria-label="Madde {item.no} cevabı" value={item.answer} onValueChange={(v) => patchItem(listId, item.id, { answer: v as Answer })}>
              {#each CHOICES as choice (choice.value)}
                <ToggleGroup.Item value={choice.value} class={choice.tone}>{ANSWER_LABELS[choice.value]}</ToggleGroup.Item>
              {/each}
            </ToggleGroup.Root>
            <ChecklistItemLinks {list} {item} />
          </div>
          <Textarea class="min-h-9 py-1.5" rows={1} aria-label="Açıklama" placeholder="Açıklama / tarih / sorumlu" value={item.note} onchange={(e) => patchItem(listId, item.id, { note: value(e) })} />
          <ConfirmDialog label="Maddeyi sil" title="Madde silinsin mi?" description="Bu kontrol maddesi silinecek." onconfirm={() => store.apply((a) => removeItem(a, listId, item.id))}>
            <Trash2 />
          </ConfirmDialog>
        </div>
      {/each}
    </div>
    <p class="text-sm text-muted-foreground">"Hayır" cevaplanan her madde bir eksiktir; eksikler risk tablosunda puanlanır. U/D: uygulanamaz. Seçili cevaba tekrar basınca cevap silinir.</p>
    <div class="flex flex-wrap gap-2">
      <Button onclick={() => addNewItem(listId)}><Plus />Madde ekle</Button>
      <Button variant="outline" onclick={() => (bankOpen = true)}>Bankadan soru ekle</Button>
    </div>
    <QuestionBankDialog bind:open={bankOpen} {listId} />
  {:else}
    <p class="py-8 text-center text-sm text-muted-foreground">Soldan bir liste seçin ya da "+ Hazır formdan ekle" ile liste ekleyin.</p>
  {/if}
</section>
