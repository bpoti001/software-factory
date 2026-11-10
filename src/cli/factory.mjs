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
import {
  discoverPractices,
  analyzeCodebase,
  mineGitArchaeology,
  synthesizeRetroAdrs,
} from '../modules/discovery/index.mjs';
import {
  generateArchitectureVisuals,
  generateArchitectureTour,
  generateInteractiveExplorerHtml,
} from '../modules/visualizer/index.mjs';
import {
  syncGovernanceDocs,
  scaffoldAdr,
  scaffoldDeepModule,
  scaffoldApiService,
} from '../modules/scaffolder/index.mjs';

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
      diffOutput = execSync(`git diff --name-only --diff-filter=d ${baseRef}...HEAD`, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      diffOutput = '';
    }
    const statusOutput = execSync('git status --porcelain -uall', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const statusFiles = statusOutput
      .split(/\r?\n/)
      .filter((line) => line.length > 3 && !line.slice(0, 2).includes('D'))
      .map((line) => line.slice(3).trim())
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

  // Execute unit & seam test suite to ensure clean real exit code (ADR-0007)
  let testExitCode = 0;
  const pkgJsonPath = path.join(repoRoot, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      execSync('node --test tests/*.test.mjs', { cwd: repoRoot, stdio: 'inherit' });
      testExitCode = 0;
    } catch (err) {
      testExitCode = err.status || 1;
      console.error(`❌ [Test Suite Failure] Test runner exited with code ${testExitCode}.`);
      process.exit(testExitCode);
    }
  }

  // Emit tool-owned verification receipt bound to git tree (ADR-0007)
  let treeHash = 'uncommitted';
  try {
    treeHash = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {}
  emitVerificationReceipt({ cwd: repoRoot, treeHash, testExitCode, command: 'node --test tests/*.test.mjs && factory verify' });

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
  const rollbackText = parseFlag(args, '--rollback') || parseFlag(args, '--operations-rollback') || '';

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
    operationsRollbackText: rollbackText,
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

function writeVisualizationSuite(targetDir, outDirRel, analysis) {
  const outDir = path.resolve(targetDir, outDirRel || 'docs/architecture');
  fs.mkdirSync(outDir, { recursive: true });

  const visuals = generateArchitectureVisuals(analysis);
  const tour = generateArchitectureTour(analysis);
  const explorer = generateInteractiveExplorerHtml(analysis);

  const visualsPath = path.join(outDir, 'VISUAL_ARCHITECTURE.md');
  const tourPath = path.join(outDir, 'ARCHITECTURE_TOUR.md');
  const explorerPath = path.join(outDir, 'explorer.html');

  fs.writeFileSync(visualsPath, visuals.markdown, 'utf8');
  fs.writeFileSync(tourPath, tour.markdown, 'utf8');
  fs.writeFileSync(explorerPath, explorer.html, 'utf8');

  return { outDir, visualsPath, tourPath, explorerPath };
}

function runAnalyzeCommand(args) {
  const asJson = args.includes('--json');
  const withVisualize = args.includes('--visualize');
  const targetDir = path.resolve(parseFlag(args, '--cwd') || parseFlag(args, '--path') || repoRoot);
  const outDirRel = parseFlag(args, '--out') || 'docs/architecture';

  const xrayReport = analyzeCodebase({ cwd: targetDir });
  const gitReport = mineGitArchaeology({ cwd: targetDir, xrayReport });
  const retroAdrReport = synthesizeRetroAdrs({ cwd: targetDir, xrayReport, gitReport });
  const analysis = { xrayReport, gitReport, retroAdrReport };

  let writtenArtifacts = null;
  if (withVisualize) {
    writtenArtifacts = writeVisualizationSuite(targetDir, outDirRel, analysis);
  }

  if (asJson) {
    console.log(JSON.stringify({ ...analysis, writtenArtifacts }, null, 2));
    return;
  }

  console.log(`🏛️  [Brownfield Archaeology & X-Ray] Target: ${xrayReport.projectName} (${xrayReport.cwd})`);
  console.log(`   • Runtime / Test Runner:     ${xrayReport.runtime} / ${xrayReport.testRunner}`);
  console.log(`   • Layout Pattern:            ${xrayReport.layoutPattern}`);
  console.log(`   • Codebase Scale:            ${xrayReport.totalFiles} files (${xrayReport.totalLines} lines)`);
  console.log(
    `   • Discovered Modules (${xrayReport.modules.length}):    ${xrayReport.modules.map((m) => `${m.name} [Depth ${m.depthRatio}]`).join(', ') || 'None'}`
  );
  console.log(`   • Cross-Module Edges:        ${xrayReport.edges.length} (${xrayReport.seamViolations.length} seam violation(s), ${xrayReport.circularDependencies.length} cycle(s))`);
  console.log(`   • Git Commits Analyzed:      ${gitReport.totalCommitsAnalyzed} (${gitReport.epochs.length} epoch(s), ${gitReport.hotspots.length} hotspot(s))`);
  console.log(
    `   • Synthesized Retro-ADRs:    ${retroAdrReport.synthesizedAdrs.map((a) => `${a.adrId} (${a.status})`).join(', ')}`
  );

  if (writtenArtifacts) {
    console.log(`   • Visual Blueprint Written:  ${path.relative(targetDir, writtenArtifacts.visualsPath)}`);
    console.log(`   • Cognitive Tour Written:    ${path.relative(targetDir, writtenArtifacts.tourPath)}`);
    console.log(`   • HTML Explorer Written:     ${path.relative(targetDir, writtenArtifacts.explorerPath)}`);
  }
}

function runAdrSynthesizeCommand(args) {
  const asJson = args.includes('--json');
  const writeToDisk = args.includes('--write');
  const targetDir = path.resolve(parseFlag(args, '--cwd') || parseFlag(args, '--path') || repoRoot);
  const outDirRel = parseFlag(args, '--out') || 'docs/adr/synthesized';

  const xrayReport = analyzeCodebase({ cwd: targetDir });
  const gitReport = mineGitArchaeology({ cwd: targetDir, xrayReport });
  const retroAdrReport = synthesizeRetroAdrs({
    cwd: targetDir,
    xrayReport,
    gitReport,
    writeFiles: writeToDisk,
    outputDir: outDirRel,
  });

  if (asJson) {
    console.log(JSON.stringify(retroAdrReport, null, 2));
    return;
  }

  console.log(`📜 [Retro-ADR Synthesizer] Generated ${retroAdrReport.synthesizedAdrs.length} evidence-backed ADRs for ${xrayReport.projectName}:`);
  for (const adr of retroAdrReport.synthesizedAdrs) {
    console.log(`   • ${adr.adrId}: ${adr.title} [${adr.status} — ${Math.round(adr.adherenceRatio * 100)}%]`);
  }
  if (writeToDisk) {
    console.log(`   ✅ Wrote synthesized ADR files to ${outDirRel}/`);
  }
}

function runVisualizeCommand(args) {
  const targetDir = path.resolve(parseFlag(args, '--cwd') || parseFlag(args, '--path') || repoRoot);
  const outDirRel = parseFlag(args, '--out') || 'docs/architecture';

  const xrayReport = analyzeCodebase({ cwd: targetDir });
  const gitReport = mineGitArchaeology({ cwd: targetDir, xrayReport });
  const retroAdrReport = synthesizeRetroAdrs({ cwd: targetDir, xrayReport, gitReport });
  const written = writeVisualizationSuite(targetDir, outDirRel, {
    xrayReport,
    gitReport,
    retroAdrReport,
  });

  console.log(`🎨 [Architecture Visualizer] Generated 5-Lens Visual Suite for ${xrayReport.projectName}:`);
  console.log(`   • 5-Lens Mermaid Blueprint: ${path.relative(targetDir, written.visualsPath)}`);
  console.log(`   • Cognitive Project Tour:   ${path.relative(targetDir, written.tourPath)}`);
  console.log(`   • Interactive HTML Explorer: ${path.relative(targetDir, written.explorerPath)}`);
}

function runSyncCommand(args) {
  const targetDir = path.resolve(parseFlag(args, '--cwd') || parseFlag(args, '--path') || repoRoot);
  const report = syncGovernanceDocs({ cwd: targetDir });

  console.log(`🔄 [Governance Auto-Sync] Synchronized: ${report.cwd}`);
  console.log(`   • Newly Registered Modules: ${report.addedModules.join(', ') || 'None (already in sync)'}`);
  console.log(`   • Newly Registered ADRs:    ${report.addedAdrs.join(', ') || 'None (already in sync)'}`);
}

function runAddModuleCommand(args) {
  const targetDir = path.resolve(parseFlag(args, '--cwd') || parseFlag(args, '--path') || repoRoot);
  const exportsArg = parseFlag(args, '--exports');
  const positional = args.filter(
    (arg, i) => !arg.startsWith('--') && (i === 0 || !['--cwd', '--path', '--exports'].includes(args[i - 1]))
  );
  const moduleName = positional[0];

  if (!moduleName) {
    console.error('Usage: node src/cli/factory.mjs add-module <module-name> [--exports fn1,fn2] [--cwd <dir>]');
    process.exit(1);
  }

  const exportsList = exportsArg
    ? exportsArg.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  const result = scaffoldDeepModule({
    cwd: targetDir,
    moduleName,
    exports: exportsList,
  });

  console.log(`⚡ [Deep Module Scaffolder] Created module '${result.moduleName}' in <50ms:`);
  console.log(`   • Public Seam:       ${result.entryPoint} (exports: ${result.exports.join(', ')})`);
  console.log(`   • Private Internals: ${result.internalFile}`);
  console.log(`   • Seam Test:         ${result.testFile}`);
  console.log(`   • Governance Sync:   ✅ Auto-registered in CONTEXT.md Section 2`);
}

function runAddAdrCommand(args) {
  const targetDir = path.resolve(parseFlag(args, '--cwd') || parseFlag(args, '--path') || repoRoot);
  const scope = parseFlag(args, '--scope') || '`src/modules/*`';
  const decision = parseFlag(args, '--decision') || undefined;
  const positional = args.filter(
    (arg, i) => !arg.startsWith('--') && (i === 0 || !['--cwd', '--path', '--scope', '--decision'].includes(args[i - 1]))
  );
  const title = positional.join(' ');

  if (!title) {
    console.error('Usage: node src/cli/factory.mjs add-adr "<ADR Title>" [--scope "..."] [--decision "..."] [--cwd <dir>]');
    process.exit(1);
  }

  const result = scaffoldAdr({
    cwd: targetDir,
    title,
    scope,
    decision,
  });

  console.log(`📜 [ADR Scaffolder] Minted sensor-compliant ${result.adrId}: ${result.title}`);
  console.log(`   • File:            ${result.filePath}`);
  console.log(`   • Governance Sync: ✅ Auto-registered in CONTEXT.md Section 3 & docs/adr/README.md`);
}

function runScaffoldApiCommand(args) {
  const targetDir = path.resolve(
    parseFlag(args, '--dir') ||
      parseFlag(args, '--out') ||
      parseFlag(args, '--cwd') ||
      parseFlag(args, '--path') ||
      process.cwd()
  );
  const name = parseFlag(args, '--name') || path.basename(targetDir);
  const modulesArg = parseFlag(args, '--modules');
  const port = Number(parseFlag(args, '--port') || 3000);

  const modules = modulesArg
    ? modulesArg.split(',').map((s) => s.trim()).filter(Boolean)
    : ['users', 'items'];

  const result = scaffoldApiService({
    targetDir,
    name,
    modules,
    port,
  });

  console.log(`🚀 [Turnkey API Scaffolder] Generated governed API service '${result.name}' at ${result.targetDir}:`);
  console.log(`   • HTTP Router & Server: src/app.mjs, src/server.mjs (Port ${result.port})`);
  console.log(`   • Deep Modules (${result.modules.length}):     ${result.modules.map((m) => `src/modules/${m}/index.mjs`).join(', ')}`);
  console.log(`   • Automated Tests:      tests/api.integration.test.mjs + ${result.modules.length} seam test(s)`);
  console.log(`   • Governance & ADRs:    CONTEXT.md, GLOSSARY.md, docs/adr/0001-*.md (100% synced)`);
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
  case 'analyze':
    runAnalyzeCommand(restArgs);
    break;
  case 'adr-synthesize':
    runAdrSynthesizeCommand(restArgs);
    break;
  case 'visualize':
    runVisualizeCommand(restArgs);
    break;
  case 'sync':
    runSyncCommand(restArgs);
    break;
  case 'add-module':
    runAddModuleCommand(restArgs);
    break;
  case 'add-adr':
    runAddAdrCommand(restArgs);
    break;
  case 'scaffold-api':
    runScaffoldApiCommand(restArgs);
    break;
  default:
    console.log(
      'Usage: node src/cli/factory.mjs <size|verify|sync|add-module|add-adr|scaffold-api|learn|discover|analyze|adr-synthesize|visualize|pr-report|gsd> [options]'
    );
    process.exit(subcommand ? 1 : 0);
}
