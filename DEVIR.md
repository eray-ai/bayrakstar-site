# Bayrakstar Web Sitesi — Devir ve İşletme Kılavuzu

Bu belge siteyi devralacak kişi/ekip içindir. Sistemin nasıl çalıştığını,
nelerin nerede durduğunu ve **bilinmezse sorun çıkaracak tuzakları** anlatır.

Son güncelleme: 28 Temmuz 2026

---

## 1. Sistem nasıl çalışıyor?

Derleme (build) adımı **yok**. Depodaki dosyalar olduğu gibi yayınlanır.

```
GitHub deposu ──(git push)──> Netlify ──> https://bespoke-banoffee-f756ac.netlify.app
                                              │
                                              └── açılışta Supabase'den içerik çeker
```

- **Tasarım ve kod** → depoda (HTML/CSS/JS). Değişmesi için `git push` gerekir.
- **İçerik (metinler, görseller, yayın akışı…)** → Supabase'de tek bir satırda.
  Yönetim panelinden değiştirilir, **deploy gerekmez**, anında yayına girer.

Bu ayrım önemli: "yazıyı değiştir" = panel. "Sayfa yapısını değiştir" = kod + push.

---

## 2. Hesaplar ve erişimler

| Ne | Nerede | Not |
|---|---|---|
| Kod deposu | GitHub `eray-ai/bayrakstar-site` | **Public** olmak zorunda (aşağıda) |
| Yayın | Netlify, proje `bespoke-banoffee-f756ac` | `main` dalına push = otomatik yayın |
| İçerik veritabanı | Supabase, proje `bayrakstar-site` (`bezwdlxombiirihxomnv`), eu-central-1 | Ücretsiz plan |
| Yönetim paneli | `/admin.html` | Giriş: `yonetim@bayrakstar.com` + şifre |

**Devirde yapılacaklar:** üç hesabın da sahipliği/erişimi devredilmeli, yönetim
paneli şifresi değiştirilmeli.

---

## 3. Bilinmezse sorun çıkaran tuzaklar

### 3.1 Yeni radyo eklerken yayın adresini CSP'ye eklemeyi unutma
Panelden yeni radyo ekleyip yayın linkini yazmak **yetmez**. Güvenlik başlığı
(CSP) yalnızca tanımlı adreslere ses çalma izni verir. `netlify.toml` içinde:

```
media-src   ... https://YENI-YAYIN-ADRESI
connect-src ... https://YENI-YAYIN-ADRESI
```

İkisine de eklenmezse **radyo sessiz kalır ve hiçbir hata mesajı çıkmaz.**
Bu bir kod değişikliği olduğu için `git push` gerekir.

### 3.2 Depo public kalmalı
Netlify'ın ücretsiz planı, özel (private) depolarda "Unrecognized Git
contributor" hatasıyla derlemeyi reddediyor. Depo private yapılırsa **yayın
durur.** Private istenirse Netlify'da ücretli plana geçmek gerekir.
Depoda gizli bilgi yok: içindeki tek anahtar zaten tarayıcıya inen public
(anon) anahtardır; yönetici şifresi kodda geçmez.

### 3.3 Büyük görselleri panelden yükleme
Panelden yüklenen görseller **base64 olarak içerik JSON'una gömülür** ve o JSON'u
siteyi açan **her ziyaretçi indirir**. Panelin üstündeki boyut rozeti bunu
gösterir; **500 KB'ı aşmayın**.

Büyük görseller için doğru yol: dosyayı `gorseller/` (veya `yayincilar/`,
`programlar/`) klasörüne koyup `git push` yapmak, panele de yolunu yazmak
(örn. `gorseller/genis-1.jpg`).

### 3.4 Panel açıkken içerik hep taze okunur
Site ziyaretçilere hız için önbellekten açılır, ama `admin.html` **her zaman**
buluttan taze okur. Böylece iki kişi aynı anda düzenlerse eski kopya
yenisini ezmez. Yine de aynı anda iki kişinin kaydetmemesi iyi olur.

### 3.5 hls.js sabit sürümde
`vendor/hls.min.js` (sürüm 1.6.16) depoda duruyor, kendiliğinden güncellenmez.
Boombox ve İstanbul FM `.m3u8` (HLS) yayınladığı için bu kütüphane şart —
Chrome/Firefox HLS'i tek başına çalamıyor. Yılda bir güncellenmesi yeterli.

### 3.6 Alan adı değişirse
Paylaşım (OG) etiketleri, canonical adresler, `sitemap.xml` ve `robots.txt`
site adresini **sabit yazılı** tutar — sosyal medya ön izleme botları
JavaScript çalıştırmadığı için adresi tarayıcıdan öğrenemiyoruz.

Kendi alan adınıza geçince toplu güncelleme için:

```bash
python3 araclar/alan-adi-degistir.py https://www.ornek.com          # ön izleme
python3 araclar/alan-adi-degistir.py https://www.ornek.com --uygula # uygula
git add -A && git commit -m "Alan adı güncellendi" && git push
```

Sonra Netlify → Domain management'tan alan adını ekleyin ve Google Search
Console'a yeni adresi + `sitemap.xml`'i tanıtın.

---

## 4. İçerik yanlış kaydedilirse nasıl geri alınır?

Her kayıttan **önceki hâl** otomatik saklanıyor (son 50 sürüm).
Supabase → SQL Editor:

```sql
-- son sürümleri gör
select id, kayit_zamani, kaydeden
from site_icerik_gecmis
where icerik_id = 1
order by kayit_zamani desc limit 20;

-- bir önceki hâle dön
update site_icerik
set data = (select data from site_icerik_gecmis
            where icerik_id = 1 order by kayit_zamani desc limit 1)
where id = 1;
```

Geri alma işleminin kendisi de geçmişe yazılır, yani geri almayı da geri
alabilirsiniz.

---

## 5. Yetkilendirme

İçeriği yalnızca `site_yoneticiler` tablosundaki kullanıcılar değiştirebilir.
Yeni yönetici eklemek için (Supabase → SQL Editor):

```sql
-- 1) Authentication > Users ekranından kullanıcıyı oluştur, uid'sini kopyala
-- 2) yetkilendir:
insert into site_yoneticiler (uid, eposta) values ('BURAYA-UID', 'kisi@ornek.com');

-- yetkiyi geri al:
delete from site_yoneticiler where eposta = 'kisi@ornek.com';
```

Yalnızca giriş yapmış olmak yetmez; bu tabloda olmayan kullanıcı yazamaz.

---

## 6. Ücretsiz plan sınırları

| Servis | Sınır | Aşılırsa |
|---|---|---|
| Supabase | 5 GB/ay veri transferi; hareketsizlikte proje duraklar | İçerik güncellenemez; site son önbellekle açılmaya devam eder |
| Netlify | 100 GB/ay bant genişliği | Yayın kısıtlanır |

İçerik JSON'u ne kadar küçük olursa aylık kapasite o kadar büyür (bkz. 3.3).

---

## 7. Henüz yapılmamışlar (bilinçli olarak bırakıldı)

- **Ziyaretçi analitiği yok.** Kaç kişi geldiği ölçülmüyor. (Plausible / GA4 /
  Netlify Analytics eklenebilir; CSP'ye ilgili adresin eklenmesi gerekir.)
- **Hata ve kesinti izleme yok.** Yayın linki ölürse kimse haber almaz.
  (Uptime izleme + yayın adreslerine periyodik sağlık kontrolü önerilir.)
- **Deneme (staging) ortamı yok.** Her push doğrudan canlıya gider.
  Netlify'ın dal önizlemeleri ücretsiz, kurulması yarım saat.
- **Sosyal medya ön izlemeleri sınırlı.** Sayfa içeriği JavaScript ile
  çizildiği için WhatsApp/Facebook/X gibi platformların ön izleme botları
  radyo ve yayıncı sayfalarında **genel Bayrakstar kartını** gösterir.
  Kişiye/radyoya özel kart isteniyorsa sayfaların statik olarak önceden
  üretilmesi gerekir.
- **İçerik yer tutucu.** İletişim e-postaları (`info@`, `reklam@`, `basin@`)
  ve yayıncı "Hakkında / Programı" metinleri henüz gerçek değil.

---

## 8. Sorun giderme

| Belirti | Muhtemel sebep |
|---|---|
| Bir radyo çalmıyor, hata da vermiyor | Yayın adresi CSP'de tanımlı değil (3.1) |
| Site açılıyor ama içerik eski | Bulut erişilemiyor; site önbellekle açılmış. Supabase durumunu kontrol et |
| Panelde "Oturum süresi doldu" | Jeton düştü; sayfayı yenileyip tekrar giriş yap |
| Yayın (deploy) başarısız | Depo private yapılmış olabilir (3.2) |
| Site yavaş açılıyor | İçerik JSON'u şişmiş olabilir; panelin boyut rozetine bak (3.3) |
