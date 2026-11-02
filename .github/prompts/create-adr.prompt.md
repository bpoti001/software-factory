---
agent: architect
description: Mint a new or superseding Architecture Decision Record (ADR), publish to Confluence MCP, update CONTEXT.md, and link to Jira
---

# Mint Architecture Decision Record (`/create-adr`)

Execute the `@architect` ADR Creation Workflow when a feature or refactor introduces a decision outside existing ADRs:

1. **Verify ADR Criteria**:
   - Confirm the decision is (a) hard to reverse, (b) surprising without context, or (c) the result of a genuine trade-off. (If it spans multiple systems or requires a phased cross-team rollout, use `/create-rfc` instead.)
2. **Read Context & Determine Number**:
   - Read [`CONTEXT.md`](../../CONTEXT.md), [`GLOSSARY.md`](../../GLOSSARY.md), and [`docs/adr/README.md`](../../docs/adr/README.md) to assign the next `ADR-NNNN` number.
3. **Design-It-Twice Evaluation**:
   - Compare at least two distinct architectural alternatives across **Deep Module Depth**, **Locality**, **Testability**, and **Operational Blast Radius**.
4. **Write Local ADR Mirror**:
   - Create `docs/adr/NNNN-<kebab-title>.md` using [`docs/adr/template.md`](../../docs/adr/template.md).
5. **Sync to Confluence & Jira via MCP**:
   - Publish the ADR to the Confluence Architecture Space (`confluence_create_page` or `confluence_update_page`).
   - Add the new ADR row (with Confluence Page ID/URL and Jira key) to [`CONTEXT.md`](../../CONTEXT.md) Section 3 and [`docs/adr/README.md`](../../docs/adr/README.md).
   - Post the ADR link to the originating Jira issue (`jira_add_comment`).
