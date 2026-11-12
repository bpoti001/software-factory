/**
 * Private Submodule: Foundry Spec-Driven Development (SDD) Engine (`src/modules/scaffolder/lib/spec-engine.mjs`)
 * Governed by: ADR-0001 (Deep Modules), ADR-0004 (Deterministic CLI), ADR-0009 (Foundry Spec-Driven Development)
 */

import fs from 'node:fs';
import path from 'node:path';
import { syncGovernanceDocs } from './sync-engine.mjs';
import { toSingularPascal, scaffoldAdr, scaffoldDeepModule, writeApiRouter } from './generator-engine.mjs';

const VALID_FIELD_TYPES = new Set(['string', 'number', 'boolean']);

function inferDefaultFields(modName) {
  if (/order|booking|purchase/.test(modName)) {
    return [
      { name: 'customerId', type: 'string', required: true },
      { name: 'totalCents', type: 'number', required: true, min: 1 },
      { name: 'status', type: 'string', required: true, enum: ['pending', 'paid', 'cancelled'] },
    ];
  }
  if (/payment|invoice|charge|transaction/.test(modName)) {
    return [
      { name: 'amountCents', type: 'number', required: true, min: 1 },
      { name: 'currency', type: 'string', required: true, enum: ['USD', 'EUR', 'GBP'] },
    ];
  }
  if (/user|account|customer|member/.test(modName)) {
    return [
      { name: 'name', type: 'string', required: true },
      { name: 'role', type: 'string', required: false, enum: ['admin', 'member', 'viewer'] },
    ];
  }
  return [
    { name: 'name', type: 'string', required: true },
    { name: 'status', type: 'string', required: false, enum: ['active', 'archived'] },
  ];
}

function buildSampleValidPayload(fields) {
  const payload = {};
  for (const f of fields) {
    if (Array.isArray(f.enum) && f.enum.length > 0) payload[f.name] = f.enum[0];
    else if (f.type === 'number') payload[f.name] = f.min !== undefined ? f.min : 100;
    else if (f.type === 'boolean') payload[f.name] = true;
    else payload[f.name] = `sample-${f.name}`;
  }
  return payload;
}

function normalizeModuleSpec(rawMod) {
  const name = typeof rawMod === 'string'
    ? rawMod.trim().toLowerCase()
    : String(rawMod.name || 'items').trim().toLowerCase();
  const singular = toSingularPascal(name);
  const fields = Array.isArray(rawMod?.fields) && rawMod.fields.length > 0
    ? rawMod.fields
    : inferDefaultFields(name);

  const endpoints = Array.isArray(rawMod?.endpoints) && rawMod.endpoints.length > 0
    ? rawMod.endpoints
    : [
        { method: 'GET', path: `/api/${name}`, action: `list${singular}s`, statusCodes: [200] },
        { method: 'GET', path: `/api/${name}/:id`, action: `get${singular}ById`, statusCodes: [200, 404] },
        { method: 'POST', path: `/api/${name}`, action: `create${singular}`, statusCodes: [201, 400, 413, 422] },
      ];

  const invariants = Array.isArray(rawMod?.invariants) && rawMod.invariants.length > 0
    ? rawMod.invariants
    : fields
        .filter((f) => f.required)
        .map((f) => `${singular}.${f.name} (${f.type}) is mandatory at the module & HTTP boundary`);

  const scenarios = Array.isArray(rawMod?.scenarios) && rawMod.scenarios.length > 0
    ? rawMod.scenarios
    : [
        {
          id: `SPEC-${name.toUpperCase()}-01`,
          given: `a valid ${singular} payload matching the ${name} field schema`,
          when: `POST /api/${name} is invoked`,
          then: `returns 201 Created with an immutable ${singular} record and GET /api/${name}/:id returns 200`,
        },
        {
          id: `SPEC-${name.toUpperCase()}-02`,
          given: `an empty or schema-violating ${singular} payload`,
          when: `POST /api/${name} is invoked`,
          then: `rejects at the boundary with 422 Unprocessable Entity and structured validation errors`,
        },
      ];

  return { name, entity: singular, fields, endpoints, invariants, scenarios };
}

function renderSpecMarkdown(spec) {
  const modSections = spec.modules
    .map((m) => {
      const fieldRows = m.fields
        .map(
          (f) =>
            `| \`${f.name}\` | \`${f.type}\` | \`${Boolean(f.required)}\` | ${
              f.enum ? `enum: \`${f.enum.join(', ')}\`` : f.min !== undefined ? `min: \`${f.min}\`` : '-'
            } |`
        )
        .join('\n');
      const epRows = m.endpoints
        .map((e) => `| \`${e.method}\` | \`${e.path}\` | \`${e.action}\` | \`${e.statusCodes.join(', ')}\` |`)
        .join('\n');
      const scenarioLines = m.scenarios
        .map((s) => `- **${s.id}**: *Given* ${s.given}, *When* ${s.when}, *Then* ${s.then}.`)
        .join('\n');
      return `## Bounded Context: \`${m.name}\` (Entity: \`${m.entity}\`)

### Field Schema & Boundary Invariants
| Field | Type | Required | Constraints |
|---|---|---|---|
${fieldRows}

### HTTP & Seam Contracts
| Method | Path | Deep Module Seam Action | Status Codes |
|---|---|---|---|
${epRows}

### Acceptance Scenarios (Executable SDD Specs)
${scenarioLines}
`;
    })
    .join('\n---\n\n');

  return `# Foundry Executable Specification Blueprint (\`${spec.serviceName}\`)

- **Spec Version**: \`${spec.specVersion}\`
- **Service Name**: \`${spec.serviceName}\`
- **Default Port**: \`${spec.port}\`
- **Governing ADR**: \`ADR-0001\`, \`ADR-0009\`
- **Canonical Machine Spec**: [\`specs/service.spec.json\`](./service.spec.json)

---

${modSections}
`;
}

/**
 * Initializes `specs/service.spec.json` and `specs/SPEC.md` for Spec-Driven Development on the Foundry (ADR-0009).
 */
export function initFoundrySpec(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const serviceName = String(options.serviceName || options.name || path.basename(cwd) || 'api-service').trim();
  const port = Number(options.port) || 3000;
  const rawModules =
    Array.isArray(options.modules) && options.modules.length > 0 ? options.modules : ['users', 'items'];

  const spec = {
    specVersion: '1.0.0',
    serviceName,
    port,
    governingAdr: 'ADR-0001',
    modules: rawModules.map(normalizeModuleSpec),
  };

  const specsDir = path.join(cwd, 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  const specJsonPath = path.join(specsDir, 'service.spec.json');
  const specMdPath = path.join(specsDir, 'SPEC.md');

  fs.writeFileSync(specJsonPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  fs.writeFileSync(specMdPath, renderSpecMarkdown(spec), 'utf8');

  return Object.freeze({
    spec,
    specJsonPath: 'specs/service.spec.json',
    specMdPath: 'specs/SPEC.md',
  });
}

/**
 * Deterministically validates a Foundry Specification object or JSON file path (ADR-0009).
 */
export function validateFoundrySpec(specOrPath) {
  let spec = specOrPath;
  if (typeof specOrPath === 'string') {
    const abs = path.resolve(specOrPath);
    if (!fs.existsSync(abs)) {
      return Object.freeze({ valid: false, errors: [`Spec file not found at ${specOrPath}`], summary: null });
    }
    try {
      spec = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (err) {
      return Object.freeze({ valid: false, errors: [`Invalid JSON in spec file: ${err.message}`], summary: null });
    }
  }

  const errors = [];
  if (!spec || typeof spec !== 'object') {
    return Object.freeze({ valid: false, errors: ['Spec must be a JSON object'], summary: null });
  }
  if (!spec.serviceName || typeof spec.serviceName !== 'string') {
    errors.push('Missing or invalid `serviceName` string');
  }
  if (!Array.isArray(spec.modules) || spec.modules.length === 0) {
    errors.push('Spec `modules` must be a non-empty array of bounded contexts');
  }

  let fieldCount = 0;
  let endpointCount = 0;
  let scenarioCount = 0;

  if (Array.isArray(spec.modules)) {
    for (const mod of spec.modules) {
      if (!mod.name || !/^[a-z0-9_-]+$/.test(mod.name)) {
        errors.push(`Invalid module name '${mod.name}' (must be lowercase alphanumeric/kebab-case)`);
      }
      if (!Array.isArray(mod.fields) || mod.fields.length === 0) {
        errors.push(`Module '${mod.name}' must define at least one field in 'fields'`);
      } else {
        for (const f of mod.fields) {
          fieldCount++;
          if (!f.name) errors.push(`Module '${mod.name}' has a field missing 'name'`);
          if (!VALID_FIELD_TYPES.has(f.type)) {
            errors.push(`Field '${mod.name}.${f.name}' has unsupported type '${f.type}' (allowed: string, number, boolean)`);
          }
        }
      }
      if (!Array.isArray(mod.endpoints) || mod.endpoints.length === 0) {
        errors.push(`Module '${mod.name}' must define at least one endpoint contract`);
      } else {
        endpointCount += mod.endpoints.length;
      }
      if (!Array.isArray(mod.scenarios) || mod.scenarios.length === 0) {
        errors.push(`Module '${mod.name}' must define at least one Given/When/Then acceptance scenario`);
      } else {
        for (const s of mod.scenarios) {
          scenarioCount++;
          if (!s.given || !s.when || !s.then) {
            errors.push(`Scenario '${s.id || 'unnamed'}' in module '${mod.name}' requires given, when, and then clauses`);
          }
        }
      }
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    summary: Object.freeze({
      serviceName: spec?.serviceName || null,
      moduleCount: Array.isArray(spec?.modules) ? spec.modules.length : 0,
      fieldCount,
      endpointCount,
      scenarioCount,
    }),
  });
}

/**
 * Compiles a validated Foundry Specification into Deep Modules, HTTP routes, ADRs, and Acceptance Tests (ADR-0009).
 */
export function compileFoundrySpec(options = {}) {
  const cwd = path.resolve(options.cwd || options.targetDir || process.cwd());
  const specFile = path.resolve(cwd, options.specPath || 'specs/service.spec.json');

  let spec = options.spec;
  if (!spec) {
    if (!fs.existsSync(specFile)) {
      const initialized = initFoundrySpec({
        cwd,
        serviceName: options.name || path.basename(cwd),
        port: options.port,
        modules: options.modules,
      });
      spec = initialized.spec;
    } else {
      spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
    }
  } else {
    fs.mkdirSync(path.dirname(specFile), { recursive: true });
    fs.writeFileSync(specFile, JSON.stringify(spec, null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(cwd, 'specs', 'SPEC.md'), renderSpecMarkdown(spec), 'utf8');
  }

  const validation = validateFoundrySpec(spec);
  if (!validation.valid) {
    throw new Error(`Invalid Foundry Spec: ${validation.errors.join('; ')}`);
  }

  const serviceName = spec.serviceName;
  const defaultPort = Number(options.port || spec.port || 3000);
  const domainModules = spec.modules.map((m) => m.name);

  fs.mkdirSync(path.join(cwd, 'src', 'modules'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'docs', 'adr'), { recursive: true });

  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkgJson = {
      name: serviceName,
      version: '1.0.0',
      type: 'module',
      scripts: { start: 'node src/server.mjs', test: 'node --test tests/*.test.mjs' },
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
  }

  fs.writeFileSync(
    path.join(cwd, 'CODING_STANDARDS.md'),
    `# Coding Standards (\`${serviceName}\`)\n\n1. **Deep Module Encapsulation (\`ADR-0001\`)**: Expose only \`index.mjs\`; keep internals in \`lib/\`.\n2. **Spec-Driven Boundary Validation (\`ADR-0009\`)**: Validate all payloads against \`specs/service.spec.json\` at the seam boundary.\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(cwd, 'GLOSSARY.md'),
    `# Domain Glossary (\`${serviceName}\`)\n\n| Canonical Term | Bounded Context | Required Fields | Definition |\n|---|---|---|---|\n${spec.modules
      .map(
        (m) =>
          `| **${m.entity}** | \`src/modules/${m.name}/\` | \`${m.fields
            .filter((f) => f.required)
            .map((f) => f.name)
            .join(', ')}\` | Spec-governed entity for the ${m.name} bounded context. |`
      )
      .join('\n')}\n`,
    'utf8'
  );

  const adrDir = path.join(cwd, 'docs', 'adr');
  const hasAdr = fs.readdirSync(adrDir).some((f) => /^0001-/.test(f));
  if (!hasAdr) {
    scaffoldAdr({
      cwd,
      title: `${serviceName} Spec-Driven Deep-Module API Architecture`,
      scope: '`specs/service.spec.json`, `src/app.mjs`, `src/modules/*`',
      autoSync: false,
    });
  }

  const createdModules = spec.modules.map((mod) =>
    scaffoldDeepModule({
      cwd,
      moduleName: mod.name,
      fields: mod.fields,
      wireRouter: false,
      autoSync: false,
    })
  );

  writeApiRouter({ cwd, serviceName, port: defaultPort, modules: domainModules });

  const firstMod = spec.modules[0];
  const validPayload = buildSampleValidPayload(firstMod.fields);
  const apiTestContent = `import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../src/app.mjs';

test('API Spec Acceptance [ADR-0001]: GET /health, POST /api/${firstMod.name} (201 & 422), and GET /api/${firstMod.name}/:id (200 & 404)', async () => {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = \`http://127.0.0.1:\${port}\`;

  try {
    const healthRes = await fetch(\`\${baseUrl}/health\`);
    assert.equal(healthRes.status, 200);

    const invalidRes = await fetch(\`\${baseUrl}/api/${firstMod.name}\`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(invalidRes.status, 422);

    const createRes = await fetch(\`\${baseUrl}/api/${firstMod.name}\`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(${JSON.stringify(validPayload)}),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.ok(created.data.id);

    const byIdRes = await fetch(\`\${baseUrl}/api/${firstMod.name}/\${created.data.id}\`);
    assert.equal(byIdRes.status, 200);

    const missingRes = await fetch(\`\${baseUrl}/api/${firstMod.name}/nonexistent_id\`);
    assert.equal(missingRes.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
`;
  fs.writeFileSync(path.join(cwd, 'tests', 'api.integration.test.mjs'), apiTestContent, 'utf8');

  const syncReport = syncGovernanceDocs({ cwd });

  return Object.freeze({
    targetDir: cwd,
    name: serviceName,
    port: defaultPort,
    specPath: 'specs/service.spec.json',
    specBlueprintPath: 'specs/SPEC.md',
    modules: Object.freeze(domainModules),
    createdModules: Object.freeze(createdModules),
    syncReport,
  });
}

/**
 * Verifies 1:1 parity between `specs/service.spec.json` and the generated modules, routes, and governance docs.
 */
export function verifySpecParity(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const specFile = path.resolve(cwd, options.specPath || 'specs/service.spec.json');
  const validation = validateFoundrySpec(specFile);
  if (!validation.valid) {
    return Object.freeze({ aligned: false, drift: validation.errors, checkedModules: [] });
  }

  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const drift = [];
  const checkedModules = [];
  const appPath = path.join(cwd, 'src', 'app.mjs');
  const appText = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const contextPath = path.join(cwd, 'CONTEXT.md');
  const contextText = fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf8') : '';

  for (const mod of spec.modules) {
    checkedModules.push(mod.name);
    const seamPath = path.join(cwd, 'src', 'modules', mod.name, 'index.mjs');
    if (!fs.existsSync(seamPath)) {
      drift.push(`Spec module '${mod.name}' is missing Deep Module seam at src/modules/${mod.name}/index.mjs`);
    }
    if (appText && !appText.includes(`'${mod.name}':`)) {
      drift.push(`Spec module '${mod.name}' is not routed in src/app.mjs`);
    }
    if (contextText && !contextText.includes(`src/modules/${mod.name}`)) {
      drift.push(`Spec module '${mod.name}' is not registered in CONTEXT.md Section 2`);
    }
  }

  return Object.freeze({
    aligned: drift.length === 0,
    drift: Object.freeze(drift),
    checkedModules: Object.freeze(checkedModules),
  });
}

/**
 * Turnkey Spec-Driven API Service Scaffolder (delegates to initFoundrySpec + compileFoundrySpec).
 */
export function scaffoldApiService(options = {}) {
  const targetDir = path.resolve(options.targetDir || process.cwd());
  initFoundrySpec({
    cwd: targetDir,
    serviceName: options.name || path.basename(targetDir),
    port: options.port,
    modules: options.modules,
  });
  return compileFoundrySpec({
    cwd: targetDir,
    name: options.name,
    port: options.port,
    modules: options.modules,
  });
}
