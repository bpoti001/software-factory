/**
 * Public Deep Module Seam: Governance & ADR Parity Verification (`src/modules/governance/index.mjs`)
 * Governed by: ADR-0001 (Deep Modules), ADR-0003 (Hybrid ADR Parity), ADR-0004 (Deterministic Governance CLI)
 */

import { parseAdrRegistry, checkAdrParity } from './lib/adr-registry-parser.mjs';
import { checkSeamViolations } from './lib/seam-checker.mjs';
import { checkStructuralDrift, checkDeleteZoneViolations } from './lib/drift-checker.mjs';

export {
  parseAdrRegistry,
  checkAdrParity,
  checkSeamViolations,
  checkStructuralDrift,
  checkDeleteZoneViolations,
};

/**
 * Runs all deterministic Software Factory governance checks across changed files and living docs.
 * @param {{
 *   changedFiles?: string[],
 *   fileContents?: Record<string, string>,
 *   contextMarkdown?: string,
 *   adrReadmeMarkdown?: string,
 *   existingAdrFiles?: string[]
 * }} input
 */
export function verifyGovernance(input = {}) {
  const changedFiles = Array.isArray(input.changedFiles) ? input.changedFiles : [];
  const fileContents = input.fileContents || {};

  const seamViolations = checkSeamViolations(changedFiles, fileContents);
  const structuralDriftViolations = checkStructuralDrift(changedFiles, input.contextMarkdown);
  const adrParityViolations = checkAdrParity({
    contextMarkdown: input.contextMarkdown,
    adrReadmeMarkdown: input.adrReadmeMarkdown,
    existingAdrFiles: input.existingAdrFiles,
  });
  const deleteZoneViolations = checkDeleteZoneViolations(changedFiles, fileContents);

  const passed =
    seamViolations.length === 0 &&
    structuralDriftViolations.length === 0 &&
    adrParityViolations.length === 0 &&
    deleteZoneViolations.length === 0;

  return Object.freeze({
    passed,
    seamViolations: Object.freeze(seamViolations),
    structuralDriftViolations: Object.freeze(structuralDriftViolations),
    adrParityViolations: Object.freeze(adrParityViolations),
    deleteZoneViolations: Object.freeze(deleteZoneViolations),
  });
}
