# Imagine & Understand the Project: `adr-governed-software-factory` Architecture Tour

> **Cognitive Onboarding Guide (`ADR-0008` — DRD-05)**
> Automatically synthesized from live codebase structure, module seams, and Git archaeology.

---

## 1. The 60-Second Mental Model & Core Metaphor

Imagine **`adr-governed-software-factory`** as a coordinated network of **9 encapsulated bounded contexts** running on **`node-esm`** (42 files, 7638 lines of code) organized under a **`deep-modules`** architecture:

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
  - **Public Seam**: `src/modules/learning/index.mjs` -> exports `checkRuleConflict()`, `recordLearnedRule()`, `listLearnedRules()`, `REQUIRED_RESEARCH_FACTORY_SKILLS()`, `buildOverseerAuditReport()`, `recordOverseerNudge()`
  - **Encapsulation Depth**: 295 total lines (278 hidden inside 2 internal file(s); **Depth Ratio: 46.33**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `1` (dependencies) | Instability `1`
  - **Governing ADRs**: `ADR-0001`, `ADR-0007`, `ADR-0010`
- **`review` Module (`src/modules/review`)**:
  - **Public Seam**: `src/modules/review/index.mjs` -> exports `assessMergeDanger()`, `generateVisualPrBody()`
  - **Encapsulation Depth**: 182 total lines (174 hidden inside 2 internal file(s); **Depth Ratio: 87**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0003`, `ADR-0005`, `ADR-0007`
- **`scaffolder` Module (`src/modules/scaffolder`)**:
  - **Public Seam**: `src/modules/scaffolder/index.mjs` -> exports `syncGovernanceDocs()`, `scaffoldAdr()`, `scaffoldDeepModule()`, `writeApiRouter()`, `initFoundrySpec()`, `validateFoundrySpec()`, `compileFoundrySpec()`, `verifySpecParity()`, `scaffoldApiService()`
  - **Encapsulation Depth**: 1150 total lines (1123 hidden inside 3 internal file(s); **Depth Ratio: 124.78**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0001`, `ADR-0003`, `ADR-0004`, `ADR-0009`
- **`sensors` Module (`src/modules/sensors`)**:
  - **Public Seam**: `src/modules/sensors/index.mjs` -> exports `runSensors()`, `checkRequiredSections()`, `checkClaimSources()`, `checkTraceability()`, `checkReadPathPurity()`, `checkLatexCitationBijection()`, `checkBenchmarkEmpiricalPurity()`, `checkFileSizeCeiling()`, `checkDynamicReportInterpolation()`, `checkRawRecordProvenance()`, `checkNoScriptedVerdicts()`, `checkUnboundedSubprocessPipe()`, `checkLatexTemplateHygiene()`, `emitVerificationReceipt()`, `checkVerificationReceipt()`
  - **Encapsulation Depth**: 934 total lines (911 hidden inside 4 internal file(s); **Depth Ratio: 60.73**)
  - **Coupling Profile**: Fan-In `0` (dependents) | Fan-Out `1` (dependencies) | Instability `1`
  - **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0006`, `ADR-0007`, `ADR-0010`
- **`sizing` Module (`src/modules/sizing`)**:
  - **Public Seam**: `src/modules/sizing/index.mjs` -> exports `classifyTaskSize()`, `resolveModelRouting()`
  - **Encapsulation Depth**: 249 total lines (242 hidden inside 1 internal file(s); **Depth Ratio: 121**)
  - **Coupling Profile**: Fan-In `1` (dependents) | Fan-Out `0` (dependencies) | Instability `0`
  - **Governing ADRs**: `ADR-0001`, `ADR-0002`, `ADR-0007`, `ADR-0010`
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
4. **Step 4 — `learning` Seam (`src/modules/learning/index.mjs`)**: Invokes `checkRuleConflict()`, delegating internal work across 2 encapsulated implementation file(s).
5. **Step 5 — `review` Seam (`src/modules/review/index.mjs`)**: Invokes `assessMergeDanger()`, delegating internal work across 2 encapsulated implementation file(s).

- **Cross-Module Edges Verified**: 3 directed module-to-module dependency link(s) (0 seam violation(s), 0 circular dependency cycle(s)).

---

## 4. Why It Is Shaped This Way (Architectural Decisions & Epochs)

### Core Architectural Decisions (Synthesized & Verified)
- **`ADR-0001` (Standardize on NODE-ESM Runtime and deep-modules Layout)** — Status: `accepted` (100% adherence)
- **`ADR-0002` (Enforce Deep Module Public Seams and Prohibit Cross-Module Internal Imports)** — Status: `accepted` (100% adherence)
- **`ADR-0003` (File-Backed Living Documents & Deterministic JSON State Persistence)** — Status: `accepted` (100% adherence)
- **`ADR-0004` (Expose Capabilities via CLI Transport Adapter)** — Status: `accepted` (100% adherence)
- **`ADR-0005` (Enforce Public Seam Testing via node:test and Automated CI Gates)** — Status: `accepted` (100% adherence)

### Key Historical Epochs from Git Archaeology (21 commits analyzed)
- `2026-11-20` [`8283a91`] (**feature-slice**): docs(pr): update PR_DESCRIPTION.md with ENH-0017..0019 and 58/58 test receipt
- `2026-11-20` [`651d915`] (**module-seam-evolution**): feat(overseer): implement ENH-0017..0019 (subprocess pipe, mtime fix, LaTeX template hygiene; 58 tests)
- `2026-11-19` [`27cd8d5`] (**architecture-adr**): feat(overseer): implement ENH-0013..0016 provenance sensors, honest role routing, 56 tests, and PR_DESCRIPTION.md
- `2026-11-19` [`4487858`] (**feature-slice**): feat(overseer): record ENH-0013 dynamic JSON interpolation nudge from Neon Gate-6 sign-off
- `2026-11-19` [`656b1e9`] (**module-seam-evolution**): feat(overseer): record ENH-0011..0012 and add checkFileSizeCeiling 1,000-LOC sensor
- `2026-11-19` [`fe4020d`] (**module-seam-evolution**): feat(overseer): record ENH-0010 and add checkBenchmarkEmpiricalPurity sensor

---

## 5. Safe Extension Guide & One-Way Door Warnings

### Where to Build Next (Two-Way Door Extension Seams)
- To add a new capability within an existing domain, implement the private logic inside `src/modules/<domain>/lib/` and expose only a named function in `src/modules/<domain>/index.mjs`.
- Write public-seam tests in `tests/<domain>.seam.test.mjs` using `node:test` without importing private `/lib/` files.

### High-Gravity One-Way Door Zones (Require ADR/RFC & Rollback Plan)
- **`CONTEXT.md`** (Module: `root`, Gravity Score: `8`, Fan-In: `0`)
- **`docs/adr/README.md`** (Module: `root`, Gravity Score: `8`, Fan-In: `0`)
- **`src/modules/governance/index.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)
- **`src/modules/governance/lib/adr-registry-parser.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)
- **`src/modules/governance/lib/drift-checker.mjs`** (Module: `governance`, Gravity Score: `6`, Fan-In: `2`)

### Delete-Zone & Anti-Patterns to Never Copy
- Never import private `/lib/` or `/internal/` files across module boundaries (`ADR-0001`).
- Never use `export *` barrel re-exports in module entry points (`ADR-0001`).
