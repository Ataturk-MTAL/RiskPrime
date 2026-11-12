<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import ReadinessList from './ReadinessList.svelte';
  import { store } from '$lib/state.svelte';

  const gaps = $derived(store.readinessGaps);

  function close() {
    store.readinessGaps = null;
  }
</script>

<AlertDialog.Root open={gaps !== null} onOpenChange={(open) => !open && close()}>
  <AlertDialog.Content class="data-[size=default]:sm:max-w-lg">
    <AlertDialog.Header>
      <AlertDialog.Title>PDF açık noktalarla çıkacak</AlertDialog.Title>
      <AlertDialog.Description>
        {#if gaps}Puanlanan satır: {gaps.totals.scoredRows} / {gaps.totals.totalRows}.{' '}{/if}İmzalanacak belgede şu açık noktalar var:
      </AlertDialog.Description>
    </AlertDialog.Header>
    {#if gaps}
      <div class="max-h-[50vh] overflow-y-auto"><ReadinessList {gaps} onpick={close} /></div>
    {/if}
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={() => {
          close();
          void store.exportAs('pdf-full');
        }}>Yine de PDF oluştur</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
