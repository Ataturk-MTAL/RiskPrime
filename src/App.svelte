<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Toaster } from '$lib/components/ui/sonner';
  import AboutFooter from '$lib/components/AboutFooter.svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import ChecklistEditor from '$lib/components/ChecklistEditor.svelte';
  import ChecklistSidebar from '$lib/components/ChecklistSidebar.svelte';
  import ConflictDialog from '$lib/components/ConflictDialog.svelte';
  import DiscardDialog from '$lib/components/DiscardDialog.svelte';
  import LibraryDialog from '$lib/components/LibraryDialog.svelte';
  import LocationEditor from '$lib/components/LocationEditor.svelte';
  import LocationSidebar from '$lib/components/LocationSidebar.svelte';
  import Notices from '$lib/components/Notices.svelte';
  import SchoolCard from '$lib/components/SchoolCard.svelte';
  import { dragHasFiles, isOpenableFile, UNSUPPORTED_DROP_MESSAGE } from '$lib/drop';
  import { store, type Tab } from '$lib/state.svelte';

  let libraryOpen = $state(false);
  const rowCount = $derived(store.assessment.locations.reduce((sum, l) => sum + l.rows.length, 0));

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

<svelte:window ondragover={onDragOver} ondrop={onDrop} onbeforeunload={onBeforeUnload} />

<div class="flex min-h-screen flex-col">
<AppHeader />
<div class="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4">
  <Notices />
  <SchoolCard />

  <Tabs.Root class="flex-col" value={store.tab} onValueChange={(v) => (store.tab = v as Tab)}>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Tabs.List class="max-w-full overflow-x-auto">
        <Tabs.Trigger value="risk">Risk tablosu <Badge variant="secondary">{store.assessment.locations.length} mekân<span class="max-sm:hidden"> · {rowCount} satır</span></Badge></Tabs.Trigger>
        <Tabs.Trigger value="checklists">Kontrol listeleri <Badge variant="secondary">{store.assessment.checklists.length}</Badge></Tabs.Trigger>
      </Tabs.List>
      <Button variant="outline" onclick={() => (libraryOpen = true)}>+ Hazır formdan ekle</Button>
    </div>
    <Tabs.Content value="risk" class="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
      <LocationSidebar />
      <LocationEditor />
    </Tabs.Content>
    <Tabs.Content value="checklists" class="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
      <ChecklistSidebar />
      <ChecklistEditor />
    </Tabs.Content>
  </Tabs.Root>

  <AboutFooter />
</div>
</div>

<LibraryDialog bind:open={libraryOpen} />
<ConflictDialog />
<DiscardDialog />
<Toaster />
