import { NextRequest, NextResponse } from 'next/server';
import { getPool, TABLE, C, q } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { debug } from '@/lib/debug';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      discord,
      age,
      position,
      experience,
      why,
      availability,
      about
    } = body;

    // Validasyon
    if (!firstName?.trim() || !lastName?.trim() || !discord?.trim() || !age || !position || !experience || !why || !availability) {
      return NextResponse.json(
        { ok: false, error: 'Tüm zorunlu alanlar doldurulmalıdır.' },
        { status: 400 }
      );
    }

    // Kullanıcı bilgilerini JWT'den al
    let name = '';
    let email = '';
    const rawCookie = req.cookies.get('averneth_session')?.value;

    if (!rawCookie) {
      return NextResponse.json(
        { ok: false, error: 'Oturum açık değil. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    try {
      const payload = jwt.verify(rawCookie, JWT_SECRET) as any;
      name = payload.sub || '';

      const pool = await getPool();
      const t = q(TABLE);

      // Database'den kullanıcının email'ini çek
      const [rows] = await pool.execute(
        `SELECT ${q(C.email)} FROM ${t} WHERE LOWER(${q(C.name)}) = ? LIMIT 1`,
        [name.toLowerCase()]
      ) as [any[], any];

      if (rows && rows.length > 0) {
        email = rows[0][C.email] || '';
      }
    } catch (jwtError) {
      debug.error('[BASVURU JWT ERROR]', jwtError);
    }

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: 'Kullanıcı bilgileri alınamadı. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    // Mevcut başvuru kontrolü (ayni pozisyon icin)
    try {
      const pool = await getPool();
      const [existing] = await pool.execute(
        `SELECT id FROM staff_applications 
         WHERE LOWER(name) = LOWER(?) AND position = ? AND status IN ('pending', 'reviewing')`,
        [name, position]
      ) as [any[], any];

      if (existing.length > 0) {
        return NextResponse.json(
          { ok: false, error: 'Bu pozisyon için zaten aktif bir başvurunuz bulunuyor.' },
          { status: 400 }
        );
      }
    } catch (_e) {
      // Tablo henuz yoksa devam et
    }

    // MySQL'e kaydet
    try {
      const pool = await getPool();
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';

      // Tablo yoksa oluştur
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS staff_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          discord VARCHAR(100) NOT NULL,
          age INT NOT NULL,
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
        // Sütunlar zaten varsa veya farklı bir hata — görmezden gel
      }

      // Yorumlar tablosu
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
        `INSERT INTO staff_applications 
         (name, email, first_name, last_name, discord, age, position, experience, why, availability, about, status, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          email.trim().toLowerCase(),
          firstName.trim(),
          lastName.trim(),
          discord.trim(),
          parseInt(age),
          position.trim(),
          experience.trim(),
          why.trim(),
          availability.trim(),
          about?.trim() || null,
          'pending',
          ip
        ]
      ) as any;

      debug.log('[BASVURU] Kaydedildi, ID:', result.insertId);

      return NextResponse.json({
        ok: true,
        applicationId: result.insertId,
        message: 'Başvurunuz alındı. En kısa sürede incelenecektir.'
      });
    } catch (dbError: any) {
      debug.error('[BASVURU DB ERROR]', dbError);
      const errorMsg = dbError?.sqlMessage || dbError?.message || 'Veritabanı hatası';
      return NextResponse.json(
        { ok: false, error: `Başvuru kaydedilemedi: ${errorMsg}` },
        { status: 500 }
      );
    }

  } catch (error) {
    debug.error('[BASVURU API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
