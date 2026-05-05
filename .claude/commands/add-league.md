Add a new ESPN league/sport to the MySports app.

**Usage:** `/add-league <sport> <espn-league-id> <display-name> <key> <hex-color>`

**Example:** `/add-league basketball wnba WNBA wnba #FF6B35`

## What this command does

This command keeps `ALL_LEAGUES` (in `src/lib/api/espn.ts`) and `SPORT_CONFIGS` (in `src/types/index.ts`) in sync — CLAUDE.md explicitly warns these must always be updated together.

## Steps

1. **Validate the ESPN endpoint** — confirm the league exists by fetching:
   - `https://site.api.espn.com/apis/site/v2/sports/<sport>/<league>/scoreboard`
   - If it 404s, stop and report the issue.

2. **Update `src/lib/api/espn.ts`** — append to `ALL_LEAGUES`:
   ```ts
   { sport: '<sport>', league: '<espn-league-id>', name: '<display-name>', key: '<key>' },
   ```

3. **Update `src/types/index.ts`** — append to `SPORT_CONFIGS`:
   ```ts
   { key: '<key>', sport: '<sport>', league: '<espn-league-id>', name: '<display-name>', color: '<hex-color>' },
   ```

4. **Verify TypeScript** — run `npx tsc --noEmit` to confirm `SportKey` and related union types still compile.

5. **Report** — show the two diffs and confirm the league is now visible everywhere the existing leagues appear (scoreboard, teams, dashboard).

## Notes

- The `key` field is the short UI identifier (e.g. `nfl`, `mls`) — keep it lowercase, no spaces.
- `sport` is the ESPN path param: `football`, `basketball`, `baseball`, `hockey`, `soccer`, `golf`, `tennis`, etc.
- `espn-league-id` is the ESPN path param: `nfl`, `nba`, `usa.1`, `esp.1`, `eng.1`, `pga`, etc.
- Soccer leagues follow the pattern `<country-code>.<division-number>` (e.g. `ger.1` for Bundesliga).
- The `color` is used for league accent in the UI — pick the league's primary brand color.
