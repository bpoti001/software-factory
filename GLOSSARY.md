# Domain Glossary (`GLOSSARY.md`)

> **Consumer & Authoring Rules (`domain-modeling` + `context-and-decisions`):**
> 1. This file defines the **Ubiquitous Language** of the project. It contains **only** domain concepts, relationships, and disambiguated terms—never implementation details, file paths, or task schedules.
> 2. Every Copilot agent (`@onboarding`, `@architect`, `@engineer`, `@pr-reviewer`), spec, ADR, RFC, Jira ticket, and code identifier must use these exact canonical terms.
> 3. When a new domain concept emerges during `/grill-with-docs` or `/feature-spec`, update `GLOSSARY.md` inline immediately.

---

## 1. Core Factory & Governance Concepts

| Canonical Term | Precise Definition | Avoided Synonyms (Do Not Use) |
|---|---|---|
| **Deep Module** | A module that exposes a small, simple public **Interface** at a clean **Seam** while hiding substantial **Implementation** complexity inside private subfolders. | Component, Service, Helper, Utility |
| **Interface** | Everything a caller or test must know to use a **Deep Module** correctly: type signatures, invariants, error modes, and ordering constraints. | API, Signature, Boundary |
| **Seam** | A location where behavior can be altered without editing in that place—where a **Deep Module**'s **Interface** lives and where tests and **Adapters** attach. | Boundary, Layer |
| **Adapter** | A concrete implementation that satisfies an **Interface** at a **Seam** (e.g., a production database repository vs. an in-memory test fake). | Wrapper, Connector |
| **Architecture Decision Record (ADR)** | A concise, immutable record of a single architectural decision that is hard to reverse, surprising without context, or the result of a real trade-off, stored on Confluence and indexed in `CONTEXT.md`. | Tech Note, Wiki Page |
| **Request for Comments (RFC)** | A cross-cutting technical proposal for changes that span multiple bounded contexts, alter public/external contracts, or require multi-phase migration and multi-team sign-off before decomposition into **Tracer Bullets**. | Design Doc, Proposal |
| **Architectural Drift** | Any code change, dependency addition, or pattern that deviates from or is undocumented by the `accepted` **ADRs** in `CONTEXT.md` and Confluence. | Tech Debt, Hack |
| **Execution Size (`Small [S]` \| `Medium [M]` \| `Large [L]`)** | The adaptive governance tier assigned to a task (either explicitly by the engineer or auto-detected by blast radius) that determines whether deep research, Confluence MCP checks, and `/show-me` blueprints are skipped (`Small`), run within existing ADRs (`Medium`), or halted for new ADR/RFC creation (`Large`). | Task Priority, Story Points, Complexity Level |
| **Tracer Bullet (Vertical Slice)** | A narrow, complete end-to-end slice of functionality cutting through all necessary seams (contract, domain logic, persistence, tests) that is independently verifiable in a single session. | Horizontal Phase, Layer Task |
| **Wayfinder Map** | A single canonical index artifact that charts the route toward an architectural **Destination** through discrete **Decision Tickets**, tracking settled decisions, the active **Frontier**, and the **Fog of War**. | Backlog, Roadmap, Sprint Plan |
| **Frontier** | The set of open, unblocked **Decision Tickets** or design questions whose prerequisites are already settled and can be resolved immediately. | Todo List, Next Steps |
| **Fog of War** | In-scope future questions toward the **Destination** that cannot yet be stated sharply because they depend on unresolved **Frontier** decisions. | Icebox, Out of Scope |
| **Merge Danger** | The composite risk profile of a Pull Request combining its reversibility (**One-Way Door** vs. **Two-Way Door**) and its **Blast Radius** (`Localized`, `Module-Wide`, `System-Wide`). | PR Risk Score |
| **One-Way Door** | A change whose consequences cannot be trivially undone by `git revert` (e.g., destructive schema migrations, external notifications, public contract breaks, data deletion). Requires heavy human architect review and an approved ADR/RFC. | High-Risk PR |
| **Two-Way Door** | A change whose consequences are localized and immediately reversible via `git revert` or a feature flag. | Low-Risk PR |

---

## 2. Software Factory Engine Domain Concepts

| Canonical Term | Bounded Context | Precise Definition | Avoided Synonyms | Confirmed Source |
|---|---|---|---|---|
| **Sizing Classifier** | `sizing` Module | The deterministic policy that evaluates a task prompt, user size override (`[S]`, `[M]`, `[L]`), and touched file paths to output an **Execution Size** and gate schedule, including automatic escalation when a `Small` task touches restricted architectural files. | Router, Triage Bot | `ADR-0002` |
| **Seam Violation** | `governance` Module | An illegal cross-module import where a caller bypasses a **Deep Module**'s root public entry point (`index.*`) and reaches directly into its private `lib/` or `internal/` implementation. | Bad Import, Private Leak | `ADR-0001`, `ADR-0004` |
| **Delete-Zone** | `governance` Module | The explicit ledger in `CONTEXT.md` Section 5 of deprecated patterns and removed files that agents and engineers are forbidden from recreating. | Deprecated List, Legacy Code | `ADR-0000`, `ADR-0004` |
| **ADR Parity** | `governance` Module | The invariant that every `accepted` **ADR** registered in `CONTEXT.md` Section 3 has both a valid Confluence identifier and a synchronized local markdown mirror in `docs/adr/`. | Doc Sync | `ADR-0003` |
| **GSD Bridge** | `gsd` Module | The Deep Module **Adapter** (`src/modules/gsd/index.mjs`) that delegates roadmap and phase state queries to `gsd-tools.cjs` while verifying that `.planning/` phases and plans reference `accepted` **ADRs** in `CONTEXT.md`. | GSD Wrapper, Phase Runner | `ADR-0006` |
| **Intent Profile** | `sizing` Module | The specialized task typology (`ui-tweak`, `bugfix`, `refactor`, `security-patch`, `infra`, `poc`, `feature`, `enterprise`) that sets the execution route, ceremony depth, and test strategy. | Task Type, Work Profile | `ADR-0007` |
| **Sensor** | `sensors` Module | A deterministic check running on artifact writes or at verification gates (`required-sections`, `traceability`, `claim-sources`, `receipt`) to catch defects prior to human review. | Linter, Check Hook | `ADR-0007` |
| **Learned Rule** | `learning` Module | A persistent prose guideline captured from engineer corrections during execution, recorded with a SHA-256 hash and audit timestamp. | Dynamic Rule, Learned Preference | `ADR-0007` |
| **Verification Receipt** | `sensors` / `review` | A tool-owned JSON receipt (`.planning/VERIFICATION_RECEIPT.json`) tied to the git tree hash that proves automated checks passed cleanly. | Test Output, Build Stamp | `ADR-0007` |
| **Practices Discovery** | `discovery` Module | The automated scanner that inspects brownfield repositories to extract framework, testing, and seam conventions into `CONTEXT.md`. | Repo Scanner, Tech Discovery | `ADR-0007` |
| **Codebase X-Ray** | `discovery` Module | The deterministic dependency graph, bounded-context cluster map, Fan-In/Fan-Out coupling metrics, and infrastructure fingerprint extracted from a repository via `analyzeCodebase`. | Repo Summary, Code Scan | `ADR-0008` |
| **Module Depth Ratio** | `discovery` Module | The ratio of hidden internal implementation lines to public exported symbols for a module, measuring adherence to **Deep Module** encapsulation (`ADR-0001`). | Complexity Ratio, Size Score | `ADR-0008` |
| **Retro-ADR** | `discovery` Module | An evidence-backed **Architecture Decision Record** synthesized from an existing codebase's files, dependency ratios, and Git commit history (`accepted`, `proposed`, or `drift-detected`). | Auto-Doc, Inferred Wiki | `ADR-0008` |
| **Split-Brain Architecture** | `discovery` Module | A contested brownfield state where two or more competing patterns or libraries coexist for the same concern, requiring an architect decision and a **Delete-Zone** designation. | Inconsistent Code, Mixed Stack | `ADR-0008` |
| **Architecture Visualizer** | `visualizer` Module | The Deep Module (`src/modules/visualizer/index.mjs`) that renders C4 maps, module seam coupling graphs, ADR coverage heatmaps, risk quadrants, and the interactive HTML explorer. | Diagram Generator, Chart Tool | `ADR-0008` |
| **Architecture Tour** | `visualizer` Module | The cognitive onboarding narrative (`ARCHITECTURE_TOUR.md`) explaining the system's mental model, what has been built, traced execution flows, and safe extension seams. | Onboarding Doc, Readme Guide | `ADR-0008` |
| **Governance Auto-Sync (`factory sync`)** | `scaffolder` Module | The deterministic scanner (`syncGovernanceDocs`) that inspects `src/modules/*` and `docs/adr/*.md` and automatically updates `CONTEXT.md` (Sections 2 & 3) and `docs/adr/README.md`. | Manual Markdown Sync, Hand-Edited ADR Index | `ADR-0009` |
| **Deep Module Scaffolder (`factory add-module`)** | `scaffolder` Module | The `< 50ms` generator (`scaffoldDeepModule`) that creates a Deep Module's public `index.mjs` seam, private `lib/` service, `tests/<name>.seam.test.mjs`, and auto-syncs `CONTEXT.md`. | Boilerplate Module, Manual Folder Setup | `ADR-0009` |
| **Turnkey API Scaffolder (`factory scaffold-api`)** | `scaffolder` Module | The `< 1s` service generator (`scaffoldApiService`) that creates a runnable Node.js HTTP JSON API server (`src/app.mjs`, `src/server.mjs`), Deep Modules, tests, and clean `ADR-0001` governance without polluting the target repo with internal factory modules. | Starter Template, API Boilerplate | `ADR-0009` |
| **Foundry Service Specification (`specs/service.spec.json`)** | `scaffolder` Module | The executable Spec-Driven Development (SDD) contract (`initFoundrySpec`, `validateFoundrySpec`, `compileFoundrySpec`, `verifySpecParity`) defining bounded contexts, entity field schemas, HTTP endpoint contracts, domain invariants, and Given/When/Then acceptance scenarios. | Unstructured Spec, Hollow CRUD | `ADR-0009` |
