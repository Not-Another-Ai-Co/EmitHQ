# Architecture — EmitHQ

> Last verified: 2026-03-22

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
12. SSRF check: validate endpoint URL against blocked IP ranges and DNS rebinding (DEC-031)
13. HTTP POST to endpoint URL via native `fetch` + `AbortSignal.timeout()` (default 30s)
14. Record result in `delivery_attempts`: status, statusCode, responseBody (1KB), responseTimeMs
15. On 2xx: mark `delivered`, reset endpoint `failureCount`
16. On 5xx/timeout/network error: mark `failed`, increment `failureCount`, BullMQ retries with exponential backoff
17. On 400/401/403/404/410: throw `UnrecoverableError` (no retry — permanent error)
18. Circuit breaker: `failureCount ≥ 10` → disable endpoint with reason `circuit_breaker`
19. On exhaustion (T-015): move to DLQ, send operational webhook

## Data Flow: Inbound

1. Provider (Stripe/GitHub) POSTs to `/webhooks/inbound/{source_id}`
2. Cloudflare Worker verifies provider signature, returns 200 immediately
3. Forwards to origin via QStash
4. Origin persists event, optionally fans out to outbound delivery

## Authentication

Dual auth model:

- **Dashboard users:** Clerk sessions via `@hono/clerk-auth` middleware. Clerk org ID maps to internal `org_id` via `clerk_org_id` column on organizations table.
- **Programmatic access:** Custom `emhq_` prefixed API keys. SHA-256 hashed in `api_keys` table, verified with `crypto.timingSafeEqual`. Multiple active keys per org for zero-downtime rotation.

Auth middleware stack: `clerk` (global) → `requireAuth` (dual path) → `tenantScope` (RLS) → route handler. `quotaHeaders` middleware on all `/api/v1/*` routes injects `X-EmitHQ-Quota-*` response headers (limit, used, remaining, reset, tier + warning at 80%/95%).

**API-only signup (T-063):** `POST /api/v1/signup` creates Clerk user + org via Backend API, provisions EmitHQ org, generates first API key — all in one request. No browser required. In-memory rate limiting (3/IP/day). Disposable email domains blocked (55+ domains, T-082). Returns `{ orgId, apiKey, userId, tier, eventLimit, credential_storage_hint }`. Clerk validation errors (password/email) surfaced as 400 — not swallowed as 500.

**Dashboard auth middleware:** Uses `auth().redirectToSignIn()` (not `auth.protect()`) — Clerk v6's `protect()` rewrites to 404 when sign-in URL resolution fails. Explicit `redirectToSignIn({ returnBackUrl })` guarantees 302 redirect.

**API key rotation (T-078):** `POST /api/v1/auth/keys/:keyId/rotate` creates a new key and sets `expiresAt` on the old key (configurable grace period, default 1 hour). Immediate revocation available with `gracePeriodMinutes: 0`.

**Admin controls (T-082):** `POST /api/v1/admin/org/:orgId/disable` and `/enable` endpoints, protected by `ADMIN_SECRET` header. Disabled orgs get 403 on all API calls (both API key and Clerk session paths). Excluded from OpenAPI spec (internal-only).

## Multi-Tenancy

Shared schema with PostgreSQL Row-Level Security. `org_id` on every table. `SET LOCAL app.current_tenant` per request within a Drizzle transaction (`withTenant()`). UUID validation before SQL execution.

Two database roles:

- `app_user` — RLS enforced, used at runtime
- `app_admin` — BYPASSRLS, used for org/key lookups, migrations, BullMQ workers

Database: Drizzle ORM with `pgPolicy()` for inline RLS definitions. Direct Neon connection (not pooler) for `SET LOCAL` compatibility.

## API Surface (35 endpoints)

| Group        | Endpoints                                                          | Auth                                      |
| ------------ | ------------------------------------------------------------------ | ----------------------------------------- |
| Signup       | POST `/api/v1/signup`                                              | None (public, rate-limited)               |
| Auth/Keys    | POST/GET/DELETE `/api/v1/auth/keys`, POST rotate                   | Clerk session                             |
| Admin        | POST `/api/v1/admin/org/:orgId/disable\|enable`                    | ADMIN_SECRET header                       |
| Applications | POST/GET `/api/v1/app`, GET `/api/v1/app/:appId`                   | API key or Clerk session                  |
| Messages     | POST/GET `/api/v1/app/:appId/msg`, GET `/:msgId`                   | API key                                   |
| Endpoints    | CRUD `/api/v1/app/:appId/endpoint`, test delivery                  | API key                                   |
| Replay       | POST retry (message-level, attempt-level)                          | API key                                   |
| Dashboard    | GET stats, msg list, DLQ, endpoint-health                          | API key                                   |
| Transform    | POST `/api/v1/transform/preview`                                   | API key                                   |
| Billing      | POST checkout, GET subscription, POST portal, POST webhook         | Clerk session (webhook: Stripe signature) |
| Onboarding   | GET `/api/v1/onboarding/status`, POST `/api/v1/onboarding/dismiss` | API key or Clerk session                  |

## Billing (T-011)

Stripe Checkout Sessions for subscription signup (Starter $49/Growth $149/Scale $349, monthly or annual). Customer Portal for self-service plan changes. Webhook handler processes 5 Stripe event types: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/payment_failed`. `billingEvents` table with unique `stripe_event_id` for idempotent webhook processing. Organizations auto-provisioned on first Clerk login. Free tier hard-blocks at 100K events; paid tiers allow overage. `invoice.paid` resets `event_count_month` per billing period.

## Payload Transformation (T-018, T-101–T-103)

Per-endpoint `transformRules` (JSONB, nullable). Applied in delivery worker BEFORE signing. Zero-dependency engine: JSONPath dot-notation subset, `{{...}}` template interpolation, built-in functions (formatDate, uppercase, lowercase, concat). Passthrough when rules are null/empty. Available on Starter+ tier ($49/mo); free tier sees upgrade prompt (DEC-034).

**Dashboard UI (T-101–T-103):** Visual form-based editor on endpoint create/edit page — collapsible `<details>` section with rule rows (Source Path → Target Field → Template). Max 20 rules, inline validation, function reference tooltip. Live preview panel calls `POST /api/v1/transform/preview` (debounced 300ms). `TransformRuleEditor` + `TransformPreview` components at `packages/dashboard/src/components/transform-rule-editor.tsx`. Free tier gating via `GET /api/v1/billing/subscription` tier check.

## Dashboard (T-017, T-045, T-047–T-051, T-068–T-074)

Next.js 15 App Router at `packages/dashboard/`. Three-layer auth (DEC-024): Clerk middleware at `src/middleware.ts` with `auth.protect()`, server-side `auth()` guard in dashboard layout, client-side `useApiFetch()` hook for Bearer token auth.

**Navigation:** Fixed top bar (DEC-030, supersedes DEC-028 sidebar). Global mode shows logo + Settings gear + Sign Out. App-context mode adds inline nav (← Apps | App Name | Overview, Events, Endpoints, DLQ). Mobile: app nav items in a secondary scrollable row below the top bar. No sidebar at any level.

**Routing (DEC-028):** Path-based app context at `/dashboard/app/[appId]/*`. `useApp()` reads `appId` from `useParams()`. No query-param propagation.

**Route structure:**

```
/dashboard                           → App card grid (landing) + inline onboarding
  /dashboard/app/[appId]             → Overview (stats, server component)
  /dashboard/app/[appId]/events      → Event log + detail panel
  /dashboard/app/[appId]/endpoints   → Endpoint CRUD + health metrics
  /dashboard/app/[appId]/dlq         → Dead letter queue + replay
/dashboard/settings                  → Tabbed: API Keys | Billing | Profile | Danger Zone
/dashboard/billing                   → Redirects to /dashboard/settings?tab=billing
/dashboard/profile                   → Redirects to /dashboard/settings?tab=profile
```

**App listing (`/dashboard`):** Card grid with per-app stats (endpoint count, 24h event count). Create form. Soft-delete with 5-second undo toast. Inline `<GettingStartedCard />` when onboarding incomplete (server-side `onboarding_completed_at` flag + localStorage cache).

**Settings (consolidated):** Single tabbed page with 4 tabs — API Keys (generate/list/revoke), Billing (tier card, usage bar, Stripe Checkout/Portal), Profile (Clerk `<UserProfile />`), Danger Zone (soft-deleted app recovery with restore button, 30-day countdown).

**Soft-delete (T-074):** Applications use `deleted_at` column. DELETE sets timestamp + cascade-disables endpoints (`disabledReason: 'app_deleted'`). Restore clears `deleted_at` + re-enables endpoints. `GET /api/v1/app?deleted=true` lists trash. 30-day auto-purge via `purgeDeletedApps()` in worker.

**Onboarding (T-072):** `POST /api/v1/onboarding/dismiss` + `GET /api/v1/onboarding/status`. Dual persistence: localStorage (instant) + server (`onboarding_completed_at` on organizations). Auto-dismisses when all 4 steps complete.

**State management (T-075):** `AppsProvider` React Context wraps dashboard layout. `useApps()` hook provides shared `{ apps, loading, refetch, removeApp, addApp }`. Landing page and sidebar both consume from context — mutations update immediately, eliminating stale data across components.

**Shared components:** `Modal` (overlay with Escape/backdrop close), `GettingStartedCard`, `StatusBadge`, `StatCard`. No UI library — all custom with CSS variables.

## Landing & Docs Site (T-020, T-064)

Separate Next.js app at `packages/landing/`. Static export for Vercel. No auth, no DB. Pages: landing (hero, pricing gap, features, code snippet), pricing (4-tier table + FAQ), compare (vs Svix/Hookdeck/Convoy + build-vs-buy), docs (getting started, API reference with signup/applications/billing sections, SDK guide). Umami analytics (self-hosted, proxied via Vercel rewrites). SEO (meta, OG, sitemap, robots.txt).

**Machine-readable docs (T-064):** `public/openapi.json` (OpenAPI 3.1, 23 public paths), `public/llm.txt` (product summary + API quick start), `public/.well-known/agents.json` (capability manifest for agent discovery). CI drift check (`scripts/check-openapi-drift.mjs`) compares code routes vs spec paths — fails if any route is missing from the spec.

## TypeScript SDK (T-019)

`@emithq/sdk` — published to npm. Zero dependencies, fetch-based. 10 methods (sendEvent, CRUD endpoints incl. getEndpoint, replay, testEndpoint). Typed errors (AuthError, ForbiddenError, ValidationError, NotFoundError, RateLimitError, PayloadTooLargeError). Auto-retry on 5xx/408/429/network (3 attempts, exponential backoff). Non-retriable: 400/401/403/404/410. `verifyWebhook()` using WebCrypto API. Auto-published via `publish-sdk.yml` GitHub Actions workflow on version bump in `packages/sdk/package.json` (DEC-036).

## Monitoring & SLOs (T-022)

`GET /health` probes DB (`SELECT 1`) and Redis (`PING`), returns 200 `ok` or 503 `degraded`. `GET /metrics` exposes cross-tenant SLO aggregates via `adminDb`: delivery success/retry/DLQ rates, p50/p95/p99 latency (PostgreSQL `percentile_cont`), BullMQ queue depth, DB pool stats. Protected by `METRICS_SECRET` header. `GET /metrics/slo` returns pass/fail against 3 targets: 99.9% delivery success, <500ms p95, <1000 queue depth. Sentry for error tracking. Better Stack for external uptime + status page. Incident runbook at `docs/RUNBOOK.md`.

## Analytics & Feedback (T-024)

`analytics_events` table for product analytics (no RLS — cross-tenant aggregation via adminDb). `trackEvent()` fire-and-forget helper tracks: `org.created`, `first_event_sent`, `subscription.created/canceled`, `endpoint.created`, `api_key.created`. `GET /metrics/business` returns MRR, ARR, ARPU, tier breakdown, churn from Stripe. `GET /metrics/report` returns 7-day summary of delivery stats + analytics events + tier distribution. GitHub Discussions for feature requests.

## Deployment (T-027)

**Runtime:** `tsx` (esbuild-based TypeScript runner) in production — avoids tsc compilation, path alias resolution, and workspace source export issues (DEC-021). Two Railway services from the same repo:

- **API service:** `tsx src/server.ts` (Hono HTTP server, port from `PORT` env var)
- **Worker service:** `tsx src/worker.ts` (BullMQ delivery worker, no HTTP, `restartPolicyType: ALWAYS`)

Worker entry point: `packages/api/src/worker.ts` — calls `startDeliveryWorker()` from `@emithq/core` with graceful SIGTERM/SIGINT shutdown (30s forced-exit fallback). Also runs `purgeDeletedApps()` on startup and daily (24h interval) to hard-delete applications soft-deleted >30 days ago.

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
| Analytics       | Umami (self) | https://analytics.emithq.com          |
| Uptime          | Better Stack | emithq.betteruptime.com               |

## Testing (T-060, T-097–T-099)

**Unit tests:** Vitest (353 tests across 25 files). Colocated `*.test.ts` files. Mock pattern: `coreMock()` for DB/queue, `authMock()`/`tenantMock()` for middleware. `createTestApp()` factory mounts real route handlers with injected auth context. Test-first stubs for T-090 outreach system: reply classifier (12 categories), campaign state (JSON read/write), inbound API handlers — 42 tests skipped until implementation (T-098).

**E2E tests:** Playwright + `@clerk/testing` in `packages/dashboard/e2e/`. Three suites: browser journey (8-step signup→delivery flow), API-only journey (LLM-automatable flow via `POST /signup`), account management (profile/billing/settings smoke tests). Webhook test fixture (`http.createServer`) records delivered payloads. Auth via Clerk Testing Token + storageState. Requires running services — CI integration deferred to T-038.

**Browser smoke tests (Playwright MCP):** T-097 verified 5 dashboard pages (Clerk auth, navigation, settings tabs). T-099 verified 4 landing site pages (homepage, pricing, compare, docs). Clerk quirks documented in `docs/TEST_PLAN.md`. Testing archetypes tracked in `docs/TEST_PLAN.md`, personas in `docs/PERSONAS.md`.

## Key Decisions

- See docs/DECISIONS.md for architectural decision records
- See docs/research/technical-architecture.md for full architecture research
