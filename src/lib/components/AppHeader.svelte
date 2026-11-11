<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import ExportMenu from './ExportMenu.svelte';
  import { store } from '$lib/state.svelte';
  import { downloadBlankTemplate, downloadMebTemplate } from '$lib/templates';

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
    <div class="flex">
      <Button variant="outline" class="rounded-r-none" onclick={() => fileInput.click()}><FolderOpen />Dosya aç</Button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' }) + ' rounded-l-none border-l-0'} aria-label="Excel şablonları">
          <ChevronDown />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-80">
          <DropdownMenu.Item class="flex-col items-start gap-0" onSelect={() => fileInput.click()}>
            <span class="font-semibold">Dosya aç…</span>
            <span class="text-xs text-muted-foreground">Kayıt dosyası (.json) ya da doldurulmuş Excel (.xlsx)</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Label class="text-xs text-muted-foreground">Excel şablonları: indirin, doldurun, "Dosya aç" ile yükleyin</DropdownMenu.Label>
          <DropdownMenu.Item class="flex-col items-start gap-0" onSelect={downloadMebTemplate}>
            <span class="flex items-center gap-2"><FileSpreadsheet class="size-4" />MEB KL-01–KL-43 şablonu</span>
            <span class="text-xs text-muted-foreground">43 MEB kontrol listesi dolu; okul ve risk sayfaları boş</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item class="flex-col items-start gap-0" onSelect={downloadBlankTemplate}>
            <span class="flex items-center gap-2"><FileSpreadsheet class="size-4" />Boş şablon</span>
            <span class="text-xs text-muted-foreground">Okul bilgileri, kontrol listesi ve risk satırları sayfaları</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
    <input bind:this={fileInput} type="file" accept=".json,application/json,.xlsx,.xls" hidden onchange={onPick} aria-label="Dosya seç" />
    <ExportMenu />
  </nav>
</header>
