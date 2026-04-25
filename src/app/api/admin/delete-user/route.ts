import { NextRequest, NextResponse } from 'next/server';
import { getPool, TABLE, C, q } from '@/lib/db';
import { requireAdmin, normalizeRank } from '@/lib/auth';
import { debug } from '@/lib/debug';

// Rol seviyeleri: Kurucu(6) > Admin(5) > Developer(4) > Moderator(3) > Mimar(2) > Rehber(1) > Oyuncu(0)
const RANK_LEVELS: Record<string, number> = {
  'oyuncu': 0,
  'rehber': 1,
  'mimar': 2,
  'moderator': 3,
  'developer': 4,
  'admin': 5,
  'kurucu': 6
};

function getRankLevel(rank: string): number {
  return RANK_LEVELS[rank.toLowerCase()] ?? 0;
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.success) {
    return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.error?.includes("Yetkisiz") ? 401 : 403 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Kullanıcı ID gerekli." }, { status: 400 });
    }

    const myRank = normalizeRank(adminCheck.user?.rank || "Uye");
    const myLevel = getRankLevel(myRank);

    const p = await getPool();
    const t = q(TABLE);

    // Silinecek kullanıcının rolünü kontrol et
    const [targetRows] = await p.execute(
      "SELECT " + q(C.rank) + " FROM " + t + " WHERE " + q(C.id) + " = ? LIMIT 1",
      [id]
    ) as [any[], any];

    if (Array.isArray(targetRows) && targetRows.length > 0) {
      const targetRank = normalizeRank((targetRows[0] as any)[C.rank] || "Uye");
      const targetLevel = getRankLevel(targetRank);

      // Kurucu herkesi silebilir, diğerleri sadece kendi seviyesinden düşük kullanıcıları silebilir
      if (myRank !== 'kurucu' && myLevel <= targetLevel) {
        return NextResponse.json({ ok: false, error: "Yetkiniz bu kullaniciyi silmeye yetmiyor." }, { status: 403 });
      }
    }

    const idCol = q(C.id);
    const [result] = await p.execute(
      `DELETE FROM ${t} WHERE ${idCol} = ?`,
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ ok: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Kullanıcı silindi." });
  } catch (err) {
    debug.error(err);
    return NextResponse.json({ ok: false, error: "Kullanıcı silinemedi." }, { status: 500 });
  }
}
