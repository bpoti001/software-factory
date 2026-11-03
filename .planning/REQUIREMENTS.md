# Requirements: ADR-Governed Software Factory

## v1.0 Requirements

### Phase 1: Adaptive Agent Sizing Engine (`ADR-0001`, `ADR-0002`)
- **REQ-01**: Auto-detect `Small [S]`, `Medium [M]`, and `Large [L]` tasks from prompt and touched files, skipping deep research, Confluence MCP, and `/show-me` for `Small [S]` UI/copy/style changes (e.g., changing a button color).
- **REQ-02**: Support explicit user size overrides (`[S]`, `[M]`, `[L]`, `--small`, `--medium`, `--large`, `/quick`) with an automatic **Safety Escalation Guard** to `Large [L]` when package manifests, DB migrations, or ADRs are modified.

### Phase 2: Governance, Seam & ADR Parity Engine (`ADR-0001`, `ADR-0003`, `ADR-0004`)
- **REQ-03**: Reject cross-module and test imports into private `/lib/` or `/internal/` folders (**Seam Violations**) and barrel re-exports (`export * from './lib/'`).
- **REQ-04**: Enforce 1:1 **ADR Parity** between `CONTEXT.md` Section 3, `docs/adr/README.md`, and `docs/adr/*.md`, plus Structural Drift checks on manifest/schema edits.

### Phase 3: Two-Axis Review & Merge Danger Engine (`ADR-0001`, `ADR-0005`)
- **REQ-05**: Score every Pull Request diff across **Door Type** (`One-Way Door` vs. `Two-Way Door`) and **Blast Radius** (`Localized`, `Module-Wide`, `System-Wide`).
- **REQ-06**: Generate complete `/visual-pr` Markdown descriptions with `/show-me` file-tree diffs, ADR traceability links, and Two-Axis Review tables.

### Phase 4: Native GSD Framework Bridge & CLI (`ADR-0001`, `ADR-0006`)
- **REQ-07**: Expose a `gsd` Deep Module (`src/modules/gsd/index.mjs`) that delegates roadmap/state queries to `gsd-tools.cjs` while deterministically verifying that `.planning/` phases and `PLAN.md` files reference `accepted` ADRs in `CONTEXT.md`.
- **REQ-08**: Wire `node src/cli/factory.mjs gsd <status|validate>` and `./scripts/verify-governance.sh` into `.planning/config.json` (`workflow.code_review_command`).
