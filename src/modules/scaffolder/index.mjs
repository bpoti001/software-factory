/**
 * Public Deep Module Seam: Foundry Spec-Driven Development (SDD), High-Velocity API Scaffolder & Governance Auto-Sync (`src/modules/scaffolder/index.mjs`)
 * Governed by: ADR-0001 (Deep Modules), ADR-0004 (Zero-Dependency CLI), ADR-0009 (Foundry SDD & Two-Way Auto-Sync)
 */

import { syncGovernanceDocs } from './lib/sync-engine.mjs';
import { scaffoldAdr, scaffoldDeepModule, writeApiRouter } from './lib/generator-engine.mjs';
import {
  initFoundrySpec,
  validateFoundrySpec,
  compileFoundrySpec,
  verifySpecParity,
  scaffoldApiService,
} from './lib/spec-engine.mjs';

export {
  syncGovernanceDocs,
  scaffoldAdr,
  scaffoldDeepModule,
  writeApiRouter,
  initFoundrySpec,
  validateFoundrySpec,
  compileFoundrySpec,
  verifySpecParity,
  scaffoldApiService,
};
