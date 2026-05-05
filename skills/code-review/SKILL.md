---
name: code-review
description: How to review MySports pull requests and changesets — pattern compliance, type safety, security, and ESPN API correctness.
---

# Skill: Code Review

## When to Use

- Reviewing a PR or a completed implementation before it lands
- Validating that a set of changes follows project patterns
- Checking for security issues in auth or API routes
- Verifying ESPN API integration is correct

---

## Steps

### 1. Understand the intent

Read the PR description or task summary. What was the goal? What files did it touch? This sets the scope — review within bounds, don't flag out-of-scope issues.

### 2. Run the checklist

Work through the reviewer checklist in `agents/reviewer.md`:

```
[ ] New API routes check getServerSession before data access
[ ] New ESPN fetches wrapped in try/catch returning null/[]
[ ] ALL_LEAGUES and SPORT_CONFIGS both updated if a league was added
[ ] scripts/init-db.mjs updated if a DB table was added
[ ] ESPN <Image> components use unoptimized
[ ] npx tsc --noEmit passes
[ ] Inline styles in dashboard/scoreboard; Tailwind in layout/auth
[ ] src/proxy.ts updated for new protected routes
```

### 3. Check the data flow

For server-rendered pages:
- Does `page.tsx` fetch all needed data before passing to the Client component?
- Are serializable-only values passed as props (no functions, no class instances, no Promises)?
- Is ISR caching (`next: { revalidate }`) applied to every ESPN fetch?

For client-side pages:
- Are React Query keys stable and correctly scoped?
- Do mutations invalidate the right cache keys?
- Is error state handled (empty state UI)?

### 4. Check security

- Every API route that reads or writes user data must call `getServerSession(authOptions)` and return 401 if no session
- User-supplied IDs (from query params or body) are passed to DB queries — check they're strings, not injected SQL
- `src/proxy.ts` protects all `(dashboard)` routes at the middleware level, but API routes must check session independently

### 5. Check ESPN patterns

- No fetch() calls to ESPN URLs outside `src/lib/api/espn.ts`
- Player stats use CORE URL (`sports.core.api.espn.com`), not SITE
- `$ref` fields in responses need a second fetch to resolve — check they're handled
- New leagues need entries in both `ALL_LEAGUES` and `SPORT_CONFIGS`

---

## Examples

```
# Pattern violation
// WRONG — API route fetching ESPN directly
export async function GET() {
  const res = await fetch('https://site.api.espn.com/...');
}

// RIGHT
export async function GET() {
  const games = await getScoreboard('football', 'nfl', dateStr);
}

# Missing auth check
// WRONG
export async function GET(req: NextRequest) {
  const data = await db.select().from(favoriteTeams);
}

// RIGHT
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, session.user.id));
}
```

---

## Success Criteria

- All blocking issues are documented with file + line number
- Verdict is clearly stated: Approve / Request Changes / Block
- Non-blocking suggestions are labeled as such
- `npx tsc --noEmit` result is reported
