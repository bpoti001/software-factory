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
    // Only scan project markdown/planning documents, never code, test, or agent skill prompt files
    if (
      !filePath.endsWith('.md') ||
      filePath.startsWith('tests/') ||
      filePath.includes('.test.') ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/')
    ) {
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
 * Verifies read-path purity and metric counter integrity in domain modules (ADR-0010, ENH-0008).
 * Flags global RNG seed mutations (`random.seed`, `np.random.seed`) inside `src/modules/`
 * and synthetic metric counter offsets (`distance_computations += int(...)`).
 * @param {Record<string, string>} filesMap
 */
export function checkReadPathPurity(filesMap = {}) {
  const violations = [];
  const GLOBAL_RNG_MUTATION_REGEX = /\b(?:np\.random\.seed|random\.seed)\s*\(/;
  const SYNTHETIC_COUNTER_OFFSET_REGEX = /\b(?:distance_computations|dist_comps|latency_ms)\s*\+=\s*int\s*\(/;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (
      !filePath.startsWith('src/modules/') ||
      filePath.startsWith('tests/') ||
      filePath.includes('.test.')
    ) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        return;
      }
      if (GLOBAL_RNG_MUTATION_REGEX.test(trimmed)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'no-global-rng-seed-in-module',
            snippet: trimmed,
            message: `[Sensor: read-path-purity] '${filePath}:${idx + 1}' mutates global RNG state inside a module. Use an isolated local PRNG or deterministic hash (ADR-0010, ENH-0008).`,
          })
        );
      }
      if (SYNTHETIC_COUNTER_OFFSET_REGEX.test(trimmed)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'no-synthetic-metric-offset',
            snippet: trimmed,
            message: `[Sensor: read-path-purity] '${filePath}:${idx + 1}' applies a synthetic offset to an empirical metric counter (ADR-0010, ENH-0008).`,
          })
        );
      }
    });
  }

  return Object.freeze(violations);
}

/**
 * Verifies 1:1 citation bijection between `\cite{...}` keys and `\bibitem{...}` / BibTeX entries (ADR-0010, ENH-0007).
 * @param {{ texContent?: string, bibContent?: string }} [input]
 */
export function checkLatexCitationBijection(input = {}) {
  const texContent = String(input.texContent || '');
  const bibContent = String(input.bibContent || '');

  const citedSet = new Set();
  const citeRegex = /\\cite[a-zA-Z*]*\{([^}]+)\}/g;
  let match;
  while ((match = citeRegex.exec(texContent)) !== null) {
    const keys = match[1]
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    for (const k of keys) {
      citedSet.add(k);
    }
  }

  const definedSet = new Set();
  const bibitemRegex = /\\bibitem(?:\[[^\]]*\])?\{([^}]+)\}/g;
  while ((match = bibitemRegex.exec(texContent)) !== null) {
    definedSet.add(match[1].trim());
  }

  const bibEntryRegex = /@[a-zA-Z]+\s*\{\s*([^,\s]+)\s*,/g;
  while ((match = bibEntryRegex.exec(bibContent)) !== null) {
    definedSet.add(match[1].trim());
  }

  const citedKeys = Array.from(citedSet).sort();
  const definedKeys = Array.from(definedSet).sort();
  const missingInBib = citedKeys.filter((k) => !definedSet.has(k));
  const uncitedInBib = definedKeys.filter((k) => !citedSet.has(k));

  return Object.freeze({
    passed: missingInBib.length === 0 && uncitedInBib.length === 0,
    citedKeys: Object.freeze(citedKeys),
    definedKeys: Object.freeze(definedKeys),
    missingInBib: Object.freeze(missingInBib),
    uncitedInBib: Object.freeze(uncitedInBib),
  });
}

/**
 * Verifies empirical benchmark purity in benchmark scripts (ADR-0010, ENH-0010).
 * Scans `run_*benchmark*.py` / `*benchmark*.{py,mjs,js,ts}` for hardcoded multi-element
 * float literal arrays assigned to empirical metric keys (`recall_at_10`, `p99_latency_ms`,
 * `p50_latency_ms`, `qps`, `dist_comps`, `curves =`).
 * @param {Record<string, string>} filesMap
 */
export function checkBenchmarkEmpiricalPurity(filesMap = {}) {
  const violations = [];
  const BENCHMARK_FILE_REGEX = /(?:^|\/)(?:run_.*benchmark|.*benchmark.*)\.(?:py|mjs|js|ts)$/i;
  const HARDCODED_METRIC_ARRAY_REGEX =
    /(?:["']?(?:recall_at_10|p99_latency_ms|p50_latency_ms|qps|dist_comps)["']?\s*[:=]\s*\[\s*\d+\.\d+\s*,\s*\d+\.\d+|\bcurves\s*=\s*\{\s*["'][A-Za-z0-9_-]+["']\s*:\s*\{)/;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (
      !BENCHMARK_FILE_REGEX.test(filePath) ||
      filePath.startsWith('tests/') ||
      filePath.includes('.test.')
    ) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        return;
      }
      if (HARDCODED_METRIC_ARRAY_REGEX.test(trimmed)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'no-hardcoded-benchmark-metrics',
            snippet: trimmed,
            message: `[Sensor: benchmark-empirical-purity] '${filePath}:${idx + 1}' contains hardcoded empirical metric literals instead of live benchmark execution (ADR-0010, ENH-0010).`,
          })
        );
      }
    });
  }

  return Object.freeze(violations);
}

/**
 * Enforces the Thermo-Nuclear Code Quality 1,000-line ceiling on source & benchmark files (ADR-0010, ENH-0012).
 * @param {Record<string, string>} filesMap
 * @param {number} [maxLines=1000]
 */
export function checkFileSizeCeiling(filesMap = {}, maxLines = 1000) {
  const violations = [];
  const CODE_FILE_REGEX = /\.(?:py|mjs|cjs|js|ts|tsx)$/i;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (
      !CODE_FILE_REGEX.test(filePath) ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/')
    ) {
      continue;
    }

    const lineCount = content.split(/\r?\n/).length;
    if (lineCount > maxLines) {
      violations.push(
        Object.freeze({
          file: filePath,
          lineCount,
          maxLines,
          rule: 'thermo-nuclear-file-size-ceiling',
          message: `[Sensor: file-size-ceiling] '${filePath}' has ${lineCount} lines, exceeding the ${maxLines}-line Thermo-Nuclear ceiling (ADR-0010, ENH-0012).`,
        })
      );
    }
  }

  return Object.freeze(violations);
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
  const readPathPurity = checkReadPathPurity(fileContents);
  const benchmarkEmpiricalPurity = checkBenchmarkEmpiricalPurity(fileContents);
  const fileSizeCeiling = checkFileSizeCeiling(fileContents);
  const traceability = checkTraceability({
    contextMarkdown: input.contextMarkdown,
    codeFiles: input.codeFiles,
    fileContents
  });

  const passed =
    requiredSections.length === 0 &&
    claimSources.length === 0 &&
    readPathPurity.length === 0 &&
    benchmarkEmpiricalPurity.length === 0 &&
    fileSizeCeiling.length === 0;

  return Object.freeze({
    passed,
    findings: Object.freeze({
      requiredSections,
      claimSources,
      readPathPurity,
      benchmarkEmpiricalPurity,
      fileSizeCeiling,
      traceability
    })
  });
}
