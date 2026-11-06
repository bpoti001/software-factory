/**
 * Private Implementation: Evidence-Backed Retro-ADR & Domain Glossary Synthesizer (DRD-03)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0007 (AI-DLC Synthesis), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

import fs from 'node:fs';
import path from 'node:path';
import { analyzeCodebase } from './xray-scanner.mjs';
import { mineGitArchaeology } from './git-archaeology.mjs';

/**
 * Formats a sensor-compliant ADR markdown document (ADR-0000, ADR-0007, ADR-0008).
 * @param {{
 *   adrId: string,
 *   title: string,
 *   status: string,
 *   date: string,
 *   scope: string,
 *   contextText: string,
 *   decisionText: string,
 *   evidenceBullets: string[],
 *   alternativesBullets: string[],
 *   consequencesPositive: string[],
 *   consequencesTradeoffs: string[]
 * }} spec
 */
function buildAdrMarkdown(spec) {
  const evidenceLines = spec.evidenceBullets.map((b) => `- ${b}`).join('\n');
  const altLines = spec.alternativesBullets.map((b) => `- ${b}`).join('\n');
  const posLines = spec.consequencesPositive.map((b) => `- ${b}`).join('\n');
  const tradeLines = spec.consequencesTradeoffs.map((b) => `- ${b}`).join('\n');

  return `# ${spec.adrId}: ${spec.title}

- **Status**: \`${spec.status}\`
- **Date**: ${spec.date}
- **Deciders**: \`@architect\` (Synthesized via Brownfield Archaeology Engine \`ADR-0008\`)
- **Scope / Bounded Context**: ${spec.scope}

---

## 1. Context & Problem Statement

${spec.contextText}

### Discovered Codebase & Git Evidence
${evidenceLines}

---

## 2. Decision

${spec.decisionText}

---

## 3. Alternatives Considered

${altLines}

---

## 4. Consequences

### Positive
${posLines}

### Negative / Trade-offs
${tradeLines}
`;
}

/**
 * Extracts domain glossary terms from discovered modules and public exported symbols.
 * @param {ReturnType<typeof analyzeCodebase>} xray
 */
function extractDomainGlossary(xray) {
  const terms = [];
  for (const mod of xray.modules) {
    const capitalized =
      mod.name.charAt(0).toUpperCase() + mod.name.slice(1).replace(/[-_]([a-z])/g, (_, c) => ` ${c.toUpperCase()}`);
    const exportsSummary =
      mod.publicSymbols.length > 0
        ? `Exposes public seam operations: \`${mod.publicSymbols.slice(0, 5).join('`, `')}\`.`
        : 'Encapsulates domain logic within its module directory.';

    terms.push(
      Object.freeze({
        term: `${capitalized} Domain`,
        boundedContext: `\`${mod.path}\``,
        definition: `Bounded context responsible for ${mod.name} capabilities (${mod.totalLines} lines, Depth Ratio ${mod.depthRatio}). ${exportsSummary}`,
        avoidedSynonyms: `Legacy ${capitalized} Helper, Raw ${capitalized} Util`,
        sourceFiles: Object.freeze([mod.entryPoint || mod.path]),
      })
    );
  }

  if (terms.length === 0) {
    terms.push(
      Object.freeze({
        term: 'Core Application Module',
        boundedContext: '`src/`',
        definition: `Primary application logic discovered in ${xray.projectName}.`,
        avoidedSynonyms: 'Misc, Unstructured Utils',
        sourceFiles: Object.freeze(['package.json']),
      })
    );
  }

  return Object.freeze(terms);
}

/**
 * Synthesizes evidence-backed Retro-ADRs, Domain Glossary, and CONTEXT.md blueprint from a codebase (DRD-03).
 * @param {{
 *   cwd?: string,
 *   xrayReport?: ReturnType<typeof analyzeCodebase>,
 *   gitReport?: ReturnType<typeof mineGitArchaeology>,
 *   writeFiles?: boolean,
 *   outputDir?: string
 * }} [options]
 */
export function synthesizeRetroAdrs(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const xray = options.xrayReport || analyzeCodebase({ cwd });
  const gitReport = options.gitReport || mineGitArchaeology({ cwd, xrayReport: xray });
  const today = new Date().toISOString().slice(0, 10);

  const synthesizedAdrs = [];
  const wayfinderContestTickets = [];

  // Dimension 1: Runtime & Module System
  const extDeps = xray.externalPackages.filter((p) => !p.startsWith('node:'));
  const runtimeAdr = {
    adrId: 'ADR-0001',
    title: `Standardize on ${xray.runtime.toUpperCase()} Runtime and ${xray.layoutPattern} Layout`,
    dimension: 'runtime-and-modules',
    status: 'accepted',
    adherenceRatio: 1.0,
    fileName: '0001-runtime-and-module-system.md',
    evidence: [
      `Detected primary runtime: \`${xray.runtime}\` across ${xray.totalFiles} source files (${xray.totalLines} lines).`,
      `Repository layout pattern classified as \`${xray.layoutPattern}\` with ${xray.modules.length} discovered module(s).`,
      `External package footprint: ${extDeps.length === 0 ? 'Zero third-party npm dependencies (pure native runtime)' : extDeps.join(', ')}.`,
    ],
  };
  runtimeAdr.markdown = buildAdrMarkdown({
    adrId: runtimeAdr.adrId,
    title: runtimeAdr.title,
    status: runtimeAdr.status,
    date: today,
    scope: `All modules in \`${xray.projectName}\``,
    contextText: `The \`${xray.projectName}\` repository requires a consistent module loading contract and directory topology so engineers and autonomous agents resolve imports deterministically.`,
    decisionText: `Adopt \`${xray.runtime}\` as the canonical language runtime organized under a \`${xray.layoutPattern}\` directory structure.`,
    evidenceBullets: runtimeAdr.evidence,
    alternativesBullets: [
      'Ad-hoc mixed CommonJS and ES Module scripts without a unified directory convention.',
      'Heavy external bundling layers where native module resolution suffices.',
    ],
    consequencesPositive: [
      'Deterministic module resolution across all discovered subsystems.',
      'Predictable onboarding and static dependency analysis.',
    ],
    consequencesTradeoffs: [
      'All new modules must conform to the established runtime and directory structure.',
    ],
  });
  synthesizedAdrs.push(Object.freeze(runtimeAdr));

  // Dimension 2: Boundary Encapsulation & Seam Discipline
  const totalEdges = Math.max(1, xray.edges.length);
  const cleanEdges = totalEdges - xray.seamViolations.length;
  const seamAdherence = Number((cleanEdges / totalEdges).toFixed(2));
  const hasSeamLeaks = xray.seamViolations.length > 0 || xray.circularDependencies.length > 0;
  const boundaryStatus = hasSeamLeaks ? 'drift-detected' : 'accepted';

  const deepModulesCount = xray.modules.filter((m) => m.isDeepModule).length;
  const boundaryEvidence = [
    `${deepModulesCount}/${xray.modules.length} module(s) expose a public \`index.*\` seam with encapsulated internal implementation files.`,
    `Cross-module dependency edges analyzed: ${xray.edges.length} (${cleanEdges} clean seam imports, ${xray.seamViolations.length} private seam violation(s)).`,
    `Circular dependency cycles detected: ${xray.circularDependencies.length}.`,
  ];
  if (xray.seamViolations.length > 0) {
    for (const v of xray.seamViolations) {
      boundaryEvidence.push(
        `Seam violation detected: \`${v.fromFile}\` (in \`${v.fromModule}\`) imports private path \`${v.toTarget}\` (in \`${v.toModule}\`).`
      );
    }
  }

  const boundaryAdr = {
    adrId: 'ADR-0002',
    title: 'Enforce Deep Module Public Seams and Prohibit Cross-Module Internal Imports',
    dimension: 'boundary-encapsulation',
    status: boundaryStatus,
    adherenceRatio: seamAdherence,
    fileName: '0002-module-boundary-encapsulation.md',
    evidence: boundaryEvidence,
  };
  boundaryAdr.markdown = buildAdrMarkdown({
    adrId: boundaryAdr.adrId,
    title: boundaryAdr.title,
    status: boundaryAdr.status,
    date: today,
    scope: xray.modules.map((m) => `\`${m.path}\``).join(', ') || '`src/`',
    contextText: `To prevent tight coupling and cascading breakage across ${xray.modules.length} module(s), callers must interact strictly through public module interfaces rather than reaching into private implementation files.`,
    decisionText: `Each module in \`${xray.projectName}\` must expose a narrow public seam (\`index.*\`) and encapsulate implementation details inside private subfolders (\`lib/\`). Cross-module imports into private subfolders and circular dependencies are prohibited.`,
    evidenceBullets: boundaryAdr.evidence,
    alternativesBullets: [
      'Allowing unrestricted cross-module imports into internal helper files.',
      'Re-exporting all internal helpers via barrel `export *` statements.',
    ],
    consequencesPositive: [
      'High module depth ratios and isolated blast radius during refactoring.',
      'Clear public seams for integration and contract testing.',
    ],
    consequencesTradeoffs: [
      hasSeamLeaks
        ? `Requires remediating ${xray.seamViolations.length} active seam violation(s) and ${xray.circularDependencies.length} cycle(s).`
        : 'Requires maintaining strict seam verification in CI/CD.',
    ],
  });
  synthesizedAdrs.push(Object.freeze(boundaryAdr));

  if (hasSeamLeaks) {
    wayfinderContestTickets.push(
      Object.freeze({
        ticketId: 'DT-SEAM-01',
        question: `How should ${xray.seamViolations.length} cross-module private import violation(s) be resolved?`,
        competingOptions: [
          'Promote required capabilities to the target module public index.mjs seam',
          'Refactor caller logic into the owning bounded context',
        ],
      })
    );
  }

  // Dimension 3: Persistence, Data & State Architecture
  const dbs = xray.infrastructure.databases;
  const persistenceTitle =
    dbs.length > 0
      ? `Standardize Persistence on ${dbs.join(', ').toUpperCase()}`
      : 'File-Backed Living Documents & Deterministic JSON State Persistence';
  const persistenceAdr = {
    adrId: 'ADR-0003',
    title: persistenceTitle,
    dimension: 'persistence-and-state',
    status: dbs.length > 1 ? 'proposed' : 'accepted',
    adherenceRatio: dbs.length > 1 ? 0.65 : 1.0,
    fileName: '0003-persistence-and-state-architecture.md',
    evidence: [
      dbs.length > 0
        ? `Detected database/persistence drivers in repository manifests: \`${dbs.join('`, `')}\`.`
        : 'No external relational/NoSQL database driver required; state is persisted deterministically via local filesystem artifacts.',
      `Living documentation state detected: CONTEXT.md (${xray.infrastructure.hasContextMd}), .planning/ (${xray.infrastructure.hasGsdPlanning}).`,
    ],
  };
  persistenceAdr.markdown = buildAdrMarkdown({
    adrId: persistenceAdr.adrId,
    title: persistenceAdr.title,
    status: persistenceAdr.status,
    date: today,
    scope: 'Persistence & State Layer',
    contextText: `Application state and durable records in \`${xray.projectName}\` require a well-defined persistence boundary to govern schema evolution and rollback safety.`,
    decisionText:
      dbs.length > 0
        ? `Use \`${dbs.join(', ')}\` as the primary persistence mechanism and treat all schema mutations as One-Way Door changes requiring rollback runbooks.`
        : `Persist state deterministically in version-controlled Markdown and JSON artifacts without external database runtime dependencies.`,
    evidenceBullets: persistenceAdr.evidence,
    alternativesBullets: [
      'Unstructured ad-hoc state mutation across unrelated modules.',
      'Introducing multiple redundant database clients for the same domain.',
    ],
    consequencesPositive: [
      'Clear data ownership and predictable operational recovery.',
    ],
    consequencesTradeoffs: [
      'Schema or state-format modifications require explicit migration verification.',
    ],
  });
  synthesizedAdrs.push(Object.freeze(persistenceAdr));

  // Dimension 4: Interface, API & Transport Boundary
  const transports = xray.infrastructure.transports;
  const transportLabel = transports.length > 0 ? transports.join(' + ').toUpperCase() : 'Module API';
  const transportAdr = {
    adrId: 'ADR-0004',
    title: `Expose Capabilities via ${transportLabel} Transport Adapter`,
    dimension: 'api-and-transport',
    status: 'accepted',
    adherenceRatio: 1.0,
    fileName: '0004-api-and-transport-boundary.md',
    evidence: [
      `Detected transport / delivery adapters: \`${transports.length > 0 ? transports.join('`, `') : 'programmatic-esm'}\`.`,
      `High-gravity entry points from Git archaeology: ${gitReport.hotspots.slice(0, 3).map((h) => `\`${h.file}\` (gravity ${h.gravityScore})`).join(', ') || 'initial commit state'}.`,
    ],
  };
  transportAdr.markdown = buildAdrMarkdown({
    adrId: transportAdr.adrId,
    title: transportAdr.title,
    status: transportAdr.status,
    date: today,
    scope: 'Transport & Delivery Layer',
    contextText: `External consumers and automation pipelines need a stable interface to invoke \`${xray.projectName}\` capabilities without coupling to internal module implementations.`,
    decisionText: `Route external invocations through thin ${transportLabel} transport adapters that delegate domain execution to the underlying Deep Module public seams.`,
    evidenceBullets: transportAdr.evidence,
    alternativesBullets: [
      'Embedding domain business logic directly inside CLI or HTTP route handlers.',
    ],
    consequencesPositive: [
      'Transport layer remains thin and replaceable while domain modules stay pure.',
    ],
    consequencesTradeoffs: [
      'Public CLI flags and HTTP route contracts must maintain backward compatibility.',
    ],
  });
  synthesizedAdrs.push(Object.freeze(transportAdr));

  // Dimension 5: Verification, Test Strategy & CI Governance
  const verificationAdr = {
    adrId: 'ADR-0005',
    title: `Enforce Public Seam Testing via ${xray.testRunner} and Automated CI Gates`,
    dimension: 'verification-and-ci',
    status: 'accepted',
    adherenceRatio: 1.0,
    fileName: '0005-verification-and-ci-governance.md',
    evidence: [
      `Detected test runner: \`${xray.testRunner}\`.`,
      `Detected CI pipeline definitions: ${xray.infrastructure.ciPipelines.length > 0 ? xray.infrastructure.ciPipelines.map((c) => `\`${c}\``).join(', ') : 'local verification scripts'}.`,
      `Git commits analyzed in archaeology scan: ${gitReport.totalCommitsAnalyzed}.`,
    ],
  };
  verificationAdr.markdown = buildAdrMarkdown({
    adrId: verificationAdr.adrId,
    title: verificationAdr.title,
    status: verificationAdr.status,
    date: today,
    scope: '`tests/`, CI Pipelines',
    contextText: `Architectural invariants and module contracts degrade over time unless verified automatically on every change using ${xray.testRunner}.`,
    decisionText: `Execute automated public-seam tests via \`${xray.testRunner}\` and enforce governance verification before merge.`,
    evidenceBullets: verificationAdr.evidence,
    alternativesBullets: [
      'Testing private internal implementation files directly, which breaks during safe internal refactors.',
      'Manual-only pull request verification without deterministic test receipts.',
    ],
    consequencesPositive: [
      'High confidence in module seam behavior and zero regression drift.',
    ],
    consequencesTradeoffs: [
      'Every feature slice must include seam-level automated tests.',
    ],
  });
  synthesizedAdrs.push(Object.freeze(verificationAdr));

  const glossaryTerms = extractDomainGlossary(xray);

  const suggestedGlossaryMarkdown = `# Domain Glossary (\`GLOSSARY.md\`)

| Canonical Term | Bounded Context | Precise Definition | Avoided Synonyms | Source |
|---|---|---|---|---|
${glossaryTerms
  .map(
    (t) =>
      `| **${t.term}** | ${t.boundedContext} | ${t.definition} | ${t.avoidedSynonyms} | \`${t.sourceFiles[0]}\` |`
  )
  .join('\n')}
`;

  const suggestedContextMarkdown = `# Project Context & Architectural System of Record (\`CONTEXT.md\`)

## 1. Project Identity & Discovered Stack
- **System Name**: \`${xray.projectName}\`
- **Runtime**: \`${xray.runtime}\`
- **Test Runner**: \`${xray.testRunner}\`
- **Layout Pattern**: \`${xray.layoutPattern}\`

## 2. Canonical Architecture Map & Module Ownership

| Module / Subsystem | Repository Path | Public Seam | Depth Ratio | Fan-In / Fan-Out | Governing ADRs |
|---|---|---|---|---|---|
${xray.modules
  .map(
    (m) =>
      `| **${m.name} Module** | \`${m.path}/\` | \`${m.entryPoint || m.path}\` (${m.publicSymbols.join(', ') || 'internal'}) | \`${m.depthRatio}\` | \`${m.fanIn} / ${m.fanOut}\` | ${m.governingAdrs.length > 0 ? m.governingAdrs.map((a) => `\`${a}\``).join(', ') : '`ADR-0001`, `ADR-0002`'} |`
  )
  .join('\n')}

## 3. Synthesized Retro-ADR Registry

| ADR ID | Title | Status | Dimension | Adherence | Local Mirror |
|---|---|---|---|---|---|
${synthesizedAdrs
  .map(
    (a) =>
      `| **${a.adrId}** | ${a.title} | \`${a.status}\` | \`${a.dimension}\` | \`${Math.round(a.adherenceRatio * 100)}%\` | [\`docs/adr/${a.fileName}\`](./docs/adr/${a.fileName}) |`
  )
  .join('\n')}
`;

  if (options.writeFiles && options.outputDir) {
    const targetAdrDir = path.resolve(cwd, options.outputDir);
    fs.mkdirSync(targetAdrDir, { recursive: true });
    for (const adr of synthesizedAdrs) {
      fs.writeFileSync(path.join(targetAdrDir, adr.fileName), adr.markdown, 'utf8');
    }
  }

  return Object.freeze({
    synthesizedAdrs: Object.freeze(synthesizedAdrs),
    glossaryTerms,
    suggestedGlossaryMarkdown,
    suggestedContextMarkdown,
    wayfinderContestTickets: Object.freeze(wayfinderContestTickets),
  });
}
