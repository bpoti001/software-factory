# AGENTS.md — Universal Agent Harness Entry Point

This repository uses an **ADR-Governed Software Factory** model. Whether you are running in VS Code GitHub Copilot, Claude Code, Codex, or Antigravity, follow this exact navigation and governance contract.

## 1. Adaptive Agent Sizing (`Small [S]` | `Medium [M]` | `Large [L]`)

Before running deep research, determine the **Agent Execution Size** (either explicitly set by the engineer via `[S]`, `[M]`, `[L]` / `--small`, `--medium`, `--large` / `/quick`, or auto-detected):
- **🟢 Small (`[S]` / `/quick`)**: UI styling tweaks (e.g., changing a button color), copy/typo fixes, config constant tweaks, or `<= 2 file` localized fixes with zero interface/schema/dependency changes. **Skip research (`CONTEXT.md`, Confluence MCP, `/show-me`)**, make the surgical edit directly, and run `./scripts/verify-governance.sh`.
- **🟡 Medium (`[M]`)**: Feature, endpoint, or business logic within existing ADRs. Read `CONTEXT.md` + `GLOSSARY.md`, check governing ADRs, output a compact `/show-me` blueprint, and build via vertical-slice TDD (`/tdd`).
- **🔴 Large (`[L]`)**: New dependency/library, DB schema/migration, new Deep Module, or cross-module contract outside existing ADRs. **HARD STOP** -> mint ADR (`/create-adr`) or RFC (`/create-rfc`) on Confluence MCP -> update `CONTEXT.md` -> run full 4-Gate TDD & review.

## 2. Read Sequence for `Medium [M]` & `Large [L]` Tasks

1. **System Map & ADR Index**: Read [`CONTEXT.md`](./CONTEXT.md) first. It contains the architecture map, the Confluence ADR registry, active RFCs, and the Delete-Zone.
2. **Domain Language**: Read [`GLOSSARY.md`](./GLOSSARY.md) before naming types, modules, APIs, or writing specs.
3. **Agent Governance**: Read [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md) and [`docs/agents/domain.md`](./docs/agents/domain.md).

<important if="you are asked to implement a Medium [M] or Large [L] feature, or refactor module boundaries">
- **Verify ADR Alignment First**: Check `CONTEXT.md` Section 3 and fetch the relevant Confluence ADR pages via the Confluence MCP server (`confluence_get_page`).
- **Hard Stop on Architectural Drift (`Large [L]`)**: If the requested work falls outside existing ADRs or introduces a new library, schema, cross-module contract, or architectural pattern, **STOP** and invoke the `@architect` workflow (`/create-adr` or `/create-rfc`) before writing production code.
- **4-Gate Vertical Slices**: Follow the 4-Gate workflow (Product/Jira -> Architecture/ADR -> Program Design `/show-me` -> Vertical Tracer-Bullet TDD `/tdd`).
</important>

<important if="you are reviewing code or preparing a Pull Request">
- Read [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) in a dedicated review pass (`/two-axis-review`).
- Format the Bitbucket PR description using `/visual-pr` including a `/show-me` structural diff, Before/After evidence, and a **Merge Danger** assessment (`One-Way Door` vs `Two-Way Door` + `Blast Radius`).
</important>
