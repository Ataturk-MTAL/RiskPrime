<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { lock, PIN_HINT, PIN_PATTERN, resetNote } from '$lib/lock.svelte';
  import PinField from './PinField.svelte';
  import RecoveryCodeSave from './RecoveryCodeSave.svelte';

  const TITLES = {
    checking: 'Kilit durumu denetleniyor…',
    setup: 'PIN belirleyin',
    showRecovery: 'Kurtarma kodunuz',
    locked: 'Uygulama kilitli',
    recover: 'PIN\'i kurtar',
    unlocked: '',
  } as const;

  let pin = $state('');
  let pin2 = $state('');
  let code = $state('');
  let confirmingReset = $state(false);
  let formError = $state('');

  // Every state starts with empty fields and no stale message.
  $effect(() => {
    void lock.state;
    pin = pin2 = code = formError = '';
    confirmingReset = false;
  });

  const shownError = $derived(formError || lock.error);

  /** Validates a new PIN pair; returns the message when it is not acceptable. */
  const pinProblem = (a: string, b: string) => (!PIN_PATTERN.test(a) ? PIN_HINT : a !== b ? 'PIN\'ler aynı değil.' : '');

  function submitSetup() {
    formError = pinProblem(pin, pin2);
    if (!formError) void lock.setup(pin);
  }

  function submitRecover() {
    formError = code.trim() ? pinProblem(pin, pin2) : 'Kurtarma kodunu girin.';
    if (!formError) void lock.recover(code.trim(), pin);
  }

  function submitUnlock() {
    formError = PIN_PATTERN.test(pin) ? '' : PIN_HINT;
    if (!formError) {
      void lock.unlock(pin).then(() => (pin = ''));
    }
  }
</script>

<main class="fixed inset-0 z-50 overflow-y-auto bg-background">
  <div class="grid min-h-full place-items-center p-4">
    <Card.Root class="w-full max-w-sm">
      <Card.Header>
        <div class="flex items-center gap-3 print:hidden">
          <img src="{import.meta.env.BASE_URL}logo.png" alt="" width="32" height="32" class="size-8 shrink-0" />
          <span class="grid min-w-0 leading-tight">
            <span class="font-semibold">RiskPrime</span>
            <span class="text-xs text-muted-foreground">Mersin Atatürk MTAL · Elektrik-Elektronik</span>
          </span>
        </div>
        <Card.Title class="pt-2" role="heading" aria-level={1}>{TITLES[lock.state]}</Card.Title>
      </Card.Header>
      <Card.Content>
        {#key lock.state}
          {#if lock.state === 'setup'}
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitSetup(); }}>
              <p id="pin-hint" class="text-sm text-muted-foreground">Verileriniz bu cihazda kilitli tutulur. {PIN_HINT}</p>
              <PinField id="lock-pin" label="PIN" bind:value={pin} autofocus autocomplete="new-password" describedBy="pin-hint" />
              <PinField id="lock-pin2" label="PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
              <Button type="submit" class="w-full" disabled={lock.busy}>PIN'i belirle</Button>
            </form>
          {:else if lock.state === 'showRecovery'}
            <RecoveryCodeSave code={lock.recoveryCode} onContinue={() => void lock.finishRecovery()} />
          {:else if lock.state === 'locked'}
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitUnlock(); }}>
              {#if lock.resetPendingUntil}
                <p class="text-sm" role="status">{resetNote(lock.resetPendingUntil)} Bu sürede doğru PIN girerseniz sıfırlama iptal olur.</p>
              {/if}
              <PinField id="lock-pin" label="PIN" bind:value={pin} autofocus autocomplete="current-password" />
              <Button type="submit" class="w-full" disabled={lock.busy || lock.retryAfterSec !== null}>Gir</Button>
              <Button type="button" variant="link" class="h-auto p-0" onclick={() => lock.showRecoverForm()}>PIN'imi unuttum</Button>
            </form>
          {:else if lock.state === 'recover'}
            {#if lock.resetPendingUntil}
              <div class="space-y-4">
                <p class="text-sm" role="status">{resetNote(lock.resetPendingUntil)}</p>
                <Button type="button" variant="outline" class="w-full" onclick={() => lock.showLocked()}>PIN ekranına dön</Button>
              </div>
            {:else if confirmingReset}
              <div class="space-y-4">
                <p class="text-sm">PIN 24 saat sonra sıfırlanır; verileriniz silinmez. Bu sürede doğru PIN girilirse sıfırlama iptal olur.</p>
                <div class="flex flex-wrap gap-2">
                  <Button type="button" disabled={lock.busy} onclick={() => void lock.requestReset()}>Sıfırlamayı başlat</Button>
                  <Button type="button" variant="outline" onclick={() => (confirmingReset = false)}>Vazgeç</Button>
                </div>
              </div>
            {:else}
              <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitRecover(); }}>
                <div class="space-y-1.5">
                  <Label for="lock-code">Kurtarma kodu</Label>
                  <Input id="lock-code" bind:value={code} class="font-mono uppercase" autocomplete="off" autocapitalize="characters" spellcheck={false} />
                </div>
                <PinField id="lock-pin" label="Yeni PIN" bind:value={pin} autocomplete="new-password" />
                <PinField id="lock-pin2" label="Yeni PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
                <Button type="submit" class="w-full" disabled={lock.busy}>PIN'i değiştir</Button>
                <div class="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="link" class="h-auto p-0" onclick={() => (confirmingReset = true)}>Kurtarma kodum yok</Button>
                  <Button type="button" variant="link" class="h-auto p-0" onclick={() => lock.showLocked()}>Geri</Button>
                </div>
              </form>
            {/if}
          {/if}
        {/key}
        <div aria-live="polite" class="min-h-5 pt-3 text-sm text-destructive print:hidden">
          {#if shownError}<p role="alert">{shownError}</p>{/if}
          {#if lock.retryAfterSec !== null}<p>{lock.retryAfterSec} saniye sonra yeniden deneyin.</p>{/if}
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</main>
