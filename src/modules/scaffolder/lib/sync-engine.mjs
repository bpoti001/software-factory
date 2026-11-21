/**
 * Private Submodule: Two-Way Governance Auto-Sync Engine (`src/modules/scaffolder/lib/sync-engine.mjs`)
 * Governed by: ADR-0001 (Deep Modules), ADR-0003 (Hybrid ADR Parity), ADR-0009 (Foundry SDD & Two-Way Sync)
 */

import fs from 'node:fs';
import path from 'node:path';

export function capitalize(word) {
  const s = String(word || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function createDefaultContextMarkdown(cwd) {
  return `# Project Context & Architectural System of Record (\`CONTEXT.md\`)

## 1. Project Identity
- **System Name**: \`${path.basename(cwd)}\`

---

## 2. Canonical Architecture Map & Module Ownership

| Module / Subsystem | Repository Path | Responsibility & Public Seam | Governing ADRs |
|---|---|---|---|

---

## 3. Canonical ADR Registry (Bitbucket \`CONTEXT.md\` <-> Confluence Sync)

| ADR ID | Title | Status | Scope / Bounded Context | Confluence Page ID / URL | Local Mirror | Governing Jira Epic |
|---|---|---|---|---|---|---|

---

## 5. Intentional Removal & Delete-Zone (Anti-Zombie Code Ledger)

| Removed Path or Pattern | Date Removed | Why Removed | Canonical Replacement | Governing ADR |
|---|---|---|---|---|
| Direct cross-module imports into \`/lib/\` or \`/internal/\` | 2026-11-10 | Violates Deep Module seam locality | Import strictly from \`src/modules/<domain>/index.mjs\` | \`ADR-0001\` |
`;
}

function createDefaultAdrReadmeMarkdown() {
  return `# Architecture Decision Records (ADR Index)

| ADR | Title | Status | Date | Confluence Page | Jira Epic |
|---|---|---|---|---|---|
`;
}

/**
 * Two-way synchronizer for `CONTEXT.md` (Sections 2 & 3) and `docs/adr/README.md` (ADR-0009, S05 fix).
 * Adds newly created modules/ADRs and prunes rows referencing deleted modules or ADR files.
 * @param {{ cwd?: string }} [options]
 */
export function syncGovernanceDocs(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const contextPath = path.join(cwd, 'CONTEXT.md');
  const adrDir = path.join(cwd, 'docs', 'adr');
  const adrReadmePath = path.join(adrDir, 'README.md');

  fs.mkdirSync(adrDir, { recursive: true });

  if (!fs.existsSync(contextPath)) {
    fs.writeFileSync(contextPath, createDefaultContextMarkdown(cwd), 'utf8');
  }
  if (!fs.existsSync(adrReadmePath)) {
    fs.writeFileSync(adrReadmePath, createDefaultAdrReadmeMarkdown(), 'utf8');
  }

  let contextText = fs.readFileSync(contextPath, 'utf8');
  let adrReadmeText = fs.readFileSync(adrReadmePath, 'utf8');

  const addedModules = [];
  const removedModules = [];
  const addedAdrs = [];
  const removedAdrs = [];
  let contextUpdated = false;
  let adrReadmeUpdated = false;

  const srcModulesDir = path.join(cwd, 'src', 'modules');
  const diskModules = fs.existsSync(srcModulesDir)
    ? fs
        .readdirSync(srcModulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];
  const diskModuleSet = new Set(diskModules);

  // 1a. Prune deleted src/modules/<name> rows from CONTEXT.md Section 2
  const contextLines = contextText.split(/\r?\n/);
  const prunedContextLines = contextLines.filter((line) => {
    if (!line.trim().startsWith('|')) return true;
    const modMatch = line.match(/`src\/modules\/([a-zA-Z0-9_-]+)\/?`/);
    if (modMatch && !line.includes('ADR-') && line.split('|').length <= 6) {
      return true;
    }
    if (modMatch && line.includes('|') && !line.startsWith('| **ADR-')) {
      const modName = modMatch[1];
      if (!diskModuleSet.has(modName)) {
        removedModules.push(modName);
        contextUpdated = true;
        return false;
      }
    }
    return true;
  });
  contextText = prunedContextLines.join('\n');

  // 1b. Add newly created src/modules/<name> directories to CONTEXT.md Section 2
  for (const modName of diskModules) {
    const modRelPath = `src/modules/${modName}`;
    if (!contextText.includes(modRelPath)) {
      const row = `| **${capitalize(modName)} Module** | \`${modRelPath}/\` | Public domain seam at \`${modRelPath}/index.mjs\` | \`ADR-0001\` |`;
      const sec2Header = '| Module / Subsystem | Repository Path | Responsibility & Public Seam | Governing ADRs |';
      if (contextText.includes(sec2Header)) {
        const lines = contextText.split(/\r?\n/);
        const headerIdx = lines.findIndex((l) => l.includes(sec2Header));
        let insertIdx = headerIdx + 2;
        while (insertIdx < lines.length && lines[insertIdx].trim().startsWith('|')) {
          insertIdx++;
        }
        lines.splice(insertIdx, 0, row);
        contextText = lines.join('\n');
      } else {
        contextText += `\n${row}\n`;
      }
      addedModules.push(modName);
      contextUpdated = true;
    }
  }

  // 2a. Discover ADR files on disk
  const adrFiles = fs
    .readdirSync(adrDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'template.md')
    .sort();
  const diskAdrIds = new Set();
  for (const file of adrFiles) {
    const m = file.match(/^(\d{4})-/);
    if (m) diskAdrIds.add(`ADR-${m[1]}`);
  }

  // 2b. Prune deleted ADRs from CONTEXT.md Section 3 & docs/adr/README.md
  contextText = contextText
    .split(/\r?\n/)
    .filter((line) => {
      const adrRowMatch = line.match(/^\|\s*\*\*(ADR-\d{4})\*\*\s*\|/);
      if (adrRowMatch && !diskAdrIds.has(adrRowMatch[1])) {
        removedAdrs.push(adrRowMatch[1]);
        contextUpdated = true;
        return false;
      }
      return true;
    })
    .join('\n');

  adrReadmeText = adrReadmeText
    .split(/\r?\n/)
    .filter((line) => {
      const adrRowMatch = line.match(/^\|\s*\[(ADR-\d{4})\]/);
      if (adrRowMatch && !diskAdrIds.has(adrRowMatch[1])) {
        adrReadmeUpdated = true;
        return false;
      }
      return true;
    })
    .join('\n');

  // 2c. Add newly created ADRs to CONTEXT.md Section 3 & docs/adr/README.md
  const today = new Date().toISOString().slice(0, 10);
  for (const file of adrFiles) {
    const numMatch = file.match(/^(\d{4})-(.+)\.md$/);
    if (!numMatch) continue;
    const numStr = numMatch[1];
    const adrId = `ADR-${numStr}`;
    const relMirror = `docs/adr/${file}`;

    const content = fs.readFileSync(path.join(adrDir, file), 'utf8');
    const headingMatch = content.match(/^#\s+ADR-\d{4}:\s*(.+)$/m);
    const title = headingMatch
      ? headingMatch[1].trim()
      : numMatch[2].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (!contextText.includes(relMirror)) {
      const row = `| **${adrId}** | ${title} | \`accepted\` | \`src/modules/*\` | \`CONF-${adrId}\` (\`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/${numStr}\`) | [\`${relMirror}\`](./${relMirror}) | \`ARCH-${Number(numStr) + 1}\` |`;
      const sec3Header = '| ADR ID | Title | Status |';
      if (contextText.includes(sec3Header)) {
        const lines = contextText.split(/\r?\n/);
        const headerIdx = lines.findIndex((l) => l.includes(sec3Header));
        let insertIdx = headerIdx + 2;
        while (insertIdx < lines.length && lines[insertIdx].trim().startsWith('|')) {
          insertIdx++;
        }
        lines.splice(insertIdx, 0, row);
        contextText = lines.join('\n');
      } else {
        contextText += `\n${row}\n`;
      }
      addedAdrs.push(adrId);
      contextUpdated = true;
    }

    if (!adrReadmeText.includes(adrId) && !adrReadmeText.includes(file)) {
      const readmeRow = `| [${adrId}](./${file}) | ${title} | \`accepted\` | ${today} | \`CONF-${adrId}\` | \`ARCH-${Number(numStr) + 1}\` |`;
      adrReadmeText = `${adrReadmeText.trimEnd()}\n${readmeRow}\n`;
      adrReadmeUpdated = true;
    }
  }

  if (contextUpdated) {
    fs.writeFileSync(contextPath, contextText, 'utf8');
  }
  if (adrReadmeUpdated) {
    fs.writeFileSync(adrReadmePath, adrReadmeText, 'utf8');
  }

  return Object.freeze({
    cwd,
    addedModules: Object.freeze(addedModules),
    removedModules: Object.freeze(removedModules),
    addedAdrs: Object.freeze(addedAdrs),
    removedAdrs: Object.freeze(removedAdrs),
    contextUpdated,
    adrReadmeUpdated,
  });
}
