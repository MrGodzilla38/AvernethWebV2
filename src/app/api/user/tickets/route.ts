import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'averneth-secret-key';

export async function GET(req: NextRequest) {
  try {
    // JWT token kontrolü
    const raw = req.cookies.get('averneth_session')?.value;
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'Oturum açık değil' }, { status: 401 });
    }

    const payload = jwt.verify(raw, JWT_SECRET) as any;
    const username = payload.sub;

    const pool = await getPool();
    
    // Kullanıcının destek taleplerini çek
    const [tickets] = await pool.execute(
      `SELECT id, name, email, category, subject, message, status, 
              ip_address as ip, attachment, created_at as createdAt, updated_at as updatedAt
       FROM support_tickets 
       WHERE LOWER(name) = LOWER(?)
       ORDER BY created_at DESC`,
      [username]
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

    return NextResponse.json({
      ok: true,
      tickets: ticketsWithMessages
    });
  } catch (error) {
    console.error('[USER TICKETS API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
