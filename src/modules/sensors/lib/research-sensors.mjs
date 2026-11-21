/**
 * Private Submodule: Research Integrity, Code Quality & LaTeX Sensors
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0010 (ENH-0007, ENH-0008, ENH-0010, ENH-0012..0015, ENH-0017, ENH-0019)
 */

/**
 * Verifies read-path purity and metric counter integrity in domain modules (ADR-0010, ENH-0008).
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
      filePath.includes('.test.') ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/')
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
 * dictionaries or hardcoded verdict strings (ADR-0010, ENH-0015).
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
 * Flags long-lived `subprocess.Popen(..., stdout=subprocess.PIPE | stderr=subprocess.PIPE)` calls
 * without `.communicate()` or a drain thread, preventing OS 64 KB pipe-buffer deadlocks (ADR-0010, ENH-0017).
 * @param {Record<string, string>} filesMap
 */
export function checkUnboundedSubprocessPipe(filesMap = {}) {
  const violations = [];
  const PY_FILE_REGEX = /\.py$/i;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (typeof content !== 'string') continue;
    if (
      !PY_FILE_REGEX.test(filePath) ||
      filePath.startsWith('tests/') ||
      filePath.includes('.test.') ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/')
    ) {
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
 * Excludes vendored `.agents/` and `.github/` skill templates.
 * @param {Record<string, string>} filesMap
 */
export function checkLatexTemplateHygiene(filesMap = {}) {
  const violations = [];
  const PLACEHOLDER_REGEX = /(?:\(\s*\$?[XYZ]\$?\s*\)|\bTBD\b|\bXX\s*\\?%|\[INSERT\b)/;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (
      typeof content !== 'string' ||
      !filePath.endsWith('.tex') ||
      filePath.startsWith('.agents/') ||
      filePath.startsWith('.github/')
    ) {
      continue;
    }
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
