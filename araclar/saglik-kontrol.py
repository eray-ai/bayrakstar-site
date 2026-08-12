#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BAYRAKSTAR — Site ve yayın sağlık denetimi
==========================================

Neyi denetler:
  • Sitenin ana sayfası ve her radyonun statik sayfası açılıyor mu
  • 4 radyonun CANLI YAYIN adresi gerçekten ses veriyor mu
  • Supabase içerik servisi cevap veriyor mu

Yayın kontrolü "adres açılıyor mu"nun ötesine geçer: bağlantıdan birkaç
kilobayt VERİ indirilmeye çalışılır. Sebep: ölü bir Icecast sunucusu da
çoğu zaman 200 döndürür ama tek bayt ses akmaz.

Çıkış kodu 0 = her şey yolunda, 1 = en az bir sorun var.
Sorun varsa ayrıntı hem ekrana hem `saglik-raporu.txt` dosyasına yazılır
(GitHub Actions bunu okuyup bildirim açar).

Elle çalıştırmak için:  python3 araclar/saglik-kontrol.py
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

KOK_DIZIN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZAMAN_ASIMI = 25
TARAYICI = "Mozilla/5.0 (bayrakstar-saglik-kontrol)"


def istek(url, aralik=None):
    b = {"User-Agent": TARAYICI}
    if aralik:
        b["Range"] = "bytes=0-%d" % aralik
    return urllib.request.Request(url, headers=b)


def icerik_oku():
    """Canlı içeriği Supabase'ten, olmazsa data.js'ten alır."""
    bulut = open(os.path.join(KOK_DIZIN, "bulut.js"), encoding="utf-8").read()
    url = re.search(r'URL_\s*=\s*"([^"]+)"', bulut)
    key = re.search(r'KEY\s*=\s*"([^"]+)"', bulut)
    if url and key:
        try:
            r = urllib.request.Request(
                url.group(1) + "/rest/v1/site_icerik?select=data&id=eq.1",
                headers={"apikey": key.group(1),
                         "Authorization": "Bearer " + key.group(1),
                         "User-Agent": TARAYICI})
            with urllib.request.urlopen(r, timeout=ZAMAN_ASIMI) as c:
                s = json.loads(c.read().decode("utf-8"))
            if s and s[0].get("data"):
                return s[0]["data"], None
        except Exception as e:
            hata = "Supabase okunamadı: %s" % e
            veri = _data_js()
            return veri, hata
    return _data_js(), None


def _data_js():
    s = open(os.path.join(KOK_DIZIN, "data.js"), encoding="utf-8").read()
    m = re.search(r"window\.DEFAULT_DATA\s*=\s*\{", s)
    bas = m.end() - 1
    d = 0
    for i in range(bas, len(s)):
        if s[i] == "{":
            d += 1
        elif s[i] == "}":
            d -= 1
            if d == 0:
                return json.loads(s[bas:i + 1])
    return {}


def kok_adres():
    s = open(os.path.join(KOK_DIZIN, "radyo.html"), encoding="utf-8").read()
    m = re.search(r"var KOK\s*=\s*'([^']+)'", s)
    return m.group(1).rstrip("/") if m else ""


def sayfa_dene(url):
    try:
        with urllib.request.urlopen(istek(url), timeout=ZAMAN_ASIMI) as c:
            if c.status != 200:
                return "HTTP %s" % c.status
            if len(c.read(600)) < 200:
                return "sayfa neredeyse boş döndü"
        return None
    except urllib.error.HTTPError as e:
        return "HTTP %s" % e.code
    except Exception as e:
        return str(e)


def yayin_dene(url):
    """Yayından gerçekten veri iniyor mu? 200 dönmesi yetmez.

    İKİ FARKLI YAYIN BİÇİMİ, İKİ FARKLI ÖLÇÜT:
      • Icecast (.audio) doğrudan ses akışıdır → kilobaytlarca veri gelmeli.
      • HLS (.m3u8) ise ÇALMA LİSTESİ, yani küçük bir metin dosyası;
        sağlıklı bir liste 100-200 bayt olabilir. Burada boyuta bakmak
        yanlış alarm üretir — içeriğin gerçekten liste olmasına bakılır,
        ayrıca listedeki ilk parçanın da indiğini doğrularız.
    """
    m3u8 = url.lower().split("?")[0].endswith(".m3u8")
    try:
        with urllib.request.urlopen(istek(url, 8192), timeout=ZAMAN_ASIMI) as c:
            if c.status not in (200, 206):
                return "HTTP %s" % c.status
            veri = c.read(8192)

        if not m3u8:
            if len(veri) < 512:
                return "bağlantı açıldı ama ses akmadı (%d bayt)" % len(veri)
            return None

        metin = veri.decode("utf-8", "replace")
        if "#EXTM3U" not in metin[:200]:
            return "m3u8 adresi çalma listesi döndürmüyor"

        # Listedeki ilk gerçek parçayı (ya da alt listeyi) indirmeyi dene
        parca = next((s.strip() for s in metin.splitlines()
                      if s.strip() and not s.startswith("#")), None)
        if not parca:
            return "çalma listesi boş — yayın durmuş olabilir"
        if not parca.startswith("http"):
            parca = url.rsplit("/", 1)[0] + "/" + parca.lstrip("/")
        try:
            with urllib.request.urlopen(istek(parca, 8192), timeout=ZAMAN_ASIMI) as c2:
                if len(c2.read(2048)) < 256:
                    return "çalma listesi var ama parça indirilemiyor"
        except Exception as e:
            return "çalma listesindeki parçaya ulaşılamadı: %s" % e
        return None
    except urllib.error.HTTPError as e:
        return "HTTP %s" % e.code
    except Exception as e:
        return str(e)


def main():
    D, bulut_hatasi = icerik_oku()
    kok = kok_adres()
    sorunlar = []
    satirlar = []

    if bulut_hatasi:
        sorunlar.append("Supabase")
        satirlar.append("✗ Supabase içerik servisi — %s" % bulut_hatasi)
    else:
        satirlar.append("✓ Supabase içerik servisi")

    hedefler = [("Ana sayfa", kok + "/")]
    for r in D.get("radios", []):
        if r.get("slug"):
            hedefler.append((r["name"] + " sayfası", "%s/r/%s/" % (kok, r["slug"])))

    for ad, url in hedefler:
        h = sayfa_dene(url)
        if h:
            sorunlar.append(ad)
            satirlar.append("✗ %-26s %s\n     %s" % (ad, url, h))
        else:
            satirlar.append("✓ %-26s %s" % (ad, url))

    for r in D.get("radios", []):
        akis = (r.get("stream") or "").strip()
        if not akis:
            continue
        ad = r["name"] + " canlı yayını"
        h = yayin_dene(akis)
        if h:
            sorunlar.append(ad)
            satirlar.append("✗ %-26s %s\n     %s" % (ad, akis, h))
        else:
            satirlar.append("✓ %-26s %s" % (ad, akis))

    rapor = "\n".join(satirlar)
    print(rapor)

    if sorunlar:
        basi = "SORUNLU: " + ", ".join(sorunlar) + "\n\n"
        with open(os.path.join(KOK_DIZIN, "saglik-raporu.txt"), "w", encoding="utf-8") as f:
            f.write(basi + rapor + "\n")
        print("\n" + basi.strip())
        sys.exit(1)

    print("\nHepsi yolunda.")


if __name__ == "__main__":
    main()
