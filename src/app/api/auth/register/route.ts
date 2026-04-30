import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      id: uuid(),
      email: normalizedEmail,
      name: name?.trim() || null,
      passwordHash,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
