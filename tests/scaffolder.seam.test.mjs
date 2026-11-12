import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

import {
  syncGovernanceDocs,
  scaffoldDeepModule,
  scaffoldAdr,
  scaffoldApiService,
  initFoundrySpec,
  validateFoundrySpec,
  compileFoundrySpec,
  verifySpecParity,
} from '../src/modules/scaffolder/index.mjs';
import { verifyGovernance } from '../src/modules/governance/index.mjs';
import { runSensors } from '../src/modules/sensors/index.mjs';

test('Scaffolder Seam [ADR-0009]: scaffoldApiService generates a complete runnable API service with Deep Modules, tests, and 100% ADR parity in < 1s', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-api-service-'));
  try {
    const result = scaffoldApiService({
      targetDir: tmpDir,
      name: 'payments-ledger-api',
      modules: ['accounts', 'transfers'],
      port: 4100,
    });

    assert.equal(result.name, 'payments-ledger-api');
    assert.deepEqual(result.modules, ['accounts', 'transfers']);
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'app.mjs')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'server.mjs')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'modules', 'accounts', 'index.mjs')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'modules', 'transfers', 'index.mjs')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'CONTEXT.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs', 'adr', 'README.md')));

    // Verify governance passes with 0 violations on the newly scaffolded API service
    const contextMarkdown = fs.readFileSync(path.join(tmpDir, 'CONTEXT.md'), 'utf8');
    const adrReadmeMarkdown = fs.readFileSync(path.join(tmpDir, 'docs', 'adr', 'README.md'), 'utf8');
    const existingAdrFiles = fs
      .readdirSync(path.join(tmpDir, 'docs', 'adr'))
      .map((f) => `docs/adr/${f}`);

    const govReport = verifyGovernance({
      changedFiles: [
        'src/modules/accounts/index.mjs',
        'src/modules/transfers/index.mjs',
      ],
      fileContents: {
        'src/modules/accounts/index.mjs': fs.readFileSync(
          path.join(tmpDir, 'src', 'modules', 'accounts', 'index.mjs'),
          'utf8'
        ),
        'src/modules/transfers/index.mjs': fs.readFileSync(
          path.join(tmpDir, 'src', 'modules', 'transfers', 'index.mjs'),
          'utf8'
        ),
      },
      contextMarkdown,
      adrReadmeMarkdown,
      existingAdrFiles,
    });
    assert.equal(govReport.passed, true);

    // Run the generated API service's own seam & HTTP integration test suite!
    execSync('node --test tests/*.test.mjs', { cwd: tmpDir, stdio: 'pipe' });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Scaffolder Seam [ADR-0009]: scaffoldDeepModule and scaffoldAdr add modules/ADRs and auto-sync CONTEXT.md without manual Markdown edits', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-incremental-'));
  try {
    scaffoldApiService({
      targetDir: tmpDir,
      name: 'commerce-api',
      modules: ['orders'],
    });

    // 1. Add a new Deep Module in 1 call
    const modResult = scaffoldDeepModule({
      cwd: tmpDir,
      moduleName: 'shipments',
      exports: ['createShipment', 'listShipments', 'getShipmentById'],
    });
    assert.equal(modResult.moduleName, 'shipments');
    assert.ok(fs.existsSync(path.join(tmpDir, modResult.entryPoint)));
    assert.ok(fs.existsSync(path.join(tmpDir, modResult.testFile)));

    // 2. Mint a new ADR in 1 call
    const adrResult = scaffoldAdr({
      cwd: tmpDir,
      title: 'Integrate Carrier Webhook Signatures',
      scope: 'src/modules/shipments/',
      decision: 'Verify HMAC-SHA256 signatures on all incoming carrier status webhooks.',
    });
    assert.equal(adrResult.adrId, 'ADR-0002');
    assert.ok(fs.existsSync(path.join(tmpDir, adrResult.filePath)));

    // 3. Verify sensors and governance pass automatically with zero manual edits!
    const contextMarkdown = fs.readFileSync(path.join(tmpDir, 'CONTEXT.md'), 'utf8');
    const adrReadmeMarkdown = fs.readFileSync(path.join(tmpDir, 'docs', 'adr', 'README.md'), 'utf8');
    const existingAdrFiles = fs
      .readdirSync(path.join(tmpDir, 'docs', 'adr'))
      .map((f) => `docs/adr/${f}`);
    const adrContent = fs.readFileSync(path.join(tmpDir, adrResult.filePath), 'utf8');

    const govReport = verifyGovernance({
      changedFiles: [modResult.entryPoint, adrResult.filePath, 'CONTEXT.md', 'docs/adr/README.md'],
      fileContents: {
        [modResult.entryPoint]: fs.readFileSync(path.join(tmpDir, modResult.entryPoint), 'utf8'),
      },
      contextMarkdown,
      adrReadmeMarkdown,
      existingAdrFiles,
    });
    assert.equal(govReport.passed, true);

    const sensorReport = runSensors({
      fileContents: { [adrResult.filePath]: adrContent },
      contextMarkdown,
    });
    assert.equal(sensorReport.passed, true);

    // 4. Verify syncGovernanceDocs heals unmapped modules created manually on disk
    const manualModDir = path.join(tmpDir, 'src', 'modules', 'invoicing', 'lib');
    fs.mkdirSync(manualModDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'modules', 'invoicing', 'index.mjs'),
      `import { issueInvoice } from './${'lib'}/invoicing.mjs';\nexport { issueInvoice };\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(manualModDir, 'invoicing.mjs'),
      'export function issueInvoice(data) { return { id: "inv_1", ...data }; }\n',
      'utf8'
    );

    const syncReport = syncGovernanceDocs({ cwd: tmpDir });
    assert.ok(syncReport.addedModules.includes('invoicing'));

    const healedContext = fs.readFileSync(path.join(tmpDir, 'CONTEXT.md'), 'utf8');
    const postHealGov = verifyGovernance({
      changedFiles: ['src/modules/invoicing/index.mjs'],
      fileContents: {},
      contextMarkdown: healedContext,
      adrReadmeMarkdown,
      existingAdrFiles,
    });
    assert.equal(postHealGov.passed, true);

    // 5. Verify S02 (auto-wiring src/app.mjs on add-module), S03 (ADR traceability test), and S05 (two-way pruning on delete)
    const appTextAfterAdd = fs.readFileSync(path.join(tmpDir, 'src', 'app.mjs'), 'utf8');
    assert.match(appTextAfterAdd, /'shipments':/);
    assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'adr-traceability.seam.test.mjs')));

    fs.rmSync(path.join(tmpDir, 'src', 'modules', 'invoicing'), { recursive: true, force: true });
    fs.rmSync(path.join(tmpDir, adrResult.filePath), { force: true });
    const pruneReport = syncGovernanceDocs({ cwd: tmpDir });
    assert.ok(pruneReport.removedModules.includes('invoicing'));
    assert.ok(pruneReport.removedAdrs.includes('ADR-0002'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Foundry Spec-Driven Development Seam [ADR-0009]: initFoundrySpec, validateFoundrySpec, compileFoundrySpec, and verifySpecParity enforce executable specs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-foundry-sdd-'));
  try {
    const initRes = initFoundrySpec({
      cwd: tmpDir,
      serviceName: 'foundry-orders-api',
      port: 4300,
      modules: [
        {
          name: 'orders',
          fields: [
            { name: 'customerId', type: 'string', required: true },
            { name: 'totalCents', type: 'number', required: true, min: 100 },
            { name: 'status', type: 'string', required: true, enum: ['pending', 'paid', 'cancelled'] },
          ],
        },
        'payments',
      ],
    });

    assert.ok(fs.existsSync(path.join(tmpDir, initRes.specJsonPath)));
    assert.ok(fs.existsSync(path.join(tmpDir, initRes.specMdPath)));

    const valRes = validateFoundrySpec(path.join(tmpDir, initRes.specJsonPath));
    assert.equal(valRes.valid, true);
    assert.equal(valRes.summary.moduleCount, 2);

    const compileRes = compileFoundrySpec({ cwd: tmpDir });
    assert.deepEqual(compileRes.modules, ['orders', 'payments']);

    const parityRes = verifySpecParity({ cwd: tmpDir });
    assert.equal(parityRes.aligned, true);

    execSync('node --test tests/*.test.mjs', { cwd: tmpDir, stdio: 'pipe' });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
