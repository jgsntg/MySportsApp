# Prompt: Bug Triage

Use this template to report a bug and get a structured diagnosis. Pair with the debugging skill in `skills/debugging/SKILL.md`.

---

## Template

```
There is a bug in MySports:

**Symptom**: <what the user sees — be specific>
**Expected behavior**: <what should happen>
**Reproduction steps**:
1. <step>
2. <step>

**Context**:
- Page/route: <URL or component name>
- Does it happen for all users or specific conditions? <always / logged in / specific sport / etc.>
- When did it start? <after a specific change, or always been broken>
- Console errors (if any): <paste browser or server console output>

Please diagnose this using the debugging skill and identify the root cause before suggesting a fix.
```

---

## Example

```
There is a bug in MySports:

**Symptom**: My Players page shows no stats for NBA players — the stats panel is empty.
**Expected behavior**: Stats panel should show season averages (points, rebounds, assists).
**Reproduction steps**:
1. Log in
2. Navigate to /players
3. Click an NBA player in the sidebar
4. Stats section is empty

**Context**:
- Page/route: /players (PlayersClient.tsx)
- Happens for NBA players only; NFL players show stats fine
- Possibly broke after adding NBA player support
- No console errors visible in browser; check server logs

Please diagnose this using the debugging skill and identify the root cause before suggesting a fix.
```
