#!/usr/bin/env python3
"""Yayın öncesi sürüm damgası yazar.

NEDEN: GitHub Pages HTML dosyalarını `cache-control: max-age=600` ile
servis ediyor ve başlıkları değiştirmenin yolu yok. Bazı tarayıcılar bu
süre dolduktan sonra bile eski kopyayı yeniden doğrulamadan gösterebiliyor;
kullanıcı yayınlanan değişikliği göremiyor.

ÇÖZÜM: her yayında bütün HTML dosyalarına aynı damga yazılıyor
(<meta name="site-surum">) ve aynı damga surum.json'a konuyor. site.js
açılışta surum.json'u ÖNBELLEKSİZ okuyup damgayı karşılaştırıyor; tutmuyorsa
sayfayı bir kez tazeliyor.

KULLANIM: git push'tan ÖNCE  ->  python3 araclar/surum-yaz.py
"""
import datetime, json, pathlib, re, sys

KOK = pathlib.Path(__file__).resolve().parent.parent
ETIKET = re.compile(r'<meta name="site-surum" content="[^"]*">\s*')

def main():
    damga = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S")
    meta = '<meta name="site-surum" content="%s">' % damga

    sayfalar = sorted(p for p in KOK.glob("*.html") if not p.name.startswith("_"))
    for p in sayfalar:
        s = p.read_text(encoding="utf-8")
        s = ETIKET.sub("", s)
        # <meta charset...> satırının hemen ardına koyuyoruz: her sayfada var.
        yeni, n = re.subn(r'(<meta charset="[^"]*">)', r'\1\n' + meta, s, count=1)
        if not n:
            print("!! charset etiketi yok, atlandı:", p.name); continue
        p.write_text(yeni, encoding="utf-8")

    (KOK / "surum.json").write_text(
        json.dumps({"surum": damga}, ensure_ascii=False) + "\n", encoding="utf-8")
    print("sürüm:", damga, "· damgalanan sayfa:", len(sayfalar))

if __name__ == "__main__":
    sys.exit(main())
