# Project Context & Architectural System of Record (`CONTEXT.md`)

> **Role of this Document (Living Docs Governance):**
> This file is the **single entry point** for all engineers, architects, and VS Code Copilot agents (`@onboarding`, `@architect`, `@engineer`, `@pr-reviewer`).
> It unites the **System Map**, **Active Confluence ADR Registry**, **RFC Ledger**, **Delete-Zone**, and **MCP Tooling Binding** so agents never hallucinate patterns or write undocumented code.

---

## 1. Project Identity & Scale

- **System Name**: Enterprise Software Platform (Multi-Team Scale Architecture)
- **Git Host**: Bitbucket (accessed via Bitbucket MCP in VS Code)
- **Issue Tracker**: Jira (accessed via Atlassian/Jira MCP in VS Code)
- **Knowledge Base & ADR Store**: Confluence + `docs/adr/` mirror (accessed via Atlassian/Confluence MCP in VS Code)
- **Engineering Methodology**:
  - **Everything Claude Code (ECC)**: Principal engineering practices, immutability, TDD, security gates, and ADR refactoring.
  - **GSD (Get Shit Done)**: Deep primary-source research and zero-hallucination phase execution.
  - **HumanLayer (Dexter Horthy)**: 4-Gate Feature Workflow (Product -> Architecture/ADR -> Program Design -> Vertical Slices) and `/show-me` visual alignment.
  - **Matt Pocock PR Brakes**: Deep Modules (`codebase-design`), Separate Standards Review (`CODING_STANDARDS.md`), Two-Axis Code Review, Merge Danger (`One-Way` vs. `Two-Way` Door), and `/retro` feedback loops.

---

## 2. Canonical Architecture Map & Module Ownership

All packages/modules enforce **Deep Module boundaries** (small public entry points at the module root; private implementation inside `lib/` or `internal/`).

| Module / Subsystem | Repository Path | Responsibility & Public Seam | Governing ADRs |
|---|---|---|---|
| **API Gateway & Contracts** | `src/api/` | Request validation, auth middleware, versioned route contracts | `ADR-0001`, `ADR-0003` |
| **Core Domain Modules** | `src/modules/<domain>/` | Deep domain logic exposed strictly via `<domain>/index.*` | `ADR-0002`, `ADR-0004` |
| **Persistence & Streams** | `src/storage/` | Repository adapters, transactional outbox, streaming pipelines | `ADR-0005` |
| **Observability & Audit** | `src/telemetry/` | Structured logging, OpenTelemetry tracing, compliance audit trail | `ADR-0006` |
| **Agent & Governance Config** | `.github/`, `docs/adr/` | Copilot agents, slash prompts, ADRs, RFCs, coding standards | `ADR-0000` |

### Navigation Jump Table ("Where to Look")

| If you need to... | Go to... | Verify with... |
|---|---|---|
| Understand domain terms & bounded contexts | [`GLOSSARY.md`](./GLOSSARY.md) | Domain types & schema definitions |
| Check if an architectural choice is already decided | Section 3 below + Confluence ADR space | [`docs/adr/README.md`](./docs/adr/README.md) & Confluence MCP |
| Propose a cross-team or breaking architecture change | [`docs/rfc/README.md`](./docs/rfc/README.md) | `@architect` / `/create-rfc` |
| Check detailed code quality & smell rules | [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) | `@pr-reviewer` / `/two-axis-review` |

---

## 3. Canonical ADR Registry (Bitbucket `CONTEXT.md` <-> Confluence Sync)

> **Rule for Agents & Engineers:**
> Before implementing any feature, check the table below and fetch the full Confluence page (or local mirror in `docs/adr/`) via MCP.
> **If your feature requires a pattern, library, schema, or integration NOT covered below (or conflicts with an `accepted` ADR), you MUST halt implementation and run `@architect` (`/create-adr` or `/create-rfc`).**

| ADR ID | Title | Status | Scope / Bounded Context | Confluence Page ID / URL | Local Mirror | Governing Jira Epic |
|---|---|---|---|---|---|---|
| **ADR-0000** | ADR-Driven Software Factory & Documentation Gate | `accepted` | All Repositories & Agents | `CONF-ADR-0000` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0000`) | [`docs/adr/0000-adr-driven-software-factory.md`](./docs/adr/0000-adr-driven-software-factory.md) | `ARCH-1` |
| **ADR-0001** | Deep Module Boundaries & Entry-Point Encapsulation | `accepted` | All Code Modules (`src/*`) | `CONF-ADR-0001` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0001`) | [`docs/adr/template.md`](./docs/adr/template.md) | `ARCH-2` |
| **ADR-0002** | Contract-First API Validation & RFC 7807 Errors | `accepted` | `src/api/` | `CONF-ADR-0002` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0002`) | `docs/adr/0002-api-contracts.md` | `ARCH-3` |
| **ADR-0003** | Authentication, RBAC & Zero-Trust Boundary Checks | `accepted` | `src/api/`, `src/auth/` | `CONF-ADR-0003` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0003`) | `docs/adr/0003-auth-rbac.md` | `ARCH-4` |
| **ADR-0004** | Domain State Management & Immutable Value Objects | `accepted` | `src/modules/` | `CONF-ADR-0004` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0004`) | `docs/adr/0004-domain-immutability.md` | `ARCH-5` |
| **ADR-0005** | Persistence Repositories & Transactional Outbox | `accepted` | `src/storage/` | `CONF-ADR-0005` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0005`) | `docs/adr/0005-persistence-outbox.md` | `ARCH-6` |
| **ADR-0006** | Structured Telemetry, Audit Logging & PII Redaction | `accepted` | `src/telemetry/` | `CONF-ADR-0006` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0006`) | `docs/adr/0006-telemetry-audit.md` | `ARCH-7` |

---

## 4. Active RFC Ledger (Cross-Cutting & Multi-Phase Proposals)

When a change is too large or cross-cutting for a single ADR, an **RFC** is created on Confluence and mirrored in `docs/rfc/`, then decomposed into tracer-bullet Jira tickets.

| RFC ID | Title | Status | Target Modules | Confluence RFC Link | Local Mirror | Jira Epic |
|---|---|---|---|---|---|---|
| **RFC-0001** | [Template] Multi-Phase Architecture Evolution | `draft` | `src/*` | `CONF-RFC-0001` | [`docs/rfc/template.md`](./docs/rfc/template.md) | `PROJ-100` |

---

## 5. Intentional Removal & Delete-Zone (Anti-Zombie Code Ledger)

> **Why this section exists (`living-docs-governance`):**
> Coding agents frequently re-introduce deprecated helpers, legacy adapters, or deleted files if they see references in old commits or tests. **Never recreate anything in this table without a new approved ADR.**

| Removed Path or Pattern | Date Removed | Why Removed | Canonical Replacement | Governing ADR |
|---|---|---|---|---|
| Direct DB queries inside route handlers | 2026-10-01 | Violates seam locality & testability | Call deep module entry points in `src/modules/<domain>/index.*` | `ADR-0001`, `ADR-0005` |
| Barrel `index.ts` re-exporting internal `lib/*` | 2026-10-15 | Exposes shallow internals to callers & tests | Expose only narrow root entry points | `ADR-0001` |

---

## 6. MCP Server & Tooling Binding for VS Code Copilot Agents

Engineers and architects have the following MCP servers pre-configured in VS Code Copilot:

1. **Jira MCP (`jira` / `mcp-atlassian`)**:
   - Read ticket requirements, acceptance criteria, and parent epics (`jira_get_issue`, `jira_search`).
   - Create tracer-bullet sub-tickets with native blocking edges (`jira_create_issue`, `jira_create_issue_link`).
   - Post implementation blueprints, ADR/RFC links, and test evidence (`jira_add_comment`, `jira_transition_issue`).
2. **Confluence MCP (`confluence` / `mcp-atlassian`)**:
   - Search and read full ADR/RFC pages referenced in Section 3 (`confluence_get_page`, `confluence_search`).
   - Create or update ADR/RFC pages when `@architect` mints a new decision (`confluence_create_page`, `confluence_update_page`).
3. **Bitbucket MCP (`bitbucket`)**:
   - Inspect repository branches, commit history, and PR diffs (`bitbucket_get_pull_request`, `bitbucket_get_diff`).
   - Create or update Pull Requests with `/visual-pr` outlines, ADR compliance tables, and Merge Danger classifications (`bitbucket_create_pull_request`, `bitbucket_update_pull_request`).
