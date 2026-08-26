/*
  ÇALAR — kalıcı ses kaynağı
  ==================================================================
  NEDEN VAR
  ---------
  Site çok sayfalı. Eskiden her sayfanın kendi <audio> düğümü vardı; başka
  bir sayfaya geçince o düğüm ölüyor ve ses kesiliyordu. Artık TEK bir
  <audio> var, doğrudan <body>'ye asılı ve gezinmede değiştirilen bölgenin
  (#sayfa) DIŞINDA duruyor. site.js sayfayı yenilemeden değiştirdiği için
  bu düğüm hiç ölmüyor — ses kesintisiz sürüyor.

  Sayfaların KENDİ çalar tasarımları duruyor; onlar yalnızca buraya bağlanan
  birer yüz. Durum değişince dinleyiciler haber alır ve kendi arayüzlerini
  günceller.

      var birak = Calar.dinle(function(d){
        d.radyo    // çalan radyonun nesnesi (yoksa null)
        d.caliyor  // ses akıyor mu
        d.durum    // 'Bağlanıyor…' gibi geçici bilgi (yoksa '')
        d.sarki    // o an çalan şarkı (SimdiCaliyor'dan; yoksa null)
      });

      Calar.cal(radyoNesnesi)   Calar.duraklat()   Calar.kapat()
      Calar.sesAyarla(0..1)     Calar.sesSeviyesi()
*/
(function () {
  'use strict';

  /* Düğüm <head> içinde oluşturuluyor (body henüz yok), gövde hazır olunca
     asılıyor. data-kalici işareti site.js'e "sayfa değişse de bu düğüme
     dokunma" der — kesintisiz sesin tüm sırrı bu. */
  var ses = document.createElement('audio');
  ses.id = 'sesKaynagi';
  ses.preload = 'none';
  ses.setAttribute('data-kalici', '');
  function govdeyeAs() {
    if (!ses.parentNode && document.body) document.body.appendChild(ses);
  }
  if (document.body) govdeyeAs();
  else document.addEventListener('DOMContentLoaded', govdeyeAs);

  var durum = { radyo: null, caliyor: false, durum: '', sarki: null };
  var dinleyiciler = [];
  var scBirak = null;

  function duyur() {
    for (var i = 0; i < dinleyiciler.length; i++) {
      try { dinleyiciler[i](durum); } catch (e) { if (window.console) console.error(e); }
    }
  }
  function durumYaz(t) { durum.durum = t || ''; duyur(); }

  /* ---- ses seviyesi sekmeler arası hatırlanır ---- */
  function kayitliSes() {
    try {
      var v = parseFloat(localStorage.getItem('bs_ses'));
      if (!isNaN(v) && v >= 0 && v <= 1) return v;
    } catch (e) {}
    return 0.85;
  }
  ses.volume = kayitliSes();

  function sesAyarla(v) {
    v = Math.max(0, Math.min(1, v));
    ses.volume = v;
    try { localStorage.setItem('bs_ses', String(v)); } catch (e) {}
  }

  /* ---- şimdi çalıyor takibi çalarla birlikte yaşar ----
     Böylece sayfa değişince yeniden sorgu atılmıyor; yeni sayfanın arayüzü
     hazır veriyi anında alıyor. */
  function sarkiTakibi(radyo) {
    if (scBirak) { scBirak(); scBirak = null; }
    durum.sarki = null;
    var kaynak = radyo && (radyo.caliyor || radyo.slug);
    if (!window.SimdiCaliyor || !kaynak) return;
    scBirak = window.SimdiCaliyor.izle(kaynak, function (s) {
      durum.sarki = s;
      if (s) durum.durum = '';
      duyur();
    });
  }

  function cal(radyo) {
    if (!radyo) return;
    var ayniRadyo = durum.radyo && durum.radyo.slug === radyo.slug;

    /* Aynı radyoya yeniden basmak = duraklat/sürdür. Sayfa değişip aynı
       radyoya bağlanınca sesi BAŞTAN başlatmıyoruz — kesinti bundan çıkardı. */
    if (ayniRadyo && durum.caliyor) { duraklat(); return; }
    if (ayniRadyo && ses.src) {
      durumYaz('');
      ses.play().catch(function () { baglan(radyo); });
      return;
    }
    baglan(radyo);
  }

  function baglan(radyo) {
    window.yayinDurdur && window.yayinDurdur(ses);
    durum.radyo = radyo;
    sarkiTakibi(radyo);

    if (!radyo.stream || !radyo.stream.trim()) {
      durum.caliyor = false;
      durumYaz('Canlı yayın linki yakında (panelden eklenecek)');
      return;
    }
    durumYaz('Bağlanıyor…');
    /* .m3u8 (HLS) yayınlar hls.js üzerinden, diğerleri doğrudan çalar */
    window.yayinBaslat(ses, radyo.stream, {
      durum: function (t) { if (durum.radyo === radyo) durumYaz(t); },
      hata:  function (m) { if (durum.radyo === radyo) durumYaz(m); }
    });
  }

  function duraklat() { ses.pause(); }

  function kapat() {
    window.yayinDurdur && window.yayinDurdur(ses);
    if (scBirak) { scBirak(); scBirak = null; }
    durum.radyo = null; durum.caliyor = false; durum.sarki = null;
    durumYaz('');
  }

  ses.addEventListener('playing', function () { durum.caliyor = true;  durumYaz(''); });
  ses.addEventListener('pause',   function () { durum.caliyor = false; duyur(); });
  ses.addEventListener('waiting', function () { durumYaz('Tamponlanıyor…'); });
  /* hls.js bağlıyken hatayı yayin.js yönetiyor — genel dinleyici karışmasın */
  ses.addEventListener('error', function () {
    if (durum.radyo && !ses._hls) durumYaz('Yayına ulaşılamadı');
  });

  /* Kilit ekranı / kulaklık düğmeleri */
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play',  function () { if (durum.radyo) cal(durum.radyo); });
      navigator.mediaSession.setActionHandler('pause', duraklat);
    } catch (e) {}
  }
  function kilitEkrani() {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    var r = durum.radyo, s = durum.sarki;
    if (!r) { navigator.mediaSession.metadata = null; return; }
    var gorsel = (s && s.kapak) || r.logo;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: s ? s.sarki : r.name,
        artist: s ? s.sanatci : (r.slogan || 'Canlı Yayın'),
        album: r.name,
        artwork: gorsel ? [{ src: gorsel }] : []
      });
    } catch (e) {}
  }

  window.Calar = {
    ses: ses,
    cal: cal,
    duraklat: duraklat,
    kapat: kapat,
    sesAyarla: sesAyarla,
    sesSeviyesi: function () { return ses.volume; },
    aktif: function () { return durum; },
    dinle: function (cb) {
      dinleyiciler.push(cb);
      try { cb(durum); } catch (e) {}        /* hemen mevcut durumu ver */
      return function () {
        var i = dinleyiciler.indexOf(cb);
        if (i >= 0) dinleyiciler.splice(i, 1);
      };
    }
  };

  dinleyiciler.push(kilitEkrani);
})();
