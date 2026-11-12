<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { BANK_VERSION } from '$lib/domain/bank-version';
  import { store } from '$lib/state.svelte';

  const offer = $derived(store.bankOffer);
  const addedId = (a: { listId: string; key: string }) => `${a.listId}|${a.key}`;

  // Everything is checked when an offer opens; ids are item ids and "listId|key" pairs.
  let picked = $state.raw<ReadonlySet<string>>(new Set());
  $effect(() => {
    picked = new Set([...(offer?.updated.map((u) => u.itemId) ?? []), ...(offer?.added.map(addedId) ?? [])]);
  });

  const toggle = (id: string, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(id);
    else next.delete(id);
    picked = next;
  };
  const setAll = (ids: string[], on: boolean) => {
    const next = new Set(picked);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    picked = next;
  };

  function apply() {
    if (!offer) return;
    store.applyBankSelection({
      itemIds: offer.updated.filter((u) => picked.has(u.itemId)).map((u) => u.itemId),
      addedKeys: offer.added.filter((x) => picked.has(addedId(x))).map((x) => ({ listId: x.listId, key: x.key })),
    });
  }
</script>

{#snippet groupHead(title: string, ids: string[])}
  {@const allOn = ids.every((id) => picked.has(id))}
  <div class="flex items-center justify-between gap-2">
    <h3 class="text-sm font-semibold">{title} ({ids.length})</h3>
    <Button variant="ghost" size="sm" onclick={() => setAll(ids, !allOn)}>{allOn ? 'Tümünü kaldır' : 'Tümünü seç'}</Button>
  </div>
{/snippet}

<Dialog.Root open={offer !== null} onOpenChange={(open) => !open && store.dismissBankOffer()}>
  <Dialog.Content class="flex max-h-[90vh] flex-col sm:max-w-3xl">
    <Dialog.Header>
      <Dialog.Title>Soru bankasında güncellemeler var</Dialog.Title>
      <Dialog.Description>
        Kontrol listeleriniz soru bankasının {BANK_VERSION} sürümüne göre değişti veya yeni soru içeriyor. Uygulamak istediklerinizi seçin; cevaplarınız korunur.
      </Dialog.Description>
    </Dialog.Header>
    {#if offer}
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {#if offer.updated.length}
          <section class="space-y-1">
            {@render groupHead('Metni değişen sorular', offer.updated.map((u) => u.itemId))}
            {#each offer.updated as u (u.itemId)}
              <label class="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-muted">
                <Checkbox class="mt-0.5" checked={picked.has(u.itemId)} onCheckedChange={(v) => toggle(u.itemId, v === true)} />
                <span class="min-w-0 text-sm">
                  <Badge variant="outline" class="mr-1 tabular-nums">{u.key}</Badge><small class="text-muted-foreground">{u.listName}</small>
                  <span class="block text-muted-foreground line-through">{u.oldText}</span>
                  <span class="block">{u.newText}</span>
                </span>
              </label>
            {/each}
          </section>
        {/if}
        {#if offer.added.length}
          <section class="space-y-1">
            {@render groupHead('Yeni eklenen sorular', offer.added.map(addedId))}
            {#each offer.added as x (addedId(x))}
              <label class="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-muted">
                <Checkbox class="mt-0.5" checked={picked.has(addedId(x))} onCheckedChange={(v) => toggle(addedId(x), v === true)} />
                <span class="min-w-0 text-sm">
                  <Badge variant="outline" class="mr-1 tabular-nums">{x.key}</Badge><small class="text-muted-foreground">{x.listName}</small>
                  <span class="block">{x.text}</span>
                </span>
              </label>
            {/each}
          </section>
        {/if}
      </div>
    {/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => store.dismissBankOffer()}>Şimdilik geç</Button>
      <Button disabled={picked.size === 0} onclick={apply}>{picked.size ? `Seçilenleri uygula (${picked.size})` : 'Seçilenleri uygula'}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
