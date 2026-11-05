import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  resolveGsdPaths,
  validatePlanningAdrAlignment,
  inspectGsdWorkspace
} from '../src/modules/gsd/index.mjs';

test('resolveGsdPaths locates native gsd-tools.cjs and local .planning artifacts', () => {
  const cwd = path.resolve(process.cwd());
  const paths = resolveGsdPaths({ cwd });

  assert.equal(paths.cwd, cwd);
  assert.ok(paths.gsdToolsBin.endsWith('gsd-tools.cjs'));
  assert.equal(paths.planningDir, path.join(cwd, '.planning'));
  assert.equal(paths.roadmapPath, path.join(cwd, '.planning', 'ROADMAP.md'));
  assert.equal(paths.statePath, path.join(cwd, '.planning', 'STATE.md'));
  assert.equal(paths.configPath, path.join(cwd, '.planning', 'config.json'));
});

test('validatePlanningAdrAlignment passes when all roadmap phases and plans cite accepted ADRs', () => {
  const roadmapMarkdown = `
# Roadmap
### Phase 1: Sizing Engine
**Goal**: Deliver sizing module governed by \`ADR-0001\` and \`ADR-0002\`.
### Phase 2: Governance Engine
**Goal**: Deliver governance module governed by \`ADR-0003\` and \`ADR-0004\`.
`;
  const planMarkdowns = [
    {
      file: '.planning/phases/01-sizing/01-01-PLAN.md',
      content: '---\nphase: 01-sizing\nplan: 01\n---\nGoverned by ADR-0001 and ADR-0002.'
    },
    {
      file: '.planning/phases/02-governance/02-01-PLAN.md',
      content: '---\nphase: 02-governance\nplan: 01\n---\nGoverned by ADR-0003 and ADR-0004.'
    }
  ];

  const result = validatePlanningAdrAlignment({
    roadmapMarkdown,
    planMarkdowns,
    acceptedAdrIds: ['ADR-0001', 'ADR-0002', 'ADR-0003', 'ADR-0004']
  });

  assert.equal(result.aligned, true);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.referencedAdrs, ['ADR-0001', 'ADR-0002', 'ADR-0003', 'ADR-0004']);
});

test('validatePlanningAdrAlignment flags unknown ADRs and phases missing ADR citations', () => {
  const roadmapMarkdown = `
# Roadmap
### Phase 1: Sizing Engine
**Goal**: Deliver sizing module governed by \`ADR-0001\`.
### Phase 2: Uncharted Feature
**Goal**: Build something without any ADR reference.
`;
  const planMarkdowns = [
    {
      file: '.planning/phases/01-sizing/01-01-PLAN.md',
      content: 'Governed by ADR-0001 and ADR-9999.'
    },
    {
      file: '.planning/phases/02-uncharted/02-01-PLAN.md',
      content: 'No ADR mentioned here at all.'
    }
  ];

  const result = validatePlanningAdrAlignment({
    roadmapMarkdown,
    planMarkdowns,
    acceptedAdrIds: ['ADR-0001']
  });

  assert.equal(result.aligned, false);
  assert.ok(result.errors.some((e) => e.includes('Phase 2')));
  assert.ok(result.errors.some((e) => e.includes('ADR-9999')));
  assert.ok(result.errors.some((e) => e.includes('02-01-PLAN.md')));
});

test('inspectGsdWorkspace integrates with native gsd-tools.cjs and validates repository .planning state', () => {
  const report = inspectGsdWorkspace({ cwd: process.cwd() });

  assert.equal(report.planningInitialized, true);
  assert.equal(report.gsdInstalled, true);
  assert.equal(report.adrAlignment.aligned, true);
  assert.ok(report.adrAlignment.referencedAdrs.includes('ADR-0006'));
  assert.ok(report.roadmap.phase_count >= 4);
  assert.ok(Array.isArray(report.roadmap.phases));
  assert.ok(report.state.current_phase);
});
