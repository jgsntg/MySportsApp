---
name: refactoring
description: How to safely refactor MySports code — component extraction, type consolidation, API function cleanup — without changing behavior.
---

# Skill: Refactoring

## When to Use

- A component file has grown too large and has extractable sub-components
- Duplicate ESPN fetch logic exists across multiple files
- A type in `src/types/index.ts` is stale or inaccurate relative to ESPN's actual response
- An API route is doing ESPN fetching instead of delegating to `src/lib/api/espn.ts`
- Inline ESPN URLs exist outside of `espn.ts`

---

## Steps

### 1. Define the boundary

Before touching anything, write down:
- **What changes**: list the specific files and functions being restructured
- **What does not change**: user-visible behavior, component props, API response shapes

Refactors that change observable behavior are feature work, not refactoring.

### 2. Component extraction (from `DashboardClient.tsx` or similar large files)

`DashboardClient.tsx` has internally-defined sub-components (all `memo`-wrapped):
`Ticker`, `LiveBanner`, `SectionHead`, `GameCard`, `SectionGames`, `SectionTeams`, `SectionPlayers`, `SectionHeadlines`, `ArticleCard`, `PlayerStatLine`

When extracting:
- Keep extracted component in the same file if it's only used there (co-location)
- Move to `src/components/<feature>/` only if used by multiple parent components
- Props interface must be explicit and typed
- CSS vars (`var(--ms-*)`) still work after extraction (inherited via CSS cascade)
- `memo()` wrap is appropriate for sub-components that receive stable primitive props

### 3. ESPN function consolidation

If ESPN fetch logic exists outside `src/lib/api/espn.ts`:
1. Move it into `src/lib/api/espn.ts` as a new exported function
2. Update all callers to use the new function
3. Verify the ISR `revalidate` value is preserved (not lost in the move)
4. Delete the inline fetch

### 4. Type cleanup

When ESPN API types in `src/types/index.ts` drift from reality:
1. Use `/espn-debug` to fetch the live response
2. Compare fields to the TypeScript interface
3. Add missing optional fields (`field?: type`) — never remove existing fields without confirming they're unused
4. Run `npx tsc --noEmit` after each change

### 5. Verify nothing broke

- Run `npx tsc --noEmit`
- Start dev server and manually navigate the affected pages
- Verify dark theme still renders correctly
- Verify favorites still work (they use composite key `{teamId}:{league}`)

---

## Examples

```
# Extract TweaksPanel from DashboardClient
Before: TweaksPanel defined inside DashboardClient.tsx (1200 lines)
After: src/components/dashboard/TweaksPanel.tsx — already done (dynamically imported)

# Move inline ESPN fetch into espn.ts
Before: dashboard/page.tsx has its own fetch() call to ESPN news
After: getNews() in espn.ts called from page.tsx
```

---

## Success Criteria

- `npx tsc --noEmit` passes
- User-visible behavior is unchanged (verified manually in browser)
- No ESPN URL strings exist outside `src/lib/api/espn.ts`
- No duplicate fetch logic across page files
