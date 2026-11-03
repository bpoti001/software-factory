/**
 * Private Implementation: Visual PR Markdown Formatter (/visual-pr)
 * Governed by: ADR-0001 (Deep Modules), ADR-0005 (Two-Axis PR Review & Merge Danger)
 */

import { assessMergeDanger } from './merge-danger.mjs';

/**
 * Generates a complete Bitbucket / GitHub Visual PR Markdown description.
 * @param {{
 *   title?: string,
 *   jiraKey?: string,
 *   adrIds?: string[],
 *   changedFiles?: string[],
 *   diffText?: string,
 *   beforeEvidence?: string,
 *   afterEvidence?: string,
 *   standardsPassed?: boolean,
 *   specPassed?: boolean
 * }} input
 */
export function generateVisualPrBody(input = {}) {
  const title = input.title || 'Feature Implementation';
  const jiraKey = input.jiraKey || 'UNSPECIFIED';
  const adrIds = Array.isArray(input.adrIds) && input.adrIds.length > 0 ? input.adrIds : ['ADR-0000'];
  const changedFiles = Array.isArray(input.changedFiles) ? input.changedFiles : [];
  const beforeEvidence = input.beforeEvidence || 'Baseline behavior prior to this vertical slice.';
  const afterEvidence = input.afterEvidence || 'All seam tests and governance checks passing.';
  const standardsPassed = input.standardsPassed !== false;
  const specPassed = input.specPassed !== false;

  const danger = assessMergeDanger({
    changedFiles,
    diffText: input.diffText,
  });

  const fileTreeLines =
    changedFiles.length > 0
      ? changedFiles.map((f) => `+ ${f}`).join('\n')
      : '+ (working tree clean)';

  const reasonsList =
    danger.reasons.length > 0
      ? danger.reasons.map((r) => `  - ${r}`).join('\n')
      : '  - Reversible localized/module change behind public seam';

  return `## ${title}

- **Jira Ticket**: \`${jiraKey}\`
- **Governing ADRs**: ${adrIds.map((id) => `\`${id}\``).join(', ')}

---

### 1. Structural Visual Diff (\`/show-me\`)

\`\`\`diff
${fileTreeLines}
\`\`\`

---

### 2. Merge Danger Assessment (\`ADR-0005\`)

| Dimension | Classification | Notes |
| :--- | :--- | :--- |
| **Door Type** | **\`${danger.door}\`** | ${danger.door === 'One-Way Door' ? '⚠️ High-consequence / hard-to-reverse change' : '✅ Immediately reversible via git revert'} |
| **Blast Radius** | **\`${danger.blastRadius}\`** | Touches ${changedFiles.length} file(s) |
| **Architect Sign-Off** | **\`${danger.requiresArchitectSignOff ? 'REQUIRED' : 'Optional (Standard Peer Review)'}\`** | Driven by Door & Blast Radius |

**Classification Rationale**:
${reasonsList}

---

### 3. Two-Axis Separate-Context Review (\`/two-axis-review\`)

| Review Axis | Verdict | Scope Verified |
| :--- | :--- | :--- |
| **Axis 1 — Standards & ADR Compliance** | ${standardsPassed ? '✅ PASS' : '❌ ACTION REQUIRED'} | \`CODING_STANDARDS.md\`, Deep Module seams (\`ADR-0001\`), \`CONTEXT.md\` parity (\`ADR-0003\`) |
| **Axis 2 — Jira Spec Fidelity** | ${specPassed ? '✅ PASS' : '❌ ACTION REQUIRED'} | Faithful fulfillment of \`${jiraKey}\` acceptance criteria with zero scope creep |

---

### 4. Before / After Verification Evidence

- **Before**: ${beforeEvidence}
- **After**: ${afterEvidence}
`;
}
