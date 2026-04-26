import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { debug } from '@/lib/debug';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.success) {
      return NextResponse.json(
        { ok: false, error: auth.error || 'Yetkisiz' },
        { status: 403 }
      );
    }

    const pool = await getPool();

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS staff_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL DEFAULT '',
        last_name VARCHAR(100) NOT NULL DEFAULT '',
        discord VARCHAR(100) NOT NULL DEFAULT '',
        age INT NOT NULL DEFAULT 0,
        position VARCHAR(50) NOT NULL,
        experience TEXT NOT NULL,
        why TEXT NOT NULL,
        availability TEXT NOT NULL,
        about TEXT,
        status ENUM('pending', 'reviewing', 'accepted', 'rejected') DEFAULT 'pending',
        ip_address VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

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

    const [applications] = await pool.execute(
      `SELECT id, name, email, first_name as firstName, last_name as lastName,
              discord, age, position, experience, why, availability, about, status,
              ip_address as ip, created_at as createdAt, updated_at as updatedAt
       FROM staff_applications
       ORDER BY created_at DESC`
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

    return new NextResponse(
      JSON.stringify({ ok: true, applications: applicationsWithComments }),
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
    debug.error('[ADMIN BASVURULAR API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
