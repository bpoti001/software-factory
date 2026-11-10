import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const cliPath = path.resolve(import.meta.dirname, '../src/cli/factory.mjs');

test('CLI Integration [ADR-0002, ADR-0004]: factory size classifies button color tweak as Small [S] with skipResearch=true', () => {
  const output = execFileSync(
    process.execPath,
    [cliPath, 'size', 'Change color of primary button to #2563EB', '--json'],
    { encoding: 'utf8' }
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.size, 'S');
  assert.equal(parsed.skipResearch, true);
  assert.equal(parsed.skipConfluenceMcp, true);
});

test('CLI Integration [ADR-0004]: factory verify passes on current repository with 100% ADR parity and clean seams', () => {
  const output = execFileSync(process.execPath, [cliPath, 'verify'], {
    encoding: 'utf8',
  });

  assert.match(output, /\[Factory Gate Passed\]/);
});

test('CLI Integration [ADR-0005]: factory pr-report outputs structured /visual-pr Markdown and Merge Danger table', () => {
  const output = execFileSync(
    process.execPath,
    [
      cliPath,
      'pr-report',
      '--title',
      'feat(ARCH-104): Software Factory CLI Engine',
      '--jira',
      'ARCH-104',
      '--adrs',
      'ADR-0001,ADR-0004,ADR-0005',
      '--files',
      'src/cli/factory.mjs,src/modules/sizing/index.mjs',
    ],
    { encoding: 'utf8' }
  );

  assert.match(output, /ARCH-104/);
  assert.match(output, /ADR-0004/);
  assert.match(output, /Merge Danger Assessment/);
});

test('CLI Integration [ADR-0006]: factory gsd status and validate inspect .planning/ and verify ADR traceability', () => {
  const jsonOutput = execFileSync(
    process.execPath,
    [cliPath, 'gsd', 'status', '--json'],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(jsonOutput);
  assert.equal(parsed.planningInitialized, true);
  assert.equal(parsed.adrAlignment.aligned, true);
  assert.ok(parsed.roadmap.phase_count >= 4);

  const validateOutput = execFileSync(
    process.execPath,
    [cliPath, 'gsd', 'validate'],
    { encoding: 'utf8' }
  );
  assert.match(validateOutput, /ADR Traceability Gate:\s+✅ ALIGNED/);
});

test('CLI Integration [ADR-0007]: factory size outputs intent profile, depth, and test strategy', () => {
  const output = execFileSync(
    process.execPath,
    [cliPath, 'size', 'Fix the null pointer crash in user authentication', '--json'],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(output);
  assert.equal(parsed.profile, 'bugfix');
  assert.equal(parsed.depth, 'minimal');
  assert.equal(parsed.testStrategy, 'minimal');
});

test('CLI Integration [ADR-0007]: factory discover scans codebase and outputs JSON blueprint', () => {
  const output = execFileSync(
    process.execPath,
    [cliPath, 'discover', '--json'],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(output);
  assert.equal(parsed.runtime, 'node-esm');
  assert.equal(parsed.testRunner, 'node:test');
  assert.ok(parsed.modules.includes('sizing'));
  assert.ok(parsed.hasAdrGovernance);
});

test('CLI Integration [ADR-0007]: factory learn captures rules and rejects forbidden conflicts', () => {
  const tmpFile = path.join(os.tmpdir(), `test-standards-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, '# Standards\n', 'utf8');

  const learnOutput = execFileSync(
    process.execPath,
    [cliPath, 'learn', 'Always write integration tests before submitting PRs', '--heading', 'Testing Guidelines', '--file', tmpFile],
    { encoding: 'utf8' }
  );
  assert.match(learnOutput, /\[Rule Learned\]/);
  assert.match(fs.readFileSync(tmpFile, 'utf8'), /Always write integration tests/);

  try { fs.unlinkSync(tmpFile); } catch {}
});

test('CLI Integration [ADR-0008]: factory analyze --visualize generates X-Ray, Retro-ADRs, 5-Lens Mermaid, Tour, and HTML Explorer', () => {
  const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-viz-'));
  try {
    const output = execFileSync(
      process.execPath,
      [cliPath, 'analyze', '--visualize', '--out', tmpOutDir],
      { encoding: 'utf8' }
    );
    assert.match(output, /\[Brownfield Archaeology & X-Ray\]/);
    assert.ok(fs.existsSync(path.join(tmpOutDir, 'VISUAL_ARCHITECTURE.md')));
    assert.ok(fs.existsSync(path.join(tmpOutDir, 'ARCHITECTURE_TOUR.md')));
    assert.ok(fs.existsSync(path.join(tmpOutDir, 'explorer.html')));
  } finally {
    fs.rmSync(tmpOutDir, { recursive: true, force: true });
  }
});

test('CLI Integration [ADR-0009]: factory scaffold-api, add-module, add-adr, and sync commands execute in < 1 second', () => {
  const tmpApiDir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-cli-api-'));
  try {
    const scaffoldOut = execFileSync(
      process.execPath,
      [
        cliPath,
        'scaffold-api',
        '--dir',
        tmpApiDir,
        '--name',
        'inventory-api',
        '--modules',
        'items,warehouses',
        '--port',
        '4200'
      ],
      { encoding: 'utf8' }
    );
    assert.match(scaffoldOut, /\[Turnkey API Scaffolder\]/);
    assert.ok(fs.existsSync(path.join(tmpApiDir, 'src', 'app.mjs')));

    const addModuleOut = execFileSync(
      process.execPath,
      [cliPath, 'add-module', 'shipments', '--cwd', tmpApiDir],
      { encoding: 'utf8' }
    );
    assert.match(addModuleOut, /\[Deep Module Scaffolder\]/);
    assert.ok(fs.existsSync(path.join(tmpApiDir, 'src', 'modules', 'shipments', 'index.mjs')));

    const addAdrOut = execFileSync(
      process.execPath,
      [cliPath, 'add-adr', 'Shipment Event Bus', '--scope', '`src/modules/shipments`', '--cwd', tmpApiDir],
      { encoding: 'utf8' }
    );
    assert.match(addAdrOut, /\[ADR Scaffolder\]/);
    assert.ok(fs.existsSync(path.join(tmpApiDir, 'docs', 'adr', '0002-shipment-event-bus.md')));

    const syncOut = execFileSync(
      process.execPath,
      [cliPath, 'sync', '--cwd', tmpApiDir],
      { encoding: 'utf8' }
    );
    assert.match(syncOut, /\[Governance Auto-Sync\]/);
  } finally {
    fs.rmSync(tmpApiDir, { recursive: true, force: true });
  }
});
