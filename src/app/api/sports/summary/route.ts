import { NextResponse } from 'next/server';
import { getGameSummary } from '@/lib/api/espn';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport   = searchParams.get('sport');
  const league  = searchParams.get('league');
  const eventId = searchParams.get('eventId');

  if (!sport || !league || !eventId) {
    return NextResponse.json({ error: 'sport, league, and eventId are required' }, { status: 400 });
  }

  const summary = await getGameSummary(sport, league, eventId);
  return NextResponse.json(summary, {
    headers: { 'Cache-Control': 's-maxage=30' },
  });
}
