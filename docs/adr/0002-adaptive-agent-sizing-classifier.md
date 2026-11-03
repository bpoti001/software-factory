# ADR-0002: Adaptive Agent Sizing Classifier (`Small [S]` | `Medium [M]` | `Large [L]`) & Safety Escalation

- **Date**: 2026-11-02
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0002` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0002`)
- **Jira Ticket / Epic**: `ARCH-3`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/sizing/`, `.github/agents/engineer.agent.md`, `.github/prompts/start.prompt.md`, `.github/prompts/quick.prompt.md`

---

## 1. Context & Problem Statement

Applying a uniform 4-Gate workflow (GSD deep research -> Confluence ADR queries -> `/show-me` program design -> multi-slice TDD) to every engineering task creates unacceptable friction on trivial changes—such as changing a button color, fixing a typo, or adjusting CSS spacing. Conversely, allowing engineers to bypass architecture checks on changes that introduce new dependencies, database schemas, or cross-module contracts leads to undocumented **Architectural Drift**.

## 2. Decision

We implement a **Dual-Mode Sizing Classifier** (`src/modules/sizing/index.mjs`) that assigns every task an **Execution Size** (`Small [S]`, `Medium [M]`, or `Large [L]`):

1. **Explicit User Override**: Engineers can pass `[S]`, `[M]`, `[L]` (or `--small`, `--medium`, `--large`, `/quick`) to explicitly choose the execution tier.
2. **Automatic Blast-Radius Detection**: When no flag is passed, the classifier inspects the task prompt and touched files:
   - **🟢 `Small [S]`**: UI styling/button color/copy/typo/constant tweaks touching `<= 2` files with zero contract changes -> sets `skipResearch: true`, `skipConfluenceMcp: true`, `skipShowMe: true`.
   - **🟡 `Medium [M]`**: Features, endpoints, or business logic within existing ADRs -> runs the 4-Gate workflow (`product`, `architecture`, `program-design`, `tdd`).
   - **🔴 `Large [L]`**: New dependencies, database schemas/migrations, new **Deep Modules**, or changes outside existing ADRs -> triggers `hardStopForAdrOrRfc: true`.
3. **Mandatory Safety Escalation Guard**: If a user explicitly passes `[S]` (or `/quick`), but the touched files include package manifests (`package.json`, `requirements.txt`, `pom.xml`), database migrations, or cross-module structural files, the classifier **overrides the `Small` request and escalates to `Large [L]`**.

### Deep Module Seam & Public Interface Sketch (`codebase-design`)

```js
// Public entry point: src/modules/sizing/index.mjs
/**
 * @param {{ prompt: string, changedFiles?: string[], explicitSize?: 'S' | 'M' | 'L' }} input
 * @returns {{
 *   size: 'S' | 'M' | 'L',
 *   label: 'Small [S]' | 'Medium [M]' | 'Large [L]',
 *   mode: 'user-override' | 'auto-detected' | 'safety-escalated',
 *   escalated: boolean,
 *   escalationReason: string | null,
 *   skipResearch: boolean,
 *   skipConfluenceMcp: boolean,
 *   skipShowMe: boolean,
 *   hardStopForAdrOrRfc: boolean,
 *   requiredGates: string[],
 *   recommendedCommand: string
 * }}
 */
export function classifyTaskSize(input) { ... }
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Always Run Full 4-Gate Research on Every Prompt
- **Pros**: Zero risk of missing an architectural check.
- **Cons**: Forces 3–5 minutes of Confluence/Jira MCP overhead just to change a button color; engineers abandon the agent harness out of frustration.
- **Why Rejected**: Violates developer velocity on `Two-Way Door` localized changes.

### Alternative 2: Unchecked User Override Without Safety Escalation
- **Pros**: Trusts the developer's `[S]` flag blindly.
- **Cons**: Developers under deadline pressure will pass `[S]` or `/quick` on schema migrations or new library additions to skip writing an ADR.
- **Why Rejected**: Coupling explicit user overrides with a deterministic file-path **Safety Escalation Guard** gives instant speed on real `Small` tasks while preventing accidental bypass on `Large` architectural changes.

## 4. Consequences & Merge Danger

### Positive
- Button color tweaks, copy fixes, and CSS adjustments execute in seconds with zero Confluence/GSD research overhead.
- Architectural changes (`Large [L]`) are deterministically caught and routed to `@architect` (`/create-adr` or `/create-rfc`).

### Negative & Trade-Offs
- Requires maintaining clear heuristic rules for `Small` vs. `Medium` vs. `Large` classification in `src/modules/sizing/lib/`.

### Door & Blast Radius
- **Door Classification**: `Two-Way Door`
- **Blast Radius**: `Module-Wide`
- **Verification Gate**: Verified via seam tests in `tests/sizing.seam.test.mjs`.
