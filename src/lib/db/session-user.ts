import type { Session } from 'next-auth';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function getSessionUserId(session: Session): Promise<string | null> {
  const sessionId = session.user.id;

  const [byId] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, sessionId))
    .limit(1);

  if (byId) return byId.id;

  const email = session.user.email?.toLowerCase().trim();
  if (email) {
    const [byEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (byEmail) return byEmail.id;

    await db.insert(users).values({
      id: sessionId,
      email,
      name: session.user.name ?? null,
      passwordHash: null,
      createdAt: Math.floor(Date.now() / 1000),
    });

    return sessionId;
  }

  return null;
}
