/**
 * Public Deep Module Seam: Self-Learning Rule Loop & Overseer Enhancement Backlog
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC), ADR-0010 (Overseer Governance)
 */

export {
  checkRuleConflict,
  recordLearnedRule,
  listLearnedRules,
} from './lib/rules.mjs';

export {
  REQUIRED_RESEARCH_FACTORY_SKILLS,
  buildOverseerAuditReport,
  recordOverseerNudge,
} from './lib/overseer-nudge.mjs';
