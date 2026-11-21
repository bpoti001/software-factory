# ADR-0009: Foundry Spec-Driven Development (SDD) Engine, High-Velocity API Scaffolder, and Two-Way Governance Auto-Sync

- **Status**: `accepted`
- **Date**: 2026-11-12
- **Deciders**: `@architect`, Principal Engineering
- **Confluence Source**: `CONF-ADR-0009` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0009`)
- **Governing Jira Epic**: `ARCH-11`
- **Scope / Bounded Context**: `src/modules/scaffolder/`, `src/cli/factory.mjs`, `specs/`

---

## 1. Context & Problem Statement

When engineers use the ADR-Governed Software Factory to build a multi-endpoint API service, two failure modes occur:
1. **Multi-Day Ceremony without Automation**: Hand-editing 5 Markdown governance tables (`CONTEXT.md` Sections 2 & 3, `docs/adr/README.md`, `docs/adr/NNNN-*.md`, `.planning/ROADMAP.md`) and hitting repeated `Large [L]` stops on every folder creation stalls API delivery for days.
2. **Hollow Boilerplate without Spec-Driven Development (SDD)**: A naive scaffolder that accepts only bare module names (`--modules users,orders`) introduces 8 structural problems identified during our Two-Axis Self-Review (`CODING_STANDARDS.md`):
   - **S01 (Blind CRUD without Schema Validation)**: Accepting arbitrary unvalidated payloads violates `CODING_STANDARDS.md` §2.2 boundary validation rules.
   - **S02 (Day-2 Route Desynchronization)**: Running `add-module` without updating `src/app.mjs` leaves new modules unrouted (`404 Not Found`), re-introducing Shotgun Surgery (§3.7).
   - **S03 (Orphaned ADR Sensor Failures)**: Minting an ADR via `add-adr` without a linked `[ADR-NNNN]` contract test causes `checkTraceability` to fail on the next `factory verify`.
   - **S04 (Unbounded HTTP Body DoS & Missing `:id` Routes)**: Reading `req.on('data')` without a `MAX_BODY_BYTES` ceiling violates §2.3 Security Checklist, and omitting `GET /api/<module>/:id` leaves `get<Singular>ById` unreachable over HTTP.
   - **S05 (One-Way Sync Stale Rows)**: `syncGovernanceDocs` only appended new modules/ADRs and never pruned deleted modules or ADRs from `CONTEXT.md` and `docs/adr/README.md`.
   - **S06 (Unresettable Singleton State)**: Module stores lacked `reset<Plural>Store()` and validation hooks, causing cross-test state contamination.
   - **S07 (Monolithic File & Function Granularity)**: Putting sync, ADR/module templating, and HTTP scaffolding in a single 633-line file violated `CODING_STANDARDS.md` §2.2 (target 200–400 lines) and §3.8 (Divergent Change).
   - **S08 (Missing Operations Rollback Plan)**: As a `One-Way Door` change touching CLI and governance contracts, `ADR-0009` requires an explicit rollback runbook (`ADR-0005`, `ADR-0007`).

---

## 2. Decision

We will upgrade `src/modules/scaffolder/index.mjs` into a **Foundry Spec-Driven Development (SDD) & High-Velocity Scaffolder Engine**, decomposed internally into focused private submodules under `src/modules/scaffolder/lib/`:

1. **Foundry Spec-Driven Development Engine (`src/modules/scaffolder/lib/spec-engine.mjs`)**:
   - `initFoundrySpec({ cwd, serviceName, port, modules })`: Generates an executable **Foundry Service Specification** (`specs/service.spec.json`) and human-readable **Spec Blueprint** (`specs/SPEC.md`) defining bounded contexts, entity field schemas (`type`, `required`, `enum`, `min`, `max`), REST endpoint contracts (`GET /api/<m>`, `GET /api/<m>/:id`, `POST /api/<m>`), domain invariants, and Given/When/Then acceptance scenarios.
   - `validateFoundrySpec(spec)`: Deterministically validates schema completeness, field types, endpoint contracts, and acceptance scenarios before code generation.
   - `compileFoundrySpec({ cwd, specPath })`: Compiles a validated Foundry Spec into schema-enforcing Deep Modules, HTTP routes, ADR traceability docs, and Spec Acceptance Tests (`tests/spec.acceptance.test.mjs`).
   - `verifySpecParity({ cwd, specPath })`: Verifies 1:1 parity between `specs/service.spec.json`, `src/modules/<domain>/index.mjs` exports, `src/app.mjs` routes, `CONTEXT.md`, and `tests/`.

2. **Two-Way Governance Auto-Sync Engine (`src/modules/scaffolder/lib/sync-engine.mjs`)**:
   - `syncGovernanceDocs({ cwd })`: Performs **two-way synchronization**—registering newly created `src/modules/*` and `docs/adr/NNNN-*.md` AND pruning stale rows for deleted modules or deleted ADR files from `CONTEXT.md` and `docs/adr/README.md`.

3. **Hardened Module, ADR & API Generator (`src/modules/scaffolder/lib/generator-engine.mjs`)**:
   - `scaffoldDeepModule`: Generates `src/modules/<name>/index.mjs` + `lib/<name>-service.mjs` with **boundary schema validation** (`validate<Singular>Input` returning `{ valid, errors }` and throwing `statusCode: 422` on invalid fields), `reset<Plural>Store()`, and **automatically wires the module into `src/app.mjs`** if an API router exists in the project.
   - `scaffoldAdr`: Mints a sensor-compliant `docs/adr/NNNN-<slug>.md` AND creates/updates `tests/adr-traceability.test.mjs` citing `[ADR-NNNN]` so `checkTraceability` passes immediately.
   - `scaffoldApiService`: Generates a hardened HTTP JSON API server (`src/app.mjs`) with a `1MB` `MAX_BODY_BYTES` payload guard (`413 Payload Too Large`), `422 Unprocessable Entity` schema validation errors, `GET /health`, `GET /api/<module>`, `GET /api/<module>/:id`, and `POST /api/<module>`, backed by `specs/service.spec.json` and `specs/SPEC.md`.

---

## 3. Alternatives Considered

- **Alternative A: Keep Spec-Less String-Only Scaffolding (`--modules users,orders`)**:
  - *Rejected*: Produces hollow CRUD shells without field validation, domain invariants, or testable acceptance criteria, forcing engineers back into days of manual wiring.
- **Alternative B: Require External OpenAPI / Heavy Codegen Dependencies**:
  - *Rejected*: Violates `ADR-0004` (zero external npm dependencies). Native JSON/Markdown Foundry Specs (`specs/service.spec.json` + `specs/SPEC.md`) require zero external packages and run in `< 50ms`.

---

## 4. Consequences

### Positive
- Enables true **Spec-Driven Development (SDD) on the Foundry**: engineers or AI agents edit `specs/service.spec.json`, run `factory spec validate && factory spec compile`, and get schema-validated Deep Modules, REST routes, ADRs, and acceptance tests in `< 100ms`.
- Resolves all 8 defects (`S01`–`S08`) identified during the Software Factory self-review.

### Negative / Trade-offs
- Generated boundary validators support standard JSON schema primitives (`string`, `number`, `boolean`, `enum`, `required`, `min`, `max`); complex cross-entity async rules still belong in domain service methods.

### Operations & Rollback Runbook (`ADR-0005` / `ADR-0007`)
- **Blast Radius**: Scoped to `src/modules/scaffolder/`, `src/cli/factory.mjs`, and `specs/`.
- **Rollback Procedure**: Revert branch `feat/high-velocity-api-scaffolder` or run `git revert <commit>` and `node src/cli/factory.mjs verify` to restore pre-Phase-8 CLI surface.
