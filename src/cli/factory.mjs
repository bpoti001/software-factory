#!/usr/bin/env node
/**
 * Software Factory Executable CLI Adapter (`src/cli/factory.mjs`)
 * Governed by: ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005
 *
 * Commands:
 *   node src/cli/factory.mjs size "<task description>" [--files f1,f2] [--size S|M|L] [--json]
 *   node src/cli/factory.mjs verify [--files f1,f2]
 *   node src/cli/factory.mjs pr-report [--title "..."] [--jira PROJ-123] [--adrs ADR-0001] [--files f1,f2]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { classifyTaskSize } from '../modules/sizing/index.mjs';
import { verifyGovernance } from '../modules/governance/index.mjs';
import { generateVisualPrBody } from '../modules/review/index.mjs';

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

  console.log(
    '✅ [Factory Gate Passed] Deep Module boundaries, CONTEXT.md <-> docs/adr/ parity, and ADR documentation gates verified.'
  );
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
  default:
    console.log(
      'Usage: node src/cli/factory.mjs <size|verify|pr-report> [options]'
    );
    process.exit(subcommand ? 1 : 0);
}
