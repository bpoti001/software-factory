# ADR-0008: Brownfield Architecture Archaeology, Evidence-Backed Retro-ADR Synthesis, and Multi-Layer Visual Intelligence

- **Status**: `accepted`
- **Date**: 2026-11-06
- **Deciders**: `@architect`, Principal Engineering
- **Confluence Source**: `CONF-ADR-0008` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0008`)
- **Governing Jira Epic**: `ARCH-10`
- **Scope / Bounded Context**: `src/modules/discovery/`, `src/modules/visualizer/`, `src/cli/factory.mjs`, `docs/architecture/`

---

## 1. Context & Problem Statement

Most enterprise software development occurs in already-built (brownfield) repositories where architectural decisions live implicitly in file structures, import graphs, database schemas, and years of Git commit history rather than in synchronized documentation.

While [`ADR-0007`](./0007-aidlc-synthesis-architecture.md) introduced basic runtime and directory inspection via `discoverPractices` in `src/modules/discovery/`, an 84-line manifest reader cannot reverse-engineer complex brownfield architectures:
1. **Opaque Dependency Topologies**: Legacy projects use varied directory layouts (`src/modules/*`, `src/services/*`, `packages/*`, layered `controllers/`/`models/`, or flat structures) with undocumented cross-module imports, circular dependencies, and varying module depth ratios.
2. **Undocumented Historical Pivots & Split-Brain Patterns**: Teams frequently have partial migrations (e.g., two competing patterns or libraries coexisting in the same codebase) buried in Git history (`git log`), causing coding agents to copy deprecated patterns unless those patterns are mined and routed to the `Delete-Zone` or Wayfinder decision maps.
3. **Lack of Evidence-Backed Retro-ADRs**: Manually writing ADRs for an existing system is slow, while pure-LLM summarization suffers from sampling bias and hallucination unless grounded in deterministic codebase metrics and commit citations.
4. **Cognitive Onboarding Bottleneck**: Engineers and stakeholders need multi-layer visual diagrams (C4 Context/Container maps, Deep Module Seam & Coupling graphs, ADR Governance heatmaps, Churn vs. Gravity risk quadrants, interactive HTML exploration) and a narrative `ARCHITECTURE_TOUR.md` to understand and imagine what has been built.

---

## 2. Decision

We will implement a **Brownfield Architecture Archaeology, Retro-ADR Synthesis, and Visual Intelligence Engine** governed by [`ADR-0001`](./0001-deep-module-boundaries.md) and [`ADR-0007`](./0007-aidlc-synthesis-architecture.md) across two Deep Modules (`src/modules/discovery/` and `src/modules/visualizer/`) and expose them through the `factory` CLI (`src/cli/factory.mjs`):

1. **Deep Codebase X-Ray & Dependency Graph (`src/modules/discovery/index.mjs` -> `analyzeCodebase`)**:
   - Recursively scans polyglot repositories (JavaScript/TypeScript, Python, Go, Rust) to construct a directed dependency graph (`modules`, `edges`, `externalPackages`).
   - Auto-detects layout topology (`deep-modules`, `monorepo-packages`, `layered-mvc`, `organic`), computes each module's **Module Depth Ratio** (implementation lines vs. public exported symbols), **Fan-In**, **Fan-Out**, **Instability** $I = \frac{\text{Fan-Out}}{\text{Fan-In} + \text{Fan-Out}}$, circular dependencies, and cross-boundary seam leaks.
   - Fingerprints persistence layers, API/transport frameworks, and CI/CD infrastructure.

2. **Git Archaeology & Implicit Decision Miner (`src/modules/discovery/index.mjs` -> `mineGitArchaeology`)**:
   - Mines `git log` history to extract **Architectural Epochs** (structural manifest and directory milestones), **Hotspot Churn** (most frequently modified files crossed with Fan-In gravity to identify `One-Way Door` zones), **Temporal Co-Change Coupling**, and **Delete-Zone Candidates** (competing patterns or deprecated directories).

3. **Evidence-Backed Retro-ADR & Domain Glossary Synthesizer (`src/modules/discovery/index.mjs` -> `synthesizeRetroAdrs`)**:
   - Evaluates the discovered codebase across core architectural dimensions (Runtime & Module System, Boundary Encapsulation, Persistence & State, API & Transport, Verification & CI, Governance & Sensors).
   - Classifies each synthesized Retro-ADR into a 3-tier status taxonomy:
     - `accepted`: Consistently adhered to across $\ge 85\%$ of applicable modules.
     - `proposed`: Contested or split-brain pattern requiring an architect ruling via Wayfinder.
     - `drift-detected`: Intended architectural boundary with active seam or coupling violations.
   - Emits sensor-compliant ADR markdown documents (`## 1. Context & Problem Statement`, `## 2. Decision`, `## 3. Alternatives Considered`, `## 4. Consequences`) backed by concrete file paths, adherence metrics, and commit evidence, alongside discovered `GLOSSARY.md` domain terms.

4. **Multi-Layer Architecture Visualizer & Cognitive Tour (`src/modules/visualizer/index.mjs`)**:
   - Encapsulates all visualization and narrative rendering behind a narrow public seam exposing:
     - `generateArchitectureVisuals(analysis, options)`: Produces 5 visual lenses in Markdown/Mermaid (`C4 System & Container Map`, `Deep Module Seam & Coupling Graph`, `ADR Governance Coverage Matrix`, `Churn vs. Gravity Risk Quadrant`, and `Primary Execution Call Trees`).
     - `generateArchitectureTour(analysis, options)`: Produces `ARCHITECTURE_TOUR.md` structured to help humans understand and imagine the project (`Mental Model & Metaphor`, `What Has Been Built Inventory`, `Traced Request Walkthrough`, `Architectural Why & ADRs`, and `Safe Extension Guide`).
     - `generateInteractiveExplorerHtml(analysis, options)`: Produces a self-contained, zero-dependency interactive HTML dashboard (`explorer.html`) with live module inspection, dependency filtering, Retro-ADR cards, and guided tour tabs.

5. **Deterministic CLI Commands (`src/cli/factory.mjs`)**:
   - Adds `factory analyze`, `factory adr-synthesize`, and `factory visualize` subcommands while preserving zero third-party npm dependencies (`ADR-0004`).

---

## 3. Alternatives Considered

- **Alternative A: Third-Party AST & Graph Libraries (`ts-morph`, `madge`, `graphviz`, `d3-node`)**:
  - *Rejected*: Violates [`ADR-0004`](./0004-deterministic-governance-cli.md) (Zero-Dependency Node ESM CLI). Installing heavy native/npm binaries breaks instant `< 500ms` execution in polyglot enterprise CI/CD pipelines.
- **Alternative B: Pure-LLM Prompt-Only Repo Summarization**:
  - *Rejected*: Unbounded LLM file sampling misses global coupling cycles, hallucinates adherence ratios, and cannot deterministically compute Fan-In/Fan-Out or git churn metrics.
- **Alternative C: Placing Visualization Logic Inside `src/modules/discovery/`**:
  - *Rejected*: Violates Single Responsibility and Deep Module design (`ADR-0001`). Separating `discovery` (data extraction, graph math, archaeology, ADR synthesis) from `visualizer` (Mermaid diagrams, cognitive tour narrative, interactive HTML explorer) keeps both seams narrow and independently testable.

---

## 4. Consequences

### Positive
- Any brownfield or greenfield repository can be analyzed in `< 1s` via `node src/cli/factory.mjs analyze --visualize` to produce a complete dependency X-Ray, evidence-backed Retro-ADRs, 5-lens Mermaid architecture diagrams, a cognitive `ARCHITECTURE_TOUR.md`, and an interactive `explorer.html`.
- Synthesized Retro-ADRs automatically satisfy all `src/modules/sensors/` checks (`required-sections`, `claim-sources`, `traceability`).
- Engineers and stakeholders gain an immediate visual and narrative mental model of what has been built, why it is shaped that way, and where `One-Way Door` risks live.

### Negative / Trade-offs
- Static regex/token-based polyglot import extraction does not resolve dynamic runtime reflection or macro-generated imports; however, it captures $>98\%$ of standard ES module, CommonJS, Python, Go, and Rust static imports with zero external dependencies.
