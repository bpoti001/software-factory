/**
 * Private Implementation: Deterministic Governance & Artifact Sensors
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis Architecture)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseAdrRegistry } from '../../governance/index.mjs';

const REQUIRED_ADR_SECTIONS = [
  { name: 'Context & Problem Statement', regex: /##\s*1?\.\s*(Context|Problem)/i },
  { name: 'Decision', regex: /##\s*2?\.\s*Decision/i },
  { name: 'Alternatives Considered', regex: /##\s*3?\.\s*Alternatives/i },
  { name: 'Consequences', regex: /##\s*4?\.\s*Consequences/i },
];

const PLACEHOLDER_REGEX = /\b(TODO|TBD|FIXME|PLACEHOLDER|\[citation\s+needed\])\b/g;

/**
 * Validates that all ADR markdown files contain mandatory headings.
 * @param {Record<string, string>} adrFilesMap
 */
export function checkRequiredSections(adrFilesMap = {}) {
  const violations = [];

  for (const [filePath, content] of Object.entries(adrFilesMap)) {
    if (!filePath.endsWith('.md') || !filePath.includes('docs/adr/')) {
      continue;
    }
    // Skip template.md or index README.md
    if (filePath.endsWith('template.md') || filePath.endsWith('README.md')) {
      continue;
    }

    for (const section of REQUIRED_ADR_SECTIONS) {
      if (!section.regex.test(content)) {
        violations.push(
          Object.freeze({
            file: filePath,
            section: section.name,
            message: `[Sensor: required-sections] ADR '${filePath}' is missing mandatory section '## ${section.name}' (ADR-0000, ADR-0007).`
          })
        );
      }
    }
  }

  return Object.freeze(violations);
}

/**
 * Scans markdown and planning files for ungrounded assertions and placeholders.
 * @param {Record<string, string>} filesMap
 */
export function checkClaimSources(filesMap = {}) {
  const findings = [];

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    // Skip test files from claim-sources placeholder scans
    if (filePath.startsWith('tests/') || filePath.includes('.test.')) {
      continue;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      // Strip inline code blocks (`...`) so referencing literal keywords in specs doesn't trigger false positives
      const sanitizedLine = lineText.replace(/`[^`]+`/g, '');
      let match;
      while ((match = PLACEHOLDER_REGEX.exec(sanitizedLine)) !== null) {
        findings.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            placeholder: match[1],
            snippet: lineText.trim(),
            message: `[Sensor: claim-sources] '${filePath}:${idx + 1}' contains ungrounded placeholder '${match[1]}'. Resolve before human review (ADR-0007).`
          })
        );
      }
    });
  }

  return Object.freeze(findings);
}

/**
 * Verifies that accepted ADRs in CONTEXT.md are referenced in tests, planning, or code.
 * @param {{ contextMarkdown?: string, codeFiles?: string[], fileContents?: Record<string, string> }} input
 */
export function checkTraceability(input = {}) {
  const contextMarkdown = input.contextMarkdown || '';
  const registry = parseAdrRegistry(contextMarkdown);
  const acceptedAdrs = registry.filter((e) => e.status === 'accepted').map((e) => e.adrId);

  const coveredSet = new Set();
  const fileContents = input.fileContents || {};

  for (const [filePath, content] of Object.entries(fileContents)) {
    for (const adrId of acceptedAdrs) {
      if (content.includes(adrId)) {
        coveredSet.add(adrId);
      }
    }
  }

  const coveredAdrs = acceptedAdrs.filter((id) => coveredSet.has(id));
  const orphanedAdrs = acceptedAdrs.filter((id) => !coveredSet.has(id));

  return Object.freeze({
    acceptedAdrs: Object.freeze(acceptedAdrs),
    coveredAdrs: Object.freeze(coveredAdrs),
    orphanedAdrs: Object.freeze(orphanedAdrs),
    isFullyTraceable: orphanedAdrs.length === 0
  });
}

/**
 * Emits a signed, tool-owned verification receipt.
 * @param {{ cwd?: string, treeHash?: string, testExitCode?: number, command?: string }} options
 */
export function emitVerificationReceipt(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const receiptDir = path.join(cwd, '.planning');
  const receiptPath = path.join(receiptDir, 'VERIFICATION_RECEIPT.json');

  if (!fs.existsSync(receiptDir)) {
    fs.mkdirSync(receiptDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const treeHash = options.treeHash || 'uncommitted';
  const testExitCode = options.testExitCode ?? 0;
  const command = options.command || 'npm test && factory verify';

  const payload = {
    receiptType: 'CHECKPOINT_VERIFICATION_RECORDED',
    timestamp,
    treeHash,
    testExitCode,
    command,
    governingAdrs: ['ADR-0001', 'ADR-0006', 'ADR-0007']
  };

  const rawJson = JSON.stringify(payload, null, 2);
  const signature = crypto.createHash('sha256').update(rawJson).digest('hex');
  const signedReceipt = { ...payload, signature };

  fs.writeFileSync(receiptPath, JSON.stringify(signedReceipt, null, 2), 'utf8');

  return Object.freeze(signedReceipt);
}

/**
 * Validates a tool-owned verification receipt.
 * @param {{ cwd?: string, expectedTreeHash?: string }} [options]
 */
export function checkVerificationReceipt(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const receiptPath = path.join(cwd, '.planning', 'VERIFICATION_RECEIPT.json');

  if (!fs.existsSync(receiptPath)) {
    return Object.freeze({
      valid: false,
      receipt: null,
      error: 'Missing .planning/VERIFICATION_RECEIPT.json. Run factory verify first.'
    });
  }

  try {
    const raw = fs.readFileSync(receiptPath, 'utf8');
    const parsed = JSON.parse(raw);
    const { signature, ...rest } = parsed;
    const recomputed = crypto.createHash('sha256').update(JSON.stringify(rest, null, 2)).digest('hex');

    if (signature !== recomputed) {
      return Object.freeze({
        valid: false,
        receipt: null,
        error: 'Verification receipt signature mismatch (tampered file).'
      });
    }

    if (options.expectedTreeHash && parsed.treeHash !== options.expectedTreeHash) {
      return Object.freeze({
        valid: false,
        receipt: parsed,
        error: `Verification receipt bound to tree ${parsed.treeHash}, expected ${options.expectedTreeHash}.`
      });
    }

    return Object.freeze({
      valid: true,
      receipt: parsed,
      error: null
    });
  } catch (err) {
    return Object.freeze({
      valid: false,
      receipt: null,
      error: `Failed to read verification receipt: ${err.message}`
    });
  }
}

/**
 * Runs all deterministic artifact sensors across changed files and docs.
 * @param {{
 *   fileContents?: Record<string, string>,
 *   contextMarkdown?: string,
 *   codeFiles?: string[]
 * }} input
 */
export function runSensors(input = {}) {
  const fileContents = input.fileContents || {};
  const requiredSections = checkRequiredSections(fileContents);
  const claimSources = checkClaimSources(fileContents);
  const traceability = checkTraceability({
    contextMarkdown: input.contextMarkdown,
    codeFiles: input.codeFiles,
    fileContents
  });

  const passed = requiredSections.length === 0 && claimSources.length === 0;

  return Object.freeze({
    passed,
    findings: Object.freeze({
      requiredSections,
      claimSources,
      traceability
    })
  });
}
