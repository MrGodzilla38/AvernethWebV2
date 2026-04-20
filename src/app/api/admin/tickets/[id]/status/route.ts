import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    const body = await req.json();
    const { status } = body;

    if (!ticketId || isNaN(ticketId)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz ticket ID' },
        { status: 400 }
      );
    }

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz durum' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Ticket var mı kontrol et
    const [existing] = await pool.execute(
      'SELECT id FROM support_tickets WHERE id = ?',
      [ticketId]
    ) as [any[], any];

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Ticket bulunamadı' },
        { status: 404 }
      );
    }

    // Status güncelle
    await pool.execute(
      'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, ticketId]
    );

    return NextResponse.json({
      ok: true,
      message: 'Durum güncellendi',
      ticketId,
      status
    });

  } catch (error) {
    console.error('[ADMIN TICKET STATUS API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
