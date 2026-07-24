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
  var ZAMAN_ASIMI = 5000;                  // ms — bulut yanıt vermezse siteyi bekletme

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

  /* ---- Sayfalar bunu bekler: bulut gelene kadar çizim yapılmaz ---- */
  var hazir = bulutOku().catch(function (e) {
    // Bulut erişilemezse site yine de açılır (ön bellek / data.js varsayılanı ile)
    console.warn("[bulut] " + e.message + " — yerel içerikle devam ediliyor.");
    return null;
  });

  window.BULUT = {
    oku: bulutOku,
    giris: bulutGiris,
    yaz: bulutYaz,
    jeton: jeton,
    girisliMi: function () { return !!jeton(); },
    cikis: function () { try { sessionStorage.removeItem(OTURUM); } catch (e) {} }
  };
  window.bulutHazir = hazir;
})();
