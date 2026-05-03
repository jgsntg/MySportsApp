import { NextResponse } from 'next/server';
import { getNews, getTeamNews } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport  = searchParams.get('sport') ?? undefined;
  const league = searchParams.get('league') ?? undefined;
  const team   = searchParams.get('team')   ?? undefined;
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  const articles = (sport && league && team)
    ? await getTeamNews(sport, league, team, limit)
    : await getNews(sport, limit);

  return NextResponse.json(articles, {
    headers: { 'Cache-Control': 's-maxage=300' },
  });
}
