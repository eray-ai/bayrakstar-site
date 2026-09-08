/* ============================================================
   BAYRAKSTAR — Bulut Katmanı (Supabase)
   ------------------------------------------------------------
   Admin panelinde "Buluta Kaydet" denince içerik Supabase'e yazılır,
   siteyi açan HERKES anında güncel içeriği görür.

   Bağımlılık YOK — saf fetch ile Supabase REST + Auth API'si kullanılır.

   NOT: Aşağıdaki anahtar "publishable/anon" anahtardır, herkese açık
   olması normaldir. Yazma yetkisi yoktur; yazmak için yönetici girişi
   (Supabase Auth) şarttır — kural veritabanında (RLS) zorunlu tutulur.
   ============================================================ */
(function () {
  var URL_ = "https://bezwdlxombiirihxomnv.supabase.co";
  var KEY  = "sb_publishable_vRdeq7GR8RblkbUe60SrSw_aFkl6xhe";

  var ONBELLEK   = "bayrakstar_data";      // data.js'in okuduğu anahtar
  var ONBELLEK_Z = "bayrakstar_data_zaman"; // ön belleğin hangi kayda ait olduğu (updated_at)
  var OTURUM     = "bayrakstar_token";     // yönetici erişim jetonu
  var ROL        = "bayrakstar_rol";       // 'sahip' | 'yonetici'
  var EPOSTA_SON = "bayrakstar_eposta";    // giriş kutusuna hatırlatma
  /* Bulut YAVAŞ olduğunda (kapalı değil — yavaş) sayfa bu süre kadar boş kalır.
     Ölçüldü: 5000 ms'de ziyaretçi 6,4 sn beyaz ekran görüyordu. Ücretsiz
     Supabase projesi hareketsizlikten sonra duraklıyor ve uyanırken tam olarak
     "yavaş ama ayakta" oluyor, yani bu istisnai değil normal bir durum. */
  var ZAMAN_ASIMI = 2500;

  function basliklar(jeton) {
    var h = { "apikey": KEY, "Content-Type": "application/json" };
    h["Authorization"] = "Bearer " + (jeton || KEY);
    return h;
  }

  function zamanAsimli(istek, ms) {
    return Promise.race([
      istek,
      new Promise(function (_, red) {
        setTimeout(function () { red(new Error("Bulut zaman aşımı")); }, ms);
      })
    ]);
  }

  /* Son okunan kaydın zaman damgası (updated_at). Panel, kaydetmeden
     önce buna bakıp araya başka bir kaydın girip girmediğini anlıyor. */
  var sonZaman_ = "";
  function onbellekZamani() {
    try { return localStorage.getItem(ONBELLEK_Z) || ""; } catch (e) { return ""; }
  }
  /* Yalnız zaman damgasını çeker — içeriği indirmez, ön belleğe dokunmaz. */
  function bulutZamani() {
    return zamanAsimli(
      fetch(URL_ + "/rest/v1/site_icerik?id=eq.1&select=updated_at", {
        headers: basliklar(), cache: "no-store"
      }).then(function (r) {
        if (!r.ok) throw new Error("Bulut okunamadı (" + r.status + ")");
        return r.json();
      }),
      ZAMAN_ASIMI
    ).then(function (satirlar) {
      return (satirlar && satirlar[0] && satirlar[0].updated_at) || "";
    });
  }

  /* ---- OKU: bulutdaki içeriği çek, ön belleğe yaz ---- */
  function bulutOku() {
    return zamanAsimli(
      fetch(URL_ + "/rest/v1/site_icerik?id=eq.1&select=data,updated_at", {
        headers: basliklar(), cache: "no-store"
      }).then(function (r) {
        if (!r.ok) throw new Error("Bulut okunamadı (" + r.status + ")");
        return r.json();
      }),
      ZAMAN_ASIMI
    ).then(function (satirlar) {
      var satir = satirlar && satirlar[0];
      var d = satir && satir.data;
      // Bulut boşsa (henüz hiç kaydedilmemişse) data.js varsayılanları geçerli
      if (d && typeof d === "object" && Object.keys(d).length) {
        try {
          localStorage.setItem(ONBELLEK, JSON.stringify(d));
          localStorage.setItem(ONBELLEK_Z, satir.updated_at || "");
        } catch (e) {}
        sonZaman_ = satir.updated_at || "";
        return d;
      }
      return null;
    });
  }

  /* ------------------------------------------------------------
     GİRİŞ
     Her yöneticinin KENDİ e-postası ve şifresi var. Tek ortak şifre
     yok; böylece kimin ne yaptığı ayrılabiliyor ve bir kişinin
     erişimi kapatılınca diğerleri etkilenmiyor.

     Giriş başarılıysa hemen ardından rol okunur ('sahip' | 'yonetici').
     Rol yalnızca EKRANI şekillendirir — asıl kilit veritabanında (RLS)
     durur, yani tarayıcıdan rol değiştirmek hiçbir kapı açmaz.
     ------------------------------------------------------------ */
  function bulutGiris(eposta, sifre) {
    /* Eski çağrı biçimi — tek argümanla sadece şifre — desteklenmiyor;
       hangi hesapla girildiği artık zorunlu bilgi. */
    if (arguments.length < 2) return Promise.reject(new Error("E-posta ve şifre gerekli."));
    return fetch(URL_ + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "apikey": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(eposta || "").trim().toLowerCase(), password: sifre })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.access_token) throw new Error(j.error_description || j.msg || "E-posta ya da şifre yanlış.");
        try {
          sessionStorage.setItem(OTURUM, j.access_token);
          localStorage.setItem(EPOSTA_SON, String(eposta || "").trim().toLowerCase());
        } catch (e) {}
        return rolOku().then(function (rol) {
          if (!rol) {
            /* Auth'ta hesabı var ama yetki listesinde yok: erişimi kaldırılmış. */
            try { sessionStorage.removeItem(OTURUM); } catch (e) {}
            throw new Error("Bu hesabın panele erişim yetkisi yok.");
          }
          return { jeton: j.access_token, rol: rol };
        });
      });
    });
  }

  /* Rolü sunucuya sorar; oturum boyunca saklanır. */
  function rolOku() {
    var t = jeton();
    if (!t) return Promise.resolve(null);
    return fetch(URL_ + "/rest/v1/rpc/benim_rolum", {
      method: "POST", headers: basliklar(t), body: "{}"
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (rol) {
      rol = (typeof rol === "string" && rol) ? rol : null;
      try { rol ? sessionStorage.setItem(ROL, rol) : sessionStorage.removeItem(ROL); } catch (e) {}
      return rol;
    }).catch(function () { return null; });
  }

  function rol() {
    try { return sessionStorage.getItem(ROL); } catch (e) { return null; }
  }
  function sahipMi() { return rol() === "sahip"; }

  /* ------------------------------------------------------------
     YÖNETİCİ HESAPLARI
     Hesap açmak/silmek sunucudaki `yoneticiler` fonksiyonuna gider;
     o fonksiyon çağıranın gerçekten süper yönetici olduğunu jetondan
     doğrular. Buradaki sahipMi() kontrolü sadece boşuna istek atmamak
     içindir, güvenliğin kendisi değildir.
     ------------------------------------------------------------ */
  function yoneticiIslem(govde) {
    var t = jeton();
    if (!t) return Promise.reject(new Error("Önce giriş yapmalısın."));
    return fetch(URL_ + "/functions/v1/yoneticiler", {
      method: "POST",
      headers: { "apikey": KEY, "Authorization": "Bearer " + t, "Content-Type": "application/json" },
      body: JSON.stringify(govde || { islem: "liste" })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.hata || ("İşlem başarısız (" + r.status + ")"));
        return j;
      });
    });
  }

  function jeton() {
    try { return sessionStorage.getItem(OTURUM); } catch (e) { return null; }
  }

  /* ---- YAZ: içeriği buluta gönder (giriş şart) ---- */
  function bulutYaz(veri) {
    var t = jeton();
    if (!t) return Promise.reject(new Error("Önce giriş yapmalısın."));
    return fetch(URL_ + "/rest/v1/site_icerik?id=eq.1", {
      method: "PATCH",
      headers: Object.assign(basliklar(t), { "Prefer": "return=minimal" }),
      body: JSON.stringify({ data: veri })
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) {
        try { sessionStorage.removeItem(OTURUM); } catch (e) {}
        throw new Error("Oturum süresi doldu. Sayfayı yenileyip tekrar giriş yap.");
      }
      if (!r.ok) {
        return r.text().then(function (t2) { throw new Error("Buluta yazılamadı: " + (t2 || r.status)); });
      }
      return true;
    });
  }

  /* ------------------------------------------------------------
     SÜRÜM GEÇMİŞİ
     Her kayıttan ÖNCEKİ hâl `site_icerik_gecmis` tablosuna düşer.
     Bu tabloyu YALNIZCA giriş yapmış yönetici okuyabilir (RLS);
     anon anahtarla boş liste döner. Yazma/silme politikası hiç yok,
     yani geçmiş API üzerinden değiştirilemez.

     Geri yükleme ayrı bir uç nokta değil: seçilen sürümün `data`sı
     normal bulutYaz() ile yazılır — böylece o an canlıda olan içerik
     de geçmişe düşer, yani geri almanın kendisi de geri alınabilir.
     ------------------------------------------------------------ */
  function bulutGecmis(adet) {
    var t = jeton();
    if (!t) return Promise.reject(new Error("Önce giriş yapmalısın."));
    var n = adet || 20;
    return fetch(URL_ + "/rest/v1/site_icerik_gecmis" +
                 "?select=id,kayit_zamani,data&icerik_id=eq.1" +
                 "&order=kayit_zamani.desc&limit=" + n, {
      headers: basliklar(t)
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) {
        try { sessionStorage.removeItem(OTURUM); } catch (e) {}
        throw new Error("Oturum süresi doldu. Sayfayı yenileyip tekrar giriş yap.");
      }
      if (!r.ok) {
        return r.text().then(function (t2) { throw new Error("Geçmiş okunamadı: " + (t2 || r.status)); });
      }
      return r.json();
    });
  }

  /* ------------------------------------------------------------
     ZİYARET SAYACI
     Kişisel veri TOPLANMAZ: IP, tarayıcı bilgisi, çerez, oturum kimliği
     yok. Sunucuya giden tek şey sayfanın yolu; veritabanında yalnızca
     "hangi gün, hangi sayfa, kaç kez" sayısı tutulur. Bu yüzden çerez
     uyarısı ya da açık rıza gerekmiyor.

     Tabloya doğrudan yazılamaz (RLS reddeder); sayım yalnızca
     ziyaret_kaydet() fonksiyonu üzerinden yapılır, o da yolu doğrular.

     Sayım BAŞARISIZ OLURSA sessizce geçilir — ölçüm hiçbir koşulda
     sitenin açılmasını engellememeli.
     ------------------------------------------------------------ */
  /* Sitenin kök yolu. GitHub Pages'te site "/bayrakstar-site/" altında
     duruyor; kendi alan adına geçilince kökten yayınlanacak. Yollar bu
     önekle kaydedilirse alan adı değiştiği gün geçmiş ikiye bölünür.

     Önek, bu dosyanın KENDİ adresinden çıkarılıyor — böylece nereye
     taşınırsa taşınsın elle ayar gerekmiyor. */
  function siteTabani() {
    try {
      var src = (document.currentScript && document.currentScript.src) || "";
      if (!src) return "";
      var yol = new URL(src, location.href).pathname;      // .../bulut.js
      return yol.replace(/[^/]*$/, "").replace(/\/$/, ""); // .../  -> ...
    } catch (e) { return ""; }
  }
  var TABAN = siteTabani();

  function ziyaretSay() {
    try {
      var yol = location.pathname.replace(/index\.html$/, "");
      if (TABAN && yol.indexOf(TABAN) === 0) yol = yol.slice(TABAN.length);
      if (!yol) yol = "/";
      if (/admin\.html$/.test(location.pathname)) return;   // panel sayılmaz
      if (location.protocol === "file:") return;            // yerel deneme sayılmaz
      if (yol.length > 120) return;
      fetch(URL_ + "/rest/v1/rpc/ziyaret_kaydet", {
        method: "POST",
        headers: basliklar(null),
        body: JSON.stringify({ p_yol: yol }),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* ölçüm asla sayfayı bozmaz */ }
  }

  /* Yönetim panelinin okuduğu özet. Tabloyu yalnız giriş yapmış
     yönetici okuyabilir (RLS); anon boş liste alır. */
  function ziyaretOzet(gunSayisi) {
    var t = jeton();
    if (!t) return Promise.reject(new Error("Önce giriş yapmalısın."));
    var d = new Date();
    d.setDate(d.getDate() - (gunSayisi || 30));
    var bas = d.toISOString().slice(0, 10);
    return fetch(URL_ + "/rest/v1/ziyaret_sayac?select=gun,yol,adet&gun=gte." + bas +
                 "&order=gun.desc&limit=2000", { headers: basliklar(t) })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (m) { throw new Error("Ziyaretler okunamadı: " + (m || r.status)); });
        }
        return r.json();
      });
  }

  function onbellekVar() {
    try { return !!localStorage.getItem(ONBELLEK); } catch (e) { return false; }
  }

  /* ------------------------------------------------------------
     Sayfalar bunu bekler.

     ÖNBELLEK VARSA (tekrar gelen ziyaretçi): hiç bekletmeden çiz,
     bulutu arka planda tazele. Tazelenen içerik bir sonraki açılışta
     geçerli olur — "önce göster, sonra güncelle" yaklaşımı.

     ÖNBELLEK YOKSA (ilk ziyaret): bulut beklenir, ama en fazla
     ZAMAN_ASIMI kadar; sonra data.js varsayılanlarıyla açılır.

     YÖNETİM PANELİ İSTİSNASI: admin.html bayat kopya üzerinde
     düzenleme yapıp yeni içeriği ezmesin diye HER ZAMAN taze okur.
     (admin.html, bulut.js'ten önce window.BULUT_TAZE_SART = true der.)
     ------------------------------------------------------------ */
  /* Arka planda tazeleyip DEĞİŞMİŞ içerik bulursak sayfayı bir kez
     yeniliyoruz. Yoksa panelden yapılan değişiklik ziyaretçiye ancak
     BİR SONRAKİ açılışta ulaşıyordu — "kaydettim ama sayfa değişmedi"
     şikâyetinin sebebi buydu.
     · Aynı kayıt için ikinci kez yenilemeyiz (sessionStorage bayrağı).
     · Radyo çalıyorsa yenilemeyiz — sesi kesmek metin güncellemesinden
       daha rahatsız edici olur; içerik bir sonraki açılışta gelir. */
  function calanVarMi() {
    var sesler = document.getElementsByTagName("audio");
    for (var i = 0; i < sesler.length; i++) {
      if (!sesler[i].paused && !sesler[i].ended) return true;
    }
    return false;
  }
  function tazeIcerikGelince(oncekiZaman) {
    if (!sonZaman_ || sonZaman_ === oncekiZaman) return;
    var bayrak = "bayrakstar_tazelendi";
    try {
      if (sessionStorage.getItem(bayrak) === sonZaman_) return;
      sessionStorage.setItem(bayrak, sonZaman_);
    } catch (e) { return; }
    if (calanVarMi()) return;
    /* Yalnız açılışın ilk saniyelerinde: ağ çok yavaşsa cevap geç gelir ve
       o sırada sayfayı okuyan birinin altından sayfa çekilmiş olur. */
    if (typeof performance !== "undefined" && performance.now() > 10000) return;
    location.reload();
  }

  var hazir;
  if (onbellekVar() && !window.BULUT_TAZE_SART) {
    var oncekiZaman_ = onbellekZamani();
    bulutOku().then(function () {
      tazeIcerikGelince(oncekiZaman_);
    }).catch(function (e) {
      console.warn("[bulut] arka plan tazeleme başarısız: " + e.message);
    });
    hazir = Promise.resolve(null);
  } else {
    hazir = bulutOku().catch(function (e) {
      // Bulut erişilemezse site yine de açılır (ön bellek / data.js varsayılanı ile)
      console.warn("[bulut] " + e.message + " — yerel içerikle devam ediliyor.");
      return null;
    });
  }

  window.BULUT = {
    oku: bulutOku,
    zaman: bulutZamani,
    onbellekZamani: onbellekZamani,
    giris: bulutGiris,
    yaz: bulutYaz,
    gecmis: bulutGecmis,
    ziyaretOzet: ziyaretOzet,
    jeton: jeton,
    rol: rol,
    rolOku: rolOku,
    sahipMi: sahipMi,
    sonEposta: function () { try { return localStorage.getItem(EPOSTA_SON) || ""; } catch (e) { return ""; } },
    yoneticiListe: function () { return yoneticiIslem({ islem: "liste" }).then(function (j) { return j.yoneticiler || []; }); },
    yoneticiEkle:  function (eposta, sifre, ad) { return yoneticiIslem({ islem: "ekle", eposta: eposta, sifre: sifre, ad: ad }); },
    yoneticiSil:   function (uid) { return yoneticiIslem({ islem: "sil", uid: uid }); },
    yoneticiSifre: function (uid, sifre) { return yoneticiIslem({ islem: "sifre", uid: uid, sifre: sifre }); },
    girisliMi: function () { return !!jeton(); },
    cikis: function () {
      try { sessionStorage.removeItem(OTURUM); sessionStorage.removeItem(ROL); } catch (e) {}
    }
  };
  window.bulutHazir = hazir;

  /* Sayım en sona bırakıldı: içerik isteği önce yola çıksın, ölçüm
     açılış hızına omuz atmasın. */
  ziyaretSay();
})();
