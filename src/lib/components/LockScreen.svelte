<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { lock, PIN_HINT, PIN_PATTERN, resetNote } from '$lib/lock.svelte';
  import PinField from './PinField.svelte';
  import RecoveryCodeSave from './RecoveryCodeSave.svelte';
  import SelectField from './SelectField.svelte';
  import UserAvatar from './UserAvatar.svelte';

  const TITLES = {
    checking: 'Kilit durumu denetleniyor…',
    firstUser: 'İlk kullanıcıyı oluşturun',
    showRecovery: 'Okul kurtarma kodu',
    pickUser: 'Kullanıcı seçin',
    pin: 'PIN girin',
    initialPin: 'Yeni PIN belirleyin',
    changePin: 'Yeni PIN belirleyin',
    recover: 'PIN\'i kurtar',
    unlocked: '',
  } as const;

  type ForgotStep = 'none' | 'explain' | 'confirm';

  let name = $state('');
  let title = $state('');
  let pin = $state('');
  let pin2 = $state('');
  let code = $state('');
  let recoverUserId = $state('');
  let forgot = $state<ForgotStep>('none');
  let formError = $state('');

  // Every state starts with empty fields and no stale message.
  $effect(() => {
    void lock.state;
    untrack(() => {
      name = title = pin = pin2 = code = formError = '';
      recoverUserId = lock.selectedUser?.id ?? lock.users[0]?.id ?? '';
      forgot = 'none';
    });
  });

  const shownError = $derived(formError || lock.error);
  const userOptions = $derived(lock.users.map((u) => ({ value: u.id, label: u.title ? `${u.name} · ${u.title}` : u.name })));
  const pendingText = (until: string) => new Date(until).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });

  /** Validates a new PIN pair; returns the message when it is not acceptable. */
  const pinProblem = (a: string, b: string) => (!PIN_PATTERN.test(a) ? PIN_HINT : a !== b ? 'PIN\'ler aynı değil.' : '');

  function submitFirstUser() {
    formError = name.trim() ? pinProblem(pin, pin2) : 'Ad Soyad girin.';
    if (!formError) void lock.createFirstUser({ name: name.trim(), title: title.trim(), pin });
  }

  function submitInitialPin() {
    formError = pinProblem(pin, pin2);
    if (!formError) void lock.completeReset(pin);
  }

  function submitChangePin() {
    formError = pinProblem(pin, pin2);
    if (!formError) void lock.changeTempPin(pin);
  }

  function submitRecover() {
    formError = !recoverUserId ? 'Kullanıcı seçin.' : code.trim() ? pinProblem(pin, pin2) : 'Okul kurtarma kodunu girin.';
    if (!formError) void lock.recover(recoverUserId, code.trim(), pin);
  }

  function submitUnlock() {
    formError = PIN_PATTERN.test(pin) ? '' : PIN_HINT;
    if (!formError) void lock.unlock(pin).then(() => (pin = ''));
  }
</script>

<main class="fixed inset-0 z-50 overflow-y-auto bg-background">
  <div class="grid min-h-full place-items-center p-4">
    <Card.Root class="w-full max-w-sm">
      <Card.Header>
        <div class="flex items-center gap-3 print:hidden">
          <img src="{import.meta.env.BASE_URL}logo.png" alt="" width="32" height="32" class="size-8 shrink-0" />
          <span class="font-semibold">RiskPrime</span>
        </div>
        <Card.Title class="pt-2" role="heading" aria-level={1}>{TITLES[lock.state]}</Card.Title>
      </Card.Header>
      <Card.Content>
        {#key lock.state}
          {#if lock.state === 'firstUser'}
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitFirstUser(); }}>
              <p id="pin-hint" class="text-sm text-muted-foreground">Verileriniz bu cihazda kilitli tutulur. Her kullanıcı kendi PIN'iyle girer. {PIN_HINT}</p>
              <div class="space-y-1.5">
                <Label for="lock-name">Ad Soyad</Label>
                <Input id="lock-name" bind:value={name} autocomplete="name" />
              </div>
              <div class="space-y-1.5">
                <Label for="lock-title">Görev / unvan (isteğe bağlı)</Label>
                <Input id="lock-title" bind:value={title} autocomplete="organization-title" />
              </div>
              <PinField id="lock-pin" label="PIN" bind:value={pin} autocomplete="new-password" describedBy="pin-hint" />
              <PinField id="lock-pin2" label="PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
              <Button type="submit" class="w-full" disabled={lock.busy}>Kullanıcıyı oluştur</Button>
            </form>
          {:else if lock.state === 'showRecovery'}
            <RecoveryCodeSave code={lock.recoveryCode} onContinue={() => void lock.finishRecovery()} />
          {:else if lock.state === 'pickUser'}
            <ul class="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {#each lock.users as user (user.id)}
                <li>
                  <Button type="button" variant="outline" class="h-auto w-full justify-start gap-3 p-3 text-left" onclick={() => lock.selectUser(user)}>
                    <UserAvatar name={user.name} class="size-10 text-sm" />
                    <span class="grid min-w-0 gap-0.5 leading-tight">
                      <span class="truncate font-medium">{user.name}</span>
                      {#if user.title}<span class="truncate text-xs font-normal text-muted-foreground">{user.title}</span>{/if}
                      {#if user.resetPendingUntil}<span class="text-xs font-normal whitespace-normal">PIN sıfırlanacak: {pendingText(user.resetPendingUntil)}</span>{/if}
                    </span>
                  </Button>
                </li>
              {/each}
            </ul>
          {:else if lock.state === 'pin' && lock.selectedUser}
            {@const user = lock.selectedUser}
            {#if forgot === 'explain'}
              <div class="space-y-4">
                {#if lock.users.length === 1}
                  <p class="text-sm">Okul kurtarma kodunuz varsa şimdi yeni PIN belirleyebilirsiniz.</p>
                  {#if user.resetPendingUntil}<p class="text-sm" role="status">{resetNote(user.resetPendingUntil)}</p>{/if}
                {:else}
                  <p class="text-sm">Başka bir kullanıcı giriş yapıp size geçici PIN verebilir ya da okul kurtarma kodunu kullanabilirsiniz.</p>
                {/if}
                <div class="flex flex-wrap gap-2">
                  <Button type="button" onclick={() => lock.showRecoverForm()}>Kurtarma koduyla yenile</Button>
                  {#if lock.users.length === 1}
                    <Button type="button" variant="outline" disabled={!!user.resetPendingUntil} onclick={() => (forgot = 'confirm')}>Kurtarma kodum yok</Button>
                  {/if}
                </div>
                <Button type="button" variant="link" class="h-auto p-0" onclick={() => (forgot = 'none')}>Geri</Button>
              </div>
            {:else if forgot === 'confirm'}
              <div class="space-y-4">
                <p class="text-sm">PIN'iniz 24 saat sonra sıfırlanır; verileriniz silinmez. Bu sürede doğru PIN girerseniz sıfırlama iptal olur.</p>
                <div class="flex flex-wrap gap-2">
                  <Button type="button" disabled={lock.busy} onclick={() => void lock.requestReset().then(() => (forgot = 'explain'))}>Sıfırlamayı başlat</Button>
                  <Button type="button" variant="outline" onclick={() => (forgot = 'explain')}>Vazgeç</Button>
                </div>
              </div>
            {:else}
              <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitUnlock(); }}>
                <div class="flex items-center gap-3">
                  <UserAvatar name={user.name} class="size-10 text-sm" />
                  <span class="grid min-w-0 leading-tight">
                    <span class="truncate font-medium">{user.name}</span>
                    {#if user.title}<span class="truncate text-xs text-muted-foreground">{user.title}</span>{/if}
                  </span>
                </div>
                {#if user.resetPendingUntil}
                  <p class="text-sm" role="status">{resetNote(user.resetPendingUntil)} Bu sürede doğru PIN girerseniz sıfırlama iptal olur.</p>
                {/if}
                <PinField id="lock-pin" label="PIN" bind:value={pin} autofocus autocomplete="current-password" />
                <Button type="submit" class="w-full" disabled={lock.busy || lock.retryAfterSec !== null}>Gir</Button>
                <div class="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="link" class="h-auto p-0" onclick={() => lock.showPicker()}>Başka kullanıcı</Button>
                  <Button type="button" variant="link" class="h-auto p-0" onclick={() => (forgot = 'explain')}>PIN'imi unuttum</Button>
                </div>
              </form>
            {/if}
          {:else if lock.state === 'initialPin' && lock.selectedUser}
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitInitialPin(); }}>
              <p id="pin-hint" class="text-sm text-muted-foreground">{lock.selectedUser.name}, 24 saatlik bekleme doldu. Yeni bir PIN belirleyin. {PIN_HINT}</p>
              <PinField id="lock-pin" label="Yeni PIN" bind:value={pin} autofocus autocomplete="new-password" describedBy="pin-hint" />
              <PinField id="lock-pin2" label="Yeni PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
              <Button type="submit" class="w-full" disabled={lock.busy}>PIN'i belirle</Button>
              <Button type="button" variant="link" class="h-auto p-0" onclick={() => lock.showPicker()}>Başka kullanıcı</Button>
            </form>
          {:else if lock.state === 'changePin' && lock.selectedUser}
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitChangePin(); }}>
              <p id="pin-hint" class="text-sm text-muted-foreground">{lock.selectedUser.name}, geçici PIN ile girdiniz. Devam etmek için kendi PIN'inizi belirleyin. {PIN_HINT}</p>
              <PinField id="lock-pin" label="Yeni PIN" bind:value={pin} autofocus autocomplete="new-password" describedBy="pin-hint" />
              <PinField id="lock-pin2" label="Yeni PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
              <Button type="submit" class="w-full" disabled={lock.busy}>PIN'i belirle</Button>
            </form>
          {:else if lock.state === 'recover'}
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitRecover(); }}>
              <div class="space-y-1.5">
                <Label>Kullanıcı</Label>
                <SelectField options={userOptions} value={recoverUserId} onValueChange={(v) => (recoverUserId = v)} label="Kullanıcı" />
              </div>
              <div class="space-y-1.5">
                <Label for="lock-code">Okul kurtarma kodu</Label>
                <Input id="lock-code" bind:value={code} class="font-mono uppercase" autocomplete="off" autocapitalize="characters" spellcheck={false} />
              </div>
              <PinField id="lock-pin" label="Yeni PIN" bind:value={pin} autocomplete="new-password" />
              <PinField id="lock-pin2" label="Yeni PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
              <Button type="submit" class="w-full" disabled={lock.busy}>PIN'i değiştir</Button>
              <Button type="button" variant="link" class="h-auto p-0" onclick={() => (lock.selectedUser ? lock.selectUser(lock.selectedUser) : lock.showPicker())}>Geri</Button>
            </form>
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
