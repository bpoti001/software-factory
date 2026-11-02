# ADR-0000: ADR-Driven Software Factory & Mandatory Documentation Gate

- **Date**: 2026-11-01
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0000` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0000`)
- **Jira Ticket / Epic**: `ARCH-1`
- **Governing Modules (`CONTEXT.md`)**: Repository-Wide (`.github/`, `CONTEXT.md`, `docs/adr/`, `docs/rfc/`, `src/*`)

---

## 1. Context & Problem Statement

As our engineering organization scales AI-assisted development across multiple engineers and architects using VS Code Copilot, unattended or unguided agent loops risk generating high-volume code that drifts from architectural boundaries ("slop"). If engineers build features without referencing or updating Architecture Decision Records (ADRs), the codebase rapidly loses **locality**, accumulates undocumented patterns, and turns Pull Request review into an unmanageable bottleneck.

## 2. Decision

We operate an **ADR-Governed Software Factory** with four custom VS Code Copilot agents (`@onboarding`, `@architect`, `@engineer`, `@pr-reviewer`) wired directly to our existing **Jira MCP**, **Confluence MCP**, and **Bitbucket MCP** servers:

1. **Single Context Hub (`CONTEXT.md`)**: `CONTEXT.md` in Bitbucket is the canonical map and index linking every module to its governing ADRs on Confluence.
2. **Mandatory ADR / RFC Gate**: `@engineer` is prohibited from writing production code for any pattern, library, schema, or cross-module contract not covered by an `accepted` ADR in `CONTEXT.md`. When out-of-bounds work is requested, the agent must halt and invoke `@architect` to either:
   - Mint a **New ADR** (`/create-adr`) for bounded architectural decisions and sync it to Confluence + `CONTEXT.md`.
   - Generate a **Cross-Cutting RFC** (`/create-rfc`) for multi-module or breaking changes and decompose it into vertical **Tracer Bullet** tickets in Jira.
3. **4-Gate Feature Delivery**: Every feature progresses through Product (Jira) -> Architecture (Confluence ADR) -> Program Design (`/show-me` visual outline & signatures) -> Vertical Tracer-Bullet TDD (`/tdd`).
4. **Separate-Context Two-Axis Review**: Detailed coding standards and Martin Fowler code smells live in `CODING_STANDARDS.md` and are enforced by `@pr-reviewer` across two independent axes (**Standards/ADR** and **Spec/Jira**), with every Bitbucket PR carrying a `/visual-pr` outline and **Merge Danger** (`One-Way` vs. `Two-Way` Door) assessment.

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Unattended "Lights-Off" Agent Loops Without ADR Gates
- **Pros**: Fast initial line generation with zero upfront planning.
- **Cons**: Degrades codebase maintainability (SlopCodeBench failure mode), introduces shotgun surgery, and floods Bitbucket with unreviewable PRs.
- **Why Rejected**: Lacks a maintainability oracle; costs months of architectural rework.

### Alternative 2: Stuffing All Rules and ADRs Into a Single Giant `AGENTS.md`
- **Pros**: Single file to edit.
- **Cons**: Exceeds agent instruction-adherence limits, pollutes the implementer agent's context window during coding, and duplicates Confluence documentation.
- **Why Rejected**: Separating `CONTEXT.md` (navigation & ADR pointers + `<important if>` blocks) from `CODING_STANDARDS.md` (read by `@pr-reviewer`) and Confluence ADRs (fetched on demand via MCP) preserves token economy and instruction adherence.

## 4. Consequences & Merge Danger

### Positive
- Every engineer and architect can query `@onboarding` (`/onboard`) to understand project state, active Jira epics, and Confluence ADRs in seconds.
- Zero undocumented code lands in Bitbucket; every PR is traceable to a Jira ticket and a Confluence ADR/RFC.
- Human reviewers receive pre-verified, visually summarized PRs classified by reversibility (`One-Way` vs. `Two-Way` Door).

### Negative & Trade-Offs
- Requires 15–30 minutes of upfront alignment at the ADR/Program Design gate before implementation begins on novel features.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door` (process and agent harness governance)
- **Blast Radius**: `Repository-Wide`
- **Verification Gate**: Enforced by `@pr-reviewer` (`/two-axis-review`) on every Bitbucket PR.
