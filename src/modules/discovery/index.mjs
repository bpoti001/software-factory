/**
 * Public Deep Module Seam: Brownfield Practices Discovery, Codebase X-Ray, Git Archaeology & Retro-ADR Synthesis
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

import { discoverPractices } from './lib/discover.mjs';
import { analyzeCodebase } from './lib/xray-scanner.mjs';
import { mineGitArchaeology } from './lib/git-archaeology.mjs';
import { synthesizeRetroAdrs } from './lib/adr-synthesizer.mjs';

export {
  discoverPractices,
  analyzeCodebase,
  mineGitArchaeology,
  synthesizeRetroAdrs,
};
