---
agent: engineer
description: Force Small [S] Agent Size! Zero-research fast-track for UI tweaks (e.g., changing a button color), copy fixes, styling adjustments, or tiny localized bug fixes.
---

# Quick Surgical Edit — Force Size: `SMALL [S]` (`/quick`)

The engineer invoked `/quick` (or forced **Size: Small `[S]`**).

1. **Zero Research Overhead**:
   - Do **NOT** read `CONTEXT.md` or `GLOSSARY.md`.
   - Do **NOT** query Confluence MCP or Jira MCP.
   - Do **NOT** generate a `/show-me` program design blueprint or draft ADRs.
2. **Direct Surgical Execution**:
   - Locate the target file(s) directly (`search` / `read`).
   - Apply the requested change cleanly (`edit`).
3. **Safety Guard**:
   - Verify the change does not add new dependencies (`package.json`, `requirements.txt`, etc.), alter database schemas, or import private `/lib/` internals across module boundaries. (If it does, alert the user and escalate to **Medium `[M]`** or **Large `[L]`**).
   - Run `./scripts/verify-governance.sh` to confirm boundary cleanliness.
