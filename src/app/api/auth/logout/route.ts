import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
