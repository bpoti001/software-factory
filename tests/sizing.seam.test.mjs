import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTaskSize } from '../src/modules/sizing/index.mjs';

test('Sizing Seam [ADR-0002]: auto-detects Small [S] for button color change and skips research', () => {
  const result = classifyTaskSize({
    prompt: 'Change color of primary submit button from gray to #2563EB',
    changedFiles: ['src/ui/Button.css'],
  });

  assert.equal(result.size, 'S');
  assert.equal(result.label, 'Small [S]');
  assert.equal(result.mode, 'auto-detected');
  assert.equal(result.escalated, false);
  assert.equal(result.skipResearch, true);
  assert.equal(result.skipConfluenceMcp, true);
  assert.equal(result.skipShowMe, true);
  assert.equal(result.hardStopForAdrOrRfc, false);
  assert.deepEqual(result.requiredGates, ['local-verify']);
});

test('Sizing Seam [ADR-0002]: honors explicit user size flags ([S], /quick, [M], [L])', () => {
  const smallOverride = classifyTaskSize({
    prompt: '/quick Update tooltip copy on dashboard header',
  });
  assert.equal(smallOverride.size, 'S');
  assert.equal(smallOverride.mode, 'user-override');
  assert.equal(smallOverride.skipResearch, true);

  const mediumOverride = classifyTaskSize({
    prompt: '[M] Fix sorting order in user list',
  });
  assert.equal(mediumOverride.size, 'M');
  assert.equal(mediumOverride.mode, 'user-override');
  assert.equal(mediumOverride.skipResearch, false);

  const largeOverride = classifyTaskSize({
    prompt: '--large Refactor billing notifications',
  });
  assert.equal(largeOverride.size, 'L');
  assert.equal(largeOverride.mode, 'user-override');
  assert.equal(largeOverride.hardStopForAdrOrRfc, true);
});

test('Sizing Seam [ADR-0002]: auto-detects Medium [M] for standard Jira feature within existing ADRs', () => {
  const result = classifyTaskSize({
    prompt: 'PROJ-123 Add status filter query parameter to transactions endpoint',
    changedFiles: [
      'src/modules/transactions/index.mjs',
      'src/modules/transactions/lib/filter.mjs',
      'tests/transactions.seam.test.mjs',
    ],
  });

  assert.equal(result.size, 'M');
  assert.equal(result.label, 'Medium [M]');
  assert.equal(result.mode, 'auto-detected');
  assert.equal(result.skipResearch, false);
  assert.equal(result.skipConfluenceMcp, false);
  assert.equal(result.skipShowMe, false);
  assert.equal(result.hardStopForAdrOrRfc, false);
  assert.deepEqual(result.requiredGates, ['product', 'architecture', 'program-design', 'tdd']);
});

test('Sizing Seam [ADR-0002]: auto-detects Large [L] for new dependency, DB schema, or new Deep Module', () => {
  const result = classifyTaskSize({
    prompt: 'Introduce Redis caching library and create new database migration for session tokens',
    changedFiles: ['package.json', 'migrations/20261102_add_session_tokens.sql'],
  });

  assert.equal(result.size, 'L');
  assert.equal(result.label, 'Large [L]');
  assert.equal(result.mode, 'auto-detected');
  assert.equal(result.hardStopForAdrOrRfc, true);
  assert.deepEqual(result.requiredGates, [
    'product',
    'architecture-adr-rfc-hard-stop',
    'program-design',
    'tdd',
  ]);
});

test('Sizing Seam [ADR-0002]: Safety Escalation Guard overrides [S] to Large [L] if package.json or schema is modified', () => {
  const result = classifyTaskSize({
    prompt: '[S] Quick change button color and add new UI library',
    changedFiles: ['src/ui/Button.tsx', 'package.json'],
  });

  assert.equal(result.size, 'L');
  assert.equal(result.label, 'Large [L]');
  assert.equal(result.mode, 'safety-escalated');
  assert.equal(result.escalated, true);
  assert.match(result.escalationReason, /package\.json/i);
  assert.equal(result.skipResearch, false);
  assert.equal(result.hardStopForAdrOrRfc, true);
});
