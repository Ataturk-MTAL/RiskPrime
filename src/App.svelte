<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { Toaster } from '$lib/components/ui/sonner';
  import AboutDialog from '$lib/components/AboutDialog.svelte';
  import AppSidebar from '$lib/components/AppSidebar.svelte';
  import AppTopbar from '$lib/components/AppTopbar.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import ConflictDialog from '$lib/components/ConflictDialog.svelte';
  import DeficienciesPage from '$lib/components/DeficienciesPage.svelte';
  import DiscardDialog from '$lib/components/DiscardDialog.svelte';
  import LockBanner from '$lib/components/LockBanner.svelte';
  import PeriodsDialog from '$lib/components/PeriodsDialog.svelte';
  import LibraryPage from '$lib/components/LibraryPage.svelte';
  import LocationsPage from '$lib/components/LocationsPage.svelte';
  import Notices from '$lib/components/Notices.svelte';
  import OverviewPage from '$lib/components/OverviewPage.svelte';
  import ReadinessDialog from '$lib/components/ReadinessDialog.svelte';
  import ReportPage from '$lib/components/ReportPage.svelte';
  import RiskRegisterPage from '$lib/components/RiskRegisterPage.svelte';
  import { dragHasFiles, isOpenableFile, UNSUPPORTED_DROP_MESSAGE } from '$lib/drop';
  import { nav } from '$lib/nav.svelte';
  import { formatHash, parseHash } from '$lib/nav-route';
  import { store } from '$lib/state.svelte';

  let aboutOpen = $state(false);
  let periodsOpen = $state(false);

  /** Hash -> place. Ids that no longer exist are dropped; the URL is then rewritten to what is shown. */
  function applyHash() {
    const place = parseHash(location.hash);
    const { locations, checklists } = store.assessment;
    nav.place = {
      ...place,
      locationId: locations.some((l) => l.id === place.locationId) ? place.locationId : null,
      listId: checklists.some((c) => c.id === place.listId) ? place.listId : null,
    };
    history.replaceState(null, '', formatHash(nav.place));
  }

  applyHash();

  // Place -> hash: every change is a history entry so the back button works.
  $effect(() => {
    const next = formatHash(nav.place);
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
  <AppSidebar onAbout={() => (aboutOpen = true)} />
  <Sidebar.Inset class="min-w-0">
    <AppTopbar onAbout={() => (aboutOpen = true)} onPeriods={() => (periodsOpen = true)} />
    <div class="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 max-md:pb-24">
      <Notices />
      <LockBanner />
      {#key store.refusedEdits}
      {#if nav.section === 'overview'}
        <OverviewPage />
      {:else if nav.section === 'locations'}
        <LocationsPage />
      {:else if nav.section === 'deficiencies'}
        <DeficienciesPage />
      {:else if nav.section === 'register'}
        <RiskRegisterPage />
      {:else if nav.section === 'report'}
        <ReportPage onPeriods={() => (periodsOpen = true)} />
      {:else}
        <LibraryPage />
      {/if}
      {/key}
    </div>
  </Sidebar.Inset>
  <BottomNav />
</Sidebar.Provider>

<AboutDialog bind:open={aboutOpen} />
<PeriodsDialog bind:open={periodsOpen} />
<ReadinessDialog />
<ConflictDialog />
<DiscardDialog />
<Toaster />
