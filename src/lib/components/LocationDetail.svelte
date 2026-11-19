<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import InspectionEditor from './InspectionEditor.svelte';
  import SelectField from './SelectField.svelte';
  import { INTERACTIVE_ROW } from './shared-classes';
  import { duplicateLocation, groupNeighbourId, LOCATION_TYPES, LOCATION_TYPE_LABELS, moveLocation, newId, removeLocation, updateLocation } from '$lib/domain/assessment';
  import { inspectionsForLocation, inspectionSummary, liveLocationIds } from '$lib/domain/inspections';
  import { setChecklistLocations } from '$lib/domain/links';
  import { riskLevel } from '$lib/domain/matrix';
  import type { Location, LocationType } from '$lib/domain/types';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  let { location: loc }: { location: Location } = $props();

  const TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: LOCATION_TYPE_LABELS[value] }));
  const value = (e: Event) => (e.currentTarget as HTMLInputElement).value.trim();
  const listLabel = (code: string, name: string) => `${code ? `${code} · ` : ''}${name || 'Adsız liste'}`;

  let deleteOpen = $state(false);
  const id = $derived(loc.id);
  const canMoveUp = $derived(groupNeighbourId(store.assessment, id, -1) !== null);
  const canMoveDown = $derived(groupNeighbourId(store.assessment, id, 1) !== null);
  const scoredRows = $derived(loc.rows.filter((r) => riskLevel(r.likelihood, r.severity)).length);

  const inspections = $derived(
    inspectionsForLocation(store.assessment, id).flatMap((insp) => {
      const list = store.assessment.checklists.find((c) => c.id === insp.checklistId);
      return list ? [{ list, ...inspectionSummary(store.assessment, insp) }] : [];
    }),
  );
  const openListId = $derived(nav.place.listId && inspections.some((i) => i.list.id === nav.place.listId) ? nav.place.listId : null);
  // Lists not yet applied here; a general list (no locations) is converted to a per-location one.
  const addable = $derived(
    store.assessment.checklists
      .filter((c) => !liveLocationIds(store.assessment, c).includes(id))
      .map((c) => ({ value: c.id, label: listLabel(c.code, c.name), hint: liveLocationIds(store.assessment, c).length ? undefined : 'genel liste' })),
  );

  function addList(listId: string) {
    const list = store.assessment.checklists.find((c) => c.id === listId);
    if (!list) return;
    const next = [...liveLocationIds(store.assessment, list), id];
    if (store.apply((a) => setChecklistLocations(a, listId, next))) nav.openLocation(id, listId);
  }

  function duplicate() {
    const copyId = newId('a');
    if (store.apply((a) => duplicateLocation(a, id, copyId))) nav.openLocation(copyId);
  }

  function remove() {
    if (store.apply((a) => removeLocation(a, id))) nav.go('locations');
  }

  // The shared store has no per-location export kind, so this drives the PDF module itself.
  async function exportPdf() {
    store.busy = 'PDF hazırlanıyor… (ilk seferde derleyici indirilir, biraz sürebilir)';
    store.clearErrors();
    try {
      await (await import('$lib/export/pdf')).downloadPdf(store.assessment, 'full', id);
    } catch (error) {
      store.fail([`Çıktı alınamadı: ${error instanceof Error ? error.message : ''}`]);
    } finally {
      store.busy = '';
    }
  }
</script>

<div class="mx-auto w-full max-w-3xl min-w-0 space-y-3">
  <div class="flex flex-wrap items-center gap-2">
    <Button variant="ghost" size="icon" aria-label="Mekânlar listesine dön" onclick={() => nav.go('locations')}><ArrowLeft /></Button>
    <div class="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
      <h1 class="text-2xl font-semibold wrap-break-word sm:truncate">{loc.name || 'Adsız mekân'}</h1>
      <p class="text-sm text-muted-foreground sm:truncate">{LOCATION_TYPE_LABELS[loc.type]}{loc.building ? ` · ${loc.building}` : ''}{loc.area ? ` · ${loc.area}` : ''}</p>
    </div>
    <div class="ml-auto flex items-center gap-2">
      <Button variant="outline" onclick={() => nav.openRegister({ locationId: id })}>Riskler ({scoredRows}/{loc.rows.length} puanlı)</Button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })} aria-label="Mekân işlemleri"><Ellipsis /></DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item disabled={!canMoveUp} onSelect={() => store.apply((a) => moveLocation(a, id, -1))}>Yukarı taşı</DropdownMenu.Item>
          <DropdownMenu.Item disabled={!canMoveDown} onSelect={() => store.apply((a) => moveLocation(a, id, 1))}>Aşağı taşı</DropdownMenu.Item>
          <DropdownMenu.Item disabled={store.busy !== ''} onSelect={exportPdf}>Bu mekânın PDF'i</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={duplicate}>Mekânı çoğalt</DropdownMenu.Item>
          <DropdownMenu.Item class="text-destructive" onSelect={() => (deleteOpen = true)}>Mekânı sil</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>

  <AlertDialog.Root bind:open={deleteOpen}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Mekân silinsin mi?</AlertDialog.Title>
        <AlertDialog.Description>{`"${loc.name}" ve ${loc.rows.length} satırı silinecek.`}</AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
        <AlertDialog.Action onclick={remove}>Sil</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>

  <Collapsible.Root class="rounded-md border">
    <Collapsible.Trigger class="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm">
      Mekân bilgilerini düzenle<ChevronsUpDown class="size-4 text-muted-foreground" aria-hidden="true" />
    </Collapsible.Trigger>
    <Collapsible.Content class="@container border-t p-3">
      {#key id}
        <div class="grid gap-2 @lg:grid-cols-2">
          <Label class="flex flex-col items-start gap-1 @lg:col-span-2">Mekân adı
            <Input value={loc.name} onchange={(e) => store.apply((a) => updateLocation(a, id, { name: value(e) }))} />
          </Label>
          <Label class="flex flex-col items-start gap-1">Tür
            <SelectField label="Tür" options={TYPE_OPTIONS} value={loc.type} onValueChange={(v) => store.apply((a) => updateLocation(a, id, { type: v as LocationType }))} />
          </Label>
          <Label class="flex flex-col items-start gap-1">Bina
            <Input list="building-list" value={loc.building} placeholder="ör. C Blok" onchange={(e) => store.apply((a) => updateLocation(a, id, { building: value(e) }))} />
          </Label>
          <Label class="flex flex-col items-start gap-1">Alan
            <Input list="area-list" value={loc.area} onchange={(e) => store.apply((a) => updateLocation(a, id, { area: value(e) }))} />
          </Label>
        </div>
      {/key}
    </Collapsible.Content>
  </Collapsible.Root>

  <div class="space-y-3">
    {#if openListId}
      {#key openListId}<InspectionEditor listId={openListId} locationId={id} />{/key}
    {:else}
      {#if inspections.length === 0}
        <p class="py-4 text-center text-sm text-muted-foreground">Bu mekâna atanmış kontrol listesi yok.</p>
      {/if}
      <ul class="space-y-2">
        {#each inspections as i (i.list.id)}
          <li>
            <button type="button" class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border bg-card p-3 text-left" onclick={() => nav.openLocation(id, i.list.id)}>
              <span class="min-w-0 font-medium">{listLabel(i.list.code, i.list.name)}</span>
              <span class="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                {i.answered}/{i.total} cevaplı
                {#if i.no}<Badge variant="destructive">{i.no} eksik</Badge>{/if}
                <ChevronRight class="size-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        {/each}
      </ul>
      {#if addable.length}
        <div class="max-w-sm space-y-1">
          <span class="text-xs text-muted-foreground" aria-hidden="true">Bu mekâna liste ekle</span>
          <SelectField label="Bu mekâna liste ekle" options={addable} value="" onValueChange={addList} />
        </div>
      {/if}
    {/if}
  </div>
</div>
