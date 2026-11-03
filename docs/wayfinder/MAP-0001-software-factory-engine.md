# Wayfinder Map: Executable ADR-Governed Software Factory Engine (`MAP-0001`)

- **Labels**: `wayfinder:map`
- **Status**: `cleared` (All Frontier Decision Tickets Resolved -> Graduated to `ADR-0001..0005` & `RFC-0001`)

---

## Destination

Deliver a complete, self-verifying **ADR-Governed Software Factory Engine** (`src/modules/sizing`, `src/modules/governance`, `src/modules/review`, and `src/cli/factory.mjs`) governed by `accepted` ADRs (`ADR-0000`–`ADR-0005`) and `RFC-0001`, enabling engineers and Copilot agents to classify task size (`Small [S]` | `Medium [M]` | `Large [L]`), enforce Deep Module seams and ADR parity, and generate Two-Axis `/visual-pr` Merge Danger assessments.

## Notes

- **Domain**: Software Factory Governance, Deep Module Architecture, Adaptive Agent Sizing, Two-Axis PR Verification.
- **Skills Consulted**: `wayfinder`, `grill-with-docs` (`grilling` + `domain-modeling`), `codebase-design`, `architecture-decision-records`, `show-me`, `tdd`, `code-review`, `visual-pr`.
- **Standing Preferences**:
  1. Zero external npm runtime dependencies so `factory` runs natively on any Node.js `>=18` environment in `< 500ms`.
  2. Strict **Deep Module** encapsulation: every module in `src/modules/<name>/` exposes a single `index.mjs` public **Interface** at its **Seam** and hides implementation inside `lib/`.
  3. All tests live at the public **Seam** (`index.mjs`), never mocking private `lib/` internals.

---

## Grill-With-Docs Design Tree (`grilling` + `domain-modeling`)

### Round 1 — Architectural Frontier

❓ **Q1 (`wayfinder:grilling`) — Runtime & Dependency Footprint for the Factory Engine**:
Should the executable Software Factory CLI and governance modules depend on third-party npm packages (e.g., `commander`, `ts-morph`, `zod`), or be built as zero-dependency native Node.js ESM modules using `node:test`, `node:fs`, and `node:util`?

➡️ **Resolution (`DT-01` -> [`ADR-0004`](../adr/0004-deterministic-governance-cli.md))**:
Use **zero-dependency Node.js ESM (`>=18`)** with `node --test`. Enterprise repositories across polyglot stacks (Java, Python, TypeScript, Go) must be able to run `./scripts/verify-governance.sh` and `node src/cli/factory.mjs` instantaneously in git hooks and Bitbucket Pipelines without `node_modules` installation delays or supply-chain lockfile conflicts.

---

❓ **Q2 (`wayfinder:grilling`) — Adaptive Agent Sizing (`Small [S]` | `Medium [M]` | `Large [L]`) & Safety Escalation**:
When an engineer runs a task (e.g., *"change color of a button"*), how should the **Sizing Classifier** balance zero-friction developer velocity (`Small [S]`) against accidental **Architectural Drift**? Specifically, what happens if an engineer passes `[S]` / `/quick`, but their change modifies `package.json`, a database migration, or imports another module's private `lib/` folder?

➡️ **Resolution (`DT-02` -> [`ADR-0002`](../adr/0002-adaptive-agent-sizing-classifier.md))**:
Implement a **Dual-Mode Sizing Classifier with Safety Escalation**:
1. **User Override Mode**: Honors explicit `[S]`, `[M]`, `[L]` (or `--small`, `--medium`, `--large`, `/quick`) flags.
2. **Auto-Detection Mode**: Classifies UI/color/copy/style/constant tweaks touching `<= 2` files with zero contract changes as **`Small [S]`** (`skipResearch: true`, `skipConfluenceMcp: true`, `skipShowMe: true`); features within existing ADRs as **`Medium [M]`**; and new dependencies/schemas/modules or ADR drift as **`Large [L]`** (`hardStopForAdrOrRfc: true`).
3. **Safety Escalation Guard**: If a `Small [S]` task touches package manifests, DB migrations, or `docs/adr/`, the classifier automatically escalates it to **`Large [L]`** and explains why.

---

❓ **Q3 (`wayfinder:grilling`) — Hybrid `CONTEXT.md` <-> Confluence MCP & Local `docs/adr/` Parity**:
In a multi-engineer team using Bitbucket + Confluence MCP, how do we prevent `CONTEXT.md` from pointing to phantom or missing ADRs?

➡️ **Resolution (`DT-03` -> [`ADR-0003`](../adr/0003-hybrid-adr-confluence-sync.md))**:
Enforce **ADR Parity**: every `accepted` ADR row in `CONTEXT.md` Section 3 must specify both a Confluence Page reference (`CONF-ADR-NNNN`) **and** a valid local markdown file in `docs/adr/NNNN-*.md` (also indexed in `docs/adr/README.md`). The `governance` Deep Module deterministically verifies 1:1 parity between `CONTEXT.md`, `docs/adr/README.md`, and the filesystem on every push.

---

### Round 2 — Deep Module Seams & PR Verification Frontier (Unblocked by Round 1)

❓ **Q4 (`wayfinder:grilling`) — Deep Module Decomposition & Public Seams (`Design-It-Twice`)**:
Should the factory engine be structured as a flat collection of utility scripts or as narrow **Deep Modules**? Where do the public **Seams** sit?

➡️ **Resolution (`DT-04` -> [`ADR-0001`](../adr/0001-deep-module-boundaries.md), [`ADR-0005`](../adr/0005-two-axis-review-and-merge-danger.md))**:
Decompose the engine into three **Deep Modules** under `src/modules/`, each exposing a minimal public **Interface** via `index.mjs` while hiding all parsing, regex, heuristic scoring, and formatting inside `lib/`:
1. **`src/modules/sizing/index.mjs`**: Exposes `classifyTaskSize(input)` -> returns `{ size, label, mode, escalated, escalationReason, skipResearch, skipConfluenceMcp, skipShowMe, hardStopForAdrOrRfc, requiredGates, recommendedAgentCommand }`.
2. **`src/modules/governance/index.mjs`**: Exposes `verifyGovernance(input)` and `parseAdrRegistry(contextMarkdown)` -> checks Deep Module Seam Violations, Structural Drift without ADR/Context updates, Delete-Zone violations, and `CONTEXT.md` <-> `docs/adr/` ADR Parity.
3. **`src/modules/review/index.mjs`**: Exposes `assessMergeDanger(input)` and `generateVisualPrBody(input)` -> computes `door` (`One-Way Door` vs `Two-Way Door`), `blastRadius` (`Localized`, `Module-Wide`, `System-Wide`), Two-Axis Review status, and formats the complete `/visual-pr` Markdown payload.

---

## Decisions so far

- [Lock Zero-Dependency Node ESM Runtime for Factory Engine (`DT-01`)](../adr/0004-deterministic-governance-cli.md): Use native Node.js ESM (`>=18`) and `node --test` so governance and sizing checks run in `< 500ms` without third-party dependencies.
- [Define Dual-Mode Adaptive Agent Sizing & Safety Escalation (`DT-02`)](../adr/0002-adaptive-agent-sizing-classifier.md): Support explicit `[S]`/`[M]`/`[L]` overrides and `<3s` auto-detection; `Small [S]` skips research/Confluence/show-me unless structural files (`package.json`, schemas, ADRs) are touched.
- [Enforce Bi-Directional `CONTEXT.md`, Confluence & `docs/adr/` Parity (`DT-03`)](../adr/0003-hybrid-adr-confluence-sync.md): Every ADR in `CONTEXT.md` Section 3 must have both a Confluence ID and a verified local mirror in `docs/adr/`.
- [Establish Three Deep Modules & Two-Axis Merge Danger Engine (`DT-04`)](../adr/0001-deep-module-boundaries.md): Encapsulate `sizing`, `governance`, and `review` behind `index.mjs` seams with private `lib/` implementations tested via Tracer-Bullet TDD.

## Not yet specified

*(Empty — all fog cleared and graduated into [`RFC-0001`](../rfc/RFC-0001-executable-software-factory-engine.md) Tracer-Bullet slices).*

## Out of scope

- **Hosted Web Dashboard UI**: Out of scope for this map; engineers interact natively through VS Code GitHub Copilot Chat (`@onboarding`, `@architect`, `@engineer`, `@pr-reviewer`), Git hooks, and the `factory` CLI.
