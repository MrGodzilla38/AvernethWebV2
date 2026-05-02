import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', 'averneth_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return response;
}
