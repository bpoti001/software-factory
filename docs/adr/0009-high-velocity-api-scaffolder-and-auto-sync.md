# ADR-0009: High-Velocity API Service Scaffolder, Auto-Sync Living Docs, and Zero-Ceremony Module Generator

- **Status**: `accepted`
- **Date**: 2026-11-10
- **Deciders**: `@architect`, Principal Engineering
- **Confluence Source**: `CONF-ADR-0009` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0009`)
- **Governing Jira Epic**: `ARCH-11`
- **Scope / Bounded Context**: `src/modules/scaffolder/`, `src/modules/sizing/`, `src/cli/factory.mjs`, `scripts/factory-init.sh`

---

## 1. Context & Problem Statement

When engineers use the ADR-Governed Software Factory to build a multi-endpoint API service from scratch, delivery takes multiple days instead of minutes due to five compounding workflow bottlenecks:
1. **Repeated `Large [L]` Hard-Stop Interruptions**: Creating each domain module (`users`, `orders`, `auth`), route, or schema file triggers an isolated `Large [L]` hard stop requiring manual ADR authoring before writing code.
2. **Manual 5-File Markdown Synchronization Tax**: Every new module or ADR requires hand-editing `docs/adr/NNNN-*.md`, `docs/adr/README.md`, `CONTEXT.md` Section 2, `CONTEXT.md` Section 3, and `.planning/ROADMAP.md` with exact regex-matching table syntax. A single formatting mismatch causes `factory verify` to reject commits.
3. **Per-Endpoint Ceremony Overhead**: Running separate Jira/Confluence MCP queries, GSD phase plans, and multi-agent handoffs per CRUD endpoint multiplies token and human latency by $10\times$.
4. **Target Repo Module Pollution in `factory-init.sh`**: Copying the Software Factory's own internal `src/modules/*` (`sizing`, `governance`, `sensors`, etc.) and `ADR-0000`–`ADR-0008` into a target API repository pollutes the application's domain module namespace.
5. **Lack of 1-Command Service & Module Generators**: Engineers lack deterministic CLI generators to scaffold a working Deep-Module API service, add a governed domain module, mint a sensor-compliant ADR, or auto-sync `CONTEXT.md`.

---

## 2. Decision

We will introduce the **High-Velocity Scaffolder & Auto-Sync Governance Module (`src/modules/scaffolder/index.mjs`)** and wire four high-speed automation commands into `src/cli/factory.mjs`:

1. **Automated Governance Healer (`factory sync` -> `syncGovernanceDocs`)**:
   - Scans `src/modules/*` and `docs/adr/*.md` and automatically updates `CONTEXT.md` Section 2 (Module Map), `CONTEXT.md` Section 3 (ADR Registry), and `docs/adr/README.md` so engineers and agents never hand-edit Markdown parity tables.

2. **1-Command Deep Module Generator (`factory add-module <name>` -> `scaffoldDeepModule`)**:
   - Generates `src/modules/<name>/index.mjs` (narrow public seam), `src/modules/<name>/lib/<name>-service.mjs` (encapsulated domain logic), and `tests/<name>.seam.test.mjs` (public-seam test), then invokes `syncGovernanceDocs` automatically in `< 50ms`.

3. **1-Command Sensor-Compliant ADR Generator (`factory add-adr "<Title>"` -> `scaffoldAdr`)**:
   - Mints the next sequential `docs/adr/NNNN-<slug>.md` pre-populated with all four mandatory sensor sections (`## 1. Context & Problem Statement`, `## 2. Decision`, `## 3. Alternatives Considered`, `## 4. Consequences`) and auto-registers it across `CONTEXT.md` and `docs/adr/README.md`.

4. **1-Command Turnkey API Service Scaffolder (`factory scaffold-api` -> `scaffoldApiService`)**:
   - Generates a complete, runnable, zero-dependency Node.js HTTP JSON API service in any target directory (`--out <dir> --name <name> --modules auth,users,orders`) complete with:
     - `src/app.mjs` and `src/server.mjs` (`/health` and `/api/<module>` REST endpoints)
     - Governed Deep Modules under `src/modules/<module>/`
     - Passing seam and HTTP API integration tests (`tests/*.test.mjs`)
     - Clean project-specific `CONTEXT.md`, `GLOSSARY.md`, `CODING_STANDARDS.md`, and `docs/adr/` without polluting the target app's `src/modules/` with internal factory modules.

---

## 3. Alternatives Considered

- **Alternative A: Keep Manual Markdown Editing and Enforce Strict Failures Only**:
  - *Rejected*: Forces humans and coding agents to spend 80% of their time debugging Markdown table formatting instead of building API business logic.
- **Alternative B: Disable Governance Verification on API Projects**:
  - *Rejected*: Loses Deep Module seam encapsulation (`ADR-0001`) and architectural traceability (`ADR-0003`). Making compliance automatic via `factory sync`, `factory add-module`, and `factory scaffold-api` achieves both high velocity and 100% governance.

---

## 4. Consequences

### Positive
- Building a multi-module governed API service drops from **multiple days to under 60 seconds** (`factory scaffold-api` + `factory add-module` + `factory sync`).
- Eliminates manual `CONTEXT.md` and `docs/adr/README.md` parity failures completely.
- Target API repositories stay 100% clean, containing only their own domain modules in `src/modules/`.

### Negative / Trade-offs
- Auto-synced rows in `CONTEXT.md` use inferred descriptions until enriched by the engineer or architect.
