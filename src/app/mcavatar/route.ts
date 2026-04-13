import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  try {
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

    let imageUrl: string;
    if (mojangRes.ok) {
      const mojangData = await mojangRes.json();
      imageUrl = `https://minotar.net/avatar/${mojangData.id}/80`;
    } else {
      imageUrl = `https://minotar.net/avatar/MHF_Steve/80`;
    }

    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    const fallback = await fetch(`https://minotar.net/avatar/MHF_Steve/80`);
    const buffer = await fallback.arrayBuffer();
    return new NextResponse(buffer, { headers: { 'Content-Type': 'image/png' } });
  }
}