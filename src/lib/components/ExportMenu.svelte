<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Download from '@lucide/svelte/icons/download';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { store, type ExportKind } from '$lib/state.svelte';

  // JSON and Excel are restorable backups; Excel templates live in the "Dosya aç" menu (AppHeader).
  const ITEMS: { kind: ExportKind; label: string; hint?: string }[] = [
    { kind: 'json', label: 'Kayıt dosyası (.json)', hint: 'Kayıt: uygulamada tekrar açılır' },
    { kind: 'pdf-checklists', label: 'PDF: yalnız kontrol listeleri' },
    { kind: 'pdf-blank', label: 'PDF: boş form', hint: 'Puan ve cevap kutuları boş, elle doldurmak için' },
    { kind: 'xlsx', label: 'Excel (.xlsx)', hint: "Kayıt: tekrar açılabilir, Excel'de düzenlenebilir" },
    { kind: 'docx', label: 'Word (.docx)', hint: 'Yalnız çıktı, uygulamada açılmaz' },
  ];
  const busy = $derived(store.busy !== '');
</script>

<div class="flex">
  <Button class="rounded-r-none" disabled={busy} onclick={() => store.exportAs('pdf-full')}><Download />PDF indir</Button>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' }) + ' rounded-l-none'} disabled={busy}>
      diğer biçimler <ChevronDown />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-72">
      {#each ITEMS as item (item.kind)}
        <DropdownMenu.Item class="flex-col items-start gap-0" onSelect={() => store.exportAs(item.kind)}>
          <span class={item.kind === 'json' ? 'font-semibold' : ''}>{item.label}</span>
          {#if item.hint}<span class="text-xs text-muted-foreground">{item.hint}</span>{/if}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
