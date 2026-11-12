<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { Toaster } from '$lib/components/ui/sonner';
  import AppSidebar from '$lib/components/AppSidebar.svelte';
  import AppTopbar from '$lib/components/AppTopbar.svelte';
  import ChecklistEditor from '$lib/components/ChecklistEditor.svelte';
  import ConflictDialog from '$lib/components/ConflictDialog.svelte';
  import DiscardDialog from '$lib/components/DiscardDialog.svelte';
  import LocationEditor from '$lib/components/LocationEditor.svelte';
  import Notices from '$lib/components/Notices.svelte';
  import OverviewPage from '$lib/components/OverviewPage.svelte';
  import ReadinessDialog from '$lib/components/ReadinessDialog.svelte';
  import ReadinessPage from '$lib/components/ReadinessPage.svelte';
  import SchoolCard from '$lib/components/SchoolCard.svelte';
  import { dragHasFiles, isOpenableFile, UNSUPPORTED_DROP_MESSAGE } from '$lib/drop';
  import { formatHash, parseHash } from '$lib/route';
  import { store } from '$lib/state.svelte';

  const PAGE_TITLES = {
    overview: 'Genel bakış',
    school: 'Okul bilgileri',
    checklists: 'Kontrol listeleri',
    risk: 'Risk tablosu',
    readiness: 'Hazırlık ve PDF',
  } as const;

  const currentHash = () => formatHash(store.tab, store.tab === 'checklists' ? store.checklistId : store.tab === 'risk' ? store.locationId : null);

  /** Hash -> view. Ids that no longer exist are ignored; the URL is then rewritten to what is shown. */
  function applyHash() {
    const { tab, id } = parseHash(location.hash);
    if (tab === 'checklists' && id && store.assessment.checklists.some((c) => c.id === id)) store.checklistId = id;
    if (tab === 'risk' && id && store.assessment.locations.some((l) => l.id === id)) store.locationId = id;
    store.tab = tab;
    history.replaceState(null, '', currentHash());
  }

  applyHash();

  // View -> hash: every view change is a history entry so the back button works.
  $effect(() => {
    const next = currentHash();
    if (next !== location.hash) history.pushState(null, '', next);
  });

  const dialogOpen = () =>
    store.discard !== null ||
    store.conflict !== null ||
    store.readinessGaps !== null ||
    document.querySelector('[role=dialog],[role=alertdialog]') !== null;

  function onDragOver(event: DragEvent) {
    if (dragHasFiles(event.dataTransfer?.types)) event.preventDefault();
  }

  function onDrop(event: DragEvent) {
    if (!dragHasFiles(event.dataTransfer?.types)) return;
    event.preventDefault();
    if (dialogOpen()) return;
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    if (isOpenableFile(file.name)) store.openFile(file);
    else store.fail([UNSUPPORTED_DROP_MESSAGE]);
  }

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!store.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  }
</script>

<svelte:window ondragover={onDragOver} ondrop={onDrop} onbeforeunload={onBeforeUnload} onhashchange={applyHash} onpopstate={applyHash} />

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset class="min-w-0">
    <AppTopbar />
    <div class="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4">
      <Notices />
      {#if store.tab !== 'overview'}<h1 class="text-2xl font-semibold">{PAGE_TITLES[store.tab]}</h1>{/if}
      {#if store.tab === 'overview'}
        <OverviewPage />
      {:else if store.tab === 'school'}
        <SchoolCard />
      {:else if store.tab === 'checklists'}
        <ChecklistEditor />
      {:else if store.tab === 'risk'}
        <LocationEditor />
      {:else}
        <ReadinessPage />
      {/if}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

<ReadinessDialog />
<ConflictDialog />
<DiscardDialog />
<Toaster />
