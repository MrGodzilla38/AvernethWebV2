import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool, TABLE, C, q } from '@/lib/db';
import { rateLimit, clientIp, MC_USER } from '@/lib/utils';
import { requireJwtSecret, generateToken, setAuthCookie } from '@/lib/auth';

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

    if (!MC_USER.test(username) || password.length < 1) {
      return NextResponse.json({ ok: false, error: "Geçersiz kullanıcı adı veya şifre." }, { status: 400 });
    }

    const nameLower = username.toLowerCase();
    const p = await getPool();
    const t = q(TABLE);

    const [rows] = await p.execute(
      "SELECT " + q(C.id) + ", " + q(C.name) + ", " + q(C.password) +
      " FROM " + t +
      " WHERE LOWER(" + q(C.name) + ") = ? LIMIT 1",
      [nameLower]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Oyuncu adı veya şifre hatalı." }, { status: 401 });
    }

    const row = rows[0] as any;
    const stored = row[C.password];
    if (typeof stored !== "string" || !stored.startsWith("$2")) {
      return NextResponse.json({
        ok: false,
        error: "Bu hesap BCrypt ile kayıtlı değil. nLogin şifreleme olarak BCRYPT2A kullanılmalı.",
      }, { status: 503 });
    }

    const match = await bcrypt.compare(password, stored);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Oyuncu adı veya şifre hatalı." }, { status: 401 });
    }

    const id = row[C.id];
    await p.execute(
      "UPDATE " + t + " SET " + q(C.address) + " = ? WHERE " + q(C.id) + " = ?",
      [ip, id]
    );

    const token = generateToken(username);
    console.log('DEBUG: Generated token:', token.substring(0, 20) + '...');
    
    const response = NextResponse.json({
      ok: true,
      message: "Giriş başarılı.",
      username: username,
      token: token, // Token'ü frontend'e gönder
    });
    
    setAuthCookie(response, token);
    console.log('DEBUG: Cookie set in response');
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ ok: false, error: "Veritabanı hatası. Yapılandırmayı kontrol edin." }, { status: 500 });
  }
}
