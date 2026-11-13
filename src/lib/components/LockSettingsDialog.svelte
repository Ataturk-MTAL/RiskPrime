<script lang="ts" module>
  export type LockSettingsMode = 'change' | 'recovery';
</script>

<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { errorMessage, lock, PIN_HINT, PIN_PATTERN } from '$lib/lock.svelte';
  import PinField from './PinField.svelte';
  import RecoveryCodeSave from './RecoveryCodeSave.svelte';

  let { open = $bindable(false), mode }: { open?: boolean; mode: LockSettingsMode } = $props();

  let pin = $state('');
  let newPin = $state('');
  let newPin2 = $state('');
  let newCode = $state('');
  let error = $state('');
  let busy = $state(false);

  $effect(() => {
    if (!open) return;
    pin = newPin = newPin2 = newCode = error = '';
  });

  async function submit() {
    if (mode === 'change') {
      error = !PIN_PATTERN.test(newPin) ? PIN_HINT : newPin !== newPin2 ? "PIN'ler aynı değil." : '';
    } else {
      error = PIN_PATTERN.test(pin) ? '' : PIN_HINT;
    }
    if (error) return;
    busy = true;
    try {
      if (mode === 'change') {
        await lock.change(pin, newPin);
        toast.success('PIN değiştirildi.');
        open = false;
      } else {
        newCode = await lock.newRecoveryCode(pin);
      }
    } catch (e) {
      error = errorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>{mode === 'change' ? "PIN'i değiştir" : 'Yeni kurtarma kodu'}</Dialog.Title>
      <Dialog.Description>{mode === 'change' ? 'Geçerli PIN ve yeni PIN gerekir.' : 'Eski kurtarma kodu geçersiz olur.'}</Dialog.Description>
    </Dialog.Header>
    {#if newCode}
      <RecoveryCodeSave code={newCode} onContinue={() => (open = false)} />
    {:else}
      <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); void submit(); }}>
        <PinField id="settings-pin" label="Geçerli PIN" bind:value={pin} autofocus autocomplete="current-password" />
        {#if mode === 'change'}
          <PinField id="settings-new-pin" label="Yeni PIN" bind:value={newPin} autocomplete="new-password" />
          <PinField id="settings-new-pin2" label="Yeni PIN (tekrar)" bind:value={newPin2} autocomplete="new-password" />
        {/if}
        <div aria-live="polite" class="min-h-5 text-sm text-destructive">{#if error}<p role="alert">{error}</p>{/if}</div>
        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={() => (open = false)}>Vazgeç</Button>
          <Button type="submit" disabled={busy}>{mode === 'change' ? 'Değiştir' : 'Kod üret'}</Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
