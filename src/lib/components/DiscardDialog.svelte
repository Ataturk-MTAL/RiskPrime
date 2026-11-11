<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { store } from '$lib/state.svelte';

  const savedAt = $derived(
    store.savedAt
      ? new Date(store.savedAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
      : null,
  );
</script>

<AlertDialog.Root open={store.discard !== null} onOpenChange={(open) => !open && store.discard?.resolve(null)}>
  <AlertDialog.Content class="data-[size=default]:sm:max-w-lg">
    <AlertDialog.Header>
      <AlertDialog.Title>Kaydedilmemiş değişiklikler var</AlertDialog.Title>
      <AlertDialog.Description>
        {savedAt ? `Son kayıt: ${savedAt}. Ondan sonraki` : 'Bu çalışma hiç kaydedilmedi. Tüm'} değişiklikler
        (puanlar, cevaplar, okul bilgileri) yeni dosya açılınca bu tarayıcıdan silinir. Önce .json kaydı indirmeniz önerilir.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
      <AlertDialog.Action variant="outline" class="text-destructive" onclick={() => store.discard?.resolve('discard')}>Kaydetmeden devam et</AlertDialog.Action>
      <AlertDialog.Action onclick={() => store.discard?.resolve('save')}>Önce kaydet (.json)</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
