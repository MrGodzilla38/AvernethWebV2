import { NextRequest, NextResponse } from 'next/server';
import { getPool, TABLE, C, q } from '@/lib/db';
import { requireAdmin, normalizeRank } from '@/lib/auth';

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

    const p = await getPool();
    const t = q(TABLE);

    // Düzenlenen kullanıcının mevcut rankını kontrol et
    const [targetRows] = await p.execute(
      "SELECT " + q(C.rank) + " FROM " + t + " WHERE " + q(C.id) + " = ? LIMIT 1",
      [id]
    ) as [any[], any];

    if (Array.isArray(targetRows) && targetRows.length > 0) {
      const targetRank = normalizeRank((targetRows[0] as any)[C.rank] || "Uye");
      const myRank = normalizeRank(adminCheck.user?.rank || "Uye");

      // Kurucu dokunulmazdır
      if (targetRank === "kurucu" && myRank !== "kurucu") {
        return NextResponse.json({ ok: false, error: "Yetkiniz bu kullanicinin bilgilerini degistirmeye yetmiyor." }, { status: 403 });
      }

      // Adminler Kurucu ve diger Adminleri duzenleyemez
      if (myRank === "admin") {
        if (targetRank === "kurucu" || targetRank === "admin") {
          return NextResponse.json({ ok: false, error: "Yetkiniz bu kullanicinin bilgilerini degistirmeye yetmiyor." }, { status: 403 });
        }
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
