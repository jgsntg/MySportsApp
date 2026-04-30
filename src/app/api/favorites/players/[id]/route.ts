import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoritePlayers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db
    .delete(favoritePlayers)
    .where(
      and(eq(favoritePlayers.id, params.id), eq(favoritePlayers.userId, session.user.id))
    );

  return NextResponse.json({ ok: true });
}
