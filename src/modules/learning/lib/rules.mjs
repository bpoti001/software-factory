/**
 * Private Implementation: Self-Learning Rule Loop & Provenance Tracking
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis Architecture)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONFLICT_PATTERNS = [
  { candidate: /\b(allow|use)\s+(barrel\s+export|export\s+\*\s+from)\b/i, forbidden: /never\s+export\s+\*\s+from/i },
  { candidate: /\b(skip|bypass)\s+(tests?|testing|governance)\b/i, forbidden: /mandatory|enforce/i },
  { candidate: /\b(import\s+from\s+(\.\/|\.\.\/)?lib\/)\b/i, forbidden: /seam\s+violation|never\s+import\s+private/i },
];

/**
 * Checks whether a candidate rule contradicts base organization or factory policies.
 * @param {string} candidateRule
 * @param {string} orgStandardsText
 */
export function checkRuleConflict(candidateRule = '', orgStandardsText = '') {
  const trimmed = String(candidateRule).trim();

  for (const pattern of CONFLICT_PATTERNS) {
    if (pattern.candidate.test(trimmed) && pattern.forbidden.test(orgStandardsText)) {
      return Object.freeze({
        hasConflict: true,
        conflictingPhrase: trimmed,
        reason: 'Candidate rule directly contradicts foundational factory architecture (ADR-0001, ADR-0007).'
      });
    }
  }

  return Object.freeze({
    hasConflict: false,
    conflictingPhrase: null,
    reason: null
  });
}

/**
 * Records a confirmed human correction into persistent project rules with SHA-256 provenance.
 * @param {{
 *   rule: string,
 *   heading?: string,
 *   targetFile?: string,
 *   cwd?: string,
 *   author?: string
 * }} options
 */
export function recordLearnedRule(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const targetFile = options.targetFile || path.join(cwd, 'CODING_STANDARDS.md');
  const heading = options.heading || 'Learned Rules';
  const author = options.author || 'engineer';
  const rule = String(options.rule || '').trim();

  if (!rule) {
    throw new Error('Cannot record empty learned rule.');
  }

  const hash = crypto.createHash('sha256').update(rule).digest('hex').slice(0, 16);
  const dateStr = new Date().toISOString().split('T')[0];

  const ruleLine = `- ${rule} (learned ${dateStr}) <!-- cid:${hash} author:${author} -->`;

  let existing = '';
  if (fs.existsSync(targetFile)) {
    existing = fs.readFileSync(targetFile, 'utf8');
  } else {
    existing = `# Project Rules\n\n`;
  }

  const headingMarker = `## ${heading}`;
  let updated = '';

  if (existing.includes(headingMarker)) {
    const lines = existing.split(/\r?\n/);
    const headingIdx = lines.findIndex((l) => l.trim().startsWith(headingMarker));
    lines.splice(headingIdx + 1, 0, ruleLine);
    updated = lines.join('\n');
  } else {
    updated = `${existing.trimEnd()}\n\n${headingMarker}\n\n${ruleLine}\n`;
  }

  fs.writeFileSync(targetFile, updated, 'utf8');

  // Log audit event to .planning/learning/ if targetFile is within cwd
  const isInsideCwd = !path.relative(cwd, targetFile).startsWith('..');
  if (isInsideCwd) {
    const learningDir = path.join(cwd, '.planning', 'learning');
    if (!fs.existsSync(learningDir)) {
      fs.mkdirSync(learningDir, { recursive: true });
    }
    const auditLogPath = path.join(learningDir, 'audit.jsonl');
    const auditEvent = {
      event: 'RULE_LEARNED',
      timestamp: new Date().toISOString(),
      contentHash: hash,
      author,
      heading,
      rule,
      targetFile: path.relative(cwd, targetFile)
    };
    fs.appendFileSync(auditLogPath, JSON.stringify(auditEvent) + '\n', 'utf8');
  }

  return Object.freeze({
    success: true,
    contentHash: hash,
    heading,
    targetFile,
    ruleLine
  });
}

/**
 * Lists all learned rules with provenance metadata from a target file.
 * @param {{ targetFile?: string, cwd?: string }} [options]
 */
export function listLearnedRules(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const targetFile = options.targetFile || path.join(cwd, 'CODING_STANDARDS.md');

  if (!fs.existsSync(targetFile)) {
    return Object.freeze([]);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split(/\r?\n/);
  const rules = [];
  let currentHeading = 'General';

  const RULE_REGEX = /^-\s+(.+?)\s+\(learned\s+(\d{4}-\d{2}-\d{2})\)\s+<!--\s*cid:([a-f0-9]+)\s+author:([a-zA-Z0-9_-]+)\s*-->/;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentHeading = line.replace(/^##\s+/, '').trim();
      continue;
    }

    const match = RULE_REGEX.exec(line.trim());
    if (match) {
      rules.push(
        Object.freeze({
          rule: match[1].trim(),
          date: match[2],
          contentHash: match[3],
          author: match[4],
          heading: currentHeading
        })
      );
    }
  }

  return Object.freeze(rules);
}
