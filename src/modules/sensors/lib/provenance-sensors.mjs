/**
 * Private Submodule: Raw-Record Empirical Provenance Sensor
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0010 (ENH-0014, ENH-0018)
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively finds summary JSON files under `results/` (excluding `raw/` and `review/`).
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
 * Verifies raw-record provenance for any results summary JSON in a repository (ADR-0010, ENH-0014, ENH-0018).
 * If a repository has a results summary JSON (`results/<dir>/summary*.json` or `results/<dir>/*_results.json`),
 * requires:
 *   1. A sibling `raw/` (or paired `raw_<suffix>/`) directory containing at least one non-empty `*.jsonl` log file.
 *   2. A recompute script (`bench/recompute.py`, `scripts/recompute.py`, `recompute.py`, or sibling `recompute.*`).
 *   3. Valid mtime ordering (`summary.mtimeMs >= maxRawMtimeMs`, ENH-0018) so stale summaries older than raw logs fail.
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
