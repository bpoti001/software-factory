/**
 * Private Implementation: Structural Drift & Delete-Zone Checker
 * Governed by: ADR-0001, ADR-0004
 */

const STRUCTURAL_MANIFEST_OR_SCHEMA =
  /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle|go\.mod|Cargo\.toml|schema\.prisma)$|(^|\/)(migrations?|db\/migrate)\/|\.sql$/i;

const GOVERNANCE_DOC_FILE = /^(CONTEXT\.md|GLOSSARY\.md|docs\/(adr|rfc)\/.*\.md)$/;

/**
 * Checks whether structural files changed without accompanying ADR/RFC/CONTEXT.md updates,
 * and ensures all touched Deep Modules are mapped in CONTEXT.md Section 2.
 * @param {string[]} changedFiles
 * @param {string} [contextMarkdown]
 */
export function checkStructuralDrift(changedFiles = [], contextMarkdown = '') {
  const violations = [];

  const structuralTriggers = changedFiles.filter((file) =>
    STRUCTURAL_MANIFEST_OR_SCHEMA.test(file)
  );

  const hasGovernanceDocUpdate = changedFiles.some((file) => GOVERNANCE_DOC_FILE.test(file));

  if (structuralTriggers.length > 0 && !hasGovernanceDocUpdate) {
    for (const file of structuralTriggers) {
      violations.push(
        Object.freeze({
          file,
          message: `[Structural Drift] '${file}' was modified without a corresponding update to CONTEXT.md, docs/adr/, or docs/rfc/ (ADR-0000, ADR-0004).`,
        })
      );
    }
  }

  // Module mapping check: every touched module in src/modules/<name>/ must be registered in CONTEXT.md
  if (contextMarkdown && contextMarkdown.trim()) {
    const touchedModules = new Set();
    for (const file of changedFiles) {
      const match = file.match(/^src\/modules\/([^/]+)\//);
      if (match) {
        touchedModules.add(match[1]);
      }
    }

    for (const modName of touchedModules) {
      const isMapped =
        contextMarkdown.includes(`src/modules/${modName}/`) ||
        contextMarkdown.includes(`**${modName} Module**`) ||
        contextMarkdown.includes(`**${modName.charAt(0).toUpperCase() + modName.slice(1)} Module**`);

      if (!isMapped) {
        violations.push(
          Object.freeze({
            file: `src/modules/${modName}/`,
            message: `[Structural Drift] Deep Module '${modName}' ('src/modules/${modName}/') was created or modified but is not mapped in CONTEXT.md Section 2 (ADR-0001, ADR-0004).`,
          })
        );
      }
    }
  }

  return violations;
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
