# Naming Conventions

Consistent naming makes the codebase navigable. These conventions are derived from what already exists.

---

## Files and Directories

| Pattern | Convention | Example |
|---|---|---|
| Page file | `page.tsx` (Next.js convention) | `src/app/(dashboard)/dashboard/page.tsx` |
| Client component | `<FeatureName>Client.tsx` | `DashboardClient.tsx`, `ScoreboardClient.tsx` |
| Loading skeleton | `loading.tsx` (Next.js convention) | `src/app/(dashboard)/dashboard/loading.tsx` |
| API route | `route.ts` (Next.js convention) | `src/app/api/favorites/teams/route.ts` |
| Hooks | `use<Name>.ts` | `useFavorites.ts` |
| DB helpers | descriptive noun | `preferences.ts`, `schema.ts` |

## TypeScript

| Pattern | Convention | Example |
|---|---|---|
| Interfaces | PascalCase, `I` prefix never used | `GameData`, `FavoriteTeam` |
| ESPN response types | `ESPN` prefix | `ESPNTeam`, `ESPNAthlete`, `ESPNGame` |
| Union types from constant arrays | from the array values | `SportKey` derived from `SPORT_CONFIGS` |
| Constants | `SCREAMING_SNAKE_CASE` | `ALL_LEAGUES`, `SPORT_CONFIGS` |
| React component props interface | `<Component>Props` | `GameCardProps` |
| Event handlers | `handle<Action>` | `handleSubmit`, `handleDragEnd` |
| Boolean props/state | `is<State>` or `show<Thing>` | `isLoading`, `showTweaks` |

## CSS Variables

All MySports theme variables use the `--ms-` prefix:
- `--ms-bg` — page background
- `--ms-surface` — card background  
- `--ms-a` — primary accent
- `--ms-ink` — primary text
- `--ms-muted` — secondary text
- `--ms-border` — border color

## React Query Keys

Cache keys use arrays with descriptive string first-elements:
- `['favorites', 'teams']`
- `['favorites', 'players']`
- `['teams', sport, league]`
- `['playerStats', sport, league, playerId]`

## ESPN Sport/League Identifiers

The `key` field is the short UI identifier: `nfl`, `nba`, `mls`, `pga`.
The `sport` field is the ESPN path segment: `football`, `basketball`, `soccer`, `golf`.
The `league` field is the ESPN path segment: `nfl`, `nba`, `usa.1`, `pga`.

Never use league keys as ESPN path segments without checking `SPORT_CONFIGS` for the right `sport` + `league` combination.
