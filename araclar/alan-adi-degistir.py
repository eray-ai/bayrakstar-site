#!/usr/bin/env python3
"""
Bayrakstar — Alan adı değiştirme aracı
======================================
Site adresi (örn. netlify.app alt alan adından kendi alan adına) değişince
OG/paylaşım etiketleri, canonical adresler, sitemap.xml ve robots.txt'teki
SABİT yazılmış adresi topluca günceller.

Bu adresler sabit yazılmak ZORUNDA: sosyal medya ön izleme botları
JavaScript çalıştırmadığı için adresi tarayıcıdan öğrenemiyoruz.

KULLANIM
--------
    # önce ne değişeceğini gör (hiçbir dosyaya dokunmaz)
    python3 araclar/alan-adi-degistir.py https://www.bayrakstar.com

    # onaylıyorsan uygula
    python3 araclar/alan-adi-degistir.py https://www.bayrakstar.com --uygula

Sonrasında:  git add -A && git commit -m "Alan adı güncellendi" && git push
"""
import pathlib
import re
import sys

ESKI = "https://bespoke-banoffee-f756ac.netlify.app"
UZANTILAR = {".html", ".xml", ".txt", ".js", ".md"}
ATLA = {"vendor", ".git", "node_modules", "araclar"}


def kok_dizin() -> pathlib.Path:
    return pathlib.Path(__file__).resolve().parent.parent


def dosyalar(kok: pathlib.Path):
    for y in sorted(kok.rglob("*")):
        if not y.is_file() or y.suffix not in UZANTILAR:
            continue
        if any(p in ATLA for p in y.relative_to(kok).parts):
            continue
        yield y


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    yeni = sys.argv[1].rstrip("/")
    uygula = "--uygula" in sys.argv

    if not re.match(r"^https://[a-z0-9.-]+\.[a-z]{2,}$", yeni, re.I):
        print(f"HATA: adres 'https://alanadi.com' biçiminde olmalı — verilen: {yeni}")
        return 1

    kok = kok_dizin()
    toplam = 0
    degisen = []

    for y in dosyalar(kok):
        metin = y.read_text(encoding="utf-8")
        adet = metin.count(ESKI)
        if not adet:
            continue
        toplam += adet
        degisen.append((y.relative_to(kok), adet))
        if uygula:
            y.write_text(metin.replace(ESKI, yeni), encoding="utf-8")

    if not toplam:
        print(f"Değiştirilecek bir şey yok — '{ESKI}' hiçbir dosyada geçmiyor.")
        print("(Adres daha önce değiştirildiyse bu betiğin ESKI değerini güncelle.)")
        return 0

    baslik = "UYGULANDI" if uygula else "ÖN İZLEME (dosyalara dokunulmadı)"
    print(f"\n{baslik}")
    print(f"  {ESKI}\n  → {yeni}\n")
    for yol, adet in degisen:
        print(f"  {str(yol):<24} {adet:>3} yer")
    print(f"\n  TOPLAM: {toplam} yer, {len(degisen)} dosya")

    if uygula:
        print("\nSıradaki adımlar:")
        print("  1) git add -A && git commit -m 'Alan adı güncellendi' && git push")
        print("  2) Netlify → Domain management → yeni alan adını ekle")
        print("  3) Google Search Console'a yeni adresi ve sitemap.xml'i tanıt")
        print("  4) Bu betiğin içindeki ESKI değerini yeni adresle güncelle")
    else:
        print("\nUygulamak için sonuna --uygula ekle.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
