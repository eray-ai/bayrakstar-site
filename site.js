/* ============================================================
   Bayrakstar — Ortak Navigasyon + Sayfa Geçişleri
   index.html ve radyo.html'de kullanılır (data.js'ten sonra yüklenir)
   ============================================================ */
(function(){
  var D = (window.getSiteData ? window.getSiteData() : (window.DEFAULT_DATA||{radios:[]}));
  var onIndex = /index\.html$|\/$|^$/.test(location.pathname.split('/').pop()||'') || location.pathname.endsWith('/');
  var curSlug = new URLSearchParams(location.search).get('r');

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
    .pagecurtain .cload i{width:6px;height:34px;background:#fff;border-radius:4px;animation:cl .8s ease-in-out infinite}
    .pagecurtain .cload i:nth-child(2){animation-delay:.12s}.pagecurtain .cload i:nth-child(3){animation-delay:.24s}
    .pagecurtain .cload i:nth-child(4){animation-delay:.36s}.pagecurtain .cload i:nth-child(5){animation-delay:.48s}
    @keyframes cl{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
  `;
  document.head.appendChild(css);

  /* ---- sayfa geçiş perdesi ---- */
  var curtain = document.createElement('div');
  curtain.className = 'pagecurtain';
  curtain.innerHTML = '<div class="cload"><i></i><i></i><i></i><i></i><i></i></div>';
  document.body.appendChild(curtain);
  // temada marka rengi varsa perdeyi ona göre boya (radyo sayfaları)
  var brand = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
  if(brand) curtain.style.background = 'linear-gradient(120deg,'+brand+', #111 120%)';
  requestAnimationFrame(function(){ curtain.classList.add('out'); });

  function goTo(href){
    curtain.classList.remove('out'); curtain.classList.add('in');
    setTimeout(function(){ location.href = href; }, 460);
  }

  /* ---- overlay menü kur ---- */
  var ovl = document.createElement('div');
  ovl.className = 'navovl';
  var radioLinks = (D.radios||[]).map(function(r){
    var href = r.slug ? ('radyo.html?r='+r.slug) : r.url;
    var active = r.slug && r.slug===curSlug;
    return '<a data-nav href="'+href+'"'+(r.slug?'':' target="_blank" rel="noopener"')+'>'+
           '<span class="dot" style="background:'+(r.color||'#fff')+'"></span>'+r.name+(active?' •':'')+'</a>';
  }).join('');
  ovl.innerHTML =
    '<div class="top"><img src="logo/bayrakstar-beyaz.png" alt="Bayrakstar"><button class="x" aria-label="Kapat">×</button></div>'+
    '<a data-nav href="index.html">Ana Sayfa</a>'+
    '<div class="lbl">Radyolarımız</div>'+
    radioLinks +
    '<div class="lbl">Kurumsal</div>'+
    '<a data-nav class="small" href="index.html#hakkimizda">Hakkımızda</a>'+
    '<a data-nav class="small" href="index.html#radyolar">Tüm Radyolar</a>'+
    '<a data-nav class="small" href="index.html#iletisim">İletişim</a>';
  document.body.appendChild(ovl);

  function openMenu(){ ovl.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeMenu(){ ovl.classList.remove('open'); document.body.style.overflow=''; }
  ovl.querySelector('.x').addEventListener('click', closeMenu);
  ovl.addEventListener('click', function(e){ if(e.target===ovl) closeMenu(); });

  /* ---- burger butonu (yoksa header'a ekle) ---- */
  var header = document.querySelector('header');
  var burger = document.querySelector('.burger') || document.querySelector('.navburger');
  if(!burger && header){
    burger = document.createElement('button');
    burger.className = 'navburger';
    burger.setAttribute('aria-label','Menü');
    burger.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(burger);
  } else if(burger){
    burger.classList.add('navburger');
    burger.onclick = null; // eski davranışı kaldır
  }
  if(burger) burger.addEventListener('click', openMenu);

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

  // geri/ileri ile gelince perde takılı kalmasın
  window.addEventListener('pageshow', function(){ curtain.classList.remove('in'); curtain.classList.add('out'); });
})();
