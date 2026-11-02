---
agent: pr-reviewer
description: Generate or update a Bitbucket Pull Request with a /show-me visual outline, ADR traceability, Before/After evidence, and Merge Danger classification
---

# Visual Pull Request & Merge Danger (`/visual-pr`)

Generate or update the Bitbucket Pull Request description using the `@pr-reviewer` Visual PR template (combining HumanLayer's `visual-pr` + `show-me` with Matt Pocock's `pr` Merge Danger):

1. **Header & Traceability**:
   - Link the **Jira Ticket** (`PROJ-XXXX`) and **Governing Confluence ADR(s) / RFC** (`ADR-NNNN` / `RFC-NNNN`).
   - State **Why this change exists** in exactly one sentence.
2. **Structural Change Outline (`/show-me`)**:
   - Provide a compact structural diff (`file-tree diff`, `call-tree diff`, `contract/type diff`, or Mermaid `sequenceDiagram`) instead of a prose file-by-file changelog.
3. **Concrete Before / After Evidence**:
   - Show the exact seam test or output before and after the change.
4. **Merge Danger Assessment**:
   - **Door**: Classify as **`Two-Way Door`** (trivially reversible via revert/flag) or **`One-Way Door`** (irreversible migration, external notification, or public contract change requiring deep architect review).
   - **Blast Radius**: Rate as `Localized`, `Module-Wide`, or `Cross-System` and state potential failure modes.
5. **Publish to Bitbucket & Jira via MCP**:
   - Call `bitbucket_create_pull_request` or `bitbucket_update_pull_request` and post the PR link to Jira via `jira_add_comment`.
