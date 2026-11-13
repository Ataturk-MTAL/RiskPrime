<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Badge } from '$lib/components/ui/badge';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { errorMessage, lock, PIN_HINT, PIN_PATTERN, type UserRow } from '$lib/lock.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import PinField from './PinField.svelte';
  import UserAvatar from './UserAvatar.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  /** null = the list; 'new' = add form; a user = edit form. */
  let form = $state<UserRow | 'new' | null>(null);
  let name = $state('');
  let title = $state('');
  let pin = $state('');
  let pin2 = $state('');
  let error = $state('');
  let busy = $state(false);
  /** The one-time temporary PIN of the user whose PIN was just reset. */
  let issued = $state<{ name: string; pin: string } | null>(null);

  const users = $derived(lock.users);

  $effect(() => {
    if (!open) return;
    form = null;
    error = '';
    issued = null;
    void reload();
  });

  async function reload() {
    try {
      await lock.usersList();
    } catch (e) {
      error = errorMessage(e);
    }
  }

  function openForm(target: UserRow | 'new') {
    form = target;
    name = target === 'new' ? '' : target.name;
    title = target === 'new' ? '' : target.title;
    pin = pin2 = error = '';
  }

  /** Runs one backend call, reports its failure as the dialog error, and refreshes the list. */
  async function act(action: () => Promise<unknown>, success: string): Promise<boolean> {
    busy = true;
    error = '';
    try {
      await action();
      toast.success(success);
      await lock.usersList();
      return true;
    } catch (e) {
      error = errorMessage(e);
      return false;
    } finally {
      busy = false;
    }
  }

  async function submit() {
    if (form === null) return;
    const target = form;
    if (!name.trim()) return void (error = 'Ad Soyad girin.');
    if (target === 'new') {
      error = !PIN_PATTERN.test(pin) ? PIN_HINT : pin !== pin2 ? "PIN'ler aynı değil." : '';
      if (error) return;
    }
    const saved = await act(
      () => (target === 'new' ? lock.createUser({ name: name.trim(), title: title.trim(), pin }) : lock.updateSelf(name.trim(), title.trim())),
      target === 'new' ? 'Kullanıcı eklendi.' : 'Kullanıcı güncellendi.',
    );
    if (saved) form = null;
  }

  async function resetPin(user: UserRow) {
    issued = null;
    await act(async () => {
      issued = { name: user.name, pin: await lock.resetUserPin(user.id) };
    }, 'Geçici PIN oluşturuldu.');
  }

  async function copyPin() {
    try {
      await navigator.clipboard.writeText(issued?.pin ?? '');
      toast.success('PIN kopyalandı.');
    } catch {
      error = 'Kopyalanamadı; PIN\'i elle yazın.';
    }
  }

  const removeBlocker = (user: UserRow) =>
    user.id === lock.currentUser?.id ? 'Kendi hesabınızı kaldıramazsınız.' : users.length <= 1 ? 'Son kullanıcı kaldırılamaz.' : '';
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Kullanıcılar</Dialog.Title>
      <Dialog.Description>Bu bilgisayardaki kullanıcılar. Herkes kendi PIN'iyle girer; yetki farkı yoktur.</Dialog.Description>
    </Dialog.Header>
    {#if form !== null}
      <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div class="space-y-1.5">
          <Label for="user-name">Ad Soyad</Label>
          <Input id="user-name" bind:value={name} autocomplete="off" />
        </div>
        <div class="space-y-1.5">
          <Label for="user-title">Görev / unvan (isteğe bağlı)</Label>
          <Input id="user-title" bind:value={title} autocomplete="off" />
        </div>
        {#if form === 'new'}
          <PinField id="user-pin" label="İlk PIN" bind:value={pin} autocomplete="new-password" />
          <PinField id="user-pin2" label="İlk PIN (tekrar)" bind:value={pin2} autocomplete="new-password" />
        {/if}
        <div aria-live="polite" class="min-h-5 text-sm text-destructive">{#if error}<p role="alert">{error}</p>{/if}</div>
        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={() => (form = null)}>Vazgeç</Button>
          <Button type="submit" disabled={busy}>{form === 'new' ? 'Ekle' : 'Kaydet'}</Button>
        </Dialog.Footer>
      </form>
    {:else}
      <Tooltip.Provider delayDuration={0}>
        <ul class="flex max-h-96 flex-col divide-y overflow-y-auto rounded-lg border">
          {#each users as user (user.id)}
            {@const blocker = removeBlocker(user)}
            <li class="flex flex-wrap items-center justify-between gap-2 p-3">
              <div class="flex min-w-0 items-center gap-3">
                <UserAvatar name={user.name} />
                <div class="grid min-w-0 gap-0.5 leading-tight">
                  <span class="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span class="truncate">{user.name}</span>
                    {#if user.id === lock.currentUser?.id}<Badge variant="outline">Siz</Badge>{/if}
                    {#if !user.hasPin}<Badge variant="secondary">PIN sıfırlanmış</Badge>{/if}
                  </span>
                  {#if user.title}<span class="truncate text-xs text-muted-foreground">{user.title}</span>{/if}
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                {#if user.id === lock.currentUser?.id}
                  <Button size="sm" variant="outline" onclick={() => openForm(user)}>Düzenle</Button>
                {:else}
                  <ConfirmDialog
                    title="PIN sıfırlansın mı?"
                    description="{user.name} için geçici bir PIN oluşturulur; ilk girişte kendi PIN'ini belirleyecek."
                    confirmLabel="PIN'i sıfırla"
                    label="PIN'i sıfırla: {user.name}"
                    variant="outline"
                    size="sm"
                    onconfirm={() => void resetPin(user)}
                  >
                    PIN'i sıfırla
                  </ConfirmDialog>
                {/if}
                {#if blocker}
                  <Tooltip.Root>
                    <Tooltip.Trigger class="{buttonVariants({ variant: 'outline', size: 'sm' })} opacity-50" aria-disabled="true" aria-label="Kaldır: {blocker}">Kaldır</Tooltip.Trigger>
                    <Tooltip.Content>{blocker}</Tooltip.Content>
                  </Tooltip.Root>
                {:else}
                  <ConfirmDialog
                    title="Kullanıcı kaldırılsın mı?"
                    description="{user.name} kaldırılır ve artık giriş yapamaz."
                    confirmLabel="Kaldır"
                    label="Kaldır: {user.name}"
                    variant="outline"
                    size="sm"
                    onconfirm={() => void act(() => lock.removeUser(user.id), 'Kullanıcı kaldırıldı.')}
                  >
                    Kaldır
                  </ConfirmDialog>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      </Tooltip.Provider>
      {#if issued}
        <div class="space-y-2 rounded-lg border p-3" role="status">
          <p class="text-sm">Bu geçici PIN'i {issued.name} ile paylaşın; ilk girişte kendi PIN'ini belirleyecek.</p>
          <div class="flex items-center gap-2">
            <code class="rounded bg-muted px-3 py-1.5 font-mono text-lg tracking-widest select-all">{issued.pin}</code>
            <Button size="sm" variant="outline" onclick={() => void copyPin()}>Kopyala</Button>
          </div>
        </div>
      {/if}
      <div aria-live="polite" class="min-h-5 text-sm text-destructive">{#if error}<p role="alert">{error}</p>{/if}</div>
      <Dialog.Footer>
        <Button type="button" onclick={() => openForm('new')}>Kullanıcı ekle</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
