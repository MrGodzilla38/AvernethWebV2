import { NextRequest, NextResponse } from 'next/server';
import { getPool, TABLE, C, q } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.success) {
    return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.error?.includes("Yetkisiz") ? 401 : 403 });
  }

  try {
    const p = await getPool();
    const t = q(TABLE);
    const [rows] = await p.execute(
      "SELECT " + q(C.id) + " as " + q("id") + ", " + q(C.name) + " as " + q("username") + ", " + q(C.email) + " as " + q("email") + ", " + q(C.rank) + " as " + q("rank") + ", " + q(C.balance) + " as " + q("balance") + ", " + q(C.lastlogin) + " as " + q("lastSeen") + " FROM " + t
    );
    return NextResponse.json({ ok: true, users: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kullanıcılar yüklenemedi." }, { status: 500 });
  }
}
