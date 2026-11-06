import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

import {
  discoverPractices,
  analyzeCodebase,
  mineGitArchaeology,
  synthesizeRetroAdrs,
} from '../src/modules/discovery/index.mjs';
import {
  generateArchitectureVisuals,
  generateArchitectureTour,
  generateInteractiveExplorerHtml,
} from '../src/modules/visualizer/index.mjs';
import { runSensors } from '../src/modules/sensors/index.mjs';

function createBrownfieldFixtureRepo() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-brownfield-'));

  fs.writeFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify(
      {
        name: 'acme-commerce-engine',
        version: '2.1.0',
        type: 'module',
        scripts: {
          test: 'node --test tests/*.test.mjs',
        },
        dependencies: {
          pg: '^8.11.0',
          fastify: '^4.26.0',
        },
      },
      null,
      2
    ),
    'utf8'
  );

  // Module 1: orders (Deep Module with public index.mjs and hidden lib)
  const ordersLibDir = path.join(tmpDir, 'src', 'modules', 'orders', 'lib');
  fs.mkdirSync(ordersLibDir, { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'src', 'modules', 'orders', 'index.mjs'),
    `import { calculateOrderTotal, validateOrderItems } from './${'lib'}/pricing-engine.mjs';\nexport { calculateOrderTotal, validateOrderItems };\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(ordersLibDir, 'pricing-engine.mjs'),
    [
      'export function calculateOrderTotal(items = []) {',
      '  let subtotal = 0;',
      '  for (const item of items) {',
      '    subtotal += (item.priceCents || 0) * (item.quantity || 1);',
      '  }',
      '  const tax = Math.round(subtotal * 0.0825);',
      '  const shipping = subtotal > 5000 ? 0 : 499;',
      '  return { subtotal, tax, shipping, total: subtotal + tax + shipping };',
      '}',
      '',
      'export function validateOrderItems(items = []) {',
      '  if (!Array.isArray(items) || items.length === 0) {',
      '    throw new Error("Order must contain at least one item");',
      '  }',
      '  return items.every((i) => i.sku && i.priceCents > 0);',
      '}',
    ].join('\n'),
    'utf8'
  );

  // Module 2: checkout (Imports orders via public seam AND has a seam leak into payments/lib)
  const checkoutLibDir = path.join(tmpDir, 'src', 'modules', 'checkout', 'lib');
  fs.mkdirSync(checkoutLibDir, { recursive: true });
  const leakyImportPath = '../payments/' + 'lib/stripe-adapter.mjs';
  fs.writeFileSync(
    path.join(tmpDir, 'src', 'modules', 'checkout', 'index.mjs'),
    `import { calculateOrderTotal } from '../orders/index.mjs';\nimport { chargeCard } from '${leakyImportPath}';\nexport function executeCheckout(cart) { const totals = calculateOrderTotal(cart.items); return chargeCard(totals.total); }\n`,
    'utf8'
  );

  // Module 3: payments
  const paymentsLibDir = path.join(tmpDir, 'src', 'modules', 'payments', 'lib');
  fs.mkdirSync(paymentsLibDir, { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'src', 'modules', 'payments', 'index.mjs'),
    `import { chargeCard } from './${'lib'}/stripe-adapter.mjs';\nexport { chargeCard };\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(paymentsLibDir, 'stripe-adapter.mjs'),
    `export function chargeCard(amountCents) {\n  return { charged: true, amountCents, provider: 'stripe' };\n}\n`,
    'utf8'
  );

  // Initialize git repo with 2 commits so git archaeology has real history
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test Architect"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git add package.json src/modules/orders src/modules/payments', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git commit -m "feat(orders): initialize orders and payments deep modules"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git add src/modules/checkout', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git commit -m "feat(checkout): add checkout orchestration flow"', { cwd: tmpDir, stdio: 'ignore' });

  return tmpDir;
}

test('DRD-01 [ADR-0008]: analyzeCodebase extracts dependency graph, module depth ratios, Fan-In/Out, and seam leaks', () => {
  const tmpDir = createBrownfieldFixtureRepo();
  try {
    const xray = analyzeCodebase({ cwd: tmpDir });

    assert.equal(xray.projectName, 'acme-commerce-engine');
    assert.equal(xray.runtime, 'node-esm');
    assert.equal(xray.testRunner, 'node:test');
    assert.equal(xray.layoutPattern, 'deep-modules');
    assert.ok(xray.totalFiles >= 5);
    assert.ok(xray.totalLines >= 20);

    const moduleNames = xray.modules.map((m) => m.name).sort();
    assert.deepEqual(moduleNames, ['checkout', 'orders', 'payments']);

    const ordersMod = xray.modules.find((m) => m.name === 'orders');
    assert.ok(ordersMod);
    assert.ok(ordersMod.publicSymbols.includes('calculateOrderTotal'));
    assert.ok(ordersMod.depthRatio > 0);
    assert.equal(ordersMod.fanIn, 1); // checkout imports orders

    // Verify cross-module seam violation detection (checkout -> payments/lib/stripe-adapter.mjs)
    assert.equal(xray.seamViolations.length, 1);
    assert.equal(xray.seamViolations[0].fromModule, 'checkout');
    assert.equal(xray.seamViolations[0].toModule, 'payments');

    // Verify infrastructure fingerprinting
    assert.ok(xray.infrastructure.databases.includes('postgresql'));
    assert.ok(xray.infrastructure.transports.includes('fastify'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('DRD-02 [ADR-0008]: mineGitArchaeology extracts epochs, hotspot gravity scores, and co-change coupling', () => {
  const tmpDir = createBrownfieldFixtureRepo();
  try {
    const xray = analyzeCodebase({ cwd: tmpDir });
    const gitReport = mineGitArchaeology({ cwd: tmpDir, xrayReport: xray });

    assert.equal(gitReport.totalCommitsAnalyzed, 2);
    assert.ok(gitReport.epochs.length >= 1);
    assert.ok(gitReport.hotspots.length >= 1);
    assert.ok(gitReport.hotspots[0].gravityScore >= 1);
    assert.ok(['One-Way Door', 'Two-Way Door'].includes(gitReport.hotspots[0].doorClassification));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('DRD-03 [ADR-0008]: synthesizeRetroAdrs generates sensor-compliant Retro-ADRs and domain glossary', () => {
  const tmpDir = createBrownfieldFixtureRepo();
  try {
    const xray = analyzeCodebase({ cwd: tmpDir });
    const gitReport = mineGitArchaeology({ cwd: tmpDir, xrayReport: xray });
    const synthesis = synthesizeRetroAdrs({ cwd: tmpDir, xrayReport: xray, gitReport });

    assert.ok(synthesis.synthesizedAdrs.length >= 4);
    assert.ok(synthesis.glossaryTerms.length >= 3);
    assert.match(synthesis.suggestedGlossaryMarkdown, /# Domain Glossary/);
    assert.match(synthesis.suggestedContextMarkdown, /acme-commerce-engine/);

    // Verify that checkout -> payments/lib violation triggers a drift-detected or proposed ADR finding
    const boundaryAdr = synthesis.synthesizedAdrs.find((a) => a.dimension === 'boundary-encapsulation');
    assert.ok(boundaryAdr);
    assert.ok(['drift-detected', 'accepted', 'proposed'].includes(boundaryAdr.status));

    // Every synthesized Retro-ADR MUST pass runSensors (required-sections & claim-sources)
    const adrFilesMap = {};
    for (const adr of synthesis.synthesizedAdrs) {
      adrFilesMap[`docs/adr/${adr.fileName}`] = adr.markdown;
    }
    const sensorResult = runSensors({ fileContents: adrFilesMap });
    assert.equal(sensorResult.passed, true);
    assert.equal(sensorResult.findings.requiredSections.length, 0);
    assert.equal(sensorResult.findings.claimSources.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('DRD-04 & DRD-05 [ADR-0008]: visualizer generates 5-lens Mermaid architecture, cognitive tour, and interactive HTML explorer', () => {
  const repoRoot = path.resolve(import.meta.dirname, '..');
  const xray = analyzeCodebase({ cwd: repoRoot });
  const gitReport = mineGitArchaeology({ cwd: repoRoot, xrayReport: xray });
  const retroAdrReport = synthesizeRetroAdrs({ cwd: repoRoot, xrayReport: xray, gitReport });

  const analysis = { xrayReport: xray, gitReport, retroAdrReport };

  // 1. 5-Lens Mermaid Visuals (DRD-04.1)
  const visuals = generateArchitectureVisuals(analysis);
  assert.match(visuals.markdown, /Lens 1: C4 System Context & Container Architecture/);
  assert.match(visuals.markdown, /Lens 2: Deep Module Seam & Dependency Topology/);
  assert.match(visuals.markdown, /Lens 3: ADR Governance Coverage Matrix/);
  assert.match(visuals.markdown, /Lens 4: Git Churn vs\. Architectural Gravity Risk Quadrant/);
  assert.match(visuals.markdown, /Lens 5: End-to-End Execution Call Tree/);
  assert.match(visuals.lenses.moduleSeamAndCouplingMermaid, /flowchart/);

  // 2. Cognitive Architecture Tour ("Imagine the Project" - DRD-05)
  const tour = generateArchitectureTour(analysis);
  assert.match(tour.markdown, /1\. The 60-Second Mental Model/);
  assert.match(tour.markdown, /2\. What Has Been Built/);
  assert.match(tour.markdown, /3\. Anatomy of an Execution Flow/);
  assert.match(tour.markdown, /4\. Why It Is Shaped This Way/);
  assert.match(tour.markdown, /5\. Safe Extension Guide/);
  assert.equal(tour.sections.length, 5);

  // 3. Standalone Interactive HTML Explorer (DRD-04.2)
  const explorer = generateInteractiveExplorerHtml(analysis);
  assert.match(explorer.html, /<!DOCTYPE html>/i);
  assert.match(explorer.html, /Architecture Intelligence Explorer/);
  assert.match(explorer.html, /governance/);
  assert.match(explorer.html, /visualizer/);
});
