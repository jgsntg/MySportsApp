# MySports Agent Instructions

You are assisting with MySports, a full-stack sports data platform built with Next.js 16, React 18, TanStack Query, Tailwind CSS, and Drizzle ORM.

## Tech Stack

- **Frontend**: React 18 (TSX), Tailwind CSS with dark theme, shadcn-style components (CVA)
- **Backend**: Next.js App Router, API routes, NextAuth v4 for auth
- **Data**: Drizzle ORM with libsql, TanStack Query for client-side caching
- **External**: ESPN API (via proxy)

## Code Style

- **TypeScript**: Strict mode enabled. Use explicit types; infer minimal.
- **Components**: Functional, use `forwardRef` for compound/ui components. Export component and props interface together.
- **Styling**: Tailwind classes with CVA for variants. Use `cn()` to merge classes. Prefer composition over utility sprawl.
- **No comments** unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- **Naming**: descriptive identifiers replace comments. `handleUserSubmit` > `handleClick`.

## Project Structure

- `src/app/` — Next.js pages and layouts (App Router)
- `src/app/api/` — API routes (ESPN proxy, auth, database)
- `src/components/` — React components (ui/, dashboard/, layout/, etc.)
- `src/lib/` — Utilities (db/, auth, API client, utils)
- `src/hooks/` — Custom React hooks
- `src/types/` — Shared type definitions

## Common Patterns

**API Routes**: Validate input at boundary, delegate to lib functions. Use typed responses.

**Components**: Use React Query `useQuery` for data fetching. Pass `isLoading`, `error` through props; let UI handle states.

**Forms**: Use native form APIs; handle auth errors gracefully.

**Database**: Use Drizzle schema from `src/lib/db/schema`. Migrations via `db:push`.

## Before You Start

- Check git log to understand recent work and conventions
- Review similar components/pages if adding similar functionality
- Test dark theme compatibility (app uses dark mode by default)
- No half-finished implementations or placeholder code in commits
