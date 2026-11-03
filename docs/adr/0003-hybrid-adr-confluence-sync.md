# ADR-0003: Hybrid Living-Docs Governance (`CONTEXT.md` <-> Confluence MCP & Local ADR Parity)

- **Date**: 2026-11-02
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0003` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0003`)
- **Jira Ticket / Epic**: `ARCH-4`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/governance/`, `CONTEXT.md`, `docs/adr/README.md`, `docs/agents/domain.md`

---

## 1. Context & Problem Statement

Enterprise teams author and review Architecture Decision Records on **Confluence**, while coding agents running inside Bitbucket repositories need fast, version-controlled context pointers in `CONTEXT.md`. If `CONTEXT.md` lists ADR rows whose local mirror files (`docs/adr/NNNN-*.md`) are missing or out of sync with `docs/adr/README.md`, agents hallucinate constraints or fail to load the governing decision.

## 2. Decision

We enforce strict **ADR Parity** across `CONTEXT.md` Section 3, `docs/adr/README.md`, and the `docs/adr/` directory:
1. Every `accepted` ADR row in `CONTEXT.md` Section 3 must include an ADR ID (`ADR-NNNN`), Status, Scope, Confluence Page ID (`CONF-ADR-NNNN`), and a valid local mirror path (`docs/adr/NNNN-*.md`).
2. The `governance` **Deep Module** (`src/modules/governance/index.mjs`) parses the `CONTEXT.md` ADR registry table and verifies that every referenced local mirror file physically exists on disk and is indexed in `docs/adr/README.md`.
3. Whenever `@architect` mints a new ADR (`/create-adr`), it publishes to Confluence MCP (`confluence_create_page`), writes the local mirror (`docs/adr/NNNN-*.md`), and registers the row in both `docs/adr/README.md` and `CONTEXT.md`.

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```js
// Public entry point: src/modules/governance/index.mjs
export function parseAdrRegistry(contextMarkdown) { ... }
export function verifyGovernance(input) { ... }
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Store ADRs Only in Confluence (No Local Mirror or Registry Check)
- **Pros**: No markdown files to commit in Git.
- **Cons**: Offline/CI checks cannot validate ADR alignment without live Confluence credentials; agents lose version-locked ADR history per Git branch.
- **Why Rejected**: Breaks deterministic CI verification in Bitbucket Pipelines.

### Alternative 2: Store ADRs Only in Git (Ignore Confluence)
- **Pros**: Simple Git-only workflow.
- **Cons**: Cross-team architects and product stakeholders who review decisions in Confluence are cut out of the loop.
- **Why Rejected**: Hybrid sync (`CONTEXT.md` + `docs/adr/` + Confluence MCP) serves both IDE coding agents and enterprise Confluence governance.

## 4. Consequences & Merge Danger

### Positive
- Zero broken ADR links or phantom decisions in `CONTEXT.md`.
- Offline tests and CI pipelines can deterministically audit ADR coverage in milliseconds.

### Negative & Trade-Offs
- Adding a new ADR requires updating both the `docs/adr/NNNN-*.md` file and the index rows in `CONTEXT.md` and `docs/adr/README.md`.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door`
- **Blast Radius**: `Repository-Wide`
- **Verification Gate**: Enforced by `verifyGovernance` in `tests/governance.seam.test.mjs` and `./scripts/verify-governance.sh`.
