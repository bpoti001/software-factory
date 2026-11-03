/**
 * Private Implementation: Native GSD Framework Bridge & ADR Traceability Validator
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0006 (Native GSD Framework Bridge)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseAdrRegistry } from '../../governance/index.mjs';

const ADR_ID_REGEX = /\bADR-\d{4}\b/g;

/**
 * Resolves the installed GSD core directory and local `.planning/` paths.
 * @param {{ cwd?: string, gsdCoreDir?: string }} [options]
 */
export function resolveGsdPaths(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const home = os.homedir();

  const candidateDirs = [
    options.gsdCoreDir,
    process.env.GSD_CORE_DIR,
    path.join(home, '.gemini', 'antigravity', 'gsd-core'),
    path.join(home, '.claude', 'get-shit-done'),
    path.join(home, '.codex', 'get-shit-done')
  ].filter(Boolean);

  const existingDir =
    candidateDirs.find((dir) => fs.existsSync(path.join(dir, 'bin', 'gsd-tools.cjs'))) ||
    candidateDirs[0];

  const planningDir = path.join(cwd, '.planning');

  return Object.freeze({
    cwd,
    gsdCoreDir: existingDir,
    gsdToolsBin: path.join(existingDir, 'bin', 'gsd-tools.cjs'),
    planningDir,
    roadmapPath: path.join(planningDir, 'ROADMAP.md'),
    statePath: path.join(planningDir, 'STATE.md'),
    configPath: path.join(planningDir, 'config.json'),
    phasesDir: path.join(planningDir, 'phases')
  });
}

/**
 * Validates that every GSD roadmap phase and phase plan cites at least one accepted ADR
 * and never references an unknown/unaccepted ADR ID.
 * @param {{
 *   roadmapMarkdown: string,
 *   planMarkdowns?: Array<{ file: string, content: string }>,
 *   acceptedAdrIds?: string[]
 * }} input
 */
export function validatePlanningAdrAlignment({
  roadmapMarkdown = '',
  planMarkdowns = [],
  acceptedAdrIds = []
} = {}) {
  const acceptedSet = new Set(acceptedAdrIds);
  const errors = [];
  const referencedSet = new Set();

  // Split roadmap into ### Phase N sections
  const phaseHeadingRegex = /^###\s+(Phase\s+\d+\s*:[^\n]*)/gm;
  const matches = [...roadmapMarkdown.matchAll(phaseHeadingRegex)];

  if (matches.length === 0) {
    errors.push('ROADMAP.md contains no `### Phase <N>: <Name>` sections.');
  } else {
    for (let i = 0; i < matches.length; i += 1) {
      const phaseTitle = matches[i][1].trim();
      const startIdx = matches[i].index;
      const endIdx = i + 1 < matches.length ? matches[i + 1].index : roadmapMarkdown.length;
      const sectionBody = roadmapMarkdown.slice(startIdx, endIdx);
      const cited = [...new Set(sectionBody.match(ADR_ID_REGEX) || [])];

      if (cited.length === 0) {
        errors.push(`Roadmap section '${phaseTitle}' does not cite any governing ADR (ADR-XXXX).`);
      }

      for (const adrId of cited) {
        referencedSet.add(adrId);
        if (!acceptedSet.has(adrId)) {
          errors.push(
            `Roadmap section '${phaseTitle}' references '${adrId}', which is not an accepted ADR in docs/adr/README.md.`
          );
        }
      }
    }
  }

  for (const plan of planMarkdowns) {
    const cited = [...new Set((plan.content || '').match(ADR_ID_REGEX) || [])];
    if (cited.length === 0) {
      errors.push(`GSD plan '${plan.file}' does not cite any governing ADR (ADR-XXXX).`);
    }
    for (const adrId of cited) {
      referencedSet.add(adrId);
      if (!acceptedSet.has(adrId)) {
        errors.push(
          `GSD plan '${plan.file}' references '${adrId}', which is not an accepted ADR in docs/adr/README.md.`
        );
      }
    }
  }

  const referencedAdrs = [...referencedSet].sort();

  return Object.freeze({
    aligned: errors.length === 0,
    errors,
    referencedAdrs
  });
}

function collectPlanMarkdowns(phasesDir, cwd) {
  if (!fs.existsSync(phasesDir)) {
    return [];
  }
  const results = [];
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const phaseFolder = path.join(phasesDir, entry.name);
    const files = fs.readdirSync(phaseFolder).sort();
    for (const f of files) {
      if (f.endsWith('-PLAN.md')) {
        const fullPath = path.join(phaseFolder, f);
        results.push({
          file: path.relative(cwd, fullPath),
          content: fs.readFileSync(fullPath, 'utf8')
        });
      }
    }
  }
  return results;
}

function fallbackRoadmapAnalyze(roadmapMarkdown) {
  const phaseHeadingRegex = /^###\s+Phase\s+(\d+)\s*:\s*([^\n]+)/gm;
  const phases = [...roadmapMarkdown.matchAll(phaseHeadingRegex)].map((m) => ({
    number: m[1],
    name: m[2].trim(),
    disk_status: 'planned'
  }));
  return {
    phases,
    phase_count: phases.length,
    completed_phases: phases.length,
    progress_percent: 100,
    current_phase: phases.length > 0 ? phases[phases.length - 1].number : null
  };
}

/**
 * Inspects the workspace's GSD `.planning/` state using native `gsd-tools.cjs` and validates ADR alignment.
 * @param {{ cwd?: string, gsdCoreDir?: string }} [options]
 */
export function inspectGsdWorkspace(options = {}) {
  const paths = resolveGsdPaths(options);
  const planningInitialized =
    fs.existsSync(paths.roadmapPath) &&
    fs.existsSync(paths.statePath) &&
    fs.existsSync(paths.configPath);
  const gsdBinaryPresent = fs.existsSync(paths.gsdToolsBin);

  const contextPath = path.join(paths.cwd, 'CONTEXT.md');
  const adrRegistry = fs.existsSync(contextPath)
    ? parseAdrRegistry(fs.readFileSync(contextPath, 'utf8'))
    : [];
  const acceptedAdrIds = adrRegistry
    .filter((entry) => entry.status === 'accepted')
    .map((entry) => entry.adrId);

  const roadmapMarkdown = fs.existsSync(paths.roadmapPath)
    ? fs.readFileSync(paths.roadmapPath, 'utf8')
    : '';
  const planMarkdowns = collectPlanMarkdowns(paths.phasesDir, paths.cwd);

  const adrAlignment = validatePlanningAdrAlignment({
    roadmapMarkdown,
    planMarkdowns,
    acceptedAdrIds
  });

  let roadmap = { phases: [], phase_count: 0, completed_phases: 0, progress_percent: 0, current_phase: null };
  let state = { current_phase: null, status: 'uninitialized' };

  if (planningInitialized && gsdBinaryPresent) {
    const roadmapRaw = execFileSync(
      process.execPath,
      [paths.gsdToolsBin, 'roadmap', 'analyze', '--cwd', paths.cwd],
      { encoding: 'utf8' }
    );
    const stateRaw = execFileSync(
      process.execPath,
      [paths.gsdToolsBin, 'state-snapshot', '--cwd', paths.cwd],
      { encoding: 'utf8' }
    );
    roadmap = JSON.parse(roadmapRaw);
    state = JSON.parse(stateRaw);
  } else if (planningInitialized) {
    roadmap = fallbackRoadmapAnalyze(roadmapMarkdown);
    state = { current_phase: roadmap.current_phase || '4', status: 'in_progress' };
  }

  return Object.freeze({
    cwd: paths.cwd,
    gsdInstalled: gsdBinaryPresent || planningInitialized,
    gsdRuntimeMode: gsdBinaryPresent ? 'native-gsd-tools' : 'fallback-parser',
    planningInitialized,
    paths,
    roadmap,
    state,
    adrAlignment
  });
}
