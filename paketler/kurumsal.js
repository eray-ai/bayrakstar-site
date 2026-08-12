/* =====================================================================
   KURUMSAL GRAFİK PAKETLERİ — motor (önizleme)
   Kaynak: markaların LAYOUT_SISTEMI / SOSYAL_MEDYA şablonları.
   Sayfaya hiçbir şey ZORLA eklemez; body'deki .pa/.pb/.pc sınıfları
   hangi paketin görüneceğini belirler, hepsi CSS'te kapatılabilir.
   ===================================================================== */
(function(){
  "use strict";

  var NS = 'http://www.w3.org/2000/svg';
  function el(t,c){ var e=document.createElement(t); if(c) e.className=c; return e; }
  function svg(t,a){ var e=document.createElementNS(NS,t);
    for(var k in a) e.setAttribute(k,a[k]); return e; }
  /* aynı sayfada hep aynı deseni üretsin diye tohumlu sözde-rastgele */
  function rastgele(tohum){ var s=tohum; return function(){
    s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }

  /* ---------- hangi marka? ---------- */
  function slugBul(){
    if(window.ON_SLUG) return window.ON_SLUG;                    /* statik r/<slug>/ sayfaları */
    var m=/[?&]r=([^&]+)/.exec(location.search);
    if(m) return decodeURIComponent(m[1]);
    if(/\/(index|websiteler)?\.?html?$|\/$/.test(location.pathname)) return 'bayrakstar';
    return 'bayrakstar';
  }

  var MASKE = { fenomen:'daire', fenomenturk:'daire', istanbulfm:'yay', boombox:'firca' };

  /* =====================================================================
     PAKET A — MARKA ZEMİNLERİ
     ===================================================================== */

  /* Fenomen / Fenomen Türk: dev logo silueti + ayna tipografi şeridi */
  function katFenomen(kat, R, sade){
    var d=el('div','kk-dev'); kat.appendChild(d);
    if(sade) return;
    var a=el('div','kk-ayna');
    var ad=(R.name||'').toUpperCase();
    var s1=el('span'); s1.textContent=ad;
    var s2=el('span','m'); s2.textContent=ad;
    a.appendChild(s1); a.appendChild(s2); kat.appendChild(a);
  }

  /* Boombox: fırça darbesi + halftone + grafiti karalamalar */
  var FIRCA_D = 'M6,58 C110,12 250,96 392,44 C530,-6 654,82 786,36 '
              + 'C858,10 926,50 994,26 L998,72 C926,98 858,58 786,82 '
              + 'C654,126 530,42 392,92 C250,142 110,60 6,104 Z';
  function katBoombox(kat, R, sade){
    /* Bölüm içi sakin katmanda fırça KULLANILMAZ: düşük opaklıktaki sarı,
       koyu zeminde çamur yeşiline dönüyor. Orada yalnız halftone kalır. */
    if(!sade){
      var f=el('div','kk-firca');
      var s=svg('svg',{viewBox:'0 0 1000 120',preserveAspectRatio:'none'});
      s.appendChild(svg('path',{d:FIRCA_D}));
      f.appendChild(s); kat.appendChild(f);
    }
    var n=el('div','kk-nokta'); kat.appendChild(n);
    if(sade) return;

    var g=el('div','kk-grafiti');
    /* Boombox'ta sarı --brand, --accent ise SİYAH (#111) — sarıyı color'dan al */
    var yesil=R.accent2||'#00ff00', sari=R.color||'#ffca11';

    /* karalama çizgi */
    var g1=svg('svg',{'class':'g1',viewBox:'0 0 120 40'});
    g1.appendChild(svg('path',{d:'M4,30 C24,6 34,34 54,12 C72,-6 82,30 100,10 C108,2 114,14 118,10',
      stroke:yesil,'stroke-width':'5'}));
    g.appendChild(g1);

    /* gülen yüz */
    var g2=svg('svg',{'class':'g2',viewBox:'0 0 60 60'});
    g2.appendChild(svg('circle',{cx:30,cy:30,r:25,stroke:sari,'stroke-width':'4'}));
    g2.appendChild(svg('path',{d:'M17,22 l7,7 M24,22 l-7,7',stroke:sari,'stroke-width':'4'}));
    g2.appendChild(svg('path',{d:'M36,22 l7,7 M43,22 l-7,7',stroke:sari,'stroke-width':'4'}));
    g2.appendChild(svg('path',{d:'M18,38 C24,48 36,48 42,38',stroke:sari,'stroke-width':'4'}));
    g.appendChild(g2);

    /* taç */
    var g3=svg('svg',{'class':'g3',viewBox:'0 0 80 46'});
    g3.appendChild(svg('path',{d:'M6,40 L12,10 L26,28 L40,6 L54,28 L68,10 L74,40 Z',
      stroke:sari,'stroke-width':'4.5'}));
    g.appendChild(g3);

    /* şimşek */
    var g4=svg('svg',{'class':'g4',viewBox:'0 0 40 60'});
    g4.appendChild(svg('path',{d:'M24,3 L8,32 L19,32 L14,57 L32,26 L21,26 Z',
      stroke:yesil,'stroke-width':'4'}));
    g.appendChild(g4);

    kat.appendChild(g);
  }

  /* İstanbul FM: çeyrek daire mozaik + köşe yayı */
  function mozaikSVG(R, seyreklik){
    var s=svg('svg',{viewBox:'0 0 720 480',preserveAspectRatio:'xMidYMid slice'});
    var renkler=[R.color||'#0081ba', R.accent||'#ff5959', '#bbf5bd', '#ffffff'];
    var rnd=rastgele(97), B=60;
    for(var y=0;y<480;y+=B){
      for(var x=0;x<720;x+=B){
        if(rnd()<seyreklik) continue;                  /* seyrek bırak, fotoğrafı boğmasın */
        var r=renkler[Math.floor(rnd()*renkler.length)];
        var don=Math.floor(rnd()*4)*90;
        var p=svg('path',{d:'M0,0 H'+B+' A'+B+','+B+' 0 0 1 0,'+B+' Z', fill:r,
          transform:'translate('+x+','+y+') rotate('+don+','+(B/2)+','+(B/2)+')'});
        p.setAttribute('opacity', (0.45+rnd()*0.5).toFixed(2));
        s.appendChild(p);
      }
    }
    return s;
  }
  function katIstanbul(kat, R, sade){
    var m=el('div','kk-mozaik');
    m.appendChild(mozaikSVG(R, sade?0.78:0.66)); kat.appendChild(m);
    if(sade) return;
    kat.appendChild(el('div','kk-yay y1'));
  }

  /* Bayrakstar çatı: eğik kapsül şeritler + renk bloğu mozaiği */
  function katCati(kat, R, sade){
    var renkler=['#ff0007','#f75843','#ffca11','#00bac5','#0081ba'];
    var rnd=rastgele(41);
    for(var i=0;i<7;i++){
      var k=el('div','kk-kapsul');
      var w=90+Math.floor(rnd()*260), uz=180+Math.floor(rnd()*320);
      k.style.width=uz+'px'; k.style.height=(28+Math.floor(rnd()*26))+'px';
      k.style.left=(rnd()*100)+'%'; k.style.top=(rnd()*100)+'%';
      k.style.background=renkler[i%renkler.length];
      k.style.transform='rotate(-45deg) translate(-50%,-50%)';
      kat.appendChild(k);
    }
    if(sade) return;
    var b=el('div','kk-blok');
    b.style.left='0'; b.style.right='0'; b.style.bottom='0'; b.style.height='14px';
    for(var j=0;j<12;j++){ var s=el('i'); s.style.background=renkler[j%renkler.length]; b.appendChild(s); }
    kat.appendChild(b);
  }

  var KATLAR = { fenomen:katFenomen, fenomenturk:katFenomen, boombox:katBoombox,
                 istanbulfm:katIstanbul, bayrakstar:katCati };

  function paketA(slug, R){
    var ciz = KATLAR[slug] || katCati;
    var ana = document.querySelector('.hero') || document.querySelector('.slider');
    if(ana){
      if(getComputedStyle(ana).position==='static') ana.style.position='relative';
      var k=el('div','kk-kat'); ciz(k,R,false); ana.appendChild(k);
    }
    /* bölümlerde daha sakin bir yankı */
    var bolumler = document.querySelector('.hero')
      ? ['.about','#secSched','#secFreq']
      : ['.intro','.radios'];
    bolumler.forEach(function(sec){
      var e=document.querySelector(sec); if(!e) return;
      if(getComputedStyle(e).position==='static') e.style.position='relative';
      e.style.overflow='hidden';
      var k=el('div','kk-kat sade'); ciz(k,R,true); e.insertBefore(k, e.firstChild);
    });
  }

  /* =====================================================================
     PAKET B — MARKA BİLEŞENLERİ
     ===================================================================== */
  function paketB(slug, R){
    /* hero'ya resmî canlı rozeti */
    var hb=document.querySelector('.hero .freqline');
    if(hb && !hb.querySelector('.kk-live')){
      var r=el('span','kk-live'); r.textContent='Canlı';
      hb.insertBefore(r, hb.firstChild);
    }
    /* Boombox: bölüm başlıklarına fosforlu kalem vurgusu */
    if(slug==='boombox'){
      Array.prototype.forEach.call(document.querySelectorAll('.sec h2,.about h2'), function(h){
        if(h.querySelector('.kk-vurgu')) return;
        var t=h.textContent.trim(); if(!t) return;
        var kelimeler=t.split(/\s+/);
        var son=kelimeler.pop();
        h.textContent=kelimeler.join(' ')+' ';
        var s=el('span','kk-vurgu'); s.textContent=son; h.appendChild(s);
      });
    }
    /* Fenomen / FT: başlıkların altına ayna yankısı */
    if(slug==='fenomen'||slug==='fenomenturk'){
      Array.prototype.forEach.call(document.querySelectorAll('.sec h2'), function(h){
        if(h.querySelector('.kk-yanki')) return;
        var t=h.textContent.trim(); if(!t) return;
        h.textContent='';
        var s=el('span','kk-yanki'); s.textContent=t; s.setAttribute('data-yanki',t);
        h.appendChild(s);
      });
    }
  }

  /* =====================================================================
     PAKET C — KURUMSAL KARTLAR
     C1: ana sayfadaki 4 radyo kartı, stok fotoğraf yerine KENDİ grafik dilini alır
     C2: fotoğrafsız yayıncı için rehberin kendi kart düzeni (yedek olarak durur)
     ===================================================================== */
  function paketC1(D){
    var kartlar=document.querySelectorAll('.rcard');
    if(!kartlar.length) return;
    Array.prototype.forEach.call(kartlar, function(rc){
      if(rc.querySelector('.kk-rk')) return;
      var href=rc.getAttribute('href')||'';
      var m=/[?&]r=([^&]+)/.exec(href) || /(?:^|\/)r\/([^\/]+)\/?/.exec(href);
      var s=m?decodeURIComponent(m[1]):'';
      var R=(D.radios||[]).filter(function(r){ return r.slug===s; })[0];
      /* adresten çözülemezse kartın kendi sırasına düş (index.html dataset.idx yazıyor) */
      if(!R && rc.dataset && rc.dataset.idx!=null) R=(D.radios||[])[+rc.dataset.idx];
      if(!R) return;
      s = R.slug;

      var kat=el('div','kk-rk');
      kat.style.setProperty('--kkc', R.color||'#ff0007');
      kat.style.setProperty('--kka', s==='boombox' ? (R.color||'#ffca11') : (R.accent||'#ffca11'));
      if(R.logo) kat.style.setProperty('--kkl','url("'+new URL(R.logo,document.baseURI).href+'")');

      if(s==='fenomen'||s==='fenomenturk'){
        kat.appendChild(el('div','d'));
      } else if(s==='boombox'){
        var f=el('div','f');
        var sv=svg('svg',{viewBox:'0 0 1000 120',preserveAspectRatio:'none'});
        sv.appendChild(svg('path',{d:FIRCA_D, fill:R.color||'#ffca11'}));
        f.appendChild(sv); kat.appendChild(f);
        var n=el('div','n'); kat.appendChild(n);
      } else if(s==='istanbulfm'){
        var mz=el('div','mz'); mz.appendChild(mozaikSVG(R,0.6)); kat.appendChild(mz);
      } else {
        kat.appendChild(el('div','d'));
      }
      var ic=rc.querySelector('.inner');
      rc.insertBefore(kat, ic || null);
    });
  }

  function paketC(slug, R){
    var kartlar=document.querySelectorAll('.host .ph.fotosuz');
    if(!kartlar.length) return;
    Array.prototype.forEach.call(kartlar, function(ph){
      if(ph.querySelector('.kk-kart')) return;
      var host = ph.closest('.host');
      var ad   = (host.querySelector('.hn')||{}).textContent || '';
      var show = (host.querySelector('.hs')||{}).textContent || '';
      /* yayın akışından bu yayıncının saatini yakala */
      var saat = '';
      Array.prototype.some.call(document.querySelectorAll('.tl'), function(tl){
        var sun=(tl.querySelector('.ph2')||{}).textContent||'';
        if(ad && sun && sun.toLocaleLowerCase('tr').indexOf(ad.toLocaleLowerCase('tr').split(' ')[0])>-1){
          saat=(tl.querySelector('.tm')||{}).textContent||''; return true;
        }
        return false;
      });

      var k=el('div','kk-kart');
      var ust=el('div','ust');
      var p=el('div','prog'); p.textContent=show; ust.appendChild(p);
      var lv=el('span','kk-live'); lv.textContent='Live'; ust.appendChild(lv);
      k.appendChild(ust);

      var n=el('div','ad'); n.textContent=(ad||'').toLocaleUpperCase('tr'); k.appendChild(n);

      var alt=el('div','alt');
      if(saat){ var s=el('span','saat'); s.textContent=saat.trim(); alt.appendChild(s); }
      if(R.logo){ var lg=document.createElement('img'); lg.className='lg'; lg.src=R.logo;
        lg.alt=''; lg.loading='lazy'; alt.appendChild(lg); }
      k.appendChild(alt);
      ph.appendChild(k);
    });
  }

  /* =====================================================================
     KURULUM
     ===================================================================== */
  function kur(){
    var D = (window.getSiteData ? window.getSiteData() : window.DEFAULT_DATA) || {};
    var slug = slugBul();
    var R = (D.radios||[]).filter(function(r){ return r.slug===slug; })[0];
    var cati = !R;
    if(cati) R = { name:'Bayrakstar', color:'#ff0007', accent:'#ffca11',
                   accent2:'#00bac5', logo:'logo/bayrakstar-beyaz.png' };

    /* --- panelden gelen ayarlar (D.grafik) --- */
    var G = Object.assign({zeminler:true,bilesenler:true,kartlar:true,yogunluk:15},
                          D.grafik || {});
    var h=document.documentElement, b=document.body;
    b.classList.toggle('pa', G.zeminler   !== false);
    b.classList.toggle('pb', G.bilesenler !== false);
    b.classList.toggle('pc', G.kartlar    !== false);
    var yog = Math.max(0, Math.min(100, parseFloat(G.yogunluk)));
    if(isNaN(yog)) yog = 15;
    h.style.setProperty('--kk-a', (yog/100).toFixed(3));
    /* üçü de kapalıysa hiç uğraşma */
    if(G.zeminler===false && G.bilesenler===false && G.kartlar===false){
      window.KK_KURULDU = true; return;
    }
    var marka = cati ? 'bayrakstar' : slug;
    h.setAttribute('data-marka',marka); b.setAttribute('data-marka',marka);
    if(MASKE[marka]) b.setAttribute('data-maske',MASKE[marka]);
    /* DİKKAT: özel değişkenin içindeki göreli yol, kullanıldığı CSS dosyasına
       göre çözülür (paketler/ altına bakar ve 404 verir) — mutlak adrese çevir. */
    if(R.logo) h.style.setProperty('--kk-logo','url("'+new URL(R.logo,document.baseURI).href+'")');
    h.style.setProperty('--kk-firca-mask',
      'url(\'data:image/svg+xml;utf8,'+encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 120" preserveAspectRatio="none">'
        + '<path d="'+FIRCA_D+'" fill="#000"/></svg>')+'\')');

    if(!document.querySelector('.kk-kat')) paketA(marka,R);
    paketB(marka,R);
    paketC1(D);
    paketC(marka,R);
    window.KK_KURULDU = true;
  }

  /* içerik bulut/localStorage'dan geldikten SONRA çalış */
  function baslat(){
    if(window.bulutHazir && window.bulutHazir.then)
      window.bulutHazir.then(function(){ setTimeout(kur,0); }, function(){ setTimeout(kur,0); });
    else setTimeout(kur,0);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',baslat);
  else baslat();
})();
