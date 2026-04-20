import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Production'da static caching'i engelle - her zaman fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    
    // Tablo yoksa oluştur
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        ip_address VARCHAR(100),
        attachment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tüm ticketları çek (en yeniden eskiye)
    const [tickets] = await pool.execute(
      `SELECT id, name, email, category, subject, message, status, 
              ip_address as ip, attachment, created_at as createdAt, updated_at as updatedAt
       FROM support_tickets 
       ORDER BY created_at DESC`
    ) as any[];

    // Her ticket için mesajları çek
    const ticketsWithMessages = await Promise.all(
      tickets.map(async (ticket: any) => {
        try {
          const [messages] = await pool.execute(
            `SELECT id, sender, sender_rank as senderRank, sender_avatar as senderAvatar,
                    content, is_staff as isStaff, created_at as createdAt
             FROM ticket_messages 
             WHERE ticket_id = ? 
             ORDER BY created_at ASC`,
            [ticket.id]
          ) as any[];
          
          return {
            ...ticket,
            messages: messages || []
          };
        } catch (err) {
          return {
            ...ticket,
            messages: []
          };
        }
      })
    );

    // Cache kontrolü ile yanıt dön
    return new NextResponse(
      JSON.stringify({ ok: true, tickets: ticketsWithMessages }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('[ADMIN TICKETS API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
