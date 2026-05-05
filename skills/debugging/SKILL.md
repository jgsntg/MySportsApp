---
name: debugging
description: Systematic approach to diagnosing and fixing bugs in MySports — ESPN API failures, DB issues, render errors, and type errors.
---

# Skill: Debugging

## When to Use

- A page shows no data or an empty state unexpectedly
- An ESPN API call returns 404 or malformed data
- TypeScript compilation fails
- A React component renders incorrectly or throws
- A DB operation silently fails
- Auth redirects behave unexpectedly

---

## Steps

### 1. Narrow the layer

Determine where the failure lives:

| Symptom | Likely layer |
|---|---|
| Empty data on server-rendered page | ESPN fetch or DB query in `page.tsx` |
| Empty data on client-only page | React Query fetch or API route |
| Visual/layout bug | Client component or CSS vars |
| Auth loop / 401 | `src/proxy.ts` or API route session check |
| TypeScript error | Type mismatch in `src/types/index.ts` or a response shape assumption |

### 2. Inspect the data source

For ESPN issues, use `/espn-debug` to fetch the endpoint directly:

```
/espn-debug <sport> <league> <entity>
```

Compare the live response shape to what `src/lib/api/espn.ts` expects. Common mismatches:
- `competitions[0].competitors` may be empty for future games
- Player stats use the CORE URL, not SITE — `CORE/<sport>/leagues/<league>/athletes/<id>/statistics/0`
- Event logs return `$ref` pointers that need a second fetch

### 3. Check the API route

For client-side data failures, check the API route in `src/app/api/sports/`:
- Is the session check returning 401?
- Are query params being read correctly from `req.nextUrl.searchParams`?
- Is the ESPN helper function throwing silently?

Add a temporary `console.error` in the catch block to confirm.

### 4. Check DB

For preferences or favorites issues:
- Confirm rows exist: inspect `mysports.db` with `sqlite3 mysports.db "SELECT * FROM <table>"`
- Verify the Drizzle query uses correct column names from `src/lib/db/schema.ts`
- Check `getPreferences` / `savePreferences` in `src/lib/db/preferences.ts`

### 5. Type errors

Run `npx tsc --noEmit` and read the full error message:
- Check if an ESPN response field is `string | undefined` but used as `string`
- Check `src/types/index.ts` to see if the type matches the actual API response
- Check if `ALL_LEAGUES` and `SPORT_CONFIGS` are both updated when a new league was added

---

## Examples

```
# ESPN endpoint returning 404
/espn-debug nfl player 3139477 stats
→ Reveals player stats require CORE URL, not SITE URL

# Page showing empty games
→ Check dashboard/page.tsx — ESPNGame[] may be empty if no games today
→ Check the date string passed to getScoreboard() — should be YYYYMMDD

# TypeScript error on ESPNAthlete
→ Add missing optional fields to ESPNAthlete in src/types/index.ts
```

---

## Success Criteria

- Root cause is identified (not just symptom patched)
- Fix is in the correct layer (API function, type, component, or route)
- `npx tsc --noEmit` passes
- Dev server shows correct data after fix
