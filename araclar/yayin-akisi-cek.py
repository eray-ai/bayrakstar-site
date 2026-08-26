#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BAYRAKSTAR — Yayın akışı güncelleyici
=====================================

NEDEN VAR
---------
data.js'teki yayın akışları elle girilmişti ve eksikti: Radyo Fenomen ile
Fenomen Türk'te yalnız Cuma/Cumartesi/Pazar günleri vardı, Boombox ve
İstanbul FM'de hiç güne özel akış yoktu — kalan günlerde herkese aynı
"varsayılan akış" gösteriliyordu. Bu araç HER RADYONUN KENDİ SİTESİNDEN
7 günün akışını çekip data.js'e yazar.

KAYNAKLAR (ikisi HTML, ikisi JSON)
  Radyo Fenomen / Fenomen Türk : /yayin-akisi/ sayfası, sekmeler #menu1..#menu7
  Radyo Boombox / İstanbul FM  : /yayin-akisi/?_data=routes/$  (Remix loader)

KORUNAN ŞEYLER
--------------
Elle girilmiş güzelleştirmeler KAYBOLMAZ. Kaynaktaki program adı, data.js'te
zaten geçen bir adla eşleşiyorsa (büyük/küçük harf ve noktalama farkı
gözetilmeden) o kaydın adı, sunucusu (host) ve görseli (img) aynen taşınır.
Fenomen'in sitesi programları BÜYÜK HARFLE yazıyor; eşleşme bulunamazsa
Türkçe kurallarına göre başlık biçimine çevrilir.

KULLANIM
    uv run --with requests python araclar/yayin-akisi-cek.py           # önizleme
    uv run --with requests python araclar/yayin-akisi-cek.py --uygula  # data.js'e yaz

NOT: data.js'i güncellemek YETMEZ. Buluttaki (Supabase) kayıt aynı radyoda
scheduleGun taşıyorsa o kazanır. Araç --uygula ile çalışınca bunu söyler.
"""

import json, re, sys, unicodedata, pathlib, html as htmlmod
import requests

KOK = pathlib.Path(__file__).resolve().parent.parent
DATA_JS = KOK / "data.js"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36")

# gün anahtarı: 0 = Pazartesi ... 6 = Pazar  (radyo.html'deki days dizisiyle aynı)
KAYNAKLAR = {
    "fenomen":     ("html", "https://www.radyofenomen.com/yayin-akisi/"),
    "fenomenturk": ("html", "https://www.fenomenturk.com/yayin-akisi/"),
    "boombox":     ("json", "https://www.radyoboombox.com.tr/yayin-akisi/?_data=routes%2F%24"),
    "istanbulfm":  ("json", "https://www.istanbulfm.com.tr/yayin-akisi/?_data=routes%2F%24"),
}

# ---------------------------------------------------------------- yardımcılar

KUCUK = {"I": "ı", "İ": "i"}
BUYUK = {"i": "İ", "ı": "I"}

def tr_kucult(s):
    return "".join(KUCUK.get(c, c) for c in s).lower()

TR_HARF = set("İÇĞÖŞÜ")
KISALTMA = {"DJ", "MC", "FM", "TV", "XL", "RB"}

def tr_baslik(s):
    """Türkçe başlık biçimi. 'MAKSİMUM HİT MÜZİK' -> 'Maksimum Hit Müzik'.
       Kesme işaretinden sonrası küçük kalır: "SERDAR'LA" -> "Serdar'la".

       İKİ TUZAK VAR:
       1) Zaten düzgün yazılmış adı BOZMA. Boombox ve İstanbul FM'in verisi
          doğru biçimde geliyor; "İstanbul FM" bu işlemden geçince "İstanbul Fm"
          oluyordu. Bu yüzden içinde küçük harf olan metne hiç dokunulmaz.
       2) I harfinin küçüğü Türkçede "ı", İngilizcede "i". Cümlede Türkçeye
          özgü bir harf (İÇĞÖŞÜ) varsa Türkçe kuralı, yoksa düz Latin kuralı
          uygulanır. Yoksa "SPECIALBOX" -> "Specıalbox" oluyordu."""
    if any(c.islower() for c in s):
        return s                      # kaynak zaten düzgün yazmış, karışma
    turkce = any(c in TR_HARF for c in s)
    kucult = tr_kucult if turkce else (lambda x: x.lower())

    def kelime(k):
        if not k:
            return k
        if k in KISALTMA:            # DJ, MC, FM... küçültme
            return k
        # noktalı baş harfler olduğu gibi kalsın: "U.F.U.K" -> "U.f.u.k" olmasın
        if re.match(r"^(?:[A-ZÇĞİÖŞÜ]\.){2,}[A-ZÇĞİÖŞÜ]?\.?$", k):
            return k
        ilk, kalan = k[0], kucult(k[1:])
        ilk = BUYUK.get(tr_kucult(ilk), ilk.upper()) if turkce else ilk.upper()
        return ilk + kalan
    parcalar = re.split(r"([\s-]+)", s.strip())
    cikti = []
    for p in parcalar:
        if p.isspace() or not p:
            cikti.append(p); continue
        # kesme işareti: sağ taraf ek, küçük kalsın
        m = re.match(r"^(.*?)([’'](.*))?$", p, re.S)
        gov = m.group(1)
        cikti.append(kelime(gov) + (kucult(m.group(2)) if m.group(2) else ""))
    return "".join(cikti)

def anahtarla(s):
    """Karşılaştırma anahtarı: harf ve rakam dışındaki her şey atılır.
       i/ı/İ/I dördü de "i" sayılır — kaynak "K-BILLY", elimizdeki
       "K-Billy" yazıyor; bu ayrım yüzünden eşleşme kaçıyordu."""
    s = tr_kucult(s or "")
    s = s.replace("ı", "i")
    s = unicodedata.normalize("NFKD", s)
    return re.sub(r"[^0-9a-zçğöşü]+", "", s)

def saat_araligi(baslangiclar, i):
    b = baslangiclar[i]
    s = baslangiclar[(i + 1) % len(baslangiclar)]
    return "%s – %s" % (b, s)

# ---------------------------------------------------------------- çekiciler

def cek_html(url):
    """Fenomen tarzı sayfa: #menu1..#menu7 sekmeleri, sch_hour + <span>ad."""
    r = requests.get(url, headers={"User-Agent": UA}, timeout=25)
    r.raise_for_status()
    s = r.text
    gunler = {}
    for n in range(1, 8):
        i = s.find('id="menu%d"' % n)
        if i < 0:
            continue
        j = s.find('id="menu%d"' % (n + 1))
        blok = s[i:j] if j > i else s[i:]
        satir = []
        for m in re.finditer(
                r'class="sch_hour">\s*([^<]+?)\s*</div>.*?<span>\s*(.*?)\s*</span>',
                blok, re.S):
            saat = re.sub(r"\s*-\s*", " – ", m.group(1).strip())
            ad = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
            if ad:
                satir.append({"t": saat, "name": ad})
        if satir:
            gunler[n - 1] = satir
    return gunler

def cek_json(url):
    """Remix loader: data.list[] -> day_of_week (1=Pazartesi) + list[]."""
    r = requests.get(url, headers={"User-Agent": UA, "Accept": "application/json"}, timeout=25)
    r.raise_for_status()
    liste = (r.json().get("data") or {}).get("list") or []
    gunler = {}
    for g in liste:
        gun = int(g.get("day_of_week", 0)) - 1     # 1..7 -> 0..6
        prog = g.get("list") or []
        if gun < 0 or not prog:
            continue
        saatler = [str(p.get("sch_hour", "")).strip()[:5] for p in prog]
        satir = []
        for i, p in enumerate(prog):
            ad = (p.get("prg_name") or "").strip()
            if not ad:
                continue
            kayit = {"t": saat_araligi(saatler, i), "name": ad}
            sunucu = p.get("programmers") or []
            if isinstance(sunucu, list) and sunucu:
                isim = (sunucu[0].get("name") or "").strip() if isinstance(sunucu[0], dict) else ""
                if isim:
                    kayit["host"] = isim
            satir.append(kayit)
        if satir:
            gunler[gun] = satir
    return gunler

# ---------------------------------------------------------------- data.js

def buluttan_oku():
    """Supabase'teki CANLI içerik. Panelden elle güzelleştirilmiş program
       adları (ör. "DJ K-Billy'le Fenomen Hit Müzik") orada duruyor; sözlüğü
       önce oradan besliyoruz ki yeniden çekince kaybolmasınlar."""
    bulut = (KOK / "bulut.js").read_text(encoding="utf-8")
    url = re.search(r'URL_\s*=\s*"([^"]+)"', bulut)
    key = re.search(r'KEY\s*=\s*"([^"]+)"', bulut)
    if not (url and key):
        return None
    try:
        r = requests.get(url.group(1) + "/rest/v1/site_icerik?select=data&id=eq.1",
                         headers={"apikey": key.group(1)}, timeout=20)
        r.raise_for_status()
        satir = r.json()
        return satir[0]["data"] if satir else None
    except Exception as e:
        print("  ! Bulut okunamadı (%s) — yalnız data.js kullanılacak." % e)
        return None


def data_oku():
    s = DATA_JS.read_text(encoding="utf-8")
    m = re.search(r"DEFAULT_DATA\s*=\s*", s)
    govde = s[m.end():]
    d = 0
    for k, c in enumerate(govde):
        if c == "{":
            d += 1
        elif c == "}":
            d -= 1
            if d == 0:
                govde = govde[:k + 1]
                break
    return s, m.end(), json.loads(govde), len(govde)

def ad_sunucu_ayir(ad):
    """Fenomen'in akışı sunucuyu program adına yapıştırıyor:
       "UNDERGROUND BOUTİQUE - YUNUS ÖZYAVUZ". Sitede bunlar ayrı alanlar
       (name / host); son " - " işaretinden bölüyoruz."""
    p = ad.rsplit(" - ", 1)
    if len(p) == 2 and p[0].strip() and p[1].strip():
        return p[0].strip(), p[1].strip()
    return ad, None


def zenginlestir(satirlar, sozluk):
    """Kaynaktan gelen satırları data.js'teki elle girilmiş bilgiyle tamamlar."""
    cikti = []
    for r in satirlar:
        ham_ad, ham_sunucu = ad_sunucu_ayir(r["name"])
        r = dict(r, name=ham_ad)
        if ham_sunucu and not r.get("host"):
            r["host"] = tr_baslik(ham_sunucu)
        a = anahtarla(r["name"])
        eski = sozluk.get(a)
        yeni = {"t": r["t"], "name": eski["name"] if eski else tr_baslik(r["name"])}
        # SUNUCU: kaynağın o SATIR için verdiği isim önceliklidir. Sözlükteki
        # isim program adına bağlı; "Underground Boutique" her saat başka
        # DJ'de olduğu için sözlüğe güvenmek üçünü de aynı kişi gösteriyordu.
        # Aynı kişiyse elimizdeki yazım (büyük harfli sahne adı vb.) korunur.
        satir_host = r.get("host")
        soz_host = (eski or {}).get("host")
        if satir_host and soz_host and anahtarla(satir_host) == anahtarla(soz_host):
            yeni["host"] = soz_host
        elif satir_host:
            yeni["host"] = satir_host
        elif soz_host:
            yeni["host"] = soz_host
        if eski and eski.get("img"):
            yeni["img"] = eski["img"]
        cikti.append(yeni)
    return cikti

def main():
    uygula = "--uygula" in sys.argv
    ham, bas, D, uz = data_oku()
    canli = buluttan_oku() or {}
    canli_radyo = {r.get("slug"): r for r in (canli.get("radios") or []) if r.get("slug")}

    for radyo in D["radios"]:
        slug = radyo.get("slug")
        if slug not in KAYNAKLAR:
            continue
        tip, url = KAYNAKLAR[slug]
        try:
            gunler = (cek_html if tip == "html" else cek_json)(url)
        except Exception as e:
            print("!! %-12s çekilemedi: %s" % (slug, e))
            continue
        if len(gunler) < 7:
            print("!! %-12s yalnız %d gün geldi, atlanıyor" % (slug, len(gunler)))
            continue

        # ad -> kayıt sözlüğü. ÖNCE bulut (en güncel elle düzeltmeler),
        # SONRA data.js. İlk giren kazanır.
        sozluk = {}
        for kaynak in (canli_radyo.get(slug), radyo):
            if not kaynak:
                continue
            for r in (kaynak.get("schedule") or []):
                sozluk.setdefault(anahtarla(r.get("name")), r)
            for g, lst in (kaynak.get("scheduleGun") or {}).items():
                for r in (lst or []):
                    sozluk.setdefault(anahtarla(r.get("name")), r)

        # SIRALAMA YAPILMIYOR — bilerek. Radyoların akışı gece yarısını aşıyor:
        # Cuma listesi hem "00:00 – 07:00" (Cuma sabahı) hem de en altta
        # "00:00 – 03:00" (Cumartesi'ye sarkan gece programları) içeriyor.
        # Saate göre sıralamak bu ikisini üst üste bindiriyor. Kaynağın kendi
        # sırası korunursa hem radyonun sitesiyle birebir aynı olur hem de
        # "● ŞİMDİ" hesabı doğru satırı bulur (listeyi baştan tarıyor).
        yeni = {str(g): zenginlestir(gunler[g], sozluk) for g in sorted(gunler)}
        eski = radyo.get("scheduleGun") or {}
        print("== %-12s %d gün" % (slug, len(yeni)),
              "(önce %d gün vardı)" % len(eski))
        for g in sorted(yeni, key=int):
            ad = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][int(g)]
            iz = "değişti" if json.dumps(eski.get(g), ensure_ascii=False) != json.dumps(yeni[g], ensure_ascii=False) else "aynı"
            print("   %s %2d satır  %s" % (ad, len(yeni[g]), iz))
            if not uygula:
                for r in yeni[g][:3]:
                    print("        %s  %s%s" % (r["t"], r["name"],
                          "  (%s)" % r["host"] if r.get("host") else ""))
        radyo["scheduleGun"] = yeni

        # VARSAYILAN akış = haftada en çok tekrar eden gün. Sitede "bu güne
        # özel" rozeti günü varsayılanla karşılaştırarak çiziliyor; varsayılan
        # hiçbir günle tutmazsa yedi gün birden özel görünüyor ve rozet hiçbir
        # şey anlatmıyor. En sık desen varsayılan olunca yalnız gerçekten
        # farklı günler (çoğunlukla hafta sonu) işaretleniyor.
        sayac = {}
        for g, satir in yeni.items():
            imza = json.dumps(satir, ensure_ascii=False)
            sayac[imza] = sayac.get(imza, 0) + 1
        en_sik = max(sayac, key=lambda k: (sayac[k], -len(k)))
        if sayac[en_sik] > 1:
            radyo["schedule"] = json.loads(en_sik)
            print("   varsayılan akış = %d gün tekrar eden desen" % sayac[en_sik])

    if not uygula:
        print("\nÖnizleme. Yazmak için:  --uygula")
        return

    govde = json.dumps(D, ensure_ascii=False, indent=2)
    DATA_JS.write_text(ham[:bas] + govde + ham[bas + uz:], encoding="utf-8")
    print("\ndata.js yazıldı.")
    print("DİKKAT: Buluttaki (Supabase) kayıtta scheduleGun varsa O KAZANIR.")
    print("        Bulut kaydındaki scheduleGun temizlenmeli, yoksa site eskiyi gösterir.")

if __name__ == "__main__":
    main()
