<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import EmptyState from './EmptyState.svelte';
  import InspectionEditor from './InspectionEditor.svelte';
  import PageHeader from './PageHeader.svelte';
  import SelectField from './SelectField.svelte';
  import { INTERACTIVE_ROW, SECTION_TITLE } from './shared-classes';
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

<div class="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
  <div class="flex items-start gap-2">
    <Button variant="ghost" size="icon" aria-label="Mekânlar listesine dön" onclick={() => nav.go('locations')}><ArrowLeft /></Button>
    <div class="min-w-0 flex-1">
      <PageHeader
        title={loc.name || 'Adsız mekân'}
        subtitle={`${LOCATION_TYPE_LABELS[loc.type]}${loc.building ? ` · ${loc.building}` : ''}${loc.area ? ` · ${loc.area}` : ''}`}
      >
        {#snippet actions()}
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
        {/snippet}
      </PageHeader>
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

  <section class="space-y-2" aria-labelledby="location-lists">
    <h2 id="location-lists" class={SECTION_TITLE}>Kontrol listeleri</h2>
    {#if inspections.length === 0}
      <EmptyState icon={ListChecks} text="Bu mekâna atanmış kontrol listesi yok." />
    {:else}
      <ul class="divide-y rounded-md border">
        {#each inspections as i (i.list.id)}
          {@const isOpen = openListId === i.list.id}
          <li>
            <Collapsible.Root open={isOpen} onOpenChange={(o) => nav.openLocation(id, o ? i.list.id : null)}>
              <Collapsible.Trigger class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center justify-between gap-2 p-3 text-left">
                <span class="min-w-0 font-medium">{listLabel(i.list.code, i.list.name)}</span>
                <span class="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  {i.answered}/{i.total}{#if i.no}{' '}· <b class="text-deficiency">{i.no} eksik</b>{/if}
                  <ChevronDown class="size-4 transition-transform motion-reduce:transition-none {isOpen ? 'rotate-180' : ''}" aria-hidden="true" />
                </span>
              </Collapsible.Trigger>
              <Collapsible.Content class="border-t p-3">
                {#if isOpen}<InspectionEditor listId={i.list.id} locationId={id} />{/if}
              </Collapsible.Content>
            </Collapsible.Root>
          </li>
        {/each}
      </ul>
    {/if}
    {#if addable.length}
      <div class="max-w-sm space-y-1">
        <span class="text-xs text-muted-foreground" aria-hidden="true">Bu mekâna liste ekle</span>
        <SelectField label="Bu mekâna liste ekle" options={addable} value="" onValueChange={addList} />
      </div>
    {/if}
  </section>
</div>
