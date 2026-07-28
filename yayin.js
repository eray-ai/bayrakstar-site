/* ============================================================
   BAYRAKSTAR — Yayın Bağlama Katmanı (HLS + normal ses)
   ------------------------------------------------------------
   Radyo Boombox ve İstanbul FM .m3u8 (HLS) yayınlıyor. Chrome ve
   Firefox HLS'i kendiliğinden çalamaz — <audio src="...m3u8"> sessiz
   kalır. Bu dosya araya girip doğru yolu seçer.

   NEDEN "önce dene, tutmazsa yedeğe geç"?
   canPlayType('application/vnd.apple.mpegurl') güvenilmez: Chromium
   HLS'i gerçekten çalamadığı hâlde "maybe" döndürüyor. Bu yüzden
   tarayıcının sözüne değil, DAVRANIŞINA bakıyoruz:

     1) .m3u8 değil            → doğrudan <audio src> (Icecast/mp3/aac)
     2) .m3u8 + yerel destek   → önce yerel dene (Safari/iOS burada
                                 mükemmel çalar, hls.js hiç inmez)
        · hata gelirse         → anında hls.js'e geç
        · 3,5 sn'de ses akmadıysa → hls.js'e geç
     3) .m3u8 + yerel destek yok → doğrudan hls.js

   hls.js YALNIZCA gerektiği an indirilir (346 KB) ve projede yerel
   durur (vendor/hls.min.js) — güvenlik başlığı (CSP) dış CDN'den
   script yüklemeye izin vermiyor.
   ============================================================ */
(function () {
  var HLS_YOL   = 'vendor/hls.min.js';
  var SABIR_MS  = 3500;      // yerel çalma bu sürede ses akıtmazsa yedeğe geç
  var BAGLANTI_SINIRI = 14000;   // hls.js bu sürede ses akıtamazsa pes edilir
  var _yukleniyor = null;

  function hlsMi(url) {
    return /\.m3u8(\?|#|$)/i.test(String(url || ''));
  }

  function yerelHlsIddiasi(audio) {
    if (!audio || !audio.canPlayType) return false;
    return !!(audio.canPlayType('application/vnd.apple.mpegurl') ||
              audio.canPlayType('audio/mpegurl'));
  }

  /* hls.js'i bir kez, ihtiyaç anında yükler */
  function hlsYukle() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (_yukleniyor) return _yukleniyor;
    _yukleniyor = new Promise(function (coz_, red) {
      var s = document.createElement('script');
      s.src = HLS_YOL; s.async = true;
      s.onload  = function () { window.Hls ? coz_(window.Hls) : red(new Error('Hls yok')); };
      s.onerror = function () { red(new Error('hls.js yüklenemedi')); };
      document.head.appendChild(s);
    });
    _yukleniyor.catch(function () { _yukleniyor = null; });   // hatada tekrar denenebilsin
    return _yukleniyor;
  }

  /* Bu <audio> ögesine bağlı hls.js örneğini söker */
  function coz(audio) {
    if (audio && audio._hls) {
      try { audio._hls.destroy(); } catch (e) {}
      audio._hls = null;
    }
  }

  /* ------------------------------------------------------------
     yayinBaslat(audio, url, secenekler)
       secenekler.durum(metin) → "Bağlanıyor…" gibi UI mesajları
       secenekler.hata(mesaj)  → yayına ulaşılamadığında
     ------------------------------------------------------------ */
  function yayinBaslat(audio, url, secenekler) {
    secenekler = secenekler || {};
    var durum = secenekler.durum || function () {};
    var hata  = secenekler.hata  || function () {};

    coz(audio);
    /* Radyo değiştirildiğinde eski denemenin geç gelen geri çağrıları
       yeni yayına karışmasın diye her bağlanma bir oturum numarası alır. */
    var oturum = (audio._yayinOturum = (audio._yayinOturum || 0) + 1);
    var gecerli = function () { return audio._yayinOturum === oturum; };

    /* --- normal yayın: eskisi gibi --- */
    if (!hlsMi(url)) {
      audio.src = url;
      return audio.play().catch(function () {
        if (gecerli()) hata('Yayına ulaşılamadı');
      });
    }

    durum('Bağlanıyor…');

    /* --- hls.js ile bağlan --- */
    function hlsIleBagla() {
      if (!gecerli()) return;
      coz(audio);

      /* Yayın büsbütün kapalıysa hls.js kendi içinde geri çekilerek
         yeniden dener ve kullanıcı dakikalarca "Yeniden bağlanılıyor…"
         görür. Bu genel süre sınırı, ses hiç akmadıysa pes ettirir. */
      var pesSayaci = setTimeout(function () {
        if (!gecerli() || audio.currentTime > 0.1) return;
        coz(audio);
        hata('Yayına ulaşılamadı');
      }, BAGLANTI_SINIRI);
      function sayaciBitir() {
        clearTimeout(pesSayaci);
        audio.removeEventListener('playing', sayaciBitir);
      }
      audio.addEventListener('playing', sayaciBitir);

      return hlsYukle().then(function (Hls) {
        if (!gecerli()) { sayaciBitir(); return; }
        if (!Hls.isSupported()) {
          sayaciBitir(); hata('Tarayıcınız bu yayını desteklemiyor'); return;
        }

        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,        // canlı radyo: geçmişi biriktirme
          manifestLoadingMaxRetry: 2,
          levelLoadingMaxRetry: 2,
          fragLoadingMaxRetry: 4
        });
        audio._hls = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          if (!gecerli()) return;
          audio.play().catch(function () {
            if (gecerli()) hata('Yayına ulaşılamadı');
          });
        });

        /* Yayın gerçekten kapalıysa sonsuza kadar "Yeniden bağlanılıyor…"
           yazmasın: birkaç denemeden sonra pes edip net mesaj verilir. */
        var agDeneme = 0, ortamDeneme = 0;
        hls.on(Hls.Events.ERROR, function (_o, veri) {
          if (!gecerli() || !veri || !veri.fatal) return;   // geçici sorunlar kendi düzelir
          if (veri.type === Hls.ErrorTypes.NETWORK_ERROR && ++agDeneme <= 3) {
            durum('Yeniden bağlanılıyor…');
            try { hls.startLoad(); return; } catch (e) {}
          } else if (veri.type === Hls.ErrorTypes.MEDIA_ERROR && ++ortamDeneme <= 2) {
            durum('Tamponlanıyor…');
            try { hls.recoverMediaError(); return; } catch (e) {}
          }
          sayaciBitir();
          coz(audio);
          hata('Yayına ulaşılamadı');
        });

        hls.loadSource(url);
        hls.attachMedia(audio);
      }).catch(function () {
        sayaciBitir();
        if (gecerli()) hata('Yayına ulaşılamadı');
      });
    }

    /* --- yerel destek iddiası varsa önce onu dene, davranışa bak --- */
    if (yerelHlsIddiasi(audio)) {
      var gecildi = false;
      function yedegeGec() {
        if (gecildi || !gecerli()) return;
        gecildi = true;
        clearTimeout(sayac);
        audio.removeEventListener('error', yedegeGec);
        hlsIleBagla();
      }
      var sayac = setTimeout(function () {
        if (!gecerli() || gecildi) return;
        /* kullanıcı bu arada duraklattıysa karışma */
        if (audio.paused && audio.currentTime > 0) return;
        if (audio.currentTime > 0.1) return;      // ses akıyor, yerel çalma tuttu
        yedegeGec();
      }, SABIR_MS);

      audio.addEventListener('error', yedegeGec);
      audio.src = url;
      return audio.play().catch(function () { yedegeGec(); });
    }

    return hlsIleBagla();
  }

  /* Çalar kapatılırken: sesi durdur, hls.js örneğini yok et */
  function yayinDurdur(audio) {
    if (audio) audio._yayinOturum = (audio._yayinOturum || 0) + 1;   // bekleyen işleri iptal et
    coz(audio);
    try { audio.pause(); } catch (e) {}
    audio.removeAttribute('src');
    try { audio.load(); } catch (e) {}
  }

  window.yayinBaslat = yayinBaslat;
  window.yayinDurdur = yayinDurdur;
  window.yayinHlsMi  = hlsMi;
})();
