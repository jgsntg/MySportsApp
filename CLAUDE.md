# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint via next lint
npm run db:push      # Initialize SQLite tables (run once after clone or schema changes)
npm run db:generate  # Generate Drizzle migration files from schema changes
npm run setup        # npm install + db:push (first-time setup)
```

There are no automated tests.

## Environment Variables

Required in `.env.local`:

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional: Turso cloud DB. Falls back to local mysports.db file when absent.
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

## Architecture

### Route Structure

Two Next.js route groups:
- `src/app/(auth)/` — unauthenticated pages: `/login`, `/register`
- `src/app/(dashboard)/` — protected pages behind NextAuth middleware

Route protection is in `src/proxy.ts` (despite the name, it's the NextAuth middleware). All `/dashboard/*`, `/teams/*`, `/team/*`, `/player/*`, `/headlines/*`, and `/api/favorites/*` routes require a session.

### Data Flow Pattern

Pages under `(dashboard)` follow a consistent pattern: the page file is a **Server Component** that fetches data directly (from ESPN or the DB), then passes it as props to a `*Client.tsx` component that handles all interactivity. The dashboard page (`src/app/(dashboard)/dashboard/page.tsx`) is the most complex example — it fetches scoreboards for all 8 leagues in parallel, enriches games with user favorites, then passes structured `GameData[]` to `DashboardClient`.

### ESPN API

All ESPN data comes from `src/lib/api/espn.ts`. Two base URLs are used:
- `https://site.api.espn.com/apis/site/v2/sports` — scoreboards, news, rosters, team/player profiles
- `https://sports.core.api.espn.com/v2/sports` — player statistics and event logs (the site API endpoints for these return 404)

Next.js `fetch` with `next: { revalidate }` is used for ISR caching — scoreboard data revalidates every 60s, game summaries every 30s, news every 300s, rosters every 3600s, player stats 1800s.

The canonical sport/league matrix is `ALL_LEAGUES` (exported from `espn.ts`) and `SPORT_CONFIGS` (in `src/types/index.ts`). Whenever you add a new sport or league, update both. ESPN uses `sport`/`league` path params (`football/nfl`, `soccer/usa.1`, etc.) — the `key` field is the short UI identifier (`nfl`, `mls`).

Player stats (`getAthleteStats`) and event logs (`getAthleteEventLog`) use the core API. The event log returns `$ref` pointers, so the function fetches the last 5 played games in parallel and resolves both the event detail and per-game statistics refs. Stats are filtered to per-game averages (`avg*` prefix, excluding `avg48*`).

The fantasy feed (`src/app/api/fantasy/feed/route.ts`) combines ESPN RSS + the news API, scoring articles for fantasy relevance via keyword matching. No external RSS parsing library — it uses a small custom regex parser.

### Database

Drizzle ORM on top of `@libsql/client`. Four tables: `users`, `favorite_teams`, `favorite_players`, `user_preferences` (defined in `src/lib/db/schema.ts`). Schema is maintained via `scripts/init-db.mjs` (raw SQL `CREATE TABLE IF NOT EXISTS`) rather than Drizzle migrations — run `npm run db:push` to apply. `drizzle-kit generate` is wired up but migrations aren't applied automatically.

**Note:** `npm run db:push` requires Node 16+ (`--env-file` flag and `??=` syntax in `@libsql/client`). On Node 14 you can apply the SQL directly: `sqlite3 mysports.db < scripts/init-db.mjs` or use `sqlite3 mysports.db "CREATE TABLE IF NOT EXISTS ..."`.

The DB client in `src/lib/db/index.ts` uses a global singleton to avoid multiple connections in dev (Next.js hot reload).

Helper functions for preferences are in `src/lib/db/preferences.ts` — `getPreferences(userId)` and `savePreferences(userId, update)`.

### Auth

NextAuth with two providers: credentials (email + bcrypt) and Google OAuth. Both create users in the local DB. Sessions use JWT strategy; `session.user.id` is the UUID from the users table. The `src/lib/auth.ts` Google `signIn` callback handles upsert — existing users by email are linked to the Google account, new users are created.

### Client-Side State

TanStack Query (`src/hooks/useFavorites.ts`) manages favorites on the client — cache keys are `['favorites', 'teams']` and `['favorites', 'players']`. Mutations invalidate the relevant query on success.

**User preferences** (dashboard layout order, tweaks, scoreboard order/collapsed state) are persisted to the `user_preferences` DB table via `PUT /api/preferences`. Server components (`dashboard/page.tsx`, `scoreboard/page.tsx`) load these at request time and pass them as `savedPrefs` props to the client components — so the correct theme/order is rendered on the first paint with no flash. localStorage is kept as a write-through cache and fallback.

`DashboardClient` uses CSS custom properties (`--ms-bg`, `--ms-surface`, `--ms-a`, `--ms-gap`, etc.) for the entire theme/accent/density system. The root `<div>` gets a single `style` object with all 14 vars via `buildCSSVars()`. Sub-components read `var(--ms-*)` directly — no T/A/DEN prop drilling. `FocusMode` and `TweaksPanel` are dynamically imported (`next/dynamic`, `ssr: false`) so they don't bloat the initial bundle.

### Loading Skeletons

`loading.tsx` files exist for `/dashboard`, `/players`, and `/teams`. These are shown instantly by Next.js while the server component fetches data.

### Dynamic Routes

Team and player detail pages use sport/league/id segments: `/team/[sport]/[league]/[id]` and `/player/[sport]/[league]/[id]`. These map directly to ESPN API paths — `sport` is `football`/`basketball`/etc., `league` is `nfl`/`nba`/`usa.1`/etc.

### Image Domains

ESPN CDN hostnames (`a.espncdn.com`, `a1–a4.espncdn.com`, `www.espn.com`) are allowlisted in `next.config.js`. All ESPN images use `unoptimized` on the `<Image>` component to skip Next.js optimization since the URLs are already optimized CDN assets.
