import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams } from '@/lib/db/schema';
import { getSessionUserId } from '@/lib/db/session-user';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teams = await db
    .select()
    .from(favoriteTeams)
    .where(eq(favoriteTeams.userId, userId));

  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teamId, sport, league, teamName, teamLogo, teamColor } = await req.json();

  if (!teamId || !sport || !league || !teamName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(favoriteTeams)
      .values({
        id: uuid(),
        userId,
        teamId,
        sport,
        league,
        teamName,
        teamLogo: teamLogo ?? null,
        teamColor: teamColor ?? null,
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
