import { NextResponse } from 'next/server';
import { getScoreboard } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');

  if (!sport || !league) {
    return NextResponse.json({ error: 'sport and league are required' }, { status: 400 });
  }

  const scores = await getScoreboard(sport, league);
  return NextResponse.json(scores, {
    headers: { 'Cache-Control': 's-maxage=60' },
  });
}
