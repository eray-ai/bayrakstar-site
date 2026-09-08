/* ============================================================
   Bayrakstar — Ortak Navigasyon + Sayfa Geçişleri
   index.html ve radyo.html'de kullanılır (data.js'ten sonra yüklenir)
   ============================================================ */
(function(){
  var D = (window.getSiteData ? window.getSiteData() : (window.DEFAULT_DATA||{radios:[]}));
  var onIndex = /index\.html$|\/$|^$/.test(location.pathname.split('/').pop()||'') || location.pathname.endsWith('/');
  var curSlug = new URLSearchParams(location.search).get('r') || window.ON_SLUG || null;

  /* ---- stil enjekte et ---- */
  var css = document.createElement('style');
  css.setAttribute('data-ortak','');   /* sayfa değişse de kalır */
  css.textContent = `
    .navburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;background:none;border:none;z-index:1300}
    .navburger span{width:26px;height:3px;background:#fff;border-radius:3px;transition:.3s}
    @media(max-width:940px){ .navburger{display:flex} nav.menu{display:none!important} .sib{display:none!important} }

    .navovl{position:fixed;inset:0;z-index:1400;background:rgba(14,14,14,.98);backdrop-filter:blur(10px);
      display:flex;flex-direction:column;padding:26px 7vw;opacity:0;pointer-events:none;transition:opacity .35s}
    .navovl.open{opacity:1;pointer-events:auto}
    .navovl .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:34px}
    .navovl .top img{height:34px}
    .navovl .x{background:none;border:none;color:#fff;font-size:34px;line-height:1;cursor:pointer;opacity:.7}
    .navovl .x:hover{opacity:1}
    .navovl .lbl{font-size:12px;letter-spacing:.28em;text-transform:uppercase;opacity:.45;margin:18px 0 10px;font-weight:700}
    .navovl a{color:#fff;font-weight:800;font-size:clamp(26px,7vw,40px);line-height:1.28;text-decoration:none;display:flex;align-items:center;gap:14px;
      opacity:0;transform:translateX(-16px);transition:opacity .4s,transform .4s}
    .navovl.open a{opacity:1;transform:none}
    .navovl a .dot{width:14px;height:14px;border-radius:50%;flex-shrink:0}
    /* Radyo satırları isim yerine markanın kendi logosuyla çiziliyor.
       Logolar farklı en/boy oranında (İstanbul FM çok yatık, Boombox kare gibi)
       olduğu için yükseklik marka başına ayrı veriliyor — hepsi aynı yükseklikte
       verilirse Boombox devleşiyor, İstanbul FM cılız kalıyor. */
    .navovl a.radio{padding:7px 0}
    .navovl a.radio img{height:52px;max-width:74vw;width:auto;object-fit:contain;object-position:left center;display:block}
    .navovl a.radio .now{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .navovl a.small{font-size:clamp(18px,4.5vw,22px);font-weight:700;opacity:.8}
    .navovl.open a.small{opacity:.8}
    .navovl a:hover{color:#fff}
    .navovl a:active{transform:scale(.98)}

    .pagecurtain{position:fixed;inset:0;z-index:2000;pointer-events:none;
      background:linear-gradient(120deg,#ff0007,#f75843 40%,#0081ba);
      transform:translateY(0);transition:transform .5s cubic-bezier(.7,0,.3,1)}
    .pagecurtain.out{transform:translateY(-100%)}
    .pagecurtain.in{transform:translateY(0)}
    .pagecurtain .cload{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;gap:5px}
    .pagecurtain .cload i{width:6px;height:34px;background:var(--cbar,#fff);border-radius:4px;animation:cl .8s ease-in-out infinite}
    .pagecurtain .cload i:nth-child(2){animation-delay:.12s}.pagecurtain .cload i:nth-child(3){animation-delay:.24s}
    .pagecurtain .cload i:nth-child(4){animation-delay:.36s}.pagecurtain .cload i:nth-child(5){animation-delay:.48s}
    @keyframes cl{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}

    /* klavye odağı menüde de görünsün */
    .navburger:focus-visible,.navovl a:focus-visible,.navovl .x:focus-visible{
      outline:3px solid #fff;outline-offset:4px;border-radius:8px}

    /* hareketi azalt: perde ve menü animasyonları anında olsun */
    @media (prefers-reduced-motion:reduce){
      .pagecurtain{transition-duration:.001ms}
      .pagecurtain .cload i{animation:none}
      .navovl,.navovl a{transition-duration:.001ms}
    }
  `;
  document.head.appendChild(css);

  /* ---- sayfa geçiş perdesi ---- */
  var curtain = document.createElement('div');
  curtain.className = 'pagecurtain';
  curtain.setAttribute('data-kalici','');   /* sayfa değişince silinmez */
  curtain.innerHTML = '<div class="cload"><i></i><i></i><i></i><i></i><i></i></div>';
  document.body.appendChild(curtain);
  /* Bayrakstar (çatı) sayfaları için çok renkli marka degradesi */
  var CATI_GRADYAN = 'linear-gradient(120deg,#ff0007,#f75843 40%,#00bac5 75%,#0081ba)';

  function _rgb(h){h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');
    return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
  function _parlak(h){var c=_rgb(h).map(function(v){return v/255;});return .2126*c[0]+.7152*c[1]+.0722*c[2];}

  /* Perdeyi bir radyonun markasına göre boyar; radyo yoksa çatı degradesi */
  function perdeyiBoya(renk){
    if(renk){
      curtain.style.background='linear-gradient(120deg,'+renk+', #111 118%)';
      /* açık markalarda (Boombox sarısı) beyaz çubuklar kaybolur */
      curtain.style.setProperty('--cbar', _parlak(renk)>.62 ? '#141414' : '#ffffff');
    }else{
      curtain.style.background=CATI_GRADYAN;
      curtain.style.setProperty('--cbar','#ffffff');
    }
  }

  /* href'ten hedef radyonun rengini bul.
     Hem radyo.html?r=<slug> hem yayinci.html?r=<slug>&h=<host> tanınır —
     yayıncı sayfası da o radyonun temasını kullanıyor. */
  function hedefRengi(href){
    var h=href||'', slug=null;
    /* Eski biçim: radyo.html?r=<slug> · yayinci.html?r=<slug>&h=<host> */
    var m=/(?:radyo|yayinci)\.html\?r=([^&#]+)/.exec(h);
    if(m) slug=decodeURIComponent(m[1]);
    /* Yeni biçim: r/<slug>/ */
    if(!slug){ m=/(?:^|\/)r\/([^/?#]+)\/?/.exec(h); if(m) slug=decodeURIComponent(m[1]); }
    /* Yeni biçim: y/<radyoSlug>-<yayinciSlug>/ — yayıncı slug'ında tire
       olabildiği için ilk tireye göre bölmek yerine BİLİNEN radyo slug'ları
       arasından ön eki tutanı arıyoruz. */
    if(!slug){
      m=/(?:^|\/)y\/([^/?#]+)\/?/.exec(h);
      if(m){
        var par=decodeURIComponent(m[1]);
        var bul=(D.radios||[]).find(function(x){
          return x.slug && par.indexOf(x.slug+'-')===0;
        });
        if(bul) slug=bul.slug;
      }
    }
    if(!slug) return null;
    var r=(D.radios||[]).find(function(x){ return x.slug===slug; });
    return (r && r.color) ? r.color : null;
  }

  /* Açılış perdesi: rengi ADRESTEKİ slug'dan çöz.
     --brand kullanılamaz — CSS'te varsayılanı kırmızı ve gerçek marka rengi
     ancak bulut verisi geldikten SONRA atanıyor; o yüzden sarı radyoya
     geçerken perde önce sarı kapanıp kırmızı açılıyordu. */
  var mevcutRenk = null;
  if(curSlug){
    var mr = (D.radios||[]).find(function(x){ return x.slug===curSlug; });
    if(mr && mr.color) mevcutRenk = mr.color;
  }
  perdeyiBoya(mevcutRenk);
  /* Perde, içerik çizilene kadar durur — bulut yavaşsa ziyaretçi beyaz ekran
     yerine marka renkli yükleme ekranı görür. Bulut hiç cevap vermezse
     bulutHazir yine de çözülür; yine de takılı kalmasın diye üst sınır var. */
  (function(){
    var acildi = false;
    function ac(){ if(acildi) return; acildi = true;
      requestAnimationFrame(function(){ curtain.classList.add('out'); }); }
    setTimeout(ac, 3000);                       // emniyet: ne olursa olsun aç
    if (window.bulutHazir && window.bulutHazir.then){
      window.bulutHazir.then(function(){
        /* sayfanın çizim kodu da bulutHazir.then ile bağlı; bir kare sonra aç */
        requestAnimationFrame(function(){ requestAnimationFrame(ac); });
      }, ac);
    } else { ac(); }
  })();

  /* Eski adı koruyoruz — başka yerlerden çağrılıyor olabilir. */
  function goTo(href){ spaGit(href); }

  /* ---- overlay menü kur ---- */
  var ovl = document.createElement('div');
  ovl.className = 'navovl';
  ovl.setAttribute('data-kalici','');       /* sayfa değişince silinmez */
  /* Logoların optik denge yükseklikleri (px) — dosyadaki en/boy oranından
     geliyor: yatık logolar alçak, dikey/kare olan Boombox daha yüksek. */
  var LOGO_H = { fenomen:46, fenomenturk:56, boombox:74, istanbulfm:44 };
  function radyoBaglantilari(){ return (D.radios||[]).map(function(r){
    var href = r.slug ? URLRadyo(r.slug) : r.url;
    var active = r.slug && r.slug===curSlug;
    var hedef = (r.slug?'':' target="_blank" rel="noopener"');
    var nokta = active ? '<span class="now" style="background:'+(r.color||'#fff')+'"></span>' : '';
    /* Logosu olmayan radyo eski biçimde (renkli nokta + isim) çizilir. */
    if(!r.logo){
      return '<a data-nav href="'+href+'"'+hedef+'>'+
             '<span class="dot" style="background:'+(r.color||'#fff')+'"></span>'+r.name+(active?' •':'')+'</a>';
    }
    var h = LOGO_H[r.slug] || 52;
    return '<a data-nav class="radio" href="'+href+'"'+hedef+' aria-label="'+r.name+'">'+
           '<img src="'+r.logo+'" alt="'+r.name+'" style="height:'+h+'px">'+nokta+'</a>';
  }).join(''); }
  ovl.setAttribute('role','dialog');
  ovl.setAttribute('aria-modal','true');
  ovl.setAttribute('aria-label','Menü');
  ovl.setAttribute('aria-hidden','true');
  function ovlDoldur(){
  ovl.innerHTML =
    '<div class="top"><img src="logo/bayrakstar-beyaz.png" alt="Bayrakstar"><button class="x" aria-label="Menüyü kapat">×</button></div>'+
    '<a data-nav href="index.html">Ana Sayfa</a>'+
    '<div class="lbl">Radyolarımız</div>'+
    radyoBaglantilari() +
    '<div class="lbl">Kurumsal</div>'+
    '<a data-nav class="small" href="index.html#hakkimizda">Hakkımızda</a>'+
    '<a data-nav class="small" href="index.html#radyolar">Tüm Radyolar</a>'+
    '<a data-nav class="small" href="index.html#iletisim">İletişim</a>';
  ovl.querySelector('.x').addEventListener('click', closeMenu);
  }
  document.body.appendChild(ovl);

  var burger = null;
  function openMenu(){
    ovl.classList.add('open'); document.body.style.overflow='hidden';
    ovl.setAttribute('aria-hidden','false');
    if(burger) burger.setAttribute('aria-expanded','true');
    var ilk = ovl.querySelector('a'); if(ilk) ilk.focus();
  }
  function closeMenu(){
    var aciktiMi = ovl.classList.contains('open');
    ovl.classList.remove('open'); document.body.style.overflow='';
    ovl.setAttribute('aria-hidden','true');
    if(burger){ burger.setAttribute('aria-expanded','false'); if(aciktiMi) burger.focus(); }
  }
  ovl.addEventListener('click', function(e){ if(e.target===ovl) closeMenu(); });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && ovl.classList.contains('open')) closeMenu();
  });

  /* ---- burger butonu (yoksa header'a ekle) ----
     Sayfa yenilenmeden gezinildiğinde <header> de değişiyor; bu yüzden
     her sayfa kurulumunda yeniden bağlanması gerekiyor. */
  function burgerKur(){
  var header = document.querySelector('header');
  burger = document.querySelector('.burger') || document.querySelector('.navburger');
  if(!burger && header){
    burger = document.createElement('button');
    burger.className = 'navburger';
    burger.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(burger);
  } else if(burger){
    burger.classList.add('navburger');
    burger.onclick = null; // eski davranışı kaldır
    /* index.html'deki burger bir <div> — klavyeyle de çalışsın */
    if(burger.tagName !== 'BUTTON'){
      burger.setAttribute('role','button');
      burger.setAttribute('tabindex','0');
      burger.addEventListener('keydown', function(e){
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openMenu(); }
      });
    }
  }
  if(burger){
    burger.setAttribute('aria-label','Menüyü aç');
    burger.setAttribute('aria-expanded','false');
    burger.addEventListener('click', openMenu);
  }
  }

  /* ============================================================
     SAYFA YENİLEMEDEN GEZİNME
     ------------------------------------------------------------
     NEDEN: Canlı yayın dinlerken başka sayfaya geçilince ses kesiliyordu.
     Sebebi, her sayfanın kendi <audio> düğümünün olması ve sayfa yeniden
     yüklenince o düğümün ölmesiydi.

     ÇÖZÜM: Sayfa artık YENİDEN YÜKLENMİYOR. Hedef sayfa arka planda
     indirilip <body> içeriği yerinde değiştiriliyor. Ses kaynağı
     (calar.js'teki <audio data-kalici>) bu değişimin dışında kaldığı için
     hiç ölmüyor — ses milisaniye bile kesilmiyor.

     KORUNAN DÜĞÜMLER: data-kalici işaretli olanlar (ses kaynağı, geçiş
     perdesi, mobil menü). Geri kalan her şey yenisiyle değişir.

     TEMİZLİK: Sayfaların kurduğu zamanlayıcı/gözlemcileri kendi
     sayfalarıyla birlikte kapatabilmek için sayfalar
     window.sayfaTemizligi(fn) ile kayıt bırakır; geçişte hepsi çağrılır.
     ============================================================ */

  /* Bunlar TÜM sayfalarda ortak; geçişte yeniden çalıştırılmamalı. */
  var ORTAK_BETIK = ['data.js','bulut.js','yayin.js','simdicaliyor.js','calar.js','site.js'];

  var temizleyiciler = [];
  window.sayfaTemizligi = function(fn){ if(typeof fn==='function') temizleyiciler.push(fn); };
  function temizle(){
    var liste = temizleyiciler; temizleyiciler = [];
    liste.forEach(function(f){ try{ f(); }catch(e){ if(window.console) console.warn(e); } });
  }

  /* Her sayfa kurulumunda tazelenmesi gerekenler */
  function sayfaKur(){
    curSlug = new URLSearchParams(location.search).get('r') || window.ON_SLUG || null;
    ovlDoldur();
    burgerKur();
  }

  /* DOMParser ile gelen <script> düğümleri ÇALIŞMAZ; yenisiyle değiştirilir.
     async=false, sırayı korumak için şart (kurumsal.js gibi dış betikler
     satır içi betiklerden önce/sonra doğru sırada çalışsın). */
  function betikleriCalistir(kok){
    var betikler = Array.prototype.slice.call(kok.querySelectorAll('script'));
    betikler.forEach(function(eski){
      var src = eski.getAttribute('src') || '';
      if(src && ORTAK_BETIK.some(function(ad){ return src.indexOf(ad) >= 0; })){
        eski.parentNode.removeChild(eski); return;
      }
      var yeni = document.createElement('script');
      for(var i=0;i<eski.attributes.length;i++){
        yeni.setAttribute(eski.attributes[i].name, eski.attributes[i].value);
      }
      yeni.async = false;
      yeni.textContent = eski.textContent;
      eski.parentNode.replaceChild(yeni, eski);
    });
  }

  /* Sayfaya özel <style> ve <title>/<meta> düğümlerini değiştirir. */
  function kafayiGuncelle(doc){
    /* Sayfaya ait tüm stiller gider, ortak olan (site.js'inki) kalır. */
    document.head.querySelectorAll('style:not([data-ortak])').forEach(function(n){ n.remove(); });
    doc.head.querySelectorAll('style').forEach(function(n){
      var k = document.createElement('style');
      k.setAttribute('data-sayfa','');
      k.textContent = n.textContent;
      document.head.appendChild(k);
    });
    document.title = doc.title || document.title;
    ['description'].forEach(function(ad){
      var y = doc.head.querySelector('meta[name="'+ad+'"]');
      var m = document.head.querySelector('meta[name="'+ad+'"]');
      if(y && m) m.setAttribute('content', y.getAttribute('content')||'');
    });
    var yc = doc.head.querySelector('link[rel="canonical"]');
    var mc = document.head.querySelector('link[rel="canonical"]');
    if(yc && mc) mc.setAttribute('href', yc.getAttribute('href')||'');
    /* Statik /r/ ve /y/ sayfalarındaki gömülü slug head'de duruyor; head
       betikleri çalıştırılmadığı için elle taşınmalı. */
    window.ON_SLUG = null; window.ON_HOST = null;
    doc.head.querySelectorAll('script:not([src])').forEach(function(n){
      var m1 = /ON_SLUG\s*=\s*"([^"]*)"/.exec(n.textContent||'');
      var m2 = /ON_HOST\s*=\s*"([^"]*)"/.exec(n.textContent||'');
      if(m1) window.ON_SLUG = m1[1];
      if(m2) window.ON_HOST = m2[1];
    });
  }

  function govdeyiDegistir(doc){
    Array.prototype.slice.call(document.body.children).forEach(function(n){
      if(!n.hasAttribute('data-kalici')) n.parentNode.removeChild(n);
    });
    var parca = document.createDocumentFragment();
    Array.prototype.slice.call(doc.body.children).forEach(function(n){
      parca.appendChild(document.importNode(n, true));
    });
    document.body.insertBefore(parca, document.body.firstChild);
    /* body'nin kendi sınıf/biçimleri de sayfaya ait */
    document.body.className = doc.body.className;
  }

  var geciyor = false;

  function spaGit(href, gecmiseYaz){
    if(geciyor) return;
    geciyor = true;
    perdeyiBoya(hedefRengi(href));
    curtain.classList.remove('out'); curtain.classList.add('in');

    /* Perde kapanma süresi ile indirme aynı anda yürüsün */
    var perdeBitti = new Promise(function(r){ setTimeout(r, 460); });

    fetch(href, { credentials:'same-origin' })
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(metin){
        var doc = new DOMParser().parseFromString(metin, 'text/html');
        return perdeBitti.then(function(){ return doc; });
      })
      .then(function(doc){
        temizle();
        /* radyo sayfaları --brand gibi değişkenleri <html>'e yazıyor;
           çatı sayfasına dönerken eski markanın rengi kalmasın */
        document.documentElement.removeAttribute('style');
        if(gecmiseYaz !== false) history.pushState({ bs:1 }, '', href);
        kafayiGuncelle(doc);
        govdeyiDegistir(doc);
        betikleriCalistir(document.body);
        sayfaKur();
        window.scrollTo(0, 0);
        requestAnimationFrame(function(){
          curtain.classList.remove('in'); curtain.classList.add('out');
        });
        geciyor = false;
      })
      .catch(function(e){
        /* Ağ/ayrıştırma sorunu: eski usul git, ziyaretçi takılı kalmasın */
        if(window.console) console.warn('[gezinme]', e);
        location.href = href;
      });
  }

  /* Geri/ileri tuşları */
  window.addEventListener('popstate', function(){
    spaGit(location.pathname + location.search, false);
  });

  /* ---- tüm iç .html linklerinde yumuşak geçiş ---- */
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href) return;
    if(a.target==='_blank' || a.hasAttribute('data-ext')) return;
    if(/^(https?:|mailto:|tel:)/.test(href)) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;  /* yeni sekme */
    if(href.charAt(0)==='#'){
      /* <base> kök dizini gösterdiği için tarayıcı "#bolum" bağlantısını ana
         sayfaya götürüyor. Aynı sayfa çapası olduğu için kaydırmayı biz
         yapıyoruz. */
      e.preventDefault(); closeMenu();
      var hedef = href.length>1 ? document.getElementById(href.slice(1)) : null;
      if(hedef) hedef.scrollIntoView({behavior:'smooth', block:'start'});
      else window.scrollTo({top:0, behavior:'smooth'});
      return;
    }
    if(href.indexOf('.html')===-1 && !/^(r|y)\//.test(href)) return;
    e.preventDefault();
    closeMenu();
    /* Ana sayfa bağlantısındaki #bolum: önce sayfayı getir, sonra kaydır */
    var parca = href.split('#');
    spaGit(parca[0]);
    if(parca[1]){
      setTimeout(function(){
        var h = document.getElementById(parca[1]);
        if(h) h.scrollIntoView({behavior:'smooth', block:'start'});
      }, 700);
    }
  });

  /* İlk açılışta da sayfaya özel kurulum yapılmalı (menü + burger). */
  sayfaKur();

  /* Geri/ileri ile (bfcache'ten) dönünce perde takılı kalmasın.
     DİKKAT: pageshow ilk açılışta da tetikleniyor; koşulsuz bırakılırsa
     perdeyi içerik gelmeden açıp beyaz ekran gösteriyordu. Bu yüzden
     yalnızca bfcache dönüşünde (e.persisted) çalışır. */
  window.addEventListener('pageshow', function(e){
    if(!e.persisted) return;
    curtain.classList.remove('in'); curtain.classList.add('out');
  });
})();


/* ============================================================
   KÜNYE / KVKK BAĞLANTILARI
   Her sayfada ayrı ayrı yazmak yerine tek yerden doldurulur.
   Yalnızca "yayında" işaretli bölüm listelenir — künye kapalıyken
   bağlantısı hiç çıkmaz, boş bir bölüme gitmez.
     <div data-yasal-blok hidden> ... <div data-yasal></div> </div>
   data-yasal-stil="satir" verilirse yan yana, yoksa ALT ALTA dizilir.
   ============================================================ */
(function(){
  function baglar(){
    var D = (window.getSiteData ? window.getSiteData() : window.DEFAULT_DATA) || {};
    var Y = D.yasal || {}, K = Y.kunye || {}, V = Y.kvkk || {}, b = [];
    var kDolu = (K.alanlar || []).some(function(a){ return a && (a.deger || '').trim(); });
    if(K.yayinda && kDolu)                    b.push(['yasal.html#kunye', K.baslik || 'Künye']);
    if(V.yayinda && (V.bolumler || []).length) b.push(['yasal.html#kvkk',  V.baslik || 'KVKK Aydınlatma Metni']);
    return b;
  }
  function doldur(){
    var b = baglar();
    var kaplar = document.querySelectorAll('[data-yasal]');
    for(var i = 0; i < kaplar.length; i++){
      var k = kaplar[i];
      var blok = k.closest ? k.closest('[data-yasal-blok]') : null;
      if(!b.length){ if(blok) blok.hidden = true; k.innerHTML = ''; continue; }
      var satir = k.getAttribute('data-yasal-stil') === 'satir';
      k.innerHTML = b.map(function(x){
        return '<a href="' + x[0] + '">' + x[1] + '</a>';
      }).join(satir ? ' · ' : '');
      if(!satir){
        /* ALT ALTA: her bağlantı kendi satırında */
        var a = k.querySelectorAll('a');
        for(var j = 0; j < a.length; j++) a[j].style.display = 'block';
      }
      if(blok) blok.hidden = false;
    }
  }
  function baslat(){
    if(window.bulutHazir && window.bulutHazir.then) window.bulutHazir.then(doldur, doldur);
    else doldur();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();

/* ============================================================
   SAYFA METİNLERİ + PAYLAŞIM BİLGİLERİ
   Eskiden HTML dosyalarına gömülü olan başlıklar, menü yazıları ve
   telif satırı artık panelden geliyor.

   Kullanımı: sayfada  <h2 data-metin="radyo.akisBaslik">Yayın Akışı</h2>
   HTML'deki yazı olduğu yerde kalır — bulut yavaşsa ya da hiç
   açılmazsa ziyaretçi boş kutu değil, o yazıyı görür. Veri gelince
   üstüne yazılır.

   "{yil}" yer tutucusu içinde bulunulan yılla değiştirilir; telif
   satırı her Ocak ayında kendiliğinden güncellenir.
   ============================================================ */
(function () {
  function oku(veri, yol) {
    var p = String(yol || '').split('.'), o = veri;
    for (var i = 0; i < p.length; i++) {
      if (!o || typeof o !== 'object') return null;
      o = o[p[i]];
    }
    return (typeof o === 'string') ? o : null;
  }

  /* "{yil}" içinde bulunulan yılla değişir. Panelde yer tutucunun içine
     doğrudan yıl yazılırsa ("{2026}") süslü parantezler sayfada
     görünüyordu — o hâli de yılla değiştiriyoruz, telif satırı her
     durumda düzgün ve kendiliğinden güncel kalsın. */
  var YER_TUTUCU_YIL = /\{\s*(?:yil|y\u0131l|\d{4})\s*\}/gi;
  function yerTutucu(metin) {
    return metin.replace(YER_TUTUCU_YIL, new Date().getFullYear());
  }

  function doldur() {
    var S = (window.getSiteData && window.getSiteData()) || {};
    var M = S.metinler || {};

    var hedefler = document.querySelectorAll('[data-metin]');
    for (var i = 0; i < hedefler.length; i++) {
      var el = hedefler[i];
      var yol = el.getAttribute('data-metin');
      /* Sayfaya özel üstüne yazma: radyo.html, o radyonun kendi bölüm
         başlıklarını (varsa) window.METIN_USTUNE ile buraya bırakıyor.
         Boş bırakılan başlık genel metne düşer. */
      var ustune = window.METIN_USTUNE && window.METIN_USTUNE[yol];
      var deger = (typeof ustune === 'string' && ustune.trim()) ? ustune : oku(M, yol);
      if (deger === null) {
        /* Panelde karşılığı yoksa HTML'deki yazıya dokunma; ama telif
           gibi yer tutuculu satırlar yine de çözülsün. */
        if (YER_TUTUCU_YIL.test(el.textContent)) { YER_TUTUCU_YIL.lastIndex = 0; el.textContent = yerTutucu(el.textContent); }
        YER_TUTUCU_YIL.lastIndex = 0;
        continue;
      }
      deger = yerTutucu(deger);
      if (deger === '') { el.hidden = true; continue; }
      /* Fenomen ve Fenomen Türk sayfalarında başlıkların içine
         paketler/kurumsal.js bir "yankı" katmanı sarıyor. Doğrudan
         textContent yazmak o katmanı siler ve efekt bir daha kurulmaz
         (kurumsal.js aynı başlığı ikinci kez sarmıyor). */
      var yanki = el.querySelector && el.querySelector('.kk-yanki');
      if (yanki) {
        yanki.textContent = deger;
        yanki.setAttribute('data-yanki', deger);
      } else {
        el.textContent = deger;
      }
      el.hidden = false;
    }

    /* --- Paylaşım & arama bilgileri --- */
    var anahtar = document.body && document.body.getAttribute('data-seo');
    if (!anahtar) return;
    var G = (S.seo || {})[anahtar];
    if (!G) return;

    function yaz(secici, ozellik, deger) {
      if (!deger) return;
      var el = document.querySelector(secici);
      if (el) el.setAttribute(ozellik, deger);
    }
    if (G.baslik) document.title = G.baslik;
    yaz('meta[name="description"]', 'content', G.aciklama);
    yaz('meta[property="og:title"]', 'content', G.paylasimBaslik || G.baslik);
    yaz('meta[property="og:description"]', 'content', G.paylasimAciklama || G.aciklama);
    yaz('meta[name="twitter:title"]', 'content', G.paylasimBaslik || G.baslik);
    yaz('meta[name="twitter:description"]', 'content', G.paylasimAciklama || G.aciklama);
  }

  function baslat() {
    if (window.bulutHazir && window.bulutHazir.then) window.bulutHazir.then(doldur, doldur);
    else doldur();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();
