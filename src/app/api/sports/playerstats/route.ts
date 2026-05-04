import { NextResponse } from 'next/server';
import { getAthleteStats, getAthleteEventLog, getPlayerNews } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');
  const id = searchParams.get('id');

  if (!sport || !league || !id) {
    return NextResponse.json({ error: 'sport, league, and id are required' }, { status: 400 });
  }

  const [stats, recentGames, news] = await Promise.all([
    getAthleteStats(sport, league, id),
    getAthleteEventLog(sport, league, id),
    getPlayerNews(sport, league, id),
  ]);

  return NextResponse.json({ stats, recentGames, news }, {
    headers: { 'Cache-Control': 's-maxage=1800' },
  });
}
