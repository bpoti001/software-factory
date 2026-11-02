# Domain Documentation & ADR Consumer Rules (`docs/agents/domain.md`)

## 1. Layout: Combined `CONTEXT.md` + Confluence ADR Sync

This repository uses a **Hybrid Enterprise Governance Layout**:

- [`CONTEXT.md`](../../CONTEXT.md): The root architectural map, module ownership table, Delete-Zone, and **Master ADR/RFC Registry** linking Bitbucket code to Confluence pages.
- [`GLOSSARY.md`](../../GLOSSARY.md): The canonical Ubiquitous Language dictionary. Devoid of implementation details.
- **Confluence ADR Space** (mirrored in [`docs/adr/`](../adr/README.md)): Stores the full text of all **Architecture Decision Records (ADRs)**.
- **Confluence RFC Space** (mirrored in [`docs/rfc/`](../rfc/README.md)): Stores cross-cutting **Requests for Comments (RFCs)** before they are decomposed into Jira tracer-bullet tickets.

## 2. Mandatory Consumer Rules for All Agents

1. **Before Planning or Writing Code**:
   - Read `CONTEXT.md` and `GLOSSARY.md`.
   - Identify all ADRs governing the target module(s) from `CONTEXT.md` Section 3.
   - Fetch the full ADR content from Confluence via the Confluence MCP (`confluence_get_page`) or read its local mirror in `docs/adr/`.
2. **When Architectural Drift or a Gap is Detected**:
   - Do **not** invent undocumented patterns or silently deviate from an `accepted` ADR.
   - Determine whether the change requires a **New ADR** (single bounded decision: library, pattern, seam, schema) or an **RFC** (multi-module, cross-team, breaking contract, or phased migration).
   - Generate the ADR (`docs/adr/NNNN-title.md`) or RFC (`docs/rfc/RFC-NNNN-title.md`), publish it to Confluence via MCP, and register its ID and Confluence URL in `CONTEXT.md`.
