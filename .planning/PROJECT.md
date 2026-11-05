# Project: ADR-Governed Software Factory & GSD Engine

## What This Is

An enterprise AI-assisted Software Factory that unites **VS Code GitHub Copilot Agents** (`@onboarding`, `@architect`, `@engineer`, `@pr-reviewer`), **Jira/Confluence/Bitbucket MCP governance**, and the **GSD (Get Shit Done) Framework** (`gsd-tools.cjs` + `.planning/`).

## Core Value

Eliminate architectural drift and pull-request review bottlenecks by enforcing **Adaptive Agent Sizing (`Small [S]` | `Medium [M]` | `Large [L]`)**, **Deep Module Seams (`ADR-0001`)**, **Confluence <-> `CONTEXT.md` ADR Parity (`ADR-0003`)**, and **Two-Axis Merge Danger Reviews (`ADR-0005`)** across every GSD phase.

## Architecture & Governance Reference

- **Product Requirements Document (PRD)**: [`docs/PRD.md`](../docs/PRD.md)
- **Master Context & ADR Registry**: [`CONTEXT.md`](../CONTEXT.md)
- **Ubiquitous Domain Language**: [`GLOSSARY.md`](../GLOSSARY.md)
- **Separate-Context Review Standards**: [`CODING_STANDARDS.md`](../CODING_STANDARDS.md)
- **GSD Integration Spec**: [`docs/agents/gsd-integration.md`](../docs/agents/gsd-integration.md)

## Key Decisions

| Phase / ADR | Decision Summary | Status |
|---|---|---|
| `ADR-0000` | ADR-Driven Software Factory & Mandatory Documentation Gate | `accepted` |
| `ADR-0001` | Deep Module Boundaries & Single Entry-Point Encapsulation (`index.mjs` vs `lib/`) | `accepted` |
| `ADR-0002` | Dual-Mode Adaptive Agent Sizing (`Small [S]` / `Medium [M]` / `Large [L]`) & Safety Escalation | `accepted` |
| `ADR-0003` | Hybrid Living-Docs Governance (`CONTEXT.md` <-> Confluence MCP & Local `docs/adr/` Parity) | `accepted` |
| `ADR-0004` | Deterministic Zero-Dependency Node ESM Governance CLI (`src/cli/factory.mjs`) | `accepted` |
| `ADR-0005` | Two-Axis Separate-Context PR Review & Merge Danger (`One-Way` vs `Two-Way Door`) Scoring | `accepted` |
| `ADR-0006` | Native GSD Framework Bridge (`src/modules/gsd/index.mjs`) & `.planning/` ADR Traceability | `accepted` |
