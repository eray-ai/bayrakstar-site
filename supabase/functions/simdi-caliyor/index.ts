/*
  ŞİMDİ ÇALIYOR — aracı (proxy)
  ------------------------------------------------------------------
  Radyo Boombox ve İstanbul FM'in anlık şarkı bilgisi kendi sitelerinde
  var ama tarayıcıya "başka siteden okuyabilirsin" izni (CORS) vermiyorlar.
  Bu fonksiyon o veriyi sunucu tarafında okuyup bizim sitemize temiz JSON
  olarak veriyor.

  Fenomen ve Fenomen Türk BURAYA UĞRAMAZ — onların API'si zaten CORS açık,
  site doğrudan çekiyor (simdicaliyor.js'e bak).

  Adres:  /functions/v1/simdi-caliyor
  Çıktı:  { "boombox": {...}, "istanbulfm": {...}, "kanallar": { "<ad>": {...} } }
          Şarkı yoksa ilgili anahtar null döner.
*/

const KAYNAKLAR: Record<string, string> = {
  boombox:    "https://www.radyoboombox.com.tr/?_data=root",
  istanbulfm: "https://www.istanbulfm.com.tr/?_data=root",
};

/* Hangi kanal adı hangi ana radyoya ait — geri kalanı "kanallar"a düşer. */
const ANA_KANAL: Record<string, string> = {
  "Radyo BoomBox": "boombox",
  "İstanbul FM":   "istanbulfm",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

/* Aynı isolate içinde yaşayan basit ön bellek: şarkı bitene kadar
   yukarıyı tekrar yormuyoruz. */
type Kutu = { veri: unknown; sonKullanma: number };
const onBellek = new Map<string, Kutu>();

type Sarki = {
  sanatci: string;
  sarki: string;
  kapak: string | null;
  sure: number;
  kalan: number;
  gecen: number;
};

/* JSON'un neresinde durduğu sürüme göre değişebiliyor; ağacı gezip
   içinde dolu "timeline" olan her düğümü topluyoruz. */
function* gez(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) {
    for (const v of o) yield* gez(v);
  } else if (o && typeof o === "object") {
    const d = o as Record<string, unknown>;
    const tl = d.timeline;
    if (Array.isArray(tl) && tl.length) yield d;
    for (const v of Object.values(d)) yield* gez(v);
  }
}

function sarkiCikar(dugum: Record<string, unknown>): Sarki | null {
  const t = (dugum.timeline as Record<string, unknown>[])[0];
  const ad = String(t.songTitle ?? "").trim();
  if (!ad) return null;

  const im = t.image as Record<string, string> | undefined;
  // prefix + <boyut> + suffix — boyutu biz seçiyoruz.
  const kapak = im?.prefix && im?.suffix ? `${im.prefix}500x500${im.suffix}` : null;

  const sure  = Number(t.duration ?? 0) || 0;
  const kalan = Number(t.remainingSeconds ?? 0) || 0;
  return {
    sanatci: String(t.artistTitle ?? "").trim(),
    sarki: ad,
    kapak,
    sure,
    kalan,
    gecen: Math.max(0, sure - kalan),
  };
}

async function kaynagiOku(slug: string) {
  const simdi = Date.now();
  const kutu = onBellek.get(slug);
  if (kutu && kutu.sonKullanma > simdi) return kutu.veri;

  const iptal = AbortSignal.timeout(8000);
  const r = await fetch(KAYNAKLAR[slug], {
    signal: iptal,
    headers: {
      // Sade bir tarayıcı gibi davran; bazı sunucular User-Agent'sız isteği kesiyor.
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      "Accept": "application/json",
    },
  });
  if (!r.ok) throw new Error(`${slug}: ${r.status}`);
  const ham = await r.json();

  let ana: Sarki | null = null;
  const kanallar: Record<string, Sarki> = {};
  let enKisaKalan = 60;

  for (const d of gez(ham)) {
    const s = sarkiCikar(d);
    if (!s) continue;
    const ad = String(d.name ?? "");
    if (s.kalan > 0) enKisaKalan = Math.min(enKisaKalan, s.kalan);
    if (ANA_KANAL[ad] === slug && !ana) ana = s;
    else if (ad) kanallar[ad] = s;
  }

  const veri = { ana, kanallar };
  // Şarkı bitene kadar bekle, ama 15 sn'den sık ve 60 sn'den seyrek olmasın.
  const ttl = Math.min(60, Math.max(15, enKisaKalan)) * 1000;
  onBellek.set(slug, { veri, sonKullanma: simdi + ttl });
  return veri;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const sonuc: Record<string, unknown> = {};
  const kanallar: Record<string, unknown> = {};

  const isler = Object.keys(KAYNAKLAR).map(async (slug) => {
    try {
      const v = await kaynagiOku(slug) as { ana: Sarki | null; kanallar: Record<string, Sarki> };
      sonuc[slug] = v.ana;
      Object.assign(kanallar, v.kanallar);
    } catch (e) {
      // Bir kaynak düşerse diğeri yine dönsün; site zaten null'ı kaldırabiliyor.
      sonuc[slug] = null;
      console.error(slug, String(e));
    }
  });
  await Promise.all(isler);
  sonuc.kanallar = kanallar;

  return new Response(JSON.stringify(sonuc), {
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      // Vekil sunucular da 15 sn tutsun.
      "Cache-Control": "public, max-age=15",
    },
  });
});
