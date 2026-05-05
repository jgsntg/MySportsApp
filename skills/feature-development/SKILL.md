---
name: feature-development
description: Workflow for adding features to MySports — new pages, new leagues, new DB tables, and new ESPN integrations.
---

# Skill: Feature Development

## When to Use

- Adding a new dashboard page or route
- Integrating a new ESPN sport or league
- Adding a new DB table or column
- Adding a new API route or ESPN helper function
- Extending user preferences with new settings

---

## Steps

### Path A: New Page (`/new-page` command)

Use for: standings, notifications feed, or any new `(dashboard)` route.

```
/new-page <route-name> <description>
```

What happens:
1. `src/app/(dashboard)/<route-name>/page.tsx` — Server Component (fetches data, passes props)
2. `src/components/<route-name>/<RouteName>Client.tsx` — Client Component (`'use client'`)
3. `src/app/(dashboard)/<route-name>/loading.tsx` — Skeleton
4. Navigation link added to `src/components/layout/Sidebar.tsx`

Key rules:
- All ESPN calls go in `src/lib/api/espn.ts` as a new exported function
- Page-level session check: `getServerSession(authOptions)`
- ISR caching: `fetch(url, { next: { revalidate: N } })`
- If route needs client-side refresh, add an API proxy at `src/app/api/<route-name>/route.ts`

### Path B: New League (`/add-league` command)

Use for: adding WNBA, Bundesliga, ATP, etc.

```
/add-league <sport> <espn-league-id> <display-name> <key> <hex-color>
```

Always verify the endpoint first:
```
/espn-debug <sport> <league> scoreboard
```

Two files must stay in sync:
- `src/lib/api/espn.ts` → `ALL_LEAGUES`
- `src/types/index.ts` → `SPORT_CONFIGS`

### Path C: DB Schema Change (`/db-change` command)

Use for: new tables, new columns, new indexes.

```
/db-change <description>
```

Three things always happen together:
1. `src/lib/db/schema.ts` — Drizzle table definition updated
2. `scripts/init-db.mjs` — raw SQL updated
3. `npm run db:push` — applied to local DB

For new columns on existing tables, use `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` (SQLite requires a default for NOT NULL columns on existing tables).

### Path D: New ESPN Integration

Use for: adding a new helper function to `src/lib/api/espn.ts`.

1. Run `/espn-debug` to inspect the endpoint response shape
2. Add types for new response fields to `src/types/index.ts`
3. Add exported function to `src/lib/api/espn.ts` using `espnFetch()` (SITE) or `coreApiFetch()` (CORE)
4. If needed from the client, add a proxy at `src/app/api/sports/<name>/route.ts`

### Path E: New User Preference

Use for: new dashboard setting, toggle, or layout option.

1. Add field to `UserPrefs` interface in `src/lib/db/preferences.ts`
2. Add control in `TweaksPanel` (`src/components/dashboard/TweaksPanel.tsx`)
3. Add state in `DashboardClient.tsx` and wire to `buildCSSVars()` or section logic
4. Auto-save via the existing debounced `PUT /api/preferences` effect

---

## Examples

```
/add-league basketball wnba "WNBA" wnba #FF6B35
/new-page standings "League standings tables with win/loss records"
/db-change add a notifications table with user_id, message, read flag, and created_at
```

---

## Success Criteria

- `npx tsc --noEmit` passes
- Dev server shows the new feature at the expected route
- Dark theme renders correctly (no hardcoded colors)
- If adding a league: it appears in dashboard, scoreboard, and teams pages
- If adding a DB table: `npm run db:push` ran without errors
