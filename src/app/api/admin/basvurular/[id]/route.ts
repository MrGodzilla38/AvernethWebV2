import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { debug } from '@/lib/debug';
import { requireAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.success) {
      return NextResponse.json(
        { ok: false, error: auth.error || 'Yetkisiz' },
        { status: 403 }
      );
    }

    // Sadece Kurucu silebilir
    const rank = auth.user?.rank || auth.user?.userGroup || '';
    if (rank !== 'Kurucu') {
      return NextResponse.json(
        { ok: false, error: 'Bu işlem için Kurucu yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const appId = parseInt(id);

    if (!appId || isNaN(appId)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz başvuru ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const [existing] = await pool.execute(
      'SELECT id FROM staff_applications WHERE id = ?',
      [appId]
    ) as [any[], any];

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Başvuru bulunamadı' },
        { status: 404 }
      );
    }

    // Yorumlar CASCADE ile otomatik silinir (FK ON DELETE CASCADE)
    await pool.execute('DELETE FROM staff_applications WHERE id = ?', [appId]);

    return NextResponse.json({
      ok: true,
      message: 'Başvuru silindi',
      applicationId: appId
    });
  } catch (error) {
    debug.error('[ADMIN BASVURU DELETE API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
