import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Dynamic rendering - cookie kullanımı için
export const dynamic = 'force-dynamic';

// DELETE - Ticket sil (sadece Kurucu)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // JWT token kontrolü - await cookies() Next.js 14
    const cookieStore = await cookies();
    const token = cookieStore.get('averneth_session')?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Oturum açılmamış' },
        { status: 401 }
      );
    }

    // Token doğrulama
    let payload: any;
    try {
      payload = verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // Kullanıcı rank'ini database'den çek
    const pool = await getPool();
    const [users] = await pool.execute(
      'SELECT rank FROM nlogin WHERE LOWER(last_name) = ? LIMIT 1',
      [payload.sub?.toLowerCase()]
    ) as any[];

    const userRank = users.length > 0 ? users[0].rank : null;

    // Sadece Kurucu silebilir
    if (userRank !== 'Kurucu') {
      return NextResponse.json(
        { ok: false, error: 'Bu işlem için Kurucu yetkisi gereklidir' },
        { status: 403 }
      );
    }

    const ticketId = parseInt(params.id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz ticket ID' },
        { status: 400 }
      );
    }

    // Önce ticket'ın var olduğunu ve çözülmüş olduğunu kontrol et
    const [tickets] = await pool.execute(
      'SELECT status FROM support_tickets WHERE id = ?',
      [ticketId]
    ) as any[];

    if (tickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Destek talebi bulunamadı' },
        { status: 404 }
      );
    }

    const ticket = tickets[0];
    if (ticket.status !== 'resolved') {
      return NextResponse.json(
        { ok: false, error: 'Sadece çözülmüş ticketlar silinebilir' },
        { status: 403 }
      );
    }

    // İlişkili mesajları sil (ON DELETE CASCADE olmadığı için manuel silme)
    await pool.execute(
      'DELETE FROM ticket_messages WHERE ticket_id = ?',
      [ticketId]
    );

    // Ticket'ı sil
    await pool.execute(
      'DELETE FROM support_tickets WHERE id = ?',
      [ticketId]
    );

    return NextResponse.json(
      { ok: true, message: 'Destek talebi başarıyla silindi' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[TICKET DELETE ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
