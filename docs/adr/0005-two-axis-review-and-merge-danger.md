# ADR-0005: Two-Axis Separate-Context PR Review & Merge Danger (`One-Way` vs `Two-Way Door`) Scoring

- **Date**: 2026-11-02
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0005` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0005`)
- **Jira Ticket / Epic**: `ARCH-6`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/review/`, `.github/agents/pr-reviewer.agent.md`, `CODING_STANDARDS.md`

---

## 1. Context & Problem Statement

As AI coding agents increase code generation velocity, Pull Request review becomes the primary engineering bottleneck. Human reviewers face large diffs without structural summaries or risk triage, while implementer agents whose context windows arestuffed with 500 lines of style guidelines suffer degraded instruction adherence during coding.

## 2. Decision

We separate implementation context from review context and enforce a **Two-Axis Review & Merge Danger Engine** (`src/modules/review/index.mjs` + `@pr-reviewer`):
1. **Separate Review Context**: Detailed coding standards and Fowler's 12 code smells reside in `CODING_STANDARDS.md` and are loaded during the `@pr-reviewer` (`/two-axis-review`) pass rather than bloating `@engineer`.
2. **Two-Axis Evaluation**:
   - **Axis 1 (Standards & ADR Compliance)**: Audits Deep Module seams (`ADR-0001`), immutability, error handling, and `CODING_STANDARDS.md`.
   - **Axis 2 (Spec & Jira Fidelity)**: Audits faithful fulfillment of the Jira ticket acceptance criteria with zero unrequested scope creep.
3. **Deterministic Merge Danger Scoring (`assessMergeDanger`)**:
   - Classifies every diff as **`One-Way Door`** (touches DB schemas/migrations, public contracts, auth/security boundaries, or new dependencies/ADRs) or **`Two-Way Door`** (reversible internal module changes, UI tweaks, or tests).
   - Computes **Blast Radius** (`Localized` for `<= 2` files in 1 module, `Module-Wide` for `> 2` files within 1 module, `System-Wide` for multi-module or root governance changes).
4. **Visual PR Generation (`generateVisualPrBody`)**: Produces a structured Bitbucket PR description containing the `/show-me` file-tree diff, Merge Danger table, ADR traceability links, and Before/After verification evidence.

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```js
// Public entry point: src/modules/review/index.mjs
export function assessMergeDanger(input) { ... }
export function generateVisualPrBody(input) { ... }
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Single-Pass Self-Review Inside the Implementer Agent
- **Pros**: No second step required.
- **Cons**: An agent that just wrote code in the same context window exhibits confirmation bias and overlooks its own spec drift or standards violations.
- **Why Rejected**: Cold review across two orthogonal axes (Standards vs. Spec) catches both structural smells and missing Jira requirements.

### Alternative 2: Treating All Pull Requests with Equal Human Review Ceremony
- **Pros**: Simple rule.
- **Cons**: Wastes senior architect hours reviewing `Small [S]` `Two-Way Door` button-color PRs while rushing complex `One-Way Door` schema migrations.
- **Why Rejected**: Explicit `One-Way Door` vs. `Two-Way Door` + `Blast Radius` classification focuses human review attention where irreversible risk actually lives.

## 4. Consequences & Merge Danger

### Positive
- Cuts human PR review time from hours to minutes via visual file-tree diffs and automatic `One-Way` vs. `Two-Way Door` triage.
- Ensures every Bitbucket PR documents its governing Jira ticket, Confluence ADR, and test evidence.

### Negative & Trade-Offs
- Requires running `@pr-reviewer` (`/two-axis-review` + `/visual-pr`) or `node src/cli/factory.mjs pr-report` prior to merging `Medium [M]` and `Large [L]` branches.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door`
- **Blast Radius**: `Module-Wide`
- **Verification Gate**: Verified via seam tests in `tests/review.seam.test.mjs`.
