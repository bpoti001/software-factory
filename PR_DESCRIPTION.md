# Pull Request: `feat/research-factory-enhancements` — Research Factory Governance, Provenance Sensors, Honest Role Routing & Skills Bundle (`ADR-0010`)

- **Source Branch**: `feat/research-factory-enhancements`
- **Target Branch**: `main` (or `feat/high-velocity-api-scaffolder` base)
- **Governing ADRs**: `ADR-0001`, `ADR-0002`, `ADR-0004`, `ADR-0005`, `ADR-0007`, `ADR-0010`
- **Governing Jira Epic**: `ARCH-12`
- **Human Review Status**: Pushed to `origin/feat/research-factory-enhancements` for human review and downstream Software Factory self-development.

---

## 1. `/visual-pr` Structural Summary & File-Tree Diff

```text
software_factory/
├── CONTEXT.md                                                        # [Modified] Registers ADR-0010 & updated sizing/sensors/CLI module contracts
├── GLOSSARY.md                                                       # [Modified] Adds Role Routing, ADR-to-arXiv Bridge, Raw-Record Provenance terms
├── ENHANCEMENT_BACKLOG.md                                            # [Created]  Tracks ENH-0001..ENH-0016 with SHA-256 cid: provenance hashes
├── PR_DESCRIPTION.md                                                 # [Created]  Local human-review PR package with explicit Known Limitations
├── .planning/
│   └── ROADMAP.md                                                    # [Modified] Adds Phase 9 (ADR-0010 Role Routing & Provenance Sensors)
├── docs/adr/
│   ├── README.md                                                     # [Modified] Indexes ADR-0010
│   └── 0010-multi-model-autoresearch-and-overseer-governance.md      # [Created]  Formalizes honest role routing & 7 research provenance sensors
├── src/
│   ├── modules/
│   │   ├── sizing/
│   │   │   ├── index.mjs                                             # [Modified] Exports classifyTaskSize & resolveModelRouting
│   │   │   └── lib/classifier.mjs                                    # [Modified] Adds 'research' profile & honest role/modelSelection routing
│   │   └── sensors/
│   │       ├── index.mjs                                             # [Modified] Exports 7 new research integrity & provenance sensors
│   │       └── lib/sensors.mjs                                       # [Modified] Implements ENH-0004, ENH-0007, ENH-0008, ENH-0010, ENH-0012..0015
│   └── cli/
│       └── factory.mjs                                               # [Modified] Adds 'nudge' & 'overseer-audit' commands + sensor gate wiring
├── tests/
│   ├── aidlc.seam.test.mjs                                           # [Modified] 7 dedicated unit tests (one per new sensor; suite 50 -> 56 tests)
│   ├── sizing.seam.test.mjs                                          # [Modified] Tests resolveModelRouting & 'research' intent profile
│   └── cli.integration.test.mjs                                      # [Modified] Tests 'factory overseer-audit' & 'factory nudge'
└── .agents/skills/                                                   # [Created]  11 bundled research/quality skills + 7 Marketplace plugin symlinks
```

---

## 2. Two-Axis Review & Merge Danger Assessment (`ADR-0005`, `ADR-0007`)

| Axis / Dimension | Classification | Evidence & Rationale |
|---|---|---|
| **Door Type (Reversibility)** | **One-Way Door** | Mints `ADR-0010`, extends public Deep Module seams (`src/modules/sizing/index.mjs`, `src/modules/sensors/index.mjs`), and adds CLI subcommands (`nudge`, `overseer-audit`). |
| **Blast Radius** | **System-Wide** | Touches `sizing`, `sensors`, `cli`, `CONTEXT.md`, `GLOSSARY.md`, `docs/adr/`, `.planning/ROADMAP.md`, and `.agents/skills/`. |
| **Axis 1: Architecture & Seam Purity** | **PASS (`0` Violations)** | All new sensor and sizing functions are encapsulated inside `src/modules/<domain>/lib/` and exported strictly via named exports in `src/modules/<domain>/index.mjs`. |
| **Axis 2: Test & Sensor Verification** | **PASS (`61/61` Tests)** | Every new sensor (`ENH-0007` through `ENH-0019`), `runSensors()` citation-bijection wiring, `src/modules/learning/` overseer seam, and `< 800`-LOC `src/` file ceiling are verified in `tests/aidlc.seam.test.mjs`. |
| **Operations & Rollback Runbook** | **Documented** | Revert branch `feat/research-factory-enhancements` (or `git revert` commit range) and run `node src/cli/factory.mjs verify` to restore the pre-`ADR-0010` 50-test baseline. |

---

## 3. Complete Enhancement Ledger (`ENH-0001` – `ENH-0019`)

| ID | Summary | Implementation Location | Dedicated Test |
|---|---|---|---|
| **ENH-0001** | Bundle 11 Research & Code-Quality skills (`adr-to-arxiv-factory`, `0-autoresearch-skill`, `systems-paper-writing`, `ml-paper-writing`, `academic-plotting`, `brainstorming-research-ideas`, `creative-thinking-for-research`, `blast-radius`, `thermo-nuclear-code-quality-review`, `presenting-conference-talks`, `paper2agent`). | `.agents/skills/` | `tests/cli.integration.test.mjs` |
| **ENH-0002** | Mint `ADR-0010` formalizing research governance, provenance sensors, and the Overseer nudge loop. | `docs/adr/0010-*.md`, `CONTEXT.md`, `GLOSSARY.md` | `tests/governance.seam.test.mjs` |
| **ENH-0003** | Add `research` Intent Profile and `resolveModelRouting` to `src/modules/sizing/`. | `src/modules/sizing/lib/classifier.mjs` | `tests/sizing.seam.test.mjs` |
| **ENH-0004** | Exclude `.agents/` and `.github/` skill prompt files from `checkClaimSources` placeholder false positives. | `src/modules/sensors/lib/sensors.mjs` | `tests/aidlc.seam.test.mjs` |
| **ENH-0005** | Add `factory nudge` and `factory overseer-audit` CLI commands. | `src/cli/factory.mjs` | `tests/cli.integration.test.mjs` |
| **ENH-0006** | Document row-scoped LaTeX table parity (`\label{tab:...}`) and intra-JSON consistency rules. | `ENHANCEMENT_BACKLOG.md` | N/A (policy backlog entry) |
| **ENH-0007** | `checkLatexCitationBijection`: Enforce 1:1 bijection between `\cite{}` keys and `\bibitem` / BibTeX entries. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0007]` |
| **ENH-0008** | `checkReadPathPurity`: Flag global RNG seed mutations (`random.seed`, `np.random.seed`) and synthetic counter offsets in `src/modules/`. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0008]` |
| **ENH-0009** | Symlink 7 Marketplace plugin skills (`Science`, `Tavily`, `CodeRabbit`) into `.agents/skills/`. | `.agents/skills/` | `tests/cli.integration.test.mjs` |
| **ENH-0010** | `checkBenchmarkEmpiricalPurity`: Block hardcoded float literal arrays (`recall_at_10`, `p99_latency_ms`, `curves =`) in benchmark scripts. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0010, ENH-0014]` |
| **ENH-0011** | Document full-sweep extremum parity vs. subsampled LaTeX tables. | `ENHANCEMENT_BACKLOG.md` | N/A (policy backlog entry) |
| **ENH-0012** | `checkFileSizeCeiling`: Enforce the 1,000-line ceiling on source and benchmark files. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0012]` |
| **ENH-0013** | `checkDynamicReportInterpolation`: Flag hardcoded numeric metric literals in report-template strings of `*audit*` / `*review*` scripts. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0013]` |
| **ENH-0014** | `checkRawRecordProvenance` + formula heuristic in `checkBenchmarkEmpiricalPurity`: Require sibling `raw/*.jsonl` (or paired `raw_<suffix>/`) records + recompute script, and flag formula-derived metrics lacking timing/search calls. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0014]` |
| **ENH-0015** | `checkNoScriptedVerdicts`: Fail if any `*audit*` / `*review*` / `*scholarpeer*` / `*paperviz*` script contains literal score dicts (`"faithfulness": 99.0`) or verdict strings (`"STRONG ACCEPT"`). | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0015]` |
| **ENH-0016** | Honest Role Routing: `resolveModelRouting` returns role descriptions (`planner`, `builder`, `reviewer`, `overseer`) + `modelSelection` documenting that the host harness chooses the model at invocation time (`'inherit'`, `'pro'`, `'flash'`). | `src/modules/sizing/lib/classifier.mjs`, `ADR-0010`, `GLOSSARY.md` | `Sizing Seam [ADR-0010, ENH-0016]` |
| **ENH-0017** | `checkUnboundedSubprocessPipe`: Flag long-lived `subprocess.Popen(..., stdout/stderr=subprocess.PIPE)` calls without `.communicate()` (motivated by macOS 64 KB stderr pipe deadlock on SpiceDB). | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0017]` |
| **ENH-0018** | Fix `checkRawRecordProvenance` mtime direction & paired `summary_<suffix>.json` <-> `raw_<suffix>/` resolution so fresh recomputed summaries pass while stale summaries older than `raw/*.jsonl` fail. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0014]` |
| **ENH-0019** | `checkLatexTemplateHygiene`: Flag leftover `(X)`/`(Y)`/`(Z)`, draft markers, and `XX%` writing-template placeholders in `.tex` manuscripts. | `src/modules/sensors/lib/sensors.mjs` | `Sensors [ADR-0010, ENH-0019]` |

---

## 4. Known Limitations (What Static Sensors Can and Cannot Catch)

1. **Regex & Single-Function Heuristics vs. Inter-Procedural Data Flow (`checkBenchmarkEmpiricalPurity`, `checkDynamicReportInterpolation`, `checkNoScriptedVerdicts`)**:
   - The static sensors in `src/modules/sensors/lib/sensors.mjs` inspect file names, line-level regular expressions, and single-function bodies without building a cross-module Abstract Syntax Tree (AST) or taint graph.
   - A script could evade `checkBenchmarkEmpiricalPurity` by wrapping a synthetic formula inside an imported helper function whose name is not `*benchmark*`, or by calling `time.perf_counter()` around a sleep/stub rather than a real engine.
   - Similarly, `checkDynamicReportInterpolation` strips `{...}` and `${...}` before checking for literal measurements (`98.4%`, `14.2 ms`), so it will not catch a script that loads hardcoded constants from a dict variable and interpolates `{hardcoded_dict['val']}%`.
2. **File-System Provenance vs. Semantic Ground Truth (`checkRawRecordProvenance`)**:
   - `checkRawRecordProvenance` verifies that `results/**/summary*.json` has a non-empty sibling `raw/*.jsonl` (or `raw_<suffix>/*.jsonl`) directory, that a recompute script (`bench/recompute.py`) exists, and that `summary.json` is not older than the raw `.jsonl` files (`summary.mtimeMs >= maxRawMtimeMs`, fixed in `ENH-0018`).
   - Furthermore, `checkRawRecordProvenance` does not execute `bench/recompute.py` or verify that the records inside `raw/*.jsonl` came from a real external database (e.g., FAISS/pgvector/SpiceDB) rather than an in-memory synthetic generator. Executing `bench/recompute.py --check` and tracing headline numbers back to generating code remain mandatory Gate-6 reviewer tasks.
3. **Citation Key Bijection vs. Upstream Bibliographic Accuracy (`checkLatexCitationBijection`)**:
   - `checkLatexCitationBijection` verifies 1:1 key parity between `\cite{key}` and `\bibitem{key}` / BibTeX entries in local text, but does not query CrossRef, arXiv, or OpenAlex over the network (to preserve `ADR-0004` zero-dependency offline determinism). Upstream author/title/venue verification must be performed during Gate 1 and Gate 6 using the linked `Science` (`literature-search-arxiv`, `literature-search-openalex`) and `Tavily` skills.
4. **Portable Marketplace Plugin Skills (`.agents/skills/` + `scripts/sync-plugin-skills.sh`)**:
   - The 7 optional Marketplace plugin skills (`literature-search-arxiv`, `literature-search-openalex`, `embl-ebi-ols`, `tavily-search`, `tavily-research`, `coderabbit-review`, `coderabbit-autofix`) are **not** committed as machine-local symlinks; instead they are documented in `.agents/skills/PLUGIN_SKILLS.md`, ignored in `.gitignore`, and linked on-demand via `./scripts/sync-plugin-skills.sh`.
