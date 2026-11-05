import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { classifyTaskSize } from '../src/modules/sizing/index.mjs';
import {
  runSensors,
  checkRequiredSections,
  checkTraceability,
  checkClaimSources
} from '../src/modules/sensors/index.mjs';
import {
  recordLearnedRule,
  checkRuleConflict,
  listLearnedRules
} from '../src/modules/learning/index.mjs';
import { discoverPractices } from '../src/modules/discovery/index.mjs';
import { assessMergeDanger } from '../src/modules/review/index.mjs';

test('Sizing [ADR-0007]: classifyTaskSize determines Intent Profile and orthogonal depth', () => {
  const uiTweak = classifyTaskSize({ prompt: 'Change primary button color to #3B82F6' });
  assert.equal(uiTweak.profile, 'ui-tweak');
  assert.equal(uiTweak.size, 'S');
  assert.equal(uiTweak.depth, 'minimal');

  const bugfix = classifyTaskSize({ prompt: 'Fix the auth token expiration crash when refresh token is null' });
  assert.equal(bugfix.profile, 'bugfix');
  assert.equal(bugfix.depth, 'minimal');

  const secPatch = classifyTaskSize({ prompt: 'Apply security patch for CVE-2026-9999 in parser' });
  assert.equal(secPatch.profile, 'security-patch');
  assert.equal(secPatch.depth, 'minimal');

  const infra = classifyTaskSize({ prompt: 'Setup Terraform ECS deployment and CloudWatch alarm pipeline' });
  assert.equal(infra.profile, 'infra');
  assert.equal(infra.depth, 'standard');

  const refactor = classifyTaskSize({ prompt: 'Refactor database query builder without changing behavior' });
  assert.equal(refactor.profile, 'refactor');
  assert.equal(refactor.depth, 'minimal');

  const feature = classifyTaskSize({ prompt: 'Build a multi-tenant payment gateway integration' });
  assert.equal(feature.profile, 'feature');
  assert.equal(feature.depth, 'standard');
});

test('Sensors [ADR-0007]: checkRequiredSections validates ADR and RFC mandatory headings', () => {
  const validAdr = `
# ADR-0099: Example
## 1. Context & Problem Statement
Context here.
## 2. Decision
Decision here.
## 3. Alternatives Considered
Alternatives.
## 4. Consequences & Merge Danger
Consequences.
`;
  const invalidAdr = `
# ADR-0099: Incomplete ADR
## 1. Context
Just some context without decision or alternatives.
`;

  const validResult = checkRequiredSections({ 'docs/adr/0099.md': validAdr });
  assert.equal(validResult.length, 0);

  const invalidResult = checkRequiredSections({ 'docs/adr/0099.md': invalidAdr });
  assert.ok(invalidResult.length > 0);
  assert.ok(invalidResult.some((e) => e.message.includes('Decision')));
  assert.ok(invalidResult.some((e) => e.message.includes('Alternatives Considered')));
});

test('Sensors [ADR-0007]: checkClaimSources flags ungrounded assertions and placeholders', () => {
  const cleanDoc = 'This feature fulfills ARCH-100 requirements.';
  const placeholderDoc = 'The API rate limit is TODO: check with security and TBD later.';

  const cleanResult = checkClaimSources({ 'docs/feature.md': cleanDoc });
  assert.equal(cleanResult.length, 0);

  const flaggedResult = checkClaimSources({ 'docs/feature.md': placeholderDoc });
  assert.ok(flaggedResult.length >= 2);
  assert.ok(flaggedResult.some((e) => e.placeholder === 'TODO'));
  assert.ok(flaggedResult.some((e) => e.placeholder === 'TBD'));
});

test('Sensors [ADR-0007]: checkTraceability validates ADR test and implementation linkage', () => {
  const contextMarkdown = `
| **ADR-0001** | Deep Module Boundaries | \`accepted\` | \`src/modules/*\` | \`CONF-1\` | \`docs/adr/0001.md\` | \`ARCH-1\` |
| **ADR-0099** | Orphaned ADR | \`accepted\` | \`src/modules/*\` | \`CONF-99\` | \`docs/adr/0099.md\` | \`ARCH-99\` |
`;
  const codeFiles = ['src/modules/sizing/index.mjs', 'tests/sizing.seam.test.mjs'];
  const fileContents = {
    'tests/sizing.seam.test.mjs': '// Governed by ADR-0001\ntest("...", () => {});'
  };

  const report = checkTraceability({ contextMarkdown, codeFiles, fileContents });
  assert.ok(report.coveredAdrs.includes('ADR-0001'));
  assert.ok(report.orphanedAdrs.includes('ADR-0099'));
});

test('Learning [ADR-0007]: recordLearnedRule records rule with SHA-256 hash and checks conflicts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-learn-'));
  const standardsPath = path.join(tmpDir, 'CODING_STANDARDS.md');
  fs.writeFileSync(standardsPath, '# Coding Standards\n\n## Seam Rules\n- Never export * from ./lib/\n', 'utf8');

  // Conflict test
  const conflict = checkRuleConflict(
    'Always use export * from ./lib/ in index.mjs',
    fs.readFileSync(standardsPath, 'utf8')
  );
  assert.equal(conflict.hasConflict, true);

  // Non-conflicting rule recording
  const recorded = recordLearnedRule({
    rule: 'Always use SKU instead of Product in inventory domain types',
    heading: 'Domain Naming',
    targetFile: standardsPath,
    author: 'engineer'
  });

  assert.equal(recorded.success, true);
  assert.ok(recorded.contentHash.length >= 16);
  assert.equal(recorded.heading, 'Domain Naming');

  const updatedContent = fs.readFileSync(standardsPath, 'utf8');
  assert.match(updatedContent, /Always use SKU instead of Product/);
  assert.match(updatedContent, /cid:[a-f0-9]+/);

  const rules = listLearnedRules({ targetFile: standardsPath });
  assert.equal(rules.length, 1);
  assert.equal(rules[0].rule, 'Always use SKU instead of Product in inventory domain types');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Discovery [ADR-0007]: discoverPractices analyzes brownfield repo layout and infer architecture', () => {
  const cwd = path.resolve(process.cwd());
  const practices = discoverPractices({ cwd });

  assert.equal(practices.runtime, 'node-esm');
  assert.equal(practices.testRunner, 'node:test');
  assert.ok(practices.modules.includes('sizing'));
  assert.ok(practices.modules.includes('governance'));
  assert.ok(practices.hasAdrGovernance);
  assert.ok(practices.hasGsdPlanning);
  assert.ok(practices.suggestedContextMarkdown.includes('Canonical Architecture Map'));
});

test('Review [ADR-0007]: assessMergeDanger enforces operations rollback plan for One-Way Doors', () => {
  const oneWayNoPlan = assessMergeDanger({
    changedFiles: ['package.json', 'docs/adr/0007-aidlc-synthesis-architecture.md'],
    operationsRollbackText: ''
  });
  assert.equal(oneWayNoPlan.door, 'One-Way Door');
  assert.equal(oneWayNoPlan.operationsGate.required, true);
  assert.equal(oneWayNoPlan.operationsGate.passed, false);

  const oneWayWithPlan = assessMergeDanger({
    changedFiles: ['package.json', 'docs/adr/0007-aidlc-synthesis-architecture.md'],
    operationsRollbackText: 'Rollback runbook: revert git commit and re-run npm install'
  });
  assert.equal(oneWayWithPlan.door, 'One-Way Door');
  assert.equal(oneWayWithPlan.operationsGate.required, true);
  assert.equal(oneWayWithPlan.operationsGate.passed, true);
});
