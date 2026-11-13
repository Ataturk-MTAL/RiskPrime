# RiskPrime öneri aktarıcısı (Cloudflare Worker)

Uygulamadan gelen kontrol listesi maddesi önerilerini, bir **GitHub App (bot)** olarak depoda
issue'ya çevirir. Öğretmenlerin GitHub hesabına ihtiyacı yoktur; uygulamada hiçbir token bulunmaz.

Akış: boyut/JSON kontrolü, öneri doğrulaması, Turnstile, hız sınırı, bankada var mı (benzerlik >= 0.8),
açık bir öneriye benziyor mu (>= 0.6, varsa yorum eklenir), değilse yeni issue (`madde-onerisi` etiketi).

## Gizlilik

- Sadece öneri alanları gönderilir: madde metni, ilgili liste kodu, mekân türleri, dayanak, gerekçe.
- Ad, okul veya başka kişisel veri gönderilmez.
- IP adresi yalnızca hız sınırı için, SHA-256 özeti olarak kullanılır; saklanmaz ve günlüğe yazılmaz.
- Öneri içeriği günlüğe yazılmaz; yalnızca durum kodları/hata türleri.

## Kurulum

### 1. GitHub App

1. GitHub > Settings > Developer settings > GitHub Apps > New GitHub App.
2. Webhook'u kapatın. Yalnızca **Repository permissions > Issues: Read & write** verin.
3. "Only on this account" seçip oluşturun; **App ID**'yi not edin.
4. "Generate a private key" ile `.pem` indirin.
5. Install App > yalnızca bu depoyu seçin. Yükleme sayfasının adresindeki sayı
   (`.../installations/12345678`) **installation ID**'dir.
6. GitHub'ın anahtarı PKCS#1'dir; Worker PKCS#8 ister:

   ```sh
   openssl pkcs8 -topk8 -nocrypt -in indirilen.pem -out anahtar-pkcs8.pem
   ```

7. Depoda `madde-onerisi` etiketinin bulunduğundan emin olun.

### 2. Cloudflare

1. Cloudflare hesabı açın. Turnstile > Add widget: alan adı olarak uygulamanın yayın alan adını
   (örn. `OWNER.github.io`) ekleyin. **Site key** uygulama için, **Secret key** Worker için.
2. `relay/wrangler.toml` içindeki `ALLOWED_ORIGINS`, `GITHUB_REPO`, `GITHUB_APP_ID`,
   `GITHUB_INSTALLATION_ID` değerlerini doldurun. Masaüstü sürümü de bu Worker'ı kullanacaksa
   `ALLOWED_ORIGINS` içine `tauri://localhost` (macOS/Linux) ve `http://tauri.localhost`
   (Windows) de eklenmelidir.
3. Dağıtım ve gizli değerler (`relay/` klasöründen):

   ```sh
   pnpm dlx wrangler deploy
   pnpm dlx wrangler secret put TURNSTILE_SECRET
   pnpm dlx wrangler secret put GITHUB_APP_PRIVATE_KEY < anahtar-pkcs8.pem
   ```

   Gizli değerler depoya asla eklenmez. Dağıtım sonrası yazdırılan `https://riskprime-relay.<hesap>.workers.dev`
   adresini not edin.

4. Anahtar dosyalarını güvenli biçimde silin.

### 3. Uygulama

Uygulamanın derleme ortamında şunları tanımlayın ve yeniden yayınlayın:

```
VITE_PROPOSAL_URL=https://riskprime-relay.<hesap>.workers.dev/proposals
VITE_TURNSTILE_SITE_KEY=<turnstile site key>
```

## Notlar

- Hız sınırı: IP başına 60 saniyede 5 istek (`wrangler.toml` içindeki `simple`). Günlük üst sınır
  gerekirse ikinci bir `ratelimit` bağlaması (period yalnızca 10 veya 60 sn olabilir) yerine
  Durable Object/KV sayacı eklenebilir; şimdilik gerekmiyor.
- `wrangler` bilerek bağımlılık olarak eklenmedi (CI'daki `--frozen-lockfile` kurulumu etkilenmesin).
- Testler kök dizinden: `pnpm test`.
