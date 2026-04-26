import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { debug } from '@/lib/debug';
import { requireAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.success) {
      return NextResponse.json(
        { ok: false, error: auth.error || 'Yetkisiz' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const appId = parseInt(id);
    const body = await req.json();
    const { status } = body;

    if (!appId || isNaN(appId)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz başvuru ID' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'reviewing', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz durum' },
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

    await pool.execute(
      'UPDATE staff_applications SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, appId]
    );

    return NextResponse.json({
      ok: true,
      message: 'Durum güncellendi',
      applicationId: appId,
      status
    });
  } catch (error) {
    debug.error('[ADMIN BASVURU DURUM API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
