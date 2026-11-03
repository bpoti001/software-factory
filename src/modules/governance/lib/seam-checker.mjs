/**
 * Private Implementation: Deep Module Seam Violation Checker
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0004 (Deterministic Governance CLI)
 */

const CODE_FILE_EXT = /\.(mjs|cjs|js|ts|tsx|jsx|py|go|java)$/;
const STATEMENT_IMPORT_REGEX =
  /^\s*(?:import|export)\b[^'"\n]*?\bfrom\s+['"]([^'"]+)['"]|^\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/;

/**
 * Checks whether an import path crosses module boundaries into a private /lib/ or /internal/ directory.
 * @param {string} sourceFile
 * @param {string} importSpec
 * @returns {boolean}
 */
function isCrossModulePrivateImport(sourceFile, importSpec) {
  if (!importSpec.includes('/lib/') && !importSpec.includes('/internal/')) {
    return false;
  }

  // Test files outside src/modules/<domain>/ must NEVER import from /lib/ or /internal/
  if (sourceFile.startsWith('tests/') || sourceFile.includes('.test.')) {
    return true;
  }

  // Within the same module (e.g. src/modules/sizing/index.mjs -> ./lib/classifier.mjs), ./lib/ is allowed
  if (importSpec.startsWith('./lib/') || importSpec.startsWith('./internal/')) {
    return false;
  }

  // Any parent traversal (../) or package alias reaching into /lib/ or /internal/ is a Seam Violation
  if (importSpec.startsWith('../') || importSpec.startsWith('@') || importSpec.includes('src/modules/')) {
    return true;
  }

  return false;
}

/**
 * Scans changed code files for Deep Module Seam Violations.
 * @param {string[]} changedFiles
 * @param {Record<string, string>} fileContents
 */
export function checkSeamViolations(changedFiles = [], fileContents = {}) {
  const violations = [];

  for (const file of changedFiles) {
    if (!CODE_FILE_EXT.test(file)) {
      continue;
    }

    const content = fileContents[file];
    if (typeof content !== 'string') {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const match = STATEMENT_IMPORT_REGEX.exec(lineText);
      if (match) {
        const importPath = match[1] || match[2] || '';
        if (isCrossModulePrivateImport(file, importPath)) {
          violations.push(
            Object.freeze({
              file,
              line: idx + 1,
              importPath,
              message: `[Seam Violation] '${file}:${idx + 1}' imports private '${importPath}' across module seams. Import only from the module's root index entry point (ADR-0001).`,
            })
          );
        }
      }
    });
  }

  return violations;
}
