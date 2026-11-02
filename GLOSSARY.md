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
| **Tracer Bullet (Vertical Slice)** | A narrow, complete end-to-end slice of functionality cutting through all necessary seams (contract, domain logic, persistence, tests) that is independently verifiable in a single session. | Horizontal Phase, Layer Task |
| **One-Way Door** | A change whose consequences cannot be trivially undone by `git revert` (e.g., destructive schema migrations, external notifications, public contract breaks, data deletion). Requires heavy human architect review. | High-Risk PR |
| **Two-Way Door** | A change whose consequences are localized and immediately reversible via `git revert` or a feature flag. | Low-Risk PR |

---

## 2. Project Domain Concepts

> *Add your business-specific bounded context terms below as they crystallize during `@architect` and `@engineer` sessions.*

| Canonical Term | Bounded Context | Precise Definition | Avoided Synonyms | Confirmed Source |
|---|---|---|---|---|
| *[Example: Principal Entity]* | *Core Domain* | *[1-2 sentence business definition devoid of code details]* | *[Legacy or overloaded terms]* | `ADR-0000` / Domain Owner |
