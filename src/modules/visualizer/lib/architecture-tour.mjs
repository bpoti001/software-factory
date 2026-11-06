/**
 * Private Implementation: "Imagine the Project" Cognitive Architecture Tour Generator (DRD-05)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

/**
 * Generates a 5-part cognitive onboarding narrative (`ARCHITECTURE_TOUR.md`) helping engineers
 * and architects understand and imagine the system (DRD-05).
 * @param {{
 *   xrayReport: any,
 *   gitReport?: any,
 *   retroAdrReport?: any
 * }} analysis
 */
export function generateArchitectureTour(analysis = {}) {
  const xray = analysis.xrayReport || {
    projectName: 'unknown-project',
    runtime: 'unknown',
    testRunner: 'unknown',
    layoutPattern: 'organic',
    totalFiles: 0,
    totalLines: 0,
    modules: [],
    edges: [],
    seamViolations: [],
    circularDependencies: [],
    infrastructure: { databases: [], transports: [], ciPipelines: [] },
  };
  const gitReport = analysis.gitReport || { totalCommitsAnalyzed: 0, epochs: [], hotspots: [], deleteZoneCandidates: [] };
  const retro = analysis.retroAdrReport || { synthesizedAdrs: [] };

  const section1 = `## 1. The 60-Second Mental Model & Core Metaphor

Imagine **\`${xray.projectName}\`** as a coordinated network of **${xray.modules.length} encapsulated bounded contexts** running on **\`${xray.runtime}\`** (${xray.totalFiles} files, ${xray.totalLines} lines of code) organized under a **\`${xray.layoutPattern}\`** architecture:

- **How to Picture It**: Instead of a tangled monolith where any file can mutate any other file, each subsystem in \`${xray.projectName}\` acts as a **Deep Module** (\`ADR-0001\`). Callers interact strictly through narrow front doors (\`index.*\`), while complex algorithms, parsers, and domain rules live inside private \`lib/\` rooms behind the seam.
- **Delivery & Persistence**: External callers invoke the system via **\`${xray.infrastructure?.transports?.join(', ') || 'ESM API'}\`**, while state is governed via **\`${xray.infrastructure?.databases?.join(', ') || 'Living Documentation & Deterministic JSON Artifacts'}\`**.`;

  const moduleBullets = xray.modules
    .map(
      (m) =>
        `- **\`${m.name}\` Module (\`${m.path}\`)**:
  - **Public Seam**: \`${m.entryPoint || m.path}\` -> exports \`${m.publicSymbols.join('()`, `') || 'internal'}()\`
  - **Encapsulation Depth**: ${m.totalLines} total lines (${m.hiddenLines} hidden inside ${m.internalFiles.length} internal file(s); **Depth Ratio: ${m.depthRatio}**)
  - **Coupling Profile**: Fan-In \`${m.fanIn}\` (dependents) | Fan-Out \`${m.fanOut}\` (dependencies) | Instability \`${m.instability}\`
  - **Governing ADRs**: ${(m.governingAdrs || []).map((a) => `\`${a}\``).join(', ') || '`ADR-0001`'}`
    )
    .join('\n');

  const section2 = `## 2. What Has Been Built (Capability & Deep Module Inventory)

Below is the complete inventory of subsystems currently built and active in \`${xray.projectName}\`:

${moduleBullets || '- Core application files discovered in root.'}`;

  const tracedSteps = xray.modules
    .slice(0, 5)
    .map(
      (m, idx) =>
        `${idx + 1}. **Step ${idx + 1} — \`${m.name}\` Seam (\`${m.entryPoint || m.path}\`)**: Invokes \`${m.publicSymbols[0] || 'execute'}()\`, delegating internal work across ${m.internalFiles.length} encapsulated implementation file(s).`
    )
    .join('\n');

  const section3 = `## 3. Anatomy of an Execution Flow (Traced Walkthrough)

When a command or request enters \`${xray.projectName}\`, execution flows through deterministic seams:

${tracedSteps || '1. Entry point invokes core module handler.'}

- **Cross-Module Edges Verified**: ${xray.edges.length} directed module-to-module dependency link(s) (${xray.seamViolations.length} seam violation(s), ${xray.circularDependencies.length} circular dependency cycle(s)).`;

  const adrSummaries = (retro.synthesizedAdrs || [])
    .map(
      (a) =>
        `- **\`${a.adrId}\` (${a.title})** — Status: \`${a.status}\` (${Math.round((a.adherenceRatio || 1) * 100)}% adherence)`
    )
    .join('\n');

  const epochSummaries = (gitReport.epochs || [])
    .slice(0, 6)
    .map((e) => `- \`${e.date}\` [\`${e.commitHash}\`] (**${e.category}**): ${e.subject}`)
    .join('\n');

  const section4 = `## 4. Why It Is Shaped This Way (Architectural Decisions & Epochs)

### Core Architectural Decisions (Synthesized & Verified)
${adrSummaries || '- Governed by repository ADRs in `docs/adr/`.'}

### Key Historical Epochs from Git Archaeology (${gitReport.totalCommitsAnalyzed} commits analyzed)
${epochSummaries || '- Initial repository baseline.'}`;

  const oneWayFiles = (gitReport.hotspots || [])
    .filter((h) => h.doorClassification === 'One-Way Door')
    .slice(0, 5)
    .map((h) => `- **\`${h.file}\`** (Module: \`${h.moduleName}\`, Gravity Score: \`${h.gravityScore}\`, Fan-In: \`${h.fanIn}\`)`)
    .join('\n');

  const deleteZoneItems = (gitReport.deleteZoneCandidates || [])
    .map((d) => `- **Forbidden**: ${d.pattern} — *${d.reason}*`)
    .join('\n');

  const section5 = `## 5. Safe Extension Guide & One-Way Door Warnings

### Where to Build Next (Two-Way Door Extension Seams)
- To add a new capability within an existing domain, implement the private logic inside \`src/modules/<domain>/lib/\` and expose only a named function in \`src/modules/<domain>/index.mjs\`.
- Write public-seam tests in \`tests/<domain>.seam.test.mjs\` using \`${xray.testRunner}\` without importing private \`/lib/\` files.

### High-Gravity One-Way Door Zones (Require ADR/RFC & Rollback Plan)
${oneWayFiles || '- Package manifests (`package.json`), `CONTEXT.md`, and `docs/adr/*`.'}

### Delete-Zone & Anti-Patterns to Never Copy
${deleteZoneItems || '- Never import private `/lib/` or `/internal/` files across module boundaries (`ADR-0001`).\n- Never use `export *` barrel re-exports in module entry points (`ADR-0001`).'}`;

  const sections = [section1, section2, section3, section4, section5];

  const markdown = `# Imagine & Understand the Project: \`${xray.projectName}\` Architecture Tour

> **Cognitive Onboarding Guide (\`ADR-0008\` — DRD-05)**
> Automatically synthesized from live codebase structure, module seams, and Git archaeology.

---

${sections.join('\n\n---\n\n')}
`;

  return Object.freeze({
    markdown,
    sections: Object.freeze(sections),
  });
}
