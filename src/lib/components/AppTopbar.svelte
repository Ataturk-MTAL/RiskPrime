<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Circle from '@lucide/svelte/icons/circle';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
  import Save from '@lucide/svelte/icons/save';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import ExportMenu from './ExportMenu.svelte';
  import { formatHash } from '$lib/route';
  import { store } from '$lib/state.svelte';
  import { downloadBlankTemplate, downloadMebTemplate } from '$lib/templates';

  let fileInput: HTMLInputElement;

  /** Lets the menu finish closing (and restore focus) before a dialog opens. */
  const afterMenuCloses = (action: () => void) => setTimeout(action, 0);

  const savedLabel = $derived.by(() => {
    if (!store.savedAt) return '';
    const d = new Date(store.savedAt);
    const isToday = d.toDateString() === new Date().toDateString();
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `Son kayıt: ${isToday ? time : `${d.toLocaleDateString('tr-TR')} ${time}`}`;
  });

  const SECTION_TITLES = {
    overview: 'Genel bakış',
    school: 'Okul bilgileri',
    checklists: 'Kontrol listeleri',
    risk: 'Risk tablosu',
    readiness: 'Hazırlık ve PDF',
  } as const;

  /** Section name plus the selected item, if the view has one. */
  const detail = $derived.by(() => {
    if (store.tab === 'checklists' && store.checklist) return `${store.checklist.code ? `${store.checklist.code} · ` : ''}${store.checklist.name}`;
    if (store.tab === 'risk' && store.location) return store.location.name || 'Adsız mekân';
    return '';
  });

  function onPick(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) store.openFile(file);
  }
</script>

<header class="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
  <Sidebar.Trigger />
  <Separator orientation="vertical" class="h-4" />
  <Breadcrumb.Root class="min-w-0 flex-1">
    <Breadcrumb.List class="flex-nowrap">
      {#if detail}
        <Breadcrumb.Item class="max-sm:hidden">
          <Breadcrumb.Link href={formatHash(store.tab, null)}>{SECTION_TITLES[store.tab]}</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator class="max-sm:hidden" />
        <Breadcrumb.Item class="min-w-0">
          <Breadcrumb.Page class="block truncate">{detail}</Breadcrumb.Page>
        </Breadcrumb.Item>
      {:else}
        <Breadcrumb.Item><Breadcrumb.Page>{SECTION_TITLES[store.tab]}</Breadcrumb.Page></Breadcrumb.Item>
      {/if}
    </Breadcrumb.List>
  </Breadcrumb.Root>

  <div class="flex shrink-0 items-center gap-2" role="group" aria-label="Dosya işlemleri">
    <div role="status">
      {#if store.dirty}
        <span class="flex items-center gap-1 text-xs font-medium"><Circle class="size-2 fill-current" aria-hidden="true" /><span class="max-sm:sr-only">Kaydedilmedi</span></span>
      {:else if savedLabel}
        <span class="text-xs text-muted-foreground max-sm:hidden">{savedLabel}</span>
      {/if}
    </div>
    <Button variant="outline" aria-label="Kaydet (.json)" onclick={() => store.exportAs('json')}><Save /><span class="max-sm:hidden">Kaydet</span></Button>
    <ExportMenu />
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })} aria-label="Dosya işlemleri">
        <Ellipsis class="sm:hidden" aria-hidden="true" /><span class="max-sm:hidden">Dosya</span><ChevronDown class="max-sm:hidden" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="w-80">
        <DropdownMenu.Item onSelect={() => afterMenuCloses(() => store.newFromStarter())}>Yeni (okul verisiyle)</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => afterMenuCloses(() => store.newEmpty())}>Yeni (boş)</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => afterMenuCloses(() => store.newPeriod())}>Yeni dönem (bu çalışmadan)</DropdownMenu.Item>
        <DropdownMenu.Separator />
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
    <input bind:this={fileInput} type="file" accept=".json,application/json,.xlsx,.xls" hidden onchange={onPick} aria-label="Dosya seç" />
  </div>
</header>
