import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoritePlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const players = await db
    .select()
    .from(favoritePlayers)
    .where(eq(favoritePlayers.userId, session.user.id));

  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { playerId, sport, league, playerName, playerPhoto, teamName, position } =
    await req.json();

  if (!playerId || !sport || !league || !playerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(favoritePlayers)
      .values({
        id: uuid(),
        userId: session.user.id,
        playerId,
        sport,
        league,
        playerName,
        playerPhoto: playerPhoto ?? null,
        teamName: teamName ?? null,
        position: position ?? null,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
    }
    throw err;
  }
}
