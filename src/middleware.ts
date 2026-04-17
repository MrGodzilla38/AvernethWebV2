import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/mcavatar') || pathname.startsWith('/mcavatar/')) {
    const username = req.nextUrl.searchParams.get('username');
    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    try {
      // Use mc-heads.net directly - it supports username-based lookups
      const imageUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/80`;

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Failed to fetch from mc-heads.net');
      
      const buffer = await imgRes.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // Fallback to Steve head
      const fallback = await fetch(`https://mc-heads.net/avatar/Steve/80`);
      const buffer = await fallback.arrayBuffer();
      return new NextResponse(buffer, { headers: { 'Content-Type': 'image/png' } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mcavatar', '/mcavatar/'],
};