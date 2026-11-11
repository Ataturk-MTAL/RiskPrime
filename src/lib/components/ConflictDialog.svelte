<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { store } from '$lib/state.svelte';
</script>

<AlertDialog.Root open={store.conflict !== null} onOpenChange={(open) => !open && store.conflict?.resolve(null)}>
  <AlertDialog.Content class="data-[size=default]:sm:max-w-lg">
    <AlertDialog.Header>
      <AlertDialog.Title>Aynı kodlu liste zaten var</AlertDialog.Title>
      <AlertDialog.Description>
        {store.conflict?.codes.join(', ')} kodlu liste mevcut. Değiştirirseniz mevcut listenin cevapları silinir;
        yanına eklerseniz yeni liste ayrıca açılır.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
      <AlertDialog.Action variant="outline" onclick={() => store.conflict?.resolve('append')}>Yanına ekle</AlertDialog.Action>
      <AlertDialog.Action onclick={() => store.conflict?.resolve('replace')}>Değiştir</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
