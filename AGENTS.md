# AGENTS.md — Universal Agent Harness Entry Point

This repository uses an **ADR-Governed Software Factory** model. Whether you are running in VS Code GitHub Copilot, Claude Code, Codex, or Antigravity, follow this exact navigation and governance contract.

## 1. Read Sequence on Session Start

1. **System Map & ADR Index**: Read [`CONTEXT.md`](./CONTEXT.md) first. It contains the architecture map, the Confluence ADR registry, active RFCs, and the Delete-Zone.
2. **Domain Language**: Read [`GLOSSARY.md`](./GLOSSARY.md) before naming types, modules, APIs, or writing specs.
3. **Agent Governance**: Read [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md) and [`docs/agents/domain.md`](./docs/agents/domain.md).

<important if="you are asked to implement a feature, fix a bug, or refactor code">
- **Verify ADR Alignment First**: Check `CONTEXT.md` Section 3 and fetch the relevant Confluence ADR pages via the Confluence MCP server (`confluence_get_page`).
- **Hard Stop on Architectural Drift**: If the requested work falls outside existing ADRs or introduces a new library, schema, cross-module contract, or architectural pattern, **STOP** and invoke the `@architect` workflow (`/create-adr` or `/create-rfc`) before writing production code.
- **4-Gate Vertical Slices**: Follow the 4-Gate workflow (Product/Jira -> Architecture/ADR -> Program Design `/show-me` -> Vertical Tracer-Bullet TDD `/tdd`).
</important>

<important if="you are reviewing code or preparing a Pull Request">
- Read [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) in a dedicated review pass (`/two-axis-review`).
- Format the Bitbucket PR description using `/visual-pr` including a `/show-me` structural diff, Before/After evidence, and a **Merge Danger** assessment (`One-Way Door` vs `Two-Way Door` + `Blast Radius`).
</important>
