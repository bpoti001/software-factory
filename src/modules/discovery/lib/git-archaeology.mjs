/**
 * Private Implementation: Git Archaeology & Implicit Decision Miner (DRD-02)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

import path from 'node:path';
import { execSync } from 'node:child_process';
import { analyzeCodebase } from './xray-scanner.mjs';

/**
 * Classifies a commit subject and touched files into an architectural epoch category.
 * @param {string} subject
 * @param {string[]} files
 */
function classifyEpochCategory(subject, files) {
  if (files.some((f) => f.startsWith('docs/adr/') || f.startsWith('docs/rfc/')) || /ADR-\d+/i.test(subject)) {
    return 'architecture-adr';
  }
  if (files.includes('package.json') || files.includes('go.mod') || files.includes('pyproject.toml')) {
    return 'dependency-or-manifest';
  }
  if (files.some((f) => /src\/modules\/[^/]+\/index\./.test(f))) {
    return 'module-seam-evolution';
  }
  if (/fix|remediat|harden|verify|sensor/i.test(subject)) {
    return 'governance-hardening';
  }
  return 'feature-slice';
}

/**
 * Mines Git commit history for architectural epochs, hotspot gravity scores,
 * temporal co-change coupling, and split-brain / Delete-Zone candidates (DRD-02).
 * @param {{ cwd?: string, maxCommits?: number, xrayReport?: ReturnType<typeof analyzeCodebase> }} [options]
 */
export function mineGitArchaeology(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const maxCommits = options.maxCommits || 100;
  const xray = options.xrayReport || analyzeCodebase({ cwd });

  let rawLog = '';
  try {
    rawLog = execSync(
      `git log -n ${maxCommits} --date=short --pretty=format:"COMMIT_START|%h|%ad|%s" --name-only`,
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
  } catch {
    rawLog = '';
  }

  const commits = [];
  const blocks = rawLog.split('COMMIT_START|').filter((b) => b.trim().length > 0);

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const headerParts = lines[0].split('|');
    const commitHash = headerParts[0] || '';
    const date = headerParts[1] || '';
    const subject = headerParts.slice(2).join('|') || '';
    const files = lines.slice(1);
    commits.push({ commitHash, date, subject, files });
  }

  // 1. Architectural Epochs
  const epochs = commits.map((c) =>
    Object.freeze({
      commitHash: c.commitHash,
      date: c.date,
      subject: c.subject,
      filesChangedCount: c.files.length,
      category: classifyEpochCategory(c.subject, c.files),
    })
  );

  // Helper to resolve module name and Fan-In from xray
  const findModuleInfo = (file) => {
    for (const mod of xray.modules) {
      if (file === mod.path || file.startsWith(`${mod.path}/`)) {
        return { moduleName: mod.name, fanIn: mod.fanIn, isEntry: file === mod.entryPoint };
      }
    }
    return { moduleName: 'root', fanIn: 0, isEntry: false };
  };

  // 2. Hotspot Churn & Gravity Score
  const fileCommitCounts = new Map();
  const pairCoChangeCounts = new Map();

  for (const c of commits) {
    const uniqueFiles = Array.from(new Set(c.files));
    for (const f of uniqueFiles) {
      fileCommitCounts.set(f, (fileCommitCounts.get(f) || 0) + 1);
    }

    // Track co-changing module files (cap per commit at 25 files to avoid mega-commit noise)
    if (uniqueFiles.length <= 25) {
      for (let i = 0; i < uniqueFiles.length; i++) {
        for (let j = i + 1; j < uniqueFiles.length; j++) {
          const [a, b] = [uniqueFiles[i], uniqueFiles[j]].sort();
          const key = `${a}||${b}`;
          pairCoChangeCounts.set(key, (pairCoChangeCounts.get(key) || 0) + 1);
        }
      }
    }
  }

  const hotspots = Array.from(fileCommitCounts.entries())
    .map(([file, count]) => {
      const { moduleName, fanIn, isEntry } = findModuleInfo(file);
      const gravityScore = count * (1 + fanIn);
      const isStructural =
        file === 'package.json' ||
        file === 'CONTEXT.md' ||
        file.startsWith('docs/adr/') ||
        (isEntry && fanIn >= 1) ||
        fanIn >= 2;

      return Object.freeze({
        file,
        moduleName,
        commits: count,
        fanIn,
        gravityScore,
        doorClassification: isStructural ? 'One-Way Door' : 'Two-Way Door',
      });
    })
    .sort((a, b) => b.gravityScore - a.gravityScore || b.commits - a.commits)
    .slice(0, 20);

  // 3. Temporal Co-Change Coupling
  const coChangeCoupling = Array.from(pairCoChangeCounts.entries())
    .map(([key, coChangeCount]) => {
      const [fileA, fileB] = key.split('||');
      const infoA = findModuleInfo(fileA);
      const infoB = findModuleInfo(fileB);
      return Object.freeze({
        fileA,
        fileB,
        moduleA: infoA.moduleName,
        moduleB: infoB.moduleName,
        coChangeCount,
        crossModule: infoA.moduleName !== infoB.moduleName && infoA.moduleName !== 'root' && infoB.moduleName !== 'root',
      });
    })
    .filter((item) => item.crossModule)
    .sort((a, b) => b.coChangeCount - a.coChangeCount)
    .slice(0, 15);

  // 4. Split-Brain & Delete-Zone Candidates
  const splitBrainPatterns = [];
  const deleteZoneCandidates = [];

  if (xray.seamViolations.length > 0) {
    const totalEdges = Math.max(1, xray.edges.length);
    const cleanEdges = totalEdges - xray.seamViolations.length;
    const dominantRatio = Number((cleanEdges / totalEdges).toFixed(2));
    splitBrainPatterns.push(
      Object.freeze({
        dimension: 'Cross-Module Boundary Encapsulation',
        dominantPattern: 'Public Seam Imports (index.mjs)',
        competingPattern: 'Direct Private Internal Imports (/lib/)',
        dominantRatio,
        recommendation:
          'Refactor cross-module /lib/ imports to public index.mjs seams and register direct /lib/ imports in CONTEXT.md Delete-Zone.',
      })
    );
    for (const v of xray.seamViolations) {
      deleteZoneCandidates.push(
        Object.freeze({
          pattern: `Direct import from ${v.fromFile} -> ${v.toTarget}`,
          reason: `Bypasses public seam of module '${v.toModule}' (ADR-0001)`,
          evidence: `${v.fromFile}`,
        })
      );
    }
  }

  return Object.freeze({
    cwd,
    totalCommitsAnalyzed: commits.length,
    epochs: Object.freeze(epochs),
    hotspots: Object.freeze(hotspots),
    coChangeCoupling: Object.freeze(coChangeCoupling),
    splitBrainPatterns: Object.freeze(splitBrainPatterns),
    deleteZoneCandidates: Object.freeze(deleteZoneCandidates),
  });
}
