# Prompt: PR Review

Use this template to request a structured review of a completed change. Pair with `agents/reviewer.md` and `skills/code-review/SKILL.md`.

---

## Template

```
Please review the following changes to MySports:

**What was implemented**: <one paragraph description>

**Files changed**:
- <file path> — <what changed>
- <file path> — <what changed>

**How to verify**:
1. <step to see the change in the browser>
2. <what to look for>

**Specific concerns** (optional):
- <anything you're unsure about — type safety, ESPN edge case, auth coverage>

Please review using the checklist in agents/reviewer.md and skills/code-review/SKILL.md.
Return a verdict: Approve / Request Changes / Block.
```

---

## Example

```
Please review the following changes to MySports:

**What was implemented**: Added WNBA as a new league. It appears on the dashboard scoreboard, the teams browser, and the scoreboard page.

**Files changed**:
- src/lib/api/espn.ts — added WNBA to ALL_LEAGUES
- src/types/index.ts — added wnba to SPORT_CONFIGS
- src/app/(dashboard)/dashboard/page.tsx — WNBA scoreboard now fetched in parallel

**How to verify**:
1. Run npm run dev
2. Navigate to /dashboard — WNBA games should appear in Today's Games
3. Navigate to /scoreboard — WNBA section should appear
4. Navigate to /teams, select WNBA tab — team cards should appear

**Specific concerns**:
- Not sure if WNBA is in-season right now — scoreboard may be empty but should not error

Please review using the checklist in agents/reviewer.md and skills/code-review/SKILL.md.
Return a verdict: Approve / Request Changes / Block.
```
