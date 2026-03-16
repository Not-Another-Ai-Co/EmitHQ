# Architecture — EmitHQ

> Last verified: 2026-03-16

## Overview

EmitHQ is a webhook infrastructure platform handling both inbound (receiving) and outbound (sending) webhooks. Hybrid edge/origin architecture with Cloudflare Workers at the edge and Node.js on Railway as origin.

## System Diagram

```
┌─────────────────────────────────────────────┐
│         CLOUDFLARE WORKERS (Edge)            │
│  Inbound reception, signature verification,  │
│  rate limiting, API key cache validation     │
└──────────────────┬──────────────────────────┘
                   │ QStash (durable HTTP queue)
┌──────────────────▼──────────────────────────┐
│           RAILWAY (Origin Server)            │
│  API Server (Hono) + BullMQ Workers         │
│  ┌────────────┐  ┌────────────────────┐     │
│  │ REST API   │  │ Delivery Workers   │     │
│  │ (CRUD,     │  │ (outbound HTTP,    │     │
│  │  auth,     │  │  retry, circuit    │     │
│  │  billing)  │  │  breaker)          │     │
│  └─────┬──────┘  └────────┬───────────┘     │
│        │                  │                  │
│  ┌─────▼──────────────────▼───────────┐     │
│  │      Upstash Redis (BullMQ)        │     │
│  └────────────────────────────────────┘     │
│        │                                     │
│  ┌─────▼──────────────────────────────┐     │
│  │    Neon PostgreSQL (RLS tenancy)   │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

## Data Flow: Outbound (Implemented: T-013)

1. Customer calls `POST /api/v1/app/:appId/msg` with `{ eventType, payload, eventId? }`
2. Quota middleware checks `event_count_month` against tier limit (free=100K, starter=500K, growth=2M, scale=10M)
3. Auth middleware validates API key or Clerk session → sets RLS context
4. Resolve application by UUID or `uid` within tenant scope
5. Persist message to PostgreSQL (BEFORE queueing — critical)
6. Fan-out: find active endpoints matching `eventTypeFilter`, create `delivery_attempt` rows (status=pending)
7. Enqueue one BullMQ job per delivery attempt (best-effort — message safe in DB if queue fails)
8. Increment `event_count_month` atomically in same transaction
9. Return 202 Accepted with message ID
10. BullMQ Worker (T-014): load message payload + endpoint config from adminDb (BYPASSRLS)
11. Sign payload per Standard Webhooks spec: `HMAC-SHA256(msg_{id}.{timestamp}.{body}, whsec_secret)` → `v1,{base64}`
12. HTTP POST to endpoint URL via native `fetch` + `AbortSignal.timeout()` (default 30s)
13. Record result in `delivery_attempts`: status, statusCode, responseBody (1KB), responseTimeMs
14. On 2xx: mark `delivered`, reset endpoint `failureCount`
15. On 5xx/timeout/network error: mark `failed`, increment `failureCount`, BullMQ retries with exponential backoff
16. On 400/401/403/404/410: throw `UnrecoverableError` (no retry — permanent error)
17. Circuit breaker: `failureCount ≥ 10` → disable endpoint with reason `circuit_breaker`
18. On exhaustion (T-015): move to DLQ, send operational webhook

## Data Flow: Inbound

1. Provider (Stripe/GitHub) POSTs to `/webhooks/inbound/{source_id}`
2. Cloudflare Worker verifies provider signature, returns 200 immediately
3. Forwards to origin via QStash
4. Origin persists event, optionally fans out to outbound delivery

## Authentication

Dual auth model:

- **Dashboard users:** Clerk sessions via `@hono/clerk-auth` middleware. Clerk org ID maps to internal `org_id` via `clerk_org_id` column on organizations table.
- **Programmatic access:** Custom `emhq_` prefixed API keys. SHA-256 hashed in `api_keys` table, verified with `crypto.timingSafeEqual`. Multiple active keys per org for zero-downtime rotation.

Auth middleware stack: `clerk` (global) → `requireAuth` (dual path) → `tenantScope` (RLS) → route handler.

## Multi-Tenancy

Shared schema with PostgreSQL Row-Level Security. `org_id` on every table. `SET LOCAL app.current_tenant` per request within a Drizzle transaction (`withTenant()`). UUID validation before SQL execution.

Two database roles:

- `app_user` — RLS enforced, used at runtime
- `app_admin` — BYPASSRLS, used for org/key lookups, migrations, BullMQ workers

Database: Drizzle ORM with `pgPolicy()` for inline RLS definitions. Direct Neon connection (not pooler) for `SET LOCAL` compatibility.

## API Surface (25 endpoints)

| Group     | Endpoints                                                  | Auth                                      |
| --------- | ---------------------------------------------------------- | ----------------------------------------- |
| Auth/Keys | POST/GET/DELETE `/api/v1/auth/keys`                        | Clerk session                             |
| Messages  | POST/GET `/api/v1/app/:appId/msg`, GET `/:msgId`           | API key                                   |
| Endpoints | CRUD `/api/v1/app/:appId/endpoint`, test delivery          | API key                                   |
| Replay    | POST retry (message-level, attempt-level)                  | API key                                   |
| Dashboard | GET stats, msg list, DLQ, endpoint-health                  | API key                                   |
| Transform | POST `/api/v1/transform/preview`                           | API key                                   |
| Billing   | POST checkout, GET subscription, POST portal, POST webhook | Clerk session (webhook: Stripe signature) |

## Billing (T-011)

Stripe Checkout Sessions for subscription signup (Starter $49/Growth $149/Scale $349, monthly or annual). Customer Portal for self-service plan changes. Webhook handler processes 5 Stripe event types: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/payment_failed`. `billingEvents` table with unique `stripe_event_id` for idempotent webhook processing. Organizations auto-provisioned on first Clerk login. Free tier hard-blocks at 100K events; paid tiers allow overage. `invoice.paid` resets `event_count_month` per billing period.

## Payload Transformation (T-018)

Per-endpoint `transformRules` (JSONB, nullable). Applied in delivery worker BEFORE signing. Zero-dependency engine: JSONPath dot-notation subset, `{{...}}` template interpolation, built-in functions (formatDate, uppercase, lowercase, concat). Passthrough when rules are null/empty.

## Dashboard (T-017)

Next.js 15 App Router at `packages/dashboard/`. Clerk-wrapped, port 4002. Server Components + client components for interactivity. Calls API over HTTP. Pages: Overview (stats), Events (filterable log + detail panel), Endpoints (health cards), DLQ (replay buttons). Mobile responsive with sidebar + bottom nav.

## Landing & Docs Site (T-020)

Separate Next.js app at `packages/landing/`. Static export for CF Pages. No auth, no DB. Pages: landing (hero, pricing gap, features, code snippet), pricing (4-tier table + FAQ), compare (vs Svix/Hookdeck/Convoy + build-vs-buy), docs (getting started, API reference, SDK guide). Plausible analytics. SEO (meta, OG, sitemap, robots.txt).

## TypeScript SDK (T-019)

`@emithq/sdk` — published to npm. Zero dependencies, fetch-based. 10 methods (sendEvent, CRUD endpoints, replay, testEndpoint). Typed errors (AuthError, ValidationError, RateLimitError, etc.). Auto-retry on 5xx/network (3 attempts, exponential backoff). `verifyWebhook()` using WebCrypto API.

## Monitoring & SLOs (T-022)

`GET /health` probes DB (`SELECT 1`) and Redis (`PING`), returns 200 `ok` or 503 `degraded`. `GET /metrics` exposes cross-tenant SLO aggregates via `adminDb`: delivery success/retry/DLQ rates, p50/p95/p99 latency (PostgreSQL `percentile_cont`), BullMQ queue depth, DB pool stats. Protected by `METRICS_SECRET` header. `GET /metrics/slo` returns pass/fail against 3 targets: 99.9% delivery success, <500ms p95, <1000 queue depth. Sentry for error tracking. Better Stack for external uptime + status page. Incident runbook at `docs/RUNBOOK.md`.

## Analytics & Feedback (T-024)

`analytics_events` table for product analytics (no RLS — cross-tenant aggregation via adminDb). `trackEvent()` fire-and-forget helper tracks: `org.created`, `first_event_sent`, `subscription.created/canceled`, `endpoint.created`, `api_key.created`. `GET /metrics/business` returns MRR, ARR, ARPU, tier breakdown, churn from Stripe. `GET /metrics/report` returns 7-day summary of delivery stats + analytics events + tier distribution. GitHub Discussions for feature requests.

## Deployment (T-027)

**Runtime:** `tsx` (esbuild-based TypeScript runner) in production — avoids tsc compilation, path alias resolution, and workspace source export issues (DEC-021). Two Railway services from the same repo:

- **API service:** `tsx src/server.ts` (Hono HTTP server, port from `PORT` env var)
- **Worker service:** `tsx src/worker.ts` (BullMQ delivery worker, no HTTP, `restartPolicyType: ALWAYS`)

Worker entry point: `packages/api/src/worker.ts` — calls `startDeliveryWorker()` from `@emithq/core` with graceful SIGTERM/SIGINT shutdown (30s forced-exit fallback).

**Database migrations:** Drizzle ORM with `drizzle-kit`. Migration files at `packages/core/src/db/migrations/`. Scripts: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`. Run against Neon via `DATABASE_ADMIN_URL` (BYPASSRLS role).

**Secrets:** 1Password vault `EmitHQ` with `op://` references in `.env.tpl`. Railway env vars set manually from these references.

**Production topology (T-028, T-029):**

| Service         | Host         | URL                                   |
| --------------- | ------------ | ------------------------------------- |
| API server      | Railway      | https://api.emithq.com                |
| Delivery worker | Railway      | (no HTTP)                             |
| Landing page    | Vercel       | https://emithq.com                    |
| Dashboard       | Vercel       | https://app.emithq.com                |
| Auth            | Clerk        | clerk.emithq.com, accounts.emithq.com |
| DNS             | Cloudflare   | emithq.com zone                       |
| Uptime          | Better Stack | emithq.betteruptime.com               |

## Key Decisions

- See docs/DECISIONS.md for architectural decision records
- See docs/research/technical-architecture.md for full architecture research
