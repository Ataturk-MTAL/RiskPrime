# Hazır mekân şablonları

Her alan bir dosya (`makine.toml`, `kimya.toml`, …). `pnpm bank:build` dosyaları doğrular ve `src/lib/data/locations.json` dosyasını üretir; uygulamada "Kütüphaneden ekle" penceresinde alan başlığı altında görünürler. Elektrik-Elektronik mekânları `src/lib/data/library.json` içindedir (`pnpm generate:library`).

```toml
area = "Makine ve Tasarım Teknolojisi"     # alan adı, grup başlığı olur

[[location]]
name = "CNC Atölyesi"                      # tüm şablonlarda tek olmalı
type = "workshop"                          # workshop, storage, office, wet, common
checklists = ["KL-37", "KL-43"]            # mekân eklenince bağlanan MEB listeleri

[[location.row]]                           # en az bir risk satırı
equipment = "CNC torna ve freze tezgâhı"
hazard = "…"
affected = "Öğrenci"
existingControls = "Sigorta"               # isteğe bağlı, yoksa "Yok"
action = "…"
responsible = "Atölye öğretmeni"
```

Satırlar puansız gelir; olasılık ve şiddeti okul kendi mekânına göre verir. Mekân eklenirken listeler şöyle bağlanır: değerlendirmede o liste belirli mekânlara bağlıysa yeni mekân da eklenir; okul geneliyse dokunulmaz (zaten tüm mekânları kapsar); hiç yoksa kütüphaneden eklenip yalnız bu mekâna bağlanır.

İçerik iş güvenliği uzmanınca gözden geçirilmelidir.
