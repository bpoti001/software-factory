# ADR-0001: Deep Module Boundaries & Single Entry-Point Encapsulation

- **Date**: 2026-11-02
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0001` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0001`)
- **Jira Ticket / Epic**: `ARCH-2`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/sizing/`, `src/modules/governance/`, `src/modules/review/`, and all domain modules under `src/modules/*`

---

## 1. Context & Problem Statement

In AI-assisted codebases, coding agents frequently import internal helper files across directories (`../../other-module/lib/helper.js`) or create shallow pass-through wrappers. When callers and tests reach past a module's public **Seam** into its private **Implementation**, refactoring internal logic breaks callers and tests across the entire repository, destroying **Locality** and **Leverage**.

## 2. Decision

We structure every domain subsystem in `src/modules/<domain>/` as a **Deep Module** (Ousterhout):
1. Each module exposes a single, narrow public **Interface** at `src/modules/<domain>/index.mjs` (or `index.ts`).
2. All parsing, heuristics, adapters, and helper logic reside inside `src/modules/<domain>/lib/`.
3. Cross-module imports reaching directly into another module's `/lib/` or `/internal/` directory are strictly prohibited (**Seam Violations**) and blocked by `verifyGovernance` in pre-push hooks and CI.
4. All unit and integration tests attach strictly to the public `index.mjs` **Seam**, never to private `lib/` functions.

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```js
// Public entry point: src/modules/<domain>/index.mjs
// Callers and seam tests ONLY import from this file.
// Everything inside src/modules/<domain>/lib/* is private implementation.
export { classifyTaskSize } from './lib/classifier.mjs';
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Flat Utility Modules or Barrel Re-Exports (`export * from './lib/*'`)
- **Pros**: Zero upfront thought required to expose functions.
- **Cons**: Creates a **Shallow Module** where the interface is as wide as the implementation; callers couple to internal data shapes.
- **Why Rejected**: Fails the **Deletion Test** and causes shotgun surgery during refactoring.

### Alternative 2: Heavy Object-Oriented Class Hierarchies with Abstract Factories
- **Pros**: Formal encapsulation via `private` class fields.
- **Cons**: High ceremonial boilerplate when only 1–2 pure functions are needed at the seam.
- **Why Rejected**: Module-level encapsulation with a narrow `index.mjs` entry point and deterministic seam checking provides stronger boundaries with simpler functional interfaces.

## 4. Consequences & Merge Danger

### Positive
- High **Leverage** for callers and agents: reading `src/modules/<domain>/index.mjs` reveals 100% of the contract without loading internal implementation files into context.
- High **Locality** for maintainers: internal algorithms inside `lib/` can be rewritten without breaking a single test or caller.

### Negative & Trade-Offs
- Requires discipline to design narrow input/output contracts before writing internal helpers.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door`
- **Blast Radius**: `Module-Wide`
- **Verification Gate**: Enforced deterministically by `src/modules/governance/index.mjs` (`checkSeamViolations`) and `./scripts/verify-governance.sh`.
