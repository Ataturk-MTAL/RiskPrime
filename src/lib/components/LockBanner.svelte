<script lang="ts">
  import Lock from '@lucide/svelte/icons/lock';
  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { isLocked } from '$lib/domain/snapshot';
  import { store } from '$lib/state.svelte';

  const signedOn = $derived(
    store.assessment.meta.signedAt ? new Date(store.assessment.meta.signedAt).toLocaleDateString('tr-TR') : '',
  );
</script>

{#if isLocked(store.assessment)}
  <Alert.Root class="flex flex-wrap items-center justify-between gap-2">
    <Lock aria-hidden="true" />
    <Alert.Description>
      Bu dönem imzalandı{signedOn ? ` (${signedOn})` : ''} — salt okunur. Değişiklik için düzeltme taslağı açın.
    </Alert.Description>
    <Button size="sm" variant="outline" onclick={() => store.reviseLocked()}>Düzeltme taslağı aç</Button>
  </Alert.Root>
{/if}
