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
    const { content, authorRank } = body;

    if (!appId || isNaN(appId)) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz başvuru ID' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Yorum içeriği boş olamaz' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const author = auth.user?.sub || auth.user?.username || 'Yetkili';

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS staff_application_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        author VARCHAR(100) NOT NULL,
        author_rank VARCHAR(50),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES staff_applications(id) ON DELETE CASCADE,
        INDEX idx_application_id (application_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [result] = await pool.execute(
      `INSERT INTO staff_application_comments (application_id, author, author_rank, content)
       VALUES (?, ?, ?, ?)`,
      [appId, author, authorRank || null, content.trim()]
    ) as any;

    return NextResponse.json({
      ok: true,
      commentId: result.insertId,
      message: 'Yorum eklendi'
    });
  } catch (error) {
    debug.error('[ADMIN BASVURU YORUM API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
