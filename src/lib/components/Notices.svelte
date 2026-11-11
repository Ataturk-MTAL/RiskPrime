<script lang="ts">
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import Info from '@lucide/svelte/icons/info';
  import X from '@lucide/svelte/icons/x';
  import * as Alert from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { store } from '$lib/state.svelte';
</script>

<div class="flex flex-col gap-2" aria-live="polite">
  {#if store.errors.length}
    <Alert.Root variant="destructive" role="alert">
      <CircleAlert />
      <Alert.Description>
        <div class="flex items-start justify-between gap-2">
          <ul class="list-none space-y-0.5">
            {#each store.errors as line, i (i)}
              <li class={i === 0 && store.errors.length > 1 ? 'font-medium' : ''}>{line}</li>
            {/each}
          </ul>
          <Button variant="ghost" size="icon-xs" aria-label="Hata iletisini kapat" onclick={() => store.clearErrors()}><X /></Button>
        </div>
      </Alert.Description>
    </Alert.Root>
  {/if}
  {#if store.busy}
    <Alert.Root><Info /><Alert.Description>{store.busy}</Alert.Description></Alert.Root>
  {/if}
  {#if store.dirty}
    <Alert.Root role="status" class="border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <Info />
      <Alert.Description class="flex flex-wrap items-center gap-2 text-inherit">
        <span>Çalışma henüz JSON ya da Excel olarak kaydedilmedi. PDF ve Word uygulamada tekrar açılamaz.</span>
        <Button size="sm" variant="outline" onclick={() => store.exportAs('json')}>Kayıt dosyasını indir (.json)</Button>
      </Alert.Description>
    </Alert.Root>
  {/if}
  {#if store.hasUnreadable}
    <Alert.Root class="border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <Info />
      <Alert.Description class="flex flex-wrap items-center gap-2 text-inherit">
        <span>Kayıtlı çalışma açılamadı; örnek çalışma açıldı. Eski veri tarayıcıda yedeklendi.</span>
        <Button size="sm" variant="outline" onclick={() => store.downloadUnreadable()}>Eski veriyi indir</Button>
        <Button size="sm" variant="ghost" onclick={() => store.dismissUnreadable()}>Kapat</Button>
      </Alert.Description>
    </Alert.Root>
  {/if}
  {#if store.changedElsewhere}
    <Alert.Root role="status" class="border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <Info />
      <Alert.Description class="flex flex-wrap items-center gap-2 text-inherit">
        <span>Bu çalışma başka bir sekmede değiştirildi.</span>
        <Button size="sm" variant="outline" onclick={() => store.loadFromOtherTab()}>O sürümü yükle</Button>
        <Button size="sm" variant="ghost" onclick={() => store.dismissChangedElsewhere()}>Kapat</Button>
      </Alert.Description>
    </Alert.Root>
  {/if}
  {#if !store.storageOk}
    <Alert.Root class="border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <Info />
      <Alert.Description class="text-inherit">Tarayıcı hafızası kullanılamıyor; sayfa kapanınca değişiklikler kaybolur. Dosyayı indirin.</Alert.Description>
    </Alert.Root>
  {/if}
</div>
