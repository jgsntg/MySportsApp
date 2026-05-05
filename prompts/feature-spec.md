# Prompt: Feature Spec Generation

Use this template when scoping a new feature for MySports. Fill in the blanks, then hand to the senior engineer.

---

## Template

```
I need to add the following feature to MySports:

**Feature name**: <name>
**User story**: As a user, I want to <action> so that <outcome>.

**Current behavior**: <what happens today>
**Desired behavior**: <what should happen after>

**Context**:
- Relevant page(s): <dashboard / scoreboard / teams / players / new page>
- Relevant data: <what ESPN data or DB data is involved>
- Related existing code: <file paths if known>

**Constraints**:
- Must use the existing ESPN API (no new external services)
- Must work in dark theme
- <any other constraints>

Please produce a feature spec following the format in agents/product-manager.md.
```

---

## Example

```
I need to add the following feature to MySports:

**Feature name**: Team standings
**User story**: As a user, I want to see current league standings so I can track my team's position.

**Current behavior**: There is no standings page.
**Desired behavior**: A /standings route shows a table of teams ranked by wins for a selected league.

**Context**:
- Relevant page(s): New page under (dashboard)
- Relevant data: ESPN standings endpoint (needs /espn-debug to verify shape)
- Related existing code: src/lib/api/espn.ts, src/types/index.ts

**Constraints**:
- Must use the existing ESPN API
- Must work in dark theme
- Should follow the /new-page pattern
```
