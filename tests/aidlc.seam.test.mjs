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
  checkClaimSources,
  checkReadPathPurity,
  checkLatexCitationBijection,
  checkBenchmarkEmpiricalPurity,
  checkFileSizeCeiling,
  checkDynamicReportInterpolation,
  checkRawRecordProvenance,
  checkNoScriptedVerdicts,
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

test('Sensors [ADR-0010, ENH-0007]: checkLatexCitationBijection enforces 1:1 bijection between \\cite{} and \\bibitem/BibTeX', () => {
  const bijectiveReport = checkLatexCitationBijection({
    texContent:
      'We compare against HNSW \\cite{malkov2018hnsw, patel2024acorn}.\n\\bibitem{malkov2018hnsw} Malkov 2018.\n\\bibitem{patel2024acorn} Patel 2024.',
  });
  assert.equal(bijectiveReport.passed, true);
  assert.deepEqual(bijectiveReport.missingInBib, []);
  assert.deepEqual(bijectiveReport.uncitedInBib, []);

  const driftReport = checkLatexCitationBijection({
    texContent:
      'We cite \\cite{malkov2018hnsw, ghost2026}.\n\\bibitem{malkov2018hnsw} Malkov.\n\\bibitem{orphan2020} Orphan.',
  });
  assert.equal(driftReport.passed, false);
  assert.deepEqual(driftReport.missingInBib, ['ghost2026']);
  assert.deepEqual(driftReport.uncitedInBib, ['orphan2020']);
});

test('Sensors [ADR-0010, ENH-0008]: checkReadPathPurity flags global RNG seed mutations and synthetic counter offsets in modules', () => {
  const dirtyModule = `
def search_query(q):
    random.seed(42)
    distance_computations += int(len(nodes) * 1.5)
    return []
`;
  const cleanModule = `
def search_query(q):
    rng = random.Random(42)
    distance_computations += 1
    return []
`;

  const purityViolations = checkReadPathPurity({
    'src/modules/retrieval/lib/engine.py': dirtyModule,
  });
  assert.equal(purityViolations.length, 2);
  assert.ok(purityViolations.some((v) => v.rule === 'no-global-rng-seed-in-module'));
  assert.ok(purityViolations.some((v) => v.rule === 'no-synthetic-metric-offset'));

  const cleanViolations = checkReadPathPurity({
    'src/modules/retrieval/lib/engine.py': cleanModule,
  });
  assert.equal(cleanViolations.length, 0);
});

test('Sensors [ADR-0010, ENH-0010, ENH-0014]: checkBenchmarkEmpiricalPurity flags hardcoded metric arrays and formula-derived benchmark metrics', () => {
  const hardcodedBench = `
def run_suite():
    curves = {"Prism-ANN": {"recall_at_10": [0.912, 0.968, 0.985, 0.994]}}
    "p99_latency_ms": [2.15, 2.94, 4.12, 5.85]
`;
  const formulaBench = `
def run_h1_formula(tokens, n_docs):
    latency_ms = 0.0115 * tokens + 2.4
    revocation_latency = 4.28 * n_docs
    return {"p99_latency_ms": latency_ms}
`;
  const liveBench = `
def run_suite(index, queries):
    t0 = time.perf_counter()
    recalls = [evaluate(index.search(q)) for q in queries]
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return {"recall_at_10": float(np.mean(recalls)), "p99_latency_ms": elapsed_ms}
`;

  const arrayViolations = checkBenchmarkEmpiricalPurity({
    'run_prism_ann_benchmarks.py': hardcodedBench,
  });
  assert.ok(arrayViolations.length >= 2);
  assert.ok(arrayViolations.some((v) => v.rule === 'no-hardcoded-benchmark-metrics'));

  const formulaViolations = checkBenchmarkEmpiricalPurity({
    'run_prism_ann_benchmarks.py': formulaBench,
  });
  assert.ok(formulaViolations.length >= 2);
  assert.ok(formulaViolations.every((v) => v.rule === 'no-formula-derived-benchmark-metrics'));

  const cleanBenchViolations = checkBenchmarkEmpiricalPurity({
    'run_prism_ann_benchmarks.py': liveBench,
  });
  assert.equal(cleanBenchViolations.length, 0);
});

test('Sensors [ADR-0010, ENH-0012]: checkFileSizeCeiling enforces the 1,000-line Thermo-Nuclear file size limit', () => {
  const oversizedCode = Array.from({ length: 1005 }, (_, i) => `const x${i} = ${i};`).join('\n');
  const ceilingViolations = checkFileSizeCeiling({
    'src/modules/bloated/lib/monolith.mjs': oversizedCode,
    'src/modules/clean/lib/modular.mjs': 'export const ok = true;\n',
  });
  assert.equal(ceilingViolations.length, 1);
  assert.equal(ceilingViolations[0].file, 'src/modules/bloated/lib/monolith.mjs');
  assert.equal(ceilingViolations[0].rule, 'thermo-nuclear-file-size-ceiling');
});

test('Sensors [ADR-0010, ENH-0013]: checkDynamicReportInterpolation flags hardcoded numeric metric literals in audit and report templates', () => {
  const hardcodedReportScript = `
def generate_audit_markdown(data):
    line1 = "Prism-ANN achieves 97.8% recall at 14.23 ms p99 latency and 623.5x speedup."
    return line1
`;
  const interpolatedReportScript = `
def generate_audit_markdown(data):
    line1 = f"Prism-ANN achieves {data['recall']:.1f}% recall at {data['p99_ms']:.2f} ms p99 latency."
    return line1
`;

  const violations = checkDynamicReportInterpolation({
    'run_prism_paperviz_audit.py': hardcodedReportScript,
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'no-literal-metrics-in-report-template');

  const clean = checkDynamicReportInterpolation({
    'run_prism_paperviz_audit.py': interpolatedReportScript,
  });
  assert.equal(clean.length, 0);
});

test('Sensors [ADR-0010, ENH-0014]: checkRawRecordProvenance requires sibling raw/*.jsonl records, a recompute script, and valid mtime ordering', () => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-provenance-'));
  try {
    const resultsDir = path.join(tmpRepo, 'results');
    fs.mkdirSync(resultsDir, { recursive: true });
    const summaryPath = path.join(resultsDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({ recall_at_10: 0.95 }), 'utf8');

    // Case 1: Missing both raw/*.jsonl and recompute script
    const v1 = checkRawRecordProvenance({ cwd: tmpRepo });
    assert.ok(v1.some((v) => v.rule === 'missing-recompute-script'));
    assert.ok(v1.some((v) => v.rule === 'missing-raw-jsonl-records'));

    // Case 2: Add bench/recompute.py and results/raw/run.jsonl, but make summary.json newer than raw/run.jsonl
    const benchDir = path.join(tmpRepo, 'bench');
    const rawDir = path.join(resultsDir, 'raw');
    fs.mkdirSync(benchDir, { recursive: true });
    fs.mkdirSync(rawDir, { recursive: true });
    fs.writeFileSync(path.join(benchDir, 'recompute.py'), '# recompute\n', 'utf8');
    const rawFile = path.join(rawDir, 'queries.jsonl');
    fs.writeFileSync(rawFile, '{"qid":1,"latency_ms":1.23}\n', 'utf8');

    const pastTime = new Date(Date.now() - 60_000);
    const futureTime = new Date(Date.now() + 10_000);
    fs.utimesSync(rawFile, pastTime, pastTime);
    fs.utimesSync(summaryPath, futureTime, futureTime);

    const v2 = checkRawRecordProvenance({ cwd: tmpRepo });
    assert.equal(v2.length, 1);
    assert.equal(v2[0].rule, 'summary-newer-than-raw-records');

    // Case 3: Raw file mtime >= summary mtime passes
    fs.utimesSync(summaryPath, pastTime, pastTime);
    fs.utimesSync(rawFile, futureTime, futureTime);
    const v3 = checkRawRecordProvenance({ cwd: tmpRepo });
    assert.equal(v3.length, 0);
  } finally {
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  }
});

test('Sensors [ADR-0010, ENH-0015]: checkNoScriptedVerdicts flags literal score dicts and hardcoded verdict strings in audit/review scripts', () => {
  const scriptedPaperViz = `
scores = {
    "faithfulness": 99.0,
    "conciseness": 97.5,
    "overall_score": 97.72
}
`;
  const scriptedScholarPeer = `
def render_verdict():
    return "Verdict: STRONG ACCEPT (Score: 9.0 / 10)"
`;
  const dynamicVerifier = `
def verify_review_artifact(review_path, expected_sha256):
    assert os.path.exists(review_path)
    return True
`;

  const v1 = checkNoScriptedVerdicts({
    'run_prism_paperviz_audit.py': scriptedPaperViz,
    'run_prism_scholarpeer_review.py': scriptedScholarPeer,
  });
  assert.ok(v1.length >= 4);
  assert.ok(v1.every((v) => v.rule === 'no-scripted-audit-verdict'));

  const v2 = checkNoScriptedVerdicts({
    'run_prism_paperviz_audit.py': dynamicVerifier,
  });
  assert.equal(v2.length, 0);
});
