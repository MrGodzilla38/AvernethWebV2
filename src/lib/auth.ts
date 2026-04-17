import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getPool, TABLE, C, q } from './db';
import { normalizeRank } from './utils';

const BCRYPT_ROUNDS = Math.min(31, Math.max(4, Number(process.env.BCRYPT_ROUNDS) || 10));
const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_DAYS = Number(process.env.JWT_EXPIRES_DAYS) || 7;

export function requireJwtSecret(): { success: boolean; error?: string } {
  if (!JWT_SECRET || JWT_SECRET.length < 16) {
    return {
      success: false,
      error: "Sunucu yapılandırması eksik: JWT_SECRET ayarlanmalı (en az 16 karakter)."
    };
  }
  return { success: true };
}

export async function verifyUser(req: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  const raw = req.cookies.get('averneth_session')?.value;
  if (!raw) return { success: false, error: "Yetkisiz erişim." };

  try {
    const payload = jwt.verify(raw, JWT_SECRET) as any;
    const p = await getPool();
    const t = q(TABLE);
    const [rows] = await p.execute(
      "SELECT " + q(C.rank) + " FROM " + t + " WHERE LOWER(" + q(C.name) + ") = ? LIMIT 1",
      [payload.sub]
    ) as [any[], any];

    if (!rows.length) return { success: false, error: "Kullanıcı bulunamadı." };

    const dbRank = rows[0][C.rank] || "Uye";
    return { success: true, user: { ...payload, rank: dbRank } };
  } catch (_e) {
    return { success: false, error: "Geçersiz oturum." };
  }
}

export async function requireAdmin(req: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  const userResult = await verifyUser(req);
  if (!userResult.success) return userResult;

  const dbRank = userResult.user.rank || "Uye";
  const rank = normalizeRank(dbRank);
  
  const allowed = ["kurucu", "admin", "developer"];
  const isAllowed = allowed.some(r => rank === r || rank.includes(r));

  if (!isAllowed) {
    return {
      success: false,
      error: "Yetkiniz yok. Sunucudaki rutbeniz: [" + dbRank + "]"
    };
  }

  return { success: true, user: userResult.user };
}

export function generateToken(username: string): string {
  const nameLower = username.toLowerCase();
  return jwt.sign({ sub: nameLower, rn: username }, JWT_SECRET as string, {
    expiresIn: `${JWT_EXPIRES_DAYS}d`,
  });
}

export function setAuthCookie(response: any, token: string) {
  response.cookies.set("averneth_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: JWT_EXPIRES_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export function clearAuthCookie(response: any) {
  response.cookies.set("averneth_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export { BCRYPT_ROUNDS, JWT_SECRET, JWT_EXPIRES_DAYS, normalizeRank };
