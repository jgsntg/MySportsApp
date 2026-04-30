import { NextResponse } from 'next/server';
import { getAthlete } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');
  const id = searchParams.get('id');

  if (!sport || !league || !id) {
    return NextResponse.json({ error: 'sport, league, and id are required' }, { status: 400 });
  }

  const athlete = await getAthlete(sport, league, id);
  if (!athlete) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

  return NextResponse.json(athlete, {
    headers: { 'Cache-Control': 's-maxage=3600' },
  });
}
