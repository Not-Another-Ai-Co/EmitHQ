# EmitHQ — Project Instructions

## What This Is

EmitHQ is an open-source webhook infrastructure platform (AGPL-3.0 server + MIT SDKs). It handles both inbound (receiving webhooks from Stripe/GitHub/etc.) and outbound (sending webhooks to customers' endpoints) with fair pricing ($49-349/mo) filling the gap between free tiers and $490+ enterprise platforms.

## Tech Stack

- **Edge:** Cloudflare Workers (inbound reception, signature verification, rate limiting)
- **Origin:** Node.js + Hono on Railway (API server, BullMQ delivery workers)
- **Database:** Neon PostgreSQL (RLS multi-tenancy, shared schema)
- **Queue:** BullMQ on Upstash Redis (outbound delivery), QStash (edge→origin relay)
- **Auth:** Clerk
- **Payments:** Stripe (usage-based billing)
- **Language:** TypeScript (strict mode)

## Key Commands

```bash
npm test                    # Run all tests (vitest)
npm run lint                # ESLint
npm run typecheck:all       # Type-check root + dashboard + landing
npm run format:check        # Prettier check
npm run knip                # Dead code detection
npm run duplication         # Code duplication (jscpd)
npm run dev                 # Start API dev server
npm run start               # Start API production server (tsx)
npm run start:worker        # Start delivery worker (tsx)
npm run db:generate         # Drizzle migration generate
npm run db:migrate          # Drizzle migration run
npm run db:push             # Drizzle schema push
```

## Architecture

See @docs/research/technical-architecture.md for full details.

**Key patterns:**

- Persist message to PostgreSQL BEFORE enqueueing to Redis
- Standard Webhooks spec for outbound signing (HMAC-SHA256)
- RLS (`SET LOCAL app.current_tenant`) on every request — never rely on WHERE clauses alone
- Edge returns 200 immediately, delivery happens async via BullMQ workers
- `crypto.timingSafeEqual` for ALL signature verification — never string equality

## Critical Conventions

- No `any` — use `unknown` and narrow
- Named exports, not default exports (exception: Next.js page/layout files)
- All tables have `org_id UUID NOT NULL` with RLS policy
- Use parameterized queries — never string interpolation in SQL
- `crypto.timingSafeEqual` for ALL secret/signature comparison
- Hono `secureHeaders()` on API; `headers()` in dashboard next.config.ts
- Dashboard: `X-Frame-Options: SAMEORIGIN` (not DENY — Clerk iframes)
- Error boundaries (`error.tsx`) in all dashboard route segments
- All interactive elements keyboard-accessible (`tabIndex`, `onKeyDown`)
- All form labels use `htmlFor`/`id` pairs

## Documentation

**Always read:**

- @docs/TICKETS.md — Current work tracking
- @docs/CONVENTIONS.md — Coding patterns and conventions

**Read on demand:**

- @docs/ARCHITECTURE.md — System overview, data flow, deployment topology
- @docs/DECISIONS.md — Architectural decision log
- @docs/PERSONAS.md — User personas and core flows
- @docs/TEST_PLAN.md — Testing archetypes and Playwright setup
- @docs/research/technical-architecture.md — Full architecture research
- @docs/show-hn-draft.md — Show HN post draft (for T-095)
- @docs/show-hn-playbook.md — Show HN execution playbook (for T-095)
- @docs/outreach/ — Outreach campaign materials (for T-090)

**Environment context:** This machine uses 1Password Connect Server on miniPC (`localhost:8888`). Uses `OP_CONNECT_HOST` + `OP_CONNECT_TOKEN` in `~/.bashrc`. SSH key is configured for GitHub (`ssh -T git@github.com` works). Git remote protocol is HTTPS (via `gh`); SSH also available.

## Monorepo Structure

```
packages/
  core/     — Delivery engine, retry logic, signing, queue workers
  api/      — REST API server (Hono)
  dashboard/ — Web dashboard (Next.js 15, Clerk auth)
  landing/  — Marketing site (Next.js static export, Vercel)
  sdk/      — TypeScript SDK (published to npm)
```

## Portfolio Integration

EmitHQ is one of Julian's projects under NotAnotherAiCo LLC. Other projects: NAAC_ERP (property management), FE (company website), Index (MCP indexing). Each has its own 1Password vault, documentation system, and CI pipeline. Port registry and session management rules in `~/.claude/CLAUDE.md`.
