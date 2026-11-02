---
agent: architect
description: Generate a cross-cutting RFC, publish to Confluence MCP, register in CONTEXT.md, and decompose into a DAG of vertical tracer-bullet Jira tickets
---

# Generate RFC & Tracer-Bullet Jira DAG (`/create-rfc`)

Execute the `@architect` RFC Pipeline (`ralphinho-rfc-pipeline` + `to-tickets`) when a feature or architectural refactor is too large or cross-cutting for a single ADR:

1. **Draft the RFC (`docs/rfc/RFC-NNNN-<slug>.md`)**:
   - Use [`docs/rfc/template.md`](../../docs/rfc/template.md).
   - Include `/show-me` visual architecture diagrams, Deep Module seam contracts, Expand-Contract migration strategy (if refactoring across many call sites), and rollback plan.
2. **Publish to Confluence MCP & Register in `CONTEXT.md`**:
   - Create the RFC page in Confluence (`confluence_create_page`).
   - Add the RFC entry to [`CONTEXT.md`](../../CONTEXT.md) Section 4 and [`docs/rfc/README.md`](../../docs/rfc/README.md).
3. **Decompose into Tracer-Bullet Jira Tickets (`to-tickets`)**:
   - Break the RFC into vertical **Tracer Bullet** work units (each cutting end-to-end through schema, module seam, API, and tests, sized for a single agent session).
   - Create the tickets in Jira (`jira_create_issue`) and link blocking dependencies (`jira_create_issue_link`).
