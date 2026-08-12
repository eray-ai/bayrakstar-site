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

  function goTo(href){
    perdeyiBoya(hedefRengi(href));      /* GİDİLEN sayfanın rengiyle kapan */
    curtain.classList.remove('out'); curtain.classList.add('in');
    setTimeout(function(){ location.href = href; }, 460);
  }

  /* ---- overlay menü kur ---- */
  var ovl = document.createElement('div');
  ovl.className = 'navovl';
  var radioLinks = (D.radios||[]).map(function(r){
    var href = r.slug ? URLRadyo(r.slug) : r.url;
    var active = r.slug && r.slug===curSlug;
    return '<a data-nav href="'+href+'"'+(r.slug?'':' target="_blank" rel="noopener"')+'>'+
           '<span class="dot" style="background:'+(r.color||'#fff')+'"></span>'+r.name+(active?' •':'')+'</a>';
  }).join('');
  ovl.setAttribute('role','dialog');
  ovl.setAttribute('aria-modal','true');
  ovl.setAttribute('aria-label','Menü');
  ovl.setAttribute('aria-hidden','true');
  ovl.innerHTML =
    '<div class="top"><img src="logo/bayrakstar-beyaz.png" alt="Bayrakstar"><button class="x" aria-label="Menüyü kapat">×</button></div>'+
    '<a data-nav href="index.html">Ana Sayfa</a>'+
    '<div class="lbl">Radyolarımız</div>'+
    radioLinks +
    '<div class="lbl">Kurumsal</div>'+
    '<a data-nav class="small" href="index.html#hakkimizda">Hakkımızda</a>'+
    '<a data-nav class="small" href="index.html#radyolar">Tüm Radyolar</a>'+
    '<a data-nav class="small" href="index.html#iletisim">İletişim</a>';
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
  ovl.querySelector('.x').addEventListener('click', closeMenu);
  ovl.addEventListener('click', function(e){ if(e.target===ovl) closeMenu(); });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && ovl.classList.contains('open')) closeMenu();
  });

  /* ---- burger butonu (yoksa header'a ekle) ---- */
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

  /* ---- tüm iç .html linklerinde yumuşak geçiş ---- */
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href) return;
    if(a.target==='_blank' || a.hasAttribute('data-ext')) return;
    if(/^(https?:|mailto:|tel:)/.test(href)) return;
    if(href.charAt(0)==='#'){ closeMenu(); return; }        // aynı sayfa çapası
    if(href.indexOf('.html')===-1) return;
    // aynı sayfaya (aynı radyo) tıklama → sadece menüyü kapat
    e.preventDefault();
    closeMenu();
    goTo(href);
  });

  /* Geri/ileri ile (bfcache'ten) dönünce perde takılı kalmasın.
     DİKKAT: pageshow ilk açılışta da tetikleniyor; koşulsuz bırakılırsa
     perdeyi içerik gelmeden açıp beyaz ekran gösteriyordu. Bu yüzden
     yalnızca bfcache dönüşünde (e.persisted) çalışır. */
  window.addEventListener('pageshow', function(e){
    if(!e.persisted) return;
    curtain.classList.remove('in'); curtain.classList.add('out');
  });
})();
