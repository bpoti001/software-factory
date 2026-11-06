---
phase: 06-dogfooding-remediation
plan: 01
subsystem: hardening
tags: [remediation, seams, parity, integrity, isolation, ci, adr-0001, adr-0003, adr-0004, adr-0005, adr-0007]
provides:
  - tests/remediation.seam.test.mjs
  - .ci/workflows/ci.yml
affects:
  - src/modules/governance/lib/seam-checker.mjs
  - src/modules/governance/lib/adr-registry-parser.mjs
  - src/modules/governance/lib/drift-checker.mjs
  - src/modules/governance/index.mjs
  - src/modules/sizing/lib/classifier.mjs
  - src/modules/review/lib/visual-pr-formatter.mjs
  - src/modules/learning/lib/rules.mjs
  - src/modules/gsd/lib/gsd-bridge.mjs
  - src/cli/factory.mjs
  - scripts/verify-governance.sh
  - scripts/factory-init.sh
  - tests/cli.integration.test.mjs
  - CODING_STANDARDS.md
  - .gitignore
tech-stack:
  added: [github-actions]
  patterns: [Deep Module Seam, Multi-line Seam Parser, Two-Way ADR Parity, Honest Receipts, Test Fixture Isolation]
key-files:
  created:
    - tests/remediation.seam.test.mjs
    - .ci/workflows/ci.yml
  modified:
    - src/modules/governance/lib/seam-checker.mjs
    - src/modules/governance/lib/adr-registry-parser.mjs
    - src/modules/governance/lib/drift-checker.mjs
    - src/modules/governance/index.mjs
    - src/modules/sizing/lib/classifier.mjs
    - src/modules/review/lib/visual-pr-formatter.mjs
    - src/modules/learning/lib/rules.mjs
    - src/modules/gsd/lib/gsd-bridge.mjs
    - src/cli/factory.mjs
    - scripts/verify-governance.sh
    - scripts/factory-init.sh
    - tests/cli.integration.test.mjs
    - CODING_STANDARDS.md
    - .gitignore
key-decisions:
  - "Upgraded seam parser to analyze full file contents for multi-line imports, require(), and bare imports (ADR-0001)."
  - "Enforced two-way ADR parity and ensured all src/modules/* directories are mapped in CONTEXT.md (ADR-0003, ADR-0004)."
  - "Execute real tests in factory verify, bind receipts to tree hash, and ignore receipts in git (ADR-0007)."
  - "Isolated test fixtures in cli.integration.test.mjs to prevent mutating repo files."
  - "Added GitHub Actions workflow matching bitbucket-pipelines.yml."
duration: 20min
completed: 2026-11-05
---

# Phase 6 Plan 01: Dogfooding Remediation & Enterprise Hardening Summary

**Delivered end-to-end dogfooding remediation addressing all 18 blindspots uncovered during the self-rebuild test matrix across Seam Checking, Two-Way ADR Parity, Untracked Directories, Honest Verification Receipts, Test Fixture Isolation, and GitHub Actions CI.**

## Performance
- **Duration:** 20 min
- **Tasks:** 4/4 completed
- **Files created/modified:** 16

## Accomplishments
- **Multi-line & Dynamic Seam Checker (`ADR-0001`)**: Upgraded `src/modules/governance/lib/seam-checker.mjs` with `IMPORT_OR_REQUIRE_REGEX` capturing multi-line imports, CommonJS `require()`, and bare imports into private `/lib/` and `/internal/` directories.
- **Untracked Directory Detection (`ADR-0004`)**: Added `-uall` flag to `git status --porcelain -uall` in `factory.mjs` and `verify-governance.sh` to ensure untracked files in newly created module directories are analyzed before commit.
- **Two-Way ADR Parity & Module Mapping (`ADR-0003`, `ADR-0004`)**: Updated `adr-registry-parser.mjs` to catch shadow ADRs on disk missing from `CONTEXT.md`, and updated `drift-checker.mjs` to verify all `src/modules/*` directories are mapped in `CONTEXT.md` Section 2.
- **Adaptive Sizing Safety Escalation (`ADR-0002`)**: Enforced architectural escalation to `Large [L]` when `Small [S]` tasks touch module interfaces (`index.mjs`) or structural files.
- **Honest Test Verification Receipts (`ADR-0007`)**: Updated `factory verify` to synchronously execute `npm test`, capture the actual exit code, reject on test failure, bind receipts to tree hash, and ignored `.planning/VERIFICATION_RECEIPT.json` in `.gitignore` so verification runs leave git clean.
- **Operations & Rollback Runbook (`ADR-0005`, `ADR-0007`)**: Added `--rollback` CLI flag to `factory pr-report` and enforced operations rollback runbook verification in `assessMergeDanger` for all `One-Way Door` changes.
- **Test Fixture Isolation & Cleanliness**: Isolated `factory learn` tests to write to OS temporary directories, cleaned `CODING_STANDARDS.md` and `.planning/learning/audit.jsonl`, and hardened `scripts/verify-governance.sh` and `scripts/factory-init.sh`.
- **CI Workflow Template**: Added `.ci/workflows/ci.yml` running `npm test` and `./scripts/verify-governance.sh`.
- **Test Suite Verification**: 38/38 tests passing across all test suites with 100% ADR parity and clean seams.
