<script lang="ts">
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { Button } from '$lib/components/ui/button';
  import { Progress } from '$lib/components/ui/progress';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import ChecklistItemLinks from './ChecklistItemLinks.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ANSWER_LABELS } from '$lib/domain/checklist';
  import { commonOfItem, setAnswerShared, setNoteShared, siblingTargets } from '$lib/domain/common-items';
  import { commonById } from '$lib/domain/question-bank';
  import { answerOf, findInspection, inspectionSummary, liveLocationIds, scopeName } from '$lib/domain/inspections';
  import { setChecklistLocations } from '$lib/domain/links';
  import { countUntransferredInspection, transferInspection } from '$lib/domain/transfer-inspection';
  import type { Answer } from '$lib/domain/types';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  // One list answered in one location (an inspection); null = okul geneli (shown on the report page).
  let { listId, locationId }: { listId: string; locationId: string | null } = $props();

  const CHOICES: { value: Exclude<Answer, ''>; tone: string }[] = [
    { value: 'yes', tone: 'data-[state=on]:bg-green-700 data-[state=on]:text-white' },
    { value: 'no', tone: 'data-[state=on]:bg-red-600 data-[state=on]:text-white' },
    { value: 'na', tone: 'data-[state=on]:bg-gray-500 data-[state=on]:text-white' },
  ];
  const ROW_GRID = '@3xl:grid-cols-[4rem_minmax(0,2fr)_auto_minmax(0,1.2fr)]';

  const list = $derived(store.assessment.checklists.find((c) => c.id === listId));
  const inspection = $derived(findInspection(store.assessment, listId, locationId));
  const stats = $derived(inspection ? inspectionSummary(store.assessment, inspection) : { total: 0, answered: 0, no: 0 });
  const pending = $derived(countUntransferredInspection(store.assessment, listId, locationId));
  const isLastLocation = $derived(list ? liveLocationIds(store.assessment, list).length <= 1 : false);
  /** Refs of the same question in other lists at this location (answered together). */
  const siblingRefs = (itemId: string) =>
    siblingTargets(store.assessment, listId, itemId, locationId).flatMap((t) => {
      const ref = store.assessment.checklists.find((c) => c.id === t.listId)?.items.find((i) => i.id === t.itemId)?.ref;
      return ref ? [ref] : [];
    });
  const value = (e: Event) => (e.currentTarget as HTMLTextAreaElement).value.trim();

  function transfer() {
    const result = transferInspection(store.assessment, listId, locationId);
    if (!result.created) return;
    store.applyWithUndo(
      () => result.assessment,
      `${result.created} risk satırı oluşturuldu; Riskler'de puanlayın.`,
    );
  }

  function removeFromLocation() {
    if (!list || !locationId) return;
    const rest = liveLocationIds(store.assessment, list).filter((id) => id !== locationId);
    if (store.apply((a) => setChecklistLocations(a, listId, rest))) nav.openLocation(locationId, 'inspections');
  }
</script>

{#if list && inspection}
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="min-w-0 flex-1 font-semibold">{list.code ? `${list.code} · ` : ''}{list.name || 'Adsız liste'}</h2>
      <Button variant="outline" size="sm" onclick={() => nav.openLibrary(listId)}><Pencil />Listeyi düzenle</Button>
      {#if locationId}
      <ConfirmDialog
        label="Listeyi bu mekândan kaldır"
        variant="outline"
        size="sm"
        confirmLabel="Kaldır"
        title="Liste bu mekândan kaldırılsın mı?"
        description={`"${scopeName(store.assessment, locationId)}" mekânındaki bu listenin cevapları ve bağlı risk satırı kaynakları silinecek.${isLastLocation ? ' Başka mekânı kalmayan liste genel (okul geneli) olur.' : ''}`}
        onconfirm={removeFromLocation}
      ><Trash2 />Listeyi bu mekândan kaldır</ConfirmDialog>
      {/if}
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Progress value={stats.answered} max={stats.total || 1} class="h-2 max-w-sm" aria-label="Cevaplanan madde oranı" />
      <span class="text-sm text-muted-foreground">
        {stats.answered}/{stats.total} cevaplandı{#if stats.no}{' '}· <b class="text-red-600">{stats.no} eksik</b>{/if}
      </span>
      <Button variant="outline" size="sm" disabled={pending === 0} onclick={transfer}>Eksikleri risk tablosuna aktar ({pending})</Button>
    </div>

    <div class="@container space-y-2">
      <div class="hidden gap-2 px-2 text-xs font-semibold text-muted-foreground @3xl:grid {ROW_GRID}">
        <span>No</span><span>Kontrol maddesi</span><span>Cevap</span><span>Açıklama</span>
      </div>
      {#each list.items as item (item.id)}
        {@const current = answerOf(store.assessment, listId, locationId, item.id)}
        {@const refs = siblingRefs(item.id)}
        <div id="item-{item.id}" class="grid items-start gap-2 rounded-lg border p-2 {ROW_GRID}">
          <span class="pt-1.5 text-sm">{item.no}</span>
          <div class="space-y-1 pt-1.5 text-sm">
            <p>{item.text}</p>
            {#if refs.length}
              <Badge variant="outline" title={commonById(commonOfItem(item) ?? '')?.title}>Ortak: {refs.join(' · ')}</Badge>
            {/if}
          </div>
          <div class="flex flex-col items-start gap-1.5">
            <ToggleGroup.Root type="single" variant="outline" aria-label="Madde {item.no} cevabı" value={current.answer} onValueChange={(v) => store.apply((a) => setAnswerShared(a, listId, locationId, item.id, v as Answer))}>
              {#each CHOICES as choice (choice.value)}
                <ToggleGroup.Item value={choice.value} class={choice.tone} title={choice.value === 'na' ? 'Uygulanamaz' : undefined}>{ANSWER_LABELS[choice.value]}</ToggleGroup.Item>
              {/each}
            </ToggleGroup.Root>
            <ChecklistItemLinks {list} {item} {locationId} />
          </div>
          <Textarea class="min-h-9 py-1.5" rows={1} aria-label="Açıklama" placeholder="Açıklama / tarih / sorumlu" value={current.note} onchange={(e) => store.apply((a) => setNoteShared(a, listId, locationId, item.id, value(e)))} />
        </div>
      {/each}
    </div>
  </div>
{:else}
  <p class="py-6 text-center text-sm text-muted-foreground">Bu mekânda böyle bir denetim yok.</p>
{/if}
