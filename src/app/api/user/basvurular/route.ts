import { NextRequest, NextResponse } from 'next/server';
import { debug } from '@/lib/debug';
import jwt from 'jsonwebtoken';
import { getPool } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'averneth-secret-key';

export async function GET(req: NextRequest) {
  try {
    const raw = req.cookies.get('averneth_session')?.value;
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'Oturum açık değil' }, { status: 401 });
    }

    const payload = jwt.verify(raw, JWT_SECRET) as any;
    const username = payload.sub;

    const pool = await getPool();

    // Eski tablolara eksik sütunları ekle
    try {
      await pool.execute(`
        ALTER TABLE staff_applications
        ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT '' AFTER email,
        ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT '' AFTER first_name,
        MODIFY discord VARCHAR(100) NOT NULL DEFAULT '',
        MODIFY age INT NOT NULL DEFAULT 0
      `);
    } catch (_e) {
      // Sütunlar zaten varsa görmezden gel
    }

    const [applications] = await pool.execute(
      `SELECT id, name, email, first_name as firstName, last_name as lastName,
              discord, age, position, experience, why, availability, about, status,
              ip_address as ip, created_at as createdAt, updated_at as updatedAt
       FROM staff_applications
       WHERE LOWER(name) = LOWER(?)
       ORDER BY created_at DESC`,
      [username]
    ) as any[];

    const applicationsWithComments = await Promise.all(
      applications.map(async (app: any) => {
        try {
          const [comments] = await pool.execute(
            `SELECT id, author, author_rank as authorRank, content, created_at as createdAt
             FROM staff_application_comments
             WHERE application_id = ?
             ORDER BY created_at ASC`,
            [app.id]
          ) as any[];
          return { ...app, comments: comments || [] };
        } catch (err) {
          return { ...app, comments: [] };
        }
      })
    );

    return NextResponse.json({
      ok: true,
      applications: applicationsWithComments
    });
  } catch (error) {
    debug.error('[USER BASVURULAR API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
