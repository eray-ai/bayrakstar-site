# Bayrakstar Web Sitesi — Devir ve İşletme Kılavuzu

Bu belge siteyi devralacak kişi/ekip içindir. Sistemin nasıl çalıştığını,
nelerin nerede durduğunu ve **bilinmezse sorun çıkaracak tuzakları** anlatır.

Son güncelleme: 28 Temmuz 2026

---

## 1. Sistem nasıl çalışıyor?

Derleme (build) adımı **yok**. Depodaki dosyalar olduğu gibi yayınlanır.

```
GitHub deposu ──(git push)──> GitHub Pages ──> https://eray-ai.github.io/bayrakstar-site
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
| Yayın | GitHub Pages, `main` dalı kökü | `main` dalına push = otomatik yayın |
| İçerik veritabanı | Supabase, proje `bayrakstar-site` (`bezwdlxombiirihxomnv`), eu-central-1 | Ücretsiz plan |
| Yönetim paneli | `/admin.html` | Giriş: kişinin **kendi e-postası** + şifresi (bkz. 5) |

**Devirde yapılacaklar:** üç hesabın da sahipliği/erişimi devredilmeli, yönetim
paneli şifresi değiştirilmeli.

---

## 3. Bilinmezse sorun çıkaran tuzaklar

### 3.1 Yeni radyo eklerken yayın adresini CSP'ye eklemeyi unutma
Panelden yeni radyo ekleyip yayın linkini yazmak **yetmez**. Güvenlik başlığı
(CSP) yalnızca tanımlı adreslere ses çalma izni verir. GitHub Pages özel HTTP
başlığı gönderemediği için CSP her HTML sayfasının `<head>` bölümüne
`<meta http-equiv="Content-Security-Policy">` olarak gömülüdür:

```
media-src   ... https://YENI-YAYIN-ADRESI
connect-src ... https://YENI-YAYIN-ADRESI
```

İkisine de eklenmezse **radyo sessiz kalır ve hiçbir hata mesajı çıkmaz.**
Bu bir kod değişikliği olduğu için `git push` gerekir.

### 3.2 Depo public kalmalı
GitHub Pages ücretsiz planda yalnızca **public** depolarda yayın yapar. Depo
private yapılırsa **yayın durur.** Private istenirse GitHub Pro/Team gerekir.
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

Sonra GitHub → depo → Settings → Pages → "Custom domain" alanına alan adını
yazıp DNS'te GitHub Pages IP'lerine (185.199.108–111.153) A kaydı açın; ardından
Google Search Console'a yeni adresi + `sitemap.xml`'i tanıtın.

Kendi alan adına geçince site alt yol yerine **kökten** yayınlanır; yollar göreli
olduğu için kod tarafında değişiklik gerekmez, yalnız bu araçla adresleri
güncelleyin.

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

## 5. Yetkilendirme — iki rol

Panele girenler iki gruba ayrılır. Ayrım `site_yoneticiler.rol` alanında durur:

| Rol | Kim | Neye erişir |
|---|---|---|
| `sahip` (Süper Yönetici) | `yonetim@bayrakstar.com` | Her şey: içerik, sürüm geçmişi, ziyaretler, JSON yedek/sıfırlama, yönetici hesapları |
| `yonetici` | Anlaşma yapılan kişiler | Yalnızca içeriği düzenleyip yayına alma |

**Yeni yönetici eklemek için SQL'e girmeye gerek yok.** Süper yönetici olarak
panele gir → sol menüde **Yöneticiler** → e-posta + şifre yaz → *Hesabı Aç*.
Aynı ekrandan erişimi kaldırır ya da şifre sıfırlarsın.

### Kilit nerede duruyor?

Panelin düğmeleri role göre gizleniyor, ama asıl engel **veritabanında** (RLS):

- `site_icerik_gecmis` ve `ziyaret_sayac` → `sahip_mi()` şartı. Yönetici hesabı
  bu tabloları sorgularsa **boş liste** alır; panelin kodu kurcalansa bile veri gelmez.
- `site_yoneticiler` → yönetici yalnızca kendi satırını görür, rolünü değiştiremez,
  başkasını ekleyemez. (Denendi ve doğrulandı.)
- Hesap açma/silme `functions/v1/yoneticiler` uç noktasında; çağıranın süper
  yönetici olduğunu **jetondan** doğrular, tarayıcının iddiasına bakmaz.

### Sınırın dürüst tarifi

"JSON Yükle" ve "Sıfırla" düğmeleri yöneticide gizli, ama bunlar sunucuya normal
bir içerik kaydı olarak gider — yani yetkisi olan biri teknik olarak içeriği
toptan değiştirebilir. Bu bir açık değil, rolün tanımı: yönetici zaten içeriği
düzenleyebiliyor. Güvence sürüm geçmişinde: her kayıttan önceki hâl saklanıyor
ve **yalnızca süper yönetici** geri alabiliyor.

---

## 5.1 Sayfa metinleri nereden geliyor?

Bölüm başlıkları, menü bağlantıları, telif satırı ve arama/paylaşım
bilgileri artık HTML'e gömülü değil — panelden yönetiliyor:

| Panel bölümü | Neyi yönetir | Kime açık |
|---|---|---|
| **Sayfa Metinleri** | Bölüm başlıkları, alt yazılar, menü bağlantıları, telif satırı | Herkese |
| **Paylaşım & Arama** | Sekme adı, Google açıklaması, WhatsApp ön izlemesi | Yalnız süper yönetici |

Sayfalarda karşılığı `<h2 data-metin="radyo.akisBaslik">Yayın Akışı</h2>`
biçiminde duruyor. HTML'deki yazı bilerek yerinde bırakıldı: bulut yavaşsa
ziyaretçi boş kutu değil o yazıyı görür, veri gelince üstüne yazılır.

- **Telif yılı:** metindeki `{yil}` içinde bulunulan yılla değişir. Her Ocak
  ayında dosya düzenlemek gerekmez.
- **Boş bırakılan alan varsayılana döner** — silinen bir başlık sayfada
  boşluk bırakmaz (`getSiteData()` birleştirmesi).
- **Yeni alan eklerken:** `data.js` içindeki `metinler` / `seo` bloğuna yaz,
  sayfada `data-metin="grup.alan"` ver, panelde `admin.html`deki listeye ekle.
- **DİKKAT:** `DEFAULT_DATA` nesnesinin içine yorum satırı YAZILAMAZ —
  `araclar/statik-uret.py` onu düz JSON olarak ayrıştırıyor.

### Paylaşım ön izlemesi neden ertesi gün?

WhatsApp, Facebook ve X'in ön izleme botları JavaScript çalıştırmaz. Panelden
değiştirilen başlık, sayfanın içine yazılana kadar kartlarda eski görünür. Bu
işi günlük bakım görevi yapıyor (`araclar/statik-uret.py`, her sabah 09:10).
Sekme adı ve Google açıklaması ise kaydedildiği anda geçerlidir.

---

## 6. Ücretsiz plan sınırları

| Servis | Sınır | Aşılırsa |
|---|---|---|
| Supabase | 5 GB/ay veri transferi; hareketsizlikte proje duraklar | İçerik güncellenemez; site son önbellekle açılmaya devam eder |
| GitHub Pages | 100 GB/ay bant genişliği, 1 GB depo | Yayın kısıtlanır |

İçerik JSON'u ne kadar küçük olursa aylık kapasite o kadar büyür (bkz. 3.3).

---

## 7. Henüz yapılmamışlar (bilinçli olarak bırakıldı)

- **Ziyaretçi analitiği yok.** Kaç kişi geldiği ölçülmüyor. (Plausible / GA4
  eklenebilir; CSP'ye ilgili adresin eklenmesi gerekir.)
- **Hata ve kesinti izleme yok.** Yayın linki ölürse kimse haber almaz.
  (Uptime izleme + yayın adreslerine periyodik sağlık kontrolü önerilir.)
- **Deneme (staging) ortamı yok.** Her push doğrudan canlıya gider.
  Ayrı bir depo ya da ikinci bir Pages dalı ile kurulabilir.
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
