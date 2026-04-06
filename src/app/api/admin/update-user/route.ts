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
    if (!id) return NextResponse.json({ ok: false, error: "ID gerekli." }, { status: 400 });

    const p = await getPool();
    const t = q(TABLE);

    // Düzenlenen kullanıcının mevcut rankını kontrol et
    const [targetRows] = await p.execute(
      "SELECT " + q(C.rank) + " FROM " + t + " WHERE " + q(C.id) + " = ? LIMIT 1",
      [id]
    );

    if (Array.isArray(targetRows) && targetRows.length > 0) {
      const targetRank = normalizeRank((targetRows[0] as any)[C.rank] || "Uye");
      const myRank = normalizeRank(adminCheck.user?.rank || "Uye");

      // Basyonetici ve Kurucu dokunulmazdir
      const isHighLevel = targetRank === "kurucu" || targetRank === "basyonetici";

      if (myRank === "admin") {
        // Adminler Kurucu, Basyonetici ve diger Adminleri duzenleyemez
        if (isHighLevel || targetRank === "admin") {
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
