import { NextRequest, NextResponse } from 'next/server';
import { getPool, TABLE, C, q } from '@/lib/db';
import { requireAdmin, normalizeRank } from '@/lib/auth';

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
    const { id, rank, balance } = body;

    if (!id || !rank || balance === undefined) {
      return NextResponse.json({ 
        ok: false, 
        error: "Eksik parametreler: id, rank, balance gerekli" 
      }, { status: 400 });
    }

    const validRanks = ['Oyuncu', 'Rehber', 'Mimar', 'Moderator', 'Developer', 'Admin', 'Kurucu'];
    if (!validRanks.includes(rank)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Geçersiz rank değeri" 
      }, { status: 400 });
    }

    if (typeof balance !== 'number' || balance < 0) {
      return NextResponse.json({ 
        ok: false, 
        error: "Bakiye 0 veya daha büyük bir sayı olmalı" 
      }, { status: 400 });
    }

    const myRank = normalizeRank(adminCheck.user?.rank || "Uye");
    const myLevel = getRankLevel(myRank);
    const assignLevel = getRankLevel(rank);

    // Kurucu her rolü atayabilir, diğerleri sadece kendi seviyesinden düşük rolleri atayabilir
    if (myRank !== 'kurucu' && myLevel <= assignLevel) {
      return NextResponse.json({ ok: false, error: "Bu rolü atama yetkiniz yok." }, { status: 403 });
    }

    const p = await getPool();
    const t = q(TABLE);

    // Düzenlenen kullanıcının mevcut rankını kontrol et
    const [targetRows] = await p.execute(
      "SELECT " + q(C.rank) + " FROM " + t + " WHERE " + q(C.id) + " = ? LIMIT 1",
      [id]
    ) as [any[], any];

    if (Array.isArray(targetRows) && targetRows.length > 0) {
      const targetRank = normalizeRank((targetRows[0] as any)[C.rank] || "Uye");
      const targetLevel = getRankLevel(targetRank);

      // Kurucu herkesi düzenleyebilir, diğerleri sadece kendi seviyesinden düşük kullanıcıları düzenleyebilir
      if (myRank !== 'kurucu' && myLevel <= targetLevel) {
        return NextResponse.json({ ok: false, error: "Yetkiniz bu kullanicinin bilgilerini degistirmeye yetmiyor." }, { status: 403 });
      }
    }

    await p.execute(
      "UPDATE " + t + " SET " + q(C.rank) + " = ?, " + q(C.balance) + " = ? WHERE " + q(C.id) + " = ?",
      [rank, balance, id]
    );
    return NextResponse.json({ ok: true, message: "Kullanıcı güncellendi." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kullanıcı güncellenemedi." }, { status: 500 });
  }
}
