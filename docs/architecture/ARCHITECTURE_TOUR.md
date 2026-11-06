# Imagine & Understand the Project: `adr-governed-software-factory` Architecture Tour

> **Cognitive Onboarding Guide (`ADR-0008` — DRD-05)**
> Automatically synthesized from live codebase structure, module seams, and Git archaeology.

---

## 1. The 60-Second Mental Model & Core Metaphor

Imagine **`adr-governed-software-factory`** as a coordinated network of **8 encapsulated bounded contexts** running on **`node-esm`** (33 files, 4753 lines of code) organized under a **`deep-modules`** architecture:

- **How to Picture It**: Instead of a tangled monolith where any file can mutate any other file, each subsystem in `adr-governed-software-factory` acts as a **Deep Module** (`ADR-0001`). Callers interact strictly through narrow front doors (`index.*`), while complex algorithms, parsers, and domain rules live inside private `lib/` rooms behind the seam.
- **Delivery & Persistence**: External callers invoke the system via **`cli`**, while state is governed via **`Living Documentation & Deterministic JSON Artifacts`**.

---

## 2. What Has Been Built (Capability & Deep Module Inventory)

Below is the complete inventory of subsystems currently built and active in `adr-governed-software-factory`:

- **`discovery` Module (`src/modules/discovery`)**:
  - **Public Seam**: `src/modules/discovery/index.mjs` -> exports `discoverPractices()`, `analyzeCodebase()`, `mineGitArchaeology()`, `synthesizeRetroAdrs()`
  - **Encapsulation Depth**: 1151 total lines (1134 hidden inside 4 internal file(s); **Depth Ratio: 283.5**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0002`, `ADR-0003`, `ADR-0004`, `ADR-0005`, `ADR-0007`, `ADR-0008`
- **`governance` Module (`src/modules/governance`)**:
  - **Public Seam**: `src/modules/governance/index.mjs` -> exports `verifyGovernance()`, `parseAdrRegistry()`, `checkAdrParity()`, `checkSeamViolations()`, `checkStructuralDrift()`, `checkDeleteZoneViolations()`
  - **Encapsulation Depth**: 342 total lines (287 hidden inside 3 internal file(s); **Depth Ratio: 47.83**)
  - **Coupling Profile**: Fan-In `2` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0003`, `ADR-0004`
- **`gsd` Module (`src/modules/gsd`)**:
  - **Public Seam**: `src/modules/gsd/index.mjs` -> exports `resolveGsdPaths()`, `validatePlanningAdrAlignment()`, `inspectGsdWorkspace()`
  - **Encapsulation Depth**: 247 total lines (236 hidden inside 1 internal file(s); **Depth Ratio: 78.67**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `1` (dependencies) | Instability `1`
  - **Governing ADRs**: `ADR-0001`, `ADR-0006`
- **`learning` Module (`src/modules/learning`)**:
  - **Public Seam**: `src/modules/learning/index.mjs` -> exports `checkRuleConflict()`, `recordLearnedRule()`, `listLearnedRules()`
  - **Encapsulation Depth**: 169 total lines (158 hidden inside 1 internal file(s); **Depth Ratio: 52.67**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0001`, `ADR-0007`
- **`review` Module (`src/modules/review`)**:
  - **Public Seam**: `src/modules/review/index.mjs` -> exports `assessMergeDanger()`, `generateVisualPrBody()`
  - **Encapsulation Depth**: 182 total lines (174 hidden inside 2 internal file(s); **Depth Ratio: 87**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0003`, `ADR-0005`, `ADR-0007`
- **`sensors` Module (`src/modules/sensors`)**:
  - **Public Seam**: `src/modules/sensors/index.mjs` -> exports `runSensors()`, `checkRequiredSections()`, `checkClaimSources()`, `checkTraceability()`, `emitVerificationReceipt()`, `checkVerificationReceipt()`
  - **Encapsulation Depth**: 249 total lines (235 hidden inside 1 internal file(s); **Depth Ratio: 39.17**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `1` (dependencies) | Instability `1`
  - **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0006`, `ADR-0007`
- **`sizing` Module (`src/modules/sizing`)**:
  - **Public Seam**: `src/modules/sizing/index.mjs` -> exports `classifyTaskSize()`
  - **Encapsulation Depth**: 215 total lines (208 hidden inside 1 internal file(s); **Depth Ratio: 208**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0001`, `ADR-0002`, `ADR-0007`
- **`visualizer` Module (`src/modules/visualizer`)**:
  - **Public Seam**: `src/modules/visualizer/index.mjs` -> exports `generateArchitectureVisuals()`, `generateArchitectureTour()`, `generateInteractiveExplorerHtml()`
  - **Encapsulation Depth**: 712 total lines (697 hidden inside 3 internal file(s); **Depth Ratio: 232.33**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0001`, `ADR-0008`

---

## 3. Anatomy of an Execution Flow (Traced Walkthrough)

When a command or request enters `adr-governed-software-factory`, execution flows through deterministic seams:

1. **Step 1 — `discovery` Seam (`src/modules/discovery/index.mjs`)**: Invokes `discoverPractices()`, delegating internal work across 4 encapsulated implementation file(s).
2. **Step 2 — `governance` Seam (`src/modules/governance/index.mjs`)**: Invokes `verifyGovernance()`, delegating internal work across 3 encapsulated implementation file(s).
3. **Step 3 — `gsd` Seam (`src/modules/gsd/index.mjs`)**: Invokes `resolveGsdPaths()`, delegating internal work across 1 encapsulated implementation file(s).
4. **Step 4 — `learning` Seam (`src/modules/learning/index.mjs`)**: Invokes `checkRuleConflict()`, delegating internal work across 1 encapsulated implementation file(s).
5. **Step 5 — `review` Seam (`src/modules/review/index.mjs`)**: Invokes `assessMergeDanger()`, delegating internal work across 2 encapsulated implementation file(s).

- **Cross-Module Edges Verified**: 2 directed module-to-module dependency link(s) (0 seam violation(s), 0 circular dependency cycle(s)).

---

## 4. Why It Is Shaped This Way (Architectural Decisions & Epochs)

### Core Architectural Decisions (Synthesized & Verified)
- **`ADR-0001` (Standardize on NODE-ESM Runtime and deep-modules Layout)** — Status: `accepted` (100% adherence)
- **`ADR-0002` (Enforce Deep Module Public Seams and Prohibit Cross-Module Internal Imports)** — Status: `accepted` (100% adherence)
- **`ADR-0003` (File-Backed Living Documents & Deterministic JSON State Persistence)** — Status: `accepted` (100% adherence)
- **`ADR-0004` (Expose Capabilities via CLI Transport Adapter)** — Status: `accepted` (100% adherence)
- **`ADR-0005` (Enforce Public Seam Testing via node:test and Automated CI Gates)** — Status: `accepted` (100% adherence)

### Key Historical Epochs from Git Archaeology (9 commits analyzed)
- `2026-11-05` [`128172c`] (**module-seam-evolution**): feat(ARCH-9): Phase 6 Dogfooding Remediation & Enterprise Hardening
- `2026-11-05` [`2434075`] (**governance-hardening**): fix(sensors): scope claim-sources sensor strictly to markdown documents
- `2026-11-05` [`6888157`] (**architecture-adr**): feat(ARCH-8): synthesize Amazon AI-DLC capabilities into Software Factory (ADR-0007)
- `2026-11-03` [`1af3061`] (**architecture-adr**): feat(ARCH-7): rebuild and wire Software Factory through native GSD Framework (ADR-0006)
- `2026-11-03` [`457d4ab`] (**feature-slice**): feat: integrate Software Factory with existing GSD framework via config bridge and ADR gates
- `2026-11-02` [`ae62260`] (**architecture-adr**): feat(ARCH-100): dogfood Wayfinder, Grill-With-Docs, ADRs 0001-0005, RFC-0001 & 4-Gate TDD Factory Engine

---

## 5. Safe Extension Guide & One-Way Door Warnings

### Where to Build Next (Two-Way Door Extension Seams)
- To add a new capability within an existing domain, implement the private logic inside `src/modules/<domain>/lib/` and expose only a named function in `src/modules/<domain>/index.mjs`.
- Write public-seam tests in `tests/<domain>.seam.test.mjs` using `node:test` without importing private `/lib/` files.

### High-Gravity One-Way Door Zones (Require ADR/RFC & Rollback Plan)
- **`src/modules/governance/index.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)
- **`src/modules/governance/lib/adr-registry-parser.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)
- **`src/modules/governance/lib/drift-checker.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)
- **`src/modules/governance/lib/seam-checker.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)
- **`CONTEXT.md`** (Module: `root`, Gravity Score: `4`, Fan-In: `0`)

### Delete-Zone & Anti-Patterns to Never Copy
- Never import private `/lib/` or `/internal/` files across module boundaries (`ADR-0001`).
- Never use `export *` barrel re-exports in module entry points (`ADR-0001`).
