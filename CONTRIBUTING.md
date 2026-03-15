# Contributing to EmitHQ

Thanks for considering contributing to EmitHQ. This project is open-source (AGPL-3.0 server, MIT SDKs), and contributions are welcome.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/EmitHQ.git`
3. Install dependencies: `npm install`
4. Copy the environment template: `cp .env.tpl .env` and fill in your values
5. Run the API server: `npm run dev --workspace=packages/api`
6. Run tests: `npm test`

## Project Structure

```
packages/
  core/       — Delivery engine, retry logic, signing, queue workers
  api/        — REST API server (Hono)
  dashboard/  — Web dashboard (Next.js)
  landing/    — Marketing site and docs
  sdk/        — TypeScript SDK (published to npm)
```

## Development

- **TypeScript** strict mode everywhere
- **ESLint + Prettier** for formatting (runs on save)
- **Vitest** for testing — tests are colocated (`foo.ts` → `foo.test.ts`)
- **Drizzle ORM** for database schema and migrations

### Running Tests

```bash
# All packages
npm test

# Specific package
npm test --workspace=packages/api
npm test --workspace=packages/core
```

### Code Style

- Named exports, not default exports
- `const` over `let`
- No `any` — use `unknown` and narrow
- Files: kebab-case (`delivery-worker.ts`)
- Types: PascalCase (`DeliveryAttempt`)
- Functions: camelCase (`signWebhook`)
- Constants: SCREAMING_SNAKE (`MAX_RETRY_ATTEMPTS`)

## Pull Requests

1. Create a feature branch from `master`
2. Make your changes with tests
3. Run `npm test` and `npx eslint .` before submitting
4. Write a clear PR description explaining what and why
5. Reference any related issues

## What We're Looking For

- Bug fixes (always welcome)
- Test improvements (especially integration tests)
- Documentation improvements
- New provider integrations for inbound webhooks
- SDK ports (Python, Go, Ruby)
- Performance improvements with benchmarks

## What We're Not Looking For (Yet)

- Major architectural changes (discuss in an issue first)
- New features without an issue/discussion
- Dependencies that significantly increase bundle size

## Contributor License Agreement

By contributing to EmitHQ, you agree that your contributions will be licensed under the same license as the component you're contributing to (AGPL-3.0 for server code, MIT for SDK code).

## Reporting Bugs

Open a [GitHub issue](https://github.com/Not-Another-Ai-Co/EmitHQ/issues) with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (Node version, OS)

## Security Vulnerabilities

If you discover a security vulnerability, please email security@emithq.com instead of opening a public issue. We'll respond within 48 hours.

## Questions?

Open a [GitHub Discussion](https://github.com/Not-Another-Ai-Co/EmitHQ/discussions) or reach out on Discord.
