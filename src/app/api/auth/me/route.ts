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
  if (!raw) return NextResponse.json({ ok: true, loggedIn: false });
  
  try {
    const payload = jwt.verify(raw, JWT_SECRET) as any;
    const p = await getPool();
    const t = q(TABLE);
    const [rows] = await p.execute(
      "SELECT " + q(C.rank) + " FROM " + t + " WHERE LOWER(" + q(C.name) + ") = ? LIMIT 1",
      [payload.sub]
    );
    const rank = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any)[C.rank] : "Üye";

    return NextResponse.json({
      ok: true,
      loggedIn: true,
      username: payload.rn || payload.sub,
      rank: rank
    });
  } catch (_e) {
    return NextResponse.json({ ok: true, loggedIn: false });
  }
}
