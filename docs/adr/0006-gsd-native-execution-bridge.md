# ADR-0006: Native GSD Framework Bridge & `.planning/` ADR Traceability

- **Date**: 2026-11-03
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0006` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0006`)
- **Jira Ticket / Epic**: `ARCH-7`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/gsd/`, `src/cli/factory.mjs`, `.planning/`

---

## 1. Context & Problem Statement

Engineers use the **GSD (Get Shit Done) Framework** (`~/.gemini/antigravity/gsd-core/bin/gsd-tools.cjs` and `.planning/`) for milestone roadmapping, wave-based phase planning (`PLAN.md`), and execution state tracking (`STATE.md`, `SUMMARY.md`). Rebuilding GSD's state machine inside the Software Factory would violate DRY and create split-brain state, whereas running GSD without connecting it to `CONTEXT.md` could allow phase plans (`PLAN.md`) to execute without referencing governing ADRs.

## 2. Decision

We introduce a dedicated **`gsd` Deep Module** (`src/modules/gsd/index.mjs`) and CLI subcommand (`node src/cli/factory.mjs gsd <status|validate>`) that acts as an **Adapter** over the installed GSD Framework (`gsd-tools.cjs`) and enforces ADR traceability across `.planning/`:
1. **Delegate Tactical State to `gsd-tools.cjs`**: The `gsd` Deep Module invokes `~/.gemini/antigravity/gsd-core/bin/gsd-tools.cjs` (`roadmap analyze`, `state-snapshot`, `verify-summary`) rather than re-implementing GSD's roadmap or state parsers.
2. **Enforce `.planning/` <-> `CONTEXT.md` ADR Alignment**: Every phase in `.planning/ROADMAP.md` and every executable plan in `.planning/phases/*/*-PLAN.md` must cite at least one `accepted` `ADR-NNNN` from `CONTEXT.md` Section 3.
3. **Wire GSD Verification Hook**: `.planning/config.json` sets `workflow.code_review_command` to `./scripts/verify-governance.sh` so GSD phase verification automatically enforces Deep Module seams (`ADR-0001`) and ADR parity (`ADR-0003`).

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```js
// Public entry point: src/modules/gsd/index.mjs
export function resolveGsdPaths(options) { ... }
export function validatePlanningAdrAlignment(input) { ... }
export function inspectGsdWorkspace(options) { ... }
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Rebuild a Custom Phase/Roadmap State Machine in `src/`
- **Pros**: No reliance on `~/.gemini/antigravity/gsd-core`.
- **Cons**: Duplicates 50+ GSD workflows and `gsd-tools.cjs` commands; diverges from the team's existing GSD muscle memory.
- **Why Rejected**: Violates "Integrate, Don't Rebuild."

### Alternative 2: Documentation-Only Integration Without a Programmatic Seam
- **Pros**: Zero code to write.
- **Cons**: Cannot deterministically verify that `.planning/phases/*/*-PLAN.md` files cite valid `accepted` ADRs from `CONTEXT.md` or query live GSD roadmap status from `factory.mjs`.
- **Why Rejected**: A thin, deep adapter (`src/modules/gsd/index.mjs`) provides programmatic verification while delegating phase execution to `gsd-tools.cjs`.

## 4. Consequences & Merge Danger

### Positive
- Zero duplication of GSD internals; `gsd-tools.cjs` remains the single engine for `.planning/`.
- Every GSD phase and plan (`01-01-PLAN.md` .. `04-01-PLAN.md`) is provably linked to `accepted` ADRs in `CONTEXT.md`.

### Negative & Trade-Offs
- Requires `.planning/` artifacts (`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, and phase `PLAN.md`/`SUMMARY.md` files) to be maintained alongside `CONTEXT.md`.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door`
- **Blast Radius**: `Module-Wide`
- **Verification Gate**: Enforced via `tests/gsd.seam.test.mjs`, `node src/cli/factory.mjs gsd validate`, and `gsd-tools.cjs verify-summary`.
