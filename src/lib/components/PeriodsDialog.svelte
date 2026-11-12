<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { periodKey } from '$lib/storage/types';
  import { store } from '$lib/state.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const currentId = $derived(periodKey(store.assessment.period, store.assessment.meta.revision));
  const day = (iso: string) => new Date(iso).toLocaleDateString('tr-TR');

  $effect(() => {
    if (open) store.refreshPeriods();
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>Dönemler</Dialog.Title>
      <Dialog.Description>Bu tarayıcıda saklanan dönem kayıtları. İmzalanan dönemler salt okunur açılır.</Dialog.Description>
    </Dialog.Header>
    {#if !store.archiveAvailable}
      <p class="text-sm text-muted-foreground">Tarayıcı arşivi kullanılamıyor (gizli pencere?). Çalışmanızı .json olarak kaydedin.</p>
    {:else if store.periods.length === 0}
      <p class="text-sm text-muted-foreground">Henüz kayıtlı dönem yok.</p>
    {:else}
      <ul class="flex max-h-96 flex-col divide-y overflow-y-auto rounded-lg border">
        {#each store.periods as item (item.id)}
          {@const isOpen = item.id === currentId}
          <li class="flex flex-wrap items-center justify-between gap-2 p-3">
            <div class="flex min-w-0 flex-col gap-1">
              <span class="flex flex-wrap items-center gap-2 text-sm font-medium">
                {item.period.trim() || 'Adsız dönem'} · Revizyon {item.revision}
                <Badge variant={item.status === 'signed' ? 'default' : 'secondary'}>{item.status === 'signed' ? 'İmzalandı' : 'Taslak'}</Badge>
                {#if isOpen}<Badge variant="outline">Açık</Badge>{/if}
              </span>
              <span class="truncate text-xs text-muted-foreground">
                {item.schoolName.trim() || 'Okul adı yok'} · {item.signedAt ? `İmza: ${day(item.signedAt)}` : `Son değişiklik: ${day(item.updatedAt)}`}
              </span>
            </div>
            {#if !isOpen}
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onclick={() => {
                    open = false;
                    store.openPeriod(item.id);
                  }}>Aç</Button
                >
                <ConfirmDialog
                  title="Dönem kaydı silinsin mi?"
                  description="{item.period} · Revizyon {item.revision} tarayıcı arşivinden kalıcı olarak silinir. Bu işlem geri alınamaz."
                  label="Sil"
                  variant="outline"
                  size="sm"
                  onconfirm={() => store.deletePeriod(item.id)}
                >
                  Sil
                </ConfirmDialog>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </Dialog.Content>
</Dialog.Root>
