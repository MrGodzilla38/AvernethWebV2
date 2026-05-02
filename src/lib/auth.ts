import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getPool, TABLE, C, q } from './db';
import { normalizeRank } from './utils';
import { debug } from './debug';

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

function isSecureRequest(req: any): boolean {
  const forwardedProto = req.headers?.get?.('x-forwarded-proto');
  debug.log('DEBUG: x-forwarded-proto:', forwardedProto);
  if (forwardedProto) {
    const isSecure = forwardedProto === 'https';
    debug.log('DEBUG: Using forwarded proto, secure:', isSecure);
    return isSecure;
  }
  try {
    const url = new URL(req.url);
    debug.log('DEBUG: req.url:', req.url, 'protocol:', url.protocol);
    return url.protocol === 'https:';
  } catch {
    debug.log('DEBUG: Failed to parse req.url');
    return false;
  }
}

export function setAuthCookie(response: any, token: string, req?: any) {
  const maxAge = JWT_EXPIRES_DAYS * 24 * 60 * 60;
  const cookieString = `averneth_session=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  debug.log('DEBUG: Setting cookie:', cookieString.substring(0, 50) + '...');
  response.headers.set('Set-Cookie', cookieString);
}

export function clearAuthCookie(response: any, req?: any) {
  const cookieString = `averneth_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
  response.headers.set('Set-Cookie', cookieString);
}

export { BCRYPT_ROUNDS, JWT_SECRET, JWT_EXPIRES_DAYS, normalizeRank };
