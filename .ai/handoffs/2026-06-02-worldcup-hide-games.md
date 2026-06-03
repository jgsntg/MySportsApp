# Handoff: World Cup league + hide individual games from Key Games

**From:** Claude Code  
**To:** next session  
**Date:** 2026-06-02  
**Branch:** `main`  
**Last commit:** `09c141a Fix Display in mobile`

---

## Goal

Two independent features shipped in this session:
1. Users can hide individual game cards from the dashboard "Key Games" section and re-enable them from the Scoreboard page.
2. FIFA World Cup 2026 is a first-class league in the app — scoreboard section, Key Games on the dashboard, Browse Teams tab, and Soccer headlines all include it.

## Status

- [x] `hiddenGames: string[]` added to `UserPrefs` in `preferences.ts`
- [x] Hide button (EyeOff icon) appears on hover on each GameCard in the dashboard
- [x] Hidden games filtered out of the Key Games grid; hidden count shown with a link to Scoreboard
- [x] Scoreboard shows hidden-game chips at the bottom of each league section with one-click re-enable
- [x] `unhideGame` persists to `/api/preferences` immediately (no debounce)
- [x] FIFA World Cup (`soccer` / `fifa.world`) added to `SPORT_CONFIGS`, `ALL_NEWS_LEAGUES`, both `LEAGUES` arrays (dashboard + scoreboard)
- [x] `getNews(sport)` now fetches from **all** leagues for that sport in parallel — Soccer tab in Headlines returns MLS + La Liga + EPL + World Cup merged and sorted by date
- [x] TypeScript passes clean (`npx tsc --noEmit` — zero errors)
- [ ] Not manually browser-tested (dev server not started this session)

## Files touched this session

- `src/lib/db/preferences.ts` — Added `hiddenGames?: string[]` to `UserPrefs`
- `src/types/index.ts` — Added `worldcup` entry to `SPORT_CONFIGS` (`key: 'worldcup'`, `league: 'fifa.world'`, color `#326295`)
- `src/lib/api/espn.ts` — Added `fifa.world` to `ALL_NEWS_LEAGUES`; rewrote `getNews(sport)` to fetch from all leagues of that sport (not just one primary league)
- `src/app/(dashboard)/dashboard/page.tsx` — Added World Cup to `LEAGUES` array (fetches scoreboard for today / yesterday / tomorrow)
- `src/app/(dashboard)/scoreboard/page.tsx` — Added World Cup to `LEAGUES`; `transformGame` now populates `label: "AWY vs HME"` for hidden chips
- `src/components/dashboard/DashboardClient.tsx` — `GameCard` gets hover-revealed EyeOff hide button; `SectionGames` filters hidden IDs and shows hidden count; `hiddenGames` state + `onHideGame` callback wired through; saves to `/api/preferences`
- `src/components/scoreboard/ScoreboardClient.tsx` — Added `hiddenGames` state from `savedPrefs`; each section renders hidden-game chips below the grid; `unhideGame` callback saves to `/api/preferences`

## Key decisions made

- **Store hidden games by ESPN event ID only** (flat `string[]`, not `"leagueKey:gameId"`) — ESPN event IDs are globally unique integers, no collision risk across leagues.
- **Re-enable only from Scoreboard, not from Dashboard** — user explicitly requested this flow. Dashboard shows a "X HIDDEN · RE-ENABLE ON SCOREBOARD" link instead of chips.
- **`getNews(sport)` multi-league** — rather than a new `SPORT_PRIMARY_LEAGUE['soccer']` entry, the function now groups `ALL_NEWS_LEAGUES` by sport and fetches them all. This keeps Soccer headlines comprehensive and is the right general pattern. Sports with only one league (NFL, NBA, etc.) are unaffected.
- **World Cup color `#326295`** — FIFA blue, matches the official tournament branding.
- **`label` field on `ScoreGame`** — added to carry "AWY vs HME" string for the hidden chip display; generated server-side in `transformGame` so the client has it without extra computation.

## Gotchas

- The `SPORT_PRIMARY_LEAGUE` map in `espn.ts` no longer includes `soccer` — it is now only a fallback for sports not in `ALL_NEWS_LEAGUES`. If a new sport is added that has multiple leagues in the future, add it to `ALL_NEWS_LEAGUES` rather than `SPORT_PRIMARY_LEAGUE`.
- Hidden games are stored per-user in the DB (`user_preferences.prefs` JSON blob). They are **not** date-scoped — if a user hides a game, its ID stays in `hiddenGames` indefinitely. Stale IDs are harmless (filter just won't match anything), but consider a periodic cleanup if the array grows large.
- The dashboard `GameCard` hover state is tracked with `useState(false)` — the hide button is only visible while the card is hovered. On touch devices the button won't be reachable. If mobile support is needed, a permanent small icon or long-press would be required.

## Next steps

1. Start dev server (`npm run dev`) and do a quick browser smoke-test: verify World Cup section appears on Scoreboard, hide a game from Key Games, confirm it appears as a chip on Scoreboard, click chip and confirm it returns to Key Games.
2. Check Browse Teams — confirm "FIFA World Cup" tab appears and loads 48 national teams.
3. Check Headlines → Soccer tab — confirm World Cup articles appear alongside MLS / EPL / La Liga.
4. Consider whether `hiddenGames` should be scoped by date (clear IDs older than ~7 days) to keep the stored array tidy over a full season.
5. Commit when satisfied: all 7 files, single commit.

## Open questions

- Should the hide button be visible on touch/mobile, or is the scoreboard re-enable path sufficient for those users?
- Should hiding a game also remove it from the live ticker and live banner, or only from the Key Games grid? Currently it only affects the grid.
- Do we want a "World Cup" filter tab in the Headlines page alongside "Soccer", or is inclusion in the Soccer tab sufficient?

## Context the next agent needs

- Prior handoff: `.ai/handoffs/` directory — check `CURRENT.md` for the previous session context.
- ESPN World Cup endpoint verified live: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard` returns events; teams endpoint returns 48 teams.
- Architecture docs: `docs/architecture.md` (full reference) and `AGENTS.md` (coding rules).
