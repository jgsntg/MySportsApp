# MySportsApp — Architecture & Codebase Guide

This document is the single source of truth for how the app is built. It is intended for use by AI agents and developers to answer questions and execute changes without needing to re-read the codebase from scratch.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How the App Works — Top Level](#how-the-app-works--top-level)
4. [Authentication](#authentication)
5. [Database](#database)
6. [ESPN API Integration](#espn-api-integration)
7. [Pages](#pages)
8. [Key Components](#key-components)
9. [API Routes](#api-routes)
10. [State Management](#state-management)
11. [User Preferences Persistence](#user-preferences-persistence)
12. [Theme System](#theme-system)
13. [Type System](#type-system)
14. [Patterns & Conventions](#patterns--conventions)
15. [How To: Common Tasks](#how-to-common-tasks)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| UI | React 18, inline styles + Tailwind CSS |
| Auth | NextAuth.js v4 |
| Database | Drizzle ORM + LibSQL (`@libsql/client`) — Turso in prod, local `.db` file in dev |
| Data fetching (client) | TanStack React Query v5 |
| Icons | Lucide React |
| Password hashing | bcryptjs |
| IDs | uuid v14 |
| CSS utilities | clsx + tailwind-merge |

**Node requirement**: Node 16+ (the `@libsql/client` package uses `??=` syntax; `db:push` uses `--env-file`).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Unauthenticated routes
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/             # Auth-protected routes
│   │   ├── layout.tsx           # Navbar + Sidebar shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Server component — main dashboard
│   │   │   └── loading.tsx      # Skeleton shown while page.tsx fetches
│   │   ├── scoreboard/
│   │   │   ├── page.tsx         # Server component
│   │   │   └── (no loading.tsx yet)
│   │   ├── players/
│   │   │   ├── page.tsx         # Server component
│   │   │   └── loading.tsx
│   │   ├── teams/
│   │   │   ├── page.tsx         # Client component (uses React Query)
│   │   │   └── loading.tsx
│   │   ├── headlines/page.tsx   # Client component
│   │   ├── fantasy/page.tsx     # Client component
│   │   ├── team/[sport]/[league]/[id]/page.tsx   # Client component
│   │   └── player/[sport]/[league]/[id]/page.tsx # Client component
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   └── register/route.ts       # Registration endpoint
│   │   ├── favorites/
│   │   │   ├── teams/route.ts          # GET, POST, DELETE
│   │   │   └── players/route.ts        # GET, POST, DELETE
│   │   ├── preferences/route.ts        # GET, PUT user prefs
│   │   └── sports/
│   │       ├── teams/route.ts
│   │       ├── team/route.ts
│   │       ├── roster/route.ts
│   │       ├── scores/route.ts
│   │       ├── headlines/route.ts
│   │       ├── summary/route.ts
│   │       ├── player/route.ts
│   │       └── playerstats/route.ts
│   ├── layout.tsx               # Root layout (fonts, providers)
│   └── providers.tsx            # React Query + SessionProvider
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── dashboard/
│   │   ├── DashboardClient.tsx  # Main dashboard UI (1,000+ lines)
│   │   ├── FocusMode.tsx        # Dynamically imported live game overlay
│   │   └── TweaksPanel.tsx      # Dynamically imported settings panel
│   ├── players/
│   │   └── PlayersClient.tsx    # My Players page UI
│   └── scoreboard/
│       └── ScoreboardClient.tsx # Scoreboard page UI
├── hooks/
│   └── useFavorites.ts          # React Query hooks for favorites
├── lib/
│   ├── auth.ts                  # NextAuth config
│   ├── utils.ts                 # cn(), timeAgo(), formatDate(), formatGameTime()
│   ├── db/
│   │   ├── index.ts             # Drizzle + LibSQL client (singleton)
│   │   ├── schema.ts            # Table definitions
│   │   └── preferences.ts       # getPreferences() / savePreferences()
│   └── api/
│       └── espn.ts              # All ESPN API calls
├── types/
│   └── index.ts                 # ESPN types + app types + NextAuth augments
└── proxy.ts                     # NextAuth middleware (route protection)

scripts/
└── init-db.mjs                  # Raw SQL CREATE TABLE IF NOT EXISTS for all tables

docs/
└── architecture.md              # This file
```

---

## How the App Works — Top Level

### Request lifecycle for a protected page

1. Browser requests `/dashboard`.
2. `src/proxy.ts` (NextAuth middleware) checks for a valid session. Unauthenticated → redirect to `/login`.
3. Next.js shows `dashboard/loading.tsx` immediately (skeleton UI).
4. `dashboard/page.tsx` runs on the server:
   - Gets session via `getServerSession(authOptions)`.
   - Fetches DB data (favorites, user prefs) and ESPN data in parallel via `Promise.all`.
   - Returns serializable props to `DashboardClient`.
5. `DashboardClient` hydrates on the client with the server-fetched data already in place — no client-side loading state for initial data.
6. Interactive features (TweaksPanel, FocusMode) are lazy-loaded via `next/dynamic` only when the user opens them.

### Route groups

- `(auth)` — No layout wrapper. Login/register pages.
- `(dashboard)` — Wrapped by `layout.tsx` which renders the Navbar and Sidebar shell. All pages here require authentication.

---

## Authentication

**File**: `src/lib/auth.ts`  
**Handler**: `src/app/api/auth/[...nextauth]/route.ts`  
**Middleware**: `src/proxy.ts`

### Providers

**Google OAuth**
- Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.
- On first sign-in: creates a new user row in `users` table with a UUID, email, name, and `passwordHash: null`.
- On subsequent sign-ins: finds existing user by email, reuses their UUID as the session ID.

**Credentials (email + password)**
- Registration: `POST /api/auth/register` — hashes password with bcryptjs, inserts user row.
- Login: `POST /api/auth/callback/credentials` (NextAuth internal) — looks up user by email, compares bcrypt hash.
- Minimum password length: 8 characters (enforced client-side in register form).

### Session shape

```typescript
session.user.id    // UUID from users table (custom claim added in jwt callback)
session.user.name  // Display name
session.user.email // Email address
```

`session.user.id` is used as the foreign key for all DB operations (favorites, preferences).

### Protected routes (from `src/proxy.ts`)

```
/dashboard/:path*
/players/:path*
/teams/:path*
/team/:path*
/player/:path*
/headlines/:path*
/api/favorites/:path*
```

All other routes (including `/api/preferences`) check session inside the handler.

---

## Database

**File**: `src/lib/db/schema.ts`  
**Init script**: `scripts/init-db.mjs`  
**Client**: `src/lib/db/index.ts`

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| email | TEXT UNIQUE NOT NULL | |
| name | TEXT | Display name |
| password_hash | TEXT | null for Google users |
| created_at | INTEGER | Unix timestamp |

#### `favorite_teams`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| user_id | TEXT NOT NULL | FK → users.id |
| team_id | TEXT NOT NULL | ESPN team ID |
| sport | TEXT NOT NULL | e.g. `football` |
| league | TEXT NOT NULL | e.g. `nfl` |
| team_name | TEXT NOT NULL | Display name |
| team_logo | TEXT | ESPN CDN URL |
| team_color | TEXT | Hex without `#` (e.g. `013369`) |
| created_at | INTEGER | |

Unique constraint: `(user_id, team_id, sport)`.

#### `favorite_players`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| user_id | TEXT NOT NULL | FK → users.id |
| player_id | TEXT NOT NULL | ESPN athlete ID |
| sport | TEXT NOT NULL | |
| league | TEXT NOT NULL | |
| player_name | TEXT NOT NULL | |
| player_photo | TEXT | ESPN CDN URL |
| team_name | TEXT | |
| position | TEXT | e.g. `QB` |
| created_at | INTEGER | |

Unique constraint: `(user_id, player_id, sport)`.

#### `user_preferences`
| Column | Type | Notes |
|---|---|---|
| user_id | TEXT PK | FK → users.id |
| prefs | TEXT NOT NULL | JSON blob, default `{}` |
| updated_at | INTEGER | Unix timestamp |

Stored JSON shape:
```typescript
{
  dashboardOrder?:      string[];                      // ['games','teams','players','headlines']
  dashboardTweaks?:     Partial<TweaksState>;          // theme, density, accent, visible, collapsed
  scoreboardOrder?:     string[];                      // ['nfl','nba','mlb',...]
  scoreboardCollapsed?: Record<string, boolean>;       // { 'mlb': true }
}
```

### DB client pattern

`src/lib/db/index.ts` uses a `globalThis` singleton to avoid spawning multiple LibSQL connections during Next.js hot module reloads in dev. Exports:
- `db` — Drizzle ORM instance (used for typed queries)
- `client` — Raw LibSQL client (used in init script)

Connection resolves `TURSO_DATABASE_URL` if set (Turso cloud), else falls back to `file:./mysports.db` local SQLite file.

### Preferences helpers (`src/lib/db/preferences.ts`)

```typescript
getPreferences(userId: string): Promise<UserPrefs>
savePreferences(userId: string, update: Partial<UserPrefs>): Promise<void>
```

`savePreferences` uses `INSERT ... ON CONFLICT DO UPDATE` (upsert) — safe to call even if no row exists yet.

---

## ESPN API Integration

**File**: `src/lib/api/espn.ts`

### Two base URLs

```
SITE:  https://site.api.espn.com/apis/site/v2/sports
CORE:  https://sports.core.api.espn.com/v2/sports
```

Most endpoints use the SITE base. Player statistics and event logs use the CORE base — the SITE endpoints for those return 404.

### URL patterns

```
SITE/{sport}/{league}/scoreboard?dates={YYYYMMDD}
SITE/{sport}/{league}/teams
SITE/{sport}/{league}/teams/{teamId}
SITE/{sport}/{league}/teams/{teamId}/roster
SITE/{sport}/{league}/athletes/{athleteId}
SITE/{sport}/{league}/news?athlete={id}&limit={n}
SITE/{sport}/{league}/summary?event={eventId}

CORE/{sport}/leagues/{league}/athletes/{athleteId}/statistics/0
CORE/{sport}/leagues/{league}/athletes/{athleteId}/eventlog?limit=100
```

### Sport/league identifiers

| Key | sport | league |
|---|---|---|
| nfl | football | nfl |
| nba | basketball | nba |
| mlb | baseball | mlb |
| nhl | hockey | nhl |
| mls | soccer | usa.1 |
| laliga | soccer | esp.1 |
| epl | soccer | eng.1 |
| pga | golf | pga |

The `key` is the short UI identifier. `sport` and `league` are the ESPN API path segments.

### Caching (Next.js ISR)

All fetches use `fetch(url, { next: { revalidate: N } })`:

| Data | revalidate |
|---|---|
| Scoreboard | 60s |
| Game summary | 30s |
| News/headlines | 300s |
| Roster | 3600s |
| Player stats | 1800s |

### Key exported functions

```typescript
getTeams(sport, league)                          → ESPNTeam[]
getTeam(sport, league, teamId)                   → ESPNTeam | null
getTeamRoster(sport, league, teamId)             → ESPNAthlete[]
getScoreboard(sport, league, dateStr)            → ESPNGame[]
getAthlete(sport, league, athleteId)             → ESPNAthlete | null
getAthleteStats(sport, league, athleteId)        → StatCategory[]
getAthleteEventLog(sport, league, athleteId)     → EventLogGame[]
getPlayerNews(sport, league, athleteId, limit?)  → unknown[]
getNews(sport?, limit?)                          → ESPNNewsArticle[]
getGameSummary(sport, league, eventId)           → GameSummary | null
ALL_LEAGUES                                      → readonly array of all 8 leagues
```

### Player stats details

`getAthleteStats` fetches from the CORE API (`/statistics/0` = all-splits totals). Stats are filtered to per-game averages only: names starting with `avg` but not `avg48` (those are per-48-min NBA stats). Returns `StatCategory[]` — categories: `defensive`, `general`, `offensive`, each with filtered stats.

`getAthleteEventLog` fetches all season games (`limit=100`), filters to `played: true`, takes the last 5 (most recent), then resolves event details and per-game statistics `$ref` URLs in parallel. Returns `EventLogGame[]` in reverse-chronological order (most recent first).

### `StatCategory` and `EventLogGame` types

```typescript
interface StatCategory {
  name: string;           // 'offensive', 'defensive', 'general'
  displayName: string;    // 'Offensive', 'Defensive', 'General'
  stats: Array<{
    name: string;         // 'avgPoints', 'avgRebounds'
    displayName: string;  // 'Points Per Game'
    value: number;
    displayValue: string; // '24.5'
  }>;
}

interface EventLogGame {
  id: string;
  eventName: string;   // 'LAL @ GSW'
  date: string;        // ISO date string
  stats: Array<{ name, displayName, displayValue }>;  // per-game avgs, up to 8
}
```

---

## Pages

### Dashboard (`/dashboard`)

**Files**: `src/app/(dashboard)/dashboard/page.tsx` (server) + `src/components/dashboard/DashboardClient.tsx` (client)

**Server component fetches (parallel `Promise.all`)**:
- Favorite teams from DB
- Favorite players from DB
- User preferences from DB
- General headlines (8 articles, all leagues)
- Team-specific news (up to 4 favorite teams, 4 articles each, deduped)
- Scoreboards for all 8 leagues × today AND yesterday = 16 scoreboard calls

**Props passed to DashboardClient**: `userName`, `dateLabel`, `liveMyTeamCount`, `todayGames: GameData[]`, `yesterdayGames: GameData[]`, `myTeams`, `myPlayers`, `generalHeadlines`, `teamNews`, `savedPrefs`

**`GameData` shape**:
```typescript
interface GameData {
  id: string;
  league: string;       // 'NFL'
  sport: string;        // 'football'
  leagueKey: string;    // 'nfl'
  state: 'pre' | 'in' | 'post';
  detail: string;       // 'Q3 4:22' or 'FINAL' or '7:30 PM ET'
  date: string;         // 'YYYYMMDD'
  away: GameTeam;
  home: GameTeam;
  venue?: string;
  broadcast?: string;
  espnLink?: string;
}

interface GameTeam {
  abbr: string;
  name: string;
  logo?: string;        // ESPN CDN URL
  color: string;        // Hex with '#'
  score?: string;
  mine: boolean;        // User has this team favorited
  winning: boolean;
  record?: string;
}
```

**DashboardClient features**:
- Live ticker (sticky, scrolling scores for live games)
- Live banner (carousel for user's live games with FOCUS button)
- 4 reorderable, collapsible sections: Today's Games, My Teams, My Players, Headlines
- Drag-and-drop + ↑↓ button reordering
- Tweaks panel (theme, density, accent, section visibility toggles)
- FocusMode (full-screen live game view with play-by-play)
- SAVE LAYOUT / RESET buttons with "● UNSAVED" indicator

---

### Scoreboard (`/scoreboard`)

**Files**: `src/app/(dashboard)/scoreboard/page.tsx` + `src/components/scoreboard/ScoreboardClient.tsx`

Server fetches today's games for all 8 leagues in parallel. Sections are reorderable/collapsible. Golf shows a leaderboard instead of individual game cards.

**`ScoreSection` shape**:
```typescript
interface ScoreSection {
  key: string;           // 'nfl', 'nba', etc.
  name: string;          // 'NFL'
  color: string;         // hex
  games: ScoreGame[];
  golfTournament?: GolfTournament;
}
```

---

### My Players (`/players`)

**Files**: `src/app/(dashboard)/players/page.tsx` (server) + `src/components/players/PlayersClient.tsx` (client)

Server fetches user's `favorite_players` from DB. Passes list to `PlayersClient`.

`PlayersClient` shows a 2-column layout:
- Left sidebar: player list with photo/initial, name, position/league. Click to select.
- Right panel: selected player's season stats, last 5 games, recent news. Each player panel fetches from `/api/sports/playerstats` via TanStack Query (stale time 30 min).

---

### Browse Teams (`/teams`)

**File**: `src/app/(dashboard)/teams/page.tsx` — **client component** (uses React Query directly, not a server component).

Shows sport/league filter tabs (from `SPORT_CONFIGS` in types) + search box. On tab change, fetches `/api/sports/teams` via React Query (stale time 1 hour). Team cards link to `/team/{sport}/{league}/{id}`.

---

### Team Detail (`/team/[sport]/[league]/[id]`)

**File**: `src/app/(dashboard)/team/[sport]/[league]/[id]/page.tsx` — client component.

Three React Query fetches: team details, roster, recent scores. Shows:
- Team header with gradient background (using team color), logo, name, record
- Recent games (filtered from scores by team ID match)
- Roster table with favorite toggle per player row

---

### Player Detail (`/player/[sport]/[league]/[id]`)

**File**: `src/app/(dashboard)/player/[sport]/[league]/[id]/page.tsx` — client component.

One React Query fetch: `/api/sports/player`. Shows bio, position/physical stats, draft info, favorite button, ESPN profile link. No inline stats — links to the My Players page for in-depth stats.

---

### Headlines (`/headlines`)

**File**: `src/app/(dashboard)/headlines/page.tsx` — client component.

Sport filter tabs. Two React Query fetches: team news (favorites, when unfiltered) + general headlines. Stale time 5 min.

---

### Fantasy (`/fantasy`)

**File**: `src/app/(dashboard)/fantasy/page.tsx` — client component.

Two tabs (Fantasy Analysis, Player News) × 5 sport filters. One React Query fetch: `/api/fantasy/feed`. Fantasy articles sorted by `fantasyScore`. Stale time 5 min.

---

## Key Components

### `DashboardClient` (`src/components/dashboard/DashboardClient.tsx`)

The heaviest component (~700 lines after extraction of FocusMode/TweaksPanel). Key internal sub-components (all `memo`-wrapped):

| Component | Purpose |
|---|---|
| `Ticker` | Sticky scrolling live scores bar |
| `LiveBanner` | Carousel for user's live games |
| `SectionHead` | Draggable section header with collapse/expand |
| `GameCard` | Individual game card (live games are clickable → FocusMode) |
| `SectionGames` | Today/Yesterday tab + grid of GameCards |
| `SectionTeams` | Grid of favorite team cards |
| `PlayerStatLine` | Per-player stat fetch + inline display (used inside SectionPlayers) |
| `SectionPlayers` | Grid of favorite player cards with inline stats |
| `ArticleCard` | News article card (featured or compact) |
| `SectionHeadlines` | My Teams news + Top Headlines grid |

**Dynamically imported** (not in initial bundle):
- `FocusMode` — `src/components/dashboard/FocusMode.tsx`
- `TweaksPanel` — `src/components/dashboard/TweaksPanel.tsx`

---

### `FocusMode` (`src/components/dashboard/FocusMode.tsx`)

Full-screen overlay for a live game. Props: `liveMyGames: GameData[]`, `initialIdx: number`, `onClose: () => void`.

Polls `/api/sports/summary` every 30 seconds while game is live. Shows:
- Top bar: league/venue/broadcast info, prev/next game navigation, EXIT button
- Scoreboard: team names, records, giant scores with team-color radial gradient background
- Play-by-play: scoring plays (left column) + last 5 plays (right column)
- Golf variant: leaderboard instead of play-by-play

Keyboard shortcuts: `Escape` to close, `←`/`→` to navigate between games.

---

### `TweaksPanel` (`src/components/dashboard/TweaksPanel.tsx`)

Fixed-position settings panel (bottom-right). Props: `tweaks: TweaksState`, `set: (k, v) => void`, `sections: {id, title}[]`.

Controls:
- Theme: dark / dim / contrast (SegControl)
- Density: compact / cozy / comfy (SegControl)
- Accent: coral / cyan / lime / rose (color swatch buttons)
- Ticker on/off (ToggleControl)
- Live banner on/off (ToggleControl)
- Per-section visibility toggles

---

### `PlayersClient` (`src/components/players/PlayersClient.tsx`)

Receives `players: FavoritePlayer[]`. For each player panel, fires one `useQuery` to `/api/sports/playerstats?sport=&league=&id=`. Shows season stats grouped by category, last 5 games table, and recent news articles.

---

## API Routes

All routes under `src/app/api/`. All protected routes check `getServerSession(authOptions)` and return 401 if no session.

### `/api/auth/register` (POST)
Creates a new credentials user. Body: `{ name, email, password }`. Hashes password, inserts into `users` table. Returns 409 if email already exists.

### `/api/favorites/teams` (GET, POST, DELETE)
- GET: returns all `FavoriteTeam[]` for current user
- POST: adds a team. Body: `{ teamId, sport, league, teamName, teamLogo?, teamColor? }`
- DELETE `/api/favorites/teams/{id}`: removes by row UUID

### `/api/favorites/players` (GET, POST, DELETE)
Same pattern as teams. POST body: `{ playerId, sport, league, playerName, playerPhoto?, teamName?, position? }`

### `/api/preferences` (GET, PUT)
- GET: returns `UserPrefs` for current user (or `{}` if none)
- PUT: partial update. Body is `Partial<UserPrefs>`. Merges with existing data (top-level key replacement, not deep merge).

### `/api/sports/teams` (GET)
Query params: `sport`, `league`. Calls `getTeams()`, returns `ESPNTeam[]`.

### `/api/sports/team` (GET)
Query params: `sport`, `league`, `id`. Returns single `ESPNTeam`.

### `/api/sports/roster` (GET)
Query params: `sport`, `league`, `id` (team ID). Returns `ESPNAthlete[]`.

### `/api/sports/scores` (GET)
Query params: `sport`, `league`, `date` (YYYYMMDD). Returns `ESPNGame[]`.

### `/api/sports/headlines` (GET)
Query params: `sport?`, `league?`, `team?`, `limit?`. Calls `getNews()`. Returns `ESPNNewsArticle[]`.

### `/api/sports/summary` (GET)
Query params: `sport`, `league`, `eventId`. Returns `GameSummary` (scoring plays, recent plays, golf leaderboard).

### `/api/sports/player` (GET)
Query params: `sport`, `league`, `id`. Returns `ESPNAthlete`.

### `/api/sports/playerstats` (GET)
Query params: `sport`, `league`, `id`. Calls `getAthleteStats()`, `getAthleteEventLog()`, `getPlayerNews()` in parallel. Returns `{ stats: StatCategory[], recentGames: EventLogGame[], news: unknown[] }`. Cache-Control `s-maxage=1800`.

### `/api/fantasy/feed` (GET)
Query param: `sport?`. Aggregates ESPN RSS + news API, scores for fantasy relevance. Returns `{ fantasy: FantasyArticle[], news: FantasyArticle[] }`. Cache-Control `s-maxage=300`.

---

## State Management

### Server state (TanStack React Query)

Configured in `src/app/providers.tsx`:
```typescript
{ staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 }
```

Individual query overrides (stale times):
- Favorites: default (60s)
- Team list: 1 hour
- Headlines / fantasy: 5 minutes
- Player stats: 30 minutes

Query keys:
- `['favorites', 'teams']`
- `['favorites', 'players']`
- `['teams', sport, league]`
- `['playerStats', sport, league, playerId]`
- `['playerDetail', sport, league, playerId]`

### Client state (React `useState`)

Each page manages its own UI state. The dashboard has the most:
- `tweaks: TweaksState` — theme/accent/density/visibility settings
- `order: string[]` — section order
- `savedSnapshot: string[] | null` — last server-saved order (drives "UNSAVED" indicator)
- `dragId`, `overId` — drag-and-drop state
- `focusIdx` — which game is open in FocusMode
- `showTweaks` — whether TweaksPanel is visible
- `savedToast` — "LAYOUT SAVED" toast visibility

### Favorites (`src/hooks/useFavorites.ts`)

Four hooks: `useFavoriteTeams()`, `useToggleFavoriteTeam()`, `useFavoritePlayers()`, `useToggleFavoritePlayer()`. All mutations invalidate the relevant query cache on success so the UI updates immediately.

---

## User Preferences Persistence

Preferences are saved to the `user_preferences` DB table and loaded server-side at page request time (zero client-side flash).

### Dashboard

| Preference | When saved | How |
|---|---|---|
| `dashboardTweaks` | Auto, debounced 1s after any tweak change | `PUT /api/preferences` |
| `dashboardOrder` | On "SAVE LAYOUT" button click | `PUT /api/preferences` |

localStorage (`ms_v3_layout_v1`, `ms_v3_tweaks_v1`) is written synchronously on every change as a cache. On mount, if no server prefs exist yet, localStorage values are used as fallback.

### Scoreboard

| Preference | When saved | How |
|---|---|---|
| `scoreboardOrder` | On every drag/move | `PUT /api/preferences` |
| `scoreboardCollapsed` | On every collapse toggle | `PUT /api/preferences` |

localStorage (`ms_scoreboard_v1`) is written on every change as cache.

---

## Theme System

**Defined in**: `src/components/dashboard/DashboardClient.tsx`

Three dimensions: theme (dark/dim/contrast), accent (coral/cyan/lime/rose), density (compact/cozy/comfy).

All three are collapsed into 14 CSS custom properties via `buildCSSVars()` and applied to the root `<div>` as a single `style` object. The CSS var object is `useMemo`'d so it only recomputes when theme/accent/density actually changes.

### CSS variable names

| Variable | Meaning |
|---|---|
| `--ms-bg` | Page background |
| `--ms-surface` | Card/panel background |
| `--ms-surface2` | Nested surface, skeleton bg |
| `--ms-ink` | Primary text |
| `--ms-muted` | Secondary/dim text |
| `--ms-border` | Border color |
| `--ms-a` | Primary accent (e.g. coral red `#FF5A4D`) |
| `--ms-b` | Secondary accent (e.g. gold `#FFD166`) |
| `--ms-a12` | Accent-a with 12 hex alpha (~7% opacity) |
| `--ms-a30` | Accent-a with 30 hex alpha (~19%) |
| `--ms-a40` | Accent-a with 40 hex alpha (~25%) |
| `--ms-b15` | Accent-b with 15 hex alpha (~8%) |
| `--ms-b30` | Accent-b with 30 hex alpha (~19%) |
| `--ms-gap` | Card grid gap (px) |
| `--ms-sgap` | Section gap (px) |
| `--ms-pad` | Card padding (px) |
| `--ms-font` | Base font size (px) |

All sub-components use `var(--ms-*)` directly in inline styles — no T/A/DEN prop drilling. FocusMode and TweaksPanel inherit these via CSS cascade from the root div (even though FocusMode uses `position: fixed`).

### Default theme values (dark/coral/cozy)

```
--ms-bg: #0B1020        --ms-a: #FF5A4D
--ms-surface: #121A30   --ms-b: #FFD166
--ms-surface2: #1A2440
--ms-ink: #F0F4FF
--ms-muted: #8392B5
--ms-border: rgba(255,255,255,0.07)
--ms-gap: 10px  --ms-sgap: 28px  --ms-pad: 14px  --ms-font: 12px
```

---

## Type System

**File**: `src/types/index.ts`

### ESPN types (match API response shapes)

- `ESPNTeam` — team identity, color, logos, record
- `ESPNAthlete` — player bio, position, physical stats, draft, college, status
- `ESPNGame` — game wrapper with competitions array
- `ESPNCompetition` — competitors, venue, broadcasts, status
- `ESPNGameStatus` — clock, period, state (`pre`/`in`/`post`)
- `ESPNCompetitor` — team ref + score + winner flag
- `ESPNNewsArticle` — headline, description, links, images, categories, timestamps
- `ESPNLogo` — href, dimensions, alt, rel
- `ESPNRosterEntry` — flexible union of flat `items[]` or grouped `athletes[].items[]`

### App types

- `FavoriteTeam` — DB row shape (mirrors `favorite_teams` table)
- `FavoritePlayer` — DB row shape (mirrors `favorite_players` table)
- `SPORT_CONFIGS` — constant array of `{ key, sport, league, name, color }` for all 8 leagues
- `SportKey` — union type of all 8 sport config keys

### Dashboard-specific types (in DashboardClient.tsx)

- `GameData` — transformed game shape passed from server to client
- `GameTeam` — team side of a game (includes `mine` and `winning` booleans)
- `TweaksState` — full tweaks object (`theme`, `density`, `accent`, booleans, `visible`, `collapsed`)

### NextAuth augmentations (in `src/types/index.ts`)

```typescript
declare module 'next-auth' {
  interface Session { user: { id: string } }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string }
}
```

---

## Patterns & Conventions

### Server component + client component split

Every page under `(dashboard)` follows this pattern:
- `page.tsx` is a server component: fetches DB + ESPN data, transforms to serializable props, passes to a `*Client.tsx`.
- `*Client.tsx` has `'use client'` at top, handles all interactivity, uses passed data as initial state.

Exception: `/teams`, `/team/...`, `/player/...`, `/headlines`, `/fantasy` are fully client components because they don't have useful server-side data (they rely on React Query for data fetching).

### Inline styles vs Tailwind

Dashboard and scoreboard components use inline styles exclusively (for CSS variable support and dynamic values). Layout components (Navbar, Sidebar) use Tailwind. Auth pages use Tailwind. There is no mixing within a single component.

### ESPN image handling

All `<Image>` components for ESPN assets use `unoptimized` prop:
```tsx
<Image src={espnUrl} alt={name} width={40} height={40} unoptimized />
```
ESPN CDN URLs are already optimized; Next.js optimization would re-process them unnecessarily.

### Error handling

- ESPN API calls: all wrapped in `try/catch`, return empty array/null on failure.
- API routes: explicit error responses with status codes; uncaught errors propagate as 500.
- Client components: show empty state UI (dashed border box) when data is empty.
- No global error boundary — component-level empty states.

### ID generation

All DB rows use `uuid()` from the `uuid` package for primary keys.

### Composite team key

To prevent cross-sport teamId collisions (e.g. NFL Seahawks and MLB Giants can both have ESPN id `26`), favorite teams are looked up using a composite key `{teamId}:{league}` (e.g. `26:nfl`). This is used when enriching game data with `mine: true` flags.

---

## How To: Common Tasks

### Add a new sport/league

1. Add entry to `ALL_LEAGUES` in `src/lib/api/espn.ts`:
   ```typescript
   { sport: 'tennis', league: 'atp', name: 'ATP Tour', key: 'atp' }
   ```
2. Add matching entry to `SPORT_CONFIGS` in `src/types/index.ts`:
   ```typescript
   { key: 'atp', sport: 'tennis', league: 'atp', name: 'ATP Tour', color: '#00A550' }
   ```
3. Add to the `LEAGUES` arrays in `dashboard/page.tsx` and `scoreboard/page.tsx`.
4. If the sport needs special handling (like golf), add a branch in the scoreboard page's transform logic.

### Add a new protected page

1. Create `src/app/(dashboard)/newpage/page.tsx`.
2. Add to sidebar nav in `src/components/layout/Sidebar.tsx` (`NAV_ITEMS` array).
3. If the route needs auth protection, add the path to `src/proxy.ts`.

### Add a new database table

1. Add table definition to `src/lib/db/schema.ts` using `sqliteTable()`.
2. Add `CREATE TABLE IF NOT EXISTS` SQL to `scripts/init-db.mjs`.
3. Run `npm run db:push` (Node 16+) to apply.

### Add a new ESPN API function

1. Add function to `src/lib/api/espn.ts`.
2. Use `espnFetch(url, revalidateSeconds)` for SITE API or `coreApiFetch(url)` for CORE API.
3. Add a corresponding `/api/sports/...` route if client-side code needs to call it (API routes proxy ESPN calls to avoid CORS and to use server-side caching).

### Change what player stats are shown

Stats filtering is in `getAthleteStats()` in `src/lib/api/espn.ts`. Currently filters to `name.startsWith('avg') && !name.startsWith('avg48')`. To show raw totals instead, remove the filter. To show specific named stats, filter by `s.name` values like `avgPoints`, `avgRebounds`, `avgAssists`.

### Adjust how section order / tweaks are saved

The save logic is in `DashboardClient.tsx`:
- Tweaks: `useEffect` watching `tweaks` state, debounced 1s `PUT /api/preferences`
- Order: `saveLayout()` callback, fires immediately on button click

The `UserPrefs` type lives in `src/lib/db/preferences.ts` — add new fields there to persist new settings.
