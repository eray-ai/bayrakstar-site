#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BAYRAKSTAR — Statik paylaşım sayfası üreticisi
==============================================

NEDEN VAR
---------
WhatsApp, Facebook, X gibi platformların ön izleme botları JavaScript
ÇALIŞTIRMAZ. Site içeriğini JS çizdiği için "radyo.html?r=fenomen" ve
"radyo.html?r=boombox" botun gözünde AYNI dosyadır — ikisi de genel
Bayrakstar kartını gösteriyordu.

Bu araç her radyo ve her yayıncı için, paylaşım etiketleri İÇİNE GÖMÜLÜ
statik bir sayfa üretir:

    r/<radyoSlug>/index.html
    y/<radyoSlug>-<yayinciSlug>/index.html

Sayfalar radyo.html / yayinci.html'in birebir kopyasıdır; yalnız üç şey
eklenir:
  1. <base href="../../">  → göreli yollar (logo, script, görsel) kök
     dizine çözülsün; sayfa iki klasör derinde duruyor.
  2. window.ON_SLUG / ON_HOST → sayfa hangi radyoyu/yayıncıyı göstereceğini
     sorgu parametresi olmadan bilsin (radyo.html içindeki q() bunu okur).
  3. Gömülü <title>, description, canonical, OG ve Twitter etiketleri.

İÇERİK KAYNAĞI
--------------
Önce Supabase'teki CANLI içerik denenir (panelden yapılan değişiklikler
paylaşım kartlarına da yansısın diye). Ulaşılamazsa data.js varsayılanına
düşer ve bunu ekrana yazar.

KULLANIM
--------
    python3 araclar/statik-uret.py            # üret
    python3 araclar/statik-uret.py --kontrol  # üretme, sadece fark var mı bak
                                              # (fark varsa çıkış kodu 1)
"""

import json
import os
import re
import shutil
import sys
import urllib.request

KOK_DIZIN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZAMAN_ASIMI = 20


# ----------------------------------------------------------------------
# İçerik okuma
# ----------------------------------------------------------------------
def data_js_varsayilani():
    """data.js içindeki DEFAULT_DATA nesnesini ayrıştırır."""
    s = open(os.path.join(KOK_DIZIN, "data.js"), encoding="utf-8").read()
    m = re.search(r"window\.DEFAULT_DATA\s*=\s*\{", s)
    if not m:
        raise SystemExit("data.js içinde DEFAULT_DATA bulunamadı.")
    bas = m.end() - 1
    derinlik = 0
    for i in range(bas, len(s)):
        if s[i] == "{":
            derinlik += 1
        elif s[i] == "}":
            derinlik -= 1
            if derinlik == 0:
                return json.loads(s[bas:i + 1])
    raise SystemExit("DEFAULT_DATA nesnesi kapanmıyor.")


def buluttan_oku():
    """Supabase'teki canlı içeriği döndürür; olmazsa None."""
    bulut = open(os.path.join(KOK_DIZIN, "bulut.js"), encoding="utf-8").read()
    url = re.search(r'URL_\s*=\s*"([^"]+)"', bulut)
    key = re.search(r'KEY\s*=\s*"([^"]+)"', bulut)
    if not (url and key):
        return None
    istek = urllib.request.Request(
        url.group(1) + "/rest/v1/site_icerik?select=data&id=eq.1",
        headers={"apikey": key.group(1), "Authorization": "Bearer " + key.group(1)},
    )
    try:
        with urllib.request.urlopen(istek, timeout=ZAMAN_ASIMI) as c:
            satirlar = json.loads(c.read().decode("utf-8"))
        if satirlar and satirlar[0].get("data"):
            return satirlar[0]["data"]
    except Exception as e:
        print(f"  ! Bulut okunamadı ({e}) — data.js varsayılanı kullanılacak.")
    return None


def icerik_al():
    varsayilan = data_js_varsayilani()
    canli = buluttan_oku()
    if not canli:
        return varsayilan, "data.js"
    # Bulutta olmayan alanlar varsayılandan tamamlansın (yeni alan eklendiyse)
    for anahtar, deger in varsayilan.items():
        canli.setdefault(anahtar, deger)
    return canli, "Supabase"


# ----------------------------------------------------------------------
# Yardımcılar
# ----------------------------------------------------------------------
def kok_adres():
    """radyo.html içindeki KOK sabitinden site adresini okur."""
    s = open(os.path.join(KOK_DIZIN, "radyo.html"), encoding="utf-8").read()
    m = re.search(r"var KOK\s*=\s*'([^']+)'", s)
    return m.group(1).rstrip("/") if m else ""


def duz(metin, uzunluk=155):
    """HTML etiketlerini atıp tek satırlık özet üretir."""
    t = re.sub(r"<[^>]*>", "", str(metin or ""))
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) > uzunluk:
        t = t[:uzunluk].rsplit(" ", 1)[0] + "…"
    return t


def oz(s):
    """HTML özniteliğine güvenle gömülecek biçime çevirir."""
    return (str(s or "").replace("&", "&amp;").replace('"', "&quot;")
            .replace("<", "&lt;").replace(">", "&gt;"))


def gorsel_var(yol):
    return os.path.exists(os.path.join(KOK_DIZIN, yol))


# ----------------------------------------------------------------------
# Sayfa üretimi
# ----------------------------------------------------------------------
def sayfa_uret(sablon, derinlik, gomulu, baslik, aciklama, adres, gorsel):
    """Şablonun head bölümünü paylaşım etiketleriyle değiştirir."""
    s = sablon

    # 1) <base> — göreli yollar kök dizine çözülsün
    base = '<base href="' + ("../" * derinlik) + '">'
    if "<base " not in s:
        s = re.sub(r'(<meta name="viewport"[^>]*>\n)', r"\1" + base + "\n", s, count=1)

    # 2) Sayfaya gömülü slug/host — sorgu parametresi olmadan da bilsin
    blok = "<script>" + gomulu + "</script>\n"
    s = re.sub(r'(<script src="data\.js"></script>)', blok + r"\1", s, count=1)

    # 3) Paylaşım etiketleri. JS bunları çalışma anında yine güncelliyor;
    #    buradaki gömülü değerler yalnızca botlar için.
    s = re.sub(r"<title>.*?</title>", "<title>" + oz(baslik) + "</title>", s, count=1, flags=re.S)

    def meta(desen, yeni):
        nonlocal s
        s = re.sub(desen, yeni, s, count=1)

    meta(r'(<meta name="description"[^>]*content=")[^"]*(")', r"\g<1>" + oz(aciklama) + r"\g<2>")
    meta(r'(<meta property="og:title"[^>]*content=")[^"]*(")', r"\g<1>" + oz(baslik) + r"\g<2>")
    meta(r'(<meta property="og:description"[^>]*content=")[^"]*(")', r"\g<1>" + oz(aciklama) + r"\g<2>")
    meta(r'(<meta property="og:url"[^>]*content=")[^"]*(")', r"\g<1>" + oz(adres) + r"\g<2>")
    meta(r'(<meta property="og:image"[^>]*content=")[^"]*(")', r"\g<1>" + oz(gorsel) + r"\g<2>")
    meta(r'(<meta name="twitter:title"[^>]*content=")[^"]*(")', r"\g<1>" + oz(baslik) + r"\g<2>")
    meta(r'(<meta name="twitter:description"[^>]*content=")[^"]*(")', r"\g<1>" + oz(aciklama) + r"\g<2>")
    meta(r'(<meta name="twitter:image"[^>]*content=")[^"]*(")', r"\g<1>" + oz(gorsel) + r"\g<2>")
    meta(r'(<link rel="canonical"[^>]*href=")[^"]*(")', r"\g<1>" + oz(adres) + r"\g<2>")
    return s


def uret(D, kok):
    radyo_sablon = open(os.path.join(KOK_DIZIN, "radyo.html"), encoding="utf-8").read()
    yayinci_sablon = open(os.path.join(KOK_DIZIN, "yayinci.html"), encoding="utf-8").read()

    ciktilar = {}   # yol -> içerik
    adresler = []   # sitemap için

    for r in D.get("radios", []):
        slug = (r.get("slug") or "").strip()
        if not slug:
            continue
        og = "og/%s.jpg" % slug
        gorsel = kok + "/" + (og if gorsel_var(og) else "og/bayrakstar.jpg")
        adres = "%s/r/%s/" % (kok, slug)
        baslik = r["name"] + (" — " + r["slogan"] if r.get("slogan") else "") + " | Bayrakstar"
        aciklama = duz(r.get("about")) or duz(r.get("genre"))
        ciktilar["r/%s/index.html" % slug] = sayfa_uret(
            radyo_sablon, 2, "window.ON_SLUG=%s;" % json.dumps(slug, ensure_ascii=False),
            baslik, aciklama, adres, gorsel)
        adresler.append((adres, "0.9"))

        for h in r.get("hosts", []):
            hslug = (h.get("slug") or "").strip()
            if not hslug:
                continue
            hadres = "%s/y/%s-%s/" % (kok, slug, hslug)
            hbaslik = h["name"] + (" — " + h["show"] if h.get("show") else "") + " | " + r["name"]
            haciklama = duz(h.get("about") or h.get("bio")) or duz(
                "%s, %s yayıncısı." % (h["name"], r["name"]))
            # Panelden yüklenen görsel base64 olarak gömülü olabilir. Onu
            # og:image yapmak adresi bozar (https://site/data:image/...) ve
            # sayfayı yüz kilobaytlarca şişirir → radyonun kartına düşülür.
            hfoto = (h.get("photo") or "").strip()
            hgorsel = kok + "/" + hfoto if hfoto and not hfoto.startswith("data:") else gorsel
            ciktilar["y/%s-%s/index.html" % (slug, hslug)] = sayfa_uret(
                yayinci_sablon, 2,
                "window.ON_SLUG=%s;window.ON_HOST=%s;" % (
                    json.dumps(slug, ensure_ascii=False), json.dumps(hslug, ensure_ascii=False)),
                hbaslik, haciklama, hadres, hgorsel)
            adresler.append((hadres, "0.7"))

    return ciktilar, adresler


def sitemap_uret(kok, adresler):
    satirlar = ['<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for a, o in [("%s/" % kok, "1.0"), ("%s/websiteler.html" % kok, "0.6"),
                 ("%s/uygulamalar.html" % kok, "0.6"),
                 ("%s/yasal.html" % kok, "0.3")] + adresler:
        satirlar.append("  <url>\n    <loc>%s</loc>\n    <priority>%s</priority>\n  </url>" % (oz(a), o))
    satirlar.append("</urlset>")
    return "\n".join(satirlar) + "\n"


# ----------------------------------------------------------------------
def main():
    kontrol = "--kontrol" in sys.argv
    D, kaynak = icerik_al()
    kok = kok_adres()
    if not kok:
        raise SystemExit("radyo.html içindeki KOK adresi okunamadı.")

    ciktilar, adresler = uret(D, kok)
    ciktilar["sitemap.xml"] = sitemap_uret(kok, adresler)

    farkli = []
    for yol, icerik in ciktilar.items():
        tam = os.path.join(KOK_DIZIN, yol)
        eski = open(tam, encoding="utf-8").read() if os.path.exists(tam) else None
        if eski != icerik:
            farkli.append(yol)

    print("İçerik kaynağı : %s" % kaynak)
    print("Site adresi    : %s" % kok)
    print("Üretilen sayfa : %d radyo + %d yayıncı + sitemap"
          % (sum(1 for y in ciktilar if y.startswith("r/")),
             sum(1 for y in ciktilar if y.startswith("y/"))))

    if kontrol:
        if farkli:
            print("DEĞİŞİKLİK VAR (%d dosya):" % len(farkli))
            for y in farkli[:20]:
                print("  •", y)
            sys.exit(1)
        print("Değişiklik yok.")
        return

    # Artık üretilmeyen eski klasörler kalmasın (radyo/yayıncı silinmiş olabilir)
    for ust in ("r", "y"):
        tam = os.path.join(KOK_DIZIN, ust)
        if os.path.isdir(tam):
            shutil.rmtree(tam)

    for yol, icerik in ciktilar.items():
        tam = os.path.join(KOK_DIZIN, yol)
        os.makedirs(os.path.dirname(tam), exist_ok=True)
        open(tam, "w", encoding="utf-8").write(icerik)

    print("Değişen dosya  : %d" % len(farkli))
    print("Yazıldı.")


if __name__ == "__main__":
    main()
