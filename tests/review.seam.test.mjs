import test from 'node:test';
import assert from 'node:assert/strict';
import { assessMergeDanger, generateVisualPrBody } from '../src/modules/review/index.mjs';

test('Review Seam [ADR-0005]: classifies Small UI tweak as Two-Way Door with Localized Blast Radius', () => {
  const danger = assessMergeDanger({
    changedFiles: ['src/ui/Button.css'],
  });

  assert.equal(danger.door, 'Two-Way Door');
  assert.equal(danger.blastRadius, 'Localized');
  assert.equal(danger.requiresArchitectSignOff, false);
});

test('Review Seam [ADR-0005]: classifies single-module multi-file feature as Two-Way Door with Module-Wide Blast Radius', () => {
  const danger = assessMergeDanger({
    changedFiles: [
      'src/modules/sizing/index.mjs',
      'src/modules/sizing/lib/classifier.mjs',
      'tests/sizing.seam.test.mjs',
    ],
  });

  assert.equal(danger.door, 'Two-Way Door');
  assert.equal(danger.blastRadius, 'Module-Wide');
  assert.equal(danger.requiresArchitectSignOff, false);
});

test('Review Seam [ADR-0005]: classifies schema migration or multi-module ADR change as One-Way Door with System-Wide Blast Radius', () => {
  const danger = assessMergeDanger({
    changedFiles: [
      'migrations/20261102_drop_legacy_column.sql',
      'src/modules/sizing/index.mjs',
      'src/modules/governance/index.mjs',
      'docs/adr/0002-adaptive-agent-sizing-classifier.md',
    ],
    diffText: 'ALTER TABLE users DROP COLUMN legacy_token;',
  });

  assert.equal(danger.door, 'One-Way Door');
  assert.equal(danger.blastRadius, 'System-Wide');
  assert.equal(danger.requiresArchitectSignOff, true);
  assert.ok(danger.reasons.length >= 1);
});

test('Review Seam [ADR-0005]: generates complete /visual-pr Markdown body with /show-me diff, Two-Axis table, and Merge Danger', () => {
  const markdown = generateVisualPrBody({
    title: 'feat(ARCH-101): implement Adaptive Agent Sizing Deep Module',
    jiraKey: 'ARCH-101',
    adrIds: ['ADR-0001', 'ADR-0002'],
    changedFiles: ['src/modules/sizing/index.mjs', 'src/modules/sizing/lib/classifier.mjs'],
    beforeEvidence: 'No deterministic sizing classifier existed.',
    afterEvidence: '5/5 seam tests passing in tests/sizing.seam.test.mjs.',
    standardsPassed: true,
    specPassed: true,
  });

  assert.match(markdown, /ARCH-101/);
  assert.match(markdown, /ADR-0001/);
  assert.match(markdown, /ADR-0002/);
  assert.match(markdown, /Two-Way Door/);
  assert.match(markdown, /Axis 1 — Standards & ADR Compliance/);
  assert.match(markdown, /Axis 2 — Jira Spec Fidelity/);
  assert.match(markdown, /\+ src\/modules\/sizing\/index\.mjs/);
});
