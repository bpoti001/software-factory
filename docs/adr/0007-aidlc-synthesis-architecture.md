# ADR-0007: AI-DLC Synthesis Architecture (Intent Profiles, Sensors, Self-Learning Loop, and Verification Receipts)

- **Date**: 2026-11-05
- **Status**: `accepted`
- **Deciders**: Principal Engineering & Architecture Team
- **Confluence Page**: `CONF-ADR-0007` (`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/0007`)
- **Jira Ticket / Epic**: `ARCH-8`
- **Governing Modules (`CONTEXT.md`)**: `src/modules/sizing/`, `src/modules/sensors/`, `src/modules/learning/`, `src/modules/discovery/`, `src/modules/review/`, `src/cli/factory.mjs`, `.planning/`

---

## 1. Context & Problem Statement

Analysis of Amazon's open-source **AI-DLC Workflows (`awslabs/aidlc-workflows`)** revealed several enterprise-grade governance capabilities that complement our zero-dependency Software Factory:
1. **Task Intent Profiles**: Coarse sizing (`S/M/L`) alone does not distinguish between a `bugfix`, `security-patch`, `refactor`, `infra`, `poc`, or `feature`. Each profile has an orthogonal verification depth and test strategy.
2. **Deterministic PostToolUse Sensors**: Markdown and code outputs benefit from automatic, pre-gate programmatic validation (`required-sections`, `traceability`, `claim-sources`, and receipt binding) before human review.
3. **Self-Learning Rule Loop**: When humans correct agents during development, those corrections should be captured into persistent, hash-provenanced rules (`RULE_LEARNED`) so the agent never repeats the same error.
4. **Tool-Owned Verification Receipts**: Verification evidence must be cryptographically or deterministically bound to the git tree (`CHECKPOINT_VERIFICATION_RECORDED`) to prevent hallucinated test success.
5. **Operational Rollback Gates**: High-risk `One-Way Door` architectural changes require explicit rollback runbooks and observability verification.
6. **Brownfield Practices Discovery**: Automatic analysis of existing codebases to extract conventions, frameworks, test runners, and architecture maps.

## 2. Decision

We synthesize these AI-DLC patterns into our existing **ADR-Governed Software Factory** via clean, encapsulated Deep Modules (`ADR-0001`):

1. **Intent Profiles & Orthogonal Depth in `sizing` (`src/modules/sizing/`)**:
   - `classifyTaskSize` returns `profile` (`ui-tweak`, `bugfix`, `refactor`, `security-patch`, `infra`, `poc`, `feature`, `enterprise`), `depth` (`minimal`, `standard`, `comprehensive`), and `testStrategy` (`minimal`, `standard`, `comprehensive`) alongside existing `size` (`S/M/L`) and safety escalation.
2. **Deterministic Sensors Deep Module (`src/modules/sensors/`)**:
   - `runSensors` executes deterministic checks on changed files:
     - `required-sections`: verifies that ADRs contain all mandatory sections from `template.md` (Problem, Decision, Alternatives, Consequences, Merge Danger).
     - `traceability`: verifies that accepted ADRs are covered by tests or code, and `.planning/` phases link to valid ADRs.
     - `claim-sources`: flags unverified placeholders (`TODO`, `TBD`, unconfirmed assertions) in architectural proposals.
     - `receipt`: validates tamper-evident verification receipts.
3. **Self-Learning Rule Loop Deep Module (`src/modules/learning/`)**:
   - `recordLearnedRule`: captures human corrections into `CODING_STANDARDS.md`, `GLOSSARY.md`, or `.planning/learning/rules.md` with timestamp, SHA-256 hash, and provenance metadata.
   - `checkRuleConflict`: tests candidate learnings against foundational org rules to prevent conflicting instructions.
4. **Tool-Owned Verification Receipts (`.planning/VERIFICATION_RECEIPT.json`)**:
   - `factory verify` executes governance and test commands, and on success writes a tool-owned JSON receipt with timestamp, git commit/tree hash, test exit code, and checksum.
   - `factory pr-report` requires a valid receipt for the current tree before passing the Verification Evidence gate.
5. **Operations Gate in `review` (`src/modules/review/`)**:
   - `assessMergeDanger` enforces that any change flagged as a `One-Way Door` or `System-Wide` Blast Radius must include an **Operations & Rollback Runbook**.
6. **Brownfield Practices Discovery (`src/modules/discovery/`)**:
   - `discoverPractices`: scans the target repository's manifests, directories, and configs to infer runtime, build tool, test framework, and code seams, producing a ready-to-use `CONTEXT.md` architecture map.

### Deep Module Seams & Public Interface (`codebase-design`)

```js
// src/modules/sensors/index.mjs
export function runSensors(options) { ... }
export function checkRequiredSections(adrContents) { ... }
export function checkTraceability(input) { ... }
export function checkClaimSources(contents) { ... }

// src/modules/learning/index.mjs
export function recordLearnedRule(options) { ... }
export function checkRuleConflict(candidate, baseRules) { ... }
export function listLearnedRules(options) { ... }

// src/modules/discovery/index.mjs
export function discoverPractices(options) { ... }
```

## 3. Alternatives Considered (`Design-It-Twice`)

### Alternative 1: Directly Port the Entire `aidlc-workflows` Monolith (Bun/TypeScript)
- **Pros**: 100% feature match with AWS AI-DLC v2.11.3.
- **Cons**: Brings in heavy dependencies (Bun, 33-stage state machine, 14 agent sub-prompts, AWS-specific platform agents); sacrifices our fast, zero-dependency Node ESM engine and instant `Small [S]` bypass.
- **Why Rejected**: Violates our zero-dependency, ultra-fast agent harness model. We want the best architectural principles without the runtime weight.

### Alternative 2: Keep Sizing and Governance Purely Static Without Sensors or Learning
- **Pros**: No new modules.
- **Cons**: Misses out on automated rule learning from human feedback and leaves verification susceptible to ungrounded agent claims.
- **Why Rejected**: Programmatic sensors and tool-owned receipts guarantee rigorous engineering quality.

## 4. Consequences & Merge Danger

### Positive
- Combines the rapid agility of our `Small [S]` fast-path with the rigorous enterprise governance of Amazon AI-DLC.
- Deterministic sensors catch omissions (missing sections, uncited claims, orphaned ADRs) before human code review.
- Human corrections are persisted automatically with cryptographic provenance hashes.
- Verification receipts provide tamper-evident proof that tests were executed on the exact tree being merged.

### Negative & Trade-Offs
- Adds three new Deep Modules (`src/modules/sensors`, `src/modules/learning`, `src/modules/discovery`).
- Requires maintaining `.planning/VERIFICATION_RECEIPT.json` during verified runs.

### Door & Blast Radius
- **Door Classification**: `One-Way Door` (architectural expansion introducing new Deep Modules and verification contracts)
- **Blast Radius**: `System-Wide`
- **Verification Gate**: Enforced via unit/seam tests (`tests/*.seam.test.mjs`), `factory verify`, and end-to-end CLI integration.
