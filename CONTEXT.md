# Project Context & Architectural System of Record (`CONTEXT.md`)

> **Role of this Document (Living Docs Governance):**
> This file is the **single entry point** for all engineers, architects, and VS Code Copilot agents (`@onboarding`, `@architect`, `@engineer`, `@pr-reviewer`).
> It unites the **System Map**, **Active Confluence ADR Registry**, **RFC Ledger**, **Delete-Zone**, and **MCP Tooling Binding** so agents never hallucinate patterns or write undocumented code.

---

## 1. Project Identity & Scale

- **System Name**: ADR-Governed Software Factory & Executable Governance Engine
- **Git Host**: Bitbucket / GitHub (accessed via Bitbucket MCP / `gh` CLI)
- **Issue Tracker**: Jira / GitHub Issues (accessed via Atlassian/Jira MCP)
- **Knowledge Base & ADR Store**: Confluence + `docs/adr/` mirror (accessed via Atlassian/Confluence MCP)
- **Engineering Methodology**:
  - **Adaptive Agent Sizing (`Small [S]` | `Medium [M]` | `Large [L]`)**: Skips ceremony on trivial UI/copy tweaks (`Small`), runs 4-Gate TDD within existing ADRs (`Medium`), and halts for ADR/RFC creation on architectural drift (`Large`).
  - **Wayfinder & Grill-With-Docs**: Charts complex work as decision maps (`docs/wayfinder/`) and sharpens domain vocabulary in `GLOSSARY.md`.
  - **4-Gate Feature Delivery**: Product (Jira) -> Architecture (Confluence ADR) -> Program Design (`/show-me`) -> Vertical Tracer-Bullet TDD (`/tdd`).
  - **Three-Layer PR Brakes**: Deep Modules (`codebase-design`), Separate Standards Review (`CODING_STANDARDS.md`), Two-Axis Code Review, Merge Danger (`One-Way` vs. `Two-Way` Door), and `/retro` feedback loops.

---

## 2. Canonical Architecture Map & Module Ownership

All packages/modules enforce **Deep Module boundaries** (small public entry points at `src/modules/<domain>/index.mjs`; private implementation inside `lib/`).

| Module / Subsystem | Repository Path | Responsibility & Public Seam | Governing ADRs |
|---|---|---|---|
| **Adaptive Sizing Module** | `src/modules/sizing/` | Classifies tasks into `Small [S]`, `Medium [M]`, or `Large [L]` with intent profiles & safety escalation via `src/modules/sizing/index.mjs` | `ADR-0001`, `ADR-0002`, `ADR-0007` |
| **Governance & Parity Module** | `src/modules/governance/` | Verifies Deep Module seams, structural drift, `CONTEXT.md` <-> `docs/adr/` parity, and Delete-Zone rules via `src/modules/governance/index.mjs` | `ADR-0001`, `ADR-0003`, `ADR-0004` |
| **Deterministic Sensors Module** | `src/modules/sensors/` | Pre-gate validation (`required-sections`, `traceability`, `claim-sources`, verification receipts) via `src/modules/sensors/index.mjs` | `ADR-0001`, `ADR-0007` |
| **Self-Learning Rule Loop Module** | `src/modules/learning/` | Captures corrections into persistent rules with SHA-256 provenance hashes via `src/modules/learning/index.mjs` | `ADR-0001`, `ADR-0007` |
| **Practices Discovery Module** | `src/modules/discovery/` | Scans brownfield repositories to infer architectures and scaffold governance via `src/modules/discovery/index.mjs` | `ADR-0001`, `ADR-0007` |
| **Two-Axis Review & Merge Danger Module** | `src/modules/review/` | Scores `One-Way` vs `Two-Way Door` Merge Danger + Blast Radius and formats `/visual-pr` Markdown via `src/modules/review/index.mjs` | `ADR-0001`, `ADR-0005`, `ADR-0007` |
| **GSD Framework Bridge Module** | `src/modules/gsd/`, `.planning/` | Adapter to `gsd-tools.cjs` & `.planning/` ADR traceability verifier via `src/modules/gsd/index.mjs` | `ADR-0001`, `ADR-0006` |
| **Factory CLI & Git/CI Hooks** | `src/cli/factory.mjs`, `scripts/` | Zero-dependency CLI adapter (`size`, `verify`, `learn`, `discover`, `pr-report`, `gsd`) & bootstrap scripts | `ADR-0004`, `ADR-0006`, `ADR-0007` |
| **Agent & Governance Config** | `.github/`, `docs/adr/`, `docs/wayfinder/` | Copilot agents, slash prompts, ADRs, RFCs, Wayfinder maps, coding standards | `ADR-0000`, `ADR-0003` |

### Navigation Jump Table ("Where to Look")

| If you need to... | Go to... | Verify with... |
|---|---|---|
| Understand domain terms & bounded contexts | [`GLOSSARY.md`](./GLOSSARY.md) | Domain types & seam contracts |
| Check if an architectural choice is already decided | Section 3 below + Confluence ADR space | [`docs/adr/README.md`](./docs/adr/README.md) & `node src/cli/factory.mjs verify` |
| Inspect the Wayfinder decision map | [`docs/wayfinder/MAP-0001-software-factory-engine.md`](./docs/wayfinder/MAP-0001-software-factory-engine.md) | [`docs/rfc/RFC-0001-executable-software-factory-engine.md`](./docs/rfc/RFC-0001-executable-software-factory-engine.md) |
| Propose a cross-team or breaking architecture change | [`docs/rfc/README.md`](./docs/rfc/README.md) | `@architect` / `/create-rfc` |
| Check detailed code quality & smell rules | [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) | `@pr-reviewer` / `/two-axis-review` |

---

## 3. Canonical ADR Registry (Bitbucket `CONTEXT.md` <-> Confluence Sync)

> **Rule for Agents & Engineers (`ADR-0003`):**
> Before implementing any `Medium [M]` or `Large [L]` feature, check the table below and fetch the full Confluence page (or local mirror in `docs/adr/`).
> **If your feature requires a pattern, library, schema, or integration NOT covered below (or conflicts with an `accepted` ADR), you MUST halt implementation and run `@architect` (`/create-adr` or `/create-rfc`).**

| ADR ID | Title | Status | Scope / Bounded Context | Confluence Page ID / URL | Local Mirror | Governing Jira Epic |
|---|---|---|---|---|---|---|
| **ADR-0000** | ADR-Driven Software Factory & Mandatory Documentation Gate | `accepted` | All Repositories & Agents | `CONF-ADR-0000` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0000`) | [`docs/adr/0000-adr-driven-software-factory.md`](./docs/adr/0000-adr-driven-software-factory.md) | `ARCH-1` |
| **ADR-0001** | Deep Module Boundaries & Single Entry-Point Encapsulation | `accepted` | `src/modules/*` | `CONF-ADR-0001` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0001`) | [`docs/adr/0001-deep-module-boundaries.md`](./docs/adr/0001-deep-module-boundaries.md) | `ARCH-2` |
| **ADR-0002** | Adaptive Agent Sizing Classifier (`Small [S]` \| `Medium [M]` \| `Large [L]`) & Safety Escalation | `accepted` | `src/modules/sizing/`, `.github/` | `CONF-ADR-0002` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0002`) | [`docs/adr/0002-adaptive-agent-sizing-classifier.md`](./docs/adr/0002-adaptive-agent-sizing-classifier.md) | `ARCH-3` |
| **ADR-0003** | Hybrid Living-Docs Governance (`CONTEXT.md` <-> Confluence MCP & Local ADR Parity) | `accepted` | `src/modules/governance/`, `docs/adr/` | `CONF-ADR-0003` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0003`) | [`docs/adr/0003-hybrid-adr-confluence-sync.md`](./docs/adr/0003-hybrid-adr-confluence-sync.md) | `ARCH-4` |
| **ADR-0004** | Deterministic Zero-Dependency Governance CLI (`factory` Engine) | `accepted` | `src/cli/factory.mjs`, `scripts/` | `CONF-ADR-0004` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0004`) | [`docs/adr/0004-deterministic-governance-cli.md`](./docs/adr/0004-deterministic-governance-cli.md) | `ARCH-5` |
| **ADR-0005** | Two-Axis Separate-Context PR Review & Merge Danger (`One-Way` vs `Two-Way Door`) Scoring | `accepted` | `src/modules/review/`, `CODING_STANDARDS.md` | `CONF-ADR-0005` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0005`) | [`docs/adr/0005-two-axis-review-and-merge-danger.md`](./docs/adr/0005-two-axis-review-and-merge-danger.md) | `ARCH-6` |
| **ADR-0006** | Native GSD Framework Bridge & `.planning/` ADR Traceability | `accepted` | `src/modules/gsd/`, `.planning/` | `CONF-ADR-0006` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0006`) | [`docs/adr/0006-gsd-native-execution-bridge.md`](./docs/adr/0006-gsd-native-execution-bridge.md) | `ARCH-7` |
| **ADR-0007** | AI-DLC Synthesis Architecture (Intent Profiles, Sensors, Self-Learning Loop, and Verification Receipts) | `accepted` | `src/modules/sizing/`, `src/modules/sensors/`, `src/modules/learning/`, `src/modules/discovery/`, `src/modules/review/` | `CONF-ADR-0007` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0007`) | [`docs/adr/0007-aidlc-synthesis-architecture.md`](./docs/adr/0007-aidlc-synthesis-architecture.md) | `ARCH-8` |

---

## 4. Active RFC Ledger (Cross-Cutting & Multi-Phase Proposals)

When a change is too large or cross-cutting for a single ADR, an **RFC** is created on Confluence and mirrored in `docs/rfc/`, then decomposed into tracer-bullet Jira tickets.

| RFC ID | Title | Status | Target Modules | Confluence RFC Link | Local Mirror | Jira Epic |
|---|---|---|---|---|---|---|
| **RFC-0001** | Executable ADR-Governed Software Factory Engine & CLI | `approved` | `src/modules/*`, `src/cli/` | `CONF-RFC-0001` | [`docs/rfc/RFC-0001-executable-software-factory-engine.md`](./docs/rfc/RFC-0001-executable-software-factory-engine.md) | `ARCH-100` |

---

## 5. Intentional Removal & Delete-Zone (Anti-Zombie Code Ledger)

> **Why this section exists (`living-docs-governance`):**
> Coding agents frequently re-introduce deprecated helpers, legacy adapters, or deleted files if they see references in old commits or tests. **Never recreate anything in this table without a new approved ADR.**

| Removed Path or Pattern | Date Removed | Why Removed | Canonical Replacement | Governing ADR |
|---|---|---|---|---|
| Direct cross-module imports into `/lib/` or `/internal/` | 2026-11-01 | Violates Deep Module seam locality & testability | Import strictly from `src/modules/<domain>/index.mjs` | `ADR-0001`, `ADR-0004` |
| `export * from './lib/'` barrel re-exports in `index.mjs` | 2026-11-01 | Exposes shallow private internals to callers & tests | Export only named public seam functions in `index.mjs` | `ADR-0001` |

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
