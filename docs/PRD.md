# Product Requirements Document (PRD): ADR-Governed Software Factory, Foundry SDD & Research Governance Engine

- **Document ID**: `PRD-0001`
- **Status**: `approved` (Unified Baseline `v2.0.0` — Upgraded from `origin/docs/prd-01` `v1.0.0`)
- **Last Updated**: 2026-11-20
- **Governing ADRs**: `ADR-0000`, `ADR-0001`, `ADR-0002`, `ADR-0003`, `ADR-0004`, `ADR-0005`, `ADR-0006`, `ADR-0007`, `ADR-0008`, `ADR-0009`, `ADR-0010`
- **Governing RFC**: [`RFC-0001`](./rfc/RFC-0001-executable-software-factory-engine.md)
- **GSD Planning Spine**: [`.planning/PROJECT.md`](../.planning/PROJECT.md), [`.planning/REQUIREMENTS.md`](../.planning/REQUIREMENTS.md), [`.planning/ROADMAP.md`](../.planning/ROADMAP.md), [`.planning/STATE.md`](../.planning/STATE.md)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
As engineering and research organizations scale AI-assisted development across **VS Code GitHub Copilot**, **Claude Code**, **Antigravity**, the **GSD (Get Shit Done) Framework**, and **Atlassian MCPs** (**Jira**, **Confluence**, **Bitbucket**), four failure modes emerge:
1. **Unchecked Architectural Drift & Zombie Code**: Coding agents introduce unauthorized libraries, bypass Deep Module boundaries (`lib/` or `internal/` imports), recreate intentionally deleted patterns, or execute GSD phase plans without linking to accepted ADRs.
2. **One-Size-Fits-All Ceremony Bottlenecks**: Applying heavy architectural research and manual 5-file Markdown table editing to trivial tweaks (`Small [S]`) or greenfield API services slows delivery from minutes to days.
3. **Brownfield Opacity**: Existing repositories lack living architectural maps, Retro-ADRs, hotspot risk visibility, and cognitive onboarding narratives.
4. **Research Integrity & Provenance Drift**: Automated benchmark and review pipelines can silently emit hardcoded metric arrays, scripted verdicts, broken LaTeX citations, stale summaries, or unbounded daemon pipes unless governed by deterministic sensors.

### 1.2 Product Vision
Provide a **zero-dependency, executable ADR-Governed Software Factory** (`src/cli/factory.mjs` + 9 Deep Modules under `src/modules/*`) that:
- Routes work via **Adaptive Agent Sizing (`Small [S]` | `Medium [M]` | `Large [L]`)**, **Intent Profiles**, and **Honest Role Routing** (`planner`, `builder`, `reviewer`, `overseer`).
- Deterministically enforces **Deep Module seams (`ADR-0001`)**, **Two-Way ADR Parity (`ADR-0003`)**, **Signed Verification Receipts (`ADR-0007`)**, **GSD `.planning/` ADR Traceability (`ADR-0006`)**, and **9 Research Provenance Sensors (`ADR-0010`)**.
- Accelerates greenfield & brownfield velocity via **Brownfield X-Ray & 5-Lens Visual Intelligence (`ADR-0008`)** and **Foundry Spec-Driven Development & Two-Way Auto-Sync (`ADR-0009`)**.

---

## 2. Target Users & Personas

| Persona | Primary Agent / Entry Point | Core Jobs-to-be-Done (JTBD) | Key Pain Points Solved |
| :--- | :--- | :--- | :--- |
| **New / Onboarding Engineer** | `@onboarding`, `/onboard`, `factory analyze --visualize` | Understand system boundaries, ubiquitous domain terms, active ADRs, and visual architecture tours immediately. | Eliminates tribal knowledge gaps via `CONTEXT.md`, `GLOSSARY.md`, `VISUAL_ARCHITECTURE.md`, and `ARCHITECTURE_TOUR.md`. |
| **Feature / API Engineer** | `@engineer`, `factory spec`, `factory scaffold-api`, `factory add-module`, `factory sync` | Ship trivial fixes (`[S]`) in seconds and build spec-validated, governed API services in `< 60s` without manual Markdown table editing. | Eliminates multi-day API scaffolding ceremony and Day-2 route/governance desynchronization. |
| **Staff / Principal Architect** | `@architect`, `factory add-adr`, `factory adr-synthesize` | Stress-test hard-to-reverse decisions, mint sensor-compliant ADRs/RFCs, synthesize Retro-ADRs on brownfield repos, and enforce `One-Way Door` rollback plans. | Prevents undocumented dependencies, schema changes, or cross-module leaks from landing without an approved ADR/RFC. |
| **Code Reviewer / Tech Lead** | `@pr-reviewer`, `factory pr-report`, `factory learn` | Audit diffs in an isolated context against `CODING_STANDARDS.md` (Axis 1) and Spec/Jira fidelity (Axis 2), verify receipts, and codify corrections into permanent rules. | Eliminates repetitive review comments and flags `One-Way Door` / `System-Wide` blast radius changes. |
| **Research Engineer / Overseer** | `@factory-overseer`, `factory overseer-audit`, `factory nudge` | Enforce empirical benchmark purity, raw `.jsonl` provenance, LaTeX citation bijection, template hygiene, and continuous backlog tracking (`ENHANCEMENT_BACKLOG.md`). | Prevents fabricated metrics, scripted verdicts, pipe deadlocks, and manuscript citation drift. |

---

## 3. End-to-End Traceability Matrix (Phases 1–9 <-> ADRs <-> Deep Modules)

| GSD Phase | Capability & Subsystem | Governing ADRs | Deep Module Public Seam | Verification Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Adaptive Agent Sizing & Safety Escalation | `ADR-0001`, `ADR-0002` | [`src/modules/sizing/index.mjs`](../src/modules/sizing/index.mjs) | [`tests/sizing.seam.test.mjs`](../tests/sizing.seam.test.mjs) |
| **Phase 2** | Governance, Seam & Two-Way ADR Parity Engine | `ADR-0001`, `ADR-0003`, `ADR-0004` | [`src/modules/governance/index.mjs`](../src/modules/governance/index.mjs) | [`tests/governance.seam.test.mjs`](../tests/governance.seam.test.mjs) |
| **Phase 3** | Two-Axis Review, Merge Danger & `/visual-pr` | `ADR-0001`, `ADR-0005` | [`src/modules/review/index.mjs`](../src/modules/review/index.mjs) | [`tests/review.seam.test.mjs`](../tests/review.seam.test.mjs) |
| **Phase 4** | Native GSD Framework Bridge & `.planning/` Gate | `ADR-0001`, `ADR-0006` | [`src/modules/gsd/index.mjs`](../src/modules/gsd/index.mjs) | [`tests/gsd.seam.test.mjs`](../tests/gsd.seam.test.mjs) |
| **Phase 5** | AI-DLC Synthesis (Intent Profiles, Sensors, Self-Learning, Receipts, Discovery) | `ADR-0001`, `ADR-0007` | [`src/modules/sensors/index.mjs`](../src/modules/sensors/index.mjs), [`src/modules/learning/index.mjs`](../src/modules/learning/index.mjs) | [`tests/aidlc.seam.test.mjs`](../tests/aidlc.seam.test.mjs) |
| **Phase 6** | Dogfooding Remediation & Enterprise Hardening | `ADR-0001`, `ADR-0003`–`ADR-0005`, `ADR-0007` | Cross-cutting (`governance`, `sizing`, `review`, `cli`) | [`tests/remediation.seam.test.mjs`](../tests/remediation.seam.test.mjs) |
| **Phase 7** | Brownfield Archaeology, Retro-ADR Synthesis & 5-Lens Visual Intelligence | `ADR-0001`, `ADR-0007`, `ADR-0008` | [`src/modules/discovery/index.mjs`](../src/modules/discovery/index.mjs), [`src/modules/visualizer/index.mjs`](../src/modules/visualizer/index.mjs) | [`tests/archaeology-visualizer.seam.test.mjs`](../tests/archaeology-visualizer.seam.test.mjs) |
| **Phase 8** | Foundry Spec-Driven Development (SDD), API Scaffolder & Two-Way Auto-Sync | `ADR-0001`, `ADR-0004`, `ADR-0009` | [`src/modules/scaffolder/index.mjs`](../src/modules/scaffolder/index.mjs) | [`tests/scaffolder.seam.test.mjs`](../tests/scaffolder.seam.test.mjs) |
| **Phase 9** | Research Factory Governance, 9 Provenance Sensors, Honest Role Routing & Overseer Nudge Loop | `ADR-0001`, `ADR-0002`, `ADR-0007`, `ADR-0010` | [`src/modules/sensors/index.mjs`](../src/modules/sensors/index.mjs), [`src/modules/sizing/index.mjs`](../src/modules/sizing/index.mjs), [`src/modules/learning/index.mjs`](../src/modules/learning/index.mjs) | [`tests/aidlc.seam.test.mjs`](../tests/aidlc.seam.test.mjs), [`tests/cli.integration.test.mjs`](../tests/cli.integration.test.mjs) |

---

## 4. Core Functional Requirements (v2.0.0)

1. **Adaptive Sizing & Honest Role Routing (`FR-SIZE-01..06`)**: Classify `[S]`/`[M]`/`[L]` with Safety Escalation Guard on manifests/schemas/new modules, detect Intent Profiles (including `research`), and emit role routing descriptors documenting host-level invocation-time model selection (`ADR-0002`, `ADR-0007`, `ADR-0010`).
2. **Deterministic Governance & Verification Receipts (`FR-GOV-01..05`)**: Enforce Deep Module seam encapsulation (`ADR-0001`), Delete-Zone bans, two-way `CONTEXT.md` <-> `docs/adr/` parity (`ADR-0003`), GSD `.planning/` ADR alignment (`ADR-0006`), and SHA-256 signed `.planning/VERIFICATION_RECEIPT.json` checkpoints (`ADR-0007`).
3. **Brownfield X-Ray & Visual Intelligence (`FR-VIS-01..05`)**: Extract dependency graphs, Module Depth Ratios, Fan-In/Out, Git epochs & hotspot gravity, evidence-backed Retro-ADRs, 5-lens Mermaid diagrams (`VISUAL_ARCHITECTURE.md`), `ARCHITECTURE_TOUR.md`, and standalone `explorer.html` (`ADR-0008`).
4. **Foundry Spec-Driven Development & Two-Way Auto-Sync (`FR-SDD-01..05`)**: Author, validate, compile, and verify parity against executable `specs/service.spec.json` + `specs/SPEC.md`; generate schema-validated Deep Modules (`422` errors, `1MB` payload guard, `GET /api/<m>/:id`), auto-wire `src/app.mjs` on `add-module`, auto-generate `[ADR-NNNN]` traceability tests on `add-adr`, and perform two-way `CONTEXT.md` sync (`ADR-0009`).
5. **Research Integrity & Overseer Loop (`FR-RES-01..09`)**: Run all 9 deterministic research provenance sensors inside `runSensors()` and `factory verify` (citation bijection, read-path purity, empirical benchmark purity, file size ceiling, dynamic report interpolation, no scripted verdicts, raw-record provenance with `ENH-0018` mtime check, unbounded subprocess pipe guard, LaTeX template hygiene) alongside `factory overseer-audit` and `factory nudge` (`ADR-0010`).

---

## 5. Non-Functional Requirements (NFRs)

| Category | Requirement ID | Specification & Target Metric |
| :--- | :--- | :--- |
| **Zero External Dependencies** | **NFR-01** | Runtime CLI and all 9 Deep Modules execute using pure Node.js ESM built-ins with **zero `npm` runtime dependencies** (`ADR-0004`). |
| **Maintainability & File Ceiling** | **NFR-02** | Core source files under `src/` stay under [`CODING_STANDARDS.md`](../CODING_STANDARDS.md)'s **800-LOC hard ceiling** (target 200–400 LOC), with `checkFileSizeCeiling` enforcing a 1,000-LOC cap repo-wide. |
| **Portability** | **NFR-03** | Zero machine-local absolute symlinks committed to Git; optional Marketplace plugin skills link cleanly via [`scripts/sync-plugin-skills.sh`](../scripts/sync-plugin-skills.sh). |
| **Immutability & Purity** | **NFR-04** | Public seam outputs across all 9 modules are deeply frozen (`Object.freeze`) with zero cross-module `/lib/` imports. |
| **Cross-Harness Compatibility** | **NFR-05** | Governance contracts operate identically across GitHub Copilot, Claude Code (`CLAUDE.md`), and Antigravity/Codex (`AGENTS.md`). |
