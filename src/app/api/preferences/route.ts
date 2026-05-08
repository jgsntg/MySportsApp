import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPreferences, savePreferences } from '@/lib/db/preferences';
import { getSessionUserId } from '@/lib/db/session-user';
import type { UserPrefs } from '@/lib/db/preferences';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({}, { status: 401 });

  const prefs = await getPreferences(userId);
  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Partial<UserPrefs>;
  await savePreferences(userId, body);
  return NextResponse.json({ ok: true });
}
