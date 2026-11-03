# Roadmap: ADR-Governed Software Factory

## Overview

Build and verify the complete ADR-Governed Software Factory across 4 GSD phases—progressing from the Adaptive Agent Sizing Classifier (`Phase 1`), to the Deep Module Seam & ADR Parity Governance Engine (`Phase 2`), the Two-Axis Merge Danger & `/visual-pr` Engine (`Phase 3`), and the Native GSD Framework Bridge (`Phase 4`).

## Phases

- [x] **Phase 1: Adaptive Agent Sizing Engine** - Dual-mode `Small [S]` / `Medium [M]` / `Large [L]` classifier with Safety Escalation (`ADR-0001`, `ADR-0002`)
- [x] **Phase 2: Governance, Seam & ADR Parity Engine** - Deterministic Deep Module seam, structural drift, Delete-Zone, and `CONTEXT.md` <-> `docs/adr/` parity verifier (`ADR-0001`, `ADR-0003`, `ADR-0004`)
- [x] **Phase 3: Two-Axis Review & Merge Danger Engine** - `One-Way` vs. `Two-Way Door` scorer and `/visual-pr` Markdown generator (`ADR-0001`, `ADR-0005`)
- [x] **Phase 4: Native GSD Framework Bridge & CLI** - `src/modules/gsd/index.mjs` adapter over `gsd-tools.cjs` and `.planning/` ADR traceability verifier (`ADR-0001`, `ADR-0006`) (completed 2026-11-03)

## Phase Details

### Phase 1: Adaptive Agent Sizing Engine

**Goal**: Deliver `src/modules/sizing/index.mjs` (`classifyTaskSize`) governed by `ADR-0001` and `ADR-0002` so trivial UI tweaks skip research while architectural changes trigger ADR gates.
**Depends on**: Nothing (first phase)
**Requirements**: [REQ-01, REQ-02]
**Success Criteria** (what must be TRUE):

  1. Button color and copy tweaks auto-classify as `Small [S]` with `skipResearch: true`.
  2. Explicit `[S]`/`[M]`/`[L]` flags are honored, and `[S]` auto-escalates to `Large [L]` when `package.json` or migrations are touched.

**Plans**: 1 plan

Plans:

- [x] 01-01: Build and test `src/modules/sizing` Deep Module at public seam (`tests/sizing.seam.test.mjs`)

### Phase 2: Governance, Seam & ADR Parity Engine

**Goal**: Deliver `src/modules/governance/index.mjs` (`verifyGovernance`, `parseAdrRegistry`) governed by `ADR-0001`, `ADR-0003`, and `ADR-0004`.
**Depends on**: Phase 1
**Requirements**: [REQ-03, REQ-04]
**Success Criteria** (what must be TRUE):

  1. Cross-module imports into `/lib/` or `/internal/` are rejected as Seam Violations.
  2. `CONTEXT.md` Section 3, `docs/adr/README.md`, and `docs/adr/*.md` maintain 100% verified parity.

**Plans**: 1 plan

Plans:

- [x] 02-01: Build and test `src/modules/governance` Deep Module at public seam (`tests/governance.seam.test.mjs`)

### Phase 3: Two-Axis Review & Merge Danger Engine

**Goal**: Deliver `src/modules/review/index.mjs` (`assessMergeDanger`, `generateVisualPrBody`) governed by `ADR-0001` and `ADR-0005`.
**Depends on**: Phase 2
**Requirements**: [REQ-05, REQ-06]
**Success Criteria** (what must be TRUE):

  1. Diffs touching schemas, manifests, or ADRs classify as `One-Way Door`; localized changes classify as `Two-Way Door`.
  2. `generateVisualPrBody` outputs `/show-me` file-tree diffs, Merge Danger tables, and Two-Axis Review verdicts.

**Plans**: 1 plan

Plans:

- [x] 03-01: Build and test `src/modules/review` Deep Module at public seam (`tests/review.seam.test.mjs`)

### Phase 4: Native GSD Framework Bridge & CLI

**Goal**: Deliver `src/modules/gsd/index.mjs` (`resolveGsdPaths`, `validatePlanningAdrAlignment`, `inspectGsdWorkspace`) and `node src/cli/factory.mjs gsd <status|validate>` governed by `ADR-0001` and `ADR-0006`.
**Depends on**: Phase 3
**Requirements**: [REQ-07, REQ-08]
**Success Criteria** (what must be TRUE):

  1. `src/modules/gsd/index.mjs` queries `gsd-tools.cjs` (`roadmap analyze`, `state-snapshot`) without duplicating GSD parsers.
  2. `validatePlanningAdrAlignment` verifies that every GSD phase and `PLAN.md` references `accepted` ADRs in `CONTEXT.md`.

**Plans**: 1 plan

Plans:

- [x] 04-01: Build and test `src/modules/gsd` Deep Module and `factory gsd` CLI subcommand (`tests/gsd.seam.test.mjs`)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Adaptive Agent Sizing Engine | 1/1 | Complete | 2026-11-02 |
| 2. Governance, Seam & ADR Parity Engine | 1/1 | Complete | 2026-11-02 |
| 3. Two-Axis Review & Merge Danger Engine | 1/1 | Complete | 2026-11-02 |
| 4. Native GSD Framework Bridge & CLI | 1/1 | Complete    | 2026-11-03 |
