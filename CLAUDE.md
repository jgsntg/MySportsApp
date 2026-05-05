# CLAUDE.md

@AGENTS.md

@docs/architecture.md

---

## Claude Code — Specific Configuration

### Slash Commands

| Command | Usage | What it does |
|---|---|---|
| `/add-league` | `/add-league <sport> <espn-id> <name> <key> <hex>` | Add a new ESPN league to `ALL_LEAGUES` + `SPORT_CONFIGS` |
| `/new-page` | `/new-page <route> <description>` | Scaffold server + client + loading skeleton for a dashboard page |
| `/espn-debug` | `/espn-debug <what-to-explore>` | Fetch and inspect ESPN API endpoints before writing code |
| `/db-change` | `/db-change <description>` | Update `schema.ts` + `init-db.mjs` + run `db:push` |

Full command definitions: `.claude/commands/`

### Memory

Auto-memory lives at `~/.claude/projects/-Users-josesantiago-Workspaces-MySports/memory/`.
Save: user preferences, project decisions, approach feedback (corrections and confirmations).
Do not save: code patterns, git history, or file paths derivable from the codebase.

### Preferences

- No trailing summaries after completing a task
- No emojis unless explicitly requested
- Use markdown link syntax for file references: `[filename.ts](src/filename.ts#L42)`
- Always update `CLAUDE.md` and `AGENTS.md` when architecture or commands change
- Never commit unless explicitly asked
