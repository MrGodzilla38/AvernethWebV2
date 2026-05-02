import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  cookies().delete('averneth_session');
  return NextResponse.json({ ok: true });
}
