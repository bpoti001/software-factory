/**
 * Private Implementation: CONTEXT.md & docs/adr/ Registry Parser
 * Governed by: ADR-0001 (Deep Modules), ADR-0003 (Hybrid ADR Parity)
 */

/**
 * Parses the Canonical ADR Registry markdown table from CONTEXT.md.
 * @param {string} contextMarkdown
 * @returns {Array<{ adrId: string, title: string, status: string, localMirrorPath: string }>}
 */
export function parseAdrRegistry(contextMarkdown = '') {
  const lines = String(contextMarkdown).split(/\r?\n/);
  const entries = [];

  for (const line of lines) {
    if (!line.trim().startsWith('|') || !line.includes('ADR-')) {
      continue;
    }

    const cells = line
      .split(/(?<!\\)\|/)
      .map((cell) => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (cells.length < 6) {
      continue;
    }

    const idMatch = cells[0].match(/ADR-\d{4}/);
    if (!idMatch) {
      continue;
    }

    const adrId = idMatch[0];
    const title = cells[1].replace(/`/g, '').trim();
    const status = cells[2].replace(/`/g, '').trim();
    const mirrorCell = cells[5];

    const pathMatch = mirrorCell.match(/docs\/adr\/[a-zA-Z0-9._-]+\.md/);
    const localMirrorPath = pathMatch ? pathMatch[0] : '';

    entries.push(
      Object.freeze({
        adrId,
        title,
        status,
        localMirrorPath,
      })
    );
  }

  return entries;
}

/**
 * Verifies that every accepted ADR in CONTEXT.md exists on disk and in docs/adr/README.md.
 * @param {{ contextMarkdown?: string, adrReadmeMarkdown?: string, existingAdrFiles?: string[] }} input
 */
export function checkAdrParity(input = {}) {
  const { contextMarkdown = '', adrReadmeMarkdown = '', existingAdrFiles = [] } = input;
  if (!contextMarkdown.trim()) {
    return [];
  }

  const registry = parseAdrRegistry(contextMarkdown);
  const existingSet = new Set(existingAdrFiles.map((f) => f.replace(/^\.\//, '')));
  const violations = [];

  for (const entry of registry) {
    if (entry.status !== 'accepted') {
      continue;
    }

    const mirrorBasename = entry.localMirrorPath.split('/').pop() || '';
    const existsOnDisk = entry.localMirrorPath && existingSet.has(entry.localMirrorPath);
    const indexedInReadme =
      !adrReadmeMarkdown ||
      adrReadmeMarkdown.includes(entry.adrId) ||
      (mirrorBasename && adrReadmeMarkdown.includes(mirrorBasename));

    if (!existsOnDisk || !indexedInReadme) {
      violations.push(
        Object.freeze({
          adrId: entry.adrId,
          mirrorPath: entry.localMirrorPath,
          message: `${entry.adrId} references '${entry.localMirrorPath}', which is missing from ${
            !existsOnDisk ? 'docs/adr/ on disk' : 'docs/adr/README.md'
          } (ADR-0003).`,
        })
      );
    }
  }

  return violations;
}
