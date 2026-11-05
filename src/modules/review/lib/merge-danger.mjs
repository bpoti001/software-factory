/**
 * Private Implementation: Merge Danger Scorer (One-Way vs Two-Way Door + Blast Radius)
 * Governed by: ADR-0001 (Deep Modules), ADR-0005 (Two-Axis PR Review & Merge Danger)
 */

const ONE_WAY_DOOR_FILE_PATTERNS = [
  { pattern: /(^|\/)(migrations?|db\/migrate|schema)\/|\.sql$/i, reason: 'Modifies database schema or migration files' },
  { pattern: /(^|\/)(package\.json|requirements\.txt|pom\.xml|go\.mod)$/i, reason: 'Alters package manifest or external dependencies' },
  { pattern: /^docs\/(adr|rfc)\//i, reason: 'Introduces or modifies Architecture Decision Records / RFCs' },
  { pattern: /^src\/(auth|security)\//i, reason: 'Touches authentication or zero-trust security boundaries' },
];

const DESTRUCTIVE_DIFF_REGEX = /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE\s+TABLE|ALTER\s+TABLE)\b/i;

const SYSTEM_WIDE_ROOT_FILES = /^(CONTEXT\.md|GLOSSARY\.md|CODING_STANDARDS\.md|AGENTS\.md|package\.json|\.github\/)/;

/**
 * Computes the Merge Danger (Door + Blast Radius) for a set of changed files and optional diff.
 * @param {{ changedFiles?: string[], diffText?: string, hasNewAdrOrRfc?: boolean }} input
 */
export function assessMergeDanger(input = {}) {
  const changedFiles = Array.isArray(input.changedFiles) ? input.changedFiles : [];
  const diffText = String(input.diffText || '');
  const reasons = [];

  for (const rule of ONE_WAY_DOOR_FILE_PATTERNS) {
    if (changedFiles.some((f) => rule.pattern.test(f))) {
      reasons.push(rule.reason);
    }
  }

  if (DESTRUCTIVE_DIFF_REGEX.test(diffText)) {
    reasons.push('Diff contains destructive or irreversible SQL schema statements');
  }

  if (input.hasNewAdrOrRfc && !reasons.some((r) => r.includes('Architecture Decision'))) {
    reasons.push('Includes new ADR or RFC architectural contract');
  }

  const isOneWayDoor = reasons.length > 0;
  const door = isOneWayDoor ? 'One-Way Door' : 'Two-Way Door';

  // Determine Blast Radius:
  const touchedModules = new Set();
  let touchesSystemRoot = false;

  for (const file of changedFiles) {
    if (SYSTEM_WIDE_ROOT_FILES.test(file) || /(^|\/)migrations?\//i.test(file)) {
      touchesSystemRoot = true;
    }
    const modMatch = file.match(/^src\/modules\/([^/]+)\//);
    if (modMatch) {
      touchedModules.add(modMatch[1]);
    }
  }

  let blastRadius = 'Localized';
  if (touchesSystemRoot || touchedModules.size > 1) {
    blastRadius = 'System-Wide';
  } else if (changedFiles.length > 2) {
    blastRadius = 'Module-Wide';
  }

  const operationsGateRequired = isOneWayDoor || blastRadius === 'System-Wide';
  const hasRollbackPlan = Boolean(input.operationsRollbackText && input.operationsRollbackText.trim().length >= 10);
  const operationsGate = Object.freeze({
    required: operationsGateRequired,
    passed: !operationsGateRequired || hasRollbackPlan,
  });

  return Object.freeze({
    door,
    blastRadius,
    reasons: Object.freeze(reasons),
    requiresArchitectSignOff: isOneWayDoor || blastRadius === 'System-Wide',
    operationsGate,
  });
}
