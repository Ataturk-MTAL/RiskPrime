<script lang="ts">
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import { Button } from '$lib/components/ui/button';
  import ExportMenu from './ExportMenu.svelte';
  import { store } from '$lib/state.svelte';

  let fileInput: HTMLInputElement;

  function onPick(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) store.openFile(file);
  }
</script>

<header class="flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-xl font-bold">RiskPrime <span class="text-sm font-normal text-muted-foreground">İSG risk değerlendirmesi</span></h1>
  <nav class="flex flex-wrap items-center gap-2" aria-label="Dosya işlemleri">
    <Button variant="outline" onclick={() => store.newFromStarter()}>Yeni (okul verisiyle)</Button>
    <Button variant="outline" onclick={() => store.newEmpty()}>Yeni (boş)</Button>
    <Button variant="outline" onclick={() => fileInput.click()}><FolderOpen />Dosya aç</Button>
    <input bind:this={fileInput} type="file" accept=".json,application/json,.xlsx,.xls" hidden onchange={onPick} aria-label="Dosya seç" />
    <ExportMenu />
  </nav>
</header>
