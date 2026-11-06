/**
 * Private Implementation: Zero-Dependency Interactive HTML Architecture Explorer (DRD-04.2)
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0008 (Brownfield Archaeology & Visualizer)
 */

/**
 * Escapes HTML special characters.
 * @param {string} str
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates a standalone, zero-dependency interactive HTML5 Architecture Explorer (`explorer.html`) (DRD-04.2).
 * @param {{
 *   xrayReport: any,
 *   gitReport?: any,
 *   retroAdrReport?: any
 * }} analysis
 */
export function generateInteractiveExplorerHtml(analysis = {}) {
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
  };
  const gitReport = analysis.gitReport || { totalCommitsAnalyzed: 0, hotspots: [], epochs: [] };
  const retro = analysis.retroAdrReport || { synthesizedAdrs: [] };

  const moduleCardsHtml = xray.modules
    .map((m) => {
      const adrsBadges = (m.governingAdrs || ['ADR-0001'])
        .map((a) => `<span class="badge badge-adr">${escapeHtml(a)}</span>`)
        .join(' ');
      const exportsBadges = (m.publicSymbols || [])
        .map((s) => `<code class="sym">${escapeHtml(s)}()</code>`)
        .join(' ');

      return `
      <div class="card module-card" data-module="${escapeHtml(m.name.toLowerCase())}">
        <div class="card-header">
          <h3>📦 ${escapeHtml(m.name)}</h3>
          <span class="badge ${m.isDeepModule ? 'badge-ok' : 'badge-warn'}">Depth Ratio: ${m.depthRatio}</span>
        </div>
        <p class="mono-path">Seam: ${escapeHtml(m.entryPoint || m.path)}</p>
        <div class="metrics-row">
          <span>Lines: <strong>${m.totalLines}</strong> (${m.hiddenLines} hidden)</span>
          <span>Fan-In: <strong>${m.fanIn}</strong></span>
          <span>Fan-Out: <strong>${m.fanOut}</strong></span>
          <span>Instability: <strong>${m.instability}</strong></span>
        </div>
        <div class="exports-box">
          <strong>Public Exports:</strong> ${exportsBadges || '<em>internal</em>'}
        </div>
        <div class="adr-row">${adrsBadges}</div>
      </div>`;
    })
    .join('\n');

  const adrRowsHtml = (retro.synthesizedAdrs || [])
    .map(
      (a) => `
      <tr>
        <td><strong>${escapeHtml(a.adrId)}</strong></td>
        <td>${escapeHtml(a.title)}</td>
        <td><code>${escapeHtml(a.dimension)}</code></td>
        <td><span class="badge ${a.status === 'accepted' ? 'badge-ok' : 'badge-warn'}">${escapeHtml(a.status)}</span></td>
        <td>${Math.round((a.adherenceRatio || 1) * 100)}%</td>
      </tr>`
    )
    .join('\n');

  const hotspotRowsHtml = (gitReport.hotspots || [])
    .slice(0, 12)
    .map(
      (h) => `
      <tr>
        <td><code>${escapeHtml(h.file)}</code></td>
        <td>${escapeHtml(h.moduleName)}</td>
        <td>${h.commits}</td>
        <td>${h.fanIn}</td>
        <td><strong>${h.gravityScore}</strong></td>
        <td><span class="badge ${h.doorClassification === 'One-Way Door' ? 'badge-danger' : 'badge-ok'}">${escapeHtml(h.doorClassification)}</span></td>
      </tr>`
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(xray.projectName)} — Architecture Intelligence Explorer</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --ok: #22c55e;
      --warn: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 2rem;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }
    h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
    .subtitle { color: var(--muted); font-size: 0.95rem; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-box {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: var(--accent); }
    .kpi-label { font-size: 0.85rem; color: var(--muted); }
    .search-bar {
      width: 100%;
      max-width: 420px;
      padding: 0.6rem 0.9rem;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      margin-bottom: 1.25rem;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.1rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .card-header h3 { margin: 0; font-size: 1.1rem; }
    .mono-path { font-family: monospace; color: var(--accent); font-size: 0.85rem; margin: 0.25rem 0 0.75rem 0; }
    .metrics-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.82rem;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }
    .exports-box { font-size: 0.85rem; margin-bottom: 0.75rem; }
    .sym {
      display: inline-block;
      background: #0f172a;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin: 0.1rem;
      font-size: 0.8rem;
    }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-ok { background: rgba(34, 197, 94, 0.2); color: var(--ok); }
    .badge-warn { background: rgba(245, 158, 11, 0.2); color: var(--warn); }
    .badge-danger { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .badge-adr { background: rgba(56, 189, 248, 0.15); color: var(--accent); margin-right: 0.25rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    th { background: rgba(15, 23, 42, 0.6); color: var(--muted); }
  </style>
</head>
<body>
  <header>
    <h1>🏛️ ${escapeHtml(xray.projectName)} — Architecture Intelligence Explorer</h1>
    <div class="subtitle">
      Runtime: <strong>${escapeHtml(xray.runtime)}</strong> |
      Test Runner: <strong>${escapeHtml(xray.testRunner)}</strong> |
      Layout: <strong>${escapeHtml(xray.layoutPattern)}</strong> |
      Governed by <strong>ADR-0008</strong>
    </div>
  </header>

  <section class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-value">${xray.modules.length}</div>
      <div class="kpi-label">Bounded Modules</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">${xray.totalFiles} / ${xray.totalLines}</div>
      <div class="kpi-label">Source Files / Lines</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">${xray.seamViolations.length}</div>
      <div class="kpi-label">Seam Violations</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">${(retro.synthesizedAdrs || []).length}</div>
      <div class="kpi-label">Synthesized Retro-ADRs</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">${gitReport.totalCommitsAnalyzed}</div>
      <div class="kpi-label">Git Commits Analyzed</div>
    </div>
  </section>

  <h2>1. Deep Module Seams & Coupling Inventory</h2>
  <input
    type="text"
    id="moduleFilter"
    class="search-bar"
    placeholder="Filter modules by name..."
    oninput="filterModules(this.value)"
  />
  <div class="cards-grid" id="moduleGrid">
    ${moduleCardsHtml}
  </div>

  <h2>2. Synthesized Retro-ADR Registry</h2>
  <table>
    <thead>
      <tr>
        <th>ADR ID</th>
        <th>Title</th>
        <th>Dimension</th>
        <th>Status</th>
        <th>Adherence</th>
      </tr>
    </thead>
    <tbody>
      ${adrRowsHtml}
    </tbody>
  </table>

  <h2>3. Git Archaeology Hotspots & Door Classification</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Module</th>
        <th>Commits</th>
        <th>Fan-In</th>
        <th>Gravity Score</th>
        <th>Door Type</th>
      </tr>
    </thead>
    <tbody>
      ${hotspotRowsHtml}
    </tbody>
  </table>

  <script>
    function filterModules(query) {
      const q = (query || '').toLowerCase().trim();
      const cards = document.querySelectorAll('.module-card');
      cards.forEach((card) => {
        const name = card.getAttribute('data-module') || '';
        card.style.display = !q || name.includes(q) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

  return Object.freeze({ html });
}
