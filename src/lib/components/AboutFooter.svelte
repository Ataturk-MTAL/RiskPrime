<script lang="ts">
  import { version } from '../../../package.json';
</script>

<footer class="mt-auto flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground" aria-labelledby="about-heading">
  <div class="flex items-start gap-3">
    <img src="{import.meta.env.BASE_URL}logo.png" alt="Mersin Atatürk Mesleki ve Teknik Anadolu Lisesi logosu" width="40" height="40" class="size-10 shrink-0" />
    <div class="flex flex-col gap-1">
      <h2 id="about-heading" class="text-sm font-semibold text-foreground">Hakkında</h2>
      <p class="max-w-prose">
        <strong class="text-foreground">RiskPrime</strong>, okulların İSG risk değerlendirmesini ve MEB kontrol listelerini hazırlaması için
        Mersin Atatürk Mesleki ve Teknik Anadolu Lisesi Elektrik-Elektronik Teknolojisi Alanı'nda geliştirildi.
      </p>
    </div>
  </div>
  <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
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
    <dd>{version}</dd>
  </dl>
</footer>
