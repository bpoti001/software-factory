---
agent: pr-reviewer
description: Run a separate-context Two-Axis Code Review against Axis 1 (CODING_STANDARDS.md + Confluence ADRs + Fowler Smells) and Axis 2 (Jira Ticket + Spec Fidelity)
---

# Two-Axis Code Review (`/two-axis-review`)

Execute Matt Pocock's Two-Axis Review in a clean review context:

1. **Pin the Diff**:
   - Run `git diff main...HEAD` (or against the specified base ref / Bitbucket PR diff via `bitbucket_get_diff`).
2. **Axis 1 — Standards, Deep Modules & ADR Governance**:
   - Read [`CODING_STANDARDS.md`](../../CODING_STANDARDS.md), [`CONTEXT.md`](../../CONTEXT.md), and [`GLOSSARY.md`](../../GLOSSARY.md).
   - Verify **ADR Compliance**: Flag any new dependency, schema change, or pattern that lacks a governing ADR in `CONTEXT.md` / Confluence.
   - Verify **Documentation Co-Update**: Flag if module boundaries or domain terms changed without updating `CONTEXT.md` or `GLOSSARY.md`.
   - Verify **Deep Module Seams** and check against Martin Fowler's 12 code smells.
3. **Axis 2 — Spec & Jira Fidelity**:
   - Fetch the originating Jira issue (`jira_get_issue`) and/or feature spec.
   - Report (a) missing/partial requirements, (b) unrequested scope creep, and (c) behavioral bugs, quoting exact Jira/Spec lines.
4. **Side-by-Side Output**:
   - Report `## Axis 1: Standards & ADR Compliance` and `## Axis 2: Spec & Jira Fidelity` separately without merging or re-ranking.
