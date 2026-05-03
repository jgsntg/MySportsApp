---
name: API Route Guidelines
description: Use when writing API routes (.ts files in src/app/api/) — validation, error handling, database patterns
applyTo: "src/app/api/**/*.ts"
---

# API Route Guidelines

## Structure

```tsx
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 1. Parse & validate input (URL params, headers, query)
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // 2. Fetch/transform data (db, ESPN API)
    const data = await db.select().from(teams).where(eq(teams.id, id));

    // 3. Return typed response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('GET /api/teams failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Patterns

**Validation**: Check at boundary. Return 400 with clear message for invalid input.

**Database**: Use Drizzle. Import schema from `@/lib/db/schema`. Use `eq()`, `and()` for filters.

**ESPN Proxy**: ESPN API calls go through `src/lib/api/espn.ts`. Use that client; don't fetch directly.

**Error Handling**: Catch, log, return 5xx. Don't expose internal error details to client.

**Typing**: Define request/response types in `src/types/`. Use them in route handlers.

## Auth Routes

NextAuth routes live in `src/app/api/auth/[...nextauth]/route.ts`. For protected routes, check session:

```tsx
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```
