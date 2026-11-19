# ADR-0010: Role-Separated Research Governance, Raw-Record Empirical Provenance Sensors, and Overseer Nudge Loop

- **Status**: `accepted`
- **Date**: 2026-11-19
- **Deciders**: `@architect`, `@factory-overseer`, Principal Research & Systems Engineering
- **Confluence Source**: `CONF-ADR-0010` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0010`)
- **Governing Jira Epic**: `ARCH-12`
- **Scope / Bounded Context**: `src/modules/sizing/`, `src/modules/sensors/`, `src/cli/factory.mjs`, `.agents/skills/`

---

## 1. Context & Problem Statement

As the ADR-Governed Software Factory scales from software delivery (`ADR-0000` through `ADR-0009`) to unified **Systems & AI Research Engineering**, retrospective analysis of the first `Prism-ANN` execution surfaced four critical governance requirements:

1. **Honest Role Separation vs. Nominal Model Labels (`ENH-0016`)**: The Software Factory CLI (`factory.mjs`) is a static Node.js governance engine and does not select or switch underlying LLM weights itself. Actual model selection occurs at subagent invocation time in the calling agent harness (e.g., `'inherit'`, `'pro'`, `'flash'`). Returning invented code-names from `resolveModelRouting` obscured the real mechanism; instead, `resolveModelRouting` must describe the distinct cognitive roles (`planner`, `builder`, `reviewer`, `overseer`) and explicitly state in `modelSelection` that model choice is governed by the host invocation harness.
2. **Scripted Audit Verdicts and Template Literals (`ENH-0013`, `ENH-0015`)**: When audit or peer-review scripts (`*audit*`, `*review*`, `*paperviz*`, `*scholarpeer*`) embed hardcoded score dictionaries (`"faithfulness": 99.0`), static verdict strings (`"STRONG ACCEPT"`), or hardcoded numeric metric literals in report templates, they create the illusion of an evaluation gate without inspecting live artifacts.
3. **Regex-Only Benchmark Purity vs. Raw-Record Provenance (`ENH-0010`, `ENH-0014`)**: Checking only for literal float arrays (`[0.912, 0.968]`) in benchmark scripts misses formula-derived numbers computed from loop variables without running a real query or timer. Every summary JSON in a research repository must be backed by a sibling `raw/*.jsonl` directory of per-query execution logs and a deterministic recompute script.
4. **Continuous Factory Self-Improvement With Human PR Review**: Enhancements discovered during target repository builds (`ENH-0001` through `ENH-0016`) must be logged with SHA-256 provenance hashes in `ENHANCEMENT_BACKLOG.md`, tested with one dedicated unit test per sensor, and packaged with a transparent `PR_DESCRIPTION.md` (including known static-analysis limitations) for human review prior to merge.

---

## 2. Decision

We formalize three interlocking enhancements to the ADR-Governed Software Factory:

### 2.1 Honest Role Routing & Host Model Selection (`src/modules/sizing/`, `ENH-0016`)

Every task classified by `classifyTaskSize` (`Small [S]`, `Medium [M]`, `Large [L]`) includes an immutable `modelRouting` descriptor defining role responsibilities and documenting invocation-time model selection:

| Role Key | Agent Persona & Core Responsibilities | Host Model Selection Policy (`modelSelection`) |
|---|---|---|
| `planner` | **Architecture, Literature Recon & Protocol Pre-Registration (`@architect`)**: Programmatic literature search (`literature-search-arxiv`, OpenAlex, Tavily), `ADR`/`RFC` minting, "Design-It-Twice" trade-offs, and pre-registered `protocol.md`. | Chosen by host agent harness at invocation time (e.g., `'inherit'`, `'pro'`, `'flash'`); not selected by factory CLI. |
| `builder` | **Deep Module Implementation, Seam TDD & Raw-Logged Benchmarks (`@engineer`)**: `/show-me` blueprints, Deep Modules (`src/modules/<domain>/index.*`), Vertical Tracer-Bullet TDD, and raw per-query `.jsonl` benchmark execution. | Chosen by host agent harness at invocation time (e.g., `'inherit'`, `'pro'`, `'flash'`); not selected by factory CLI. |
| `reviewer` | **Provenance-First Independent Audit & Two-Axis Review (`@pr-reviewer`)**: Independent subagent context (`'pro'` recommended at invocation) that traces headline numbers to raw `.jsonl` logs and generating code first, runs `recompute.py`, and inspects compiled PDFs/PNGs at run time. | Chosen by host agent harness at invocation time (e.g., `'inherit'`, `'pro'`, `'flash'`); not selected by factory CLI. |
| `overseer` | **Continuous Factory Sensor & Governance Maintenance (`@factory-overseer`)**: Maintains `feat/research-factory-enhancements`, installs verified skills in `.agents/skills/`, codifies deterministic sensors, and prepares `PR_DESCRIPTION.md` for human review. | Chosen by host agent harness at invocation time (e.g., `'inherit'`, `'pro'`, `'flash'`); not selected by factory CLI. |

### 2.2 Deterministic Research Integrity & Provenance Sensors (`src/modules/sensors/`)

In addition to `checkRequiredSections`, `checkClaimSources`, and `checkTraceability`, `src/modules/sensors/index.mjs` exports seven deterministic research-engineering sensors:

1. `checkLatexCitationBijection` (`ENH-0007`): Enforces 1:1 bijection between `\cite{...}` keys in LaTeX manuscripts and `\bibitem{...}` / BibTeX entries.
2. `checkReadPathPurity` (`ENH-0008`): Flags global RNG seed mutations (`random.seed`, `np.random.seed`) and synthetic metric counter offsets (`distance_computations += int(...)`) inside `src/modules/`.
3. `checkBenchmarkEmpiricalPurity` (`ENH-0010`, `ENH-0014`): Scans benchmark runners (`*benchmark*.{py,mjs,js,ts}`) for (a) hardcoded multi-element float arrays assigned to metric keys (`recall_at_10`, `p99_latency_ms`, `curves =`) and (b) conservative heuristic detection of formula-derived metrics computed from loop variables or in benchmark functions lacking any timing (`perf_counter`, `time.time`, `performance.now`) or search/index invocation.
4. `checkFileSizeCeiling` (`ENH-0012`): Enforces the 1,000-line ceiling across source and benchmark files.
5. `checkDynamicReportInterpolation` (`ENH-0013`): Flags hardcoded empirical metric literals (`98.4%`, `14.2 ms`, `623x`, `97.72/100`) embedded directly inside report/audit template strings without runtime variable interpolation.
6. `checkRawRecordProvenance` (`ENH-0014`): When a repository contains a results summary JSON (`results/**/summary*.json` or `results/**/*_results.json`), requires (a) a sibling `raw/` directory containing non-empty `*.jsonl` per-query records, (b) a recompute script (`bench/recompute.py`, `scripts/recompute.py`, or `recompute.*`), and (c) that the summary JSON's modification timestamp (`mtime`) is not newer than every raw `.jsonl` record (or governed by the recompute check).
7. `checkNoScriptedVerdicts` (`ENH-0015`): Fails if any `*audit*`, `*review*`, `*scholarpeer*`, or `*paperviz*` script contains literal score dictionary constants (e.g., `"faithfulness": 99.0`) or hardcoded verdict strings (`"STRONG ACCEPT"`, `"Score: 9.0 / 10"`).

### 2.3 Continuous Overseer Nudge CLI & Backlog (`factory nudge` / `factory overseer-audit`)

We extend `src/cli/factory.mjs` with `nudge` and `overseer-audit` subcommands and maintain `ENHANCEMENT_BACKLOG.md` and `PR_DESCRIPTION.md` for human review before merging to `main`.

---

## 3. Alternatives Considered

- **Alternative A: Rely on Regex-Only Benchmark Purity Checks Without Raw-Record Provenance**:
  - *Rejected*: Static regexes on benchmark scripts cannot catch every arithmetic formula or helper indirection. Requiring raw per-query `.jsonl` logs alongside a deterministic recompute script (`checkRawRecordProvenance`) ensures summary metrics are backed by auditable per-query records.
- **Alternative B: Keep Scripted Python Audit Wrapper Scripts for PaperViz and ScholarPeer**:
  - *Rejected*: Scripts that print static scores (`97.72/100`, `9.0/10 STRONG ACCEPT`) provide false confidence. `checkNoScriptedVerdicts` and `checkDynamicReportInterpolation` forbid literal verdicts and uninterpolated report metrics.
- **Alternative C: Claim Factory CLI Selects Named Models (`Argon` / `Hydrogen` / `Neon`)**:
  - *Rejected*: Dishonest abstraction. The host agent tool selects the runtime model (`inherit`, `pro`, `flash`, `flash_lite`) when spawning a subagent; `resolveModelRouting` now reports role responsibilities and states this explicitly in `modelSelection`.

---

## 4. Consequences

### Positive
- Eliminates fabricated audit verdicts (`checkNoScriptedVerdicts`, `checkDynamicReportInterpolation`) and requires raw JSONL provenance (`checkRawRecordProvenance`) alongside static benchmark heuristics (`checkBenchmarkEmpiricalPurity`).
- Every sensor has its own dedicated unit test in `tests/aidlc.seam.test.mjs`, and `resolveModelRouting` honestly documents role responsibilities and host-level model selection.

### Negative / Trade-offs & Known Limitations
- Static regex and function-body heuristics in `checkBenchmarkEmpiricalPurity`, `checkDynamicReportInterpolation`, and `checkNoScriptedVerdicts` operate on line/block patterns rather than full cross-module AST data-flow analysis; a determined author could still hide a formula inside an imported helper or write synthetic records to `raw/*.jsonl`. Human code review and provenance spot-checking in Gate 6 remain essential.

### Operations & Rollback Runbook (`ADR-0005` / `ADR-0007`)
- **Blast Radius**: Scoped to `src/modules/sizing/`, `src/modules/sensors/`, `src/cli/factory.mjs`, `.agents/skills/`, `ENHANCEMENT_BACKLOG.md`, `PR_DESCRIPTION.md`, and governance index tables.
- **Rollback Procedure**: Revert branch `feat/research-factory-enhancements` and run `node src/cli/factory.mjs verify` to restore pre-ADR-0010 state.
