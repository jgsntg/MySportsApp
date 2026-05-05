# Prompt: Architecture Design

Use this template when proposing a significant structural change to MySports — new data flows, new persistent state, or new infrastructure.

---

## Template

```
I want to make a significant architectural change to MySports:

**Change**: <describe what you want to add or restructure>

**Why**: <the problem this solves — user experience issue, performance issue, maintainability issue>

**Current architecture**:
- Relevant files: <list the files involved today>
- Current data flow: <describe how data moves today>

**Proposed change**:
- <describe the new structure>
- <describe the new data flow>

**Concerns**:
- <risks or unknowns — ESPN API reliability, DB migration complexity, etc.>

Please evaluate this against the patterns in AGENTS.md and docs/architecture.md. 
Identify any conflicts with existing patterns and propose the minimal-impact implementation.
```

---

## Example

```
I want to make a significant architectural change to MySports:

**Change**: Add server-sent events (SSE) for live game score updates instead of polling.

**Why**: FocusMode polls /api/sports/summary every 30s per game, which feels laggy during live games.

**Current architecture**:
- Relevant files: src/components/dashboard/FocusMode.tsx, src/app/api/sports/summary/route.ts
- Current data flow: FocusMode sets a 30s interval → fetches /api/sports/summary → re-renders

**Proposed change**:
- New SSE route at /api/sports/live-updates that streams game state
- FocusMode subscribes via EventSource instead of polling

**Concerns**:
- Vercel Fluid Compute supports streaming, but connection limits unknown
- ESPN doesn't provide webhooks — still need to poll on the server side

Please evaluate this against the patterns in AGENTS.md and docs/architecture.md.
```
