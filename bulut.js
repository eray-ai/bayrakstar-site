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
  var OTURUM     = "bayrakstar_token";     // yönetici erişim jetonu
  var EPOSTA     = "yonetim@bayrakstar.com";
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
      var d = satirlar && satirlar[0] && satirlar[0].data;
      // Bulut boşsa (henüz hiç kaydedilmemişse) data.js varsayılanları geçerli
      if (d && typeof d === "object" && Object.keys(d).length) {
        try { localStorage.setItem(ONBELLEK, JSON.stringify(d)); } catch (e) {}
        return d;
      }
      return null;
    });
  }

  /* ---- GİRİŞ: yönetici şifresiyle jeton al ---- */
  function bulutGiris(sifre) {
    return fetch(URL_ + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "apikey": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: EPOSTA, password: sifre })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.access_token) throw new Error(j.error_description || j.msg || "Şifre yanlış.");
        try { sessionStorage.setItem(OTURUM, j.access_token); } catch (e) {}
        return j.access_token;
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
  function ziyaretSay() {
    try {
      var yol = location.pathname.replace(/index\.html$/, "");
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
  var hazir;
  if (onbellekVar() && !window.BULUT_TAZE_SART) {
    bulutOku().catch(function (e) {
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
    giris: bulutGiris,
    yaz: bulutYaz,
    gecmis: bulutGecmis,
    ziyaretOzet: ziyaretOzet,
    jeton: jeton,
    girisliMi: function () { return !!jeton(); },
    cikis: function () { try { sessionStorage.removeItem(OTURUM); } catch (e) {} }
  };
  window.bulutHazir = hazir;

  /* Sayım en sona bırakıldı: içerik isteği önce yola çıksın, ölçüm
     açılış hızına omuz atmasın. */
  ziyaretSay();
})();
