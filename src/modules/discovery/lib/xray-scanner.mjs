/**
 * Private Implementation: Deep Codebase X-Ray & Dependency Graph Scanner (DRD-01)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

import fs from 'node:fs';
import path from 'node:path';
import { discoverPractices } from './discover.mjs';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.venv',
  'venv',
  'vendor',
  '__pycache__',
  '.planning',
  '.ci',
]);

const CODE_EXTENSIONS = new Set(['.mjs', '.cjs', '.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs']);

const STATIC_IMPORT_REGEX =
  /(?:(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\))/gm;

/**
 * Recursively collects all source files under a directory.
 * @param {string} dir
 * @param {string} rootDir
 * @param {string[]} [acc]
 * @returns {string[]}
 */
function walkCodeFiles(dir, rootDir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCodeFiles(fullPath, rootDir, acc);
    } else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
      acc.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return acc;
}

/**
 * Extracts exported symbol names from an entry point file's content.
 * @param {string} content
 * @returns {string[]}
 */
function extractExportedSymbols(content) {
  const symbols = new Set();

  const directRegex = /export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/g;
  let match;
  while ((match = directRegex.exec(content)) !== null) {
    symbols.add(match[1]);
  }

  const namedListRegex = /export\s*\{([^}]+)\}/g;
  while ((match = namedListRegex.exec(content)) !== null) {
    const parts = match[1].split(',');
    for (const part of parts) {
      const cleaned = part.trim().split(/\s+as\s+/).pop().trim();
      if (cleaned && /^[A-Za-z0-9_$]+$/.test(cleaned)) {
        symbols.add(cleaned);
      }
    }
  }

  return Array.from(symbols);
}

/**
 * Extracts import specifiers from a source file.
 * @param {string} content
 * @returns {string[]}
 */
function extractImportSpecifiers(content) {
  const specs = [];
  STATIC_IMPORT_REGEX.lastIndex = 0;
  let match;
  while ((match = STATIC_IMPORT_REGEX.exec(content)) !== null) {
    const spec = (match[1] || match[2] || '').trim();
    if (spec) specs.push(spec);
  }
  return specs;
}

/**
 * Detects bounded-context module roots across Deep Module, Monorepo, Layered, or Organic layouts.
 * @param {string} cwd
 * @returns {{ layoutPattern: string, moduleRoots: Array<{ name: string, relPath: string }> }}
 */
function detectModuleRoots(cwd) {
  const srcModules = path.join(cwd, 'src', 'modules');
  if (fs.existsSync(srcModules)) {
    const dirs = fs
      .readdirSync(srcModules, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ name: d.name, relPath: `src/modules/${d.name}` }));
    if (dirs.length > 0) {
      return { layoutPattern: 'deep-modules', moduleRoots: dirs };
    }
  }

  const packagesDir = path.join(cwd, 'packages');
  if (fs.existsSync(packagesDir)) {
    const dirs = fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ name: d.name, relPath: `packages/${d.name}` }));
    if (dirs.length > 0) {
      return { layoutPattern: 'monorepo-packages', moduleRoots: dirs };
    }
  }

  const srcDir = path.join(cwd, 'src');
  if (fs.existsSync(srcDir)) {
    const dirs = fs
      .readdirSync(srcDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ name: d.name, relPath: `src/${d.name}` }));
    const layeredNames = new Set(['controllers', 'services', 'models', 'routes', 'repositories']);
    const isLayered = dirs.some((d) => layeredNames.has(d.name));
    if (dirs.length > 0) {
      return {
        layoutPattern: isLayered ? 'layered-mvc' : 'organic',
        moduleRoots: dirs,
      };
    }
  }

  return { layoutPattern: 'organic', moduleRoots: [] };
}

/**
 * Finds cycles in a directed module graph.
 * @param {string[]} moduleNames
 * @param {Array<{ fromModule: string, toModule: string }>} edges
 * @returns {string[][]}
 */
function detectCircularDependencies(moduleNames, edges) {
  const adj = new Map();
  for (const name of moduleNames) adj.set(name, new Set());
  for (const e of edges) {
    if (adj.has(e.fromModule) && adj.has(e.toModule) && e.fromModule !== e.toModule) {
      adj.get(e.fromModule).add(e.toModule);
    }
  }

  const cycles = [];
  const seenCycles = new Set();

  for (const startNode of moduleNames) {
    const visited = new Set();
    const stack = [[startNode, [startNode]]];
    while (stack.length > 0) {
      const [curr, pathNodes] = stack.pop();
      const neighbors = adj.get(curr) || new Set();
      for (const next of neighbors) {
        if (next === startNode && pathNodes.length > 1) {
          const cycleKey = [...pathNodes].sort().join('->');
          if (!seenCycles.has(cycleKey)) {
            seenCycles.add(cycleKey);
            cycles.push([...pathNodes, startNode]);
          }
        } else if (!visited.has(next)) {
          visited.add(next);
          stack.push([next, [...pathNodes, next]]);
        }
      }
    }
  }

  return cycles;
}

/**
 * Fingerprints databases, transports, and CI pipelines in the repository.
 * @param {string} cwd
 * @param {string[]} allFiles
 */
function fingerprintInfrastructure(cwd, allFiles) {
  const databases = new Set();
  const transports = new Set();
  const ciPipelines = [];

  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const dep of Object.keys(allDeps)) {
        if (['pg', 'postgres', 'postgresql'].includes(dep)) databases.add('postgresql');
        if (dep.includes('prisma')) databases.add('prisma');
        if (dep.includes('redis') || dep.includes('ioredis')) databases.add('redis');
        if (dep.includes('mongoose') || dep.includes('mongodb')) databases.add('mongodb');
        if (dep.includes('sqlite') || dep.includes('better-sqlite3')) databases.add('sqlite');
        if (dep === 'fastify') transports.add('fastify');
        if (dep === 'express') transports.add('express');
        if (dep === 'next') transports.add('nextjs');
        if (dep.includes('graphql')) transports.add('graphql');
      }
      if (pkg.bin) transports.add('cli');
    } catch {
      // ignore malformed package.json
    }
  }

  if (allFiles.some((f) => f.startsWith('src/cli/'))) {
    transports.add('cli');
  }
  if (allFiles.some((f) => f.endsWith('.sql'))) {
    databases.add('sql-migrations');
  }

  const candidateCiPaths = [
    'bitbucket-pipelines.yml',
    '.ci/workflows/ci.yml',
    '.github/workflows/ci.yml',
    '.gitlab-ci.yml',
  ];
  for (const ciFile of candidateCiPaths) {
    if (fs.existsSync(path.join(cwd, ciFile))) {
      ciPipelines.push(ciFile);
    }
  }

  return Object.freeze({
    databases: Object.freeze(Array.from(databases)),
    transports: Object.freeze(Array.from(transports)),
    ciPipelines: Object.freeze(ciPipelines),
    hasAdrGovernance: fs.existsSync(path.join(cwd, 'docs', 'adr')),
    hasGsdPlanning: fs.existsSync(path.join(cwd, '.planning')),
    hasContextMd: fs.existsSync(path.join(cwd, 'CONTEXT.md')),
    hasGlossaryMd: fs.existsSync(path.join(cwd, 'GLOSSARY.md')),
  });
}

/**
 * Performs a Deep Codebase X-Ray (DRD-01): extracts module boundaries, public seams,
 * Module Depth Ratios, Fan-In/Fan-Out coupling, circular dependencies, and seam violations.
 * @param {{ cwd?: string }} [options]
 */
export function analyzeCodebase(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const baseDiscovery = discoverPractices({ cwd });

  let projectName = path.basename(cwd);
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) projectName = pkg.name;
    } catch {
      // fallback to folder name
    }
  }

  const allFiles = walkCodeFiles(cwd, cwd);
  const { layoutPattern, moduleRoots } = detectModuleRoots(cwd);

  // Read CONTEXT.md if present to map governing ADRs per module
  const contextPath = path.join(cwd, 'CONTEXT.md');
  const contextText = fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf8') : '';

  const modulesMap = new Map();
  for (const modRoot of moduleRoots) {
    const modFiles = allFiles.filter(
      (f) => f === modRoot.relPath || f.startsWith(`${modRoot.relPath}/`)
    );
    const entryCandidate = modFiles.find((f) =>
      new RegExp(`^${modRoot.relPath}/index\\.(mjs|cjs|js|ts|tsx)$`).test(f)
    );

    let publicSymbols = [];
    let totalModLines = 0;
    let hiddenLines = 0;
    const adrSet = new Set();

    // Check CONTEXT.md lines mentioning this module path
    for (const line of contextText.split(/\r?\n/)) {
      if (line.includes(modRoot.relPath)) {
        const adrMatches = line.match(/ADR-\d{4}/g) || [];
        adrMatches.forEach((id) => adrSet.add(id));
      }
    }

    for (const file of modFiles) {
      const content = fs.readFileSync(path.join(cwd, file), 'utf8');
      const lineCount = content.split(/\r?\n/).length;
      totalModLines += lineCount;

      const inlineAdrs = content.match(/ADR-\d{4}/g) || [];
      inlineAdrs.forEach((id) => adrSet.add(id));

      if (file === entryCandidate) {
        publicSymbols = extractExportedSymbols(content);
      } else {
        hiddenLines += lineCount;
      }
    }

    const internalFiles = modFiles.filter((f) => f !== entryCandidate);
    const depthRatio = Number(
      (hiddenLines / Math.max(1, publicSymbols.length)).toFixed(2)
    );

    modulesMap.set(modRoot.name, {
      name: modRoot.name,
      path: modRoot.relPath,
      entryPoint: entryCandidate || null,
      publicSymbols,
      internalFiles,
      files: modFiles,
      totalLines: totalModLines,
      hiddenLines,
      depthRatio,
      isDeepModule: Boolean(entryCandidate) && internalFiles.length > 0,
      fanIn: 0,
      fanOut: 0,
      instability: 0,
      governingAdrs: Array.from(adrSet).sort(),
    });
  }

  // Extract edges & external packages across all files
  const edges = [];
  const externalPackages = new Set();
  let totalLines = 0;

  // Helper to find which module owns a relative file path
  const findOwnerModule = (relFile) => {
    for (const mod of modulesMap.values()) {
      if (relFile === mod.path || relFile.startsWith(`${mod.path}/`)) {
        return mod.name;
      }
    }
    return null;
  };

  for (const file of allFiles) {
    const absFile = path.join(cwd, file);
    const content = fs.readFileSync(absFile, 'utf8');
    totalLines += content.split(/\r?\n/).length;

    const fromModule = findOwnerModule(file);
    const specs = extractImportSpecifiers(content);

    for (const spec of specs) {
      if (!spec.startsWith('.')) {
        externalPackages.add(spec);
        continue;
      }

      const resolvedAbs = path.resolve(path.dirname(absFile), spec);
      const resolvedRel = path.relative(cwd, resolvedAbs).replace(/\\/g, '/');
      const toModule = findOwnerModule(resolvedRel);

      if (fromModule && toModule && fromModule !== toModule) {
        const isSeamViolation = /\/(lib|internal)\//.test(resolvedRel) || /\/(lib|internal)\//.test(spec);
        edges.push(
          Object.freeze({
            fromModule,
            toModule,
            fromFile: file,
            toTarget: resolvedRel,
            rawSpecifier: spec,
            isSeamViolation,
          })
        );
      }
    }
  }

  // Compute Fan-In, Fan-Out, and Instability per module
  for (const mod of modulesMap.values()) {
    const incomingModules = new Set(
      edges.filter((e) => e.toModule === mod.name).map((e) => e.fromModule)
    );
    const outgoingModules = new Set(
      edges.filter((e) => e.fromModule === mod.name).map((e) => e.toModule)
    );
    mod.fanIn = incomingModules.size;
    mod.fanOut = outgoingModules.size;
    mod.instability =
      mod.fanIn + mod.fanOut === 0
        ? 0
        : Number((mod.fanOut / (mod.fanIn + mod.fanOut)).toFixed(2));
  }

  const modulesList = Array.from(modulesMap.values()).map((m) =>
    Object.freeze({
      name: m.name,
      path: m.path,
      entryPoint: m.entryPoint,
      publicSymbols: Object.freeze(m.publicSymbols),
      internalFiles: Object.freeze(m.internalFiles),
      totalLines: m.totalLines,
      hiddenLines: m.hiddenLines,
      depthRatio: m.depthRatio,
      isDeepModule: m.isDeepModule,
      fanIn: m.fanIn,
      fanOut: m.fanOut,
      instability: m.instability,
      governingAdrs: Object.freeze(m.governingAdrs),
    })
  );

  const circularDependencies = detectCircularDependencies(
    modulesList.map((m) => m.name),
    edges
  );
  const seamViolations = edges.filter((e) => e.isSeamViolation);
  const infrastructure = fingerprintInfrastructure(cwd, allFiles);

  return Object.freeze({
    cwd,
    projectName,
    runtime: baseDiscovery.runtime,
    testRunner: baseDiscovery.testRunner,
    layoutPattern,
    totalFiles: allFiles.length,
    totalLines,
    modules: Object.freeze(modulesList),
    edges: Object.freeze(edges),
    circularDependencies: Object.freeze(circularDependencies),
    seamViolations: Object.freeze(seamViolations),
    externalPackages: Object.freeze(Array.from(externalPackages).sort()),
    infrastructure,
  });
}
