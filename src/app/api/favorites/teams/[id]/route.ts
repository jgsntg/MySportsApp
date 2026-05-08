import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams } from '@/lib/db/schema';
import { getSessionUserId } from '@/lib/db/session-user';
import { and, eq } from 'drizzle-orm';

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
    .delete(favoriteTeams)
    .where(
      and(eq(favoriteTeams.id, id), eq(favoriteTeams.userId, userId))
    );

  return NextResponse.json({ ok: true });
}
