# MySports — Agent Configuration

Cross-platform configuration for Claude Code, OpenAI Codex, and any AI agent working in this repository.

## Project Overview

MySports is a full-stack sports dashboard: personalized scores, stats, favorites, and fantasy analysis across 8 ESPN leagues (NFL, NBA, MLB, NHL, MLS, La Liga, EPL, PGA). Users authenticate, favorite teams/players, and see a customizable live dashboard.

- Auth: NextAuth v4 (credentials + Google OAuth)
- Data: ESPN public API (no key required) + Drizzle ORM + libsql/Turso
- Hosting target: Vercel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict) |
| UI | React 18, Tailwind CSS, inline CSS vars for theming |
| Auth | NextAuth.js v4 |
| Database | Drizzle ORM + LibSQL (Turso in prod, local `.db` in dev) |
| Client state | TanStack React Query v5 |
| Icons | Lucide React |
| CSS utilities | clsx + tailwind-merge via `cn()` |

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint via next lint
npm run db:push      # Apply schema to local SQLite — run after clone or schema changes
npm run db:generate  # Generate Drizzle migration files
npm run setup        # npm install + db:push (first-time setup)
```

**No automated test suite.** Verify by running `npm run dev` and testing in browser. Run `npx tsc --noEmit` after any TypeScript changes.

---

## Key Architecture Patterns

### Server + Client component split (all dashboard pages)

- `page.tsx` — Server Component: fetches DB + ESPN data, passes serializable props
- `*Client.tsx` — Client Component (`'use client'`): handles all interactivity
- `loading.tsx` — Skeleton shown instantly while server component fetches

### ESPN API

- All calls go through `src/lib/api/espn.ts` — never fetch ESPN directly from components or API routes
- SITE URL: `https://site.api.espn.com/apis/site/v2/sports`
- CORE URL: `https://sports.core.api.espn.com/v2/sports` (player stats + event logs only)
- Use `next: { revalidate: N }` for ISR caching on every fetch

### Database

- Schema: `src/lib/db/schema.ts` (Drizzle table definitions)
- Init SQL: `scripts/init-db.mjs` (raw `CREATE TABLE IF NOT EXISTS`)
- Tables: `users`, `favorite_teams`, `favorite_players`, `user_preferences`
- Preferences stored as JSON blob; helpers in `src/lib/db/preferences.ts`

### League Registry (keep both in sync — always)

- `src/lib/api/espn.ts` → `ALL_LEAGUES` array
- `src/types/index.ts` → `SPORT_CONFIGS` array

### Theme System

- CSS custom properties `--ms-bg`, `--ms-surface`, `--ms-a`, `--ms-ink`, etc.
- Applied on root `<div>` via `buildCSSVars()` in `DashboardClient.tsx`
- Sub-components read `var(--ms-*)` — no prop drilling for theme/accent/density

---

## Key Files

| What | Where |
|---|---|
| ESPN API functions | `src/lib/api/espn.ts` |
| DB schema + init SQL | `src/lib/db/schema.ts` + `scripts/init-db.mjs` |
| Auth config + middleware | `src/lib/auth.ts` + `src/proxy.ts` |
| Shared types | `src/types/index.ts` |
| DB preferences helpers | `src/lib/db/preferences.ts` |
| Dashboard (server + client) | `src/app/(dashboard)/dashboard/page.tsx` + `src/components/dashboard/DashboardClient.tsx` |
| Layout shell | `src/components/layout/` |
| API routes | `src/app/api/` |

---

## Coding Standards

- TypeScript strict — explicit types; no `any` without a comment
- No comments unless the WHY is non-obvious
- No half-finished implementations; no features beyond task scope
- ESPN `<Image>` always use `unoptimized` (CDN assets are pre-optimized)
- Dashboard/scoreboard: inline styles (CSS vars); layout/auth: Tailwind — never mix within one component
- `cn()` from `src/lib/utils.ts` for Tailwind class merging
- API routes: validate at boundary, delegate to lib functions, return typed responses

---

## Agent Behavior Rules

### DO

- Read `docs/architecture.md` before making structural changes
- Check `git log` to understand recent work and conventions
- Verify ESPN endpoints exist before writing integration code — fetch and inspect first
- Run `npx tsc --noEmit` after any TypeScript changes
- Use ISR caching (`next: { revalidate }`) on all ESPN fetches
- Add new ESPN functions to `src/lib/api/espn.ts`, not inline
- Keep `ALL_LEAGUES` and `SPORT_CONFIGS` in sync
- Use Drizzle ORM for DB queries; raw SQL only in `scripts/init-db.mjs`
- Add new protected routes to `src/proxy.ts`
- Test dark theme compatibility before reporting a UI task complete

### DO NOT

- Fetch ESPN directly from components or API routes
- Add a DB table without updating both `schema.ts` and `init-db.mjs`
- Add `console.log` (only `console.error` in catch blocks)
- Hardcode colors in dashboard/scoreboard components — use `var(--ms-*)`
- Break the server/client component boundary
- Skip ISR caching on ESPN fetches
- Add error handling for scenarios that cannot happen

---

## Task Execution Workflow

1. **Understand** — read relevant files; check `git log` for recent context
2. **Locate** — identify exact files to change before writing any code
3. **Verify ESPN** — if touching a new endpoint, fetch it first to confirm the shape
4. **Implement** — minimal changes; follow existing patterns exactly
5. **Type-check** — run `npx tsc --noEmit`
6. **Report** — describe what changed and where

---

## Error Handling Strategy

- **ESPN fetches**: `try/catch` → return `null`/`[]` on failure, never throw
- **API routes**: 400 bad input · 401 unauthenticated · 500 unexpected; `console.error`, never expose internals
- **Client components**: empty-state UI (dashed border) when data is missing
- **DB operations**: errors propagate to the API route's catch block

---

## Environment Variables

Required in `.env.local`:

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional: Turso cloud DB. Falls back to local mysports.db when absent.
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

---

## Deep Reference

Full architecture, DB schema, ESPN type shapes, component inventory, state management docs: `docs/architecture.md`
