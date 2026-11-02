---
agent: engineer
description: One-command Autopilot router with Small [S] / Medium [M] / Large [L] Agent Sizing! Pass a size flag (--small, --medium, --large) or let it auto-detect so trivial tweaks skip research while features and architectural changes run the exact required gates.
---

# Zero-Friction Autopilot Entry Point (`/start`)

The engineer invoked `/start`. Your job is to **eliminate all process friction** by checking the **Agent Execution Size (`Small [S]` | `Medium [M]` | `Large [L]`)** first—before running any heavy research or MCP calls.

## Step 1: Check User Size Override OR Auto-Detect Size (`< 3 seconds`)

1. **Did the user specify a size explicitly?**
   - `[S]`, `--small`, `size:small` -> Force **🟢 SMALL (`[S]`)**.
   - `[M]`, `--medium`, `size:medium` -> Force **🟡 MEDIUM (`[M]`)**.
   - `[L]`, `--large`, `size:large` -> Force **🔴 LARGE (`[L]`)**.
2. **If not specified, auto-detect based on what the engineer is trying to do**:
   - Changing a button color, fixing a typo, updating CSS/styles, tweaking a config constant, or making a `<= 2 file` localized fix with zero interface/schema/dependency changes? -> Select **🟢 SMALL (`[S]`)**.
   - Building a feature, API endpoint, or component behavior within existing ADRs? -> Select **🟡 MEDIUM (`[M]`)**.
   - Adding a new library, DB table/migration, new Deep Module, or cross-module contract outside existing ADRs? -> Select **🔴 LARGE (`[L]`)**.

---

## Step 2: Execute the Selected Size Workflow

### 🟢 Size: SMALL (`[S]`) — Zero-Research Fast-Track
- **DO NOT** run deep GSD research, **DO NOT** query Confluence MCP, and **DO NOT** generate `/show-me` design docs.
- State: *"🟢 Size: SMALL `[S]` — Skipping research ceremony. Applying surgical change directly."*
- Locate the file(s), apply the edit, run any fast unit/typecheck on the touched file, and verify `./scripts/verify-governance.sh`.

### 🟡 Size: MEDIUM (`[M]`) — Standard 4-Gate Feature (Within Existing ADRs)
- State: *"🟡 Size: MEDIUM `[M]` — Running 4-Gate Feature Delivery within existing ADRs."*
- **Gate 1 (Jira + Context)**: Extract the Jira key (from prompt or `git symbolic-ref --short HEAD`), fetch via `jira_get_issue`, and read `CONTEXT.md` + `GLOSSARY.md`.
- **Gate 2 (ADR Check)**: Fetch the governing Confluence ADR (`confluence_get_page`) from `CONTEXT.md`. *(If the task conflicts with or falls outside existing ADRs, auto-escalate to **🔴 LARGE `[L]`**).*
- **Gate 3 (`/show-me`)**: Present a compact 15-line Program Design Blueprint (file-tree diff + call-tree diff + public interface signatures).
- **Gate 4 (`/tdd`)**: Implement via vertical Tracer-Bullet TDD at the module seam (`index.*`), then run `/two-axis-review` and `/visual-pr`.

### 🔴 Size: LARGE (`[L]`) — Full Architecture Gate + ADR/RFC Escalation
- State: *"🔴 Size: LARGE `[L]` — Architectural scope detected. Running ADR/RFC Gate + Full 4-Gate Pipeline."*
- **Gate 1 (Deep Recon)**: Read `CONTEXT.md`, `GLOSSARY.md`, Jira Epic/Ticket (`jira_get_issue`), and all affected modules.
- **Gate 2 (HARD STOP — Mint ADR or RFC)**:
  - **Single Bounded Decision (`/create-adr`)**: Draft `docs/adr/NNNN-*.md` -> publish to **Confluence MCP** (`confluence_create_page`) -> register in `CONTEXT.md`.
  - **Cross-Cutting / Multi-Module (`/create-rfc`)**: Draft `docs/rfc/RFC-NNNN-*.md` -> publish to **Confluence MCP** -> decompose into vertical **Tracer Bullet** sub-tickets in **Jira MCP** (`jira_create_issue`).
- **Gate 3 (Full `/show-me`)**: Present full file-tree diff, Mermaid sequence diagram, and Deep Module boundary contracts.
- **Gate 4 (Multi-Slice `/tdd` + Review)**: Implement vertical slices via TDD, co-update `CONTEXT.md` & `GLOSSARY.md`, and run `/two-axis-review`, `/visual-pr` (`One-Way Door`), and `/retro`.
