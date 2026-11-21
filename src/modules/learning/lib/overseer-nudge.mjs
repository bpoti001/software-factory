/**
 * Private Submodule: Overseer Audit & Enhancement Nudge Ledger
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (Self-Learning Loop), ADR-0010 (Overseer Governance)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveModelRouting } from '../../sizing/index.mjs';

export const REQUIRED_RESEARCH_FACTORY_SKILLS = Object.freeze([
  'adr-to-arxiv-factory',
  '0-autoresearch-skill',
  'systems-paper-writing',
  'ml-paper-writing',
  'academic-plotting',
  'brainstorming-research-ideas',
  'creative-thinking-for-research',
  'blast-radius',
  'thermo-nuclear-code-quality-review',
  'presenting-conference-talks',
  'paper2agent',
]);

/**
 * Audits installed research skills, ADR-0010 governance registration, and ENHANCEMENT_BACKLOG.md.
 * @param {{ cwd?: string, backlogFile?: string }} [options]
 */
export function buildOverseerAuditReport(options = {}) {
  const targetDir = path.resolve(options.cwd || process.cwd());
  const backlogPath = path.resolve(targetDir, options.backlogFile || 'ENHANCEMENT_BACKLOG.md');
  const skillsDir = path.join(targetDir, '.agents', 'skills');
  const installedSkills = [];
  const missingSkills = [];

  for (const skill of REQUIRED_RESEARCH_FACTORY_SKILLS) {
    const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      installedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const adr0010Path = path.join(
    targetDir,
    'docs',
    'adr',
    '0010-multi-model-autoresearch-and-overseer-governance.md'
  );
  const contextPath = path.join(targetDir, 'CONTEXT.md');
  const contextText = fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf8') : '';
  const adr0010Present = fs.existsSync(adr0010Path) && contextText.includes('ADR-0010');
  const backlogPresent = fs.existsSync(backlogPath);
  const backlogText = backlogPresent ? fs.readFileSync(backlogPath, 'utf8') : '';
  const enhancementMatches = backlogText.match(/\*\*ENH-\d{4}\*\*/g) || [];
  const modelRouting = resolveModelRouting('L', 'research');

  return Object.freeze({
    passed: missingSkills.length === 0 && adr0010Present && backlogPresent,
    adr0010Present,
    backlogPresent,
    backlogPath,
    enhancementCount: enhancementMatches.length,
    installedSkills: Object.freeze(installedSkills),
    missingSkills: Object.freeze(missingSkills),
    modelRouting,
  });
}

/**
 * Appends a SHA-256 provenance-stamped enhancement nudge to `ENHANCEMENT_BACKLOG.md`
 * and returns the updated overseer audit report (ADR-0010, ENH-0005).
 * @param {{ cwd?: string, note?: string, source?: string, status?: string, backlogFile?: string }} [options]
 */
export function recordOverseerNudge(options = {}) {
  const targetDir = path.resolve(options.cwd || process.cwd());
  const source = options.source || '@factory-overseer';
  const status = options.status || 'completed';
  const backlogPath = path.resolve(targetDir, options.backlogFile || 'ENHANCEMENT_BACKLOG.md');
  const note = String(options.note || '').trim();

  let recordedEntry = null;
  if (note) {
    if (!fs.existsSync(backlogPath)) {
      fs.writeFileSync(
        backlogPath,
        '# Software Factory Overseer Enhancement Backlog (`ENHANCEMENT_BACKLOG.md`)\n\n| ID | Timestamp | Source / Observation | Enhancement Directive | Governing ADR | Status | Provenance Hash |\n|---|---|---|---|---|---|---|\n',
        'utf8'
      );
    }
    const currentText = fs.readFileSync(backlogPath, 'utf8');
    const existingIds = Array.from(currentText.matchAll(/\*\*ENH-(\d{4})\*\*/g)).map((m) =>
      Number(m[1])
    );
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const enhId = `ENH-${String(nextNum).padStart(4, '0')}`;
    const timestamp = new Date().toISOString();
    const contentHash = crypto
      .createHash('sha256')
      .update(`${enhId}:${timestamp}:${source}:${note}`)
      .digest('hex')
      .slice(0, 16);

    const newRow = `| **${enhId}** | \`${timestamp}\` | \`${source}\` | ${note} | \`ADR-0010\` | \`${status}\` | \`cid:${contentHash}\` |`;
    fs.writeFileSync(backlogPath, `${currentText.trimEnd()}\n${newRow}\n`, 'utf8');
    recordedEntry = Object.freeze({
      enhId,
      timestamp,
      source,
      note,
      status,
      contentHash: `cid:${contentHash}`,
    });
  }

  const audit = buildOverseerAuditReport({ cwd: targetDir, backlogFile: backlogPath });
  return Object.freeze({ ...audit, recordedEntry });
}
