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
