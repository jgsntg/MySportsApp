import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoritePlayers } from '@/lib/db/schema';
import { getSessionUserId } from '@/lib/db/session-user';
import { and, eq } from 'drizzle-orm';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { displayInCommandCenter } = await req.json() as { displayInCommandCenter?: unknown };

  if (typeof displayInCommandCenter !== 'boolean') {
    return NextResponse.json({ error: 'Invalid displayInCommandCenter' }, { status: 400 });
  }

  const [player] = await db
    .update(favoritePlayers)
    .set({ displayInCommandCenter: displayInCommandCenter ? 1 : 0 })
    .where(and(eq(favoritePlayers.id, id), eq(favoritePlayers.userId, userId)))
    .returning();

  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(player);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await db
    .delete(favoritePlayers)
    .where(
      and(eq(favoritePlayers.id, id), eq(favoritePlayers.userId, userId))
    );

  return NextResponse.json({ ok: true });
}
