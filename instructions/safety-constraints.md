# Safety Constraints

Hard rules that protect user data, prevent regressions, and avoid irreversible mistakes.

---

## Authentication and Authorization

**Every API route that reads or writes user-specific data must check the session:**

```typescript
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

This applies even to routes that seem low-risk. The middleware in `src/proxy.ts` protects pages and `/api/favorites/*` routes, but other API routes (e.g., `/api/preferences`) must check independently.

**Never use the user ID from the request body or query params for data isolation.** Always use `session.user.id`. A user should never be able to read or modify another user's favorites or preferences.

---

## Database Safety

**Never run `DROP TABLE` or `DELETE FROM` without explicit user confirmation.** The init script uses `CREATE TABLE IF NOT EXISTS` — safe to re-run. `ALTER TABLE` for additive changes is safe. Destructive operations are not.

**Schema changes must update both files atomically:**
- `src/lib/db/schema.ts` (Drizzle type definitions)
- `scripts/init-db.mjs` (raw SQL applied to the DB)

A schema that compiles but hasn't been pushed will cause runtime errors in production (Turso). A pushed schema without a Drizzle update will cause TypeScript compile errors.

---

## ESPN API Safety

**Never expose ESPN API responses directly to the client without transformation.** ESPN responses are large and contain internal fields not needed by the UI. Transform at the API route or in `espn.ts` helper functions.

**Do not cache ESPN game data for longer than 60 seconds on live scoreboards.** Users expect near-real-time scores. Longer caches on static data (rosters: 3600s, stats: 1800s) are fine.

---

## Environment Variable Safety

**Never commit `.env.local` or any file containing secrets.** The `.gitignore` should cover this, but verify before committing.

**The `NEXTAUTH_SECRET` must be a cryptographically random string in production.** A weak or shared secret enables session forgery.

---

## Deployment Safety

**Always run `npm run build` before shipping a significant change.** Next.js build catches issues that `tsc --noEmit` misses (missing dynamic imports, invalid page exports, etc.).

**Do not push directly to the main branch.** Use a branch and review via `agents/reviewer.md` before merging.

---

## Content Safety

MySports displays sports data from ESPN, which is public. There is no user-generated content beyond:
- Display names (stored in `users.name`)
- Favorite teams/players (stored by ESPN ID, not user-entered text)
- Preferences (structured JSON, not free text)

No XSS risk from stored user content. ESPN content is trusted (official partner API) but rendered as text (not `dangerouslySetInnerHTML`).
