import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'averneth-secret-key';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id);
    const body = await req.json();
    const { content } = body;

    // JWT token kontrolü
    const raw = req.cookies.get('averneth_session')?.value;
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'Oturum açık değil' }, { status: 401 });
    }

    const payload = jwt.verify(raw, JWT_SECRET) as any;
    const username = payload.sub;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Mesaj boş olamaz' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    
    // Ticket'ın kullanıcıya ait olduğunu ve açık/in_progress olduğunu kontrol et
    const [tickets] = await pool.execute(
      `SELECT id, status FROM support_tickets WHERE id = ? AND LOWER(name) = LOWER(?)`,
      [ticketId, username]
    ) as any[];

    if (tickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    const ticket = tickets[0];
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return NextResponse.json(
        { ok: false, error: 'Çözülmüş veya kapalı taleplere mesaj gönderilemez' },
        { status: 400 }
      );
    }

    // Tablo yoksa oluştur
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        sender VARCHAR(100) NOT NULL,
        sender_rank VARCHAR(50),
        sender_avatar VARCHAR(100),
        content TEXT NOT NULL,
        is_staff BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Mesaj ekle
    const [result] = await pool.execute(
      `INSERT INTO ticket_messages (ticket_id, sender, sender_rank, sender_avatar, content, is_staff) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, username, 'Oyuncu', username, content.trim(), false]
    ) as any;

    // Ticket'ı güncelle
    await pool.execute(
      `UPDATE support_tickets SET updated_at = NOW() WHERE id = ?`,
      [ticketId]
    );

    return NextResponse.json({
      ok: true,
      messageId: result.insertId,
      message: 'Mesaj gönderildi'
    });
  } catch (error) {
    console.error('[USER TICKET REPLY API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
