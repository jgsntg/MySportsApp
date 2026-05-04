import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoritePlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import PlayersClient from '@/components/players/PlayersClient';

export const metadata: Metadata = { title: 'My Players' };

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user.id;

  const players = await db
    .select()
    .from(favoritePlayers)
    .where(eq(favoritePlayers.userId, userId));

  return <PlayersClient players={players} />;
}
