# Testing Philosophy

MySports has no automated test suite. This is a deliberate tradeoff for a personal project. These guidelines explain how correctness is verified instead.

---

## How We Verify Correctness

### TypeScript as a test layer

`npx tsc --noEmit` is required after every TypeScript change. This catches:
- Type mismatches between ESPN API responses and our type definitions
- Missing fields when `SPORT_CONFIGS` or `ALL_LEAGUES` entries are incomplete
- Incorrect prop types between server and client components
- Drizzle query errors caught at compile time

Run it before reporting any task complete.

### ESPN endpoint verification

Before writing integration code for a new endpoint, fetch it:
```
/espn-debug <sport> <league> <entity>
```
This confirms the endpoint exists, the data shape matches expectations, and any `$ref` pointers are identified. This prevents writing code against an assumed response that doesn't match reality.

### Manual browser testing

For every UI change:
1. Start dev server: `npm run dev`
2. Navigate to the affected page
3. Verify the golden path (normal case with data)
4. Verify the empty state (no games today, no favorites, no data)
5. Verify dark theme renders correctly
6. Check that previously working features on the same page aren't broken

### DB verification

After `npm run db:push`:
```bash
sqlite3 mysports.db ".schema"     # Confirm table structure
sqlite3 mysports.db "SELECT * FROM <table> LIMIT 3"  # Confirm data survived
```

---

## What We Do NOT Do

- No unit tests for utility functions (they're simple enough to verify by inspection)
- No mock ESPN responses (mocks drift from reality; `/espn-debug` is better)
- No Playwright/Cypress E2E (overhead not justified for a personal project)
- No coverage metrics

---

## When Something Breaks in Production

1. Check if `npm run build` passes (catches some runtime issues TypeScript misses)
2. Check Vercel function logs for ESPN 404s or ESPN rate limiting
3. Use `/espn-debug` to verify the live ESPN endpoint is still returning the expected shape
4. ESPN occasionally changes response field names without notice — check `src/types/index.ts`
