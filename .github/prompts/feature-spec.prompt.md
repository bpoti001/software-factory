---
agent: engineer
description: Run the 4-Gate Feature Workflow (Jira MCP -> Confluence ADR Gate -> /show-me Program Design -> Vertical Tracer-Bullet TDD)
---

# 4-Gate Feature Specification & Implementation (`/feature-spec`)

Execute the 4-Gate Feature Workflow for the specified Jira ticket or feature request:

## Gate 1: Product & Context Reconnaissance (Jira MCP + GSD)
1. Fetch the Jira issue via `jira_get_issue` (requirements, acceptance criteria, linked issues).
2. Read [`CONTEXT.md`](../../CONTEXT.md) and [`GLOSSARY.md`](../../GLOSSARY.md). Verify nothing in the plan touches the **Delete-Zone**.
3. Inspect the target modules in the repository.

## Gate 2: Architecture & ADR Compliance Gate (HARD STOP ON DRIFT)
1. Check [`CONTEXT.md`](../../CONTEXT.md) Section 3 and fetch governing ADRs from Confluence (`confluence_get_page`) or `docs/adr/`.
2. **Decision Check**:
   - **Complies with Existing ADRs**: Cite the exact `ADR-NNNN` IDs and Confluence URLs.
   - **Outside Existing ADRs (Bounded Decision)**: **STOP coding.** Draft a new ADR using [`docs/adr/template.md`](../../docs/adr/template.md), publish to Confluence (`confluence_create_page`), and register it in `CONTEXT.md`.
   - **Outside Existing ADRs (Cross-Cutting / Multi-Module / Breaking Contract)**: **STOP coding.** Generate an RFC using [`docs/rfc/template.md`](../../docs/rfc/template.md), publish to Confluence, register in `CONTEXT.md`, and decompose into vertical tracer-bullet Jira tickets (`jira_create_issue`).

## Gate 3: Program Design & Visual Alignment (`/show-me`)
Before writing function bodies, output:
1. **File-tree diff** showing Deep Module entry points (`index.*`) vs private implementation (`lib/*`).
2. **Call-tree diff** or **Mermaid diagram** showing runtime data flow.
3. **Exact type signatures and public interfaces** (without bodies).

## Gate 4: Vertical Tracer-Bullet TDD & Documentation Co-Update
1. Implement one vertical slice at a time using Red-Green-Refactor TDD at the module's public seam.
2. Update `CONTEXT.md` and `GLOSSARY.md` if any boundaries, ADRs, or domain terms changed.
3. Post a progress comment to Jira (`jira_add_comment`) and run `/two-axis-review`.
