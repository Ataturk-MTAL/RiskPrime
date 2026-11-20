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
  import HistoryDialog from './HistoryDialog.svelte';
  import LockSettingsDialog, { type LockSettingsMode } from './LockSettingsDialog.svelte';
  import UserAvatar from './UserAvatar.svelte';
  import UsersDialog from './UsersDialog.svelte';
  import { lock } from '$lib/lock.svelte';
  import { isDesktop } from '$lib/platform';
  import { nav } from '$lib/nav.svelte';
  import { SECTION_LABELS } from '$lib/nav-items';
  import { listLabel } from '$lib/domain/checklist';
  import { formatHash, HOME } from '$lib/nav-route';
  import { store } from '$lib/state.svelte';
  import type { ThemeChoice } from '$lib/theme-choice';
  import { theme } from '$lib/theme.svelte';
  import { downloadBlankTemplate, downloadMebTemplate } from '$lib/templates';

  let { onAbout, onPeriods }: { onAbout: () => void; onPeriods: () => void } = $props();

  let fileInput: HTMLInputElement;
  let lockDialogOpen = $state(false);
  let lockDialogMode = $state<LockSettingsMode>('change');
  let usersOpen = $state(false);
  let historyOpen = $state(false);

  const openLockDialog = (mode: LockSettingsMode) =>
    afterMenuCloses(() => {
      lockDialogMode = mode;
      lockDialogOpen = true;
    });

  /** Lets the menu finish closing (and restore focus) before a dialog opens. */
  const afterMenuCloses = (action: () => void) => setTimeout(action, 0);

  const savedLabel = $derived.by(() => {
    if (!store.savedAt) return '';
    const d = new Date(store.savedAt);
    const isToday = d.toDateString() === new Date().toDateString();
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `Son kayıt: ${isToday ? time : `${d.toLocaleDateString('tr-TR')} ${time}`}`;
  });

  interface Crumb {
    label: string;
    href?: string;
  }

  const templateLabel = (id: string | null) => {
    const list = store.assessment.checklists.find((c) => c.id === id);
    return list ? listLabel(list.code, list.name) : '';
  };

  /** Section, then the location / view / checklist the place points at; the last crumb is the current page. */
  const crumbs = $derived.by((): Crumb[] => {
    const p = nav.place;
    const root: Crumb = { label: SECTION_LABELS[p.section], href: formatHash({ ...HOME, section: p.section }) };
    if (p.section === 'library') {
      const list = templateLabel(p.listId);
      return list ? [root, { label: list }] : [{ label: root.label }];
    }
    const register: Crumb = { label: SECTION_LABELS.register, href: formatHash({ ...HOME, section: 'register' }) };
    // The deficiency view lives under Riskler.
    if (p.section === 'deficiencies') return [register, { label: SECTION_LABELS.deficiencies }];
    const loc = store.assessment.locations.find((l) => l.id === p.locationId);
    if (!loc) return [{ label: root.label }];
    const locName = loc.name || 'Adsız mekân';
    // Riskler filtered to one location: the location crumb leads back to its checklists.
    if (p.section === 'register') {
      const locHref = formatHash({ ...HOME, section: 'locations', locationId: loc.id });
      return [register, { label: locName, href: locHref }, { label: 'Risk satırları' }];
    }
    const list = templateLabel(p.listId);
    if (!list) return [root, { label: locName }];
    return [root, { label: locName, href: formatHash({ ...p, listId: null }) }, { label: list }];
  });

  function onPick(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) store.openFile(file);
  }
</script>

<header class="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
  <Sidebar.Trigger class="max-md:hidden" />
  <Separator orientation="vertical" class="h-4 max-md:hidden" />
  <Breadcrumb.Root class="min-w-0 flex-1">
    <Breadcrumb.List class="flex-nowrap overflow-hidden">
      {#each crumbs as crumb, i (i)}
        {#if i < crumbs.length - 1}
          <Breadcrumb.Item class="min-w-0 max-sm:hidden"><Breadcrumb.Link href={crumb.href} class="block max-w-48 truncate whitespace-nowrap" title={crumb.label}>{crumb.label}</Breadcrumb.Link></Breadcrumb.Item>
          <Breadcrumb.Separator class="max-sm:hidden" />
        {:else}
          <Breadcrumb.Item class="min-w-0"><Breadcrumb.Page class="block truncate whitespace-nowrap" title={crumb.label}>{crumb.label}</Breadcrumb.Page></Breadcrumb.Item>
        {/if}
      {/each}
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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })} aria-label="Dosya işlemleri">
        <Ellipsis class="sm:hidden" aria-hidden="true" /><span class="max-sm:hidden">Dosya</span><ChevronDown class="max-sm:hidden" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="w-80">
        <DropdownMenu.Item onSelect={() => afterMenuCloses(() => store.newFromStarter())}>Yeni (okul verisiyle)</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => afterMenuCloses(() => store.newEmpty())}>Yeni (boş)</DropdownMenu.Item>
        <DropdownMenu.Item class="flex-col items-start gap-0" onSelect={() => afterMenuCloses(() => store.newPeriod())}>
          <span>Yeni dönem (bu çalışmadan)</span>
          <span class="text-xs text-muted-foreground">Mekânlar, listeler ve risk satırları kalır, önlem sonrası puanlar güncel puan olur; cevaplar, tarihler ve durumlar sıfırlanır.</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => afterMenuCloses(onPeriods)}>Dönemler…</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Label class="text-xs text-muted-foreground">Görünüm</DropdownMenu.Label>
        <DropdownMenu.RadioGroup value={theme.choice} onValueChange={(v) => theme.set(v as ThemeChoice)}>
          <DropdownMenu.RadioItem value="light" closeOnSelect={false}>Açık</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="dark" closeOnSelect={false}>Koyu</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="system" closeOnSelect={false}>Sistem</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
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
        <DropdownMenu.Separator class="md:hidden" />
        <DropdownMenu.Item class="md:hidden" onSelect={() => nav.openLibrary()}>Kütüphane</DropdownMenu.Item>
        <DropdownMenu.Item class="md:hidden" onSelect={() => afterMenuCloses(onAbout)}>Hakkında</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <input bind:this={fileInput} type="file" accept=".json,application/json,.xlsx,.xls" hidden onchange={onPick} aria-label="Dosya seç" />
    {#if isDesktop() && lock.currentUser}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost' })} aria-label="Kullanıcı menüsü: {lock.currentUser.name}">
          <UserAvatar name={lock.currentUser.name} class="size-6 text-[10px]" /><span class="max-w-32 truncate max-md:hidden">{lock.currentUser.name}</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-64">
          <DropdownMenu.Label class="grid font-normal"><span class="truncate font-medium">{lock.currentUser.name}</span>{#if lock.currentUser.title}<span class="truncate text-xs text-muted-foreground">{lock.currentUser.title}</span>{/if}</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onSelect={() => void lock.lockNow()}>Kilitle / Kullanıcı değiştir</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => openLockDialog('change')}>PIN'imi değiştir…</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => afterMenuCloses(() => (usersOpen = true))}>Kullanıcılar…</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => afterMenuCloses(() => (historyOpen = true))}>Değişiklik geçmişi…</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => openLockDialog('recovery')}>Yeni okul kurtarma kodu…</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
</header>

{#if isDesktop()}
  <LockSettingsDialog bind:open={lockDialogOpen} mode={lockDialogMode} />
  <UsersDialog bind:open={usersOpen} />
  <HistoryDialog bind:open={historyOpen} />
{/if}
