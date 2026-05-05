# Coding Principles

These rules apply to all code in MySports. They exist because violations have created real bugs or maintenance burden.

---

## Correctness over cleverness

Write the most direct, readable implementation. If a one-liner and a four-liner are equally correct, use the one-liner. If a four-liner is safer (null check, error handling), use it.

## Smallest correct change

Fix the bug. Don't refactor the surrounding code. Don't add features adjacent to the task. Don't "improve" things that aren't broken. Focused diffs are easier to review and easier to revert.

## No defensive code for impossible scenarios

If a value is always set by the time a function runs (e.g., session user ID in a protected route), don't add a null check. Unnecessary guards create noise and obscure real errors. Trust the framework — Next.js middleware, NextAuth, Drizzle's types.

## Validate at system boundaries only

Validate user input (form fields, query params, request bodies) at the API route layer. Don't re-validate data that's already been validated or that comes from the database.

## Error handling at the right level

ESPN fetch errors belong in `src/lib/api/espn.ts` — catch, log `console.error`, return `null`/`[]`. API route errors belong in the route handler. Component errors show empty state. Don't catch errors you can't handle meaningfully.

## Data fetching belongs in the right layer

- Server-rendered pages: fetch in `page.tsx`, pass as props
- Client-side dynamic data: fetch via React Query in `*Client.tsx` through an API route
- Never fetch ESPN directly from a client component (CORS, no caching, no ISR)

## State lives as high as it needs to, no higher

Don't lift state above the component that owns it. Dashboard section order belongs in `DashboardClient` — not in a global store. Favorites belong in TanStack Query — shared across components via cache.

## No premature abstraction

Three similar lines is better than a premature abstraction. Extract a helper when there are four or more genuine call sites, not before. ESPN fetch helpers in `espn.ts` are examples of correct abstraction — they're called from multiple routes and pages.
