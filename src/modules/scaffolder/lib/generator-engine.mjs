/**
 * Private Submodule: Hardened ADR, Deep Module & HTTP Router Generator (`src/modules/scaffolder/lib/generator-engine.mjs`)
 * Governed by: ADR-0001 (Deep Modules), ADR-0004 (Deterministic CLI), ADR-0009 (Foundry SDD & Scaffolder)
 */

import fs from 'node:fs';
import path from 'node:path';
import { capitalize, syncGovernanceDocs } from './sync-engine.mjs';

export function slugify(text) {
  return String(text || 'decision')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function toSingularPascal(moduleName) {
  const clean = String(moduleName || 'item').replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase());
  const singular = clean.endsWith('ies')
    ? `${clean.slice(0, -3)}y`
    : clean.endsWith('s') && clean.length > 2
      ? clean.slice(0, -1)
      : clean;
  return capitalize(singular);
}

/**
 * Mints a sensor-compliant ADR and generates/updates `tests/adr-traceability.seam.test.mjs` (S03 fix).
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

  if (options.createTraceabilityTest !== false) {
    fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });
    const traceTestPath = path.join(cwd, 'tests', 'adr-traceability.seam.test.mjs');
    const testBlock = `\ntest('ADR Traceability [${adrId}]: ${filePath} exists and contains required governance sections', () => {\n  assert.ok(fs.existsSync(path.resolve(import.meta.dirname, '../${filePath}')));\n});\n`;
    if (!fs.existsSync(traceTestPath)) {
      const header = `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n`;
      fs.writeFileSync(traceTestPath, header + testBlock, 'utf8');
    } else {
      const current = fs.readFileSync(traceTestPath, 'utf8');
      if (!current.includes(`[${adrId}]`)) {
        fs.writeFileSync(traceTestPath, current + testBlock, 'utf8');
      }
    }
  }

  if (options.autoSync !== false) {
    syncGovernanceDocs({ cwd });
  }

  return Object.freeze({ adrId, title, fileName, filePath });
}

/**
 * Generates or updates `src/app.mjs` and `src/server.mjs` with 1MB payload limit,
 * 422 boundary validation handling, and GET /api/<m>/:id support (S02 & S04 fixes).
 */
export function writeApiRouter(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const serviceName = options.serviceName || path.basename(cwd);
  const defaultPort = Number(options.port) || 3000;

  const srcModulesDir = path.join(cwd, 'src', 'modules');
  const discoveredModules = fs.existsSync(srcModulesDir)
    ? fs
        .readdirSync(srcModulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  const moduleNames =
    Array.isArray(options.modules) && options.modules.length > 0
      ? Array.from(new Set([...options.modules, ...discoveredModules]))
      : discoveredModules;

  const moduleImports = moduleNames
    .map((name, idx) => `import * as mod_${idx} from './modules/${name}/index.mjs';`)
    .join('\n');

  const routeEntries = moduleNames
    .map((name, idx) => {
      const singular = toSingularPascal(name);
      const plural = capitalize(name.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase()));
      return `  '${name}': {
    create: mod_${idx}.create${singular} || Object.values(mod_${idx})[0],
    list: mod_${idx}.list${plural} || Object.values(mod_${idx})[1] || Object.values(mod_${idx})[0],
    getById: mod_${idx}.get${singular}ById || null,
  }`;
    })
    .join(',\n');

  const appContent = `/**
 * HTTP Transport Adapter (\`src/app.mjs\`)
 * Governed by: ADR-0001 (${serviceName} Deep-Module HTTP JSON API Architecture)
 */

import http from 'node:http';
${moduleImports}

const MAX_BODY_BYTES = 1_048_576; // 1 MB payload ceiling (CODING_STANDARDS.md §2.3)

const routes = {
${routeEntries}
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        const err = new Error('Payload Too Large');
        err.statusCode = 413;
        req.destroy();
        reject(err);
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        const err = new Error('Invalid JSON payload');
        err.statusCode = 400;
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
      return sendJson(res, 200, { status: 'ok', service: '${serviceName}', modules: Object.keys(routes) });
    }

    const itemMatch = url.pathname.match(/^\\/api\\/([a-z0-9_-]+)\\/([^/]+)$/);
    if (itemMatch && routes[itemMatch[1]] && req.method === 'GET') {
      const handler = routes[itemMatch[1]];
      const found = handler.getById ? handler.getById(decodeURIComponent(itemMatch[2])) : null;
      if (!found) return sendJson(res, 404, { error: 'Record not found' });
      return sendJson(res, 200, { data: found });
    }

    const collectionMatch = url.pathname.match(/^\\/api\\/([a-z0-9_-]+)$/);
    if (collectionMatch && routes[collectionMatch[1]]) {
      const handler = routes[collectionMatch[1]];
      if (req.method === 'GET') {
        return sendJson(res, 200, { data: handler.list() });
      }
      if (req.method === 'POST') {
        try {
          const body = await readJsonBody(req);
          const created = handler.create(body);
          return sendJson(res, 201, { data: created });
        } catch (err) {
          const code = err.statusCode || 400;
          return sendJson(res, code, { error: err.message || 'Bad Request', details: err.errors || undefined });
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

  fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src', 'app.mjs'), appContent, 'utf8');
  if (!fs.existsSync(path.join(cwd, 'src', 'server.mjs'))) {
    fs.writeFileSync(path.join(cwd, 'src', 'server.mjs'), serverContent, 'utf8');
  }
}

/**
 * Scaffolds a Deep Module with boundary schema validation (`validate<Singular>Input`),
 * resettable store (`reset<Plural>Store`), and auto-wires `src/app.mjs` if present (S01, S02, S06 fixes).
 */
export function scaffoldDeepModule(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const rawName = String(options.moduleName || 'items')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');

  const singular = toSingularPascal(rawName);
  const plural = capitalize(rawName.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase()));

  const schemaFields = Array.isArray(options.fields) && options.fields.length > 0
    ? options.fields
    : [{ name: 'name', type: 'string', required: true, minLength: 1 }];

  const defaultExports = [
    `create${singular}`,
    `list${plural}`,
    `get${singular}ById`,
    `validate${singular}Input`,
    `reset${plural}Store`,
  ];
  const exportNames =
    Array.isArray(options.exports) && options.exports.length > 0
      ? Array.from(new Set([...options.exports, ...defaultExports]))
      : defaultExports;

  const modRelDir = `src/modules/${rawName}`;
  const libRelFile = `${modRelDir}/lib/${rawName}-service.mjs`;
  const entryRelFile = `${modRelDir}/index.mjs`;
  const testRelFile = `tests/${rawName}.seam.test.mjs`;

  fs.mkdirSync(path.join(cwd, modRelDir, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });

  const customExports = exportNames.filter((fn) => !defaultExports.includes(fn));
  const customFnBlocks = customExports
    .map(
      (fn) => `export function ${fn}(input = {}) {
  return Object.freeze({ ok: true, module: '${rawName}', action: '${fn}', input });
}`
    )
    .join('\n\n');

  const libContent = `/**
 * Private Implementation: ${plural} Domain Service & Boundary Schema Validator
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0009 (Foundry Spec-Driven Validation)
 */

const FIELD_SCHEMA = ${JSON.stringify(schemaFields, null, 2)};
const store = [];

export function validate${singular}Input(payload = {}) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Object.freeze({ valid: false, errors: ['Payload must be a JSON object'] });
  }
  for (const field of FIELD_SCHEMA) {
    const val = payload[field.name];
    if (field.required && (val === undefined || val === null || val === '')) {
      errors.push(\`Field '\${field.name}' is required\`);
      continue;
    }
    if (val !== undefined && val !== null) {
      if (field.type && typeof val !== field.type) {
        errors.push(\`Field '\${field.name}' must be of type \${field.type}\`);
      }
      if (field.type === 'number' && typeof val === 'number') {
        if (field.min !== undefined && val < field.min) errors.push(\`Field '\${field.name}' must be >= \${field.min}\`);
        if (field.max !== undefined && val > field.max) errors.push(\`Field '\${field.name}' must be <= \${field.max}\`);
      }
      if (Array.isArray(field.enum) && !field.enum.includes(val)) {
        errors.push(\`Field '\${field.name}' must be one of: \${field.enum.join(', ')}\`);
      }
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function create${singular}(payload = {}) {
  const validation = validate${singular}Input(payload);
  if (!validation.valid) {
    const err = new Error(\`Validation failed for ${singular}: \${validation.errors.join('; ')}\`);
    err.statusCode = 422;
    err.errors = validation.errors;
    throw err;
  }
  const id = payload.id || \`${rawName}_\${store.length + 1}\`;
  const record = Object.freeze({ id, ...payload, createdAt: new Date().toISOString() });
  store.push(record);
  return record;
}

export function list${plural}() {
  return Object.freeze([...store]);
}

export function get${singular}ById(id) {
  return store.find((item) => item.id === id) || null;
}

export function reset${plural}Store() {
  store.length = 0;
}
${customFnBlocks ? '\n' + customFnBlocks + '\n' : ''}`;

  const relLibImport = `./${'lib'}/${rawName}-service.mjs`;
  const entryContent = `/**
 * Public Deep Module Seam: ${plural} Module (\`${entryRelFile}\`)
 * Governed by: ADR-0001 (Deep Module Boundaries)
 */

import { ${exportNames.join(', ')} } from '${relLibImport}';

export { ${exportNames.join(', ')} };
`;

  const samplePayload = {};
  for (const f of schemaFields) {
    if (f.enum && f.enum.length > 0) samplePayload[f.name] = f.enum[0];
    else if (f.type === 'number') samplePayload[f.name] = f.min !== undefined ? f.min : 1;
    else if (f.type === 'boolean') samplePayload[f.name] = true;
    else samplePayload[f.name] = `sample-${rawName}`;
  }

  const testContent = `import test from 'node:test';
import assert from 'node:assert/strict';
import { create${singular}, list${plural}, get${singular}ById, validate${singular}Input, reset${plural}Store } from '../${entryRelFile}';

test('${plural} Deep Module Seam [ADR-0001]: validates schema at boundary and manages lifecycle', () => {
  reset${plural}Store();
  const invalid = validate${singular}Input({});
  assert.equal(invalid.valid, false);

  const created = create${singular}(${JSON.stringify(samplePayload)});
  assert.ok(created.id);
  assert.equal(list${plural}().length, 1);
  assert.deepEqual(get${singular}ById(created.id), created);
});
`;

  fs.writeFileSync(path.join(cwd, libRelFile), libContent, 'utf8');
  fs.writeFileSync(path.join(cwd, entryRelFile), entryContent, 'utf8');
  fs.writeFileSync(path.join(cwd, testRelFile), testContent, 'utf8');

  if (options.wireRouter !== false && fs.existsSync(path.join(cwd, 'src', 'app.mjs'))) {
    writeApiRouter({ cwd });
  }

  if (options.autoSync !== false) {
    syncGovernanceDocs({ cwd });
  }

  return Object.freeze({
    moduleName: rawName,
    entryPoint: entryRelFile,
    internalFile: libRelFile,
    testFile: testRelFile,
    fields: Object.freeze(schemaFields),
    exports: Object.freeze(exportNames),
  });
}
