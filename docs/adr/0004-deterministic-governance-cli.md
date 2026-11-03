# ADR-0004: Deterministic Zero-Dependency Governance CLI (`factory` Engine)

- **Date**: 2026-11-02
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0004` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0004`)
- **Jira Ticket / Epic**: `ARCH-5`
- **Governing Modules (`CONTEXT.md`)**: `src/cli/factory.mjs`, `src/modules/governance/`, `scripts/verify-governance.sh`

---

## 1. Context & Problem Statement

Prompt instructions alone (`copilot-instructions.md` and `AGENTS.md`) are probabilistic (~90–95% adherence). To guarantee 100% enforcement of **Deep Module** seams, **Structural Drift** ADR documentation gates, **ADR Parity**, and **Delete-Zone** rules across local Git hooks (`pre-push`) and Bitbucket Pipelines CI, we need a deterministic executable engine that runs in `< 500ms` without requiring external `npm install` steps.

## 2. Decision

We implement the **Software Factory Engine** (`src/cli/factory.mjs` backed by `src/modules/*`) using **zero external runtime dependencies** on native Node.js ESM (`>=18`) and `node --test`:
1. `node src/cli/factory.mjs size "<task>"` executes the `sizing` **Deep Module** (`ADR-0002`).
2. `node src/cli/factory.mjs verify` executes the `governance` **Deep Module** (`ADR-0001`, `ADR-0003`, `ADR-0004`) across four deterministic checks:
   - **Check 1 (Seam Violations)**: Rejects cross-module imports into private `/lib/` or `/internal/` paths.
   - **Check 2 (Structural Drift Gate)**: Rejects changes to package manifests, DB migrations, or new module directories unless `CONTEXT.md`, `docs/adr/`, or `docs/rfc/` is co-updated.
   - **Check 3 (ADR Registry Parity)**: Verifies that every local mirror path listed in `CONTEXT.md` Section 3 exists on disk and is indexed in `docs/adr/README.md`.
   - **Check 4 (Delete-Zone Guard)**: Rejects recreation of forbidden patterns listed in `CONTEXT.md` Section 5.
3. `node src/cli/factory.mjs pr-report` executes the `review` **Deep Module** (`ADR-0005`).

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```js
// Public entry point: src/modules/governance/index.mjs
/**
 * @param {{
 *   changedFiles: string[],
 *   fileContents?: Record<string, string>,
 *   contextMarkdown?: string,
 *   adrReadmeMarkdown?: string,
 *   existingAdrFiles?: string[]
 * }} input
 * @returns {{
 *   passed: boolean,
 *   seamViolations: Array<{ file: string, line: number, importPath: string, message: string }>,
 *   structuralDriftViolations: Array<{ file: string, message: string }>,
 *   adrParityViolations: Array<{ adrId: string, mirrorPath: string, message: string }>,
 *   deleteZoneViolations: Array<{ file: string, pattern: string, message: string }>
 * }}
 */
export function verifyGovernance(input) { ... }
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Bash-Only Regex Scripts (`grep` / `awk`)
- **Pros**: Runs in shell without Node.
- **Cons**: Hard to unit-test at module seams, brittle markdown table parsing across macOS BSD vs. GNU Linux tools, and cannot expose structured JSON/programmatic interfaces for agents.
- **Why Rejected**: Wrapping a clean Node.js ESM **Deep Module** inside `./scripts/verify-governance.sh` provides full seam testability (`node --test`) plus CLI ergonomics.

### Alternative 2: Heavy TypeScript Compiler + Third-Party AST Libraries (`ts-morph`, `eslint-plugin-boundaries`)
- **Pros**: Full AST resolution.
- **Cons**: Requires gigabytes of `node_modules`, breaks in non-JS repos (Python, Go, Java), and adds 10–30s startup latency to git hooks.
- **Why Rejected**: Zero-dependency Node ESM runs instantaneously across any repository language.

## 4. Consequences & Merge Danger

### Positive
- Sub-second execution (`< 500ms`) in local `pre-push` hooks and Bitbucket Pipelines.
- 100% deterministic seam and ADR verification with zero external supply-chain dependencies.

### Negative & Trade-Offs
- Written in standard Node.js ESM (`.mjs`) with JSDoc type annotations rather than requiring a build/transpile step before execution.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door`
- **Blast Radius**: `Repository-Wide`
- **Verification Gate**: Verified via `node --test` seam test suite in `tests/governance.seam.test.mjs`.
