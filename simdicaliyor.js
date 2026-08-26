/*
  ŞİMDİ ÇALIYOR
  ==================================================================
  Radyoların o an çalan şarkısını (sanatçı, ad, albüm kapağı, süre)
  getirir ve şarkı bitince kendiliğinden yeniler.

  Kullanımı:
      var birak = SimdiCaliyor.izle('fenomen', function(s){
        if(!s) return;                 // şarkı bilgisi yok (jenerik, program, arıza)
        s.sanatci  s.sarki  s.kapak  s.sure  s.kalan  s.gecen  s.oran
      });
      birak();                          // izlemeyi durdur

  İKİ KAYNAK VAR:
   • fenomen / fenomenturk → api.radyofenomen.com doğrudan (CORS açık, aracı yok)
   • boombox / istanbulfm  → kendi siteleri CORS vermiyor, Supabase'deki
                             "simdi-caliyor" fonksiyonu aradan geçiriyor.
  Tek bir istek iki radyoyu birden beslediği için sonuç ön bellekte tutulur;
  iki radyo aynı anda izlenirse ağa tek istek gider.
*/
(function () {
  'use strict';

  var FENOMEN_API = 'https://api.radyofenomen.com/Channels/?appRef=FenomenWebV2';
  var ARACI       = 'https://bezwdlxombiirihxomnv.supabase.co/functions/v1/simdi-caliyor';

  /* Hangi radyo hangi kaynaktan, Fenomen tarafında hangi kanal numarasıyla */
  var KAYNAK = {
    fenomen:     { tip: 'fenomen', id: '20' },
    fenomenturk: { tip: 'fenomen', id: '40' },
    boombox:     { tip: 'araci',   id: 'boombox' },
    istanbulfm:  { tip: 'araci',   id: 'istanbulfm' }
  };

  var EN_SIK   = 12;   // sn — bundan sık sorgulama
  var EN_SEYREK= 90;   // sn — bundan seyrek de bırakma
  var HATA_BEKLE = 30; // sn — istek patlarsa bu kadar sonra tekrar dene

  /* ---- ortak ön bellek: aynı kaynağa aynı anda tek istek ---- */
  var bekleyen = {};   // tip -> Promise
  var bellek   = {};   // tip -> { veri, sonKullanma }

  function suan(){ return Date.now(); }

  function getir(tip) {
    var b = bellek[tip];
    if (b && b.sonKullanma > suan()) return Promise.resolve(b.veri);
    if (bekleyen[tip]) return bekleyen[tip];

    var url = tip === 'fenomen' ? FENOMEN_API : ARACI;
    var p = fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(tip + ' ' + r.status);
        return r.json();
      })
      .then(function (ham) {
        var veri = tip === 'fenomen' ? fenomenAyikla(ham) : ham;
        // En yakın şarkı bitişine kadar sakla (sınırlar içinde).
        var enKisa = EN_SEYREK;
        Object.keys(veri).forEach(function (k) {
          var s = veri[k];
          if (s && s.kalan > 0) enKisa = Math.min(enKisa, s.kalan);
        });
        bellek[tip] = { veri: veri, sonKullanma: suan() + Math.max(EN_SIK, enKisa) * 1000 };
        return veri;
      })
      .catch(function (e) {
        if (window.console) console.warn('[simdicaliyor]', e.message || e);
        return null;
      })
      .then(function (v) { delete bekleyen[tip]; return v; });

    bekleyen[tip] = p;
    return p;
  }

  /* Fenomen API'sinin cevabını bizim biçime çevirir. */
  function fenomenAyikla(ham) {
    var cikti = {};
    var liste = (ham && ham.response) || [];
    for (var i = 0; i < liste.length; i++) {
      var k = liste[i];
      var t = (k.timeline || [])[0];
      if (!t || !t.songTitle) continue;
      var sure  = Number(t.duration) || 0;
      var kalan = Number(t.remainingSeconds) || 0;
      cikti[String(k.channel_id)] = {
        sanatci: (t.artistTitle || '').trim(),
        sarki:   (t.songTitle  || '').trim(),
        kapak:   t.albumCoverIMG || t.albumCoverIMGSmall || null,
        sure:    sure,
        kalan:   kalan,
        gecen:   Math.max(0, sure - kalan),
        sayacGizli: !!t.hide_counter
      };
    }
    return cikti;
  }

  /* Ham kaydı, dışarıya verdiğimiz temiz nesneye çevirir.
     `oran` = 0..1 arası ilerleme; süre yoksa null (çubuk çizilmez). */
  function duzenle(s) {
    if (!s || !s.sarki) return null;
    var sure = Number(s.sure) || 0;
    return {
      sanatci: s.sanatci || '',
      sarki:   s.sarki,
      kapak:   s.kapak || null,
      sure:    sure,
      kalan:   Number(s.kalan) || 0,
      gecen:   Number(s.gecen) || 0,
      oran:    (sure > 0 && !s.sayacGizli) ? Math.min(1, (Number(s.gecen) || 0) / sure) : null
    };
  }

  /* ---- dışa açık: izle ---- */
  function izle(slug, cb) {
    var k = KAYNAK[slug];
    if (!k) return function () {};

    var durdu = false, zaman = null;

    function tur() {
      if (durdu) return;
      getir(k.tip).then(function (veri) {
        if (durdu) return;
        var ham = veri ? veri[k.id] : null;
        var s = duzenle(ham);
        try { cb(s); } catch (e) { if (window.console) console.error(e); }

        // Şarkı biter bitmez yenile; bilinmiyorsa makul bir aralık.
        var sonra = veri
          ? Math.min(EN_SEYREK, Math.max(EN_SIK, (s && s.kalan ? s.kalan + 2 : 25)))
          : HATA_BEKLE;
        zaman = setTimeout(tur, sonra * 1000);
      });
    }
    tur();

    return function () { durdu = true; if (zaman) clearTimeout(zaman); };
  }

  window.SimdiCaliyor = { izle: izle };
})();
