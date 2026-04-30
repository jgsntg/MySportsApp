import { NextResponse } from 'next/server';
import { getTeam } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');
  const id = searchParams.get('id');

  if (!sport || !league || !id) {
    return NextResponse.json({ error: 'sport, league, and id params are required' }, { status: 400 });
  }

  const team = await getTeam(sport, league, id);
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  return NextResponse.json(team, {
    headers: { 'Cache-Control': 's-maxage=3600' },
  });
}
