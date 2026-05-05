Scaffold a new dashboard page following the MySports server component + client component pattern.

**Usage:** `/new-page <route-name> <description>`

**Example:** `/new-page standings "League standings tables with win/loss records"`

## What this command does

Every page under `src/app/(dashboard)/` follows the same pattern: a **Server Component** page file that fetches data (ESPN API or DB), then passes it as props to a `*Client.tsx` component for interactivity. This command scaffolds both files plus a loading skeleton, wired correctly.

## Steps

1. **Create the route directory**: `src/app/(dashboard)/<route-name>/`

2. **Create `page.tsx`** (Server Component):
   - Import the relevant ESPN helper from `src/lib/api/espn.ts` or call DB helpers
   - Get the session with `getServerSession(authOptions)` if user data is needed
   - Fetch data (use `next: { revalidate: N }` for ISR caching)
   - Pass data as typed props to `<RouteNameClient />`

3. **Create `src/components/<route-name>/<RouteNameClient>.tsx`** (Client Component):
   - `'use client'` at the top
   - Accept typed props from the server component
   - Handle all interactivity, state, and UI rendering here
   - Read CSS vars (`var(--ms-*)`) for theming — never hardcode colors

4. **Create `loading.tsx`** using the `<Skeleton>` component from `src/components/ui/skeleton.tsx`:
   - Match the rough layout of the page (e.g. a grid of skeleton cards)

5. **Wire up navigation** — check `src/components/layout/Sidebar.tsx` and `src/components/layout/Navbar.tsx` and add a link to the new route if appropriate.

6. **If the new page needs an API route** (for client-side fetching), scaffold it at `src/app/api/<route-name>/route.ts` following the existing pattern in `src/app/api/sports/`.

## Notes

- Server components can `import { getServerSession } from 'next-auth'` and `import { authOptions } from '@/lib/auth'`
- All ESPN fetches belong in `src/lib/api/espn.ts` — add a new exported function there rather than fetching inline in the page
- Protected route middleware in `src/proxy.ts` covers all `/dashboard/*` paths — new routes under `(dashboard)/` are automatically protected
- Use `unoptimized` on all ESPN `<Image>` components (CDN assets are pre-optimized)
