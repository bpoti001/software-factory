/**
 * Private Implementation: High-Velocity API Service Scaffolder & Governance Auto-Sync Engine
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0004 (Zero-Dependency CLI), ADR-0009 (High-Velocity Scaffolder & Auto-Sync)
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Converts a string into a URL/filename-safe kebab-case slug.
 * @param {string} text
 */
function slugify(text) {
  return String(text || 'decision')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Capitalizes the first letter of a word.
 * @param {string} word
 */
function capitalize(word) {
  const s = String(word || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Infers singular PascalCase noun from a module name (e.g., "accounts" -> "Account", "shipments" -> "Shipment").
 * @param {string} moduleName
 */
function toSingularPascal(moduleName) {
  const clean = String(moduleName || 'item').replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase());
  const singular = clean.endsWith('ies')
    ? `${clean.slice(0, -3)}y`
    : clean.endsWith('s') && clean.length > 2
      ? clean.slice(0, -1)
      : clean;
  return capitalize(singular);
}

/**
 * Automatically synchronizes `CONTEXT.md` (Section 2 & Section 3) and `docs/adr/README.md`
 * with the actual modules in `src/modules/*` and ADR files in `docs/adr/*.md` (ADR-0009).
 * @param {{ cwd?: string }} [options]
 */
export function syncGovernanceDocs(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const contextPath = path.join(cwd, 'CONTEXT.md');
  const adrDir = path.join(cwd, 'docs', 'adr');
  const adrReadmePath = path.join(adrDir, 'README.md');

  fs.mkdirSync(adrDir, { recursive: true });

  if (!fs.existsSync(contextPath)) {
    const initialContext = `# Project Context & Architectural System of Record (\`CONTEXT.md\`)

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
    fs.writeFileSync(contextPath, initialContext, 'utf8');
  }

  if (!fs.existsSync(adrReadmePath)) {
    const initialAdrReadme = `# Architecture Decision Records (ADR Index)

| ADR | Title | Status | Date | Confluence Page | Jira Epic |
|---|---|---|---|---|---|
`;
    fs.writeFileSync(adrReadmePath, initialAdrReadme, 'utf8');
  }

  let contextText = fs.readFileSync(contextPath, 'utf8');
  let adrReadmeText = fs.readFileSync(adrReadmePath, 'utf8');

  const addedModules = [];
  const addedAdrs = [];
  let contextUpdated = false;
  let adrReadmeUpdated = false;

  // 1. Discover all src/modules/* directories and ensure they are mapped in CONTEXT.md Section 2
  const srcModulesDir = path.join(cwd, 'src', 'modules');
  if (fs.existsSync(srcModulesDir)) {
    const entries = fs
      .readdirSync(srcModulesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const modName of entries) {
      const modRelPath = `src/modules/${modName}`;
      if (!contextText.includes(modRelPath)) {
        const row = `| **${capitalize(modName)} Module** | \`${modRelPath}/\` | Public domain seam at \`${modRelPath}/index.mjs\` | \`ADR-0001\` |`;
        const sec2TableHeader = '| Module / Subsystem | Repository Path | Responsibility & Public Seam | Governing ADRs |';
        if (contextText.includes(sec2TableHeader)) {
          const lines = contextText.split(/\r?\n/);
          const headerIdx = lines.findIndex((l) => l.includes(sec2TableHeader));
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
  }

  // 2. Discover all docs/adr/NNNN-*.md files and ensure they are registered in CONTEXT.md Section 3 & docs/adr/README.md
  const adrFiles = fs
    .readdirSync(adrDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'template.md')
    .sort();

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
    addedAdrs: Object.freeze(addedAdrs),
    contextUpdated,
    adrReadmeUpdated,
  });
}

/**
 * Scaffolds a new sensor-compliant ADR in `docs/adr/NNNN-slug.md` and auto-syncs `CONTEXT.md` & `docs/adr/README.md` (ADR-0009).
 * @param {{
 *   cwd?: string,
 *   title: string,
 *   scope?: string,
 *   context?: string,
 *   decision?: string,
 *   autoSync?: boolean
 * }} options
 */
export function scaffoldAdr(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const adrDir = path.join(cwd, 'docs', 'adr');
  fs.mkdirSync(adrDir, { recursive: true });

  const existing = fs
    .readdirSync(adrDir)
    .map((f) => {
      const m = f.match(/^(\d{4})-/);
      return m ? Number(m[1]) : -1;
    })
    .filter((n) => n >= 0);

  const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  const numStr = String(nextNum).padStart(4, '0');
  const adrId = `ADR-${numStr}`;
  const title = String(options.title || 'Architectural Decision').trim();
  const fileName = `${numStr}-${slugify(title)}.md`;
  const filePath = `docs/adr/${fileName}`;
  const scope = options.scope || '`src/modules/*`';
  const today = new Date().toISOString().slice(0, 10);

  const contextBody =
    options.context ||
    `The system requires a clear, governed architectural contract for ${title} within ${scope}.`;
  const decisionBody =
    options.decision ||
    `Adopt ${title} encapsulated behind a narrow Deep Module public seam (\`index.mjs\`) governed by ${adrId}.`;

  const markdown = `# ${adrId}: ${title}

- **Status**: \`accepted\`
- **Date**: ${today}
- **Deciders**: \`@architect\`, Engineering
- **Confluence Source**: \`CONF-${adrId}\` (\`https://your-org.atlassian.net/wiki/spaces/ARCH/pages/${numStr}\`)
- **Governing Jira Epic**: \`ARCH-${nextNum + 1}\`
- **Scope / Bounded Context**: ${scope}

---

## 1. Context & Problem Statement

${contextBody}

---

## 2. Decision

${decisionBody}

---

## 3. Alternatives Considered

- **Unencapsulated Ad-Hoc Implementation**: Rejected because bypassing Deep Module boundaries increases blast radius and coupling.

---

## 4. Consequences

### Positive
- Enforces narrow public seam contracts and deterministic verification.

### Negative / Trade-offs
- Requires seam-level automated tests in \`tests/\`.
`;

  fs.writeFileSync(path.join(cwd, filePath), markdown, 'utf8');

  if (options.autoSync !== false) {
    syncGovernanceDocs({ cwd });
  }

  return Object.freeze({
    adrId,
    title,
    fileName,
    filePath,
  });
}

/**
 * Scaffolds a Deep Module (`src/modules/<name>/index.mjs` + `lib/<name>-service.mjs` + `tests/<name>.seam.test.mjs`)
 * and auto-registers it in `CONTEXT.md` (ADR-0001, ADR-0009).
 * @param {{
 *   cwd?: string,
 *   moduleName: string,
 *   exports?: string[],
 *   autoSync?: boolean
 * }} options
 */
export function scaffoldDeepModule(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const rawName = String(options.moduleName || 'items')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');

  const singular = toSingularPascal(rawName);
  const plural = capitalize(rawName.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase()));

  const defaultExports = [
    `create${singular}`,
    `list${plural}`,
    `get${singular}ById`,
  ];
  const exportNames =
    Array.isArray(options.exports) && options.exports.length > 0
      ? options.exports
      : defaultExports;

  const modRelDir = `src/modules/${rawName}`;
  const libRelFile = `${modRelDir}/lib/${rawName}-service.mjs`;
  const entryRelFile = `${modRelDir}/index.mjs`;
  const testRelFile = `tests/${rawName}.seam.test.mjs`;

  fs.mkdirSync(path.join(cwd, modRelDir, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });

  // Build private implementation functions
  const fnBlocks = exportNames
    .map((fnName) => {
      if (fnName.startsWith('create')) {
        return `export function ${fnName}(payload = {}) {
  const id = payload.id || \`${rawName}_\${store.length + 1}\`;
  const record = Object.freeze({ id, ...payload, createdAt: new Date().toISOString() });
  store.push(record);
  return record;
}`;
      }
      if (fnName.startsWith('list')) {
        return `export function ${fnName}() {
  return Object.freeze([...store]);
}`;
      }
      if (fnName.startsWith('get')) {
        return `export function ${fnName}(id) {
  return store.find((item) => item.id === id) || null;
}`;
      }
      return `export function ${fnName}(input = {}) {
  return Object.freeze({ ok: true, module: '${rawName}', action: '${fnName}', input });
}`;
    })
    .join('\n\n');

  const libContent = `/**
 * Private Implementation: ${plural} Domain Service
 * Governed by: ADR-0001 (Deep Module Boundaries)
 */

const store = [];

${fnBlocks}
`;

  const relLibImport = `./${'lib'}/${rawName}-service.mjs`;
  const entryContent = `/**
 * Public Deep Module Seam: ${plural} Module (\`${entryRelFile}\`)
 * Governed by: ADR-0001 (Deep Module Boundaries)
 */

import { ${exportNames.join(', ')} } from '${relLibImport}';

export { ${exportNames.join(', ')} };
`;

  const primaryFn = exportNames[0];
  const testContent = `import test from 'node:test';
import assert from 'node:assert/strict';
import { ${exportNames.join(', ')} } from '../${entryRelFile}';

test('${plural} Deep Module Seam [ADR-0001]: ${primaryFn} operates cleanly through public index.mjs seam', () => {
  const result = ${primaryFn}({ name: 'sample-${rawName}' });
  assert.ok(result);
});
`;

  fs.writeFileSync(path.join(cwd, libRelFile), libContent, 'utf8');
  fs.writeFileSync(path.join(cwd, entryRelFile), entryContent, 'utf8');
  fs.writeFileSync(path.join(cwd, testRelFile), testContent, 'utf8');

  if (options.autoSync !== false) {
    syncGovernanceDocs({ cwd });
  }

  return Object.freeze({
    moduleName: rawName,
    entryPoint: entryRelFile,
    internalFile: libRelFile,
    testFile: testRelFile,
    exports: Object.freeze(exportNames),
  });
}

/**
 * Scaffolds a complete, runnable, zero-dependency Node.js HTTP JSON API Service
 * with Deep Modules, `/health` + `/api/<module>` routes, seam & HTTP integration tests,
 * and pre-synchronized `CONTEXT.md` + `docs/adr/` governance in < 1s (ADR-0009).
 * @param {{
 *   targetDir: string,
 *   name?: string,
 *   modules?: string[],
 *   port?: number
 * }} options
 */
export function scaffoldApiService(options = {}) {
  const targetDir = path.resolve(options.targetDir || process.cwd());
  const serviceName = String(options.name || path.basename(targetDir) || 'api-service').trim();
  const domainModules =
    Array.isArray(options.modules) && options.modules.length > 0
      ? options.modules.map((m) => String(m).trim().toLowerCase()).filter(Boolean)
      : ['users', 'items'];
  const defaultPort = Number(options.port) || 3000;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src', 'modules'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'docs', 'adr'), { recursive: true });

  // 1. Write clean package.json
  const pkgJson = {
    name: serviceName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'node src/server.mjs',
      test: 'node --test tests/*.test.mjs',
    },
  };
  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');

  // 2. Write CODING_STANDARDS.md & GLOSSARY.md
  fs.writeFileSync(
    path.join(targetDir, 'CODING_STANDARDS.md'),
    `# Coding Standards (\`${serviceName}\`)

1. **Deep Module Encapsulation (\`ADR-0001\`)**: Every domain module under \`src/modules/<domain>/\` exposes only \`index.mjs\` and hides implementation inside \`lib/\`.
2. **Public Seam Testing**: All tests in \`tests/\` import strictly from public seams (\`src/modules/<domain>/index.mjs\` or \`src/app.mjs\`).
`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(targetDir, 'GLOSSARY.md'),
    `# Domain Glossary (\`${serviceName}\`)

| Canonical Term | Bounded Context | Definition |
|---|---|---|
${domainModules
  .map((m) => `| **${toSingularPascal(m)}** | \`src/modules/${m}/\` | Core domain entity managed by the ${m} bounded context. |`)
  .join('\n')}
`,
    'utf8'
  );

  // 3. Mint ADR-0001 for the API Service
  scaffoldAdr({
    cwd: targetDir,
    title: `${serviceName} Deep-Module HTTP JSON API Architecture`,
    scope: '`src/app.mjs`, `src/modules/*`',
    context: `${serviceName} requires a fast, maintainable HTTP JSON API architecture where transport routing is decoupled from domain logic across ${domainModules.join(', ')}.`,
    decision: `Use native Node.js ESM HTTP routing in \`src/app.mjs\` delegating strictly to Deep Module public seams (\`src/modules/<domain>/index.mjs\`).`,
    autoSync: false,
  });

  // 4. Scaffold each requested Deep Module
  const createdModules = [];
  for (const modName of domainModules) {
    createdModules.push(
      scaffoldDeepModule({
        cwd: targetDir,
        moduleName: modName,
        autoSync: false,
      })
    );
  }

  // 5. Generate src/app.mjs (HTTP JSON router wired to each module's public seam)
  const moduleImports = createdModules
    .map((m, idx) => `import * as mod_${idx} from './modules/${m.moduleName}/index.mjs';`)
    .join('\n');

  const routeEntries = createdModules
    .map((m, idx) => {
      const createFn = m.exports.find((e) => e.startsWith('create')) || m.exports[0];
      const listFn = m.exports.find((e) => e.startsWith('list')) || m.exports[1] || m.exports[0];
      return `  '${m.moduleName}': { create: mod_${idx}.${createFn}, list: mod_${idx}.${listFn} }`;
    })
    .join(',\n');

  const appContent = `/**
 * HTTP Transport Adapter (\`src/app.mjs\`)
 * Governed by: ADR-0001 (${serviceName} Deep-Module HTTP JSON API Architecture)
 */

import http from 'node:http';
${moduleImports}

const routes = {
${routeEntries}
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

export function createApiServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        service: '${serviceName}',
        modules: Object.keys(routes),
      });
    }

    const match = url.pathname.match(/^\\/api\\/([a-z0-9_-]+)$/);
    if (match && routes[match[1]]) {
      const handler = routes[match[1]];
      if (req.method === 'GET') {
        return sendJson(res, 200, { data: handler.list() });
      }
      if (req.method === 'POST') {
        try {
          const body = await readJsonBody(req);
          const created = handler.create(body);
          return sendJson(res, 201, { data: created });
        } catch {
          return sendJson(res, 400, { error: 'Invalid JSON payload' });
        }
      }
    }

    return sendJson(res, 404, { error: 'Not Found' });
  });
}
`;

  const serverContent = `import { createApiServer } from './app.mjs';

const port = Number(process.env.PORT || ${defaultPort});
const server = createApiServer();

server.listen(port, () => {
  console.log(\`🚀 ${serviceName} listening on http://localhost:\${port}\`);
});
`;

  fs.writeFileSync(path.join(targetDir, 'src', 'app.mjs'), appContent, 'utf8');
  fs.writeFileSync(path.join(targetDir, 'src', 'server.mjs'), serverContent, 'utf8');

  // 6. Generate HTTP API Integration Test (`tests/api.integration.test.mjs`)
  const firstMod = domainModules[0];
  const apiTestContent = `import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../src/app.mjs';

test('API Service Integration [ADR-0001]: GET /health and POST/GET /api/${firstMod} respond with valid JSON', async () => {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = \`http://127.0.0.1:\${port}\`;

  try {
    const healthRes = await fetch(\`\${baseUrl}/health\`);
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.equal(healthBody.status, 'ok');
    assert.equal(healthBody.service, '${serviceName}');

    const createRes = await fetch(\`\${baseUrl}/api/${firstMod}\`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'first-record' }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.ok(created.data.id);

    const listRes = await fetch(\`\${baseUrl}/api/${firstMod}\`);
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(Array.isArray(listBody.data));
    assert.ok(listBody.data.length >= 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
`;
  fs.writeFileSync(path.join(targetDir, 'tests', 'api.integration.test.mjs'), apiTestContent, 'utf8');

  // 7. Auto-sync CONTEXT.md and docs/adr/README.md
  const syncReport = syncGovernanceDocs({ cwd: targetDir });

  return Object.freeze({
    targetDir,
    name: serviceName,
    port: defaultPort,
    modules: Object.freeze(domainModules),
    createdModules: Object.freeze(createdModules),
    syncReport,
  });
}
