import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nLogin',
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { locale } = await request.json();
    const userId = params.userId;

    if (!locale) {
      return NextResponse.json(
        { error: 'Locale is required' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE nlogin SET locale = ? WHERE ai = ?',
      [locale, userId]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update locale' },
      { status: 500 }
    );
  }
}
