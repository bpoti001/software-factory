# GSD Framework Integration Architecture (`docs/agents/gsd-integration.md`)

> **Governed by**: `ADR-0000`, `ADR-0001`, `ADR-0002`, `ADR-0003`, `ADR-0004`, `ADR-0005`

This document defines how the **ADR-Governed Software Factory** cleanly integrates with the existing **GSD (Get Shit Done) Framework** (`~/.gemini/antigravity/gsd-core`) without rebuilding or altering GSD's core engine.

---

## 1. Division of Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GSD FRAMEWORK (Tactical Execution)                    │
│  • Milestone & Phase Roadmapping (.planning/ROADMAP.md, STATE.md)           │
│  • Phase Planning (/gsd-plan-phase) & Discussion (/gsd-discuss-phase)       │
│  • Task Execution (/gsd-execute-phase) & Verification (/gsd-verify-work)    │
│  • Codebase Reconnaissance & Research Stores (.planning/research/)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         CLEAN INTEGRATION BRIDGE
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    SOFTWARE FACTORY (Strategic Governance)                  │
│  • Master Context Map & Delete-Zone (CONTEXT.md, GLOSSARY.md)               │
│  • Architectural Decision Records (Confluence ADRs <-> docs/adr/)           │
│  • Adaptive Sizing Classifier ([S] Small, [M] Medium, [L] Large)            │
│  • Hard Stop on Architectural Drift (@architect /create-adr /create-rfc)    │
│  • Deep Module Seam & ADR Parity Gate (scripts/verify-governance.sh)        │
│  • Separate-Context Two-Axis PR Review & Merge Danger (@pr-reviewer)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 4 Integration Touchpoints

### Touchpoint 1: Project & Roadmap Alignment (`CONTEXT.md` <-> `.planning/`)
- **GSD State Tracker**: GSD maintains `.planning/PROJECT.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md`.
- **Software Factory Constitution**: `CONTEXT.md` remains the repository's single source of architectural truth, module ownership, and Confluence ADR index.
- **Contract**: In `.planning/PROJECT.md` and phase plans (`.planning/phases/*/PLAN.md`), every planned feature or phase explicitly cites the governing **`ADR-NNNN`** from `CONTEXT.md` Section 3.

### Touchpoint 2: GSD Configuration Bridge (`.planning/config.json`)
The Software Factory configures GSD's `.planning/config.json` to automatically invoke the factory's deterministic governance checks:
```json
{
  "workflow": {
    "code_review": true,
    "code_review_command": "./scripts/verify-governance.sh",
    "plan_check": true,
    "verifier": true
  },
  "claude_md_path": "./AGENTS.md"
}
```
- When GSD executes `/gsd-verify-work` or its automated code review step, it directly triggers `./scripts/verify-governance.sh` to guarantee that all touched code respects **Deep Module seams (`ADR-0001`)** and has **100% ADR Parity (`ADR-0003`)**.

### Touchpoint 3: Adaptive Agent Sizing & Drift Escalation
When an engineer triggers `/start` or `@engineer`:
1. **`🟢 Small [S]`**: Runs the zero-research fast-track (or `/gsd-quick`). Skips full phase roadmapping.
2. **`🟡 Medium [M]`**: Reads the governing ADR from `CONTEXT.md` and delegates execution to GSD's phase loop (`/gsd-plan-phase` -> `/gsd-execute-phase`), building in vertical tracer-bullet slices through the public seam (`index.*`).
3. **`🔴 Large [L]` (HARD STOP)**:
   - If a GSD phase plan requires a new library, database schema, or cross-module contract outside existing ADRs, GSD **halts execution**.
   - The engineer invokes `@architect` (`/create-adr` or `/create-rfc`) to mint the Confluence ADR and update `CONTEXT.md`.
   - Once documented, GSD resumes planning and execution against the accepted ADR.

### Touchpoint 4: GSD Phase Completion & Ship -> Two-Axis Review
When GSD finishes a milestone or phase (`/gsd-ship` or `/gsd-complete-milestone`):
- Instead of opening an unsummarized PR, GSD hands off to `@pr-reviewer`:
  - Runs `/two-axis-review` (Axis 1: Standards & ADRs; Axis 2: Jira Spec).
  - Evaluates **Merge Danger** (`One-Way Door` vs. `Two-Way Door` + `Blast Radius`).
  - Generates the complete Bitbucket `/visual-pr` description.
