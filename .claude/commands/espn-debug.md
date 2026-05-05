Explore and debug ESPN API endpoints for a given sport, league, team, or player.

**Usage:** `/espn-debug <what-to-explore>`

**Examples:**
- `/espn-debug wnba scoreboard`
- `/espn-debug nfl player 3139477 stats`
- `/espn-debug soccer bundesliga teams`
- `/espn-debug mlb game summary 401472485`

## What this command does

Fetches ESPN API endpoints and pretty-prints the relevant parts of the response so you can understand the data shape before writing code. Covers both ESPN base URLs used by this app.

## Base URLs

```
SITE:  https://site.api.espn.com/apis/site/v2/sports
CORE:  https://sports.core.api.espn.com/v2/sports
```

## Common endpoint patterns

| What | URL pattern |
|------|-------------|
| Scoreboard | `SITE/<sport>/<league>/scoreboard` |
| Teams list | `SITE/<sport>/<league>/teams` |
| Team detail | `SITE/<sport>/<league>/teams/<id>` |
| News/headlines | `SITE/<sport>/<league>/news` |
| Roster | `SITE/<sport>/<league>/teams/<id>/roster` |
| Player profile | `SITE/<sport>/<league>/athletes/<id>` |
| Game summary | `SITE/<sport>/<league>/summary?event=<gameId>` |
| Player stats | `CORE/<sport>/<league>/athletes/<id>/statistics/0` |
| Event log | `CORE/<sport>/<league>/athletes/<id>/eventlog` |

## Steps

1. **Parse the request** — identify sport, league, entity type, and any IDs from the user's description.
2. **Construct the URL(s)** — use the patterns above.
3. **Fetch and inspect** — call the endpoint(s). If a response contains `$ref` pointers, resolve up to 3 of them.
4. **Report the shape** — show: HTTP status, top-level keys, a few representative records (not the full dump), and any pagination info (`count`, `pageCount`, `pageSize`).
5. **Map to existing code** — note which existing function in `src/lib/api/espn.ts` already covers this data (if any), or suggest what a new helper function would look like.

## Notes

- If the endpoint 404s, try the other base URL (SITE vs CORE)
- Player stats require the CORE URL — the SITE URL returns 404 for athlete statistics
- Event logs return `$ref` pointers that must be resolved in a second fetch
- `?limit=25` can be appended to most list endpoints to control page size
