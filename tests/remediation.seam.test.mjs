import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkSeamViolations,
  checkAdrParity,
  checkStructuralDrift,
} from '../src/modules/governance/index.mjs';
import { classifyTaskSize } from '../src/modules/sizing/index.mjs';

test('Remediation [M02]: checkSeamViolations catches multi-line imports into private /lib/', () => {
  const libTarget = '../../sizing/' + 'lib/classifier.mjs';
  const multilineImport = `
import {
  classifyTaskSize as _b
} from '${libTarget}';

export const x = 1;
`;
  const violations = checkSeamViolations(
    ['src/modules/review/lib/merge-danger.mjs'],
    { 'src/modules/review/lib/merge-danger.mjs': multilineImport }
  );

  assert.equal(violations.length, 1);
  assert.match(violations[0].message, /imports private.*classifier\.mjs/);
});

test('Remediation [M03]: checkSeamViolations catches require() into private /lib/', () => {
  const libTarget = '../../sizing/' + 'lib/classifier.mjs';
  const requireImport = `
function loadInternal() {
  const internal = require('${libTarget}');
  return internal;
}
`;
  const violations = checkSeamViolations(
    ['src/modules/review/lib/merge-danger.mjs'],
    { 'src/modules/review/lib/merge-danger.mjs': requireImport }
  );

  assert.equal(violations.length, 1);
  assert.match(violations[0].message, /imports private.*classifier\.mjs/);
});

test('Remediation [M05]: checkSeamViolations catches bare side-effect imports in test files', () => {
  const libTarget = '../src/modules/sizing/' + 'lib/classifier.mjs';
  const bareTestImport = `
import '${libTarget}';
`;
  const violations = checkSeamViolations(
    ['tests/leak.test.mjs'],
    { 'tests/leak.test.mjs': bareTestImport }
  );

  assert.equal(violations.length, 1);
  assert.match(violations[0].message, /imports private/);
});

test('Remediation [M10]: checkAdrParity enforces two-way parity (catches shadow ADR on disk missing from CONTEXT.md)', () => {
  const contextMarkdown = `
| **ADR-0000** | Software Factory | \`accepted\` | All | CONF-0 | [\`docs/adr/0000-adr-driven-software-factory.md\`](./docs/adr/0000-adr-driven-software-factory.md) | ARCH-1 |
`;
  const existingAdrFiles = [
    'docs/adr/0000-adr-driven-software-factory.md',
    'docs/adr/0099-shadow-adr.md'
  ];

  const violations = checkAdrParity({
    contextMarkdown,
    existingAdrFiles,
    adrReadmeMarkdown: '# Index\n'
  });

  assert.ok(violations.length >= 1);
  assert.ok(violations.some((v) => v.message.includes('0099-shadow-adr.md') && v.message.includes('not registered in CONTEXT.md')));
});

test('Remediation [M08]: checkStructuralDrift flags brand-new Deep Module omitted from CONTEXT.md', () => {
  const changedFiles = [
    'src/modules/payments/index.mjs',
    'src/modules/payments/lib/processor.mjs'
  ];
  const contextMarkdown = `
| **Adaptive Sizing Module** | \`src/modules/sizing/\` | ... |
| **Governance & Parity Module** | \`src/modules/governance/\` | ... |
`;

  const violations = checkStructuralDrift(changedFiles, contextMarkdown);
  assert.ok(violations.length >= 1);
  assert.match(violations[0].message, /payments.*not mapped in CONTEXT\.md/);
});

test('Remediation [M26]: classifyTaskSize safety-escalates when [S] task creates new Deep Module directory', () => {
  const decision = classifyTaskSize({
    prompt: '[S] create payments module helper',
    changedFiles: ['src/modules/payments/index.mjs', 'src/modules/payments/lib/charge.mjs']
  });

  assert.equal(decision.size, 'L');
  assert.equal(decision.escalated, true);
  assert.match(decision.escalationReason, /structural.*files/);
});
