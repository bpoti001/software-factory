/**
 * Private Implementation: Structural Drift & Delete-Zone Checker
 * Governed by: ADR-0001, ADR-0004
 */

const STRUCTURAL_MANIFEST_OR_SCHEMA =
  /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle|go\.mod|Cargo\.toml|schema\.prisma)$|(^|\/)(migrations?|db\/migrate)\/|\.sql$/i;

const GOVERNANCE_DOC_FILE = /^(CONTEXT\.md|GLOSSARY\.md|docs\/(adr|rfc)\/.*\.md)$/;

/**
 * Checks whether structural files changed without accompanying ADR/RFC/CONTEXT.md updates.
 * @param {string[]} changedFiles
 */
export function checkStructuralDrift(changedFiles = []) {
  const structuralTriggers = changedFiles.filter((file) =>
    STRUCTURAL_MANIFEST_OR_SCHEMA.test(file)
  );
  if (structuralTriggers.length === 0) {
    return [];
  }

  const hasGovernanceDocUpdate = changedFiles.some((file) => GOVERNANCE_DOC_FILE.test(file));
  if (hasGovernanceDocUpdate) {
    return [];
  }

  return structuralTriggers.map((file) =>
    Object.freeze({
      file,
      message: `[Structural Drift] '${file}' was modified without a corresponding update to CONTEXT.md, docs/adr/, or docs/rfc/ (ADR-0000, ADR-0004).`,
    })
  );
}

/**
 * Checks changed files against Delete-Zone forbidden patterns (e.g., barrel `export * from './lib/'` in module index).
 * @param {string[]} changedFiles
 * @param {Record<string, string>} fileContents
 */
export function checkDeleteZoneViolations(changedFiles = [], fileContents = {}) {
  const violations = [];

  for (const file of changedFiles) {
    const content = fileContents[file];
    if (typeof content !== 'string') {
      continue;
    }

    if (
      /^src\/modules\/[^/]+\/index\.(mjs|cjs|js|ts)$/.test(file) &&
      /export\s+\*\s+from\s+['"]\.\/(lib|internal)\//.test(content)
    ) {
      violations.push(
        Object.freeze({
          file,
          pattern: "export * from './lib/'",
          message: `[Delete-Zone Violation] '${file}' uses barrel re-export 'export * from ./lib/'. Export only explicit public seam functions (ADR-0001).`,
        })
      );
    }
  }

  return violations;
}
