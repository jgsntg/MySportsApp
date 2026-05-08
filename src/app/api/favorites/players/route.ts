import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoritePlayers } from '@/lib/db/schema';
import { getSessionUserId } from '@/lib/db/session-user';
import { and, asc, eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const players = await db
    .select()
    .from(favoritePlayers)
    .where(eq(favoritePlayers.userId, userId))
    .orderBy(asc(favoritePlayers.sortOrder), asc(favoritePlayers.createdAt));

  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { playerId, sport, league, playerName, playerPhoto, teamName, position } =
    await req.json();

  if (!playerId || !sport || !league || !playerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const existing = await db
      .select({ sortOrder: favoritePlayers.sortOrder })
      .from(favoritePlayers)
      .where(eq(favoritePlayers.userId, userId));
    const nextSortOrder = existing.reduce(
      (max, player) => Math.max(max, player.sortOrder ?? 0),
      -1
    ) + 1;

    const [row] = await db
      .insert(favoritePlayers)
      .values({
        id: uuid(),
        userId,
        playerId,
        sport,
        league,
        playerName,
        playerPhoto: playerPhoto ?? null,
        teamName: teamName ?? null,
        position: position ?? null,
        sortOrder: nextSortOrder,
        displayInCommandCenter: 1,
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

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderedIds } = await req.json() as { orderedIds?: unknown };

  if (!Array.isArray(orderedIds) || orderedIds.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'Invalid orderedIds' }, { status: 400 });
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(favoritePlayers)
        .set({ sortOrder: index })
        .where(and(eq(favoritePlayers.id, id), eq(favoritePlayers.userId, userId)))
    )
  );

  const players = await db
    .select()
    .from(favoritePlayers)
    .where(eq(favoritePlayers.userId, userId))
    .orderBy(asc(favoritePlayers.sortOrder), asc(favoritePlayers.createdAt));

  return NextResponse.json(players);
}
