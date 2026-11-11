// Üretildi: node scripts/baslangic-uret.js <RISK-ANALIZ klasörü>. Elle düzenlemeyin.
(function (kok) {
  'use strict';
  const veri = {
  "surum": 1,
  "donem": "2026-2027",
  "degerlendirmeTarihi": "",
  "gecerlilikTarihi": "",
  "okul": {
    "okul": "Atatürk Mesleki ve Teknik Anadolu Lisesi",
    "kapsam": "Elektrik-Elektronik Teknolojisi Alanı",
    "gruplama": "alan",
    "imzacilar": [
      {
        "unvan": "İş Güvenliği Uzmanı",
        "ad": ""
      },
      {
        "unvan": "Çalışan Temsilcisi",
        "ad": ""
      },
      {
        "unvan": "Destek Elemanı",
        "ad": ""
      },
      {
        "unvan": "Alan Şefi",
        "ad": ""
      },
      {
        "unvan": "İşveren / Okul Müdürü",
        "ad": ""
      }
    ]
  },
  "mekanlar": [
    {
      "id": "a-01",
      "ad": "Tüm atölye ve alanlar (ortak)",
      "tur": "ortak",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-01-01",
          "alet": "Ana pano ve atölye tesisatı",
          "tehlike": "Enerjili iletkene veya açık pano parçasına temas: elektrik çarpması; yanlış sigorta değeri veya kablo kesiti: aşırı yük, yangın",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Sigorta, topraklama",
          "o": null,
          "s": null,
          "onlem": "30 mA kaçak akım rölesi ve aylık test düğmesi denemesi; atölye girişinde tüm enerjiyi kesen acil kesme butonu; pano kilitli ve şemalı; pano önü boş, yalıtkan paspaslı; sigorta değerleri kablo kesitine uygun; yıllık tesisat ve topraklama ölçümü",
          "sorumlu": "Okul müdürü, Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-02",
          "alet": "Kablo, fiş, priz, çoklu priz, kablo kanalı",
          "tehlike": "Hasarlı kablo, kırık fiş, aşırı yüklenmiş çoklu priz, kapağı kırık kablo kanalı: çarpma, yangın",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Gözle kontrol",
          "o": null,
          "s": null,
          "onlem": "Aylık kontrol ve kayıt; hasarlı malzeme hemen kullanımdan kaldırılır; kanal kapakları tam; zincirleme çoklu priz yasağı; lavabo yakınında priz yok veya su sıçramasına karşı korumalı",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-03",
          "alet": "Arızalı set veya cihaz",
          "tehlike": "Arızalı setin veya cihazın fark edilmeden tekrar kullanılması: çarpma, yangın",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "\"Arızalı - kullanmayın\" etiketi ve kilitli dolapta bekletme (KL-26.14); taşınabilir cihazların periyodik muayene ve test etiketi",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-04",
          "alet": "Öğrenci projesi ve dışarıdan getirilen cihaz",
          "tehlike": "Öğrencinin yaptığı veya evden getirdiği cihazın şebekeye bağlanması: çarpma, yangın",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Enerji vermeden önce öğretmen muayenesi ve izolasyon ölçümü; mümkünse güvenli alçak gerilim; dışarıdan cihaz onarımı yalnız öğretmen izniyle",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-05",
          "alet": "Ayarlanabilir güç kaynağı (her atölyede 1)",
          "tehlike": "Yanlış gerilim veya akım ayarı, çıkış kısa devresi: ısınma, komponent patlaması",
          "etkilenen": "Öğrenci",
          "mevcut": "Cihaz koruması",
          "o": null,
          "s": null,
          "onlem": "Akım sınırı önce ayarlanır; bağlantı çıkış kapalıyken yapılır; ayar öğretmen kontrolünde",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-06",
          "alet": "Tesviyeci tezgâhı seti (mengene, eğe, testere; ELE1, 2, 4, 7, 12, 13)",
          "tehlike": "Mengenede el sıkışması; eğe ve testereyle kesilme; çapak; paslı parçayla yaralanma",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Sapsız eğe kullanılmaz (KL-34.04); parça mengenede sabit; çapak alınır; eldiven; yara ilk yardımla temizlenir",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-07",
          "alet": "El aletleri ve el tipi ölçü aletleri (envanterde ayrı kalem yok)",
          "tehlike": "Yalıtımı hasarlı aletle enerjili parçaya temas; yanlış kademede ölçüm: kıvılcım; kalibrasyonu bozuk aletle yanlış \"gerilim yok\" okuması: çarpma",
          "etkilenen": "Öğrenci",
          "mevcut": "Yalıtımlı aletler",
          "o": null,
          "s": null,
          "onlem": "Hasarlı alet ayıklanır (KL-34.22); ölçü aleti ve problar ölçülen devreye uygun CAT sınıfında (TS EN 61010); ölçüm öncesi kademe kontrolü; ölçü aleti bilinen kaynakta denenip kullanılır; kalibrasyon kaydı (KL-34.19); ders sonunda sayım",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-08",
          "alet": "Kişisel koruyucu donanım",
          "tehlike": "Gözlük, yalıtkan eldiven, yalıtkan paspas eksik, kullanılmıyor veya yalıtım testi yapılmamış",
          "etkilenen": "Öğrenci",
          "mevcut": "Sözlü uyarı",
          "o": null,
          "s": null,
          "onlem": "İşe uygun KKD listesi atölye girişinde; yalıtkan paspas pano ve tezgâh önünde; yalıtkan eldiven ve paspas periyodik kontrol ve etiketli; KKD'siz çalışma yasağı",
          "sorumlu": "Atölye öğretmeni, Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-09",
          "alet": "Ağır cihaz taşıma (trafo, motor, eğitim seti)",
          "tehlike": "Elle taşımada bel zorlanması, ayağa düşme",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ağır parça iki kişiyle veya taşıma arabasıyla; öğrenciye ağır yük taşıtılmaz",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-10",
          "alet": "Yalnız çalışma",
          "tehlike": "Atölye veya depoda tek başına çalışan öğretmenin kazada yardım alamaması",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Enerjili iş en az iki kişiyle; yalnız çalışmada telefon yanında ve haber verme",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-11",
          "alet": "Pencere, kapı, cam yüzey",
          "tehlike": "Açık pencereden düşme; cam kapının kırılması; menteşesi gevşeyen kapının düşmesi",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Pencere açılma sınırlayıcı (100 mm); cam yüzeyde işaret veya kırılmaz film; kapı menteşeleri yıllık kontrol",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-12",
          "alet": "Malzeme, modül ve camlı dolaplar",
          "tehlike": "Dolabın devrilmesi; üst raftan ağır modül düşmesi; cam kırılması",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Dolaplar duvara sabitlenir (KL-35.23); ağır modüller alt rafta; camlı dolap kapakları kapalı",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-13",
          "alet": "Etkileşimli tahta, projeksiyon",
          "tehlike": "Bağlantının gevşeyip düşmesi; projeksiyon ışığına doğrudan bakma",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Duvara monte",
          "o": null,
          "s": null,
          "onlem": "Montaj bağlantıları yılda bir kontrol; projeksiyon önünde durulmaz",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-14",
          "alet": "Split ve salon tipi klima",
          "tehlike": "Bakımsız filtre; drenaj suyunun zemine damlaması: kayma",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Periyodik filtre bakımı; drenaj hattı kontrolü",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-15",
          "alet": "Ders sonu ve gece açık kalan enerji",
          "tehlike": "Kapatılmayan set, güç kaynağı, havya, klima: gece yangını",
          "etkilenen": "Herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ders sonu kapanış kontrolü; atölye ana şalteri kapatılır (KL-30.07)",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-16",
          "alet": "Aydınlatma, elektrik kesintisi, acil aydınlatma",
          "tehlike": "Yetersiz genel veya tezgâh aydınlatması; kesintide karanlıkta kalma; enerji geri gelince set ve motorların kendiliğinden çalışması",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Genel aydınlatma",
          "o": null,
          "s": null,
          "onlem": "Yılda bir aydınlatma ölçümü, gerekirse tezgâh lambası (KL-20.04/20.05); acil aydınlatma ve ışıklı çıkış levhası (KL-20.02); kesintide setler kapatılır; motorlar kontaktörlü (mühürlemeli) yol verme ile beslenir (KL-26.42)",
          "sorumlu": "Okul müdürü, Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-17",
          "alet": "Atölyede yiyecek ve içecek",
          "tehlike": "Sıvının sete, klavyeye, prize dökülmesi: kısa devre, çarpma; lehim bulaşmış elle yemek",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Atölyede yiyecek-içecek yasağı (KL-32.34); el yıkama",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-18",
          "alet": "Şaka ve dikkatsiz davranış",
          "tehlike": "Arkadaşına basınçlı hava, elektrik veya sıcak aletle şaka; atölyede koşma",
          "etkilenen": "Öğrenci",
          "mevcut": "Atölye kuralları",
          "o": null,
          "s": null,
          "onlem": "Kurallar panoda ve dönem başında imzalı; öğretmen gözetimi; ihlalde disiplin süreci",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-19",
          "alet": "Deprem",
          "tehlike": "Set, motor masası, monitör, klima iç ünitesi ve armatürün devrilmesi veya düşmesi; kaçışta izdiham",
          "etkilenen": "Herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ağır ekipman ve dolaplar sabit (KL-17.32, KL-35.23); acil durum planı ve tahliye tatbikatı; çök-kapan-tutun eğitimi",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-20",
          "alet": "Temizlik personeli ve ziyaretçiler",
          "tehlike": "Enerjili setin ıslak bezle silinmesi; bilgisiz kişinin sete enerji vermesi",
          "etkilenen": "Personel, ziyaretçi",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Temizlik enerji kesikken ve kuru bezle; temizlik personeline atölye riskleri anlatılır (Yön. md. 16); ziyaretçi refakatli",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-21",
          "alet": "Özel politika gerektiren gruplar",
          "tehlike": "Engelli, gebe, kronik hastalığı olan (epilepsi, kalp pili) öğrenci ve öğretmen; 18 yaş altı öğrenciler",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Sağlık bilgisine göre kişiye özel önlem (Yön. md. 8-ı); kalp pili taşıyan şebeke ve motor deneylerinden uzak tutulur; erişilebilir çıkış",
          "sorumlu": "Okul müdürü, Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-22",
          "alet": "Atık yönetimi",
          "tehlike": "E-atık, pil, kırık lamba, yağlı bez ve hidrolik yağın çöpe atılması: sağlık ve çevre zararı",
          "etkilenen": "Herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ayrı etiketli atık kutuları; kapaklı ve poşetli çöp kutusu; yetkili toplama (KL-33)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-23",
          "alet": "Yangın söndürme",
          "tehlike": "Elektrik yangını; uygun söndürücü bulunmaması veya erişilememesi",
          "etkilenen": "Herkes",
          "mevcut": "Söndürücü",
          "o": null,
          "s": null,
          "onlem": "Elektrik yangınına uygun söndürücü (CO2, kuru kimyevi toz); yılda bir kontrol ve etiket (KL-30.03); atölyede duman dedektörü; yangın talimatı ve tatbikat; su ile müdahale yasağı",
          "sorumlu": "Okul müdürü, İSG kurulu",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-24",
          "alet": "Acil çıkış ve kaçış yolu",
          "tehlike": "Kaçış yolunun veya kapının engellenmesi, işaretlerin eksikliği",
          "etkilenen": "Herkes",
          "mevcut": "Kapı",
          "o": null,
          "s": null,
          "onlem": "Çıkış yolu boş; yönlendirme ve toplanma yeri işaretleri; kapı dışarı açılır",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-25",
          "alet": "Zemin, kablo düzeni, tezgâh düzeni",
          "tehlike": "Zemindeki kablolar, yerde bırakılan cihaz, dağınık tezgâh, ıslak temizlik sonrası kaygan zemin: takılma, düşme",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Temizlik",
          "o": null,
          "s": null,
          "onlem": "Kablo kanalı veya tezgâh arkası geçiş; kullanılmayan cihaz yerine kaldırılır; ıslak temizlikte \"Kaygan Zemin\" levhası; ders sonu düzen",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-26",
          "alet": "İlk yardım",
          "tehlike": "Eksik ilk yardım dolabı, ilk yardımcının belli olmaması: gecikmiş müdahale",
          "etkilenen": "Herkes",
          "mevcut": "Revir",
          "o": null,
          "s": null,
          "onlem": "Dolap erişilebilir yerde, kontrol tarihli; ilk yardımcı ve acil numaralar panoda; elektrik çarpması müdahale talimatı",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-01-27",
          "alet": "Eğitim ve denetim",
          "tehlike": "İSG eğitimi almadan veya öğretmensiz çalışma; öğretmen değişikliğinde veya vekil öğretmenle gözetim boşluğu",
          "etkilenen": "Öğrenci",
          "mevcut": "Atölye kuralları",
          "o": null,
          "s": null,
          "onlem": "Dönem başı İSG eğitimi, güvenlik sınavı ve kayıt; öğrenci ve veli imzalı atölye kuralları; vekil öğretmene atölye riskleri devredilir, gerekirse enerjili uygulama yapılmaz; öğretmen yokken atölye kilitli",
          "sorumlu": "Atölye öğretmeni, Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-02",
      "ad": "ELE1 · Haberleşme ve Görüntü Sistemleri",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-02-01",
          "alet": "Televizyon alıcısı eğitim seti (2)",
          "tehlike": "İç besleme kartında şebeke gerilimi ve yüklü kondansatör; panel kırılması",
          "etkilenen": "Öğrenci",
          "mevcut": "Modüler set",
          "o": null,
          "s": null,
          "onlem": "Arıza yalnız setin test noktalarından; kapak açılacaksa enerji kesilip kondansatör deşarj edilir; panel taşıma iki kişiyle",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-02-02",
          "alet": "FM radyo alıcı-verici seti (5), amplifikatör eğitim seti (3)",
          "tehlike": "Yüksek ses: işitme zararı; verici çıkışı yüksüz çalışma",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ses seviyesi sınırlı; verici çıkışında anten veya yük bağlı; deney süresi kısa",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-02-03",
          "alet": "Çanak anten seti (4), uydu santrali (4), uydu yön bulucu (4)",
          "tehlike": "Çanağın devrilmesi, kenarla kesilme; çatıda veya yüksekte montaj: düşme; dış mekânda direk veya antenin havai enerji hattına yaklaşması",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Çanak sabit sehpada; uygulama atölyede; öğrenci çatıya ve yüksekte çalışmaya çıkarılmaz (KL-25); dış mekân uygulamasında havai hattan uzak yer seçilir",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-02-04",
          "alet": "Osiloskop (2), sinyal ve pattern jeneratörü (2+2), spektrum analizör (4), frekansmetre (2)",
          "tehlike": "Osiloskop toprak ucuyla şebekede kısa devre; girişe aşırı gerilim veya güç: cihaz hasarı",
          "etkilenen": "Öğrenci, malzeme",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Şebeke ölçümünde izoleli veya diferansiyel prob; giriş sınırları etikette; kullanım talimatı",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-02-05",
          "alet": "Data kablo test cihazı, kablo arıza ve yer bulma cihazı (2+2)",
          "tehlike": "Enerjili hatta bağlama: cihaz hasarı, çarpma",
          "etkilenen": "Öğrenci, malzeme",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Hat önce enerjisiz olduğu ölçülerek bağlanır; yalnız eğitim kablolarında çalışılır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-02-06",
          "alet": "Lehimleme ve lehim sökme istasyonu (1)",
          "tehlike": "Sıcak uca temas: yanık; lehim dumanı",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Havya yuvasında bırakılır; kullanılmayan istasyon kapatılır; havalandırma; el yıkama",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-03",
      "ad": "ELE2 · Elektrik Tesisat",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-03-01",
          "alet": "Elektrik tesisat eğitim seti (4)",
          "tehlike": "Bağlantı sırasında enerjili uca temas; yanlış bağlantı: çarpma, kısa devre",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; öğretmen kontrolünden sonra enerji; set beslemesi 30 mA kaçak akım rölesinden; RCD açma süresi ölçülür",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-03-02",
          "alet": "Topraklama eğitim seti (1)",
          "tehlike": "Kaçak akım ve temas gerilimi deneylerinde enerjili devreye temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Deneyler öğretmen gözetiminde; ölçüm uçları yalıtımlı; deney sonrası enerji kesilir",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-03-03",
          "alet": "Görüntülü diyafon eğitim seti (1)",
          "tehlike": "230 V besleme adaptörü ve santral klemenslerine temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; besleme kapaklı; yalnız zayıf akım uçlarında çalışılır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-04",
      "ad": "ELE4 · Elektrik Tesisat",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-04-01",
          "alet": "Elektrik tesisat eğitim seti (4)",
          "tehlike": "Bağlantı sırasında enerjili uca temas; yanlış bağlantı: çarpma, kısa devre",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; öğretmen kontrolünden sonra enerji; set beslemesi 30 mA kaçak akım rölesinden; RCD açma süresi ölçülür",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-05",
      "ad": "ELE5 · Zayıf Akım ve Güvenlik Sistemleri",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-05-01",
          "alet": "Akıllı bina otomasyon eğitim seti (2)",
          "tehlike": "230 V aktüatör ve röle çıkışlarına temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Besleme tarafı kapaklı; bağlantı enerjisiz; çıkış gerilimleri etiketli",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-05-02",
          "alet": "Hırsız alarm eğitim seti (2)",
          "tehlike": "Siren sesi: işitme zararı, dikkat dağılması",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Deneylerde siren yerine gösterge veya kısa süreli test; ses kısık",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-05-03",
          "alet": "Yangın algılama eğitim seti (2)",
          "tehlike": "Test spreyi ve duman; setin okulun gerçek yangın alarmıyla karışması",
          "etkilenen": "Öğrenci, herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Test spreyi havalandırılan ortamda; set okul alarm sistemine bağlanmaz; deney öncesi duyuru",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-05-04",
          "alet": "Kamera sistemleri eğitim seti (4)",
          "tehlike": "Adaptör ve kablo bağlantıları; kayıtlı öğrenci görüntüleri",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; deney kayıtları ders sonunda silinir",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-05-05",
          "alet": "Görüntülü diyafon eğitim seti (1)",
          "tehlike": "230 V besleme adaptörü ve santral klemenslerine temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; besleme kapaklı; yalnız zayıf akım uçlarında çalışılır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-05-06",
          "alet": "Osiloskop (2), sinyal jeneratörü (2)",
          "tehlike": "Osiloskop toprak ucuyla şebekede kısa devre; girişe aşırı gerilim veya güç: cihaz hasarı",
          "etkilenen": "Öğrenci, malzeme",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Şebeke ölçümünde izoleli veya diferansiyel prob; giriş sınırları etikette; kullanım talimatı",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-06",
      "ad": "ELE6 · Pano Montaj",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-06-01",
          "alet": "Pano montörlüğü eğitim seti (10)",
          "tehlike": "Pano bağlantısında üç faz enerjili parçaya temas; kısa devrede ark: yanık, göz",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; enerji öncesi öğretmen kontrolü ve izolasyon ölçümü; kaçak akım rölesi; acil durdurma her ders denenir; ilk enerjide pano kapağı kapalı, gözlük",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-06-02",
          "alet": "Pano içi montaj (ray ve kanal kesme, delme)",
          "tehlike": "Keskin kenar ve çapakla kesilme; talaş göze kaçması",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Gözlük ve iş eldiveni; kesilen ray ve kanal çapağı alınır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-07",
      "ad": "ELE7 · Endüstriyel Elektronik ve Tesisat",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-07-01",
          "alet": "Endüstriyel elektronik deney seti (10)",
          "tehlike": "Güç elektroniği devrelerinde şebeke gerilimi; ısınan soğutucuya temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; şebeke tarafı kapaklı; soğutucu soğumadan dokunulmaz; öğretmen kontrolü",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-07-02",
          "alet": "İşlemsel yükselteç eğitim seti (4)",
          "tehlike": "Ters besleme: entegre ve kondansatörün ısınıp patlaması",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Besleme kutbu kontrolü; deney sırasında yüz devreden uzak",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-07-03",
          "alet": "Elektrik tesisat eğitim seti (8)",
          "tehlike": "Bağlantı sırasında enerjili uca temas; yanlış bağlantı: çarpma, kısa devre",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; öğretmen kontrolünden sonra enerji; set beslemesi 30 mA kaçak akım rölesinden; RCD açma süresi ölçülür",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-07-04",
          "alet": "Görüntülü diyafon eğitim seti (1)",
          "tehlike": "230 V besleme adaptörü ve santral klemenslerine temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; besleme kapaklı; yalnız zayıf akım uçlarında çalışılır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-08",
      "ad": "ELE9 · Bilgisayar Laboratuvarı",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-08-01",
          "alet": "Masaüstü bilgisayar (21)",
          "tehlike": "Uzun süre ekran başı: göz, boyun, omuz, bilek rahatsızlığı",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ekran göz hizasında, 50-80 cm mesafe, yansımasız (KL-27); düzenli mola",
          "sorumlu": "Atölye öğretmeni, Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-08-02",
          "alet": "3 boyutlu yazıcı (1)",
          "tehlike": "Sıcak nozul ve tablaya temas: yanık; erimiş filament dumanı; hareketli parça",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Çalışırken içine el sokulmaz; kapalı kasa veya havalandırma; nozul soğumadan bakım yok",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-08-03",
          "alet": "Priz, çoklu priz (21 bilgisayar)",
          "tehlike": "Aşırı yük: ısınma, yangın; zemindeki kablolara takılma",
          "etkilenen": "Öğrenci, öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Sigortalı masa prizi; zincirleme çoklu priz yasağı; kablo kanalı",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-08-04",
          "alet": "Masa ve koltuk",
          "tehlike": "Kırık koltukla düşme; uygun olmayan yükseklik: duruş bozukluğu",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Kırık koltuk ayıklanır; ayarlanabilir koltuk (KL-27.08/27.09)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-09",
      "ad": "ELE10 · Otomasyon (PLC)",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-09-01",
          "alet": "Masa tipi PLC eğitim seti (10)",
          "tehlike": "230 V besleme ve röle çıkışlarına temas: çarpma",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Besleme kapaklı; çıkış gerilimleri etiketli; bağlantı enerjisiz; kaçak akım rölesi",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-09-02",
          "alet": "Servo (4) ve step (4) motor eğitim seti, konveyör (1)",
          "tehlike": "Beklenmedik hareket: parmak sıkışması, ezilme",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Hareketli kısımlar kapaklı; acil stop devrede; çalışırken hareket alanına el sokulmaz",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-09-03",
          "alet": "Program indirme (masaüstü bilgisayar, 11)",
          "tehlike": "Yanlış program: beklenmedik çıkış ve hareket",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "İndirmeden önce simülasyon; PLC STOP'ta yüklenir; hareket alanı boş",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-09-04",
          "alet": "Masaüstü bilgisayar (11)",
          "tehlike": "Uzun süre ekran başı",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ekran göz hizasında, 50-80 cm (KL-27.03); düzenli mola",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-10",
      "ad": "ELE12 · Elektrik Tesisat ve Kablo Testi",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-10-01",
          "alet": "Elektrik tesisat eğitim seti (8)",
          "tehlike": "Bağlantı sırasında enerjili uca temas; yanlış bağlantı: çarpma, kısa devre",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; öğretmen kontrolünden sonra enerji; set beslemesi 30 mA kaçak akım rölesinden; RCD açma süresi ölçülür",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-10-02",
          "alet": "Topraklama eğitim seti (1)",
          "tehlike": "Kaçak akım ve temas gerilimi deneylerinde enerjili devreye temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Deneyler öğretmen gözetiminde; ölçüm uçları yalıtımlı; deney sonrası enerji kesilir",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-10-03",
          "alet": "Data kablo test cihazı, kablo arıza ve yer bulma cihazı (2+2)",
          "tehlike": "Enerjili hatta bağlama: cihaz hasarı, çarpma",
          "etkilenen": "Öğrenci, malzeme",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Hat önce enerjisiz olduğu ölçülerek bağlanır; yalnız eğitim kablolarında çalışılır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-10-04",
          "alet": "Görüntülü diyafon eğitim seti (1)",
          "tehlike": "230 V besleme adaptörü ve santral klemenslerine temas",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantı enerjisiz; besleme kapaklı; yalnız zayıf akım uçlarında çalışılır",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-11",
      "ad": "ELE13 · Elektrik Makineleri ve Kumanda",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-11-01",
          "alet": "Elektrik makineleri deney seti (2)",
          "tehlike": "Dönen mil ve kaplin: sıkışma; seri DC motorun yüksüz aşırı hızlanması; sıcak gövde; stroboskopik etki",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Kaplin koruyucusu; seri motor yüksüz çalıştırılmaz; takı ve bol giysi yasağı; fren ve yük ayarı öğretmenle; titreşimsiz LED aydınlatma (KL-20.12)",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-11-02",
          "alet": "Otomatik kumanda eğitim seti (4)",
          "tehlike": "Enerjili klemense temas; başka öğrencinin habersiz enerji vermesi; kısa devrede ark: yanık, göz",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Her setin enerjisi öğretmen kontrolünde; \"Enerji veriyorum\" sözlü uyarısı; bağlantı enerjisiz; bobin gerilimi okunmadan bağlantı yok; kaçak akım rölesi; gözlük",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-11-03",
          "alet": "Acil stop ve butonlar",
          "tehlike": "Acil stop arızalı: durdurulamayan motor",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Her ders başında acil stop denenir; durdurma butonları kırmızı (KL-26.39)",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-12",
      "ad": "ELE14 · Hidrolik-Pnömatik ve Proses",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-12-01",
          "alet": "Pnömatik ve elektropnömatik eğitim seti (2)",
          "tehlike": "Hortumun basınç altında kurtulup savrulması; basınçlı havanın göze yönelmesi; silindirin ani hareketi",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantı basınçsızken; gözlük; basınçlı hava ile temizlik ve şaka yasağı; silindir yoluna el sokulmaz",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-12-02",
          "alet": "Hidrolik-elektrohidrolik eğitim seti (1)",
          "tehlike": "Yüksek basınçlı yağ fışkırması; hortum patlaması; yağ kaçağıyla kayma",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Bağlantıdan önce basınç tahliyesi; hortum ve rakorlar ders başı kontrol; gözlük, eldiven; damlama tepsisi",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-12-03",
          "alet": "Basınçlı hava kaynağı (envanterde yok; pnömatik set için kompresör kullanılıyorsa)",
          "tehlike": "Basınçlı kabın patlaması; gürültü",
          "etkilenen": "Herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Periyodik kontrol raporu ve emniyet ventili (KL-28.01/28.06); tank suyu boşaltılır (KL-28.10); basınç regülatörle sınırlı",
          "sorumlu": "Okul müdürü, Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-12-04",
          "alet": "Process ve SCADA eğitim seti (1)",
          "tehlike": "Su tankı, pompa ve elektriğin bir arada olması: ıslak elle çarpma, su sızıntısı; ısıtıcılı ise sıcak su",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Elektrik kısımları sudan ayrı ve kapaklı; kaçak akım rölesi; sızıntı hemen silinir; ısıtıcı devredeyken tanka dokunulmaz",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-13",
      "ad": "ELE15 · Kumanda, Motor ve Kompanzasyon",
      "tur": "atolye",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-13-01",
          "alet": "Otomatik kumanda eğitim seti (8)",
          "tehlike": "Enerjili klemense temas; başka öğrencinin habersiz enerji vermesi; kısa devrede ark: yanık, göz",
          "etkilenen": "Öğrenci",
          "mevcut": "Sigorta",
          "o": null,
          "s": null,
          "onlem": "Her setin enerjisi öğretmen kontrolünde; \"Enerji veriyorum\" sözlü uyarısı; bağlantı enerjisiz; bobin gerilimi okunmadan bağlantı yok; kaçak akım rölesi; gözlük",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-13-02",
          "alet": "Bir faz (4) ve üç faz (10+4) asenkron motor",
          "tehlike": "Dönen mile temas: sıkışma; faz-faz kısa devre; sıcak gövde; floresan altında dönen milin duruyormuş gibi görünmesi (stroboskopik etki)",
          "etkilenen": "Öğrenci",
          "mevcut": "Termik röle",
          "o": null,
          "s": null,
          "onlem": "Mil koruyucusu; motor sabit tabanda; güç devresi enerjisiz kontrol; çalıştırmadan önce çevre boşaltılır; titreşimsiz LED aydınlatma (KL-20.12)",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-13-03",
          "alet": "Modüler kompanzasyon eğitim seti (2)",
          "tehlike": "Yüklü kondansatör kademeleri; akım trafosu sekonderinin açık kalması: yüksek gerilim",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Enerji kesilince deşarj süresi beklenir ve gerilim yok ölçülür; akım trafosu sekonderi açık bırakılmaz",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-13-04",
          "alet": "Acil stop ve butonlar",
          "tehlike": "Acil stop arızalı: durdurulamayan motor",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Her ders başında acil stop denenir; durdurma butonları kırmızı (KL-26.39)",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-14",
      "ad": "Elektronik deposu",
      "tur": "depo",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-14-01",
          "alet": "Raf ve istif",
          "tehlike": "Rafın devrilmesi; üst raftan ağır kutu veya set düşmesi",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Raflar duvara sabit (KL-35.23); ağır malzeme alt rafta; dolap ve raf üstüne eşya konmaz; raf yük sınırı etiketli",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-14-02",
          "alet": "Yüksek rafa erişim",
          "tehlike": "Sandalye veya tabureye çıkarak uzanma: düşme",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Sağlam basamaklı merdiven; sandalyeye çıkılmaz (KL-25)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-14-03",
          "alet": "Pil, akü, elektrolitik kondansatör, lehim ve temizlik kimyasalları (flux, alkol)",
          "tehlike": "Kısa devre veya sızıntı: yangın; lityum pilin şarjda aşırı ısınıp tutuşması; kimyasal teması",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Piller kutupları bantlı ve ayrı kutuda; şişmiş pil ayrılır; şarj gözetimli ve yanıcı malzemeden uzakta; kimyasallar etiketli, kapalı, ateşten uzak; güvenlik bilgi formu (MSDS) depoda",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-14-04",
          "alet": "Yangın yükü (karton, ambalaj, kablo izolasyonu)",
          "tehlike": "Kapalı ve sık kullanılmayan alanda fark edilmeyen yangın",
          "etkilenen": "Herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Kapı yanında söndürücü; ısıtıcı ve priz yükü yok; ambalaj atıkları birikmez; duman dedektörü",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-14-05",
          "alet": "Depo kapısı ve erişim",
          "tehlike": "Öğrencinin denetimsiz girmesi; içeride kapı kapanması",
          "etkilenen": "Öğrenci",
          "mevcut": "Kilit",
          "o": null,
          "s": null,
          "onlem": "Depo kilitli, anahtar öğretmende; öğrenci yalnız öğretmenle girer; kapı içeriden açılır",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-15",
      "ad": "Elektrik deposu",
      "tur": "depo",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-15-01",
          "alet": "Raf ve istif",
          "tehlike": "Rafın devrilmesi; üst raftan ağır kutu veya set düşmesi",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Raflar duvara sabit (KL-35.23); ağır malzeme alt rafta; dolap ve raf üstüne eşya konmaz; raf yük sınırı etiketli",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-15-02",
          "alet": "Yüksek rafa erişim",
          "tehlike": "Sandalye veya tabureye çıkarak uzanma: düşme",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Sağlam basamaklı merdiven; sandalyeye çıkılmaz (KL-25)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-15-03",
          "alet": "Kablo makarası, motor, pano ve ağır malzeme taşıma",
          "tehlike": "Elle taşımada bel zorlanması; ayağa düşme; makaranın yuvarlanması",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ağır malzeme iki kişiyle veya araçla; makaralar takozlu; ayak koruması",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-15-04",
          "alet": "Floresan ve gazlı deşarj lambaları, kırık lamba atığı",
          "tehlike": "Lamba kırılması: cam kesiği, cıva buharı",
          "etkilenen": "Öğretmen, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Lambalar kutusunda dik saklanır; kırık lamba ayrı kapalı kapta; cıva temizleme talimatı",
          "sorumlu": "Atölye öğretmeni",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-15-05",
          "alet": "Yangın yükü (karton, ambalaj, kablo izolasyonu)",
          "tehlike": "Kapalı ve sık kullanılmayan alanda fark edilmeyen yangın",
          "etkilenen": "Herkes",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Kapı yanında söndürücü; ısıtıcı ve priz yükü yok; ambalaj atıkları birikmez; duman dedektörü",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-15-06",
          "alet": "Depo kapısı ve erişim",
          "tehlike": "Öğrencinin denetimsiz girmesi; içeride kapı kapanması",
          "etkilenen": "Öğrenci",
          "mevcut": "Kilit",
          "o": null,
          "s": null,
          "onlem": "Depo kilitli, anahtar öğretmende; öğrenci yalnız öğretmenle girer; kapı içeriden açılır",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-16",
      "ad": "Öğrenci tuvaleti (KL-11)",
      "tur": "islak",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-16-01",
          "alet": "Islak zemin",
          "tehlike": "Kayma, düşme",
          "etkilenen": "Öğrenci",
          "mevcut": "Temizlik",
          "o": null,
          "s": null,
          "onlem": "Kaymaz zemin veya paspas; ıslak zemin uyarı levhası; temizlik çizelgesi",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-16-02",
          "alet": "Islak hacimde elektrik tesisatı (aydınlatma, priz, el kurutucusu)",
          "tehlike": "Islak elle veya su sıçramasıyla elektrik çarpması",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Tesisat kaçak akım rölesiyle korunur (KL-11.07, KL-13.01); priz ve anahtarlar su sıçramasına karşı korumalı (KL-26.11)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-16-03",
          "alet": "Temizlik kimyasalları",
          "tehlike": "Çamaşır suyu ile asidik temizleyicinin karışması: zehirli gaz; göze ve deriye temas",
          "etkilenen": "Öğrenci, personel",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Kimyasallar kilitli dolapta, etiketli, MSDS mevcut; karıştırma yasağı; temizlik personeline eldiven ve gözlük; temizlik öğrenci yokken",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-16-04",
          "alet": "Hijyen ve havalandırma",
          "tehlike": "Sabun, kâğıt havlu eksikliği; havasız ortam: bulaşıcı hastalık",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Sabun ve kâğıt havlu günlük kontrol; havalandırma çalışır; kapaklı çöp kutusu",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-16-05",
          "alet": "Kabin kapı kilidi",
          "tehlike": "İçeride kilitli kalma, acil durumda ulaşılamama",
          "etkilenen": "Öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Kilitler dışarıdan acil açılabilir tipte; kapılar dışarı açılır (KL-11.11)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-16-06",
          "alet": "Denetimsiz alan",
          "tehlike": "Akran zorbalığı; sigara: yangın ve sağlık",
          "etkilenen": "Öğrenci",
          "mevcut": "Nöbetçi öğretmen",
          "o": null,
          "s": null,
          "onlem": "Teneffüste nöbet kontrolü; duman dedektörü; rehberlik servisiyle bildirim yolu",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-16-07",
          "alet": "Engelli kullanımı",
          "tehlike": "Erişilemeyen kabin, tutunma barı yok: düşme",
          "etkilenen": "Engelli öğrenci",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "En az bir kabin engelli kullanımına uygun, tutunma barlı (KL-11.05/11.09)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-17",
      "ad": "Öğretmen odaları (2)",
      "tur": "ofis",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-17-01",
          "alet": "Psikososyal yük",
          "tehlike": "Yoğun iş yükü, öğrenci veya veli kaynaklı sözlü ya da fiziksel şiddet: stres",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Şiddet olayları kayıt ve bildirim yolu; okul yönetimi desteği; İSG kurulunda görüşülür",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-17-02",
          "alet": "Masa, koltuk, bilgisayar",
          "tehlike": "Uzun süre büro çalışması: boyun, bel, göz yorgunluğu",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ayarlanabilir koltuk; ekran göz hizasında (KL-19, KL-27)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-17-03",
          "alet": "Su ısıtıcı, çay makinesi, elektrikli ısıtıcı",
          "tehlike": "Aşırı yük ve unutulan cihaz: yangın; kaynar suyla yanık",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Cihazlar TSE işaretli; ayrı sigortalı priz; çoklu prize takılmaz; gün sonu fişler çekilir; ısıtıcı kullanılmaz",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-17-04",
          "alet": "Dolap, raf, klasör",
          "tehlike": "Dolabın devrilmesi; üst raftan klasör düşmesi",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Dolaplar duvara sabit; ağır klasörler alt rafta; dolap üstüne eşya konmaz",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    },
    {
      "id": "a-18",
      "ad": "Şef odası (1)",
      "tur": "ofis",
      "bina": "",
      "alan": "Elektrik-Elektronik Teknolojisi",
      "satirlar": [
        {
          "id": "r-18-01",
          "alet": "Masa, koltuk, bilgisayar",
          "tehlike": "Uzun süre büro çalışması: boyun, bel, göz yorgunluğu",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Ayarlanabilir koltuk; ekran göz hizasında (KL-19, KL-27)",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-18-02",
          "alet": "Su ısıtıcı, çay makinesi, elektrikli ısıtıcı",
          "tehlike": "Aşırı yük ve unutulan cihaz: yangın; kaynar suyla yanık",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Cihazlar TSE işaretli; ayrı sigortalı priz; çoklu prize takılmaz; gün sonu fişler çekilir; ısıtıcı kullanılmaz",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-18-03",
          "alet": "Dolap, raf, klasör",
          "tehlike": "Dolabın devrilmesi; üst raftan klasör düşmesi",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Dolaplar duvara sabit; ağır klasörler alt rafta; dolap üstüne eşya konmaz",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        },
        {
          "id": "r-18-04",
          "alet": "Evrak ve arşiv",
          "tehlike": "Biriken kâğıt: yangın yükü",
          "etkilenen": "Öğretmen",
          "mevcut": "Yok",
          "o": null,
          "s": null,
          "onlem": "Arşiv düzenli ayıklanır; ısı kaynağından uzak; söndürücü yakın",
          "sorumlu": "Okul müdürü",
          "bitis": "",
          "durum": "acik",
          "o2": null,
          "s2": null
        }
      ]
    }
  ],
  "kontrolListeleri": [
    {
      "id": "k-01",
      "kod": "",
      "ad": "Ortak: pano, tesisat, acil durum (KL-26, KL-35, KL-30, KL-02)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-01-01",
          "no": "1",
          "metin": "Pano kapağı kapalı/kilitli, enerjili parça açıkta değil; pano önü boş (KL-26.06).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-02",
          "no": "2",
          "metin": "Kaçak akım rölesi ve sigortalar çalışıyor, test düğmesiyle denenmiş.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-03",
          "no": "3",
          "metin": "Makine ve aletlerin çıplak metal kısımları topraklı; topraklama ölçüm kaydı güncel (KL-26.02/26.03).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-04",
          "no": "4",
          "metin": "Kollu ve çevirmeli şalterlerde 1 ve 0 konumu etiketli (KL-26.07).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-05",
          "no": "5",
          "metin": "Elektrik yangınına uygun söndürücü var, tarihi geçmemiş, erişim açık.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-06",
          "no": "6",
          "metin": "Acil durum alarmı ve acil çıkış levhası var, kaçış yolu boş (KL-35.08).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-07",
          "no": "7",
          "metin": "İlk yardım dolabı erişilebilir yerde ve malzemesi tam (KL-35.05-35.07).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-08",
          "no": "8",
          "metin": "Atölye sorumlusunun telefonu ve vaziyet planı panoda asılı (KL-35.20/35.22).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-09",
          "no": "9",
          "metin": "Ders sonunda atölye ana şalteri kapatılıyor (KL-30.07); yangın alarmı ayrı kaynaktan besleniyor (KL-30.08).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-10",
          "no": "10",
          "metin": "Atölyede duman dedektörü var; kablo kanalı kapakları tam.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-11",
          "no": "11",
          "metin": "Atölye girişinde acil kesme butonu var ve çalışıyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-12",
          "no": "12",
          "metin": "Arızalı cihazlar etiketli ve kullanım dışı; taşınabilir cihazların test etiketi güncel.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-13",
          "no": "13",
          "metin": "Öğrenci projeleri enerji öncesi öğretmen tarafından muayene ediliyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-14",
          "no": "14",
          "metin": "Ölçü aletleri ve problar uygun CAT sınıfında.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-15",
          "no": "15",
          "metin": "Yalıtkan eldiven ve paspas periyodik kontrol edilmiş ve etiketli.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-16",
          "no": "16",
          "metin": "Pencerelerde açılma sınırlayıcı var; cam kapılar işaretli; kapı menteşeleri sağlam.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-17",
          "no": "17",
          "metin": "Pano durum (faz) lambaları çalışıyor; doğalgaz hattı varsa elektrik tesisatından yeterli uzaklıkta.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-18",
          "no": "18",
          "metin": "Acil aydınlatma çalışıyor; kesintide setler kapatılıyor (KL-20.02, KL-26.42).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-19",
          "no": "19",
          "metin": "Atölyede yiyecek-içecek yok (KL-32.34).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-20",
          "no": "20",
          "metin": "Temizlik enerji kesikken yapılıyor; temizlik personeli bilgilendirildi.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-01-21",
          "no": "21",
          "metin": "Deprem tahliye tatbikatı yapıldı; ağır ekipman sabit (KL-17.32).",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-02",
      "kod": "",
      "ad": "Ortak: alet, dolap, KKD (KL-34, KL-35)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-02-01",
          "no": "1",
          "metin": "El aletleri yalıtımlı ve sağlam; kırık aletler ayrı muhafaza ediliyor (KL-34.21-34.23).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-02-02",
          "no": "2",
          "metin": "Tesviyeci tezgâhında mengene sağlam; eğeler saplı (KL-34.04).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-02-03",
          "no": "3",
          "metin": "Malzeme, modül ve camlı dolaplar duvara sabit; ağır modüller alt rafta (KL-35.23).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-02-04",
          "no": "4",
          "metin": "Gerekli KKD var ve uygun şekilde muhafaza ediliyor (KL-35.13/35.14).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-02-05",
          "no": "5",
          "metin": "Klima filtre bakımı yapılmış; drenaj suyu zemine damlamıyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-03",
      "kod": "",
      "ad": "ELE1 · Haberleşme ve Görüntü Sistemleri",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-03-01",
          "no": "1",
          "metin": "TV setinde arıza yalnız test noktalarından yapılıyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-03-02",
          "no": "2",
          "metin": "Amplifikatör ve verici deneylerinde ses seviyesi sınırlı; verici çıkışı yüklü.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-03-03",
          "no": "3",
          "metin": "Çanak antenler sabit sehpada; yüksekte çalışma yok.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-03-04",
          "no": "4",
          "metin": "Lehim istasyonu yuvalı; havalandırma var.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-04",
      "kod": "",
      "ad": "ELE2, ELE4, ELE7, ELE12 · Elektrik tesisat setleri",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-04-01",
          "no": "1",
          "metin": "Tesisat setleri kaçak akım rölesinden besleniyor; RCD açma süresi ölçüldü.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-04-02",
          "no": "2",
          "metin": "Bağlantılar enerjisiz yapılıyor; enerji öncesi öğretmen kontrolü var.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-04-03",
          "no": "3",
          "metin": "Topraklama ve kablo test deneyleri öğretmen gözetiminde.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-05",
      "kod": "",
      "ad": "ELE5 · Zayıf Akım ve Güvenlik Sistemleri",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-05-01",
          "no": "1",
          "metin": "Bina otomasyon setinin 230 V tarafı kapaklı.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-05-02",
          "no": "2",
          "metin": "Siren deneyleri kısık sesle ve kısa süreli.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-05-03",
          "no": "3",
          "metin": "Yangın algılama seti okul alarm sistemine bağlı değil; test spreyi havalandırmalı ortamda.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-06",
      "kod": "",
      "ad": "ELE6 · Pano Montaj",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-06-01",
          "no": "1",
          "metin": "Pano setlerinin acil durdurma ve kaçak akım koruması ders başında denendi.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-06-02",
          "no": "2",
          "metin": "Ray ve kanal kesiminde gözlük ve eldiven kullanılıyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-07",
      "kod": "",
      "ad": "ELE7 · Endüstriyel Elektronik",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-07-01",
          "no": "1",
          "metin": "Endüstriyel elektronik setlerinin şebeke tarafı kapaklı; soğutucular soğumadan dokunulmuyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-08",
      "kod": "",
      "ad": "ELE9 · Bilgisayar Laboratuvarı (KL-27, KL-19)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-08-01",
          "no": "1",
          "metin": "Ekranlar ayarlanabilir, yansımasız; mesafe 50-80 cm (KL-27.01-27.04).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-08-02",
          "no": "2",
          "metin": "Masa ve koltuk yeterli yükseklikte ve ergonomik (KL-27.08/27.09).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-08-03",
          "no": "3",
          "metin": "3B yazıcı çalışırken içine el sokulmuyor; ortam havalandırılıyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-08-04",
          "no": "4",
          "metin": "Çoklu prizlerde zincirleme bağlantı yok; kablolar kanalda.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-09",
      "kod": "",
      "ad": "ELE10 · Otomasyon (PLC)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-09-01",
          "no": "1",
          "metin": "PLC setlerinin besleme tarafı kapaklı; çıkış gerilimleri etiketli.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-09-02",
          "no": "2",
          "metin": "Servo, step ve konveyör hareketli kısımları kapaklı; acil stop devrede.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-09-03",
          "no": "3",
          "metin": "Program indirmeden önce hareket alanı boş ve PLC STOP konumunda.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-10",
      "kod": "",
      "ad": "ELE13, ELE15 · Kumanda ve motorlar",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-10-01",
          "no": "1",
          "metin": "Kumanda setlerinde enerji yalnız öğretmen kontrolünde veriliyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-10-02",
          "no": "2",
          "metin": "Motor milleri ve kaplinler koruyuculu; motorlar sabit tabanda.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-10-03",
          "no": "3",
          "metin": "Seri DC motor yüksüz çalıştırılmıyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-10-04",
          "no": "4",
          "metin": "Acil stop ders başında denendi; durdurma butonları kırmızı (KL-26.19/26.39).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-10-05",
          "no": "5",
          "metin": "Kompanzasyon setinde deşarj süresi bekleniyor; akım trafosu sekonderi açık kalmıyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-11",
      "kod": "",
      "ad": "ELE14 · Hidrolik-Pnömatik ve Proses (KL-28)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-11-01",
          "no": "1",
          "metin": "Bağlantılar basınçsızken yapılıyor; hortum ve rakorlar sağlam.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-11-02",
          "no": "2",
          "metin": "Kompresör kullanılıyorsa periyodik kontrol raporu var; emniyet ventili çalışıyor (KL-28.01/28.06).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-11-03",
          "no": "3",
          "metin": "Basınçlı hava ile temizlikte basınç düşürücü uç ve KKD kullanılıyor (KL-26.43/26.44).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-11-04",
          "no": "4",
          "metin": "Process setinde elektrik kısımları sudan ayrı; yağ ve su kaçağına karşı tepsi var.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-12",
      "kod": "",
      "ad": "Elektronik ve elektrik depoları",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-12-01",
          "no": "1",
          "metin": "Raflar duvara sabit; ağır malzeme alt rafta; yük sınırı etiketli (KL-35.23).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-12-02",
          "no": "2",
          "metin": "Yüksek rafa basamaklı merdivenle ulaşılıyor; sandalyeye çıkılmıyor (KL-25).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-12-03",
          "no": "3",
          "metin": "Seyyar merdiven sağlam ve kullanım öncesi kontrol ediliyor (KL-25.04/25.06).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-12-04",
          "no": "4",
          "metin": "Piller kutupları bantlı ve ayrı; kimyasallar etiketli ve kapalı; MSDS depoda.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-12-05",
          "no": "5",
          "metin": "Kırık lambalar ayrı kapalı kapta.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-12-06",
          "no": "6",
          "metin": "Kapı yanında söndürücü var; ambalaj atığı birikmiyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-12-07",
          "no": "7",
          "metin": "Depo kilitli; öğrenci yalnız öğretmenle giriyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-13",
      "kod": "",
      "ad": "Öğrenci tuvaleti (KL-11)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-13-01",
          "no": "1",
          "metin": "Zemin kaymaz veya paspaslı; ıslak zemin uyarısı var.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-13-02",
          "no": "2",
          "metin": "Elektrik tesisatı kaçak akım rölesiyle korunuyor; priz ve anahtarlar su sıçramasına karşı korumalı (KL-11.07, KL-26.11).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-13-03",
          "no": "3",
          "metin": "Temizlik kimyasalları kilitli dolapta ve etiketli.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-13-04",
          "no": "4",
          "metin": "Sabun, kâğıt havlu ve havalandırma yeterli.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-13-05",
          "no": "5",
          "metin": "Kabin kilitleri dışarıdan acil açılabiliyor; kapılar dışarı açılıyor (KL-11.11).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-13-06",
          "no": "6",
          "metin": "En az bir kabin engelli kullanımına uygun (KL-11.09).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-13-07",
          "no": "7",
          "metin": "Duman dedektörü var; teneffüste nöbet kontrolü yapılıyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-14",
      "kod": "",
      "ad": "Öğretmen odaları ve şef odası (KL-19)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-14-01",
          "no": "1",
          "metin": "Koltuklar ayarlanabilir; ekranlar göz hizasında.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-14-02",
          "no": "2",
          "metin": "Su ısıtıcı ve çay makinesi ayrı sigortalı prize takılı; gün sonu fişler çekiliyor.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-14-03",
          "no": "3",
          "metin": "Dolaplar duvara sabit; ağır klasörler alt rafta.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-14-04",
          "no": "4",
          "metin": "Arşiv ısı kaynağından uzak; söndürücü yakında.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    },
    {
      "id": "k-15",
      "kod": "",
      "ad": "Eğitim, belge ve organizasyon (tüm atölye ve alanlar)",
      "kaynak": "ic",
      "maddeler": [
        {
          "id": "m-15-01",
          "no": "1",
          "metin": "Öğrenciler dönem başında İSG ve atölye kuralları eğitimini aldı, kayıt var (KL-26.16).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-15-02",
          "no": "2",
          "metin": "Makine kullanım talimatları ve uyarı levhaları asılı (KL-35.09/35.12).",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-15-03",
          "no": "3",
          "metin": "Öğretmen yokken atölye kilitli; okul saatleri dışı kullanım kuralı belirli.",
          "cevap": "",
          "aciklama": ""
        },
        {
          "id": "m-15-04",
          "no": "4",
          "metin": "Kaza ve ramak kala olay kaydı tutuluyor; İSG kuruluna bildiriliyor.",
          "cevap": "",
          "aciklama": ""
        }
      ]
    }
  ]
};
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { baslangic: veri });
  if (typeof module === 'object' && module.exports) module.exports = veri;
})(typeof window !== 'undefined' ? window : globalThis);
