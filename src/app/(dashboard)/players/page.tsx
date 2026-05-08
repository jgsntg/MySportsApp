import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoritePlayers } from '@/lib/db/schema';
import { getSessionUserId } from '@/lib/db/session-user';
import { asc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import PlayersClient from '@/components/players/PlayersClient';

export const metadata: Metadata = { title: 'My Players' };

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  const userId  = await getSessionUserId(session!);
  if (!userId) return <PlayersClient players={[]} />;

  const players = await db
    .select()
    .from(favoritePlayers)
    .where(eq(favoritePlayers.userId, userId))
    .orderBy(asc(favoritePlayers.sortOrder), asc(favoritePlayers.createdAt));

  return <PlayersClient players={players} />;
}
