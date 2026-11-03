/**
 * Public Deep Module Seam: Two-Axis PR Review & Merge Danger (`src/modules/review/index.mjs`)
 * Governed by: ADR-0001 (Deep Modules), ADR-0005 (Two-Axis PR Review & Merge Danger)
 */

export { assessMergeDanger } from './lib/merge-danger.mjs';
export { generateVisualPrBody } from './lib/visual-pr-formatter.mjs';
