import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Canonical shape for all persisted UI preferences
export interface UserPrefs {
  dashboardOrder?:        string[];
  dashboardTweaks?:       Record<string, unknown>;
  scoreboardOrder?:       string[];
  scoreboardCollapsed?:   Record<string, boolean>;
}

export async function getPreferences(userId: string): Promise<UserPrefs> {
  try {
    const [row] = await db
      .select({ prefs: userPreferences.prefs })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return row ? (JSON.parse(row.prefs) as UserPrefs) : {};
  } catch {
    return {};
  }
}

export async function savePreferences(userId: string, update: Partial<UserPrefs>): Promise<void> {
  const existing = await getPreferences(userId);
  const merged = { ...existing, ...update };
  const now = Math.floor(Date.now() / 1000);

  await db
    .insert(userPreferences)
    .values({ userId, prefs: JSON.stringify(merged), updatedAt: now })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { prefs: JSON.stringify(merged), updatedAt: now },
    });
}
