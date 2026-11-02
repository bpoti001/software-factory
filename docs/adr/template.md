# ADR-NNNN: [Short Noun-Phrase Title of Decision]

- **Date**: YYYY-MM-DD
- **Status**: `proposed` | `accepted` | `deprecated` | `superseded by ADR-XXXX`
- **Deciders**: [Architects / Principal Engineers]
- **Confluence Page**: `[CONF-PAGE-ID](https://your-org.atlassian.net/wiki/spaces/ARCH/pages/...)`
- **Jira Ticket / Epic**: `[PROJ-XXXX](https://your-org.atlassian.net/browse/PROJ-XXXX)`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/<domain>/`

---

## 1. Context & Problem Statement

[2–5 sentences describing the architectural force, business constraint, or technical drift motivating this decision. Use exact domain terminology from `GLOSSARY.md`.]

## 2. Decision

[1–3 sentences stating the chosen design clearly in the present tense ("We use...", "We expose...").]

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```ts
// Public entry point: src/modules/<domain>/index.ts
// Everything inside src/modules/<domain>/lib/ remains hidden.
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: [Name of Alternative A]
- **Pros**: [Benefits]
- **Cons**: [Drawbacks / Shallow module risks]
- **Why Rejected**: [Specific load-bearing reason]

### Alternative 2: [Name of Alternative B]
- **Pros**: [Benefits]
- **Cons**: [Drawbacks]
- **Why Rejected**: [Specific load-bearing reason]

## 4. Consequences & Merge Danger

### Positive
- [Leverage gained for callers / Locality gained for maintainers]

### Negative & Trade-Offs
- [Costs accepted]

### Door & Blast Radius
- **Door Classification**: `Two-Way Door` (reversible) | `One-Way Door` (irreversible / high-cost migration)
- **Blast Radius**: `Localized` | `Module-Wide` | `Cross-System`
- **Verification Gate**: [How automated checks or seam tests prove compliance]
