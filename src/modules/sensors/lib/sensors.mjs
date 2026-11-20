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
 * Verifies empirical benchmark purity in benchmark scripts (ADR-0010, ENH-0010, ENH-0014).
 * Scans `run_*benchmark*.py` / `*benchmark*.{py,mjs,js,ts}` for:
 *   1. Hardcoded multi-element float literal arrays assigned to empirical metric keys
 *      (`recall_at_10`, `p99_latency_ms`, `p50_latency_ms`, `qps`, `dist_comps`, `curves =`).
 *   2. Conservative heuristic detection of formula-derived metric values computed directly
 *      from loop/sweep variables via arithmetic constants (e.g., `0.0115 * tokens + 2.4`),
 *      or benchmark functions returning metric dicts without any timing or search/query call.
 *
 * Known Limitations (ENH-0014):
 *   Static regex and single-function heuristics only inspect surface syntax within benchmark
 *   files. They cannot perform inter-procedural data-flow analysis across imported helpers
 *   or prove that a timer wraps a real engine rather than an in-memory stub. Therefore,
 *   `checkRawRecordProvenance` (requiring raw per-query `.jsonl` logs and a deterministic
 *   recompute script) is the primary provenance safeguard.
 *
 * @param {Record<string, string>} filesMap
 */
export function checkBenchmarkEmpiricalPurity(filesMap = {}) {
  const violations = [];
  const BENCHMARK_FILE_REGEX = /(?:^|\/)(?:run_.*benchmark|.*benchmark.*)\.(?:py|mjs|js|ts)$/i;
  const HARDCODED_METRIC_ARRAY_REGEX =
    /(?:["']?(?:recall_at_10|p99_latency_ms|p50_latency_ms|qps|dist_comps)["']?\s*[:=]\s*\[\s*\d+\.\d+\s*,\s*\d+\.\d+|\bcurves\s*=\s*\{\s*["'][A-Za-z0-9_-]+["']\s*:\s*\{)/;
  const FORMULA_DERIVED_METRIC_REGEX =
    /(?:["']?(?:[a-z0-9_]*latency[a-z0-9_]*|p50[a-z0-9_]*|p99[a-z0-9_]*|recall[a-z0-9_]*|qps[a-z0-9_]*|ram_gb|memory_mb|speedup)["']?\s*[:=]\s*(?:round\s*\(\s*)?(?:\d+\.\d+\s*\*\s*[a-zA-Z_]\w*|[a-zA-Z_]\w*\s*\*\s*\d+\.\d+)(?:\s*[+\-]\s*\d+(?:\.\d+)?)?)/i;
  const METRIC_OUTPUT_KEY_REGEX = /["'](?:recall_at_10|p99_latency_ms|p50_latency_ms|latency_ms|qps)["']\s*:/;
  const TIMING_OR_EXEC_CALL_REGEX =
    /\b(?:perf_counter|time\.time|monotonic|timeit|performance\.now|hrtime|Date\.now|search|query|prune|resolve|scan|evaluate|run_query|execute)\b/;

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
      } else if (FORMULA_DERIVED_METRIC_REGEX.test(trimmed)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'no-formula-derived-benchmark-metrics',
            snippet: trimmed,
            message: `[Sensor: benchmark-empirical-purity] '${filePath}:${idx + 1}' computes an empirical metric from an arithmetic formula over loop/sweep variables (ADR-0010, ENH-0014).`,
          })
        );
      }
    });

    // Conservative function-level heuristic: check benchmark functions that emit metric keys without timing or search calls
    const fnStarts = [];
    lines.forEach((lineText, idx) => {
      if (/^\s*(?:def\s+\w+\s*\(|(?:async\s+)?function\s+\w+\s*\()/.test(lineText)) {
        fnStarts.push(idx);
      }
    });
    for (let i = 0; i < fnStarts.length; i++) {
      const startIdx = fnStarts[i];
      const endIdx = i + 1 < fnStarts.length ? fnStarts[i + 1] : lines.length;
      const fnBody = lines.slice(startIdx, endIdx).join('\n');
      if (
        METRIC_OUTPUT_KEY_REGEX.test(fnBody) &&
        !TIMING_OR_EXEC_CALL_REGEX.test(fnBody) &&
        !violations.some((v) => v.file === filePath && v.line >= startIdx + 1 && v.line <= endIdx)
      ) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: startIdx + 1,
            rule: 'no-formula-derived-benchmark-metrics',
            snippet: lines[startIdx].trim(),
            message: `[Sensor: benchmark-empirical-purity] '${filePath}:${startIdx + 1}' emits benchmark metric keys without any timing or search/query invocation in the function body (ADR-0010, ENH-0014).`,
          })
        );
      }
    }
  }

  return Object.freeze(violations);
}

/**
 * Flags hardcoded numeric metric literals inside report-template strings of `*audit*` / `*review*` scripts (ADR-0010, ENH-0013).
 * Audit and report generators must interpolate every metric from results JSON at run time.
 *
 * Known Limitations (ENH-0013):
 *   Uses a line-level regex heuristic to detect uninterpolated numeric measurements (`98.4%`, `14.2 ms`,
 *   `623x`, `97.72/100`) inside quoted strings or template lines of audit/review scripts. It cannot detect
 *   values loaded from a secondary hardcoded constant dictionary in another module.
 *
 * @param {Record<string, string>} filesMap
 */
export function checkDynamicReportInterpolation(filesMap = {}) {
  const violations = [];
  const AUDIT_OR_REVIEW_SCRIPT_REGEX =
    /(?:^|\/).*(?:audit|review|scholarpeer|paperviz).*\.(?:py|mjs|cjs|js|ts)$/i;
  const LITERAL_METRIC_IN_TEMPLATE_REGEX =
    /(?:["'`].*(?<!\{|\$\{)\b\d+\.\d+\s*(?:%|ms\b|x\b|GB\b|MB\b|\/\s*(?:10|100)\b).*["'`]|^\s*[-*|].*(?<!\{|\$\{)\b\d+\.\d+\s*(?:%|ms\b|x\b|\/\s*(?:10|100)\b))/;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (
      !AUDIT_OR_REVIEW_SCRIPT_REGEX.test(filePath) ||
      filePath.startsWith('tests/') ||
      filePath.includes('.test.') ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/') ||
      filePath.startsWith('src/modules/review/') ||
      filePath.startsWith('src/modules/sensors/')
    ) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        return;
      }
      // Remove legitimate runtime interpolation expressions `{...}` and `${...}` before checking for literal metrics
      const strippedInterpolations = trimmed
        .replace(/\$\{[^}]+\}/g, 'INTERPOLATED')
        .replace(/\{[^}]+\}/g, 'INTERPOLATED');
      if (LITERAL_METRIC_IN_TEMPLATE_REGEX.test(strippedInterpolations)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'no-literal-metrics-in-report-template',
            snippet: trimmed,
            message: `[Sensor: dynamic-report-interpolation] '${filePath}:${idx + 1}' embeds hardcoded numeric metric literals in an audit/review template instead of interpolating from results JSON at run time (ADR-0010, ENH-0013).`,
          })
        );
      }
    });
  }

  return Object.freeze(violations);
}

/**
 * Fails if any `*audit*` / `*review*` / `*scholarpeer*` / `*paperviz*` script contains literal score
 * dictionaries (e.g., `"faithfulness": 99.0`) or hardcoded verdict strings (`"STRONG ACCEPT"`, `"Score: 9.0"`) (ADR-0010, ENH-0015).
 *
 * @param {Record<string, string>} filesMap
 */
export function checkNoScriptedVerdicts(filesMap = {}) {
  const violations = [];
  const AUDIT_SCRIPT_REGEX =
    /(?:^|\/).*(?:audit|review|scholarpeer|paperviz).*\.(?:py|mjs|cjs|js|ts)$/i;
  const LITERAL_SCORE_DICT_REGEX =
    /["'](?:faithfulness|conciseness|readability|aesthetics|overall_score|visual_score|peer_score|reviewer_score)["']\s*:\s*\d+(?:\.\d+)?\b/i;
  const SCRIPTED_VERDICT_STRING_REGEX =
    /(?:\b(?:STRONG\s+ACCEPT|WEAK\s+ACCEPT|UNCONDITIONAL\s+PASS)\b|\b(?:Overall\s+)?Score:\s*\d+(?:\.\d+)?\s*(?:\/\s*(?:10|100))?)/i;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (
      !AUDIT_SCRIPT_REGEX.test(filePath) ||
      filePath.startsWith('tests/') ||
      filePath.includes('.test.') ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/') ||
      filePath.startsWith('src/modules/review/') ||
      filePath.startsWith('src/modules/sensors/')
    ) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        return;
      }
      if (LITERAL_SCORE_DICT_REGEX.test(trimmed) || SCRIPTED_VERDICT_STRING_REGEX.test(trimmed)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'no-scripted-audit-verdict',
            snippet: trimmed,
            message: `[Sensor: no-scripted-verdicts] '${filePath}:${idx + 1}' contains a hardcoded score dictionary or scripted verdict string (ADR-0010, ENH-0015).`,
          })
        );
      }
    });
  }

  return Object.freeze(violations);
}

/**
 * Recursively finds summary JSON files under `results/` (excluding `raw/`).
 * @param {string} resultsDir
 * @returns {string[]}
 */
function findResultsSummaryJsonFiles(resultsDir) {
  if (!fs.existsSync(resultsDir)) return [];
  const found = [];
  const stack = [resultsDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'raw' && entry.name !== 'review') {
          stack.push(fullPath);
        }
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        /(?:summary|_results|benchmark)/i.test(entry.name) &&
        !/(?:audit|review|paperviz|scholarpeer|receipt)/i.test(entry.name)
      ) {
        found.push(fullPath);
      }
    }
  }
  return found.sort();
}

/**
 * Verifies raw-record provenance for any results summary JSON in a repository (ADR-0010, ENH-0014).
 * If a repository has a results summary JSON (`results/<dir>/summary*.json` or `results/<dir>/*_results.json`),
 * requires:
 *   1. A sibling `raw/` directory containing at least one non-empty `*.jsonl` raw record file.
 *   2. A recompute script (`bench/recompute.py`, `scripts/recompute.py`, `recompute.py`, or sibling `recompute.*`).
 *   3. The summary JSON's mtime must not be newer than every raw `*.jsonl` file (which happens when a
 *      summary JSON is hand-edited or fabricated post-hoc without raw record provenance).
 *
 * @param {{ cwd?: string }} [options]
 */
export function checkRawRecordProvenance(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const resultsDir = path.join(cwd, 'results');
  const summaryFiles = findResultsSummaryJsonFiles(resultsDir);
  if (summaryFiles.length === 0) {
    return Object.freeze([]);
  }

  const violations = [];
  const candidateRecomputePaths = [
    path.join(cwd, 'bench', 'recompute.py'),
    path.join(cwd, 'bench', 'recompute.mjs'),
    path.join(cwd, 'scripts', 'recompute.py'),
    path.join(cwd, 'scripts', 'recompute.mjs'),
    path.join(cwd, 'recompute.py'),
    path.join(cwd, 'recompute.mjs'),
  ];

  for (const summaryAbsPath of summaryFiles) {
    const relSummary = path.relative(cwd, summaryAbsPath);
    const summaryDir = path.dirname(summaryAbsPath);
    const baseName = path.basename(summaryAbsPath, '.json');
    const suffixMatch = baseName.match(/^summary_(.+)$/);
    const pairedRawDir = suffixMatch ? path.join(summaryDir, `raw_${suffixMatch[1]}`) : null;
    const rawDir = pairedRawDir && fs.existsSync(pairedRawDir) ? pairedRawDir : path.join(summaryDir, 'raw');
    const siblingRecomputePy = path.join(summaryDir, 'recompute.py');
    const siblingRecomputeMjs = path.join(summaryDir, 'recompute.mjs');

    const hasRecomputeScript =
      candidateRecomputePaths.some((p) => fs.existsSync(p)) ||
      fs.existsSync(siblingRecomputePy) ||
      fs.existsSync(siblingRecomputeMjs);

    if (!hasRecomputeScript) {
      violations.push(
        Object.freeze({
          file: relSummary,
          rule: 'missing-recompute-script',
          message: `[Sensor: raw-record-provenance] Summary '${relSummary}' has no recompute script (expected bench/recompute.py or sibling recompute.py) to verify summary metrics from raw JSONL logs (ADR-0010, ENH-0014).`,
        })
      );
    }

    const rawJsonlFiles =
      fs.existsSync(rawDir) && fs.statSync(rawDir).isDirectory()
        ? fs
            .readdirSync(rawDir)
            .filter((f) => f.endsWith('.jsonl'))
            .map((f) => path.join(rawDir, f))
            .filter((full) => fs.statSync(full).isFile() && fs.statSync(full).size > 0)
        : [];

    if (rawJsonlFiles.length === 0) {
      violations.push(
        Object.freeze({
          file: relSummary,
          rule: 'missing-raw-jsonl-records',
          message: `[Sensor: raw-record-provenance] Summary '${relSummary}' is missing a sibling 'raw/*.jsonl' directory of per-query raw execution logs (ADR-0010, ENH-0014).`,
        })
      );
      continue;
    }

    const summaryMtimeMs = fs.statSync(summaryAbsPath).mtimeMs;
    const maxRawMtimeMs = Math.max(...rawJsonlFiles.map((f) => fs.statSync(f).mtimeMs));

    // ENH-0018: A derived summary.json is legitimately written *after* raw/*.jsonl completes.
    // Flag when summary.json is OLDER than raw/*.jsonl (stale summary not yet recomputed).
    if (summaryMtimeMs < maxRawMtimeMs) {
      violations.push(
        Object.freeze({
          file: relSummary,
          rule: 'summary-stale-relative-to-raw-records',
          summaryMtimeMs,
          maxRawMtimeMs,
          message: `[Sensor: raw-record-provenance] Summary '${relSummary}' is older than raw/*.jsonl records; re-run the recompute script so summary.json matches the latest raw logs (ADR-0010, ENH-0014, ENH-0018).`,
        })
      );
    }
  }

  return Object.freeze(violations);
}

/**
 * Flags long-lived `subprocess.Popen(..., stdout=subprocess.PIPE | stderr=subprocess.PIPE)` calls
 * without `.communicate()` or a drain thread, preventing OS 64 KB pipe-buffer deadlocks (ADR-0010, ENH-0017).
 * @param {Record<string, string>} filesMap
 */
export function checkUnboundedSubprocessPipe(filesMap = {}) {
  const violations = [];
  const PY_FILE_REGEX = /\.py$/i;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (!PY_FILE_REGEX.test(filePath) || filePath.startsWith('tests/') || filePath.includes('.test.')) {
      continue;
    }
    if (!/subprocess\.Popen\s*\(/.test(content)) continue;
    if (/\.communicate\s*\(/.test(content)) continue;

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!/subprocess\.Popen\s*\(/.test(lines[i])) continue;
      const callBlock = lines.slice(i, Math.min(lines.length, i + 25)).join('\n');
      if (/\b(?:stdout|stderr)\s*=\s*subprocess\.PIPE\b/.test(callBlock)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: i + 1,
            rule: 'unbounded-subprocess-pipe',
            snippet: lines[i].trim(),
            message: `[Sensor: unbounded-subprocess-pipe] '${filePath}:${i + 1}' uses subprocess.Popen with PIPE without .communicate(); redirect daemon stdout/stderr to a file or subprocess.DEVNULL to avoid 64 KB OS pipe deadlocks (ADR-0010, ENH-0017).`,
          })
        );
      }
    }
  }

  return Object.freeze(violations);
}

/**
 * Flags leftover writing-template placeholders (`(X)`, `(Y)`, `(Z)`, `TBD`, `XX%`, `[INSERT`) in LaTeX manuscripts (ADR-0010, ENH-0019).
 * @param {Record<string, string>} filesMap
 */
export function checkLatexTemplateHygiene(filesMap = {}) {
  const violations = [];
  const PLACEHOLDER_REGEX = /(?:\(\s*\$?[XYZ]\$?\s*\)|\bTBD\b|\bXX\s*\\?%|\[INSERT\b)/;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string' || !filePath.endsWith('.tex')) continue;
    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const stripped = lineText.replace(/(^|[^\\])%.*$/, '$1').trim();
      if (!stripped) return;
      if (PLACEHOLDER_REGEX.test(stripped)) {
        violations.push(
          Object.freeze({
            file: filePath,
            line: idx + 1,
            rule: 'latex-template-placeholder',
            snippet: stripped.slice(0, 120),
            message: `[Sensor: latex-template-hygiene] '${filePath}:${idx + 1}' contains a leftover writing-template placeholder ((X)/(Y)/(Z), TBD, or XX%) (ADR-0010, ENH-0019).`,
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
 *   codeFiles?: string[],
 *   cwd?: string
 * }} input
 */
export function runSensors(input = {}) {
  const fileContents = input.fileContents || {};
  const requiredSections = checkRequiredSections(fileContents);
  const claimSources = checkClaimSources(fileContents);
  const readPathPurity = checkReadPathPurity(fileContents);
  const benchmarkEmpiricalPurity = checkBenchmarkEmpiricalPurity(fileContents);
  const fileSizeCeiling = checkFileSizeCeiling(fileContents);
  const dynamicReportInterpolation = checkDynamicReportInterpolation(fileContents);
  const noScriptedVerdicts = checkNoScriptedVerdicts(fileContents);
  const unboundedSubprocessPipe = checkUnboundedSubprocessPipe(fileContents);
  const latexTemplateHygiene = checkLatexTemplateHygiene(fileContents);
  const rawRecordProvenance = input.cwd ? checkRawRecordProvenance({ cwd: input.cwd }) : Object.freeze([]);
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
    fileSizeCeiling.length === 0 &&
    dynamicReportInterpolation.length === 0 &&
    noScriptedVerdicts.length === 0 &&
    unboundedSubprocessPipe.length === 0 &&
    latexTemplateHygiene.length === 0 &&
    rawRecordProvenance.length === 0;

  return Object.freeze({
    passed,
    findings: Object.freeze({
      requiredSections,
      claimSources,
      readPathPurity,
      benchmarkEmpiricalPurity,
      fileSizeCeiling,
      dynamicReportInterpolation,
      noScriptedVerdicts,
      unboundedSubprocessPipe,
      latexTemplateHygiene,
      rawRecordProvenance,
      traceability
    })
  });
}
