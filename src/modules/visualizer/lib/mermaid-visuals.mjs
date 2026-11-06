/**
 * Private Implementation: 5-Lens Mermaid Architecture Visualizer (DRD-04.1)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

/**
 * Sanitizes a node identifier for Mermaid syntax.
 * @param {string} id
 */
function sanitizeMermaidId(id) {
  return String(id).replace(/[^A-Za-z0-9_]/g, '_');
}

/**
 * Generates the 5-Lens Visual Architecture Blueprint in Markdown + Mermaid (DRD-04.1).
 * @param {{
 *   xrayReport: any,
 *   gitReport?: any,
 *   retroAdrReport?: any
 * }} analysis
 */
export function generateArchitectureVisuals(analysis = {}) {
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
  const gitReport = analysis.gitReport || { totalCommitsAnalyzed: 0, hotspots: [], epochs: [] };
  const retro = analysis.retroAdrReport || { synthesizedAdrs: [] };

  // Lens 1: C4 System Context & Container Architecture
  const transportsLabel =
    xray.infrastructure?.transports?.length > 0
      ? xray.infrastructure.transports.join(', ').toUpperCase()
      : 'Programmatic ESM API';
  const dbLabel =
    xray.infrastructure?.databases?.length > 0
      ? xray.infrastructure.databases.join(', ').toUpperCase()
      : 'Living Docs & File State (CONTEXT.md, .planning/)';

  const moduleNodesC4 = xray.modules
    .map((m) => {
      const id = `MOD_${sanitizeMermaidId(m.name)}`;
      return `        ${id}["📦 ${m.name}<br/>(${m.totalLines} lines | Depth ${m.depthRatio})"]`;
    })
    .join('\n');

  const c4ContextAndContainerMermaid = `flowchart TB
    Actor["👤 Engineer / CI Pipeline / Autonomous Agent"]
    subgraph SystemBoundary["🏛️ ${xray.projectName} (${xray.runtime} | ${xray.layoutPattern})"]
        Transport["🖥️ Transport & Delivery Layer<br/>(${transportsLabel})"]
        subgraph CoreModules["🔒 Core Bounded Contexts / Deep Modules"]
${moduleNodesC4 || '            MOD_CORE["Core Application"]'}
        end
        StateStore["🗄️ Persistence & Governance State<br/>(${dbLabel})"]
    end
    Actor -->|"Invokes commands / API"| Transport
    Transport -->|"Calls narrow public seams"| CoreModules
    CoreModules <-->|"Reads & persists state"| StateStore`;

  // Lens 2: Deep Module Seam & Dependency Topology
  const seamNodes = xray.modules
    .map((m) => {
      const id = `M_${sanitizeMermaidId(m.name)}`;
      const exportsList = m.publicSymbols.slice(0, 3).join(', ') || 'internal';
      return `    ${id}["📦 ${m.name}<br/>Seam: ${m.entryPoint || m.path}<br/>Exports: ${exportsList}<br/>Depth Ratio: ${m.depthRatio} | Fan-In: ${m.fanIn}"]`;
    })
    .join('\n');

  const uniqueCleanEdges = new Set();
  const edgeLines = [];
  for (const e of xray.edges) {
    const fromId = `M_${sanitizeMermaidId(e.fromModule)}`;
    const toId = `M_${sanitizeMermaidId(e.toModule)}`;
    const key = `${fromId}->${toId}:${e.isSeamViolation}`;
    if (uniqueCleanEdges.has(key)) continue;
    uniqueCleanEdges.add(key);

    if (e.isSeamViolation) {
      edgeLines.push(`    ${fromId} -.->|"❌ SEAM LEAK (${e.toTarget})"| ${toId}`);
    } else {
      edgeLines.push(`    ${fromId} -->|"✅ Public Seam"| ${toId}`);
    }
  }

  const moduleSeamAndCouplingMermaid = `flowchart LR
${seamNodes || '    M_ROOT["Root Module"]'}
${edgeLines.join('\n')}`;

  // Lens 3: ADR Governance Coverage Matrix
  const adrNodes = [];
  const adrEdges = [];
  for (const m of xray.modules) {
    const modId = `GM_${sanitizeMermaidId(m.name)}`;
    const adrs = m.governingAdrs?.length > 0 ? m.governingAdrs : ['ADR-0001'];
    adrNodes.push(`    ${modId}["📦 ${m.name} (${m.path})"]`);
    for (const adrId of adrs) {
      const aId = sanitizeMermaidId(adrId);
      adrNodes.push(`    ${aId}["📜 ${adrId}"]`);
      adrEdges.push(`    ${aId} -->|"governs"| ${modId}`);
    }
  }
  const uniqueAdrNodes = Array.from(new Set(adrNodes)).join('\n');
  const uniqueAdrEdges = Array.from(new Set(adrEdges)).join('\n');

  const adrGovernanceCoverageMermaid = `flowchart LR
${uniqueAdrNodes || '    ADR_0001["📜 ADR-0001"] --> GM_CORE["📦 Core"]'}
${uniqueAdrEdges}`;

  // Lens 4: Git Churn vs. Architectural Gravity Risk Quadrant
  const oneWayHotspots = (gitReport.hotspots || []).filter((h) => h.doorClassification === 'One-Way Door');
  const twoWayHotspots = (gitReport.hotspots || []).filter((h) => h.doorClassification === 'Two-Way Door');

  const churnVsGravityQuadrantMermaid = `flowchart TB
    subgraph OneWayZone["🔴 One-Way Door / High-Gravity Zone (Requires ADR & Rollback Runbook)"]
${
  oneWayHotspots
    .slice(0, 6)
    .map(
      (h, idx) =>
        `        OW_${idx}["⚠️ ${h.file}<br/>(Gravity: ${h.gravityScore} | Commits: ${h.commits} | Fan-In: ${h.fanIn})"]`
    )
    .join('\n') || '        OW_0["No High-Risk Hotspots Detected"]'
}
    end
    subgraph TwoWayZone["🟢 Two-Way Door / Localized Zone (Safe Iterative Evolution)"]
${
  twoWayHotspots
    .slice(0, 6)
    .map(
      (h, idx) =>
        `        TW_${idx}["✅ ${h.file}<br/>(Gravity: ${h.gravityScore} | Commits: ${h.commits})"]`
    )
    .join('\n') || '        TW_0["Standard Module Implementation Files"]'
}
    end`;

  // Lens 5: End-to-End Execution Call Tree
  const topModules = xray.modules.slice(0, 4);
  const seqParticipants = topModules
    .map((m) => `    participant ${sanitizeMermaidId(m.name)} as 📦 ${m.name} (${m.entryPoint || m.path})`)
    .join('\n');
  const seqCalls = topModules
    .map((m) => {
      const fnName = m.publicSymbols[0] || 'execute';
      return `    Entry->>${sanitizeMermaidId(m.name)}: ${fnName}() via public seam\n    ${sanitizeMermaidId(m.name)}-->>Entry: Immutable result payload`;
    })
    .join('\n');

  const executionCallTreeMermaid = `sequenceDiagram
    autonumber
    actor Caller as 👤 Caller / CLI
    participant Entry as 🖥️ Transport Adapter
${seqParticipants || '    participant Core as 📦 Core Module'}
    Caller->>Entry: Invoke command / request
${seqCalls || '    Entry->>Core: execute()'}
    Entry-->>Caller: Verified output & receipt`;

  const markdown = `# Visual Architecture Blueprint: \`${xray.projectName}\`

> **Generated by Software Factory Visual Intelligence Engine (\`ADR-0008\`)**
> - **Runtime**: \`${xray.runtime}\` | **Test Runner**: \`${xray.testRunner}\` | **Layout**: \`${xray.layoutPattern}\`
> - **Scale**: \`${xray.totalFiles}\` code files (\`${xray.totalLines}\` lines) across \`${xray.modules.length}\` bounded module(s)
> - **Seam Health**: \`${xray.seamViolations.length}\` seam violation(s), \`${xray.circularDependencies.length}\` circular dependency cycle(s)

---

## Lens 1: C4 System Context & Container Architecture

\`\`\`mermaid
${c4ContextAndContainerMermaid}
\`\`\`

---

## Lens 2: Deep Module Seam & Dependency Topology

\`\`\`mermaid
${moduleSeamAndCouplingMermaid}
\`\`\`

### Module Depth & Coupling Metrics Table

| Module | Public Entry Point | Exported Symbols | Total Lines | Hidden Lines | Depth Ratio | Fan-In | Fan-Out | Instability ($I$) | Governing ADRs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${xray.modules
  .map(
    (m) =>
      `| **\`${m.name}\`** | \`${m.entryPoint || 'none'}\` | \`${m.publicSymbols.join(', ') || '-'}\` | ${m.totalLines} | ${m.hiddenLines} | **${m.depthRatio}** | ${m.fanIn} | ${m.fanOut} | ${m.instability} | ${(m.governingAdrs || []).map((a) => `\`${a}\``).join(', ') || '`ADR-0001`'} |`
  )
  .join('\n')}

---

## Lens 3: ADR Governance Coverage Matrix

\`\`\`mermaid
${adrGovernanceCoverageMermaid}
\`\`\`

### Synthesized Retro-ADR Status Summary

| ADR ID | Title | Dimension | Status | Adherence |
| :--- | :--- | :--- | :--- | :--- |
${(retro.synthesizedAdrs || [])
  .map(
    (a) =>
      `| **\`${a.adrId}\`** | ${a.title} | \`${a.dimension}\` | \`${a.status}\` | ${Math.round((a.adherenceRatio || 1) * 100)}% |`
  )
  .join('\n')}

---

## Lens 4: Git Churn vs. Architectural Gravity Risk Quadrant

\`\`\`mermaid
${churnVsGravityQuadrantMermaid}
\`\`\`

---

## Lens 5: End-to-End Execution Call Tree

\`\`\`mermaid
${executionCallTreeMermaid}
\`\`\`
`;

  return Object.freeze({
    markdown,
    lenses: Object.freeze({
      c4ContextAndContainerMermaid,
      moduleSeamAndCouplingMermaid,
      adrGovernanceCoverageMermaid,
      churnVsGravityQuadrantMermaid,
      executionCallTreeMermaid,
    }),
  });
}
