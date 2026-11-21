/**
 * Private Orchestrator: Deterministic Governance & Research Integrity Sensors (`src/modules/sensors/lib/sensors.mjs`)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC), ADR-0010 (Research Provenance Sensors)
 */

import {
  checkRequiredSections,
  checkClaimSources,
  checkTraceability,
  emitVerificationReceipt,
  checkVerificationReceipt,
} from './doc-sensors.mjs';
import { checkRawRecordProvenance } from './provenance-sensors.mjs';
import {
  checkReadPathPurity,
  checkLatexCitationBijection,
  checkBenchmarkEmpiricalPurity,
  checkDynamicReportInterpolation,
  checkNoScriptedVerdicts,
  checkUnboundedSubprocessPipe,
  checkLatexTemplateHygiene,
  checkFileSizeCeiling,
} from './research-sensors.mjs';

export {
  checkRequiredSections,
  checkClaimSources,
  checkTraceability,
  emitVerificationReceipt,
  checkVerificationReceipt,
  checkRawRecordProvenance,
  checkReadPathPurity,
  checkLatexCitationBijection,
  checkBenchmarkEmpiricalPurity,
  checkDynamicReportInterpolation,
  checkNoScriptedVerdicts,
  checkUnboundedSubprocessPipe,
  checkLatexTemplateHygiene,
  checkFileSizeCeiling,
};

/**
 * Evaluates citation bijection across all project `.tex` and `.bib` files in `fileContents`
 * (excluding vendored `.agents/` and `.github/` templates).
 * @param {Record<string, string>} fileContents
 */
function runLatexCitationBijectionAcrossFiles(fileContents) {
  const violations = [];
  const projectTexEntries = Object.entries(fileContents).filter(
    ([p, c]) =>
      typeof c === 'string' &&
      p.endsWith('.tex') &&
      !p.startsWith('.agents/') &&
      !p.startsWith('.github/') &&
      !p.startsWith('tests/') &&
      !p.includes('.test.')
  );
  if (projectTexEntries.length === 0) {
    return Object.freeze(violations);
  }

  const combinedBib = Object.entries(fileContents)
    .filter(
      ([p, c]) =>
        typeof c === 'string' &&
        p.endsWith('.bib') &&
        !p.startsWith('.agents/') &&
        !p.startsWith('.github/')
    )
    .map(([, c]) => c)
    .join('\n');

  for (const [texPath, texContent] of projectTexEntries) {
    if (!/\\cite[a-zA-Z*]*\{/.test(texContent) && !/\\bibitem/.test(texContent)) {
      continue;
    }
    const report = checkLatexCitationBijection({ texContent, bibContent: combinedBib });
    if (!report.passed) {
      const parts = [];
      if (report.missingInBib.length > 0) {
        parts.push(`missing in bib: ${report.missingInBib.join(', ')}`);
      }
      if (report.uncitedInBib.length > 0) {
        parts.push(`uncited in bib: ${report.uncitedInBib.join(', ')}`);
      }
      violations.push(
        Object.freeze({
          file: texPath,
          rule: 'latex-citation-bijection',
          missingInBib: report.missingInBib,
          uncitedInBib: report.uncitedInBib,
          message: `[Sensor: latex-citation-bijection] '${texPath}' failed 1:1 citation bijection (${parts.join('; ')}) (ADR-0010, ENH-0007).`,
        })
      );
    }
  }

  return Object.freeze(violations);
}

/**
 * Runs all deterministic governance and research integrity sensors across changed files and docs.
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
  const latexCitationBijection = runLatexCitationBijectionAcrossFiles(fileContents);
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
    fileContents,
  });

  const passed =
    requiredSections.length === 0 &&
    claimSources.length === 0 &&
    readPathPurity.length === 0 &&
    latexCitationBijection.length === 0 &&
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
      latexCitationBijection,
      benchmarkEmpiricalPurity,
      fileSizeCeiling,
      dynamicReportInterpolation,
      noScriptedVerdicts,
      unboundedSubprocessPipe,
      latexTemplateHygiene,
      rawRecordProvenance,
      traceability,
    }),
  });
}
