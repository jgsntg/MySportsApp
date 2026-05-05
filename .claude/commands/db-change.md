Make a database schema change in the MySports app (add table, column, or index).

**Usage:** `/db-change <description of change>`

**Examples:**
- `/db-change add a notifications table with user_id, message, read flag, and created_at`
- `/db-change add a sport column to favorite_teams`
- `/db-change add an index on favorite_players(user_id)`

## What this command does

This app uses Drizzle ORM on libsql/Turso. The schema is in `src/lib/db/schema.ts`. Migrations are applied via `scripts/init-db.mjs` (raw `CREATE TABLE IF NOT EXISTS` SQL), NOT via Drizzle's migration runner. `drizzle-kit generate` is wired up but migrations aren't auto-applied.

## Steps

1. **Update `src/lib/db/schema.ts`** — add/modify the Drizzle table definition using `sqliteTable`, `text`, `integer`, `real`, etc.

2. **Update `scripts/init-db.mjs`** — add the corresponding `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE` SQL statement. For new columns on existing tables, use `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` (SQLite requires a default for new NOT NULL columns added to existing tables).

3. **Add DB helper functions** (if needed) — follow the pattern in `src/lib/db/preferences.ts`: plain async functions that accept `userId` and return typed objects.

4. **Run `npm run db:push`** to apply the schema to the local DB.

5. **Verify** — run `npx tsc --noEmit` to confirm the new Drizzle types compile without errors.

6. **If adding a new table that stores user data**, check whether a corresponding API route is needed under `src/app/api/` and whether `src/proxy.ts` needs to protect it.

## Notes

- The DB client is a global singleton in `src/lib/db/index.ts` — no need to import the raw client in new helper files, just import from `@/lib/db`
- The four existing tables are: `users`, `favorite_teams`, `favorite_players`, `user_preferences`
- Use `integer('created_at', { mode: 'timestamp' })` for timestamps (stored as Unix ms)
- Turso cloud DB is used in production; local `mysports.db` in dev. Schema must work for both (standard SQLite syntax)
- `drizzle-kit generate` output goes to `drizzle/` — useful for reviewing the migration SQL, but the file isn't auto-run
