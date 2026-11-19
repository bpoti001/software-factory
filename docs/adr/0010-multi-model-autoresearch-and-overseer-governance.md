# ADR-0010: Multi-Model Tier Routing, ADR-to-arXiv Autoresearch Bridge, and Continuous Overseer Governance

- **Status**: `accepted`
- **Date**: 2026-11-19
- **Deciders**: `@architect`, `@factory-overseer`, Principal Research & Systems Engineering
- **Confluence Source**: `CONF-ADR-0010` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0010`)
- **Governing Jira Epic**: `ARCH-12`
- **Scope / Bounded Context**: `src/modules/sizing/`, `src/modules/sensors/`, `src/cli/factory.mjs`, `.agents/skills/`

---

## 1. Context & Problem Statement

As the ADR-Governed Software Factory scales from pure software delivery (`ADR-0000` through `ADR-0009`) to unified **Systems & AI Research Engineering** (such as the `Prism-ANN` permission-aware vector retrieval study in `/Users/tejap/memory_paper`), three architectural requirements emerge:

1. **Single-Model Bottleneck Across Distinct Cognitive Modes**: Using a single undifferentiated LLM configuration for upfront architectural theorem design, high-velocity Tracer-Bullet TDD implementation, adversarial code/math verification, and continuous factory supervision sub-optimizes reasoning depth and verification independence.
2. **Disconnect Between Architecture Decisions (ADRs) and Scientific Publications (arXiv Manuscripts)**: In traditional research codebases, design docs, benchmark harnesses, and LaTeX papers drift apart. Alternative designs are forgotten instead of becoming empirical baselines, mathematical definitions diverge from code symbols, and paper metrics risk unverified transcription.
3. **Lack of Continuous Factory Self-Improvement During Live Target Builds**: When agents execute complex research and engineering workflows in target repositories, newly discovered workflow patterns, research skills (`adr-to-arxiv-factory`, `0-autoresearch-skill`, `systems-paper-writing`, `ml-paper-writing`, `academic-plotting`, `thermo-nuclear-code-quality-review`, `blast-radius`, `paper2agent`), and sensor refinements need a deterministic mechanism to flow back into the core Software Factory without disrupting active builds.

---

## 2. Decision

We formalize three interlocking enhancements to the ADR-Governed Software Factory:

### 2.1 Multi-Model Tier Routing (`src/modules/sizing/`)

Every task classified by `classifyTaskSize` (`Small [S]`, `Medium [M]`, `Large [L]`) includes an explicit, immutable `modelRouting` assignment separating Planning, Building, Reviewing, and Factory Oversight across specialized high-reasoning model tiers:

| Role / Agent Persona | Assigned Model Tier | Core Responsibilities & Governing Gates |
|---|---|---|
| **Planner / Researcher (`@architect` / `@orchestrator`)** | `Argon (High Thinking)` | Literature recon (`literature/survey.md`), Wayfinder maps, `ADR`/`RFC` minting, "Design-It-Twice" trade-off analysis, Formal Theorem derivation, and Outer-Loop Autoresearch trajectory synthesis (`DEEPEN` / `BROADEN` / `PIVOT` / `CONCLUDE`). |
| **Builder (`@engineer`)** | `Hydrogen (High Thinking)` | `/show-me` program design blueprints, Deep Module implementation (`src/modules/<domain>/index.*`), Vertical Tracer-Bullet TDD (`/tdd`), Inner-Loop benchmark execution, and deterministic JSON result serialization (`results/*.json`). |
| **Adversarial Reviewer (`@pr-reviewer`)** | `Neon (High Thinking)` | Separate-context Two-Axis Review (`CODING_STANDARDS.md`), Thermo-Nuclear Code Quality Review, Blast Radius & `One-Way` vs `Two-Way Door` Merge Danger scoring, `ScholarPeer` 4-Agent Peer Review, and `PaperVizAgent` visual audit ($\ge 95/100$). |
| **Factory Overseer (`@factory-overseer`)** | `Factory Overseer` | Continuous supervision of target repositories, skill installation into `.agents/skills/`, sensor hardening, and non-disruptive enhancements committed to `feat/research-factory-enhancements` via `factory nudge` and `factory overseer-audit`. |

### 2.2 The ADR-to-arXiv Autoresearch Bridge (`.agents/skills/adr-to-arxiv-factory/`)

Every research-engineering repository governed by the Software Factory enforces a $1:1$ structural bridge between Architecture Decision Records and scientific manuscripts:

1. **1:1 ADR-to-Paper Mapping**:
   - **ADR Section 1 (`Context & Problem Statement`)** $\to$ **Paper Section 2 (`Motivation & Production Failure Modes`)**.
   - **ADR Section 3 (`Alternatives Considered` / "Design-It-Twice")** $\to$ **Experimental Baselines (`baselines/`) & Paper Section 3 Trade-Off Analysis** (satisfying Irene Zhang's systems-paper invariant that every competing design alternative is evaluated).
   - **ADR Section 2 (`Decision & Mathematical Invariants`)** $\to$ **Paper Section 3 Formal Theorems, Lemmas, and Complexity Bounds**.
2. **1:1 Code-to-LaTeX Symbol Parity (`GLOSSARY.md`)**:
   - Every domain concept and mathematical symbol is registered in `GLOSSARY.md` so code identifiers, test assertions, and LaTeX macros maintain exact semantic equivalence.
3. **Protocol Pre-Registration & The 3-Brake Academic Gate**:
   - **Pre-Registered Protocols**: Every hypothesis $H_k$ tracked in `research-state.yaml` must lock `experiments/<H-slug>/protocol.md` in Git prior to running benchmarks, separating `CONFIRMATORY` from `EXPLORATORY` findings in `findings.md`.
   - **Brake 1 (Deterministic Governance & Zero-Hallucination Sensor)**: `factory verify` + `verify_hallucinations` ensures 100% `CONTEXT.md <-> docs/adr/` parity, Deep Module encapsulation, exact numerical claim parity between `results/*.json` and `paper/main.tex`, and 100% verified BibTeX keys in `paper/references.bib`.
   - **Brake 2 (`PaperVizAgent` Visual Quality Gate)**: Publication figures generated from `results/*.json` via `academic-plotting` must achieve $\ge 95/100$ across Faithfulness, Conciseness, Readability, and Aesthetics.
   - **Brake 3 (`ScholarPeer` 4-Agent Adversarial Peer Review & Two-Axis Code Review)**: Runs the *Sub-Domain Historian*, *Baseline Scout*, *Multi-Aspect Mathematical Q&A Engine*, and *Review Generator* alongside `/two-axis-review`.

### 2.3 Continuous Overseer Nudge CLI & Backlog (`factory nudge` / `factory overseer-audit`)

We extend `src/cli/factory.mjs` with `nudge` and `overseer-audit` subcommands and maintain a living `ENHANCEMENT_BACKLOG.md`:
- `node src/cli/factory.mjs overseer-audit [--json]`: Audits `.agents/skills/` for the 11 canonical Research & Code-Quality skills, verifies `ADR-0010` Multi-Model Tier Routing, and checks `ENHANCEMENT_BACKLOG.md` health.
- `node src/cli/factory.mjs nudge "<enhancement note>" [--source "..."] [--status "..."]`: Appends a SHA-256 provenance-stamped enhancement directive to `ENHANCEMENT_BACKLOG.md` and outputs the active Multi-Model Tier Routing and readiness report.

---

## 3. Alternatives Considered

- **Alternative A: Single Homogeneous Model for Planning, Coding, and Reviewing**:
  - *Rejected*: Self-review by the same model persona that wrote the implementation suffers from confirmation bias. Routing Planning to `Argon (High Thinking)`, Building to `Hydrogen (High Thinking)`, and Adversarial Review to `Neon (High Thinking)` enforces independent cognitive verification at every gate.
- **Alternative B: Separate Disconnected Repositories/Workflows for Software Engineering and Academic Paper Writing**:
  - *Rejected*: Splitting ADR governance from the Two-Loop Autoresearch pipeline causes experimental baselines to diverge from architectural alternatives and allows unverified metrics to enter manuscripts.
- **Alternative C: Ad-Hoc Edits to `main` Without an Overseer Branch or Backlog**:
  - *Rejected*: Directly mutating `main` without an audited `feat/research-factory-enhancements` branch and `ENHANCEMENT_BACKLOG.md` violates `ADR-0000` traceability and `ADR-0007` verification receipt discipline.

---

## 4. Consequences

### Positive
- Tasks sized via `factory size` deterministically output the `modelRouting` assignment (`Argon (High Thinking)`, `Hydrogen (High Thinking)`, `Neon (High Thinking)`, `Factory Overseer`) alongside execution gates and intent profiles.
- All 11 research and code-quality skills (`adr-to-arxiv-factory`, `0-autoresearch-skill`, `systems-paper-writing`, `ml-paper-writing`, `academic-plotting`, `brainstorming-research-ideas`, `creative-thinking-for-research`, `blast-radius`, `thermo-nuclear-code-quality-review`, `presenting-conference-talks`, `paper2agent`) are bundled directly inside `.agents/skills/`.
- `checkClaimSources` in `src/modules/sensors/` excludes `.agents/` and `.github/` prompt files from false-positive placeholder triggers while strictly enforcing zero placeholders across project `docs/` and `.planning/`.

### Negative / Trade-offs
- Multi-model orchestration requires the calling harness or orchestrator to bind each role (`@architect`, `@engineer`, `@pr-reviewer`, `@factory-overseer`) to its designated model tier.

### Operations & Rollback Runbook (`ADR-0005` / `ADR-0007`)
- **Blast Radius**: Scoped to `src/modules/sizing/`, `src/modules/sensors/`, `src/cli/factory.mjs`, `.agents/skills/`, `ENHANCEMENT_BACKLOG.md`, and governance index tables.
- **Rollback Procedure**: Revert commit on `feat/research-factory-enhancements` and run `node src/cli/factory.mjs verify` to restore pre-ADR-0010 sizing and CLI state.
