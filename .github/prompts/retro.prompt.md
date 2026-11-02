---
agent: pr-reviewer
description: Conduct a Software Factory Retrospective after a session or PR review to turn recurring issues into deterministic checks, CODING_STANDARDS.md rules, or CONTEXT.md pointers
---

# Session & PR Retrospective (`/retro`)

Execute Matt Pocock's `/retro` workflow to compound improvements into the software factory environment (*"Never write the same review comment twice"*):

1. **Inspect the Session & Review Findings**:
   - Analyze what slowed the agent down, what failed in CI or `@pr-reviewer`, or what required human correction.
2. **Categorize & Rank Improvements (Most Severe First)**:
   - **Deterministic Checks First**: If a mistake was mechanical (deep import into `lib/`, banned API, missing schema validation), propose a deterministic linter rule, `dependency-cruiser` boundary rule, or pre-commit hook rather than prose instructions.
   - **Reviewer Standards (`CODING_STANDARDS.md`)**: If a judgement-call smell was missed during review, add a targeted heuristic to [`CODING_STANDARDS.md`](../../CODING_STANDARDS.md).
   - **Navigation Pointers (`CONTEXT.md`)**: If the agent spent excessive tool calls locating files or ADRs, add a signpost to the Jump Table in [`CONTEXT.md`](../../CONTEXT.md).
   - **ADR / Glossary Gaps**: If domain ambiguity caused rework, update [`GLOSSARY.md`](../../GLOSSARY.md) or propose an ADR via `/create-adr`.
