---
agent: engineer
description: Run Adaptive Feature Delivery (supports [S] Small, [M] Medium, or [L] Large sizing; defaults to Medium/Large 4-Gate Workflow for Jira features)
---

# Adaptive Feature Specification & Implementation (`/feature-spec`)

Check the requested **Agent Execution Size (`Small [S]` | `Medium [M]` | `Large [L]`)** first:
- If the user passed `[S]` or `--small` (or the request is a trivial UI/copy/style tweak like changing a button color), run the **🟢 Small `[S]` Fast-Track** (skip research, apply surgical edit, run `./scripts/verify-governance.sh`).
- Otherwise, execute the **4-Gate Feature Workflow** (`Medium [M]` or `Large [L]`) for the specified Jira ticket or feature request:

## Gate 1: Product & Context Reconnaissance (Jira MCP + GSD)
1. Fetch the Jira issue via `jira_get_issue` (requirements, acceptance criteria, linked issues).
2. Read [`CONTEXT.md`](../../CONTEXT.md) and [`GLOSSARY.md`](../../GLOSSARY.md). Verify nothing in the plan touches the **Delete-Zone**.
3. Inspect the target modules in the repository.

## Gate 2: Architecture & ADR Compliance Gate (HARD STOP ON DRIFT)
1. Check [`CONTEXT.md`](../../CONTEXT.md) Section 3 and fetch governing ADRs from Confluence (`confluence_get_page`) or `docs/adr/`.
2. **Decision Check (`Medium [M]` vs `Large [L]`)**:
   - **🟡 Medium `[M]` — Complies with Existing ADRs**: Cite the exact `ADR-NNNN` IDs and Confluence URLs.
   - **🔴 Large `[L]` — Outside Existing ADRs (Bounded Decision)**: **STOP coding.** Draft a new ADR using [`docs/adr/template.md`](../../docs/adr/template.md), publish to Confluence (`confluence_create_page`), and register it in `CONTEXT.md`.
   - **🔴 Large `[L]` — Outside Existing ADRs (Cross-Cutting / Multi-Module / Breaking Contract)**: **STOP coding.** Generate an RFC using [`docs/rfc/template.md`](../../docs/rfc/template.md), publish to Confluence, register in `CONTEXT.md`, and decompose into vertical tracer-bullet Jira tickets (`jira_create_issue`).

## Gate 3: Program Design & Visual Alignment (`/show-me`)
Before writing function bodies, output:
1. **File-tree diff** showing Deep Module entry points (`index.*`) vs private implementation (`lib/*`).
2. **Call-tree diff** or **Mermaid diagram** showing runtime data flow.
3. **Exact type signatures and public interfaces** (without bodies).

## Gate 4: Vertical Tracer-Bullet TDD & Documentation Co-Update
1. Implement one vertical slice at a time using Red-Green-Refactor TDD at the module's public seam.
2. Update `CONTEXT.md` and `GLOSSARY.md` if any boundaries, ADRs, or domain terms changed.
3. Post a progress comment to Jira (`jira_add_comment`) and run `/two-axis-review`.
