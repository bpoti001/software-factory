# Roadmap: ADR-Governed Software Factory

## Overview

Build and verify the complete ADR-Governed Software Factory across 4 GSD phases—progressing from the Adaptive Agent Sizing Classifier (`Phase 1`), to the Deep Module Seam & ADR Parity Governance Engine (`Phase 2`), the Two-Axis Merge Danger & `/visual-pr` Engine (`Phase 3`), and the Native GSD Framework Bridge (`Phase 4`).

## Phases

- [x] **Phase 1: Adaptive Agent Sizing Engine** - Dual-mode `Small [S]` / `Medium [M]` / `Large [L]` classifier with Safety Escalation (`ADR-0001`, `ADR-0002`)
- [x] **Phase 2: Governance, Seam & ADR Parity Engine** - Deterministic Deep Module seam, structural drift, Delete-Zone, and `CONTEXT.md` <-> `docs/adr/` parity verifier (`ADR-0001`, `ADR-0003`, `ADR-0004`)
- [x] **Phase 3: Two-Axis Review & Merge Danger Engine** - `One-Way` vs. `Two-Way Door` scorer and `/visual-pr` Markdown generator (`ADR-0001`, `ADR-0005`)
- [x] **Phase 4: Native GSD Framework Bridge & CLI** - `src/modules/gsd/index.mjs` adapter over `gsd-tools.cjs` and `.planning/` ADR traceability verifier (`ADR-0001`, `ADR-0006`) (completed 2026-11-03)
- [x] **Phase 5: Amazon AI-DLC Synthesis Architecture & Capability Engine** - Intent profiles, deterministic sensors, self-learning loop, verification receipts, and brownfield discovery (`ADR-0001`, `ADR-0007`) (completed 2026-11-05)
- [x] **Phase 6: Dogfooding Remediation & Enterprise Hardening** - Multi-line seam parser, git status -uall, two-way ADR parity, honest test verification receipts, test fixture isolation, and GitHub Actions CI (`ADR-0001`, `ADR-0003`, `ADR-0004`, `ADR-0005`, `ADR-0007`) (completed 2026-11-05)

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

### Phase 5: Amazon AI-DLC Synthesis Architecture & Capability Engine

**Goal**: Deliver AI-DLC capabilities: Intent Profiles in `src/modules/sizing`, Deterministic Sensors in `src/modules/sensors`, Self-Learning Rule Loop in `src/modules/learning`, Brownfield Discovery in `src/modules/discovery`, and Operations Gate in `src/modules/review`, governed by `ADR-0001` and `ADR-0007`.
**Depends on**: Phase 4
**Requirements**: [REQ-09, REQ-10, REQ-11]
**Success Criteria** (what must be TRUE):

  1. `classifyTaskSize` identifies Intent Profiles (`ui-tweak`, `bugfix`, `refactor`, `security-patch`, `infra`, `poc`, `feature`, `enterprise`) with orthogonal `depth` and `testStrategy`.
  2. `runSensors` executes deterministic checks (`required-sections`, `traceability`, `claim-sources`, `receipt`) and catches missing sections or orphaned ADRs.
  3. `recordLearnedRule` captures human corrections with SHA-256 provenance hashes and checks against org policies.
  4. `factory verify` produces `.planning/VERIFICATION_RECEIPT.json` and `factory pr-report` verifies receipt binding and operations rollback plan for One-Way Doors.
  5. `discoverPractices` analyzes brownfield repos and scaffolds initial governance.

**Plans**: 1 plan

Plans:

- [x] 05-01: Implement and test AI-DLC modules (sizing intent profiles, sensors, learning, discovery, operations gate, verification receipts) (`tests/aidlc.seam.test.mjs`)

### Phase 6: Dogfooding Remediation & Enterprise Hardening

**Goal**: Resolve all 18 blindspots exposed in dogfooding: multi-line and require() seam parser, git status -uall, two-way ADR parity, honest test verification receipts, test fixture isolation, and GitHub Actions CI, governed by `ADR-0001`, `ADR-0003`, `ADR-0004`, `ADR-0005`, and `ADR-0007`.
**Depends on**: Phase 5
**Requirements**: [REQ-12, REQ-13, REQ-14]
**Success Criteria** (what must be TRUE):

  1. Multi-line imports, CommonJS `require()`, and bare imports into private `/lib/` or `/internal/` are caught as Seam Violations.
  2. Untracked files in newly created module directories are analyzed prior to commit (`git status -uall`).
  3. `verifyGovernance` enforces two-way ADR parity (detects shadow ADRs on disk omitted from `CONTEXT.md`) and validates that all `src/modules/*` directories are mapped in `CONTEXT.md` Section 2.
  4. `factory verify` executes `npm test` to capture real exit codes, binds receipts to tree hash, and ignores `.planning/VERIFICATION_RECEIPT.json` in git.
  5. Integration tests use isolated temp directories, keeping `CODING_STANDARDS.md` pristine.
  6. CI workflow template `.ci/workflows/ci.yml` is active and passing.

**Plans**: 1 plan

Plans:

- [x] 06-01: Implement remediation plan across governance, sizing, review, CLI, tests, and CI (`tests/remediation.seam.test.mjs`)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Adaptive Agent Sizing Engine | 1/1 | Complete | 2026-11-02 |
| 2. Governance, Seam & ADR Parity Engine | 1/1 | Complete | 2026-11-02 |
| 3. Two-Axis Review & Merge Danger Engine | 1/1 | Complete | 2026-11-02 |
| 4. Native GSD Framework Bridge & CLI | 1/1 | Complete    | 2026-11-03 |
| 5. Amazon AI-DLC Synthesis Architecture & Capability Engine | 1/1 | Complete    | 2026-11-05 |
| 6. Dogfooding Remediation & Enterprise Hardening | 1/1 | Complete | 2026-11-05 |
