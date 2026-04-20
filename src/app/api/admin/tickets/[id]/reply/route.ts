import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id);
    const body = await req.json();
    const { content, sender, senderRank, senderAvatar, isStaff = true } = body;

    if (!content || !sender) {
      return NextResponse.json(
        { ok: false, error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    
    // Tablo yoksa oluştur
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        sender VARCHAR(100) NOT NULL,
        sender_rank VARCHAR(50),
        sender_avatar VARCHAR(100),
        content TEXT NOT NULL,
        is_staff BOOLEAN DEFAULT TRUE,
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
      [ticketId, sender, senderRank, senderAvatar, content, isStaff]
    ) as any;

    // Ticket durumunu in_progress yap (eğer open ise)
    await pool.execute(
      `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() 
       WHERE id = ? AND status = 'open'`,
      [ticketId]
    );

    return NextResponse.json({
      ok: true,
      messageId: result.insertId,
      message: 'Yanıt gönderildi'
    });
  } catch (error) {
    console.error('[TICKET REPLY API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
