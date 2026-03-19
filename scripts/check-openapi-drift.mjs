/* eslint-disable no-undef */
/**
 * OpenAPI drift detector — ensures all API routes exist in the OpenAPI spec.
 * Compares route definitions in packages/api/src/ against packages/landing/public/openapi.json.
 */
import { readFileSync, readdirSync } from 'fs';

const SPEC_PATH = 'packages/landing/public/openapi.json';
const INDEX_PATH = 'packages/api/src/index.ts';
const ROUTES_DIR = 'packages/api/src/routes';

// Load OpenAPI spec paths
const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8'));
const specPaths = new Set(Object.keys(spec.paths || {}));

// Load index.ts to find route mounts
const indexSrc = readFileSync(INDEX_PATH, 'utf8');

// Extract: app.route('/api/v1/path', varName)
const mounts = [];
const mountRe = /app\.route\(['"]([^'"]+)['"],\s*(\w+)/g;
let m;
while ((m = mountRe.exec(indexSrc)) !== null) {
  mounts.push({ prefix: m[1], varName: m[2] });
}

// Extract routes from each route file
const routeFiles = readdirSync(ROUTES_DIR).filter(
  (f) => f.endsWith('.ts') && !f.includes('.test.'),
);

const codeRoutes = new Set();

for (const file of routeFiles) {
  const src = readFileSync(`${ROUTES_DIR}/${file}`, 'utf8');
  // Match HTTP method calls: routeVar.get('/path', or routeVar.post('/:id/path',
  // Exclude: c.get('orgId'), c.set('tx'), c.req.header('x-...')
  const routeRe = /Routes?\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
  let rm;
  while ((rm = routeRe.exec(src)) !== null) {
    const path = rm[2];
    // Skip context getters that aren't routes (e.g., c.get('orgId'))
    if (!path.startsWith('/')) continue;

    // Find mount prefix for this file
    for (const mount of mounts) {
      const importRe = new RegExp(
        `import.*${mount.varName}.*from.*routes/${file.replace('.ts', '')}`,
      );
      if (importRe.test(indexSrc)) {
        // Combine mount prefix + route path, normalize
        const fullPath = (mount.prefix + path)
          .replace(/\/+/g, '/')
          .replace(/:(\w+)/g, '{$1}')
          .replace(/\/$/, ''); // strip trailing slash

        // Only check /api/v1/* routes (skip metrics, health, billing webhook)
        if (fullPath.startsWith('/api/v1/') && !fullPath.includes('/billing/webhook') && !fullPath.includes('/admin/')) {
          codeRoutes.add(fullPath);
        }
      }
    }
  }
}

// Compare
let missing = 0;
for (const route of codeRoutes) {
  if (!specPaths.has(route)) {
    console.log(`DRIFT: ${route} exists in code but not in OpenAPI spec`);
    missing++;
  }
}

if (missing > 0) {
  console.log(`\nERROR: ${missing} route(s) missing from OpenAPI spec (${SPEC_PATH})`);
  console.log('Update the spec to match the API, then re-run this check.');
  process.exit(1);
}

console.log(`OpenAPI spec is in sync with API routes (${codeRoutes.size} routes checked).`);
