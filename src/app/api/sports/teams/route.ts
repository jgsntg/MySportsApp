import { NextResponse } from 'next/server';
import { getTeams } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');

  if (!sport || !league) {
    return NextResponse.json({ error: 'sport and league params are required' }, { status: 400 });
  }

  const teams = await getTeams(sport, league);
  return NextResponse.json(teams, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
