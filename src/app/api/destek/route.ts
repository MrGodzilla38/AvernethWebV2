import { NextRequest, NextResponse } from 'next/server';
import { getPool, TABLE, C, q } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const category = formData.get('category') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const attachment = formData.get('attachment') as File | null;

    // Validasyon
    if (!category || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: 'Tüm alanlar zorunludur.' },
        { status: 400 }
      );
    }

    // Kullanıcının bilgilerini JWT'den al
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
      name = payload.sub || ''; // JWT'den kullanıcı adı
      
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
      console.error('[DESTEK JWT ERROR]', jwtError);
    }
    
    // Eğer kullanıcı bilgileri alınamadıysa hata dön
    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: 'Kullanıcı bilgileri alınamadı. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    // Fotoğraf işleme
    let attachmentInfo = null;
    if (attachment) {
      if (attachment.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: 'Dosya boyutu en fazla 5MB olabilir.' },
          { status: 400 }
        );
      }
      if (!attachment.type.startsWith('image/')) {
        return NextResponse.json(
          { ok: false, error: 'Sadece resim dosyaları yüklenebilir.' },
          { status: 400 }
        );
      }
      
      const bytes = await attachment.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      attachmentInfo = {
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        data: base64 // Tam base64 verisi
      };
    }

    // MySQL'e kaydet
    try {
      const pool = await getPool();
      
      // Tablo yoksa oluştur (attachment LONGTEXT olarak değiştirildi - base64 için)
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
          attachment LONGTEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Eski tabloda attachment kolonu varsa LONGTEXT'e çevir
      try {
        await pool.execute(`
          ALTER TABLE support_tickets 
          MODIFY COLUMN attachment LONGTEXT
        `);
      } catch (alterErr) {
        // Kolon yoksa veya zaten LONGTEXT ise hata vermez
      }

      // Ticket ekle
      const attachmentData = attachmentInfo ? JSON.stringify(attachmentInfo) : null;
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
      
      const [result] = await pool.execute(
        `INSERT INTO support_tickets (name, email, category, subject, message, status, ip_address, attachment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), email.trim().toLowerCase(), category.trim(), subject.trim(), 
         message.trim(), 'open', ip, attachmentData]
      ) as any;

      console.log('[DESTEK TICKET] Kaydedildi, ID:', result.insertId);

      return NextResponse.json({
        ok: true,
        ticketId: result.insertId,
        message: 'Destek talebiniz alındı. En kısa sürede size dönüş yapacağız.'
      });
    } catch (dbError: any) {
      console.error('[DESTEK DB ERROR]', dbError);
      // Hata mesajını kullanıcıya göster
      const errorMsg = dbError?.sqlMessage || dbError?.message || 'Veritabanı hatası';
      return NextResponse.json({
        ok: false,
        error: `Destek talebi kaydedilemedi: ${errorMsg}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[DESTEK API ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
