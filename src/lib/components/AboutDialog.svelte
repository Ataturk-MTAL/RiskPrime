<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { isDesktop } from '$lib/platform';
  import { version } from '../../../package.json';

  let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Hakkında</Dialog.Title>
      <Dialog.Description>
        <strong class="text-foreground">RiskPrime</strong>, okulların İSG risk değerlendirmesini ve MEB kontrol listelerini hazırlaması için
        Mersin Atatürk Mesleki ve Teknik Anadolu Lisesi Elektrik-Elektronik Teknolojisi Alanı'nda geliştirildi.
      </Dialog.Description>
    </Dialog.Header>
    <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <dt class="font-medium text-foreground">Geliştiren</dt>
      <dd>Elektrik-Elektronik Teknolojisi Alanı</dd>
      <dt class="font-medium text-foreground">Okul</dt>
      <dd><a class="underline underline-offset-2 hover:text-foreground" href="https://mersinataturkmtal.meb.k12.tr/" rel="noopener">mersinataturkmtal.meb.k12.tr</a></dd>
      <dt class="font-medium text-foreground">Gizlilik</dt>
      <dd>
        Veriler yalnız bu tarayıcıda işlenir; hiçbir sunucuya gönderilmez. Kalıcı kayıt indirilen .json ya da Excel (.xlsx) dosyasıdır; ikisi de
        "Dosya aç" ile geri yüklenir. PDF tarayıcıda üretilir; içerik hiçbir yere gönderilmez.
      </dd>
      <dt class="font-medium text-foreground">Kütüphaneler</dt>
      <dd>Svelte, shadcn-svelte ve bits-ui (MIT), typst.ts (Apache-2.0), SheetJS (Apache-2.0), docx (MIT); yazı tipleri Atkinson Hyperlegible Next ve IBM Plex Sans (OFL)</dd>
      <dt class="font-medium text-foreground">Sürüm</dt>
      <dd>{version} · {isDesktop() ? 'Masaüstü' : 'Web'}</dd>
    </dl>
  </Dialog.Content>
</Dialog.Root>
