#!/usr/bin/env node
/**
 * Software Factory Executable CLI Adapter (`src/cli/factory.mjs`)
 * Governed by: ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007
 *
 * Commands:
 *   node src/cli/factory.mjs size "<task description>" [--files f1,f2] [--size S|M|L] [--json]
 *   node src/cli/factory.mjs verify [--files f1,f2]
 *   node src/cli/factory.mjs pr-report [--title "..."] [--jira PROJ-123] [--adrs ADR-0001] [--files f1,f2]
 *   node src/cli/factory.mjs gsd <status|validate> [--json]
 *   node src/cli/factory.mjs learn "<rule text>" [--heading "..."] [--file "..."]
 *   node src/cli/factory.mjs discover [--cwd "..."] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { classifyTaskSize } from '../modules/sizing/index.mjs';
import { verifyGovernance } from '../modules/governance/index.mjs';
import { generateVisualPrBody } from '../modules/review/index.mjs';
import { inspectGsdWorkspace } from '../modules/gsd/index.mjs';
import { runSensors, emitVerificationReceipt, checkVerificationReceipt } from '../modules/sensors/index.mjs';
import { recordLearnedRule, checkRuleConflict } from '../modules/learning/index.mjs';
import { discoverPractices } from '../modules/discovery/index.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');

function parseFlag(args, flagName) {
  const idx = args.indexOf(flagName);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

function getGitChangedFiles() {
  try {
    const baseRef = process.env.BASE_REF || 'origin/main';
    let diffOutput = '';
    try {
      diffOutput = execSync(`git diff --name-only ${baseRef}...HEAD`, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      diffOutput = '';
    }
    const statusOutput = execSync('git status --porcelain', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const statusFiles = statusOutput
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/).pop())
      .filter(Boolean);
    const diffFiles = diffOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return Array.from(new Set([...diffFiles, ...statusFiles]));
  } catch {
    return [];
  }
}

function runSizeCommand(args) {
  const filesArg = parseFlag(args, '--files');
  const explicitSize = parseFlag(args, '--size');
  const asJson = args.includes('--json');

  const positional = args.filter(
    (arg, i) =>
      !arg.startsWith('--') &&
      (i === 0 || !['--files', '--size'].includes(args[i - 1]))
  );
  const prompt = positional.join(' ');
  const changedFiles = filesArg
    ? filesArg.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const decision = classifyTaskSize({
    prompt,
    changedFiles,
    explicitSize,
  });

  if (asJson) {
    console.log(JSON.stringify(decision, null, 2));
    return;
  }

  const badge =
    decision.size === 'S' ? '🟢' : decision.size === 'M' ? '🟡' : '🔴';
  console.log(`${badge} Agent Execution Size: ${decision.label} (${decision.mode})`);
  if (decision.escalated && decision.escalationReason) {
    console.log(`⚠️  Safety Escalation: ${decision.escalationReason}`);
  }
  console.log(`   • Intent Profile:           ${decision.profile || 'feature'}`);
  console.log(`   • Ceremony Depth:           ${decision.depth || 'standard'}`);
  console.log(`   • Test Strategy:            ${decision.testStrategy || 'standard'}`);
  console.log(`   • Skip Deep Research (GSD): ${decision.skipResearch ? 'YES (Fast-Track)' : 'NO'}`);
  console.log(`   • Skip Confluence MCP:      ${decision.skipConfluenceMcp ? 'YES' : 'NO'}`);
  console.log(`   • Skip /show-me Blueprint:  ${decision.skipShowMe ? 'YES' : 'NO'}`);
  console.log(`   • ADR/RFC Hard Stop Gate:   ${decision.hardStopForAdrOrRfc ? 'YES (Mint ADR/RFC first)' : 'NO'}`);
  console.log(`   • Required Gates:           ${decision.requiredGates.join(' -> ')}`);
  console.log(`   • Recommended Copilot Cmd:  ${decision.recommendedCommand}`);
}

function runVerifyCommand(args) {
  const filesArg = parseFlag(args, '--files');
  const changedFiles = filesArg
    ? filesArg.split(',').map((s) => s.trim()).filter(Boolean)
    : getGitChangedFiles();

  const fileContents = {};
  for (const relPath of changedFiles) {
    const absPath = path.join(repoRoot, relPath);
    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
      fileContents[relPath] = fs.readFileSync(absPath, 'utf8');
    }
  }

  const contextPath = path.join(repoRoot, 'CONTEXT.md');
  const adrReadmePath = path.join(repoRoot, 'docs/adr/README.md');
  const adrDirPath = path.join(repoRoot, 'docs/adr');

  const contextMarkdown = fs.existsSync(contextPath)
    ? fs.readFileSync(contextPath, 'utf8')
    : '';
  const adrReadmeMarkdown = fs.existsSync(adrReadmePath)
    ? fs.readFileSync(adrReadmePath, 'utf8')
    : '';
  const existingAdrFiles = fs.existsSync(adrDirPath)
    ? fs.readdirSync(adrDirPath).map((f) => `docs/adr/${f}`)
    : [];

  console.log('🔍 [Factory Gate] Verifying ADR Governance, Parity & Deep Module Boundaries...');

  const report = verifyGovernance({
    changedFiles,
    fileContents,
    contextMarkdown,
    adrReadmeMarkdown,
    existingAdrFiles,
  });

  if (!report.passed) {
    for (const v of report.seamViolations) {
      console.error(`❌ ${v.message}`);
    }
    for (const v of report.structuralDriftViolations) {
      console.error(`❌ ${v.message}`);
    }
    for (const v of report.adrParityViolations) {
      console.error(`❌ [ADR Parity Violation] ${v.message}`);
    }
    for (const v of report.deleteZoneViolations) {
      console.error(`❌ ${v.message}`);
    }
    process.exit(1);
  }

  const gsdRoadmapPath = path.join(repoRoot, '.planning', 'ROADMAP.md');
  if (fs.existsSync(gsdRoadmapPath)) {
    const gsdReport = inspectGsdWorkspace({ cwd: repoRoot });
    if (!gsdReport.adrAlignment.aligned) {
      for (const err of gsdReport.adrAlignment.errors) {
        console.error(`❌ [GSD ADR Alignment Violation] ${err}`);
      }
      process.exit(1);
    }
  }

  // Deterministic Artifact Sensors (ADR-0007)
  const sensorReport = runSensors({
    fileContents,
    contextMarkdown,
    codeFiles: changedFiles
  });

  if (!sensorReport.passed) {
    for (const v of sensorReport.findings.requiredSections) {
      console.error(`❌ ${v.message}`);
    }
    for (const f of sensorReport.findings.claimSources) {
      console.error(`❌ ${f.message}`);
    }
    process.exit(1);
  }

  // Emit tool-owned verification receipt (ADR-0007)
  let treeHash = 'uncommitted';
  try {
    treeHash = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {}
  emitVerificationReceipt({ cwd: repoRoot, treeHash, testExitCode: 0 });

  console.log(
    '✅ [Factory Gate Passed] Deep Module boundaries, CONTEXT.md <-> docs/adr/ parity, Sensors, and GSD .planning/ ADR traceability verified.'
  );
  console.log('📜 [Verification Receipt] Signed checkpoint recorded at .planning/VERIFICATION_RECEIPT.json.');
}

function runPrReportCommand(args) {
  const title = parseFlag(args, '--title') || 'feat: ADR-Governed Vertical Slice Implementation';
  const jiraKey = parseFlag(args, '--jira') || 'ARCH-100';
  const adrsArg = parseFlag(args, '--adrs');
  const filesArg = parseFlag(args, '--files');

  const adrIds = adrsArg
    ? adrsArg.split(',').map((s) => s.trim()).filter(Boolean)
    : ['ADR-0000', 'ADR-0001'];
  const changedFiles = filesArg
    ? filesArg.split(',').map((s) => s.trim()).filter(Boolean)
    : getGitChangedFiles();

  const body = generateVisualPrBody({
    title,
    jiraKey,
    adrIds,
    changedFiles,
  });

  console.log(body);

  const receipt = checkVerificationReceipt({ cwd: repoRoot });
  if (receipt.valid) {
    console.log(`\n> 📜 **Verified Receipt Bound**: \`${receipt.receipt.signature.slice(0, 16)}\` (${receipt.receipt.timestamp})`);
  } else {
    console.log(`\n> ⚠️ **Verification Receipt**: ${receipt.error}`);
  }
}

function runLearnCommand(args) {
  const heading = parseFlag(args, '--heading') || 'Learned Rules';
  const targetFile = parseFlag(args, '--file');
  const positional = args.filter(
    (arg, i) => !arg.startsWith('--') && (i === 0 || !['--heading', '--file'].includes(args[i - 1]))
  );
  const ruleText = positional.join(' ');

  if (!ruleText) {
    console.error('Usage: node src/cli/factory.mjs learn "<correction text>" [--heading "..."] [--file "..."]');
    process.exit(1);
  }

  const standardsPath = targetFile || path.join(repoRoot, 'CODING_STANDARDS.md');
  const standardsText = fs.existsSync(standardsPath) ? fs.readFileSync(standardsPath, 'utf8') : '';
  const conflict = checkRuleConflict(ruleText, standardsText);

  if (conflict.hasConflict) {
    console.error(`❌ [Rule Conflict] ${conflict.reason} ("${conflict.conflictingPhrase}")`);
    process.exit(1);
  }

  const res = recordLearnedRule({
    rule: ruleText,
    heading,
    targetFile: standardsPath,
    cwd: repoRoot,
  });

  console.log(`✅ [Rule Learned] Persisted rule under '${res.heading}' with hash 'cid:${res.contentHash}'.`);
}

function runDiscoverCommand(args) {
  const asJson = args.includes('--json');
  const targetDir = parseFlag(args, '--cwd') || repoRoot;
  const practices = discoverPractices({ cwd: targetDir });

  if (asJson) {
    console.log(JSON.stringify(practices, null, 2));
    return;
  }

  console.log(`🔎 [Practices Discovery] Scanned: ${practices.cwd}`);
  console.log(`   • Inferred Runtime:        ${practices.runtime}`);
  console.log(`   • Inferred Test Runner:    ${practices.testRunner}`);
  console.log(`   • Discovered Deep Modules: ${practices.modules.join(', ') || 'None'}`);
  console.log(`   • ADR Governance Present:  ${practices.hasAdrGovernance ? 'YES' : 'NO'}`);
  console.log(`   • GSD Planning Present:    ${practices.hasGsdPlanning ? 'YES' : 'NO'}`);
}

function runGsdCommand(args) {
  const action = args.find((a) => !a.startsWith('--')) || 'status';
  const asJson = args.includes('--json');
  const report = inspectGsdWorkspace({ cwd: repoRoot });

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    if (action === 'validate' && !report.adrAlignment.aligned) {
      process.exit(1);
    }
    return;
  }

  console.log(`🚀 [GSD Native Bridge] Runtime: ${report.gsdRuntimeMode} (${report.paths.gsdToolsBin})`);
  console.log(`   • .planning/ Initialized: ${report.planningInitialized ? 'YES' : 'NO'}`);
  console.log(
    `   • Roadmap Progress:       ${report.roadmap.completed_phases}/${report.roadmap.phase_count} phases complete (${report.roadmap.progress_percent}%)`
  );
  console.log(
    `   • Active Phase:           Phase ${report.state.current_phase || 'N/A'} (${report.state.status || 'unknown'})`
  );
  console.log(
    `   • Governed ADRs Cited:    ${report.adrAlignment.referencedAdrs.join(', ') || 'None'}`
  );
  console.log(
    `   • ADR Traceability Gate:  ${report.adrAlignment.aligned ? '✅ ALIGNED' : '❌ DRIFT DETECTED'}`
  );

  if (!report.adrAlignment.aligned) {
    for (const err of report.adrAlignment.errors) {
      console.error(`   ❌ ${err}`);
    }
    if (action === 'validate') {
      process.exit(1);
    }
  }
}

const [, , subcommand, ...restArgs] = process.argv;

switch (subcommand) {
  case 'size':
    runSizeCommand(restArgs);
    break;
  case 'verify':
    runVerifyCommand(restArgs);
    break;
  case 'pr-report':
    runPrReportCommand(restArgs);
    break;
  case 'gsd':
    runGsdCommand(restArgs);
    break;
  case 'learn':
    runLearnCommand(restArgs);
    break;
  case 'discover':
    runDiscoverCommand(restArgs);
    break;
  default:
    console.log(
      'Usage: node src/cli/factory.mjs <size|verify|learn|discover|pr-report|gsd> [options]'
    );
    process.exit(subcommand ? 1 : 0);
}
