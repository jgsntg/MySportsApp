import { NextResponse } from 'next/server';
import { getTeamRoster } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');
  const teamId = searchParams.get('teamId');

  if (!sport || !league || !teamId) {
    return NextResponse.json({ error: 'sport, league, and teamId are required' }, { status: 400 });
  }

  const roster = await getTeamRoster(sport, league, teamId);
  return NextResponse.json(roster, {
    headers: { 'Cache-Control': 's-maxage=3600' },
  });
}
