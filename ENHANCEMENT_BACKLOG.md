# Software Factory Overseer Enhancement Backlog (`ENHANCEMENT_BACKLOG.md`)

> **Governed by:** `ADR-0000`, `ADR-0007`, `ADR-0010`
> **Managed by:** `@factory-overseer` (`node src/cli/factory.mjs nudge "<note>"` / `node src/cli/factory.mjs overseer-audit`)
> **Branch:** `feat/research-factory-enhancements`

---

## 1. Multi-Model Tier Routing & Active Overseer Configuration (`ADR-0010`)

| Role / Persona | Model Assignment | Active Responsibilities |
|---|---|---|
| **Planner / Researcher (`@architect` / `@orchestrator`)** | `Argon (High Thinking)` | Literature recon, Wayfinder maps, `ADR`/`RFC` minting, "Design-It-Twice" trade-offs, Formal Theorems, and Outer-Loop Autoresearch synthesis. |
| **Builder (`@engineer`)** | `Hydrogen (High Thinking)` | `/show-me` program design blueprints, Deep Module implementation (`src/modules/<domain>/index.mjs`), Vertical Tracer-Bullet TDD, and Inner-Loop benchmarks. |
| **Adversarial Reviewer (`@pr-reviewer`)** | `Neon (High Thinking)` | Two-Axis Review (`CODING_STANDARDS.md`), Thermo-Nuclear Code Quality Review, Blast Radius, `ScholarPeer` 4-Agent Peer Review, and `PaperVizAgent` audit ($\ge 95/100$). |
| **Factory Overseer (`@factory-overseer`)** | `Factory Overseer` | Continuous supervision of target repositories (e.g., `/Users/tejap/memory_paper`), skill discovery, sensor hardening, and non-disruptive factory nudges. |

---

## 2. Overseer Enhancement Ledger (Observed from `Prism-ANN` Target Build)

| ID | Timestamp | Source / Observation | Enhancement Directive | Governing ADR | Status | Provenance Hash |
|---|---|---|---|---|---|---|
| **ENH-0001** | `2026-11-19T15:21:00Z` | `/Users/tejap/memory_paper` (`Prism-ANN` ADR-to-arXiv build) | Bundle 11 canonical Research & Code-Quality skills (`adr-to-arxiv-factory`, `0-autoresearch-skill`, `systems-paper-writing`, `ml-paper-writing`, `academic-plotting`, `brainstorming-research-ideas`, `creative-thinking-for-research`, `blast-radius`, `thermo-nuclear-code-quality-review`, `presenting-conference-talks`, `paper2agent`) into `.agents/skills/`. | `ADR-0010` | `completed` | `cid:8f41b2c9e0a143d1` |
| **ENH-0002** | `2026-11-19T15:22:00Z` | `/Users/tejap/memory_paper` (`Prism-ANN` Multi-Model Orchestration) | Mint `ADR-0010` formalizing Multi-Model Tier Routing (`Argon (High Thinking)`, `Hydrogen (High Thinking)`, `Neon (High Thinking)`, `Factory Overseer`) and the $1:1$ ADR-to-arXiv Autoresearch Bridge (`Alternatives Considered` $\to$ Baselines, `Decision` $\to$ Formal Theorems, 3-Brake Academic Gate). | `ADR-0010` | `completed` | `cid:3c94e7a1b5208f12` |
| **ENH-0003** | `2026-11-19T15:23:00Z` | `src/modules/sizing/` (`classifyTaskSize`) | Upgrade `classifyTaskSize` and export `resolveModelRouting` so every sizing decision outputs deterministic `modelRouting` and recognizes the `research` Intent Profile (`theorem`, `arxiv`, `hypothesis`, `ablation`, `scholarpeer`, `paperviz`). | `ADR-0002`, `ADR-0007`, `ADR-0010` | `completed` | `cid:7a19d4e82b60c35a` |
| **ENH-0004** | `2026-11-19T15:24:00Z` | `src/modules/sensors/` (`checkClaimSources`) | Refine `checkClaimSources` sensor to exclude `.agents/` and `.github/` agent skill prompt files from placeholder false positives while strictly auditing project `docs/` and `.planning/`. | `ADR-0007`, `ADR-0010` | `completed` | `cid:5d02f8c31a94e76b` |
| **ENH-0005** | `2026-11-19T15:25:00Z` | `src/cli/factory.mjs` (`nudge` / `overseer-audit`) | Add `factory nudge "<note>"` and `factory overseer-audit` CLI commands to verify installed research skills, check Multi-Model Tier Routing, and append SHA-256 provenance-stamped nudges to `ENHANCEMENT_BACKLOG.md`. | `ADR-0004`, `ADR-0010` | `completed` | `cid:9e31a6b40c72d81f` |
| **ENH-0006** | `2026-11-19T16:03:22.147Z` | `@neon-reviewer (Gate 6)` | Row-Scoped LaTeX Table Parity & Intra-JSON Consistency Sensor: Replace global string-in-file number checks with \label{tab:...} row-scoped table parsing and intra-JSON sweep-vs-summary validation before plotting. | `ADR-0010` | `completed` | `cid:8c055753d1ce77a0` |
| **ENH-0007** | `2026-11-19T16:03:22.193Z` | `@neon-reviewer (Gate 6)` | Automated Citation Bijection & Upstream API Verification Sensor: Enforce 1:1 bijection between \cite{} keys and \bibitem/BibTeX entries plus upstream CrossRef/arXiv/Semantic Scholar author/title verification in Gate 1 & Gate 6. | `ADR-0010` | `completed` | `cid:f4cf632bb5f4960f` |
| **ENH-0008** | `2026-11-19T16:03:22.234Z` | `@neon-reviewer (Gate 6)` | Multimodal PNG Visual-Inspection Gate & Read-Path Purity Sensor: Require visual inspection of rendered PNG plots in PaperVizAgent to catch legend/curve occlusions and flag read-path RNG/state mutations or synthetic metric counter offsets. | `ADR-0010` | `completed` | `cid:21ef0c9cdbd0a9d8` |
| **ENH-0009** | `2026-11-19T17:28:15.148Z` | `@factory-overseer (Plugin Sync)` | Wire Science (literature-search-arxiv, literature-search-openalex, embl-ebi-ols), Tavily (tavily-search, tavily-research), and CodeRabbit (coderabbit-review, coderabbit-autofix) Marketplace plugin skills into .agents/skills/ for Gate 1 (Literature & Ontology Recon) and Gate 6 (Adversarial & CodeRabbit Review). | `ADR-0010` | `completed` | `cid:3531475a83d982a0` |
| **ENH-0010** | `2026-11-19T17:39:29.973Z` | `@factory-overseer (Academic Integrity Gate)` | Anti-Hardcoded Benchmark Curve Sensor (checkBenchmarkEmpiricalPurity): Deterministically scan benchmark runners (run_*benchmark*.py / *benchmark*.mjs) for hardcoded multi-element float literal arrays assigned to empirical metric keys (recall_at_10, p99_latency_ms, qps, dist_comps, curves) to enforce systems-paper-writing Academic Integrity and require 100% live query execution. | `ADR-0010` | `completed` | `cid:d3ce2caa265edada` |
