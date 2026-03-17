# Research: Code Efficiency Tooling for EmitHQ Monorepo

**Date:** 2026-03-17
**Status:** Draft — pending review

## Summary

EmitHQ has no dead code detection, no unused dependency detection, and no duplication detection. The monorepo's 5 workspaces (core, api, dashboard, landing, sdk) total ~95 TypeScript files with a shared barrel export from `@emithq/core` (50+ named exports). Knip is the right tool for dead code/unused deps, jscpd for duplication. Both can be added to the existing single-job CI pipeline in under an hour with zero-config defaults covering 90% of the setup.

## Current State

### Codebase structure

| Workspace            | Files | Framework                  | Test framework | Has own tsconfig |
| -------------------- | ----- | -------------------------- | -------------- | ---------------- |
| `packages/core`      | 22    | —                          | Vitest         | No (root)        |
| `packages/api`       | 26    | Hono                       | Vitest         | No (root)        |
| `packages/dashboard` | 20    | Next.js 15 (App Router)    | None           | Yes              |
| `packages/landing`   | 21    | Next.js 15 (static export) | None           | Yes              |
| `packages/sdk`       | 8     | —                          | Vitest         | Yes (build)      |

### Existing linting

- **ESLint** (flat config, `eslint.config.js`): `@typescript-eslint/no-unused-vars` (error), `@typescript-eslint/no-explicit-any` (error). Ignores `packages/landing/`.
- **Prettier**: Format checking in CI.
- **TypeScript**: Strict mode, `moduleResolution: bundler`, path aliases for `@emithq/*`.
- **No pre-commit hooks** — linting runs only in CI.
- **No Knip, no jscpd, no dead code detection** of any kind.

### Cross-workspace dependencies

`@emithq/core` barrel (`packages/core/src/index.ts`) exports 50+ symbols. `@emithq/api` imports `adminDb`, `createRedisConnection`, and uses `@emithq/core` as `"*"` workspace dependency. Dashboard and landing call the API over HTTP — no direct workspace imports. SDK is standalone (MIT, published to npm).

### CI pipeline

Single-job workflow (`ci.yml`): checkout → setup Node 22 → `npm ci` → typecheck → lint → format:check → test. No path filtering (per CONVENTIONS: "Single-job workflows don't need path filtering").

## Findings

### 1. Knip — Dead Code & Unused Dependencies

**What it detects that EmitHQ currently cannot:**

- Unused exports from `@emithq/core` barrel (e.g., functions exported but never imported by `@emithq/api`)
- Unused files — `.ts` files not imported anywhere in the dependency graph
- Unused `dependencies` and `devDependencies` in each workspace's `package.json`
- Unlisted dependencies — imports used in code but not in `package.json`
- Duplicate exports across workspaces

**Auto-detection coverage:**

- **Next.js plugin**: Automatically treats `page.tsx`, `layout.tsx`, `middleware.ts`, `sitemap.ts`, `robots.ts` as entry points. Covers both dashboard (App Router) and landing (static export).
- **Vitest plugin**: Detects `vitest.config.ts` and all `*.test.ts` files as entries. Covers core, api, sdk test suites.
- **ESLint plugin**: Detects `eslint.config.js` as a project file.
- **Workspace support**: Auto-reads `"workspaces": ["packages/*"]` from root `package.json`. No manual workspace config needed.

**EmitHQ-specific configuration needs:**

1. **`packages/landing` is ESLint-ignored** — Knip should still analyze it (it has its own Next.js entry points).
2. **`@emithq/core` exports `"."` pointing to TypeScript source** (`"main": "src/index.ts"`) — Knip handles this via its TS resolver.
3. **`packages/api` uses `tsx` for production** (no build step) — Knip won't look for `dist/`, which is correct.
4. **`packages/sdk` has `tsconfig.build.json`** — Knip may need explicit `typescript.config` override if it doesn't auto-detect.
5. **Root `tsconfig.json` `paths` aliases** (`@emithq/core`, `@emithq/api`, `@emithq/sdk`) — Knip resolves these automatically.

**Recommended `knip.json`:**

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "packages/core": {},
    "packages/api": {},
    "packages/dashboard": {},
    "packages/landing": {},
    "packages/sdk": {}
  },
  "ignore": ["**/dist/**", "**/.next/**"],
  "ignoreDependencies": ["@types/ioredis", "@types/pg", "@types/react", "@types/react-dom"]
}
```

Notes:

- `@types/*` packages are often flagged as "unused" because they're ambient type providers. Ignoring the known ones prevents false positives.
- Zero-config workspaces auto-detect Next.js, Vitest, and ESLint plugins per workspace.
- The `ignore` patterns avoid scanning build artifacts.

### 2. jscpd — Copy-Paste Detection

**What it detects:**

- Duplicated code blocks across the monorepo (Rabin-Karp algorithm)
- Cross-file and cross-workspace duplication
- Configurable minimum block size (lines/tokens)

**Current state:** Not configured. Not in CI. Not in `/verify` for EmitHQ (the knowledge base mentions jscpd in `/verify` for NAAC_ERP only).

**Recommended `.jscpd.json`:**

```json
{
  "threshold": 5,
  "reporters": ["console"],
  "ignore": ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/out/**", "**/*.test.ts"],
  "minLines": 10,
  "minTokens": 50,
  "absolute": true
}
```

Notes:

- `threshold: 5` means fail if >5% of code is duplicated. Start here, tighten later.
- Test files excluded — test boilerplate duplication is acceptable.
- `absolute: true` shows full file paths for CI readability.

### 3. CI Integration

Both tools add to the existing `ci.yml` as additional steps, no structural changes needed:

```yaml
- name: Dead code check
  run: npx knip

- name: Duplication check
  run: npx jscpd --config .jscpd.json packages/
```

**Phased approach:**

- **Phase 1**: Add both with `--no-exit-code` (Knip) / high threshold (jscpd) — informational only, non-blocking.
- **Phase 2**: Run initial audit, fix findings, then remove `--no-exit-code` to make them blocking gates.

### 4. `/verify` Integration

The `/verify` skill should add two gates for EmitHQ:

| Gate        | Tool  | Command                                                    | Threshold                         |
| ----------- | ----- | ---------------------------------------------------------- | --------------------------------- |
| Dead code   | Knip  | `npx knip`                                                 | 0 unused exports in changed files |
| Duplication | jscpd | `npx jscpd --min-lines 10 --min-tokens 50 [changed files]` | 0 new duplicated blocks           |

### 5. Impact on EmitHQ's `@emithq/core` Barrel

The barrel file at `packages/core/src/index.ts` exports 50+ symbols. Knip will identify which of these are actually consumed by `packages/api` (the only internal consumer). Unused exports can be:

- Removed if truly dead (nothing uses them)
- Kept if they're part of the public API surface for future consumers (annotate with `@public` JSDoc tag and configure `ignoreExportsUsedInFile`)

The SDK (`packages/sdk`) is published to npm — its exports should use `includeEntryExports: true` in the workspace config to avoid false positives on public API exports.

Updated workspace config accounting for this:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "packages/core": {},
    "packages/api": {},
    "packages/dashboard": {},
    "packages/landing": {},
    "packages/sdk": {
      "includeEntryExports": true
    }
  },
  "ignore": ["**/dist/**", "**/.next/**"],
  "ignoreDependencies": ["@types/ioredis", "@types/pg", "@types/react", "@types/react-dom"]
}
```

## Recommendation

**Single ticket, ~1 hour of implementation work:**

1. `npm install -D knip jscpd` at the root
2. Add `knip.json` with the workspace config above
3. Add `.jscpd.json` with the duplication config above
4. Add `"knip": "knip"` and `"duplication": "jscpd --config .jscpd.json packages/"` scripts to root `package.json`
5. Run initial audit (`npx knip`, `npx jscpd`), fix low-hanging fruit (unused exports, unlisted deps)
6. Add both as CI steps — informational (`--no-exit-code`) first, then blocking after baseline is clean
7. Update `/verify` skill to include both gates for EmitHQ

**Alternatives considered:**

- **SonarQube/SonarCloud** — Full platform covering complexity, duplication, dead code, security. Overkill for a solo developer; adds vendor dependency. Knip + jscpd covers the same ground at zero cost.
- **ESLint-only approach** (`eslint-plugin-unused-imports`) — Only catches unused imports, not unused exports, files, or dependencies. Knip is purpose-built and more comprehensive.
- **ts-prune** — Deprecated in favor of Knip. No monorepo support.
- **Biome migration** — Biome has `noUnusedImports` but no project-level dead code detection. Switching from ESLint to Biome for EmitHQ adds risk with no dead-code benefit. The knowledge base research confirms: don't standardize linters across projects.

## Sources

- [Knip — Dead code detector for JS/TS](https://knip.dev/)
- [Knip — Configuration Reference](https://knip.dev/reference/configuration)
- [Knip — Monorepos & Workspaces](https://knip.dev/features/monorepos-and-workspaces)
- [Knip — Next.js plugin](https://knip.dev/reference/plugins/next)
- [Knip — Vitest plugin](https://knip.dev/reference/plugins/vitest)
- [jscpd — Copy/paste detector (GitHub)](https://github.com/kucherenko/jscpd)
- [Existing knowledge base: Code Efficiency Tooling](~/.claude/knowledge/code-efficiency-tooling/research.md)
- `/home/jfinnegan0/EmitHQ/eslint.config.js` — Current ESLint flat config
- `/home/jfinnegan0/EmitHQ/package.json` — Root workspace config
- `/home/jfinnegan0/EmitHQ/packages/core/src/index.ts` — Barrel exports (50+ symbols)
- `/home/jfinnegan0/EmitHQ/.github/workflows/ci.yml` — Current CI pipeline
