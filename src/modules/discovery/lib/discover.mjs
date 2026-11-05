/**
 * Private Implementation: Brownfield Practices Discovery
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis Architecture)
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Scans a target codebase to infer language runtime, test framework, module seams, and governance status.
 * @param {{ cwd?: string }} [options]
 */
export function discoverPractices(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());

  let runtime = 'unknown';
  let testRunner = 'unknown';
  const modules = [];

  // 1. Runtime Detection
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      runtime = pkg.type === 'module' ? 'node-esm' : 'node-cjs';
      if (pkg.scripts?.test?.includes('node --test')) {
        testRunner = 'node:test';
      } else if (pkg.scripts?.test?.includes('vitest')) {
        testRunner = 'vitest';
      } else if (pkg.scripts?.test?.includes('jest')) {
        testRunner = 'jest';
      }
    } catch {
      runtime = 'node';
    }
  } else if (fs.existsSync(path.join(cwd, 'pyproject.toml')) || fs.existsSync(path.join(cwd, 'requirements.txt'))) {
    runtime = 'python';
    testRunner = 'pytest';
  } else if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    runtime = 'go';
    testRunner = 'go test';
  } else if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
    runtime = 'rust';
    testRunner = 'cargo test';
  }

  // 2. Module Seam Detection
  const srcModulesDir = path.join(cwd, 'src', 'modules');
  if (fs.existsSync(srcModulesDir)) {
    const entries = fs.readdirSync(srcModulesDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        modules.push(ent.name);
      }
    }
  }

  const hasAdrGovernance = fs.existsSync(path.join(cwd, 'docs', 'adr'));
  const hasGsdPlanning = fs.existsSync(path.join(cwd, '.planning'));

  // 3. Generate suggested architecture blueprint for CONTEXT.md
  const suggestedContextMarkdown = `
# Project Context (${path.basename(cwd)})

## 1. Discovered Runtime & Tooling
- **Runtime**: ${runtime}
- **Test Runner**: ${testRunner}
- **ADR Governance**: ${hasAdrGovernance ? 'Detected (docs/adr/)' : 'Not yet initialized'}
- **GSD Planning**: ${hasGsdPlanning ? 'Detected (.planning/)' : 'Not yet initialized'}

## 2. Canonical Architecture Map
${modules.map((m) => `- **${m} Module**: \`src/modules/${m}/index.mjs\``).join('\n')}
`.trim();

  return Object.freeze({
    cwd,
    runtime,
    testRunner,
    modules: Object.freeze(modules),
    hasAdrGovernance,
    hasGsdPlanning,
    suggestedContextMarkdown
  });
}
