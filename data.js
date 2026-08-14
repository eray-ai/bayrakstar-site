/* ============================================================
   BAYRAKSTAR — Site İçerik Verisi
   Admin panelinden "JSON indir" ile güncellenmiş içerik buraya işlenir.
   ============================================================ */
/* ============================================================
   ADRES YARDIMCILARI — TEK KAYNAK
   ------------------------------------------------------------
   Radyo ve yayıncı sayfalarının adresi burada üretilir. Sebep:
   sosyal medya ön izleme botları JavaScript ÇALIŞTIRMAZ, bu yüzden
   "radyo.html?r=fenomen" gibi sorgu parametreli tek dosya her radyo
   için AYNI paylaşım kartını gösteriyordu. Artık her radyo/yayıncı
   kendi klasöründe statik sayfaya sahip (araclar/statik-uret.py).

   Eski "radyo.html?r=<slug>" adresleri ÇALIŞMAYA DEVAM EDER —
   daha önce paylaşılmış linkler kırılmasın diye bilerek korundu.
   ============================================================ */
window.URLRadyo = function (slug) {
  return slug ? ('r/' + encodeURIComponent(slug) + '/') : '';
};
window.URLYayinci = function (radyoSlug, hostSlug) {
  return 'y/' + encodeURIComponent(radyoSlug) + '-' + encodeURIComponent(hostSlug) + '/';
};

window.DEFAULT_DATA = {
  "hero": {
    "kicker": "BAYRAKSTAR MEDYA GRUBU",
    "title1": "Sesin ",
    "accent": "Rengi",
    "title2": "Burada",
    "slogan": "colorful <b>life</b>"
  },
  "slides": [
    "gorseller/genis-1.jpg",
    "gorseller/genis-6.jpg",
    "gorseller/genis-3.jpg",
    "gorseller/genis-4.jpg"
  ],
  "slogans": [
    "Radyo Fenomen",
    "Fenomen Türk",
    "Radyo Boombox",
    "İstanbul FM"
  ],
  "intro": {
    "tag": "Bayrakstar Çatısı",
    "headline": "Birçok radyo,<br><span class=\"c\">tek bir çatı</span> altında.",
    "p1": "Bayrakstar; birbirinden farklı hedef kitlelere hitap eden radyolarını aynı yayın gücü, teknolojisi ve kalitesiyle bir araya getiren bir marka evidir. Her radyomuz kendi kimliğini, kendi rengini ve kendi dinleyicisini korurken; ortak bir yayın anlayışını paylaşır.",
    "p2": "Maksimum hit müzikten Türkçe pop'a, eğlenceden sokağın enerjisine — Bayrakstar çatısı altındaki her frekans, ayrı bir hikâye anlatır. <b>colorful life.</b>",
    "stats": [
      {
        "num": "4",
        "label": "Radyo Markası",
        "color": "#ff0007"
      },
      {
        "num": "7/24",
        "label": "Canlı Yayın",
        "color": "#00bac5"
      },
      {
        "num": "1M+",
        "label": "Aylık Dinleyici",
        "color": "#0081ba"
      },
      {
        "num": "∞",
        "label": "Renkli Yayın",
        "color": "#ffca11"
      }
    ]
  },
  "radios": [
    {
      "name": "Radyo Fenomen",
      "slug": "fenomen",
      "logo": "logo/fenomen-beyaz.png",
      "logoColor": "logo/fenomen-renkli.png",
      "slogan": "Maksimum Hit Müzik",
      "genre": "Yabancı Hit Müzik · Pop · Dance",
      "freq": "100.4",
      "color": "#ff0007",
      "accent": "#989a9d",
      "font": "Gosha Sans",
      "bodyFont": "Roboto",
      "ink": "#ffffff",
      "url": "https://www.radyofenomen.com",
      "apps": {"ios":"https://apps.apple.com/tr/app/id447790493","android":"https://play.google.com/store/apps/details?id=com.radyofenomen","carplay":true,"androidauto":true},
      "stream": "https://live.radyofenomen.com/fenomen/128/icecast.audio",
      "img": "gorseller/kart-fenomen.jpg",
      "hero": "gorseller/genis-1.jpg",
      "about": "Radyo Fenomen, Türkiye’nin en çok dinlenen yabancı müzik kanalıdır. “Maksimum Hit Müzik” mottosuyla dünyanın en yeni hitlerini ve en enerjik listelerini 7/24 yayınlar. Fenomen İlk 40 listesi, Clubbin’ elektronik setleri ve onlarca alt kanalıyla her zevke hitap eder.",
      "hosts": [
        {
          "name": "Serdar",
          "slug": "serdar",
          "about": "Serdar, Radyo Fenomen ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Serdar’la Sabah Modu, Radyo Fenomen’de 07:00 – 10:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Serdar’la Sabah Modu",
          "bio": "Güne enerjik bir başlangıç; sabahın en keyifli müzikleri ve gündemi Serdar’la.",
          "photo": "yayincilar/fenomen-serdar.jpg",
          "afis": true
        },
        {
          "name": "Doğanay",
          "slug": "doganay",
          "about": "Doğanay, Radyo Fenomen ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Doğanay’ın Dünyası, Radyo Fenomen’de 10:00 – 12:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Doğanay’ın Dünyası",
          "bio": "Kuşağın en renkli saatleri; müzik, sohbet ve Doğanay’ın dünyasından kesitler.",
          "photo": "yayincilar/fenomen-doganay.jpg",
          "afis": true
        },
        {
          "name": "DJ K-Billy",
          "slug": "dj-k-billy",
          "about": "DJ K-Billy, Radyo Fenomen ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "DJ K-Billy’le Fenomen Hit Müzik, Radyo Fenomen’de 13:00 – 16:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "DJ K-Billy’le Fenomen Hit Müzik",
          "bio": "Öğleden sonra tempoyu yükselten, en taze hit müzik seti.",
          "photo": "yayincilar/fenomen-dj-k-billy.jpg",
          "afis": true
        },
        {
          "name": "Deniz Görkem",
          "slug": "deniz-gorkem",
          "about": "Deniz Görkem, Radyo Fenomen ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Deniz Görkem’le Update, Radyo Fenomen’de 17:00 – 20:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Deniz Görkem’le Update",
          "bio": "Günün en yeni hitleri ve gündem, akşamüstü Deniz Görkem’le.",
          "photo": "yayincilar/fenomen-deniz-gorkem.jpg",
          "afis": true
        }
      ],
      "schedule": [
        {
          "t": "00:00 – 07:00",
          "name": "Maksimum Hit Müzik"
        },
        {
          "t": "07:00 – 10:00",
          "name": "Serdar’la Sabah Modu",
          "host": "Serdar Koçak",
          "img": "yayincilar/fenomen-serdar.jpg"
        },
        {
          "t": "10:00 – 13:00",
          "name": "Maksimum Hit Müzik"
        },
        {
          "t": "13:00 – 16:00",
          "name": "DJ K-Billy’le Fenomen Hit Müzik",
          "host": "Onur Kaymak",
          "img": "yayincilar/fenomen-dj-k-billy.jpg"
        },
        {
          "t": "16:00 – 17:00",
          "name": "Maksimum Hit Müzik"
        },
        {
          "t": "17:00 – 20:00",
          "name": "Deniz Görkem’le Update",
          "host": "Deniz Görkem Kaya",
          "img": "yayincilar/fenomen-deniz-gorkem.jpg"
        },
        {
          "t": "20:00 – 00:00",
          "name": "Maksimum Hit Müzik"
        }
      ],
      "weekendNote": "Hafta sonu: Serdar’la Fenomen 2010’lar, Fenomen Cafe ve Fenomen İlk 40 gibi özel programlar yayınlanır.",
      "channels": [
        "Fenomen Akustik",
        "Fenomen Pop",
        "Fenomen Dans",
        "Fenomen Rap",
        "Fenomen Oriental",
        "Fenomen Karışık",
        "Fenomen Clubbin"
      ],
      "frequencies": [
        {
          "c": "İstanbul",
          "f": "100.4"
        },
        {
          "c": "Ankara",
          "f": "98.8"
        },
        {
          "c": "İzmir",
          "f": "98.0"
        },
        {
          "c": "Bursa",
          "f": "100.4"
        },
        {
          "c": "Antalya",
          "f": "96.0"
        },
        {
          "c": "Gaziantep",
          "f": "97.1"
        },
        {
          "c": "Konya",
          "f": "102.5"
        },
        {
          "c": "Eskişehir",
          "f": "95.0"
        },
        {
          "c": "Kocaeli",
          "f": "92.4"
        },
        {
          "c": "Balıkesir",
          "f": "87.5"
        }
      ],
      "social": {
        "ig": "https://instagram.com/radyofenomen",
        "x": "https://twitter.com/radyofenomen",
        "yt": "https://youtube.com/radyofenomen",
        "tiktok": "https://tiktok.com/@radyofenomen",
        "fb": "https://facebook.com/radyofenomen"
      },
      "scheduleGun": {
        "4": [
          {
            "t": "00:00 – 07:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "07:00 – 10:00",
            "name": "Serdar’la Sabah Modu",
            "host": "Serdar Koçak",
            "img": "yayincilar/fenomen-serdar.jpg"
          },
          {
            "t": "10:00 – 13:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "13:00 – 16:00",
            "name": "DJ K-Billy’le Fenomen Hit Müzik",
            "host": "Onur Kaymak",
            "img": "yayincilar/fenomen-dj-k-billy.jpg"
          },
          {
            "t": "16:00 – 17:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "17:00 – 20:00",
            "name": "Deniz Görkem’le Update",
            "host": "Deniz Görkem Kaya",
            "img": "yayincilar/fenomen-deniz-gorkem.jpg"
          },
          {
            "t": "20:00 – 21:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "21:00 – 22:00",
            "name": "Underground Boutique",
            "host": "Yunus Özyavuz"
          },
          {
            "t": "22:00 – 23:00",
            "name": "Underground Boutique",
            "host": "DJ U.F.U.K"
          },
          {
            "t": "23:00 – 00:00",
            "name": "Underground Boutique",
            "host": "Ahmet Şendil"
          }
        ],
        "5": [
          {
            "t": "00:00 – 01:00",
            "name": "Fenomen Clubbin’",
            "host": "DJ K-Billy",
            "img": "yayincilar/fenomen-dj-k-billy.jpg"
          },
          {
            "t": "01:00 – 02:00",
            "name": "La Casa Del Ritmo",
            "host": "Fattish"
          },
          {
            "t": "02:00 – 03:00",
            "name": "Flow",
            "host": "Fatih Doğan"
          },
          {
            "t": "03:00 – 10:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "10:00 – 11:00",
            "name": "Serdar’la Fenomen 2010’lar",
            "host": "Serdar Koçak",
            "img": "yayincilar/fenomen-serdar.jpg"
          },
          {
            "t": "11:00 – 13:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "13:00 – 14:00",
            "name": "Serdar’la Fenomen Cafe",
            "host": "Serdar Koçak",
            "img": "yayincilar/fenomen-serdar.jpg"
          },
          {
            "t": "14:00 – 15:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "15:00 – 17:00",
            "name": "Fenomen İlk 40"
          },
          {
            "t": "17:00 – 21:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "21:00 – 22:00",
            "name": "No Room",
            "host": "VES & NES"
          },
          {
            "t": "22:00 – 23:00",
            "name": "The Vibe",
            "host": "Tuba Lüleci Alaçam"
          },
          {
            "t": "23:00 – 00:00",
            "name": "Back To The Future",
            "host": "İlkay Şencan"
          }
        ],
        "6": [
          {
            "t": "00:00 – 01:00",
            "name": "Sound Pool",
            "host": "Serhan Sabanlar"
          },
          {
            "t": "01:00 – 02:00",
            "name": "Panorama",
            "host": "Tan Atalar"
          },
          {
            "t": "02:00 – 03:00",
            "name": "Global Mix",
            "host": "Bilgehan Başkan"
          },
          {
            "t": "03:00 – 10:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "10:00 – 11:00",
            "name": "Serdar’la Fenomen 2010’lar",
            "host": "Serdar Koçak",
            "img": "yayincilar/fenomen-serdar.jpg"
          },
          {
            "t": "11:00 – 12:00",
            "name": "Serdar’la Fenomen Cafe",
            "host": "Serdar Koçak",
            "img": "yayincilar/fenomen-serdar.jpg"
          },
          {
            "t": "12:00 – 13:00",
            "name": "Maksimum Hit Müzik"
          },
          {
            "t": "13:00 – 15:00",
            "name": "Fenomen İlk 40"
          },
          {
            "t": "15:00 – 00:00",
            "name": "Maksimum Hit Müzik"
          }
        ]
      }
    },
    {
      "name": "Fenomen Türk",
      "slug": "fenomenturk",
      "logo": "logo/fenomenturk-beyaz.png",
      "logoColor": "logo/fenomenturk-renkli.png",
      "slogan": "Eğlence ve Müzik",
      "genre": "Türkçe Pop · Eğlence",
      "freq": "101.0",
      "color": "#0058c2",
      "accent": "#ff0007",
      "font": "Gosha Sans",
      "bodyFont": "Roboto",
      "ink": "#ffffff",
      "url": "https://www.fenomenturk.com",
      "apps": {"ios":"","android":"","carplay":false,"androidauto":false},
      "stream": "https://live.radyofenomen.com/fenomenturk/128/icecast.audio",
      "img": "gorseller/kart-fenomenturk.jpg",
      "hero": "gorseller/genis-6.jpg",
      "about": "Fenomen Türk, en sevilen Türkçe şarkıları eğlenceyle harmanlayan radyodur. “Eğlence ve Müzik” anlayışıyla sevilen seslerin programlarıyla gününüze eşlik eder; sıcak, samimi ve keyifli bir yayın.",
      "hosts": [
        {
          "name": "Tansu Çağlayan",
          "slug": "tansu-caglayan",
          "about": "Tansu Çağlayan, Fenomen Türk ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Tansu Çağlayan’la Yeni Gün, Fenomen Türk’te 07:00 – 10:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Tansu Çağlayan’la Yeni Gün",
          "photo": "yayincilar/fenomenturk-tansu-caglayan.jpg",
          "bio": "Güne Türkçe müziğin en güzel şarkıları ve pozitif enerjiyle başla.",
          "afis": true
        },
        {
          "name": "Doğanay Cireli",
          "slug": "doganay-cireli",
          "about": "Doğanay Cireli, Fenomen Türk ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Doğanay’ın Dünyası, Fenomen Türk’te 10:00 – 12:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Doğanay’ın Dünyası",
          "photo": "yayincilar/fenomenturk-doganay-cireli.jpg",
          "bio": "Kuşağın en renkli saatleri; müzik ve sohbet Doğanay’la.",
          "afis": true
        },
        {
          "name": "Ömer Erişmen",
          "slug": "omer-erismen",
          "about": "Ömer Erişmen, Fenomen Türk ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Ömer Erişmen’le Extra, Fenomen Türk’te 13:00 – 15:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Ömer Erişmen’le Extra",
          "photo": "yayincilar/fenomenturk-omer-erismen.jpg",
          "bio": "Öğleden sonraya keyif katan sohbet ve müzik.",
          "afis": true
        },
        {
          "name": "Mert Üzülmez",
          "slug": "mert-uzulmez",
          "about": "Mert Üzülmez, Fenomen Türk ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Mert’le Perde Arkası, Fenomen Türk’te 15:00 – 18:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Mert’le Perde Arkası",
          "photo": "yayincilar/fenomenturk-mert-uzulmez.jpg",
          "bio": "Magazinin ve müziğin perde arkası Mert’le.",
          "afis": true
        },
        {
          "name": "Murat Özsoy",
          "slug": "murat-ozsoy",
          "about": "Murat Özsoy, Fenomen Türk ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Murat Özsoy’la Şarzzz, Fenomen Türk’te 18:00 – 20:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Murat Özsoy’la Şarzzz",
          "photo": "yayincilar/fenomenturk-murat-ozsoy.jpg",
          "bio": "Akşama girerken enerjini şarj eden program.",
          "afis": true
        }
      ],
      "schedule": [
        {
          "t": "00:00 – 07:00",
          "name": "Eğlence ve Müzik"
        },
        {
          "t": "07:00 – 10:00",
          "name": "Tansu Çağlayan’la Yeni Gün",
          "host": "Tansu Çağlayan",
          "img": "yayincilar/fenomenturk-tansu-caglayan.jpg"
        },
        {
          "t": "10:00 – 12:00",
          "name": "Doğanay’ın Dünyası",
          "host": "Doğanay Cireli",
          "img": "yayincilar/fenomenturk-doganay-cireli.jpg"
        },
        {
          "t": "12:00 – 13:00",
          "name": "Eğlence ve Müzik"
        },
        {
          "t": "13:00 – 15:00",
          "name": "Ömer Erişmen’le Extra",
          "host": "Ömer Erişmen",
          "img": "yayincilar/fenomenturk-omer-erismen.jpg"
        },
        {
          "t": "15:00 – 18:00",
          "name": "Mert’le Perde Arkası",
          "host": "Mert Üzülmez",
          "img": "yayincilar/fenomenturk-mert-uzulmez.jpg"
        },
        {
          "t": "18:00 – 20:00",
          "name": "Murat Özsoy’la Şarzzz",
          "host": "Murat Özsoy",
          "img": "yayincilar/fenomenturk-murat-ozsoy.jpg"
        },
        {
          "t": "20:00 – 00:00",
          "name": "Eğlence ve Müzik"
        }
      ],
      "weekendNote": "Cuma & hafta sonu: Retro Hit DJ Set, Fenomen Türk İlk 20 gibi özel programlar yayınlanır.",
      "frequencies": [
        {
          "c": "İstanbul",
          "f": "101.0"
        },
        {
          "c": "Ankara",
          "f": "99.5"
        },
        {
          "c": "İzmir",
          "f": "99.5"
        },
        {
          "c": "Bursa",
          "f": "94.7"
        }
      ],
      "social": {
        "ig": "https://instagram.com/radyofenomenturk",
        "x": "https://twitter.com/fenomen_turk",
        "fb": "https://facebook.com/fenomenturk"
      },
      "scheduleGun": {
        "4": [
          {
            "t": "00:00 – 07:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "07:00 – 10:00",
            "name": "Tansu Çağlayan’la Yeni Gün",
            "host": "Tansu Çağlayan",
            "img": "yayincilar/fenomenturk-tansu-caglayan.jpg"
          },
          {
            "t": "10:00 – 12:00",
            "name": "Doğanay’ın Dünyası",
            "host": "Doğanay Cireli",
            "img": "yayincilar/fenomenturk-doganay-cireli.jpg"
          },
          {
            "t": "12:00 – 13:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "13:00 – 15:00",
            "name": "Ömer Erişmen’le Extra",
            "host": "Ömer Erişmen",
            "img": "yayincilar/fenomenturk-omer-erismen.jpg"
          },
          {
            "t": "15:00 – 18:00",
            "name": "Mert’le Perde Arkası",
            "host": "Mert Üzülmez",
            "img": "yayincilar/fenomenturk-mert-uzulmez.jpg"
          },
          {
            "t": "18:00 – 20:00",
            "name": "Murat Özsoy’la Şarzzz",
            "host": "Murat Özsoy",
            "img": "yayincilar/fenomenturk-murat-ozsoy.jpg"
          },
          {
            "t": "20:00 – 21:00",
            "name": "Deniz Görkem’le Sahnedekiler",
            "host": "Deniz Görkem Kaya",
            "img": "yayincilar/fenomenturk-deniz-gorkem-kaya.jpg"
          },
          {
            "t": "21:00 – 23:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "23:00 – 00:00",
            "name": "Retro Hit (Tansu Çağlayan DJ Set)",
            "host": "Tansu Çağlayan",
            "img": "yayincilar/fenomenturk-tansu-caglayan.jpg"
          }
        ],
        "5": [
          {
            "t": "00:00 – 11:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "11:00 – 13:00",
            "name": "Doğanay’ın Dünyası",
            "host": "Doğanay Cireli",
            "img": "yayincilar/fenomenturk-doganay-cireli.jpg"
          },
          {
            "t": "13:00 – 16:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "16:00 – 17:00",
            "name": "Fenomen Türk İlk 20"
          },
          {
            "t": "17:00 – 23:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "23:00 – 00:00",
            "name": "Retro Hit (Tansu Çağlayan DJ Set)",
            "host": "Tansu Çağlayan",
            "img": "yayincilar/fenomenturk-tansu-caglayan.jpg"
          }
        ],
        "6": [
          {
            "t": "00:00 – 12:00",
            "name": "Eğlence ve Müzik"
          },
          {
            "t": "12:00 – 15:00",
            "name": "Mert’le Perde Arkası",
            "host": "Mert Üzülmez",
            "img": "yayincilar/fenomenturk-mert-uzulmez.jpg"
          },
          {
            "t": "15:00 – 16:00",
            "name": "Fenomen Türk İlk 20"
          },
          {
            "t": "16:00 – 00:00",
            "name": "Eğlence ve Müzik"
          }
        ]
      }
    },
    {
      "name": "Radyo Boombox",
      "slug": "boombox",
      "logo": "logo/boombox-beyaz.png",
      "logoColor": "logo/boombox-renkli.png",
      "slogan": "Aç Sesini",
      "genre": "Türkçe Rap · Trap · Hip-Hop · R&B",
      "freq": "100.2",
      "color": "#ffca11",
      "accent": "#111111",
      "accent2": "#00ff00",
      "font": "Straight Fighter",
      "bodyFont": "Montserrat",
      "ink": "#ffffff",
      "url": "https://www.radyoboombox.com.tr",
      "apps": {"ios":"https://apps.apple.com/tr/app/id6450677238","android":"https://play.google.com/store/apps/details?id=com.radyoboombox","carplay":true,"androidauto":true},
      "stream": "https://yayin.radyoboombox.com.tr/boombox/playlist.m3u8",
      "img": "gorseller/kart-boombox.jpg",
      "hero": "gorseller/genis-4.jpg",
      "about": "Radyo BoomBox; Rap, Trap, R’n’B ve Hip-Hop’un adresidir. “Aç Sesini” diyerek sokağın enerjisini ve en taze beat’leri yayına taşır. EYPIO, LARK2020, ERAY067 ve daha nicesi BoomBox listelerinde. Rumeli Reklam ve Radyo Yayıncılık A.Ş. bünyesindedir.",
      "hosts": [],
      "schedule": [
        {
          "t": "00:00 – 10:00",
          "name": "Freestyle",
          "img": "programlar/boombox-freestyle.jpg"
        },
        {
          "t": "10:00 – 16:00",
          "name": "Acil İstek Hattı",
          "img": "programlar/boombox-acil-istek-hatti.jpg"
        },
        {
          "t": "16:00 – 00:00",
          "name": "Freestyle",
          "img": "programlar/boombox-freestyle.jpg"
        }
      ],
      "frequencies": [
        {
          "c": "İstanbul",
          "f": "100.2"
        }
      ],
      "company": "Rumeli Reklam ve Radyo Yayıncılık A.Ş.",
      "social": {},
      "scheduleGun": {}
    },
    {
      "name": "İstanbul FM",
      "slug": "istanbulfm",
      "logo": "logo/istanbulfm-beyaz.png",
      "logoColor": "logo/istanbulfm-renkli.png",
      "slogan": "Senin İçin",
      "genre": "Türkçe Pop · Slow · Nostalji",
      "freq": "88.6",
      "color": "#0081ba",
      "accent": "#ff5959",
      "font": "Nebulica",
      "bodyFont": "Nunito",
      "ink": "#ffffff",
      "url": "https://www.istanbulfm.com.tr",
      "apps": {"ios":"https://apps.apple.com/tr/app/id1463801479","android":"https://play.google.com/store/apps/details?id=com.radioistanbulfm","carplay":true,"androidauto":true},
      "stream": "https://yayin.istanbulfm.com.tr/istanbulfm/playlist.m3u8",
      "img": "gorseller/kart-istanbulfm.jpg",
      "hero": "gorseller/genis-5.jpg",
      "about": "İstanbul FM, Türkçe müziğin kalbidir. “Senin İçin” sloganıyla pop, slow, nostalji, akustik, fantezi ve alaturka kanallarında şehrin ritmini en güzel şarkılarla buluşturur. “İstanbul’u dinliyorum” diyen herkesin radyosu.",
      "hosts": [
        {
          "name": "Emre Mutlu",
          "slug": "emre-mutlu",
          "about": "Emre Mutlu, İstanbul FM ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Emre Mutlu Show, İstanbul FM’de 07:00 – 10:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Emre Mutlu Show",
          "photo": "yayincilar/istanbulfm-emre-mutlu.jpg",
          "bio": "Sabahları İstanbul’a keyifli bir başlangıç; müzik ve sohbet Emre Mutlu’yla.",
          "afis": true
        },
        {
          "name": "Yalçın Alaca",
          "slug": "yalcin-alaca",
          "about": "Yalçın Alaca, İstanbul FM ekibinin mikrofon arkasındaki isimlerinden. Ayrıntılı tanıtım yazısı yakında bu bölümde olacak.",
          "program": "Yalçın.Net, İstanbul FM’de 14:00 – 16:00 saatleri arasında yayında.",
          "cover": "",
          "gallery": [],
          "show": "Yalçın.Net",
          "photo": "yayincilar/istanbulfm-yalcin-alaca.jpg",
          "bio": "Öğleden sonra Türkçe pop’un en iyileri Yalçın Alaca’yla.",
          "afis": true
        }
      ],
      "schedule": [
        {
          "t": "00:00 – 07:00",
          "name": "Kesintisiz Müzik",
          "img": "programlar/istanbulfm-kesintisiz.jpg"
        },
        {
          "t": "07:00 – 10:00",
          "name": "Emre Mutlu Show",
          "host": "Emre Mutlu",
          "img": "yayincilar/istanbulfm-emre-mutlu.jpg"
        },
        {
          "t": "10:00 – 14:00",
          "name": "İstanbul FM En İyiler",
          "img": "programlar/istanbulfm-en-iyiler.jpg"
        },
        {
          "t": "14:00 – 16:00",
          "name": "Yalçın.Net",
          "host": "Yalçın Alaca",
          "img": "yayincilar/istanbulfm-yalcin-alaca.jpg"
        },
        {
          "t": "16:00 – 17:00",
          "name": "Nerede O Eski Şarkılar?",
          "img": "programlar/istanbulfm-nerede-o-eski-sarkilar.jpg"
        },
        {
          "t": "17:00 – 00:00",
          "name": "İstanbul FM En İyiler",
          "img": "programlar/istanbulfm-en-iyiler.jpg"
        }
      ],
      "channels": [
        "İstanbul FM Slow",
        "İstanbul FM Nostalji",
        "İstanbul FM Akustik",
        "İstanbul FM Fantezi",
        "İstanbul FM Alaturka"
      ],
      "frequencies": [
        {
          "c": "İstanbul",
          "f": "88.6"
        },
        {
          "c": "Bursa",
          "f": "107.1"
        },
        {
          "c": "Kocaeli",
          "f": "97.3"
        }
      ],
      "company": "İstanbul FM Radyo Televizyon ve Uydu Yayıncılığı A.Ş.",
      "whatsapp": "+90 544 886 18 86",
      "social": {},
      "scheduleGun": {}
    }
  ],
  "contact": {
    "tag": "Bize Ulaşın",
    "headline": "İletişim",
    "text": "Reklam, iş birliği ve basın talepleri için iletişime geçebileceğiniz mail adreslerimiz",
    "items": [
      {
        "icon": "✉️",
        "label": "Genel İletişim",
        "value": "info@bayrakstar.com",
        "href": "mailto:info@bayrakstar.com"
      },
      {
        "icon": "📢",
        "label": "Reklam & İş Birliği",
        "value": "reklam@bayrakstar.com",
        "href": "mailto:reklam@bayrakstar.com"
      },
      {
        "icon": "📰",
        "label": "Basın",
        "value": "basin@bayrakstar.com",
        "href": "mailto:basin@bayrakstar.com"
      }
    ],
    "note": "Radyolara doğrudan ulaşmak için ilgili radyonun sayfasındaki iletişim bilgilerini kullanabilirsiniz.",
    "istekBaslik": "İstek Hattı",
    "istekText": "Şarkı isteklerin ve selamların için radyoların WhatsApp hatları",
    "istekItems": [
      {
        "icon": "💬",
        "label": "İstanbul FM İstek Hattı",
        "value": "+90 544 886 18 86",
        "href": "https://wa.me/905448861886"
      }
    ]
  },
  "grafik": {
    "zeminler": true,
    "bilesenler": true,
    "kartlar": true,
    "yogunluk": 15
  },
  "footer": {
    "about": "<b>Bayrakstar</b> — colorful life. Radyolarımızı tek çatı altında buluşturan yayın ağı.",
    "socials": {
      "ig": "#",
      "yt": "#",
      "x": "#",
      "sp": "#"
    }
  },
  "yasal": {
    "kunye": {
      "yayinda": false,
      "baslik": "Künye",
      "aciklama": "Bayrakstar Medya bünyesindeki radyo yayınlarına ve bu web sitesine ilişkin bilgiler.",
      "alanlar": [
        {
          "etiket": "Yayıncı Kuruluş",
          "deger": ""
        },
        {
          "etiket": "Yayın Türü",
          "deger": "Radyo yayıncılığı ve internet yayını"
        },
        {
          "etiket": "Sorumlu Müdür",
          "deger": ""
        },
        {
          "etiket": "Adres",
          "deger": ""
        },
        {
          "etiket": "Telefon",
          "deger": ""
        },
        {
          "etiket": "E-posta",
          "deger": "info@bayrakstar.com.tr"
        },
        {
          "etiket": "Web",
          "deger": "https://eray-ai.github.io/bayrakstar-site/"
        },
        {
          "etiket": "Ticaret Sicil / MERSİS No",
          "deger": ""
        },
        {
          "etiket": "Vergi Dairesi / No",
          "deger": ""
        }
      ],
      "not": "Yayınlarımıza ilişkin görüş, öneri ve şikâyetlerinizi yukarıdaki iletişim kanallarından iletebilirsiniz."
    },
    "kvkk": {
      "yayinda": true,
      "baslik": "KVKK Aydınlatma Metni",
      "guncelleme": "12 Ağustos 2026",
      "giris": "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, bu web sitesini ziyaret ettiğinizde kişisel verilerinizin nasıl işlendiği konusunda sizi bilgilendirmek için hazırlanmıştır.",
      "bolumler": [
        {
          "baslik": "1. Veri Sorumlusu",
          "metin": "Veri sorumlusu, künye bölümünde bilgileri yer alan yayıncı kuruluştur. İletişim: info@bayrakstar.com.tr"
        },
        {
          "baslik": "2. Bu sitede hangi veriler işleniyor?",
          "metin": "Bu web sitesi ziyaretçilerinden <b>kişisel veri toplamamaktadır.</b> Sitede reklam veya takip çerezi kullanılmaz, IP adresiniz kaydedilmez, tarayıcı parmak izi çıkarılmaz, üyelik ya da form yoluyla bilgi toplanmaz. Bu nedenle sitede çerez onay penceresi de bulunmaz."
        },
        {
          "baslik": "3. Ziyaret sayacı",
          "metin": "Sitenin hangi sayfalarının ne kadar ilgi gördüğünü anlamak için yalnızca <b>“hangi gün, hangi sayfa, kaç kez açıldı”</b> bilgisi tutulur. Bu sayım kişiye bağlanamaz: IP adresi, çerez, cihaz ya da tarayıcı bilgisi kaydedilmez, üçüncü taraf bir analiz servisi kullanılmaz. Bu veriler KVKK anlamında kişisel veri niteliği taşımaz."
        },
        {
          "baslik": "4. Canlı yayın dinlerken",
          "metin": "Siteden canlı yayın dinlediğinizde ses akışı, ilgili radyonun kendi yayın sunucusundan gelir. Bu bağlantı sırasında teknik bağlantı bilgileriniz o sunucuya ulaşır ve ilgili radyonun kendi gizlilik uygulamalarına tabidir."
        },
        {
          "baslik": "5. Bize yazdığınızda",
          "metin": "İletişim bölümündeki e-posta adreslerine yazdığınızda ya da istek hatlarına mesaj gönderdiğinizde; ilettiğiniz ad, iletişim bilgisi ve mesaj içeriği, yalnızca talebinizi karşılamak ve size dönüş yapmak amacıyla işlenir. Hukuki sebep, KVKK m.5/2-(f) uyarınca meşru menfaattir. Bu veriler amacı ortadan kalktığında silinir."
        },
        {
          "baslik": "6. Aktarım",
          "metin": "Kişisel verileriniz, yasal olarak yetkili kamu kurum ve kuruluşları dışında üçüncü kişilerle paylaşılmaz, yurt dışına aktarılmaz. Sitenin barındırıldığı altyapı sağlayıcıları yalnızca teknik hizmet verir."
        },
        {
          "baslik": "7. Haklarınız",
          "metin": "KVKK m.11 uyarınca; kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonuç doğmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz."
        },
        {
          "baslik": "8. Başvuru",
          "metin": "Haklarınıza ilişkin taleplerinizi <b>info@bayrakstar.com.tr</b> adresine iletebilirsiniz. Başvurunuz en geç otuz gün içinde sonuçlandırılır."
        }
      ],
      "not": ""
    }
  }
};

/* Aktif veriyi döndürür.
   Panelde kaydedilmiş düzenlemeler (localStorage) varsa onları KORUR,
   ama data.js'e sonradan eklenen yeni alanları varsayılandan alarak birleştirir. */
window.getSiteData = function () {
  var def = window.DEFAULT_DATA;
  var saved = null;
  try {
    var s = localStorage.getItem("bayrakstar_data");
    if (s) saved = JSON.parse(s);
  } catch (e) {}
  if (!saved || typeof saved !== "object") return def;

  var out = Object.assign({}, def, saved);
  out.hero    = Object.assign({}, def.hero,    saved.hero    || {});
  out.intro   = Object.assign({}, def.intro,   saved.intro   || {});
  out.footer  = Object.assign({}, def.footer,  saved.footer  || {});
  out.contact = Object.assign({}, def.contact, saved.contact || {});
  /* grafik elementleri ayarı — panelden gelir; yeni alan eklenirse
     kayıtlı kopya onu gölgelemesin diye alan bazında birleştirilir */
  out.grafik  = Object.assign({}, def.grafik,  saved.grafik  || {});
  /* künye + KVKK: bölüm bazında birleşir, listeler kayıtlıysa kayıtlı kazanır */
  (function () {
    var dy = def.yasal || {}, sy = saved.yasal || {};
    var y = {};
    ["kunye", "kvkk"].forEach(function (k) {
      y[k] = Object.assign({}, dy[k] || {}, sy[k] || {});
      var liste = (k === "kunye") ? "alanlar" : "bolumler";
      y[k][liste] = (sy[k] && Array.isArray(sy[k][liste]) && sy[k][liste].length)
        ? sy[k][liste] : ((dy[k] && dy[k][liste]) || []);
    });
    out.yasal = y;
  })();
  /* iletişim kartları: kayıtlı liste varsa o, yoksa varsayılan */
  out.contact.items = (saved.contact && Array.isArray(saved.contact.items) && saved.contact.items.length)
    ? saved.contact.items : (def.contact ? def.contact.items : []);
  /* dinleyici istek hatları ayrı liste — kayıtlı kopyada yoksa varsayılandan gelir */
  out.contact.istekItems = (saved.contact && Array.isArray(saved.contact.istekItems) && saved.contact.istekItems.length)
    ? saved.contact.istekItems : ((def.contact && def.contact.istekItems) || []);
  out.slides  = (saved.slides  && saved.slides.length)  ? saved.slides  : def.slides;
  out.slogans = (saved.slogans && saved.slogans.length) ? saved.slogans : def.slogans;

  /* Kayıtlı liste ile varsayılan listeyi öğe bazında birleştirir.
     Kaydedilen değerler HER ZAMAN kazanır; ama data.js'e SONRADAN eklenen
     yeni alanlar (örn. programların "img" görseli) kaybolmasın diye
     varsayılandaki eşleşen öğeden tamamlanır. Kullanıcının sildiği öğeler
     geri gelmez — sadece kayıtlı listede duranlar zenginleştirilir. */
  /* anahtarlar: SIRAYLA denenir. Tek bir alana (örn. "name") bağlı kalmak
     kırılgandı — panelden bir programın ya da yayıncının ADI değiştirilince
     varsayılandaki eşleşme kopuyor ve o kaydın görseli gibi alanlar
     kayboluyordu. Artık önce kalıcı alan (slug / saat) denenir, tutmazsa ada
     düşülür. */
  function listeBirlestir(defListe, savedListe, anahtarlar) {
    if (!Array.isArray(savedListe)) return defListe;
    if (!Array.isArray(anahtarlar)) anahtarlar = [anahtarlar];

    var indeksler = anahtarlar.map(function (a) {
      var ix = {};
      (defListe || []).forEach(function (x) {
        if (x && typeof x === "object" && x[a] != null && x[a] !== "") {
          if (ix[x[a]] === undefined) ix[x[a]] = x;   // ilk eşleşme kazanır
        }
      });
      return ix;
    });

    return savedListe.map(function (sv) {
      if (!sv || typeof sv !== "object") return sv;
      for (var i = 0; i < anahtarlar.length; i++) {
        var deger = sv[anahtarlar[i]];
        if (deger == null || deger === "") continue;
        var dv = indeksler[i][deger];
        if (dv) return Object.assign({}, dv, sv);
      }
      return sv;
    });
  }

  var savedBySlug = {};
  (saved.radios || []).forEach(function (r) { if (r && r.slug) savedBySlug[r.slug] = r; });
  out.radios = (def.radios || []).map(function (dr) {
    var sv = savedBySlug[dr.slug];
    if (!sv) return dr;
    var birlesik = Object.assign({}, dr, sv);
    /* önce kalıcı alan, tutmazsa ad: adı değiştirilen kaydın görseli kaybolmasın */
    birlesik.schedule    = listeBirlestir(dr.schedule,    sv.schedule,    ["t", "name"]);
    /* güne özel akışlar: her gün kendi içinde birleştirilir. Kayıtlı kopyada
       olmayan bir gün varsayılandan gelir; kaydedilen gün her zaman kazanır. */
    (function () {
      var dg = dr.scheduleGun || {}, sg = sv.scheduleGun;
      if (!sg) { birlesik.scheduleGun = dg; return; }
      var cikti = {};
      Object.keys(dg).forEach(function (g) { cikti[g] = dg[g]; });
      Object.keys(sg).forEach(function (g) {
        cikti[g] = listeBirlestir(dg[g], sg[g], ["t", "name"]);
      });
      birlesik.scheduleGun = cikti;
    })();
    birlesik.hosts       = listeBirlestir(dr.hosts,       sv.hosts,       ["slug", "name"]);
    birlesik.frequencies = listeBirlestir(dr.frequencies, sv.frequencies, ["c"]);
    return birlesik;
  });
  (saved.radios || []).forEach(function (r) {
    if (r && r.slug && !(def.radios || []).some(function (d) { return d.slug === r.slug; })) out.radios.push(r);
  });
  return out;
};
