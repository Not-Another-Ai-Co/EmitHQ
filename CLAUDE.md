# EmitHQ — Project Instructions

## What This Is

EmitHQ is an open-source webhook infrastructure platform (AGPL-3.0 server + MIT SDKs). Inbound (receiving webhooks from Stripe/GitHub/etc.) and outbound (sending webhooks to customers' endpoints) with fair pricing ($49-349/mo) filling the gap between free tiers and $490+ enterprise platforms.

## Tech Stack

- **Edge:** Cloudflare Workers
- **Origin:** Node.js + Hono on Railway (API + BullMQ delivery workers)
- **Database:** Neon PostgreSQL (RLS multi-tenancy, shared schema)
- **Queue:** BullMQ on Upstash Redis, QStash (edge→origin relay)
- **Auth:** Clerk | **Payments:** Stripe (usage-based)
- **Language:** TypeScript (strict)

## Key Commands

```bash
npm test                    # Vitest
npm run lint                # ESLint
npm run typecheck:all       # Type-check root + dashboard + landing
npm run format:check        # Prettier check
npm run knip                # Dead code detection
npm run duplication         # Code duplication (jscpd)
npm run dev                 # Start API dev server
npm run start               # Production API (tsx)
npm run start:worker        # Delivery worker (tsx)
npm run db:generate         # Drizzle migration generate
npm run db:migrate          # Drizzle migration run
npm run db:push             # Drizzle schema push
```

## Conventions, architecture, and decisions

EmitHQ follows the patterns in `@docs/CONVENTIONS.md` (TypeScript + security + database + testing + naming + API design + monorepo layout). Architecture diagrams, data flow, auth model, multi-tenancy, deployment topology, and incident runbook live in `@docs/ARCHITECTURE.md`. Architectural decisions with rationale are in `@docs/DECISIONS.md` (see DECISIONS-ARCHIVE.md for older entries).

Key non-obvious invariants — do not rely on memory, read CONVENTIONS.md:

- Persist message to PostgreSQL BEFORE enqueueing to Redis (DEC-023 idempotency via `onConflictDoNothing`)
- `crypto.timingSafeEqual` for ALL signature verification — never string equality
- RLS via `SET LOCAL app.current_tenant` per-request (DEC-022 uses `sql.raw()` with UUID pre-validation)
- Two DB roles: `app_user` (RLS enforced) vs `app_admin` (BYPASSRLS, for workers / admin ops)
- SSRF protection on endpoint URLs (DEC-031) — DNS-resolving validation at creation + sync check at delivery

For third-party integration discipline (vendor specs first, cite before claim), see `~/.claude/CLAUDE.md` "Third-Party Integrations" section — applies to Stripe, Clerk, Resend.

## Documentation

**Always load:** `@docs/TICKETS.md`, `@docs/CONVENTIONS.md`

**On demand:**

- `@docs/ARCHITECTURE.md` — system diagram, data flows, deployment, incident runbook
- `@docs/DECISIONS.md` — architectural decision log
- `@docs/PERSONAS.md` — user personas + core flows
- `@docs/TEST_PLAN.md` — testing archetypes + Playwright setup
- `@docs/research/technical-architecture.md` — full architecture research with cost analysis and SLO targets
- `@docs/show-hn-draft.md` + `@docs/show-hn-playbook.md` — launch materials (T-095)
- `@docs/outreach/` — outreach campaign materials (T-090)
- `@docs/verify-feedback.md` — /verify test pattern feedback loop (read by /build before writing tests)

## Portfolio Integration

See `~/.claude/CLAUDE.md` for workflow conventions, decision format, and override tracking. Other projects: Doran (property management), FE (company website), Index (MCP indexing).
