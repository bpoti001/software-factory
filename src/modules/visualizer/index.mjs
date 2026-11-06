/**
 * Public Deep Module Seam: Multi-Layer Architecture Visualizer, Cognitive Tour & Interactive HTML Explorer
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

import { generateArchitectureVisuals } from './lib/mermaid-visuals.mjs';
import { generateArchitectureTour } from './lib/architecture-tour.mjs';
import { generateInteractiveExplorerHtml } from './lib/html-explorer.mjs';

export {
  generateArchitectureVisuals,
  generateArchitectureTour,
  generateInteractiveExplorerHtml,
};
