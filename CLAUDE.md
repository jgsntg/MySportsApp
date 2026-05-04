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

All ESPN data comes from `src/lib/api/espn.ts`, which wraps `https://site.api.espn.com/apis/site/v2/sports` (public, no API key). Next.js `fetch` with `next: { revalidate }` is used for ISR caching — scoreboard data revalidates every 60s, game summaries every 30s, news every 300s, rosters every 3600s.

The canonical sport/league matrix is `ALL_LEAGUES` (exported from `espn.ts`) and `SPORT_CONFIGS` (in `src/types/index.ts`). Whenever you add a new sport or league, update both. ESPN uses `sport`/`league` path params (`football/nfl`, `soccer/usa.1`, etc.) — the `key` field is the short UI identifier (`nfl`, `mls`).

The fantasy feed (`src/app/api/fantasy/feed/route.ts`) combines ESPN RSS + the news API, scoring articles for fantasy relevance via keyword matching. No external RSS parsing library — it uses a small custom regex parser.

### Database

Drizzle ORM on top of `@libsql/client`. Three tables: `users`, `favorite_teams`, `favorite_players` (defined in `src/lib/db/schema.ts`). Schema is maintained via `scripts/init-db.mjs` (raw SQL `CREATE TABLE IF NOT EXISTS`) rather than Drizzle migrations — run `npm run db:push` to apply. `drizzle-kit generate` is wired up but migrations aren't applied automatically.

The DB client in `src/lib/db/index.ts` uses a global singleton to avoid multiple connections in dev (Next.js hot reload).

### Auth

NextAuth with two providers: credentials (email + bcrypt) and Google OAuth. Both create users in the local DB. Sessions use JWT strategy; `session.user.id` is the UUID from the users table. The `src/lib/auth.ts` Google `signIn` callback handles upsert — existing users by email are linked to the Google account, new users are created.

### Client-Side State

TanStack Query (`src/hooks/useFavorites.ts`) manages favorites on the client — cache keys are `['favorites', 'teams']` and `['favorites', 'players']`. Mutations invalidate the relevant query on success.

`DashboardClient` has its own localStorage persistence for layout order (`ms_v3_layout_v1`) and display tweaks — theme, density, accent, section visibility (`ms_v3_tweaks_v1`). All theme/density/accent values are inline style objects derived from the `THEMES`, `ACCENTS`, and `DENSITY` token maps at the top of that file.

### Dynamic Routes

Team and player detail pages use sport/league/id segments: `/team/[sport]/[league]/[id]` and `/player/[sport]/[league]/[id]`. These map directly to ESPN API paths — `sport` is `football`/`basketball`/etc., `league` is `nfl`/`nba`/`usa.1`/etc.

### Image Domains

ESPN CDN hostnames (`a.espncdn.com`, `a1–a4.espncdn.com`, `www.espn.com`) are allowlisted in `next.config.js`. All ESPN images use `unoptimized` on the `<Image>` component to skip Next.js optimization since the URLs are already optimized CDN assets.
