/*
  YÖNETİCİ YÖNETİMİ
  ------------------------------------------------------------------
  Panelde "Yöneticiler" bölümünün arkasındaki uç nokta.

  NEDEN SUNUCUDA?
  Yeni bir giriş hesabı açmak Supabase'in "service_role" anahtarını
  gerektirir. O anahtar her şeyi yapabilir; tarayıcıya konamaz, çünkü
  paneli açan herkes onu görebilirdi. Bu yüzden hesap açma/silme işi
  burada, sunucu tarafında duruyor.

  KİM ÇAĞIRABİLİR?
  Yalnızca süper yönetici (site_yoneticiler.rol = 'sahip'). Kontrol
  gönderilen jetondan yapılır, tarayıcının söylediğine güvenilmez.

  Adres: /functions/v1/yoneticiler
  Gövde: { islem: "liste" | "ekle" | "sil" | "sifre", ... }
*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function cevap(govde: unknown, kod = 200) {
  return new Response(JSON.stringify(govde), {
    status: kod,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (istek) => {
  if (istek.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const URL_ = Deno.env.get("SUPABASE_URL")!;
  const SERVIS = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const yonetici = createClient(URL_, SERVIS, { auth: { persistSession: false } });

  /* ---- 1) Jetonu doğrula ---- */
  const yetki = istek.headers.get("Authorization") || "";
  const jeton = yetki.replace(/^Bearer\s+/i, "");
  if (!jeton) return cevap({ hata: "Giriş gerekli." }, 401);

  const { data: kullanici, error: jetonHatasi } = await yonetici.auth.getUser(jeton);
  if (jetonHatasi || !kullanici?.user) return cevap({ hata: "Oturum geçersiz." }, 401);

  /* ---- 2) Süper yönetici mi? ---- */
  const { data: satir } = await yonetici
    .from("site_yoneticiler")
    .select("rol")
    .eq("uid", kullanici.user.id)
    .maybeSingle();

  if (!satir || satir.rol !== "sahip") {
    return cevap({ hata: "Bu işlem yalnızca süper yöneticiye açık." }, 403);
  }

  /* ---- 3) İşlem ---- */
  let govde: any = {};
  try { govde = await istek.json(); } catch { /* boş gövde = liste */ }
  const islem = govde.islem || "liste";

  if (islem === "liste") {
    const { data, error } = await yonetici
      .from("site_yoneticiler")
      .select("uid, eposta, ad, rol, eklendi")
      .order("eklendi", { ascending: true });
    if (error) return cevap({ hata: error.message }, 400);

    /* Son giriş zamanını auth tarafından tamamla — "bu hesabı kullanıyor mu?" */
    const { data: liste } = await yonetici.auth.admin.listUsers({ perPage: 200 });
    const sonGiris: Record<string, string | null> = {};
    (liste?.users || []).forEach((k) => { sonGiris[k.id] = k.last_sign_in_at ?? null; });

    return cevap({
      yoneticiler: (data || []).map((y) => ({ ...y, son_giris: sonGiris[y.uid] ?? null })),
    });
  }

  if (islem === "ekle") {
    const eposta = String(govde.eposta || "").trim().toLowerCase();
    const sifre  = String(govde.sifre || "");
    const ad     = String(govde.ad || "").trim() || null;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return cevap({ hata: "E-posta adresi geçersiz." }, 400);
    if (sifre.length < 8) return cevap({ hata: "Şifre en az 8 karakter olmalı." }, 400);

    const { data: yeni, error } = await yonetici.auth.admin.createUser({
      email: eposta,
      password: sifre,
      email_confirm: true,          // doğrulama maili beklemeden hemen girebilsin
    });
    if (error) {
      const zatenVar = /already|registered|exists/i.test(error.message);
      return cevap({ hata: zatenVar ? "Bu e-posta ile bir hesap zaten var." : error.message }, 400);
    }

    const { error: kayitHatasi } = await yonetici
      .from("site_yoneticiler")
      .insert({ uid: yeni.user.id, eposta, ad, rol: "yonetici" });

    if (kayitHatasi) {
      /* Yetki satırı yazılamadıysa yarım hesap bırakma */
      await yonetici.auth.admin.deleteUser(yeni.user.id);
      return cevap({ hata: kayitHatasi.message }, 400);
    }
    return cevap({ tamam: true, uid: yeni.user.id });
  }

  if (islem === "sil") {
    const uid = String(govde.uid || "");
    if (!uid) return cevap({ hata: "Hangi yönetici silinecek?" }, 400);
    if (uid === kullanici.user.id) return cevap({ hata: "Kendi hesabını silemezsin." }, 400);

    const { data: hedef } = await yonetici
      .from("site_yoneticiler").select("rol").eq("uid", uid).maybeSingle();
    if (hedef?.rol === "sahip") return cevap({ hata: "Süper yönetici hesabı buradan silinemez." }, 400);

    await yonetici.from("site_yoneticiler").delete().eq("uid", uid);
    const { error } = await yonetici.auth.admin.deleteUser(uid);
    if (error) return cevap({ hata: error.message }, 400);
    return cevap({ tamam: true });
  }

  if (islem === "sifre") {
    const uid   = String(govde.uid || "");
    const sifre = String(govde.sifre || "");
    if (!uid) return cevap({ hata: "Hangi hesabın şifresi?" }, 400);
    if (sifre.length < 8) return cevap({ hata: "Şifre en az 8 karakter olmalı." }, 400);

    const { error } = await yonetici.auth.admin.updateUserById(uid, { password: sifre });
    if (error) return cevap({ hata: error.message }, 400);
    return cevap({ tamam: true });
  }

  return cevap({ hata: "Bilinmeyen işlem." }, 400);
});
