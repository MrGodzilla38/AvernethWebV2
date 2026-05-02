import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool, TABLE, C, q } from '@/lib/db';
import { rateLimit, clientIp, MC_USER, PASS_MIN, PASS_MAX, EMAIL_MAX, EMAIL_OK } from '@/lib/utils';
import { requireJwtSecret, generateToken, setAuthCookie, BCRYPT_ROUNDS } from '@/lib/auth';
import { debug } from '@/lib/debug';

export async function POST(req: NextRequest) {
  const jwtCheck = requireJwtSecret();
  if (!jwtCheck.success) {
    return NextResponse.json({ ok: false, error: jwtCheck.error }, { status: 503 });
  }

  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "Çok fazla istek. Bir süre sonra tekrar deneyin." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    const emailNorm = emailRaw.toLowerCase();

    if (!MC_USER.test(username)) {
      return NextResponse.json({
        ok: false,
        error: "Oyuncu adı 3–16 karakter olmalı; yalnızca harf, rakam ve alt çizgi kullanılabilir.",
      }, { status: 400 });
    }
    
    if (password.length < PASS_MIN || password.length > PASS_MAX) {
      return NextResponse.json({
        ok: false,
        error: "Şifre " + PASS_MIN + "–" + PASS_MAX + " karakter arasında olmalı (nLogin ile uyumlu).",
      }, { status: 400 });
    }
    
    if (!emailNorm || emailNorm.length > EMAIL_MAX || !EMAIL_OK.test(emailNorm)) {
      return NextResponse.json({
        ok: false,
        error: "Geçerli bir e-posta adresi girin.",
      }, { status: 400 });
    }

    const nameLower = username.toLowerCase();
    const p = await getPool();
    const t = q(TABLE);

    const [dup] = await p.execute(
      "SELECT " + q(C.id) + " FROM " + t + " WHERE LOWER(" + q(C.name) + ") = ? LIMIT 1",
      [nameLower]
    );
    
    if (Array.isArray(dup) && dup.length > 0) {
      return NextResponse.json({ ok: false, error: "Bu oyuncu adı zaten kayıtlı." }, { status: 409 });
    }

    const [emailDup] = await p.execute(
      "SELECT " + q(C.id) + " FROM " + t + " WHERE LOWER(" + q(C.email) + ") = ? LIMIT 1",
      [emailNorm]
    );
    
    if (Array.isArray(emailDup) && emailDup.length > 0) {
      return NextResponse.json({ ok: false, error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });
    }

    let hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    if (hash.startsWith("$2b$")) {
      hash = "$2a$" + hash.slice(4);
    }

    await p.execute(
      "INSERT INTO " + t + " (" + q(C.name) + ", " + q(C.password) + ", " + q(C.address) + ", " + q(C.email) + ", " + q(C.rank) + ", " + q(C.created) + ") VALUES (?, ?, ?, ?, 'Oyuncu', NOW())",
      [username, hash, ip, emailNorm]
    );

    const token = generateToken(username);
    const response = NextResponse.json({
      ok: true,
      message: "Kayıt tamamlandı. Aynı şifre ile oyunda /login kullanabilirsiniz.",
      username: username,
    });

    setAuthCookie(response, token, req);
    return response;
  } catch (err) {
    debug.error(err);
    return NextResponse.json({ ok: false, error: "Veritabanı hatası. Yapılandırmayı kontrol edin." }, { status: 500 });
  }
}
