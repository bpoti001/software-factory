import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseAdrRegistry, verifyGovernance } from '../src/modules/governance/index.mjs';

test('Governance Seam [ADR-0001]: detects cross-module and test imports into private /lib/ folders', () => {
  const report = verifyGovernance({
    changedFiles: [
      'src/modules/review/lib/merge-danger.mjs',
      'tests/bad.test.mjs',
      'src/modules/sizing/index.mjs',
    ],
    fileContents: {
      'src/modules/review/lib/merge-danger.mjs':
        "import { classifyTaskSize } from '../../sizing/lib/classifier.mjs';\nexport const x = 1;",
      'tests/bad.test.mjs':
        "import { classifyTaskSize } from '../src/modules/sizing/lib/classifier.mjs';",
      'src/modules/sizing/index.mjs':
        "export { classifyTaskSize } from './lib/classifier.mjs';",
    },
  });

  assert.equal(report.passed, false);
  assert.equal(report.seamViolations.length, 2);
  assert.equal(report.seamViolations[0].file, 'src/modules/review/lib/merge-danger.mjs');
  assert.equal(report.seamViolations[1].file, 'tests/bad.test.mjs');
});

test('Governance Seam [ADR-0004]: flags Structural Drift when package.json or migration changes without ADR or CONTEXT.md update', () => {
  const failingReport = verifyGovernance({
    changedFiles: ['package.json', 'src/modules/sizing/index.mjs'],
    fileContents: {},
  });

  assert.equal(failingReport.passed, false);
  assert.equal(failingReport.structuralDriftViolations.length, 1);
  assert.equal(failingReport.structuralDriftViolations[0].file, 'package.json');

  const passingReport = verifyGovernance({
    changedFiles: ['package.json', 'CONTEXT.md', 'docs/adr/0004-deterministic-governance-cli.md'],
    fileContents: {},
  });

  assert.equal(passingReport.structuralDriftViolations.length, 0);
});

test('Governance Seam [ADR-0003]: enforces ADR Parity between CONTEXT.md, docs/adr/README.md, and disk files', () => {
  const sampleContext = `
| ADR ID | Title | Status | Scope / Bounded Context | Confluence Page ID / URL | Local Mirror | Governing Jira Epic |
|---|---|---|---|---|---|---|
| **ADR-0000** | Factory Gate | \`accepted\` | All | \`CONF-ADR-0000\` | [\`docs/adr/0000-adr-driven-software-factory.md\`](./docs/adr/0000-adr-driven-software-factory.md) | \`ARCH-1\` |
| **ADR-0099** | Phantom ADR | \`accepted\` | All | \`CONF-ADR-0099\` | \`docs/adr/0099-missing.md\` | \`ARCH-99\` |
`;

  const entries = parseAdrRegistry(sampleContext);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].adrId, 'ADR-0000');
  assert.equal(entries[0].localMirrorPath, 'docs/adr/0000-adr-driven-software-factory.md');
  assert.equal(entries[1].adrId, 'ADR-0099');
  assert.equal(entries[1].localMirrorPath, 'docs/adr/0099-missing.md');

  const report = verifyGovernance({
    changedFiles: [],
    contextMarkdown: sampleContext,
    adrReadmeMarkdown: '| [ADR-0000](./0000-adr-driven-software-factory.md) | Factory Gate |',
    existingAdrFiles: ['docs/adr/0000-adr-driven-software-factory.md'],
  });

  assert.equal(report.passed, false);
  assert.equal(report.adrParityViolations.length, 1);
  assert.equal(report.adrParityViolations[0].adrId, 'ADR-0099');
});

test('Governance Seam [Delete-Zone]: rejects barrel export * from ./lib/ in Deep Module entry points', () => {
  const report = verifyGovernance({
    changedFiles: ['src/modules/sizing/index.mjs'],
    fileContents: {
      'src/modules/sizing/index.mjs': "export * from './lib/classifier.mjs';",
    },
  });

  assert.equal(report.passed, false);
  assert.equal(report.deleteZoneViolations.length, 1);
  assert.equal(report.deleteZoneViolations[0].file, 'src/modules/sizing/index.mjs');
});

test('Governance Seam [Real Repository Parity]: current repository CONTEXT.md and docs/adr/ have 100% parity', () => {
  const repoRoot = path.resolve(import.meta.dirname, '..');
  const contextMarkdown = fs.readFileSync(path.join(repoRoot, 'CONTEXT.md'), 'utf8');
  const adrReadmeMarkdown = fs.readFileSync(path.join(repoRoot, 'docs/adr/README.md'), 'utf8');
  const existingAdrFiles = fs
    .readdirSync(path.join(repoRoot, 'docs/adr'))
    .map((f) => `docs/adr/${f}`);

  const report = verifyGovernance({
    changedFiles: [],
    contextMarkdown,
    adrReadmeMarkdown,
    existingAdrFiles,
  });

  assert.equal(report.passed, true);
  assert.deepEqual(report.adrParityViolations, []);
});
