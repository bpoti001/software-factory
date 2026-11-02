---
agent: engineer
description: One-command Autopilot router! Pass a Jira key (or nothing, and it reads your git branch name), auto-detects Tier 1/2/3 complexity, checks Confluence ADRs, and runs the exact workflow needed.
---

# Zero-Friction Autopilot Entry Point (`/start`)

The engineer invoked `/start`. Your job is to **eliminate all process friction** by automatically discovering context and routing to the minimal required workflow tier.

## Step 1: Zero-Typing Context Discovery
1. **Find the Jira Ticket Automatically**:
   - If the user passed a Jira key (e.g., `/start MKS-1234`), use it.
   - Otherwise, run `git symbolic-ref --short HEAD` to read the current git branch name and extract the Jira key (`[A-Z]+-[0-9]+`).
   - Fetch the Jira ticket via **Jira MCP** (`jira_get_issue`).
2. **Load Repo Map & ADRs**:
   - Read [`CONTEXT.md`](../../CONTEXT.md) and [`GLOSSARY.md`](../../GLOSSARY.md).
   - Fetch only the 1–2 governing **Confluence ADRs** (`confluence_get_page`) mapped to the target module in `CONTEXT.md`.

## Step 2: Automatic Complexity Tiering (The 80/20 Anti-Friction Filter)
Classify the task into one of three tiers so engineers never suffer bureaucracy on simple tasks:

- **🟢 Tier 1 — Fast-Track (Bug fix, copy tweak, or isolated internal change within 1 module; zero new dependencies, schemas, or public interface changes)**:
  - Skip heavy spec docs and ceremony!
  - State: *"🟢 Tier 1 Fast-Track detected (Complies with `ADR-NNNN`). Writing seam test and implementing directly."*
  - Write the failing test at the module's public entry point -> implement the fix -> run tests -> run `/two-axis-review`.

- **🟡 Tier 2 — Standard 4-Gate Feature (New behavior or public interface update that fits within existing Confluence ADRs)**:
  - State: *"🟡 Tier 2 Feature detected (Governed by `ADR-NNNN`)."*
  - Show a compact 15-line **`/show-me` Program Design Blueprint** (file-tree diff + call-tree diff + public interface signatures without bodies).
  - Implement in vertical **Tracer Bullet** slices via Red-Green-Refactor TDD.
  - Co-update `CONTEXT.md` / `GLOSSARY.md` if needed, then run `/two-axis-review` and `/visual-pr`.

- **🔴 Tier 3 — Architectural Drift / Uncovered Territory (Introduces a new library, new database table/schema, cross-module contract, or conflicts with an accepted ADR)**:
  - **HARD STOP on coding.**
  - State clearly *which* part of the request falls outside existing ADRs in `CONTEXT.md`.
  - Automatically draft either:
    - **A New ADR (`docs/adr/NNNN-*.md`)** if it is a single bounded decision -> publish to **Confluence MCP** (`confluence_create_page`) -> update `CONTEXT.md`.
    - **A Cross-Cutting RFC (`docs/rfc/RFC-NNNN-*.md`)** if it spans multiple modules/teams -> publish to **Confluence MCP** -> decompose into vertical **Tracer Bullet** sub-tickets in **Jira MCP** (`jira_create_issue`).
  - Once documented, proceed to Tier 2 implementation.
