// Üretildi: node scripts/kl-uret.js <KL PDF>. Elle düzenlemeyin.
(function (kok) {
  'use strict';
  const veri = {
 "kontrolListeleri": [
  {
   "kod": "",
   "ad": "Ortak: pano, tesisat, acil durum (KL-26, KL-35, KL-30, KL-02)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Pano kapağı kapalı/kilitli, enerjili parça açıkta değil; pano önü boş (KL-26.06)."
    },
    {
     "no": "2",
     "metin": "Kaçak akım rölesi ve sigortalar çalışıyor, test düğmesiyle denenmiş."
    },
    {
     "no": "3",
     "metin": "Makine ve aletlerin çıplak metal kısımları topraklı; topraklama ölçüm kaydı güncel (KL-26.02/26.03)."
    },
    {
     "no": "4",
     "metin": "Kollu ve çevirmeli şalterlerde 1 ve 0 konumu etiketli (KL-26.07)."
    },
    {
     "no": "5",
     "metin": "Elektrik yangınına uygun söndürücü var, tarihi geçmemiş, erişim açık."
    },
    {
     "no": "6",
     "metin": "Acil durum alarmı ve acil çıkış levhası var, kaçış yolu boş (KL-35.08)."
    },
    {
     "no": "7",
     "metin": "İlk yardım dolabı erişilebilir yerde ve malzemesi tam (KL-35.05-35.07)."
    },
    {
     "no": "8",
     "metin": "Atölye sorumlusunun telefonu ve vaziyet planı panoda asılı (KL-35.20/35.22)."
    },
    {
     "no": "9",
     "metin": "Ders sonunda atölye ana şalteri kapatılıyor (KL-30.07); yangın alarmı ayrı kaynaktan besleniyor (KL-30.08)."
    },
    {
     "no": "10",
     "metin": "Atölyede duman dedektörü var; kablo kanalı kapakları tam."
    },
    {
     "no": "11",
     "metin": "Atölye girişinde acil kesme butonu var ve çalışıyor."
    },
    {
     "no": "12",
     "metin": "Arızalı cihazlar etiketli ve kullanım dışı; taşınabilir cihazların test etiketi güncel."
    },
    {
     "no": "13",
     "metin": "Öğrenci projeleri enerji öncesi öğretmen tarafından muayene ediliyor."
    },
    {
     "no": "14",
     "metin": "Ölçü aletleri ve problar uygun CAT sınıfında."
    },
    {
     "no": "15",
     "metin": "Yalıtkan eldiven ve paspas periyodik kontrol edilmiş ve etiketli."
    },
    {
     "no": "16",
     "metin": "Pencerelerde açılma sınırlayıcı var; cam kapılar işaretli; kapı menteşeleri sağlam."
    },
    {
     "no": "17",
     "metin": "Pano durum (faz) lambaları çalışıyor; doğalgaz hattı varsa elektrik tesisatından yeterli uzaklıkta."
    },
    {
     "no": "18",
     "metin": "Acil aydınlatma çalışıyor; kesintide setler kapatılıyor (KL-20.02, KL-26.42)."
    },
    {
     "no": "19",
     "metin": "Atölyede yiyecek-içecek yok (KL-32.34)."
    },
    {
     "no": "20",
     "metin": "Temizlik enerji kesikken yapılıyor; temizlik personeli bilgilendirildi."
    },
    {
     "no": "21",
     "metin": "Deprem tahliye tatbikatı yapıldı; ağır ekipman sabit (KL-17.32)."
    }
   ]
  },
  {
   "kod": "",
   "ad": "Ortak: alet, dolap, KKD (KL-34, KL-35)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "El aletleri yalıtımlı ve sağlam; kırık aletler ayrı muhafaza ediliyor (KL-34.21-34.23)."
    },
    {
     "no": "2",
     "metin": "Tesviyeci tezgâhında mengene sağlam; eğeler saplı (KL-34.04)."
    },
    {
     "no": "3",
     "metin": "Malzeme, modül ve camlı dolaplar duvara sabit; ağır modüller alt rafta (KL-35.23)."
    },
    {
     "no": "4",
     "metin": "Gerekli KKD var ve uygun şekilde muhafaza ediliyor (KL-35.13/35.14)."
    },
    {
     "no": "5",
     "metin": "Klima filtre bakımı yapılmış; drenaj suyu zemine damlamıyor."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE1 · Haberleşme ve Görüntü Sistemleri",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "TV setinde arıza yalnız test noktalarından yapılıyor."
    },
    {
     "no": "2",
     "metin": "Amplifikatör ve verici deneylerinde ses seviyesi sınırlı; verici çıkışı yüklü."
    },
    {
     "no": "3",
     "metin": "Çanak antenler sabit sehpada; yüksekte çalışma yok."
    },
    {
     "no": "4",
     "metin": "Lehim istasyonu yuvalı; havalandırma var."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE2, ELE4, ELE7, ELE12 · Elektrik tesisat setleri",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Tesisat setleri kaçak akım rölesinden besleniyor; RCD açma süresi ölçüldü."
    },
    {
     "no": "2",
     "metin": "Bağlantılar enerjisiz yapılıyor; enerji öncesi öğretmen kontrolü var."
    },
    {
     "no": "3",
     "metin": "Topraklama ve kablo test deneyleri öğretmen gözetiminde."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE5 · Zayıf Akım ve Güvenlik Sistemleri",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Bina otomasyon setinin 230 V tarafı kapaklı."
    },
    {
     "no": "2",
     "metin": "Siren deneyleri kısık sesle ve kısa süreli."
    },
    {
     "no": "3",
     "metin": "Yangın algılama seti okul alarm sistemine bağlı değil; test spreyi havalandırmalı ortamda."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE6 · Pano Montaj",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Pano setlerinin acil durdurma ve kaçak akım koruması ders başında denendi."
    },
    {
     "no": "2",
     "metin": "Ray ve kanal kesiminde gözlük ve eldiven kullanılıyor."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE7 · Endüstriyel Elektronik",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Endüstriyel elektronik setlerinin şebeke tarafı kapaklı; soğutucular soğumadan dokunulmuyor."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE9 · Bilgisayar Laboratuvarı (KL-27, KL-19)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Ekranlar ayarlanabilir, yansımasız; mesafe 50-80 cm (KL-27.01-27.04)."
    },
    {
     "no": "2",
     "metin": "Masa ve koltuk yeterli yükseklikte ve ergonomik (KL-27.08/27.09)."
    },
    {
     "no": "3",
     "metin": "3B yazıcı çalışırken içine el sokulmuyor; ortam havalandırılıyor."
    },
    {
     "no": "4",
     "metin": "Çoklu prizlerde zincirleme bağlantı yok; kablolar kanalda."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE10 · Otomasyon (PLC)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "PLC setlerinin besleme tarafı kapaklı; çıkış gerilimleri etiketli."
    },
    {
     "no": "2",
     "metin": "Servo, step ve konveyör hareketli kısımları kapaklı; acil stop devrede."
    },
    {
     "no": "3",
     "metin": "Program indirmeden önce hareket alanı boş ve PLC STOP konumunda."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE13, ELE15 · Kumanda ve motorlar",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Kumanda setlerinde enerji yalnız öğretmen kontrolünde veriliyor."
    },
    {
     "no": "2",
     "metin": "Motor milleri ve kaplinler koruyuculu; motorlar sabit tabanda."
    },
    {
     "no": "3",
     "metin": "Seri DC motor yüksüz çalıştırılmıyor."
    },
    {
     "no": "4",
     "metin": "Acil stop ders başında denendi; durdurma butonları kırmızı (KL-26.19/26.39)."
    },
    {
     "no": "5",
     "metin": "Kompanzasyon setinde deşarj süresi bekleniyor; akım trafosu sekonderi açık kalmıyor."
    }
   ]
  },
  {
   "kod": "",
   "ad": "ELE14 · Hidrolik-Pnömatik ve Proses (KL-28)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Bağlantılar basınçsızken yapılıyor; hortum ve rakorlar sağlam."
    },
    {
     "no": "2",
     "metin": "Kompresör kullanılıyorsa periyodik kontrol raporu var; emniyet ventili çalışıyor (KL-28.01/28.06)."
    },
    {
     "no": "3",
     "metin": "Basınçlı hava ile temizlikte basınç düşürücü uç ve KKD kullanılıyor (KL-26.43/26.44)."
    },
    {
     "no": "4",
     "metin": "Process setinde elektrik kısımları sudan ayrı; yağ ve su kaçağına karşı tepsi var."
    }
   ]
  },
  {
   "kod": "",
   "ad": "Elektronik ve elektrik depoları",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Raflar duvara sabit; ağır malzeme alt rafta; yük sınırı etiketli (KL-35.23)."
    },
    {
     "no": "2",
     "metin": "Yüksek rafa basamaklı merdivenle ulaşılıyor; sandalyeye çıkılmıyor (KL-25)."
    },
    {
     "no": "3",
     "metin": "Seyyar merdiven sağlam ve kullanım öncesi kontrol ediliyor (KL-25.04/25.06)."
    },
    {
     "no": "4",
     "metin": "Piller kutupları bantlı ve ayrı; kimyasallar etiketli ve kapalı; MSDS depoda."
    },
    {
     "no": "5",
     "metin": "Kırık lambalar ayrı kapalı kapta."
    },
    {
     "no": "6",
     "metin": "Kapı yanında söndürücü var; ambalaj atığı birikmiyor."
    },
    {
     "no": "7",
     "metin": "Depo kilitli; öğrenci yalnız öğretmenle giriyor."
    }
   ]
  },
  {
   "kod": "",
   "ad": "Öğrenci tuvaleti (KL-11)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Zemin kaymaz veya paspaslı; ıslak zemin uyarısı var."
    },
    {
     "no": "2",
     "metin": "Elektrik tesisatı kaçak akım rölesiyle korunuyor; priz ve anahtarlar su sıçramasına karşı korumalı (KL-11.07, KL-26.11)."
    },
    {
     "no": "3",
     "metin": "Temizlik kimyasalları kilitli dolapta ve etiketli."
    },
    {
     "no": "4",
     "metin": "Sabun, kâğıt havlu ve havalandırma yeterli."
    },
    {
     "no": "5",
     "metin": "Kabin kilitleri dışarıdan acil açılabiliyor; kapılar dışarı açılıyor (KL-11.11)."
    },
    {
     "no": "6",
     "metin": "En az bir kabin engelli kullanımına uygun (KL-11.09)."
    },
    {
     "no": "7",
     "metin": "Duman dedektörü var; teneffüste nöbet kontrolü yapılıyor."
    }
   ]
  },
  {
   "kod": "",
   "ad": "Öğretmen odaları ve şef odası (KL-19)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Koltuklar ayarlanabilir; ekranlar göz hizasında."
    },
    {
     "no": "2",
     "metin": "Su ısıtıcı ve çay makinesi ayrı sigortalı prize takılı; gün sonu fişler çekiliyor."
    },
    {
     "no": "3",
     "metin": "Dolaplar duvara sabit; ağır klasörler alt rafta."
    },
    {
     "no": "4",
     "metin": "Arşiv ısı kaynağından uzak; söndürücü yakında."
    }
   ]
  },
  {
   "kod": "",
   "ad": "Eğitim, belge ve organizasyon (tüm atölye ve alanlar)",
   "kaynak": "ic",
   "grup": "Elektrik-Elektronik hazır form",
   "maddeler": [
    {
     "no": "1",
     "metin": "Öğrenciler dönem başında İSG ve atölye kuralları eğitimini aldı, kayıt var (KL-26.16)."
    },
    {
     "no": "2",
     "metin": "Makine kullanım talimatları ve uyarı levhaları asılı (KL-35.09/35.12)."
    },
    {
     "no": "3",
     "metin": "Öğretmen yokken atölye kilitli; okul saatleri dışı kullanım kuralı belirli."
    },
    {
     "no": "4",
     "metin": "Kaza ve ramak kala olay kaydı tutuluyor; İSG kuruluna bildiriliyor."
    }
   ]
  },
  {
   "kod": "KL-01",
   "ad": "OKUL ORTAK KULLANIM ALANLARI GENEL KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "1.01",
     "metin": "Havalandırmaya ihtiyaç olan yerlerde pencereler açılabiliyor mu?"
    },
    {
     "no": "1.02",
     "metin": "Pencere açıldığında yaralanma ve düşme riski mevcutsa, açıklık 100 mm ile sınırlandırılmış mı?"
    },
    {
     "no": "1.03",
     "metin": "Güvenlik açısından cam kapılar, camlı bölümler vs. kırılmaya karşı değerlendirildi ve önlem alınmış mı?"
    },
    {
     "no": "1.04",
     "metin": "İhtiyaç noktalarında uygun çöp kovaları veya geri dönüşüm kutuları güvenli olarak yerleştirilmiş mi?"
    },
    {
     "no": "1.05",
     "metin": "Bariyerler, zincirler, pervazlar vs. takılıp düşmeyi engellemek için açıkça işaretlenmiş mi?"
    },
    {
     "no": "1.06",
     "metin": "Çatıya izinsiz çıkmaya karşı tedbir alınmış mı?"
    },
    {
     "no": "1.07",
     "metin": "Okul saatleri dışında alarm durumu için bir prosedür belirlenmiş mi?"
    },
    {
     "no": "1.08",
     "metin": "Ziyaretçilerin ve araçların giriş çıkışları ile ilgili prosedür belirlenmiş mi?"
    },
    {
     "no": "1.09",
     "metin": "Yer değişikliği olduğunda radyatör, sıcak su boruları göz önünde bulunduruluyor mu?"
    },
    {
     "no": "1.10",
     "metin": "İlan panoları hazırlanmış mı?"
    },
    {
     "no": "1.11",
     "metin": "Panolardaki duyurular güncel tutulmuş mu?"
    },
    {
     "no": "1.13",
     "metin": "İlkyardım dolapları hazırlanarak, hemen erişim sağlanabilecek yerlere yerleştirilmiş mi?"
    },
    {
     "no": "1.14",
     "metin": "İlkyardım dolaplarına yeterli malzemeler konulmuş mu?"
    },
    {
     "no": "1.15",
     "metin": "Koridorlar, geçiş yolları gibi insan trafiğinin yoğun olduğu yerlerde geçişi engelleyecek malzemelerden arındırılmış mı?"
    },
    {
     "no": "1.16",
     "metin": "Elektrik kabloları, bilgisayar kabloları gibi malzemelerin tehlike oluşturması (düşme vb) önlenmiş mi?"
    },
    {
     "no": "1.17",
     "metin": "Kayma ve düşmeye karşı zeminler uygun malzemelerden yapılmış mı?"
    },
    {
     "no": "1.18",
     "metin": "Elektrik kesintilerinde geçici olarak aydınlatma sağlayabilecek ekipman hazır durumda mı?"
    },
    {
     "no": "1.19",
     "metin": "Merdiven tırabzanları tam ve devamlı mı?"
    },
    {
     "no": "1.20",
     "metin": "Tırabzanlar standartlara uygun mu?"
    },
    {
     "no": "1.21",
     "metin": "Merdivenlerde basamaklar eşit genişlikte mi?"
    },
    {
     "no": "1.22",
     "metin": "Merdivenlerde rıhtlar eşit yükseklikte mi?"
    },
    {
     "no": "1.23",
     "metin": "Basamak geçişlerinde ve aralarda engel oluşturacak şekilde istiflenmiş malzemeler varsa kaldırılmış mı?"
    },
    {
     "no": "1.24",
     "metin": "Merdiven aralıklarında düşmelere karşı tedbir alınmış mı? (File, perde, korkuluk vb)"
    },
    {
     "no": "1.25",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "1.26",
     "metin": "Çalışan bayan sayısı 100 den fazla ise Emzirme Odası tahsis edilmiş mi?"
    },
    {
     "no": "1.27",
     "metin": "Aktif araçlar, bina hava girişlerinden yeterince uzakta mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-02",
   "ad": "ACİL PLAN KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "2.01",
     "metin": "Okulun yangın, sel, kundaklama, sivil kargaşa, araç kazası, davetsiz misafir vb. olağandışı durumlar için kapsamlı bir acil durum planı hazırlanmış mı?"
    },
    {
     "no": "2.02",
     "metin": "Acil Plan güncellenmiş ve test edilmiş mi?"
    },
    {
     "no": "2.03",
     "metin": "Acil durum tatbikatları zamanında ve gerektiği şekilde yapılmış mı?"
    },
    {
     "no": "2.04",
     "metin": "Acil çıkışları açıkça belli mi ve acil çıkış yazıları ışıklandırılmış mı?"
    },
    {
     "no": "2.05",
     "metin": "Acil çıkışlarında herhangi bir engel varsa kaldırılmış mı?"
    },
    {
     "no": "2.06",
     "metin": "Acil çıkışları her an açık bulundurulmakta mı?"
    },
    {
     "no": "2.07",
     "metin": "Acil çıkış kapısı dışarıya doğru mu, açılıyor.?"
    },
    {
     "no": "2.08",
     "metin": "Yerel Sivil Savunma ekipleriyle koordinasyon var mı?"
    },
    {
     "no": "2.09",
     "metin": "Personel Sağlık Raporları dosyalanmış mı?"
    },
    {
     "no": "2.10",
     "metin": "Personele periyodik olarak iş sağlığı ve güvenliği konularında eğitimler verilmiş mi?"
    },
    {
     "no": "2.11",
     "metin": "Birimlerde bulunan ilkyardım kutuları üzerinde açıklamaları var mı?"
    },
    {
     "no": "2.12",
     "metin": "İhtisas gerektiren işlerde çalışanların mesleki yeterlilik belgeleri var mı?"
    },
    {
     "no": "2.13",
     "metin": "Bütün birimlerdeki zeminlerde kayma veya düşmeye karşı tedbirler alınıp uyarılar yapılmış mı?"
    },
    {
     "no": "2.14",
     "metin": "Yönetmeliğe uygun sığınak hazırlanmış mı?"
    },
    {
     "no": "2.15",
     "metin": "Bütün birimlerdeki araç ve gereçlerin kullanma talimatı görülebilir yere yerleştirilmiş mi?"
    },
    {
     "no": "2.16",
     "metin": "Bütün birimlerde bulunan ısıtma ve soğutma cihazları için gereken emniyet tedbirleri alınmış mı?"
    },
    {
     "no": "2.17",
     "metin": "Binadaki paratonerin yıllık bakımı yapılmış mı?"
    },
    {
     "no": "2.18",
     "metin": "Binada bulunan kolay yanabilen malzemeler emniyetli bir yerde ve tedbir alınmış mı?"
    },
    {
     "no": "2.19",
     "metin": "Kurumda çalışanlar yaptıkları işlere göre KKD ı kullanıyor mu?"
    },
    {
     "no": "2.20",
     "metin": "Varsa asansörün periyodik olarak bakımı yönetmeliklere uygun yapılmış mı?"
    },
    {
     "no": "2.21",
     "metin": "Binanın gaz kullanılan bölümlerinde gaz dedektörü takılmış mı?"
    },
    {
     "no": "2.22",
     "metin": "Binada duman olması muhtemel bölümde duman dedektörü takılmış mı?"
    },
    {
     "no": "2.23",
     "metin": "Elektrik tesisatının periyodik bakım yapılmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-03",
   "ad": "OKUL BAHCELERİ KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "3.01",
     "metin": "Okul Bahçesi her türlü kademeli kısımlardan arındırılmış mı?"
    },
    {
     "no": "3.02",
     "metin": "Okul Bahçesi değişik amaçlı sivri materyalden temizlenmiş mi?"
    },
    {
     "no": "3.03",
     "metin": "Rüzgârlı hava ortamlarında hareketlenebilecek cisimler sabitlenmiş mi?"
    },
    {
     "no": "3.04",
     "metin": "Araç Park yerleri ile öğrenciler arasında emniyetli mesafe var mı?"
    },
    {
     "no": "3.05",
     "metin": "Okul bahçesinde bulunan rögar, fosseptik, telefon, su, kanalizasyon, kuyu, tesisat geçit yerlerindeki muhafazalar emniyetli mi? (Tercihen kilitli mi?)"
    },
    {
     "no": "3.06",
     "metin": "Okul bahçesinden çıkışlar direk güvenli alanlara mı yapılıyor?"
    },
    {
     "no": "3.07",
     "metin": "Ağaç döküntülerinin veya diğer kuruyabilen organik atıkların tutuşabilecekleri ortam var mı?"
    },
    {
     "no": "3.08",
     "metin": "Özellikle kış mevsimlerinde donmuş sarkıtlar için önlem alınmış mı?"
    },
    {
     "no": "3.09",
     "metin": "Açık oyun alanlarında oynayanlar için bireysel önlemler alınmış mı?"
    },
    {
     "no": "3.10",
     "metin": "Açık oyun alanlarında çarpmalara ve yaralanmalara maruz kalınmaması için önlem alınmış mı?"
    },
    {
     "no": "3.11",
     "metin": "Pencere altlarında yukarıdan kontrolsüz olarak düşebilecek cisimler için önlemler alınmış mı? (Pencere altları emniyetli mi?)"
    },
    {
     "no": "3.12",
     "metin": "Varsa inşaat işleri için gerekli önlemler alınmış mı?"
    },
    {
     "no": "3.13",
     "metin": "Okul bahçesinde bulunan direk v.b. çürümeye devrilmeye karşı emniyetli mi?"
    },
    {
     "no": "3.14",
     "metin": "Okul bahçesi ve girişleri kaygan zeminden arındırılmış mı?"
    },
    {
     "no": "3.15",
     "metin": "Okul bahçesi yeşil alanlar dışındaki kullanım alanları kauçuk malzeme ile mi kaplı?"
    },
    {
     "no": "3.16",
     "metin": "Okul bahçesi aydınlatması yeterli mi?"
    },
    {
     "no": "3.17",
     "metin": "Okul yönetimi belirli noktalardan okul bahçesini gözlemleyebiliyor mu?"
    },
    {
     "no": "3.18",
     "metin": "Otomatik hareket kabiliyeti olan kapılarda sensörlü durdurma sistemi mevcut mu?"
    },
    {
     "no": "3.19",
     "metin": "Bahçe ihata duvarı ve ekleri yıkılma, yırtma, kesme gibi riskleri taşıyor mu?"
    },
    {
     "no": "3.20",
     "metin": "Bahçe dışından okulu tehdit eden unsurlar için tedbirler alınmış mı?"
    },
    {
     "no": "3.21",
     "metin": "Belirlenen noktaların dışında okula girilebilecek yerler varsa tedbir alınmış mı?"
    },
    {
     "no": "3.22",
     "metin": "Yeşil alanlar böcek, haşere gibi olumsuzluklar için ilaçlanmış mı?"
    },
    {
     "no": "3.23",
     "metin": "Okul bahçesinde yapılan etkinliklerin diğerlerini etkilememesi için önlem alınmış mı?"
    },
    {
     "no": "3.24",
     "metin": "Okul bahçesindeki çöpler zamanında toplanıyor mu?"
    },
    {
     "no": "3.25",
     "metin": "Havuz varsa gerekli emniyet tedbirleri alınmış mı?"
    },
    {
     "no": "3.26",
     "metin": "Bahçede varsa elektrik bağlantıları için muhafaza yapılmış mı?"
    },
    {
     "no": "3.27",
     "metin": "Bahçeye gerekli uyarı işaretleri konulmuş mu?"
    },
    {
     "no": "3.28",
     "metin": "Bahçe kapısı devrilmelere karşı emniyetli mi?"
    },
    {
     "no": "3.29",
     "metin": "Bahçe kapısı büyüklüğü öğrencilerin tahliyesi için yeterli mi?"
    },
    {
     "no": "3.30",
     "metin": "Okul bahçesinde acil durumlar için ikinci bir kapı var mı?"
    },
    {
     "no": "3.31",
     "metin": "Okul bahçesinde yıldırım çekebilecek unsurlar için önlem alınmış mı? (Trafo gibi)"
    },
    {
     "no": "3.32",
     "metin": "Okul bahçesi öğrencilerin görülmesini engelleyecek kör noktalardan arındırılmış mı?"
    },
    {
     "no": "3.33",
     "metin": "Okul bahçesinde yayaların ve araçların ayrı ayrı kullandığı yollar güvenli mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-04",
   "ad": "KANTİN VE KAFETERYA KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "4.01",
     "metin": "Havalandırma ve baca her türlü kokuyu önleyecek şekilde mi?"
    },
    {
     "no": "4.02",
     "metin": "Çalışan personel için tüberküloz, portör muayenesi yapıldı mı?"
    },
    {
     "no": "4.03",
     "metin": "İlkyardım dolabı var mı?"
    },
    {
     "no": "4.04",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "4.05",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    },
    {
     "no": "4.06",
     "metin": "Yangın için özel önlemler alınmış mı?"
    },
    {
     "no": "4.07",
     "metin": "Zemin kaymaya, düşmeye karşı uygun malzemelerden yapılmış mı?"
    },
    {
     "no": "4.08",
     "metin": "Çalışan personel için soyunma dolabı var mı?"
    },
    {
     "no": "4.09",
     "metin": "Çalışan personel temizlik kurallarına ( Tırnakların kısa kesilmiş ve iş kıyafetlerinin temiz olması) uyuyor mu?"
    },
    {
     "no": "4.10",
     "metin": "Satışa sunulan gıda maddelerinin ilgili mevzuat uyarınca Gıda, Tarım ve Hayvancılık Bakanlığından Üretim/İthalat izinleri var mı?"
    },
    {
     "no": "4.11",
     "metin": "WC’ler gıda üretim, satış ve tüketim yapılan yerlerden uygun uzaklıkta mı?"
    },
    {
     "no": "4.12",
     "metin": "Ortamın ısınması ve aydınlatılması yeterli mi?"
    },
    {
     "no": "4.13",
     "metin": "Çöp ve her türlü atığın konulacağı kap yeterli sayıda, büyüklükte ve ağzı kapalı mı?"
    },
    {
     "no": "4.14",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "4.15",
     "metin": "Çalışan personelin hijyen belgesi var mı?"
    },
    {
     "no": "4.16",
     "metin": "Çalışanlardan en az birinin ilkyardımcı belgesi var mı?"
    },
    {
     "no": "4.17",
     "metin": "Kantin ya da kafeterya işletmesi İSG hizmeti alıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-05",
   "ad": "GENEL TEMİZLİK KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "5.01",
     "metin": "Okulda temizlik yapılırken gerekli uyarı levhaları asılıyor mu?"
    },
    {
     "no": "5.02",
     "metin": "WC’lerde hijyen sağlanmış mı?"
    },
    {
     "no": "5.03",
     "metin": "Temizlik malzemeleri sağlığa uygun mu?"
    },
    {
     "no": "5.04",
     "metin": "Okul personeli tarafından düzenli bir şekilde temizlik yapılıyor mu?"
    },
    {
     "no": "5.05",
     "metin": "Zemin kaymaya, düşmeye karşı uygun malzemeden yapılmış mı?"
    },
    {
     "no": "5.06",
     "metin": "Okulda elle temasın bulunduğu sıralar, kapı kolları, dolap, masa gibi yüzeyler su ve sabun ile periyodik temizliği yapılıyor mu?"
    },
    {
     "no": "5.07",
     "metin": "Okulda çöp kovaları temiz ve muhafazalı mı?"
    },
    {
     "no": "5.08",
     "metin": "Öğrencilere yapılan temizlik ile ilgili uyarılar yeterli mi?"
    },
    {
     "no": "5.09",
     "metin": "Okullarda bulunan hizmetlinin telefon numarası panoda asılmış mı?"
    },
    {
     "no": "5.10",
     "metin": "Hijyen Eğitimi Yönetmeliğinde belirlenen iş kollarında bulunanların aynı yönetmeliğe göre eğitim almaları sağlanmış mı?"
    },
    {
     "no": "5.11",
     "metin": "Kontrol kartları var mı? Düzenli takip ediliyor mu?"
    },
    {
     "no": "5.12",
     "metin": "Temizlik işlerinde kullanılan malzemeler CAS (Kimyasal Kurumlar Servisi tarafından verilen numara) numarası ile etiketlenmiş mi?"
    },
    {
     "no": "5.13",
     "metin": "Temizlik çalışanları kişisel koruyucu donanım kullanıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-06",
   "ad": "SINIFLAR (… NOLU SINIF ) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "6.01",
     "metin": "Zemin kaymaya, düşmeye karşı uygun malzemeden yapılmış mı?"
    },
    {
     "no": "6.02",
     "metin": "Aydınlatma ve ısıtma sistemi yeterli mi?"
    },
    {
     "no": "6.03",
     "metin": "Öğrencilerin oturma planı asılmış mı?"
    },
    {
     "no": "6.04",
     "metin": "Acil durum alarmı ve acil çıkış levhaları asılmış mı?"
    },
    {
     "no": "6.05",
     "metin": "Elektrik prizleri korumalı mı?"
    },
    {
     "no": "6.06",
     "metin": "TV, bilgisayar ve projeksiyon gibi elektrikli cihazlar için güvenlik önlemleri alınmış mı?"
    },
    {
     "no": "6.07",
     "metin": "Çöp kovası yeterli büyüklükte ve ağzı kapalı mı?"
    },
    {
     "no": "6.08",
     "metin": "Duyuru panosu asılı mı?"
    },
    {
     "no": "6.09",
     "metin": "Havalandırma yeterli mi?"
    },
    {
     "no": "6.10",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "6.11",
     "metin": "Sınıf kapıları acil çıkışlar için uygun mu?"
    },
    {
     "no": "6.12",
     "metin": "Sınıflarda öğrencilere zarar verebilecek (Kolon köşeleri, radyatör, metal direkler vb.) nesneler darbe emici izolasyon malzemeleri ile kaplanmış mı?"
    },
    {
     "no": "6.13",
     "metin": "Pencereler açıldığında yaralanma ve düşme tehlikesi mevcutsa açıklık 100 mm ile sınırlandırılmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-07",
   "ad": "KORİDORLAR (…KAT KORİDORU ) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "7.01",
     "metin": "Zemin kaymaya veya düşmeye karşı uygun malzemeden yapılmış mı?"
    },
    {
     "no": "7.02",
     "metin": "Aydınlatma ve ısıtma sistemi yeterli mi?"
    },
    {
     "no": "7.03",
     "metin": "Duyuru panoları asılmış mı?"
    },
    {
     "no": "7.04",
     "metin": "Acil durum alarmı var mı?"
    },
    {
     "no": "7.05",
     "metin": "Acil çıkış levhaları asılmış mı?"
    },
    {
     "no": "7.06",
     "metin": "Koridorlarda yangın için özel önlemler alınmış mı?"
    },
    {
     "no": "7.07",
     "metin": "Uyarı levhaları asılmış mı?"
    },
    {
     "no": "7.08",
     "metin": "Koridorlarının hijyenine özen gösterilmiş mi?"
    },
    {
     "no": "7.09",
     "metin": "Koridorlardaki çöp kovalarının ağzı kapalı mı?"
    },
    {
     "no": "7.10",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "7.11",
     "metin": "Dışa açılan kapılar için uyarılar var mı?"
    },
    {
     "no": "7.12",
     "metin": "Koridorda öğrencilere zarar verebilecek (Kolon köşeleri, radyatör, metal direkler vb.) nesneler darbe emici izolasyon malzemeleri ile kaplanmış mı?"
    },
    {
     "no": "7.13",
     "metin": "Koridorda kontrolsüz düşmeye neden olabilecek girinti, çıkıntı v.b. var mı?"
    },
    {
     "no": "7.14",
     "metin": "Ağ ve elektrik kablolarının taşındığı sistem gerekli yükseklikte mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-08",
   "ad": "TOPLANTI SALONU KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "8.01",
     "metin": "Aydınlatma kumanda panosundaki açma kapama anahtarları ve şalterler çalışır durumda mı?"
    },
    {
     "no": "8.01",
     "metin": "Uzatma kablosu kullanımını gerektirmeyecek kadar sabit tesisat var mı?"
    },
    {
     "no": "8.01",
     "metin": "Tüm elektrik anahtarları ve prizleri düzgün çalışıyor mu?"
    },
    {
     "no": "8.01",
     "metin": "Yeterli sayıda elektrik prizi var mı ve görsel-işitsel cihazların kullanımı için uygun yerlerde mi?"
    },
    {
     "no": "8.01",
     "metin": "Toplantı salonunda havalandırma sistemi yeterli mi?"
    },
    {
     "no": "8.01",
     "metin": "Zemin, kaymaya ve düşmeye karşı uygun malzemeden yapılmış mı?"
    },
    {
     "no": "8.01",
     "metin": "Aydınlatma sistemi yeterli mi?"
    },
    {
     "no": "8.01",
     "metin": "Isıtma sistemi yeterli mi?"
    },
    {
     "no": "8.01",
     "metin": "Acil durum alarmı var mı?"
    },
    {
     "no": "8.01",
     "metin": "Mevzuata uygun olarak acil çıkış kapısı var mı?"
    },
    {
     "no": "8.01",
     "metin": "Acil çıkış yönlendirme levhaları asılmış mı?"
    },
    {
     "no": "8.01",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-09",
   "ad": "MÜZİK ODASI KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "9.01",
     "metin": "Yeterli aydınlatma sağlanmış mı?"
    },
    {
     "no": "9.02",
     "metin": "Isıtma, havalandırma ve iklimlendirme şartları yeterli mi?"
    },
    {
     "no": "9.03",
     "metin": "Ses izolasyonu standartlara uygun olarak yapılmış mı?"
    },
    {
     "no": "9.04",
     "metin": "Odadaki akustik uygulaması yeterli mi ve duvara veya duvarlara monte edilmiş mi?"
    },
    {
     "no": "9.05",
     "metin": "Zeminde kayma ve düşmeleri engelleyecek döşeme sistemi mevcut mu?"
    },
    {
     "no": "9.06",
     "metin": "Oda kapısı çift kanatlı ve izolasyonlu mu?"
    },
    {
     "no": "9.07",
     "metin": "Odada oturma ve çalışma ergonomisi gözetilmiş mi?"
    },
    {
     "no": "9.08",
     "metin": "Elektronik müzik aletleri için gerekli elektrik tesisatı ve bunlara uygun standart elektrik panoları mevcut mu?"
    },
    {
     "no": "9.09",
     "metin": "Aletler güvenliği etkilemeyecek şekilde muhafaza ediliyor mu?"
    },
    {
     "no": "9.10",
     "metin": "Acil durumlar için acil çıkış yön levhaları var mı?"
    },
    {
     "no": "9.11",
     "metin": "Yangın tesisatı ve gerekli alarm sistemi var mı?"
    },
    {
     "no": "9.12",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-10",
   "ad": "SANAT ODASI KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "10.01",
     "metin": "Yeterli aydınlatma sağlanmış mı?"
    },
    {
     "no": "10.02",
     "metin": "Isıtma, havalandırma ve iklimlendirme şartları yeterli mi?"
    },
    {
     "no": "10.03",
     "metin": "Odada oturma ve çalışma ergonomisi var mı?"
    },
    {
     "no": "10.04",
     "metin": "Zeminde kayma ve düşmeleri engelleyecek döşeme sistemi mevcut mu?"
    },
    {
     "no": "10.05",
     "metin": "Gerekli elektrik tesisatı ve bunlara uygun standart elektrik panoları mevcut mu?"
    },
    {
     "no": "10.06",
     "metin": "Elektrik tesisatına kaçak akım rölesi konulmuş mu?"
    },
    {
     "no": "10.07",
     "metin": "Kimyasal malzemeler kullanılan kısımlarda kimyasallar kontrol altında mı?"
    },
    {
     "no": "10.08",
     "metin": "Kimyasal sızıntılar için gerekli önlemler alınmış mı?"
    },
    {
     "no": "10.09",
     "metin": "Kimyasallar kullanılırken KKD' ler kullanılması için gerekli uyarılar asılmış mı?"
    },
    {
     "no": "10.10",
     "metin": "Yangın tesisatı ve gerekli alarm sistemi var mı?"
    },
    {
     "no": "10.11",
     "metin": "Acil durumlar için acil çıkış yön levhaları var mı?"
    },
    {
     "no": "10.12",
     "metin": "Fırınlar düzgün biçimde havalandırılıyor ve izole edilmiş mi?"
    },
    {
     "no": "10.13",
     "metin": "Makas gibi keskin veya sivri uçlu objelerin muhafaza edildiği kutu benzeri belli bir yeri var mı?"
    },
    {
     "no": "10.14",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-11",
   "ad": "ISLAK HACİMLER ( WC VE DUŞLAR ) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "11.01",
     "metin": "Yeterli aydınlatma sağlanmış mı?"
    },
    {
     "no": "11.02",
     "metin": "Isıtma, havalandırma ve iklimlendirme şartları yeterli mi?"
    },
    {
     "no": "11.03",
     "metin": "Saç ve el kurutucusu, elektrikli ısıtıcısı gibi elektrikli aletlerin kullanım talimatı uygun yerlere asılmış mı?"
    },
    {
     "no": "11.04",
     "metin": "Zeminlerde kaymaya engel olmak için gerekli tedbir alınmış mı?"
    },
    {
     "no": "11.05",
     "metin": "Duş içinde herhangi bir düşme sırasında tutunabilecek sağlam bir tutunma aparatı takılmış mı?"
    },
    {
     "no": "11.06",
     "metin": "Islak hacim kapıları, herhangi bir düşme sırasında, tehlike yaratmaması için uygun bir malzemeden yapılmış mı?"
    },
    {
     "no": "11.07",
     "metin": "Islak zeminden dolayı, elektrik tesisatı ile ilgili kaçak akım rölesi vs. gibi önlemler alınmış mı?"
    },
    {
     "no": "11.08",
     "metin": "Islak hacimlerde temizlik kurallarına uyuluyor mu?"
    },
    {
     "no": "11.09",
     "metin": "Islak hacimler engellilerin kullanımına uygun olarak tasarlanmış mı?"
    },
    {
     "no": "11.10",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "11.11",
     "metin": "Islak hacimlerde kapılar dışarı açılıyor mu?"
    },
    {
     "no": "11.12",
     "metin": "Kontrol kartları düzenli takip ediliyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-12",
   "ad": "SPOR SALONLARI (…SAHASI ) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "12.01",
     "metin": "Yeterli aydınlatma sağlanmış mı?"
    },
    {
     "no": "12.02",
     "metin": "Isıtma, havalandırma ve iklimlendirme şartları yeterli mi?"
    },
    {
     "no": "12.03",
     "metin": "Zemin döşeme malzemesi standartlara uygun mu?"
    },
    {
     "no": "12.04",
     "metin": "Seyirci koltuklarında gerekli ergonomi sağlanmış mı?"
    },
    {
     "no": "12.05",
     "metin": "Seyirci koltukları arasında standart ölçülerde boşluk bırakılmış mı?"
    },
    {
     "no": "12.06",
     "metin": "Yangın tesisatı ve gerekli alarm sistemi var mı?"
    },
    {
     "no": "12.07",
     "metin": "Acil çıkış kapıları yeterli sayıda ve mevzuata uygun mu?"
    },
    {
     "no": "12.08",
     "metin": "Acil çıkış yön levhaları var mı?"
    },
    {
     "no": "12.09",
     "metin": "Spor salonlarında sporculara zarar verebilecek (Kolon köşeleri, radyatör, metal direkler vb.) nesneler darbe emici izolasyon malzemeleri ile kaplanmış mı?"
    },
    {
     "no": "12.10",
     "metin": "İlkyardım dolabı var mı?"
    },
    {
     "no": "12.11",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "12.12",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    },
    {
     "no": "12.13",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-13",
   "ad": "YÜZME HAVUZU KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "13.01",
     "metin": "Islak yerlerdeki elektrik tesisatı kaçak akım rölesi ile korunuyor mu?"
    },
    {
     "no": "13.02",
     "metin": "Havuzun kullanımda olmadığı zamanlarda koruması var mı?"
    },
    {
     "no": "13.03",
     "metin": "Uyarı ve havuz kullanım kuralları görünür yerde mi?"
    },
    {
     "no": "13.04",
     "metin": "Havuz merdivenleri ve tırabzanlar uygun ve güvenli malzemeden yapılmış mı?"
    },
    {
     "no": "13.05",
     "metin": "Havuz kullanımı sırasında güvenliği sağlayacak bir personel görevlendirilmiş mi?"
    },
    {
     "no": "13.06",
     "metin": "Havuzda kullanılan kimyasallar standartlara uygun mu?"
    },
    {
     "no": "13.07",
     "metin": "Havuz etrafı kaymaz malzeme ile donatılmış mı?"
    },
    {
     "no": "13.08",
     "metin": "Havuz derinliği görünür bir şekilde işaretlenmiş mi?"
    },
    {
     "no": "13.09",
     "metin": "İlkyardım dolabı var mı?"
    },
    {
     "no": "13.10",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "13.11",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-14",
   "ad": "KAZAN DAİRELERİ (…) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "14.01",
     "metin": "Kazan dairesi işletme talimatı görünür bir yere asılmış mı?"
    },
    {
     "no": "14.02",
     "metin": "Kazan dairesi içerisinde bulunan kazan, boyler, kapalı genleşme deposu vb. gibi kapalı kaplar üzerinde kapasite, çalışma basıncı, test basıncı, imalat tarihi vb. bilgilerin olduğu etiket var mı?"
    },
    {
     "no": "14.03",
     "metin": "Boru hatları, pompa ve vanalar üzerine isimleri yazılmış mı?"
    },
    {
     "no": "14.04",
     "metin": "Aydınlatma yeterli mi?"
    },
    {
     "no": "14.05",
     "metin": "Havalandırma yeterli mi?"
    },
    {
     "no": "14.06",
     "metin": "Temiz hava girişi tarafında yanıcı, patlayıcı gaz girişi önlenmiş mi ?"
    },
    {
     "no": "14.07",
     "metin": "Sorumlu haricindeki kişilerin girmesini engelleyici tedbirler alınıyor mu?"
    },
    {
     "no": "14.08",
     "metin": "Periyodik bakım onarım kartı düzenlenmiş mi?"
    },
    {
     "no": "14.09",
     "metin": "Periyodik bakımları yapılıyor mu?"
    },
    {
     "no": "14.10",
     "metin": "Duman kanalları ve baca çekişi kontrol ediliyor mu ?"
    },
    {
     "no": "14.11",
     "metin": "Yangın algılama ve bildirme tesisatı yapılmış mı?"
    },
    {
     "no": "14.12",
     "metin": "Yangın söndürme tüpü var mı?"
    },
    {
     "no": "14.13",
     "metin": "Sıvı yakıtlı ve doğalgazlı sistemlerde yangın, deprem ve statik elektrik ile ilgili güvenlik sistemleri var mı?"
    },
    {
     "no": "14.14",
     "metin": "Kazan dairesi içerisinde gereksiz malzemeler var mı?"
    },
    {
     "no": "14.15",
     "metin": "Elektrik panoları, aydınlatma ve diğer kablo tesisatları exproof malzemelerden yapılmış mı?"
    },
    {
     "no": "14.16",
     "metin": "Kazanlar yakılmadan önce, kazan görevlisi tarafından tüm vanaların, klapelerin, kapakların, emniyet durumu, yakıt ve su miktarları ve işletme ile ilgili bütün hususlar kontrol ediliyor mu?"
    },
    {
     "no": "14.17",
     "metin": "Zemin temizliğine dikkat ediliyor mu?"
    },
    {
     "no": "14.18",
     "metin": "Sıvı yakıtlı kazan dairelerinde yakıt tankları ve yakıt tesisatlarından kaynaklanan kaçaklar var mı?"
    },
    {
     "no": "14.19",
     "metin": "Boru tesisatları, açma kapama elemanları içinden geçen akışkan cinsine ve standartlara göre boyanarak etiketlenmiş mi?"
    },
    {
     "no": "14.20",
     "metin": "Açıktan giden tesisatlar da donmaya karşı tedbir alınmış mı?"
    },
    {
     "no": "14.21",
     "metin": "İlkyardım dolabı var mı?"
    },
    {
     "no": "14.22",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "14.23",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    },
    {
     "no": "14.24",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "14.25",
     "metin": "Kazan Dairesinde Gaz ve Duman Dedektörü var mı?"
    },
    {
     "no": "14.26",
     "metin": "Kazan dairesinden sorumlu olan çalışanların gerekli mesleki eğitim belgeleri var mı?"
    },
    {
     "no": "14.27",
     "metin": "Kazan dairesi ile kömür depoları farklı odalarda mı?"
    },
    {
     "no": "14.28",
     "metin": "Çalışanlar kişisel koruyucu donanım kullanıyor mu?"
    },
    {
     "no": "14.29",
     "metin": "Çalışanlar iş sağlığı ve güvenliği eğitimleri almış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-15",
   "ad": "OKUL DIŞI AKTİVİTELER (…) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "15.01",
     "metin": "Okul dışında gerçekleştirilen faaliyetlerde ortaya çıkabilecek riskler ve güvenlik tedbirleri konusunda öğrencilere bilgi veriliyor mu?"
    },
    {
     "no": "15.02",
     "metin": "Okul dışı aktivitelerde kullanılan ulaşım aracı mevzuatlara uygun mu?"
    },
    {
     "no": "15.03",
     "metin": "Ulaşım sırasında ve okul dışında yürütülecek faaliyetlerde tüm öğrenciler ve personel sigorta kapsamında mı?"
    },
    {
     "no": "15.04",
     "metin": "Okul dışı faaliyetlerden önce ön inceleme yapılıyor mu?"
    },
    {
     "no": "15.05",
     "metin": "Okul dışı faaliyete katılacaklar için muvafakat belgeleri var mı?"
    },
    {
     "no": "15.06",
     "metin": "Okul dışı faaliyet planlamasında MEB Sosyal etkinlikler yönetmeliği maddeleri dikkate alınmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-16",
   "ad": "OKUL ARAÇLARI VE SERVİSLER KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "16.01",
     "metin": "Servis araçları ve araç kullanıcıları yasal mevzuatlara uygun mu?"
    },
    {
     "no": "16.02",
     "metin": "Araçların okul içindeki güzergâhları ve güvenlik kuralları belirlenmiş mi?"
    },
    {
     "no": "16.03",
     "metin": "Servis işletmesi ve/veya araç şoförleri ile öğrenciler okul güvenliği kriterlerini biliyor mu?"
    },
    {
     "no": "16.04",
     "metin": "Yağışlı havalarda araca biniş ve iniş merdivenlerinde kayma ve düşmeleri engellemek için önlem alınmış mı?"
    },
    {
     "no": "16.05",
     "metin": "Servis aracı sürücüleri ile öğrencilere okul güvenlik politikasına uygun olarak araçlara iniş ve binişler ile güvenli davranışlar konusunda bilgi veriliyor mu?"
    },
    {
     "no": "16.06",
     "metin": "Araçların içi kullanım öncesi havalandırılıyor mu?"
    },
    {
     "no": "16.07",
     "metin": "Servis araçlarında görevli çalışanların İş sağlığı ve güvenliği eğitimi almış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-17",
   "ad": "LABORATUVARLAR KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "17.01",
     "metin": "Laboratuvar masaları ve tabureleri ergonomik olarak hazırlanmış mı?"
    },
    {
     "no": "17.02",
     "metin": "Çalışma tezgâhı ve masa yüksekliği standartlara uygun mu?"
    },
    {
     "no": "17.03",
     "metin": "Laboratuvarda havalandırma ve baca tesisatları standartlara uygun mu?"
    },
    {
     "no": "17.04",
     "metin": "Çalışma ortamında yeterli aydınlatma sağlanmış mı?"
    },
    {
     "no": "17.05",
     "metin": "Tehlikeli maddeler koruma altına alınmış mı?"
    },
    {
     "no": "17.06",
     "metin": "Laboratuvarda yangın için özel önlem alınmış mı?"
    },
    {
     "no": "17.07",
     "metin": "Kimyasal sızıntılara karşı gerekli önlemler alınmış mı?"
    },
    {
     "no": "17.08",
     "metin": "Tehlikeli maddelerin muhafaza edildikleri yerlerde gerekli uyarı işaretleri var mı?"
    },
    {
     "no": "17.09",
     "metin": "Laboratuvar panosunda laboratuvar sorumlusuna ulaşabilecek telefonlar var mı?"
    },
    {
     "no": "17.10",
     "metin": "Laboratuvar elektrik panolarında gerekli önlemler alınmış mı?"
    },
    {
     "no": "17.11",
     "metin": "Laboratuvardaki gaz, elektrik, sıhhi tesisat ve pis su tesisatları standartlara uygun mu?"
    },
    {
     "no": "17.12",
     "metin": "Laboratuvarda ilk yardım dolabı var mı?"
    },
    {
     "no": "17.13",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "17.14",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    },
    {
     "no": "17.15",
     "metin": "Acil durum alarmı ve çıkış levhası var mı?"
    },
    {
     "no": "17.16",
     "metin": "Laboratuvar zemini kaymaya, düşmeye karşı uygun malzemelerden yapılmış mı?"
    },
    {
     "no": "17.17",
     "metin": "Laboratuvarda uyarı levhaları asılmış mı?"
    },
    {
     "no": "17.18",
     "metin": "Deney güvenliği için limitler biliniyor ve dikkat ediliyor mu? (Isı, basınç, elektrik, devir/dakika, diğer)"
    },
    {
     "no": "17.19",
     "metin": "Deney veya test düzeneği deneyden önce kontrol ediliyor mu?"
    },
    {
     "no": "17.20",
     "metin": "Deney düzeneğini başlangıç noktasına getirirken nelere dikkat edilmesi gerekiyor, biliniyor mu?"
    },
    {
     "no": "17.21",
     "metin": "Tehlikeli malzemeler ve atıkların ne şekilde uzaklaştırılacağı biliniyor mu?"
    },
    {
     "no": "17.22",
     "metin": "Deney yapılırken olası hava, buhar, elektrik veya vakum vb. kesintisine karşı güvenlik tedbirleri alınıyor mu?"
    },
    {
     "no": "17.23",
     "metin": "Yangın söndürücü uygun mu ya da başka söndürücüye ihtiyaç var mı?"
    },
    {
     "no": "17.24",
     "metin": "Tavan yüksekliği 2m.'den az mı veya 2m.'den az olan kısımlar bulunuyorsa bunlar işaretlenmiş mi?"
    },
    {
     "no": "17.25",
     "metin": "Tüm konteyner veya laboratuvar kaplarının üzerinde içerik, tarih, sorumlu kişi bilgileri var mı?"
    },
    {
     "no": "17.26",
     "metin": "Siper veya maske gibi teması engellemeye ve cihazları korumaya yönelik araçlar kullanılıyor mu?"
    },
    {
     "no": "17.27",
     "metin": "Etiketler ve işaretlerin yeri ve büyüklüğü standartlara uygun mu?"
    },
    {
     "no": "17.28",
     "metin": "Deneyler sırasında kıyafet veya takılar dikkate alınıyor mu?"
    },
    {
     "no": "17.29",
     "metin": "Toz ve partiküller limit değer altında mı? (toksik değilse limit 10 mg/cm)"
    },
    {
     "no": "17.30",
     "metin": "Öğrencilerin tehlikeli buhar ve gazlara maruz kalmaması için gerekli tedbirler alınıyor mu?"
    },
    {
     "no": "17.31",
     "metin": "Sıçrama ve dökülme durumu için çalışılan malzeme cinslerine göre tedbirler alınıyor mu?"
    },
    {
     "no": "17.32",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-18",
   "ad": "ERGONOMİ - BEDENSEL İŞLER KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "18.01",
     "metin": "Malzemelerin taşınması için yeterli ekipman veya araç (mekanik aletler veya kutu, kap vs.) mevcut mu?"
    },
    {
     "no": "18.02",
     "metin": "Çalışma sırasında bedeni zorlayıcı pozisyonlar (eğilme, çömelme, dönme, diz çökme vs.) için tedbir alınmış mı?"
    },
    {
     "no": "18.03",
     "metin": "Oturularak yapılan çalışmalarda çalışma yüksekliği uygun mu?"
    },
    {
     "no": "18.04",
     "metin": "Oturma pozisyonları ergonomik olarak tasarlanmış mı?"
    },
    {
     "no": "18.05",
     "metin": "Çalışma alanı/boşluğu uygun mu?"
    },
    {
     "no": "18.06",
     "metin": "Ağır malzemeler, bel sorunlarına yol açmaması için bel ile diz arasında bir hizada teçhiz edilmiş olan raflarda mı?"
    },
    {
     "no": "18.07",
     "metin": "Yüksek noktalara erişim için ayaklı merdiven mevcut mu?"
    },
    {
     "no": "18.08",
     "metin": "Ağır yüklerin taşınması, mümkün olduğunda parçalar halinde veya küçük iş paketleri haline getirilerek taşınıyor mu?"
    },
    {
     "no": "18.09",
     "metin": "Taşıma aracının varsa tutma kolları yükün cinsine ve ağırlığına uygun mu?"
    },
    {
     "no": "18.10",
     "metin": "Elle taşıma yapılan mesafeler yakın mı?"
    },
    {
     "no": "18.11",
     "metin": "Ağır malzemelerin taşınacağı platformda engebe veya merdiven var mı?"
    },
    {
     "no": "18.12",
     "metin": "Malzemelerin taşınması konusunda dikkat edilmesi gereken hususlar hakkında kişiler bilgi sahibi mi?"
    },
    {
     "no": "18.13",
     "metin": "Malzemelerin taşınmasında eğilme veya dönme gerektiren pozisyonlar elimine ediliyor mu?"
    },
    {
     "no": "18.14",
     "metin": "Malzemeleri tutmak ve taşımak için gerekli aparatlardan/araçlardan faydalanılıyor mu?"
    },
    {
     "no": "18.15",
     "metin": "El ile taşımayı en aza indirmek için raflar çalışma tezgahlarına yakın tasarlanmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-19",
   "ad": "ERGONOMİ - BÜRO İŞLERİ KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "19.01",
     "metin": "Oturularak yapılan çalışmalarda çalışma yüksekliği uygun mu?"
    },
    {
     "no": "19.02",
     "metin": "Çalışma alanı/boşluğu uygun mu?"
    },
    {
     "no": "19.03",
     "metin": "Ekranlı araçlar yükseklik, mesafe, parlaklık olarak rahat çalışmaya imkân verecek uygunlukta mı?"
    },
    {
     "no": "19.04",
     "metin": "Çalışma pozisyonu yeterli sıklıkta değişim gösteriyor mu? (ayağa kalkma/oturma/ etrafta dolaşma)"
    },
    {
     "no": "19.05",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "19.06",
     "metin": "Çalışma ortamının gereksiz yere daralmasını önlemek amacıyla tedbir alınmış mı?"
    },
    {
     "no": "19.07",
     "metin": "Çalışma ortamı yakıcı, tutuşturucu, parlayıcı, patlayıcı v.b. Malzemelerden arındırılmış mı?"
    },
    {
     "no": "19.08",
     "metin": "Klavye ve farenin ön tarafında bileklerin dayanabileceği özel destek var mı?"
    },
    {
     "no": "19.09",
     "metin": "Ekranlı araçların kabloları askıda ve korunaklı mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-20",
   "ad": "AYDINLATMA (…KAT ) KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "20.01",
     "metin": "Toz, talaş vs. birikmesi sonucunda aydınlatma armatürlerinden ve pencere camlarından gelen gün ışığı azalmasının önüne geçiliyor mu?"
    },
    {
     "no": "20.02",
     "metin": "Koridorlar, antre, geçiş yolları gibi karanlıkta kalan yerler var mı?"
    },
    {
     "no": "20.03",
     "metin": "Çalışma yürütülen mekânlarda, aydınlatma, çalışmanın sağlıklı yürütülmesine uygun mu?"
    },
    {
     "no": "20.04",
     "metin": "Genel aydınlatma yeterli mi?"
    },
    {
     "no": "20.05",
     "metin": "Gereken yerlerde veya noktalarda lokal aydınlatma var mı?"
    },
    {
     "no": "20.06",
     "metin": "Floresan lambalar tezgâhlara, sıralara paralel mi?"
    },
    {
     "no": "20.07",
     "metin": "Kişilerin aydınlatma ile şikâyetçi oldukları alanlar mevcut mu?"
    },
    {
     "no": "20.08",
     "metin": "Görüş alanında göz yorgunluğuna neden olabilecek ya da gözün sürekli olarak yeniden uyum sağlamasını engelleyecek aşırı kontrastlar önleniyor mu?"
    },
    {
     "no": "20.09",
     "metin": "Çalışma alanında yapılan işle ilgili görüşü değiştirebilecek yansımaları önleyici tedbirler alınıyor mu?(cilalı ya da parlak yüzeylerden doğrudan yansımalar)"
    },
    {
     "no": "20.10",
     "metin": "Çalışma ortamındaki nesne ve insanların derilerinin/ciltlerinin renkleri mevcut suni aydınlatma nedeniyle olduğundan farklı görünmesi önleniyor mu?"
    },
    {
     "no": "20.11",
     "metin": "Çalışanlar ikaz ışıklarının yanıp sönmesini fark edebiliyor mu?"
    },
    {
     "no": "20.12",
     "metin": "Mevcut suni aydınlatma altında, dönen makinaların hareketsizmiş gibi görünmesinin önüne geçiliyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-21",
   "ad": "TEHLİKELİ YÜZEYLERE SAHİP NESNE VE AKSAMLAR KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "21.01",
     "metin": "Okulda kullanılan Bıçaklar, kesiciler, biçiciler, makaslar gibi kesici uçlu veya yüzeyi keskin aletler yapılan iş için uygun mu?"
    },
    {
     "no": "21.02",
     "metin": "Kesicilerin bulunduruldukları muhafaza uygun mu?"
    },
    {
     "no": "21.03",
     "metin": "Körleşmiş araçlar kullanımdan kaldırılıyor mu?"
    },
    {
     "no": "21.04",
     "metin": "Kıymıklı, dikenli, tel gibi sivri, batıcı uçlu nesneler için uygun KKD kullanılıyor mu?"
    },
    {
     "no": "21.05",
     "metin": "Mil, çengel gibi sivri keskin uçları bulunan nesnelerin uçları mümkün olduğunda yuvarlatılıyor, körleştiriliyor mu?"
    },
    {
     "no": "21.06",
     "metin": "Raflar, çekmeceler, tezgâhlar kesici kenar ve köşeler için, tahrip edici özelliklerini azaltmaya yönelik bir önlem alınmış mı?"
    },
    {
     "no": "21.07",
     "metin": "Seramik, porselen, cam, ayna, cam kapı, cam duvar gibi nesneler tehlike yaratıyor mu?"
    },
    {
     "no": "21.08",
     "metin": "Baş hizasındaki yüksekliklerde çarpma noktaları için önlem alınmış mı?"
    },
    {
     "no": "21.09",
     "metin": "Şaft, merdane gibi kesici ve keskin yüzeyleri bulunan makine ve ekipman, kullanımda olmadıkları zaman muhafaza ediliyor mu?"
    },
    {
     "no": "21.10",
     "metin": "Çember burma presi veya yapıştırma tabancası gibi sıcak yüzeylerle temas engelleniyor mu?"
    },
    {
     "no": "21.11",
     "metin": "Konteynır, tekne, küvet vs. kenar ve köşeleri körleştirilmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-22",
   "ad": "KONTROLSÜZ HAREKETE GEÇEBİLECEK NESNELER KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "22.01",
     "metin": "Varsa raflar ve iskeleler dengede mi?"
    },
    {
     "no": "22.02",
     "metin": "Baca, raf, iskele, merdivenlerde emniyeti tehdit eden unsurlar ortadan kaldırılmış mı?"
    },
    {
     "no": "22.03",
     "metin": "Stoklanmış malzemeler, yığıntılar, aletler, hortum veya elde taşınan objeler, aletler gibi boşalma, düşme veya kontrolsüz harekete geçmeye meyilli nesneler emniyete alınmış mı?"
    },
    {
     "no": "22.04",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-23",
   "ad": "SOĞUK/SICAK MADDE VEYA ARAÇLARLA TEMAS KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "23.01",
     "metin": "Dondurulmuş ürünler, Süt, su gibi madde ve nesnelerin dış ortam ile teması önleniyor mu?"
    },
    {
     "no": "23.02",
     "metin": "Çok sıcak sıvılar, buhar, gaz, sıcak yüzeyler, çıplak alev, ısıtma cihazları gibi sıcak ile temas önleniyor mu?"
    },
    {
     "no": "23.03",
     "metin": "Sıcak borular, ısıtma tesisatı veya tank gibi sıcak yüzeylerle temas ve bunlardan dolayı yanma tehlikesi önleniyor mu?"
    },
    {
     "no": "23.04",
     "metin": "Sıcak/soğuk madde veya nesneler civarında yetkisiz kişilerin bulunması engelleniyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-24",
   "ad": "İÇ İKLİM KOŞULLAR KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "24.01",
     "metin": "Ortam termal konfor şartlarına uygun mu?"
    },
    {
     "no": "24.02",
     "metin": "Duman ve atık gaz üreten makinelere bağlı olarak çalışan egzoz ve filtre sistemi var mı?"
    },
    {
     "no": "24.03",
     "metin": "İklimlendirme cihazlarının kontrolleri yapılıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-25",
   "ad": "YÜKSEKTE ÇALIŞMA KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "25.01",
     "metin": "Genel kullanım alanlarında 90 cm. ’den, çalışma yürütülen yerlerde 121 cm. ‘den yüksek yerlere korkuluk teçhiz edilmiş mi?"
    },
    {
     "no": "25.02",
     "metin": "Yüksekte istiflenen veya muhafaza edilen malzeme, yuvarlanma, düşme, saçılma gibi durumlara karşı tedbirli olarak yerleştirilmiş mi?"
    },
    {
     "no": "25.03",
     "metin": "Makaslı merdivenler, iskele vs. kullanımı konusunda öğrenci ve personele yeterli eğitim verildi mi?"
    },
    {
     "no": "25.04",
     "metin": "Seyyar merdivenler ve tüm aksamı iyi durumda ve kullanıma hazır mı?"
    },
    {
     "no": "25.05",
     "metin": "Merdivenleri kullanmak için gerekli KKD sağlandı mı veya ayakkabılar kaymaz cinsten mi?"
    },
    {
     "no": "25.06",
     "metin": "Merdivenler her kullanımdan önce muayene ediliyor mu?"
    },
    {
     "no": "25.07",
     "metin": "Merdiven basamakların üzerinde yağ vs. gibi kaydırıcı maddelerin olmamasına dikkat ediliyor mu?"
    },
    {
     "no": "25.08",
     "metin": "Yüksekteki bir platforma veya çatıya çıkılması gerektiği zaman kullanılan merdivenler erişim sağlanan bu yükseklikten en az 91 cm daha uzun mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-26",
   "ad": "ELEKTRİKLİ TESİSAT VE EKİPMANLAR KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "26.01",
     "metin": "Elektrik tesisatının bakım ve onarımı cins ve kapasitesine göre yetkili ehliyete sahip kişilerce mi yapılıyor?"
    },
    {
     "no": "26.02",
     "metin": "Makine ve aletlerin çıplak metal kısımları topraklanmış ya da gerekli yalıtım yapılmış mı?"
    },
    {
     "no": "26.03",
     "metin": "Alet veya makinelerin topraklaması çalışıyor mu?"
    },
    {
     "no": "26.04",
     "metin": "Atölyede çalışan öğretmen ve öğrenciler için gereken KKD’ler var mı ve bu donanım gerektiğinde kullanılıyor mu?"
    },
    {
     "no": "26.05",
     "metin": "Öğretmen ve öğrenciler elektrik tesisatı hakkında gerekli eğitim, bilgi ve deneyime sahipler mi?"
    },
    {
     "no": "26.06",
     "metin": "Elektrik panolarının etrafında panoya ulaşımı engelleyecek malzeme var mı?"
    },
    {
     "no": "26.07",
     "metin": "Kollu ve çevirmeli şalterlerde 1 ve 0 konumu etiketli mi?"
    },
    {
     "no": "26.08",
     "metin": "Elektrikli el aletlerinin kullanılması gereken yerlerde aletlerin fişlerine uygun prizler var mı?"
    },
    {
     "no": "26.09",
     "metin": "Elektrik tesisatı standartlara uygun olarak döşenmiş mi?"
    },
    {
     "no": "26.10",
     "metin": "Sigortalar pano içerisinde mi ve kapakları kapalı tutuluyor mu?"
    },
    {
     "no": "26.11",
     "metin": "Nemli ve ıslak yerler ile parlama ve patlama tehlikesi olan yerlerde aydınlatma lambaları, fiş priz ve anahtarlar su damlalarına ve toza karşı tamamen korunmuş mu?"
    },
    {
     "no": "26.12",
     "metin": "Sigortalar, nemli ve ıslak yerler ile parlama ve patlama tehlikesi olan ortamın dışında mı?"
    },
    {
     "no": "26.13",
     "metin": "Yıpratıcı etkisi olan buhar ve dumana açık metal parçalar koruyucu boya ya da dayanıklı malzemeler kullanılarak korozyona karşı korunmakta mı?"
    },
    {
     "no": "26.14",
     "metin": "Makina kötü ve kullanılamaz durumda ise üzerinde kullanım dışı olduğunu belirten yazılı talimat var mı?"
    },
    {
     "no": "26.15",
     "metin": "Makinayı kullanacak kişiler kullanım/talimatlar/riskler ve tedbirler konusunda eğitildi mi?"
    },
    {
     "no": "26.16",
     "metin": "Eğitim kaydı tutuluyor mu?"
    },
    {
     "no": "26.17",
     "metin": "Makina üretici talimatları doğrultusunda kullanılıyor mu?"
    },
    {
     "no": "26.18",
     "metin": "Makinanın bulunduğu konum, makinanın güvenli kullanımı için uygun mu? (çevredeki malzemeler, taşınan parçalar ve operatörün çalışma sahası dikkate alınarak)"
    },
    {
     "no": "26.19",
     "metin": "Başlatma ve durdurma düğmeleri açıkça ayırt ediliyor mu? (Durdurma düğmesi kırmızı)"
    },
    {
     "no": "26.20",
     "metin": "Güvenlik araçları ve açma kapama anahtarları düzgün çalışıyor mu?"
    },
    {
     "no": "26.21",
     "metin": "Elektrik hatlarında izolasyonu zarar görmüş, düğüm, eklenti vs. gibi kısımlar var mı?"
    },
    {
     "no": "26.22",
     "metin": "Hasar görmüş ya da yetkili olmayan kişilerin kullanımına karşı koruma altına alınmamış elektrikli makina var mı?"
    },
    {
     "no": "26.23",
     "metin": "Basınçlı çivi çakma ve zımba gibi el aletleri kullanılırken gereken koruyucu tedbirler alınıyor mu?"
    },
    {
     "no": "26.24",
     "metin": "Diğer işletme kontrolleri ve konteyner muhteviyatı açıkça belli edilmiş mi?"
    },
    {
     "no": "26.25",
     "metin": "KKD zorunludur, sınırlı kullanım, yetkili kişiler gibi işaret ve uyarılar mevcut mu?"
    },
    {
     "no": "26.26",
     "metin": "Makina güvenlik donanımı, elektrik güvenliği açısından periyodik muayeneye tabi mi?"
    },
    {
     "no": "26.27",
     "metin": "Makina kurulumu doğru yapılmış mı?"
    },
    {
     "no": "26.28",
     "metin": "Makinanın eskimesi güvensiz bir durum oluşturuyor mu?"
    },
    {
     "no": "26.29",
     "metin": "Makina veya güvensiz durum yaratabilecek aksam, koruyucular, kullanım ömrü tamamlanmadan değiştiriliyor mu?"
    },
    {
     "no": "26.30",
     "metin": "Makina tamir ve değiştirmeye ilişkin riskler değerlendiriliyor mu?"
    },
    {
     "no": "26.31",
     "metin": "Makina ile ilgili olarak parça fırlaması, düşmesi, alabora, sıkışma, aşırı ısınma, yangın, parçalanma, patlama gibi belli tehlikeler önleniyor mu?"
    },
    {
     "no": "26.32",
     "metin": "Daire testerelerin taban pabucun altından ve üstünden koruması var mı?"
    },
    {
     "no": "26.33",
     "metin": "Daire testerelerin koruyucuları, alt bıçakları muhafazasız bırakmayacak şekilde mi?"
    },
    {
     "no": "26.34",
     "metin": "Makara zincirleri, kayışlar ve dişliler üzerinde etkili koruma var mı?"
    },
    {
     "no": "26.35",
     "metin": "Her bir makina parçası ve donanımı temiz tutulmuş ve düzgün bir biçimde muhafaza edilmiş mi?"
    },
    {
     "no": "26.36",
     "metin": "Makinelerin güvenli çalışmaları, kurulum ve bakımları, yükleme-boşaltmaları ve atıklarının taşınması için kendi aralarında ve çevrelerinde yeterli boşluk bırakılmış mı?"
    },
    {
     "no": "26.37",
     "metin": "Her makinede operatörün ulaşabileceği bir noktada güç kapama şalteri var mı?"
    },
    {
     "no": "26.38",
     "metin": "Ayakla kontrol edilen şalterler düşen cisimlerden veya çalışandan kaynaklanan hatalı aktivasyonları önlemek için korunmuş veya uygun biçimde ayarlanmış mı?"
    },
    {
     "no": "26.39",
     "metin": "Bütün acil durdurma butonları kırmızı renkte mi?"
    },
    {
     "no": "26.40",
     "metin": "Bütün kayış/kasnaklar, zincir/dişliler, dişli çarkların yerden yüksekliği 2.14 m. ye kadar veya çalışma seviyesinde çevreleyen bir koruma var mı?"
    },
    {
     "no": "26.41",
     "metin": "Operatörü ve makine alanı içerisindeki diğer kişileri, çalışma noktasında ve makinanın dönen noktalarındaki tehlikelerden, uçan parçalardan, talaşlardan, kıvılcımlardan korumak için korumalar geliştirildi mi?"
    },
    {
     "no": "26.42",
     "metin": "Makineler bir elektrik arızası veya kapanma sonrası enerji tekrar verildiğinde otomatik çalışmayı önleyecek şekilde ayarlanmış mı?"
    },
    {
     "no": "26.43",
     "metin": "Makine basınçlı havayla temizleniyorsa, hortumun basıncı 30 p.s.i (2.07 bar) veya daha az basınca düşürecek şekilde tasarlanmış ucu var mı?"
    },
    {
     "no": "26.44",
     "metin": "Basınçlı havayla temizlik yapılırken KKD' ler kullanılıyor mu?"
    },
    {
     "no": "26.45",
     "metin": "Havalandırma Fan kanat açıklıkları ve fan yüksekliği standartlara uygun mu?"
    },
    {
     "no": "26.46",
     "metin": "Kesmede kullanılan testereler fırlamayı önleyecek gergi ve donanımlara sahip mi?"
    },
    {
     "no": "26.47",
     "metin": "Kesici başlıklar, delici uçlar vs., tezgâhın kenarını aşmayacak şekilde ayarlanmış mı?"
    },
    {
     "no": "26.48",
     "metin": "Tamir, servis, kurulum ve bakım esnasında kablolu sabit ekipmanlar birbirinden ayrılmış ve güç kaynağıyla bağlantısı kesilmiş mi?(elektrikli, hidrolik, pnömatik v.b.)"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-27",
   "ad": "EKRANLI ARAÇLAR VE BİLGİSAYARLAR KONTROL LİSTESİ(TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "27.01",
     "metin": "Ekranlı araçlar kullanıcının ihtiyaçları doğrultusunda hareket ettirilebiliyor ve istenilen pozisyonda sabitlenebiliyor mu?"
    },
    {
     "no": "27.02",
     "metin": "Genel ve lokal aydınlatma, ekran ile bilgisayar arka planı arasında yeterli ışıklandırma ve kontrast sağlıyor mu?"
    },
    {
     "no": "27.03",
     "metin": "Gözler ile ekran arasındaki mesafe 50-80 cm arasında mı?"
    },
    {
     "no": "27.04",
     "metin": "Ekran, görüşü bozabilecek yansımalardan arındırılmış mı?"
    },
    {
     "no": "27.05",
     "metin": "Klavye ve farenin önünde kalan boşluk kullanıcının bileklerini desteklemeye yeterli mi?"
    },
    {
     "no": "27.06",
     "metin": "Klavyenin yüzeyi yansımaları engelleyecek şekilde mat mı?"
    },
    {
     "no": "27.07",
     "metin": "Ekranlı Araçlarla Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik doğrultusunda tedbirler alınmış mı?"
    },
    {
     "no": "27.08",
     "metin": "Masa ve sandalye yeterli yükseklikte mi?"
    },
    {
     "no": "27.09",
     "metin": "Sandalyeler ergonomik mi?"
    },
    {
     "no": "27.10",
     "metin": "Yeterli çalışma boşluğu var mı?"
    },
    {
     "no": "27.11",
     "metin": "Bilgisayar odasında yeterli havalandırma var mı?"
    },
    {
     "no": "27.12",
     "metin": "Bilgisayar odası yeterli aydınlanıyor mu?"
    },
    {
     "no": "27.13",
     "metin": "Bilgisayar ekranları sağlığa zararlı ışın yayıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-28",
   "ad": "BASINÇLI KAPLAR VE TESİSATLAR KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "28.01",
     "metin": "Emniyetli çalışma sınırları dışındaki basınç düzeylerinde gereken emniyet ventilleri ve yedekleri çalışır durumda mı?"
    },
    {
     "no": "28.02",
     "metin": "Kullanılan malzemeler (tank, boru, ekleme parçaları, açma kapama elemanları, göstergeler ve şalterler) çalışma basıncına uygun mu?"
    },
    {
     "no": "28.03",
     "metin": "İmalatçı firma adı, kazan numarası, imalat tarihi ve en yüksek test ve çalışma basıncı bilgilerin olduğu etiket var mı?"
    },
    {
     "no": "28.04",
     "metin": "Emniyet ventili ile basınçlı kap arasında herhangi bir açma kapama elemanı olmadığı kontrol edildi mi?"
    },
    {
     "no": "28.05",
     "metin": "Periyodik bakım onarım kartı var mı?"
    },
    {
     "no": "28.06",
     "metin": "Periyodik bakımları yetkili teknik elemanlar tarafından yapılmış ve rapor düzenlenmiş mi?"
    },
    {
     "no": "28.07",
     "metin": "Basınçlı kapların üzerinde, gerektiğinde içine girmeyi sağlayacak kapak veya el delikleri var mı ve emniyetli şekilde kapatılmış mı?"
    },
    {
     "no": "28.08",
     "metin": "Boşaltma ve kontrol kör tapaları var mı?"
    },
    {
     "no": "28.09",
     "metin": "İçi su dolu tank ve depolarda donmaya karşı tedbirler alınmış mı?"
    },
    {
     "no": "28.10",
     "metin": "Basınçlı hava tanklarında içinde biriken su, yağ ve pislik dışarı atılması için boşaltma muslukları günlük açılarak boşaltılıyor mu?"
    },
    {
     "no": "28.11",
     "metin": "Boru tesisatları, açma kapama elemanları ve izolasyonlar periyodik olarak kontrol ediliyor mu?"
    },
    {
     "no": "28.12",
     "metin": "Hava kompresörü ile hava tankları arasında, yağ ve nem ayırıcıları (seperatör) var mı?"
    },
    {
     "no": "28.13",
     "metin": "Hava kompresörlerin temiz hava emmeleri sağlanmış mı? (patlayıcı, zararlı ve zehirli gaz, duman ve toz emilmesi önlenmiş mi?)"
    },
    {
     "no": "28.14",
     "metin": "Kompresörün tehlike anında uzak bir yerden durdurulması sağlanmış mı?"
    },
    {
     "no": "28.15",
     "metin": "Kompresör kullanma talimatı var mı?"
    },
    {
     "no": "28.16",
     "metin": "Kompresör sorumlusu kişi belirtilmiş mi?"
    },
    {
     "no": "28.17",
     "metin": "Bakım kartı var mı?"
    },
    {
     "no": "28.18",
     "metin": "Kompresör çalışma alanının dışında mı?"
    },
    {
     "no": "28.19",
     "metin": "Basınçlı kazanların atölye dışında uygun muhafazası yapılıyor mu?"
    },
    {
     "no": "28.20",
     "metin": "Elektrikli kompresörlerin elektrik bağlantıları düzenli kontrol ediliyor mu?"
    },
    {
     "no": "28.21",
     "metin": "Kompresör için uygun yağ seçilmiş mi?"
    },
    {
     "no": "28.22",
     "metin": "Kompresör tankı, gövdesi korozyona karşı dayanıklı mı?"
    },
    {
     "no": "28.23",
     "metin": "Kullanılan yağ oksidasyona karşı mukavemeti artırıcı özellikte mi?"
    },
    {
     "no": "28.24",
     "metin": "Seperatör elemanı her yıl düzenli olarak değiştiriliyor mu?"
    },
    {
     "no": "28.25",
     "metin": "Motor kayışı düzenli olarak değiştiriliyor mu?"
    },
    {
     "no": "28.26",
     "metin": "Soğutma radyatörünün bakımı düzenli olarak yapılıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-29",
   "ad": "BASINÇLI GAZ TÜPLERİ KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "29.01",
     "metin": "Çalışma alanındaki bütün tüpler; içerik bilgilerini ve tehlikeli bileşik uyarılarını açıkça gösterecek şekilde etiketlenmiş mi?"
    },
    {
     "no": "29.02",
     "metin": "Tüpler yetkili olmayan kişiler tarafından cisim düşürülerek ya da temas edilerek zarar görmeyecek alanlara yerleştirildi mi veya depolandı mı?"
    },
    {
     "no": "29.03",
     "metin": "Boş tüplerin boş oldukları işaretle veya etiketle açıkça gösterilmiş mi?"
    },
    {
     "no": "29.04",
     "metin": "Vana koruyucuları, her durumda (tüpler kullanıma hazır veya değilken) tüplerin üzerinde mevcut mu?"
    },
    {
     "no": "29.05",
     "metin": "Tüpler tehlike sınıflarına göre gruplandırmış ve ayrılmış mı?"
    },
    {
     "no": "29.06",
     "metin": "Oksijen tüpleri gaz yakıt tüplerinden en az 6 metre uzakta depolanmış mı?"
    },
    {
     "no": "29.07",
     "metin": "Bütün tüpler taşınma ya da depolanma sırasında dik pozisyondan devrilmesi, yuvarlanması ve düşmesine engel olunacak şekilde duvara, el arabasına veya tezgâha (kayış veya zincirle) bağlandı mı?"
    },
    {
     "no": "29.08",
     "metin": "Vanalar, regülatörler, sayaçlar, bağlantı elemanları ve hortumlar tüpün basınç ve hacmiyle (içeriğiyle) uyumlu mu?"
    },
    {
     "no": "29.09",
     "metin": "Vanalar tüp hareket ettirilmeden önce, tüp boşken ve iş bitiminde kapalı durumda mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-30",
   "ad": "YANGIN VE PATLAMA KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "30.01",
     "metin": "Bina yangın çıkış levhaları gerekli yerlere asılmış mı?"
    },
    {
     "no": "30.02",
     "metin": "Bina yangın çıkış kapıları ve merdivenleri ulaşılabilir durumda mı?"
    },
    {
     "no": "30.03",
     "metin": "Yangın söndürme tüpleri yılda bir kontrol edilerek kontrol tarihleri üzerlerine yazılmış mı?"
    },
    {
     "no": "30.04",
     "metin": "Yangın söndürme tüp ve dolapları görünür ve kolay erişilebilir yerlerde mi?"
    },
    {
     "no": "30.05",
     "metin": "Otomatik alarm sistemi varsa düğmeleri, iyi görülebilir ve erişilebilir bir yere ve özellikle acil çıkış yolları üzerine konulmuş mu?"
    },
    {
     "no": "30.06",
     "metin": "Yanıcı, patlayıcı maddeler, atıklar talimatlara uygun bir şekilde depolanmış mı?"
    },
    {
     "no": "30.07",
     "metin": "Geceleri kullanılmayan kısımların şalterleri kapatılabilecek şekilde düzenlenmiş mi?"
    },
    {
     "no": "30.08",
     "metin": "Yangın ve alarm sistemi aydınlatma ve kuvvet şebekesinden ayrı bir kaynaktan beslenmiş mi?"
    },
    {
     "no": "30.09",
     "metin": "Tesisat galeri ve kanallarında yangın yalıtımı yapılmış mı?"
    },
    {
     "no": "30.10",
     "metin": "Yangın riski yüksek atölyelerde ( Kaynak ve oksijenle kesme vb. ) yanıcı ve parlayıcı maddeler uzaklaştırılmış mı?"
    },
    {
     "no": "30.11",
     "metin": "Patlama riski bulunan LPG, Asetilen vb tüplerin depolanma yerleri güneşten ve çeşitli ısı kaynaklarından korunacak şekilde seçilmiş mi?"
    },
    {
     "no": "30.12",
     "metin": "Kullanılan tüm patlayıcı kimyasal maddeler için Malzeme Güvenlik Bilgi Formu var mı?"
    },
    {
     "no": "30.13",
     "metin": "Patlayıcı ve yanıcı maddeler standartlara uygun olarak etiketlenmiş mi?"
    },
    {
     "no": "30.14",
     "metin": "İş süreçlerinde yapılan veya oluşan karışımların patlayıcı olması önleniyor mu?"
    },
    {
     "no": "30.15",
     "metin": "Gaz birikme riski olan kapalı alanlar standartlara uygun havalandırılıyor mu?"
    },
    {
     "no": "30.16",
     "metin": "Havalandırma sistemi düzenli olarak kontrol ediliyor mu?"
    },
    {
     "no": "30.17",
     "metin": "Patlama tehlikesinin bulunduğu alanlarda herhangi bir elektrostatik alan var mı?"
    },
    {
     "no": "30.18",
     "metin": "Patlayıcı alanlarda kullanılan elektrikli araçlar uygun şekilde seçilmiş mi?"
    },
    {
     "no": "30.19",
     "metin": "Alarm ikaz tesisatı var mı?"
    },
    {
     "no": "30.20",
     "metin": "Yangın söndürme tüplerinin cinsine göre kullanılma yerleri biliniyor mu?"
    },
    {
     "no": "30.21",
     "metin": "Yangın tipine uygun söndürücü var mı?"
    },
    {
     "no": "30.22",
     "metin": "Yangın tatbikatları yapılıyor mu?"
    },
    {
     "no": "30.23",
     "metin": "Acil çıkış kapıları var mı, yönetmeliğe uygun mu?"
    },
    {
     "no": "30.24",
     "metin": "Personel yangın ve patlamayla ilgili eğitim almış mı?"
    },
    {
     "no": "30.25",
     "metin": "Okulun özelliğine göre yangın söndürme tüpü kullanılıyor mu?"
    },
    {
     "no": "30.26",
     "metin": "Yıllık yangın tatbikatı yapılıp kayıt altına alınıyor mu?"
    },
    {
     "no": "30.27",
     "metin": "Yangın esnasında görev dağılımı yapılmış mı, uygun yere asılmış mı?"
    },
    {
     "no": "30.28",
     "metin": "Yangın durumunda ilk kurtarılacak işaretlenmiş mi?"
    },
    {
     "no": "30.29",
     "metin": "Basınçlı tüplerin arasında mesafeler ayarlandı mı?"
    },
    {
     "no": "30.30",
     "metin": "Asetilen kazanlarının basınç değerleri kontrol altına alındı mı?"
    },
    {
     "no": "30.31",
     "metin": "Kaynak ünitelerine kaynak yapılmış parçaların soğuma işlemleri kontrol altına alınarak yapılıyor mu?"
    },
    {
     "no": "30.32",
     "metin": "Kıvılcım çıkaran makinelerle yanıcı maddelerin çalışma alanları birbirinden güvenli şekilde ayrıldı mı?"
    },
    {
     "no": "30.33",
     "metin": "Kaynak işlemlerinden sonra ortam ve kaynak ekipmanları içindeki gazlar güvenli şekilde havalandırılmış mı?"
    },
    {
     "no": "30.34",
     "metin": "Yangın söndürme tüpleri dördüncü yılın sonunda içindeki söndürme maddeleri yenilenerek hidrostatik testleri yapılmış ve değiştirilmiş mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-31",
   "ad": "GÜRÜLTÜ VE TİTREŞİM KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "31.01",
     "metin": "Gürültü seviyesinin yüksek olduğu yerlerde gerekli önlemler alınıyor mu?"
    },
    {
     "no": "31.02",
     "metin": "Gürültü maruziyetinin fazla olduğu yerlerde gürültü testleri yapılıyor mu?"
    },
    {
     "no": "31.03",
     "metin": "Çalışma sırasında ortaya çıkan gürültünün uyarıcı alarmları bastırma olasılığı önleniyor mu?"
    },
    {
     "no": "31.04",
     "metin": "Yapılan iş sırasında makinenin titreşimini absorbe edecek önlemler alınıyor mu?"
    },
    {
     "no": "31.05",
     "metin": "Atölyelerde gürültü cinsine uygun KKD var mı?"
    },
    {
     "no": "31.06",
     "metin": "Atölye çalışanları gürültü ve titreşim hakkında eğitim aldı mı?"
    },
    {
     "no": "31.07",
     "metin": "Motor çalıştırılan atölyelerde sesin absorbe edilmesi için duvara yalıtım yapılmış mı?"
    },
    {
     "no": "31.08",
     "metin": "Gürültü ve titreşim süreleri yapılan işe uygun tutuluyor mu?"
    },
    {
     "no": "31.09",
     "metin": "Gürültülü ve titreşimli yerde çalışan elemanların periyodik olarak sağlık taraması yapılıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-32",
   "ad": "KİMYASAL GÜVENLİK KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "32.01",
     "metin": "Çalışmaya başlamadan önce numuneye ait deney iş talimatı okunuyor mu?"
    },
    {
     "no": "32.02",
     "metin": "Numunenin katı, sıvı, gaz, tehlikeli madde, toz, granül özelliği öncelikli olarak belirleniyor mu?"
    },
    {
     "no": "32.03",
     "metin": "Kimyasalların kullanıldığı laboratuvar çalışma alanlarında uygulamalı bir laboratuvar güvenlik kılavuzu var mı?"
    },
    {
     "no": "32.04",
     "metin": "Her laboratuvar girişinde tehlikeleri ve ihtiyaç duyulan koruyucu önlemleri tanımlayan bir işaret var mı?"
    },
    {
     "no": "32.05",
     "metin": "Yapılan çalışmaya ait uyarı işaret ve levhaları talimatlar doğrultusunda yerleştirilerek ve çalışma sırasında koruyarak iş alanının ve personelin güvenliği sağlanabiliyor mu?"
    },
    {
     "no": "32.06",
     "metin": "Çalışanlar çalışma alanlarındaki kimyasal tehlikeler ve uygun korunma şartları konusunda bilgili mi?"
    },
    {
     "no": "32.07",
     "metin": "Çalışma alanında ilgisiz kişilerin bulunmamasına dikkat ediliyor mu?"
    },
    {
     "no": "32.08",
     "metin": "Kimyasallar ile çalışırken yapılan işe uygun iş elbiseleri ve kişisel koruyucu donanım kullanıyor mu?"
    },
    {
     "no": "32.09",
     "metin": "İş sağlığı ve güvenliği koruma ve müdahale araçları uygun ve çalışır şekilde bulunuyor mu?"
    },
    {
     "no": "32.10",
     "metin": "Çeker ocağın kullanılması gereken işlerde kullanılıp kullanılmadığı kontrol ediliyor mu?"
    },
    {
     "no": "32.11",
     "metin": "Statik elektrik biriktirme ve kıvılcım atlama ihtimali olan uygulamalarda topraklama yapılıyor mu?"
    },
    {
     "no": "32.12",
     "metin": "Havalandırma ve kimyasal yükleme-boşaltma gibi kontrol prosedürleri gerekli olan tehlikeli maddeler için uygulanıyor mu?"
    },
    {
     "no": "32.13",
     "metin": "Her kimyasal için malzeme güvenliği-güvenlik bilgi formu var mı?"
    },
    {
     "no": "32.14",
     "metin": "Tehlikeli madde içeren her konteynır (fıçı, tank, şişe v.b.)uygun biçimde etiketlenmiş mi?"
    },
    {
     "no": "32.15",
     "metin": "Kimyasallar, birbirine zıt olanlar(asit ve baz, organik ve oksitleyiciler gibi) ayrı tutularak depolanıyor mu?"
    },
    {
     "no": "32.16",
     "metin": "Yanıcı ve parlayıcı malzemeler güvenli bir şekilde tutuluyor mu?"
    },
    {
     "no": "32.17",
     "metin": "Sıvı kimyasal konteynırları sıçramayı ve zıt reaksiyonları önlemek için emniyet kabı içerisinde saklanıyor mu?"
    },
    {
     "no": "32.18",
     "metin": "Vücuda zarar verici kimyasallar kullanıldığı zaman acil yıkama imkânları (örn: göz banyoları ve duş) mevcut mu?"
    },
    {
     "no": "32.19",
     "metin": "Kişinin acil yıkama imkânlarına ulaşmasını engelleyecek durumlar ortadan kaldırılmış mı?"
    },
    {
     "no": "32.20",
     "metin": "Acil durum göz banyosu düzgün çalıştığını doğrulamak amacıyla haftada bir test ediliyor mu?"
    },
    {
     "no": "32.21",
     "metin": "Acil durumlarda çıkış veya kaçış prosedürlerini uygulanıyor"
    },
    {
     "no": "32.22",
     "metin": "Genel Güvenlik kuralları uygun yerlere asıldı mı?"
    },
    {
     "no": "32.23",
     "metin": "Laboratuvarda meydana gelebilecek kazalara karşı öğretmen ve öğrenciler bilgilendirildi mi?"
    },
    {
     "no": "32.24",
     "metin": "Kimyasalların depoları veya kabinleri var mı?"
    },
    {
     "no": "32.25",
     "metin": "Laboratuvar muslukları sızdırmaz mı?"
    },
    {
     "no": "32.26",
     "metin": "Vücut ve göz duşu var mı?"
    },
    {
     "no": "32.27",
     "metin": "Alev alabilen ve parlayabilen malzemeler için önlem alınmış mı?"
    },
    {
     "no": "32.28",
     "metin": "Stabil olmayan kimyasallar kontrol altına alınmış mı?"
    },
    {
     "no": "32.29",
     "metin": "Korozif kimyasallar kontrol altına alınmış mı?"
    },
    {
     "no": "32.30",
     "metin": "Asit ve bazlar kontrol altında mı?"
    },
    {
     "no": "32.31",
     "metin": "Toksikolojik etkilerine göre sınıflandırmalar yapılıp güvenlik önlemleri alındı mı?"
    },
    {
     "no": "32.32",
     "metin": "Radyasyon içeren maddeler konusunda koruma tedbirleri alındı mı?"
    },
    {
     "no": "32.33",
     "metin": "Cam malzemelerin güvenliği konusunda tedbirler alındı mı?"
    },
    {
     "no": "32.34",
     "metin": "Laboratuvarda yiyecek ve içecek bulundurulmaması konusunda bilgilendirme yapıldı mı?"
    },
    {
     "no": "32.35",
     "metin": "Laboratuvarda bulunan herkes tarafından KKD kullanılıyor mu?"
    },
    {
     "no": "32.36",
     "metin": "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemler Hakkında Yönetmelik öğretmen ve öğrenciler tarafından biliniyor mu?"
    },
    {
     "no": "32.37",
     "metin": "Mesleki maruziyet sınır değerlerini gösterir tablo öğretmen ve öğrenciler tarafından görülebilecek yere asılmış mı?"
    },
    {
     "no": "32.38",
     "metin": "Biyolojik sınır değerler ve sağlık gözetimi önlemleri öğretmen ve öğrenciler tarafından görülebilecek yerde mi?"
    },
    {
     "no": "32.39",
     "metin": "Kullanımı yasak olan kimyasal maddeler ile yapılması yasaklanan işler tablosu öğretmen ve öğrencilerin görebilecekleri yerde asılı mı?"
    },
    {
     "no": "32.40",
     "metin": "Sıvı oksijen, sıvı argon ve sıvı azot depolama tankları ile ilgili güvenlik mesafelerini gösterir çizelge öğretmen ve öğrencilerin görebilecekleri yere asılmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-33",
   "ad": "ATIKLAR KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "33.01",
     "metin": "Kimyasal atıkların imhası için gerekli olan ihtiyaçların belirlenmesi için’ ’Atık Sınıflandırma’’ değerlendirmeleri yapılmış mı?"
    },
    {
     "no": "33.02",
     "metin": "Dönüştürülebilen malzemelerin geri kazanımı için gerekli ayırma ve sınıflandırma yapılıyor mu?"
    },
    {
     "no": "33.03",
     "metin": "İşlem sırasında ve hazırlık aşamalarında KKD kullanılıyor mu?"
    },
    {
     "no": "33.04",
     "metin": "Atık konteynırları ilk atık konulduktan sonra ambalajın üzerinden net olarak görünecek şekilde etiketleniyor mu?"
    },
    {
     "no": "33.05",
     "metin": "Çalışanlar atık depolanmasını başlatmak için Kimyasal Depolama İstek formuyla başvurmuşlar mı?"
    },
    {
     "no": "33.06",
     "metin": "Çalışanlar atık toplanmasını sağlamak için Kimyasal Toplama Talebi formu sunuyorlar mı?"
    },
    {
     "no": "33.07",
     "metin": "Atık bilgi formları eksiksiz doldurulup kayıt altına alınıyor mu?"
    },
    {
     "no": "33.08",
     "metin": "Sınıflandırılan atıklar uygun alan ve koşullarda bekletiliyor mu?"
    },
    {
     "no": "33.09",
     "metin": "Satın alınan kimyasalların geri dönüşümlü olmasına dikkat ediliyor mu?"
    },
    {
     "no": "33.10",
     "metin": "Kullanılmış tüm piller geri dönüşüme tabi tutuluyor mu?"
    },
    {
     "no": "33.11",
     "metin": "Kimyasallar zararsız veya daha az zararlı alternatifleri ile değiştiriliyor mu?"
    },
    {
     "no": "33.12",
     "metin": "Çalışanlar kimyasal saçılmaların temizlenmesi için yetiştirilmiş ve teçhizatlandırılmışlar mı?"
    },
    {
     "no": "33.13",
     "metin": "Dökülme ve sızıntılara karsı kullanılacak uygun donanım, malzeme ve ekipman hazır bulunduruluyor mu?"
    },
    {
     "no": "33.14",
     "metin": "İnce talaş, cilalar ve çözücüler gibi ürünler için ürün türünü ve ürünle ilişkili tehlikeleri (kanserojen, cila çözücü buharı, toz tehlikesi gibi) belirten semboller içeren uyarılar mevcut mu?"
    },
    {
     "no": "33.15",
     "metin": "Talimatların hazırlanmasında ve güvenlik uygulamalarında istişare ediliyor mu?"
    },
    {
     "no": "33.16",
     "metin": "Okulda kullanılan ve bulunan maddelere (yakıtlar, yağlar, lifler, çözücüler, temizlik ürünleri, boyalar, vernikler, yapıştırıcılar, mürekkepler, reçineler, böcek öldürücüler, ağır metaller, asitler, alkaliler, dumanlar, gazlar) ait risk değerlendirmesi için bir envanter kaydı mevcut mu?"
    },
    {
     "no": "33.17",
     "metin": "Pil, Yağ, Katı, Kentsel, Bitkisel, Radyoaktif, Tıbbi ve kentsel atıklarla ilgili yönetmeliklerin gereği için tedbirler alınmış mı?"
    },
    {
     "no": "33.18",
     "metin": "Kullanılan yağ, yakıt gibi sıvıların kutularında uygun işaretleme yapılmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-34",
   "ad": "EL ALETLERİ VE EKİPMANLARI … KONTROL LİSTESİ (TÜM OKULLAR)",
   "maddeler": [
    {
     "no": "34.01",
     "metin": "Tüm alet ve ekipmanlar sağlıklı ve kullanılır durumda mı?"
    },
    {
     "no": "34.02",
     "metin": "Kullanılan alet ve ekipman yapılan işe uygun mu?"
    },
    {
     "no": "34.03",
     "metin": "Keski gibi aletler gerektikçe onarılıyor veya yenileniyor mu?"
    },
    {
     "no": "34.04",
     "metin": "Aletlerin sapları hasarsız ve baş ile bağlantısı sağlam mı?"
    },
    {
     "no": "34.05",
     "metin": "Aletlerin kesici kısımları işlevini yerine getirecek keskinlikte mi?"
    },
    {
     "no": "34.06",
     "metin": "Sivri ve kesici aletler koruyucu kılıf içerisinde mi taşınıyor?"
    },
    {
     "no": "34.07",
     "metin": "Kullanılan el aletleri el ergonomisine uygun ve kullanımı rahat mı?"
    },
    {
     "no": "34.08",
     "metin": "El aletlerinin periyodik olarak kontrolü ve bakımı yapılıyor mu?"
    },
    {
     "no": "34.09",
     "metin": "İşlem yapılacak malzemeler emniyetle sabitleniyor mu?"
    },
    {
     "no": "34.10",
     "metin": "Kesme ve taşlama aletlerinin koruyucu başlıkları var mı?"
    },
    {
     "no": "34.11",
     "metin": "El aletleri kullanıldıktan sonra muhafaza edildikleri yerlerine konuluyor mu?"
    },
    {
     "no": "34.12",
     "metin": "El aletleri imalatçının kullanma kılavuzunda belirttiği gibi kullanılıyor mu?"
    },
    {
     "no": "34.13",
     "metin": "İlk kullanım öncesi el aletleri ile ilgili kullanıcılara eğitim veriliyor mu?"
    },
    {
     "no": "34.14",
     "metin": "El aletlerinin kullanımı sırasında gerekli KKD kullanılıyor mu?"
    },
    {
     "no": "34.15",
     "metin": "Basınçlı çivi ve çakma zımba gibi el aletleri kullanılırken gereken koruyucu tedbirler alınıyor mu?"
    },
    {
     "no": "34.16",
     "metin": "Çekiç, tokmak gibi vurma aletlerinin emniyet kaması var mı?"
    },
    {
     "no": "34.17",
     "metin": "Çekiç, tokmak gibi vurma aletlerinin köşeleri düzgün mü?"
    },
    {
     "no": "34.18",
     "metin": "Vurma aletlerinin sapları düzgün mü?"
    },
    {
     "no": "34.19",
     "metin": "Ölçme aletlerinin kalibrasyonu yapılıyor mu?"
    },
    {
     "no": "34.20",
     "metin": "Ölçme aletlerinin düzenli olarak bakımı yapılıyor mu?"
    },
    {
     "no": "34.21",
     "metin": "Pense saplarının izolasyonu var mı, ağızları düzgün mü?"
    },
    {
     "no": "34.22",
     "metin": "Kırık, çatlak, aşınmış olan el aletleri yenisiyle değiştiriliyor mu?"
    },
    {
     "no": "34.23",
     "metin": "Kırık, çatlak, aşınmış olan el aletleri ayrı muhafaza ediliyor mu?"
    },
    {
     "no": "34.24",
     "metin": "Tüm el aletleri kayıtları (günlük kontrol) tutuluyor mu?"
    },
    {
     "no": "34.25",
     "metin": "Takımhanelerde sorumlu bir kişi bulunduruluyor mu? (Nöbetçi)"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-35",
   "ad": "ATELYELER (…) KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "35.01",
     "metin": "Çalışma masaları, makineler ve tabureler ergonomik mi?"
    },
    {
     "no": "35.02",
     "metin": "Çalışma masaları, makineler ve taburelerin yükseklikleri ayarlanabiliyor mu?"
    },
    {
     "no": "35.03",
     "metin": "Aydınlatma yeterli mi?"
    },
    {
     "no": "35.04",
     "metin": "Havalandırma ve baca tesisatı standartlara uygun mu?"
    },
    {
     "no": "35.05",
     "metin": "İlkyardım dolabı var mı?"
    },
    {
     "no": "35.06",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "35.07",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    },
    {
     "no": "35.08",
     "metin": "Acil durum alarmı ve acil çıkış levhası var mı?"
    },
    {
     "no": "35.09",
     "metin": "Uyarı levhaları asılı mı?"
    },
    {
     "no": "35.10",
     "metin": "Zeminler kaymaya, düşmeye karşı uygun malzemelerden yapılmış mı?"
    },
    {
     "no": "35.11",
     "metin": "Elektrik panolarında gerekli önlemler alınmış mı?"
    },
    {
     "no": "35.12",
     "metin": "Makinelerin kullanım talimatları asılmış mı?"
    },
    {
     "no": "35.13",
     "metin": "Çalışanlar için gerekli KKD var mı?"
    },
    {
     "no": "35.14",
     "metin": "KKD uygun şekilde muhafaza ediliyor mu?"
    },
    {
     "no": "35.15",
     "metin": "Zarar verici maddeler korunmaya alınmış mı?"
    },
    {
     "no": "35.16",
     "metin": "Kimyasal maddelerin zararlarına karşı gerekli önlemler alındı mı?"
    },
    {
     "no": "35.17",
     "metin": "Gaz, elektrik, sıhhi tesisat ve pis su tesisatları standartlara uygun mu?"
    },
    {
     "no": "35.18",
     "metin": "WC ve duş var mı?"
    },
    {
     "no": "35.19",
     "metin": "Duyuru panosu var mı?"
    },
    {
     "no": "35.20",
     "metin": "Atölye sorumlusunun telefonları panoda asılı mı?"
    },
    {
     "no": "35.21",
     "metin": "Çalışan için soyunma dolapları var mı?"
    },
    {
     "no": "35.22",
     "metin": "Çalışma planı (vaziyet planı) asılı mı?"
    },
    {
     "no": "35.23",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "35.24",
     "metin": "Atölye içinin ışıklandırması yeterli mi?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-36",
   "ad": "ATELYELER (…) KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "36.01",
     "metin": "Ocakların havalandırma ve baca tesisatı yeterli mi?"
    },
    {
     "no": "36.02",
     "metin": "Boya, tiner gibi patlayıcı ve yanıcı maddeler korunmaya alınmış mı?"
    },
    {
     "no": "36.03",
     "metin": "Atölyede öğrencilerin kendilerine ait soyunma dolapları var mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-37",
   "ad": "ATELYELER (…) KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "37.01",
     "metin": "Çalışma masaları, makineler ve tabureler ergonomik mi?"
    },
    {
     "no": "37.02",
     "metin": "Çalışma masaları, makineler ve taburelerin yükseklikleri ayarlanabiliyor mu?"
    },
    {
     "no": "37.03",
     "metin": "Aydınlatma yeterli mi?"
    },
    {
     "no": "37.04",
     "metin": "Havalandırma ve baca tesisatı standartlara uygun mu?"
    },
    {
     "no": "37.05",
     "metin": "İlkyardım dolabı var mı?"
    },
    {
     "no": "37.06",
     "metin": "İlkyardım dolapları hemen erişim sağlanabilecek yerlerde mi?"
    },
    {
     "no": "37.07",
     "metin": "İlkyardım dolaplarının ihtiyaç malzemeleri yeterli mi?"
    },
    {
     "no": "37.08",
     "metin": "Acil durum alarmı ve acil çıkış levhası var mı?"
    },
    {
     "no": "37.09",
     "metin": "Uyarı levhaları asılı mı?"
    },
    {
     "no": "37.10",
     "metin": "Zeminler kaymaya, düşmeye karşı uygun malzemelerden yapılmış mı?"
    },
    {
     "no": "37.11",
     "metin": "Elektrik panolarında gerekli önlemler alınmış mı?"
    },
    {
     "no": "37.12",
     "metin": "Makinelerin kullanım talimatları asılmış mı?"
    },
    {
     "no": "37.13",
     "metin": "Çalışanlar için gerekli KKD var mı?"
    },
    {
     "no": "37.14",
     "metin": "KKD uygun şekilde muhafaza ediliyor mu?"
    },
    {
     "no": "37.15",
     "metin": "Zarar verici maddeler kilit altında mı?"
    },
    {
     "no": "37.16",
     "metin": "Kimyasal maddelerin zararlarına karşı gerekli önlemler alındı mı?"
    },
    {
     "no": "37.17",
     "metin": "Gaz, elektrik, sıhhi tesisat ve pis su tesisatları standartlara uygun mu?"
    },
    {
     "no": "37.18",
     "metin": "WC ve duş var mı?"
    },
    {
     "no": "37.19",
     "metin": "Duyuru panosu var mı?"
    },
    {
     "no": "37.20",
     "metin": "Atölye sorumlusunun telefonları panoda asılı mı?"
    },
    {
     "no": "37.21",
     "metin": "Çalışan için soyunma dolapları var mı?"
    },
    {
     "no": "37.22",
     "metin": "Çalışma planı (vaziyet planı) asılı mı?"
    },
    {
     "no": "37.23",
     "metin": "Deprem veya sarsıntı gibi durumlarda devrilebilecek ekipmanlar duvara sabitlenmiş mi?"
    },
    {
     "no": "37.24",
     "metin": "Zeminde kaymaya karşı güvenlik tedbirleri alınıyor mu?"
    },
    {
     "no": "37.25",
     "metin": "Atölyede gayrı faal malzemeler ayrı ve uygun ayrılıyor ve depolanıyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-38",
   "ad": "MOTORLU ARAÇLAR ATELYESİ KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "38.01",
     "metin": "Acil çıkış kapısı var mı?"
    },
    {
     "no": "38.02",
     "metin": "Lift ‘in periyodik bakımları yapılıyor mu?"
    },
    {
     "no": "38.03",
     "metin": "Tekerlek sökme aparatının koruyucuları var mı?"
    },
    {
     "no": "38.04",
     "metin": "Motor çalıştırma anında egzoz gazlarının çıkışı için uygun bağlantılar kullanıldı mı?"
    },
    {
     "no": "38.05",
     "metin": "Motorlar arasında uygun mesafe çalışma alanı var mı?"
    },
    {
     "no": "38.06",
     "metin": "Motorlar çalışırken yangın söndürme cihazı hazır bulunduruluyor mu?"
    },
    {
     "no": "38.07",
     "metin": "Motor çalıştırılması esnasında uygun KKD kullanılıyor mu?"
    },
    {
     "no": "38.08",
     "metin": "Tezgahların periyodik bakımı yapılıyor mu?"
    },
    {
     "no": "38.09",
     "metin": "Test cihazları koruma kutularında muhafaza ediliyor mu?"
    },
    {
     "no": "38.10",
     "metin": "Zeminde, kaymaya karşı önlem alınıyor mu?"
    },
    {
     "no": "38.11",
     "metin": "İlkyardım kutusu var mı?"
    },
    {
     "no": "38.12",
     "metin": "Çalışma masaları ve tabureleri sağlam mı?"
    },
    {
     "no": "38.13",
     "metin": "Yangın söndürme tüpü var mı?"
    },
    {
     "no": "38.14",
     "metin": "Yangın Ekibi çizelgesi var mı?"
    },
    {
     "no": "38.15",
     "metin": "Acil çıkış kapısı yönetmeliğe uygun mu?"
    },
    {
     "no": "38.16",
     "metin": "Pompa test cihazı yere sabitlendi mi?"
    },
    {
     "no": "38.17",
     "metin": "Pompa Test Cihazı Çalışma Talimatı var mı?"
    },
    {
     "no": "38.18",
     "metin": "Yakıtlar koruma altına alındı mı?"
    },
    {
     "no": "38.19",
     "metin": "Personele yangın hakkında eğitim verildi mi?"
    },
    {
     "no": "38.20",
     "metin": "Atölye sıcaklığı çalışma şartlarına uygun mu?"
    },
    {
     "no": "38.21",
     "metin": "Elektrik panolarının yanında uyarı levhası var mı?"
    },
    {
     "no": "38.22",
     "metin": "Atölyelerde sorumlu kişilerin İsmi yazılı mı?"
    },
    {
     "no": "38.23",
     "metin": "Faal ve gayri faal parçalar muhafaza altına alınıyor mu?"
    },
    {
     "no": "38.24",
     "metin": "Egzoz gazları için havalandırma sistemi var mı?"
    },
    {
     "no": "38.25",
     "metin": "Motor sehpalarının bağlantıları düzenli olarak kontrol ediliyor mu?"
    },
    {
     "no": "38.26",
     "metin": "Aküler uygun yerde muhafaza ediliyor mu?"
    },
    {
     "no": "38.27",
     "metin": "Pompa test cihazlarının bakımı yıllık yapılıyor mu?"
    },
    {
     "no": "38.28",
     "metin": "Pompa test cihazlarının kullanma kılavuzu var mı?"
    },
    {
     "no": "38.29",
     "metin": "Pompa test cihazlarının sorumlusu var mı?"
    },
    {
     "no": "38.30",
     "metin": "Enjektör test cihazlarının bakımı düzenli olarak yapılıyor mu?"
    },
    {
     "no": "38.31",
     "metin": "Enjektör test cihazlarının kullanma talimatı var mı?"
    },
    {
     "no": "38.32",
     "metin": "Yedek parçalar ayrı muhafaza edilip etiketleniyor mu?"
    },
    {
     "no": "38.33",
     "metin": "Sehpaya alınmış motor bağlantılarının güvenliği sağlanmış mı?"
    },
    {
     "no": "38.34",
     "metin": "Motor parçalarının gösterildiği pano duvarda sabitlendi mi?"
    },
    {
     "no": "38.35",
     "metin": "Zımpara taşı ve matkapta çalışırken yeteri kadar güvenlik"
    },
    {
     "no": "38.36",
     "metin": "Yanıcı ve parlayıcı maddeler emniyet altında tutuluyor mu?"
    },
    {
     "no": "38.37",
     "metin": "Akü şarj cihazının yıllık kontrolü yapılıyor mu?"
    },
    {
     "no": "38.38",
     "metin": "Akü şarj cihazının kullanma talimatı var mı?"
    },
    {
     "no": "38.39",
     "metin": "Akü şarj cihazının bağlantıları kontrol ediliyor mu?"
    },
    {
     "no": "38.40",
     "metin": "Batarya test cihazlarının kalibrasyonu yıllık yapılıyor mu?"
    },
    {
     "no": "38.41",
     "metin": "Batarya test cihazlarının koruma kutusu var mı?"
    },
    {
     "no": "38.42",
     "metin": "Marş ve şarj sistemi test cihazlarının yıllık kontrolü yapılıyor mu?"
    },
    {
     "no": "38.43",
     "metin": "Ateşleme sistemi test cihazlarının kontrolü yapılıyor mu?"
    },
    {
     "no": "38.44",
     "metin": "Marş ve şarj sistemi test cihazlarının bağlantıları kontrol ediliyor mu?"
    },
    {
     "no": "38.45",
     "metin": "Ateşleme sistemi test cihazlarının bağlantıları düzenli olarak kontrol ediliyor mu?"
    },
    {
     "no": "38.46",
     "metin": "Aydınlatma sistemi maketleri muhafaza eriliyor mu?"
    },
    {
     "no": "38.47",
     "metin": "Asit ve elektrolit gibi kimyasal maddeler işaretli mi?"
    },
    {
     "no": "38.48",
     "metin": "Asit ve elektrolit gibi kimyasal maddeler uygun yerde muhafaza ediliyor mu?"
    },
    {
     "no": "38.49",
     "metin": "Duvarlarda asılı maketler varsa düşmeye karşı önlem alınmış mı?"
    },
    {
     "no": "38.50",
     "metin": "Yangın tüpü kontrolleri yapılmış mı?"
    },
    {
     "no": "38.51",
     "metin": "Yedek parçalar için uygun dolap hazırlanmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-39",
   "ad": "TAŞLAMA TEZGAHI KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "39.01",
     "metin": "Yan koruyucular testere çapının yüzde 75’ini içine alıyor mu?"
    },
    {
     "no": "39.02",
     "metin": "Dayanak, zımpara taşına 0,3 cm yakınlıkta mı?"
    },
    {
     "no": "39.03",
     "metin": "Zımpara taşı, dakika devir üst hızı, motor dakika devir üst hızıyla uyumlu mu?"
    },
    {
     "no": "39.04",
     "metin": "Makinaların, gerekli koruyucuları takılmış mı?"
    },
    {
     "no": "39.05",
     "metin": "Taşlama yapılacak malzemeye göre zımpara taş seçimi yapılıyor mu?"
    },
    {
     "no": "39.06",
     "metin": "Zımpara taşı takılmadan önce muayenesi yapılıyor mu?"
    },
    {
     "no": "39.07",
     "metin": "Ayak ile işletilen anahtarlar üzerine cisim düşmesi veya başka kişilerin kontrolsüz müdahalesine imkan vermemek üzere emniyete alınmış veya korunmuş mu?"
    },
    {
     "no": "39.08",
     "metin": "Vantilatörler yerden 2,1 mt'den daha yukarıda mı?"
    },
    {
     "no": "39.09",
     "metin": "Makinelerin temizliğinde basınçlı hava kullanılıyor mu?"
    },
    {
     "no": "39.10",
     "metin": "Basınçlı havayla temizlik yapılırken KKD' ler kullanılıyor mu?"
    },
    {
     "no": "39.11",
     "metin": "Taşlama tezgâhlarının kullanma talimatı var mı?"
    },
    {
     "no": "39.12",
     "metin": "Taşlama tezgâhlarının güç kaynaklarının bağlantıları düzenli olarak kontrol ediliyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-40",
   "ad": "KAYNAK-KESİM KAPLAMA İŞLERİ KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "40.01",
     "metin": "Kaynak, kesim ve pirinçle kaplama sırasında ortaya çıkan tehlikelere maruz kalabilecek personel ve öğrenciler korunmak için (göz ve yüz koruyucusu, eldiven, önlük ve gaz maskesi gibi) kişisel koruyucu donanım kullanıyor mu?"
    },
    {
     "no": "40.02",
     "metin": "Kaynak ve kesim işleminin yapıldığı yerde yeterli havalandırma var mı?"
    },
    {
     "no": "40.03",
     "metin": "Kaynak alanları yakın mesafede çalışanları korumak için paravan ile ayrılmış mı?"
    },
    {
     "no": "40.04",
     "metin": "Acil durumlarda kullanmak için uygun yangın söndürücüler var mı?"
    },
    {
     "no": "40.05",
     "metin": "Kaynak yapılacak ya da kesilecek cisim hareket ettirilemediğinde ve yangın tehlikesi olduğunda, ısı, curuf ve kıvılcımı önlemek için siper kullanılıyor mu?"
    },
    {
     "no": "40.06",
     "metin": "Sıcak bir işlem başlamadan önce kullanılmış davlumbazlar, variller, tanklar ve diğer kaplar parlayıcı, patlayıcı, ve zararlı gaz üretebilecek hiçbir madde kalmayacak şekilde temizleniyor mu?"
    },
    {
     "no": "40.07",
     "metin": "Sıkıştırılmış gaz tüpleri, valfler, bağlantılar, regülatörler, hortumlar; yağdan ve yağlı maddelerden arındırılmış mı?"
    },
    {
     "no": "40.08",
     "metin": "Sıkıştırılmış gaz tüpleri, valfler, bağlantılar, regülatörler, hortumlar gözle görülebilen arıza ve kusurlara karşı düzenli olarak denetleniyor mu?"
    },
    {
     "no": "40.09",
     "metin": "Elektrot uçları; yıpranma ve hasara karşı sıklıkla denetleniyor mu?"
    },
    {
     "no": "40.10",
     "metin": "Boşalmış ve kullanılmayan kaynak tüpleri tecrit ediliyor mu?"
    },
    {
     "no": "40.11",
     "metin": "Dolu tüpler için uygun yer ayrılmış mı?"
    },
    {
     "no": "40.12",
     "metin": "Tüplerin düşmesini önlemek için muhafaza kullanılıyor mu?"
    },
    {
     "no": "40.13",
     "metin": "Kaynak cinsine göre uygun söndürücü bulunuyor mu?"
    },
    {
     "no": "40.14",
     "metin": "Güvenlik araçları düzenli olarak kontrol ediliyor mu?"
    },
    {
     "no": "40.15",
     "metin": "Elektrik kaynak makinalarının kontrolü yapılıyor mu?"
    },
    {
     "no": "40.16",
     "metin": "Asetilen ve oksijen tüpleri muhafaza altında mı?"
    },
    {
     "no": "40.17",
     "metin": "Karpit depoları uygun özellikte mi?"
    },
    {
     "no": "40.18",
     "metin": "Asetilen kazanları uygun şekilde muhafaza ediliyor mu?"
    },
    {
     "no": "40.19",
     "metin": "Asetilen kazanlarının rutin kontrolleri yapılıyor mu?"
    },
    {
     "no": "40.20",
     "metin": "Kaynak elemanlarının düzenli kontrolü yapılıyor mu?"
    },
    {
     "no": "40.21",
     "metin": "Kaynak ışınlarının göze zarar vermesi durumunda yapılacaklar konusunda bilgi veriliyor mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-41",
   "ad": "VİNÇLER VE KALDIRMA MAKİNALARI KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "41.01",
     "metin": "Vinçler ve kaldırma makinaları çalışma mekanizmalarında, hidrolik sistemlerde, kancalarda ve sapanlarda oluşabilecek kolay tespit edilebilir arızalar yönünden her kullanımdan önce görsel olarak inceleniyor mu?"
    },
    {
     "no": "41.02",
     "metin": "Bütün gezer köprü elektrikli kaldırma makineleri, güvenli hareket edebileceği en alt ve en üst noktada durduracak bir sınırlama cihazına sahip mi?"
    },
    {
     "no": "41.03",
     "metin": "Her vinç için kaldırılmasına müsaade edilen en fazla yük miktarı okunaklı bir şekilde işaretlenmiş mi?"
    },
    {
     "no": "41.04",
     "metin": "Vinçler/Kaldırma makinaları kontrolleri seyir ve hareket yönünü gösterecek şekilde açıkça işaretlenmiş mi?"
    },
    {
     "no": "41.05",
     "metin": "Malzemeler kaldırılırken sapanlar ya da yük bağlantılarının kazayla kancalardan kurtulmasını önlemek amacıyla emniyet kilit mandalına sahip kancalar kullanılıyor mu?"
    },
    {
     "no": "41.06",
     "metin": "Güvenlik zincirleri, halatları, kelepçeleri veya sapanları kaldırma kapasiteleri belirlenmiş ve taşınacak yük için uygun mu?"
    },
    {
     "no": "41.07",
     "metin": "Malzeme veya ekipman kaldırılırken asılı yükün altında kimsenin bulunmamasını sağlayacak önlemler alınıyor mu?"
    },
    {
     "no": "41.08",
     "metin": "Forkliftleri yetkili kişiler kullanıyor mu?"
    },
    {
     "no": "41.09",
     "metin": "Forkliftler her kullanımdan önce muayene ediliyor mu?"
    },
    {
     "no": "41.10",
     "metin": "Kaldırma makinalarının yıllık testleri uygun kişiler tarafından yapılıyor mu?"
    },
    {
     "no": "41.11",
     "metin": "Kaldırma araçlarında (aletlerinde) aşınmış, çatlamış, kırılmış parçalar değiştiriliyor mu?"
    },
    {
     "no": "41.12",
     "metin": "Makinaların etrafındaki zemin kaymaya karşı tedbir alınmış mı?"
    },
    {
     "no": "41.13",
     "metin": "Kaldırma makinaları kapasitelerine uygun kullanılıyor mu?"
    },
    {
     "no": "41.14",
     "metin": "Kaldırma makinalarını kullanacak personele eğitim veriliyor mu?"
    },
    {
     "no": "41.15",
     "metin": "Kaldırma makinalarının kullanma talimatı var mı?"
    },
    {
     "no": "41.16",
     "metin": "Forklifler fosil yakıt ile çalışıyorsa çıkan egzoz gazlarının zararlı etkisi için önlem alınıyor mu?"
    },
    {
     "no": "41.17",
     "metin": "Taşıyıcı halatların periyodik muayeneleri yapılıyor mu?"
    },
    {
     "no": "41.18",
     "metin": "Tehlikeli durumlar için hareketli dikkat çekici şerit bez asılmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-42",
   "ad": "İŞ İSTASYONU VEYA TEZGÂHI KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "42.01",
     "metin": "Çalışma yüksekliği çalışanın dirsek hizasında veya biraz altında mı?"
    },
    {
     "no": "42.02",
     "metin": "Çalışma tezgâhı genç insana göre tasarlanmış mı?"
    },
    {
     "no": "42.03",
     "metin": "Sıklıkla kullanılan ekipmana kolay erişim sağlanıyor mu?"
    },
    {
     "no": "42.04",
     "metin": "İnce iş yapılan tezgâhlar ile güç gerektiren işler yapılan tezgâhlar işin özelliklerine göre mi?"
    },
    {
     "no": "42.05",
     "metin": "Tezgâh hem ayakta hem de oturarak iş yapmaya olanak sağlıyor mu?"
    },
    {
     "no": "42.06",
     "metin": "Küçük ve büyük çalışma parçaları arasında çalışma gerçekleşen tezgâhlar ayarlanabilir özellikte mi?"
    },
    {
     "no": "42.07",
     "metin": "İşi yapanların tasarım konusunda fikirleri alınıyor mu?"
    },
    {
     "no": "42.08",
     "metin": "Güvenlik kuralları ve talimatları içeren panolar çalışma istasyonuna yakın mı?"
    },
    {
     "no": "42.09",
     "metin": "Makine koruyucuları uygun olarak kullanılıyor mu?"
    },
    {
     "no": "42.10",
     "metin": "Tezgâhın kullanma talimatı var mı?"
    },
    {
     "no": "42.11",
     "metin": "Tezgâhtan sorumlu personel görevlendirilmiş mi?"
    },
    {
     "no": "42.12",
     "metin": "Tezgâhların tehlike durumunda uzaktan durdurma sistemi var mı?"
    },
    {
     "no": "42.13",
     "metin": "Makinaların emniyetli çalışma alanı belirlenmiş mi?"
    },
    {
     "no": "42.14",
     "metin": "Tezgâh kabin içi ışıklandırma uygun mu?"
    },
    {
     "no": "42.15",
     "metin": "Tezgâhın elektrik bağlantısı yalıtımı uygun mu?"
    },
    {
     "no": "42.16",
     "metin": "Tezgâh kapıları sağlam mı, emniyetli mi?"
    },
    {
     "no": "42.17",
     "metin": "Tezgâh çalıştırma talimatı var mı?"
    },
    {
     "no": "42.18",
     "metin": "Acil stop anahtarı var mı?"
    },
    {
     "no": "42.19",
     "metin": "Tezgâh çevre temizliği yapılıyor mu?"
    },
    {
     "no": "42.20",
     "metin": "Çalışma ortamı öğrencilerin görebilmesi için uygun mu?"
    },
    {
     "no": "42.21",
     "metin": "Öğrencilerin boylarına göre tezgâh çalışma planı yapılmış mı?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  },
  {
   "kod": "KL-43",
   "ad": "MAKİNALARIN HAREKETLİ PARÇALARI KONTROL LİSTESİ (MESLEKİ VE TEKNİK OKULLAR)",
   "maddeler": [
    {
     "no": "43.01",
     "metin": "Güvenliği sağlanmamış hareketli parçaları bulunan makinalar için gerekli önlem alınmış mı? (kayışlar, zincirler, kesiciler, tornalar, deliciler, biçiciler, eğme presleri, şekillendiriciler, bükücüler, vs.)"
    },
    {
     "no": "43.02",
     "metin": "Makine çalışırken tehlike bölgesinde insanların olmamasına dikkat ediliyor mu?"
    },
    {
     "no": "43.03",
     "metin": "Makine koruyucuları çalışanların ellerinin, kollarının, ya da diğer vücut kısımlarının tehlikeli hareketli parçalarla temas etmesini yeterli ölçüde engelliyor mu?"
    },
    {
     "no": "43.04",
     "metin": "Makinelerin koruyucu parçaları sıkı bir şekilde sabitlenmiş ve yerlerinden kolayca çıkarılmaları engellenmiş mi?"
    },
    {
     "no": "43.05",
     "metin": "Makinenin hareketli parçası üzerine herhangi bir nesnenin düşme tehlikesi önlenmiş mi?"
    },
    {
     "no": "43.06",
     "metin": "Kullanılan makine koruyucuları makinenin işleyişini bozmayacak ve güçleştirmeyecek şekilde montajlanmış mı?"
    },
    {
     "no": "43.07",
     "metin": "Koruyucu parçaları çıkarmadan makine yağlanabiliyor mu?"
    },
    {
     "no": "43.08",
     "metin": "Makinenin hareketli parçaları, hareket halinde iken, koruyucuların çıkarılması önleniyor mu?"
    },
    {
     "no": "43.09",
     "metin": "Operatörün açma/kapama kontrollerine kolayca ulaşması mümkün mü?"
    },
    {
     "no": "43.10",
     "metin": "Birden fazla operatörün kullandığı cihazlarda tek bir kontrol mekanizması var mı?"
    },
    {
     "no": "43.11",
     "metin": "Makine ve atölyede kaçak akım rölesi var mı?"
    },
    {
     "no": "43.12",
     "metin": "Zorlama anında makine otomatik olarak duruyor mu?"
    },
    {
     "no": "43.13",
     "metin": "Şartel manyetik mi?"
    },
    {
     "no": "43.14",
     "metin": "Makine yere (zemine) sabitlenmiş mi ve teraziye alınmış mı?"
    },
    {
     "no": "43.15",
     "metin": "Makinelerin tehlike durumunda otomatik stop sistemi var mı?"
    },
    {
     "no": "43.16",
     "metin": "Makine koruyucuları uygun aralıkta mı?"
    },
    {
     "no": "43.17",
     "metin": "Çalışanların operasyon noktasına (makinanın) ulaşması engelleniyor mu? (Gerekli emniyet tedbirleri alınıyor mu?)"
    },
    {
     "no": "43.18",
     "metin": "Tehlike durumunda makinalarda acil durdurma butonu var mı?"
    },
    {
     "no": "43.19",
     "metin": "İş kazalarını önlemek için çalışan makinalarda çift emniyet kullanılıyor mu?"
    },
    {
     "no": "43.20",
     "metin": "Makinaların kullanma talimatı var mı?"
    },
    {
     "no": "43.21",
     "metin": "Makinaların periyodik bakımı yapılıyor mu?"
    },
    {
     "no": "43.22",
     "metin": "Makinalar arasındaki mesafe yönetmeliğe uygun mu?"
    },
    {
     "no": "43.23",
     "metin": "Makina çalışma alanı uygun çizgilerle belirtilmiş mi?"
    },
    {
     "no": "43.24",
     "metin": "Makinaya güç veren (elektrik, hidrolik, vb.) bağlantıları"
    },
    {
     "no": "43.25",
     "metin": "Tezgâh temizliği emniyetli olarak yapılabiliyor mu?"
    },
    {
     "no": "43.26",
     "metin": "Ağır iş parçalarının taşıma emniyeti sağlanıyor mu?"
    },
    {
     "no": "43.27",
     "metin": "Operatörle iş parçası arasında emniyet mesafesi uygun mu?"
    },
    {
     "no": "43.28",
     "metin": "Çıkan talaşların atölyeye dağılması engelleniyor mu?"
    },
    {
     "no": "43.29",
     "metin": "Hareketli kısımlar muhafazalı mı?"
    },
    {
     "no": "43.30",
     "metin": "Acil durdurma butonları var mı?"
    },
    {
     "no": "43.31",
     "metin": "İş parçası bağlama sistemleri yeteri derecede emniyetli mi?"
    },
    {
     "no": "43.32",
     "metin": "Kesici bağlama sistemleri yeterince emniyetli mi?"
    },
    {
     "no": "43.33",
     "metin": "Hareketli parça üzerine güvenlik boyası vuruldu mu?"
    }
   ],
   "kaynak": "dis",
   "grup": "MEB Kontrol Listeleri"
  }
 ],
 "mekanlar": [
  {
   "ad": "Tüm atölye ve alanlar (ortak)",
   "tur": "ortak",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE1 · Haberleşme ve Görüntü Sistemleri",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE2 · Elektrik Tesisat",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE4 · Elektrik Tesisat",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE5 · Zayıf Akım ve Güvenlik Sistemleri",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE6 · Pano Montaj",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE7 · Endüstriyel Elektronik ve Tesisat",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE9 · Bilgisayar Laboratuvarı",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE10 · Otomasyon (PLC)",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE12 · Elektrik Tesisat ve Kablo Testi",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE13 · Elektrik Makineleri ve Kumanda",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE14 · Hidrolik-Pnömatik ve Proses",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "ELE15 · Kumanda, Motor ve Kompanzasyon",
   "tur": "atolye",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "Elektronik deposu",
   "tur": "depo",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "Elektrik deposu",
   "tur": "depo",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "Öğrenci tuvaleti (KL-11)",
   "tur": "islak",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "Öğretmen odaları (2)",
   "tur": "ofis",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
   "ad": "Şef odası (1)",
   "tur": "ofis",
   "bina": "",
   "alan": "Elektrik-Elektronik Teknolojisi",
   "satirlar": [
    {
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
 ]
};
  kok.RiskPrime = Object.assign({}, kok.RiskPrime, { kutuphane: veri });
})(typeof window !== 'undefined' ? window : globalThis);
