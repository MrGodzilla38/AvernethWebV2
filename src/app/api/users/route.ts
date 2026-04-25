import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { debug } from '@/lib/debug';

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nLogin',
};

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT ai, last_name, email, locale, `rank`, balance, last_seen FROM nlogin ORDER BY ai'
    );
    
    await connection.end();
    
    return NextResponse.json(rows);
  } catch (error) {
    debug.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
