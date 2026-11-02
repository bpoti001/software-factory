---
agent: onboarding
description: Understand the current state of the project or a module via CONTEXT.md, Confluence ADRs, Jira Epics, and Bitbucket PRs with /show-me visuals
---

# Project Onboarding & State Check (`/onboard`)

Use the `@onboarding` agent workflow to provide a comprehensive, visual overview of the current project state or the requested subsystem:

1. **Read Local System of Record**:
   - Read [`CONTEXT.md`](../../CONTEXT.md) for the module map, active ADR registry, RFC ledger, and Delete-Zone.
   - Read [`GLOSSARY.md`](../../GLOSSARY.md) for canonical domain terms.
2. **Pull Live Confluence ADRs via MCP**:
   - Fetch the governing Confluence ADR pages (`confluence_get_page`) linked in `CONTEXT.md` for the requested area.
3. **Pull Live Jira & Bitbucket State via MCP**:
   - Query active Jira epics/issues (`jira_search`) and open Bitbucket Pull Requests (`bitbucket_get_pull_request` or `git log --oneline -n 10`).
4. **Render Visual Architecture (`/show-me`)**:
   - Present a compact visual (Mermaid `sequenceDiagram`, call-tree, or Deep Module entry-point map) alongside the ADR constraint summary.
5. **Assess Architectural Readiness**:
   - If the user mentioned a planned feature or change, state clearly whether it fits within existing ADRs or requires `/create-adr` / `/create-rfc` first.
