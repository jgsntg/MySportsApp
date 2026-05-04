import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPreferences, savePreferences } from '@/lib/db/preferences';
import type { UserPrefs } from '@/lib/db/preferences';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const prefs = await getPreferences(session.user.id);
  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Partial<UserPrefs>;
  await savePreferences(session.user.id, body);
  return NextResponse.json({ ok: true });
}
