/**
 * Public Deep Module Seam: Deterministic Governance Sensors
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis Architecture)
 */

export {
  runSensors,
  checkRequiredSections,
  checkClaimSources,
  checkTraceability,
  emitVerificationReceipt,
  checkVerificationReceipt
} from './lib/sensors.mjs';
