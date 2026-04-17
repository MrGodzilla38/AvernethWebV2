import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPool, TABLE, C, q } from '@/lib/db';
import { requireJwtSecret, JWT_SECRET } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const jwtCheck = requireJwtSecret();
  if (!jwtCheck.success) {
    return NextResponse.json({ ok: false, error: jwtCheck.error }, { status: 503 });
  }

  const raw = req.cookies.get('averneth_session')?.value;
  console.log('DEBUG: Cookie value:', raw ? raw.substring(0, 20) + '...' : 'NOT_FOUND');
  if (!raw) return NextResponse.json({ ok: true, loggedIn: false });
  
  try {
    const payload = jwt.verify(raw, JWT_SECRET) as any;
    const p = await getPool();
    const t = q(TABLE);

    let userData: any = null;

    // Try with created column first
    try {
      const [rows] = await p.execute(
        "SELECT " + q(C.rank) + ", " + q(C.email) + ", " + q(C.created) + " FROM " + t + " WHERE LOWER(" + q(C.name) + ") = ? LIMIT 1",
        [payload.sub]
      ) as [any[], any];
      userData = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
    } catch (colErr: any) {
      // If 'created' column doesn't exist, try without it
      if (colErr?.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await p.execute(
          "SELECT " + q(C.rank) + ", " + q(C.email) + " FROM " + t + " WHERE LOWER(" + q(C.name) + ") = ? LIMIT 1",
          [payload.sub]
        ) as [any[], any];
        userData = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
      } else {
        throw colErr;
      }
    }

    const rank = userData?.[C.rank] || "Üye";
    const email = userData?.[C.email] || null;
    const created = userData?.[C.created] || null;

    return NextResponse.json({
      ok: true,
      loggedIn: true,
      username: payload.rn || payload.sub,
      rank: rank,
      email: email,
      created: created
    });
  } catch (_e) {
    console.log('DEBUG: JWT verification failed:', _e);
    return NextResponse.json({ ok: true, loggedIn: false });
  }
}
