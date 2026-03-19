# Archived Decisions

Old and superseded decisions moved here. Full history preserved.

---

## DEC-001 | 2026-03-13 | Product Category: Webhook Infrastructure Platform

**Status:** Active
**Linked to:** T-001, T-002, T-003

**Context:** Researched middleware SaaS opportunities targeting $1M ARR. Evaluated webhook infrastructure, background job orchestration, and SOC2 readiness platforms.

**Decision:** Build a webhook infrastructure platform (both inbound and outbound) filling the $49-490/mo pricing gap.

**Alternatives considered:**

- Background job orchestration (Node.js) — higher complexity, stronger funded competition (Inngest)
- SOC2 pre-audit readiness — requires compliance domain expertise, sales-assisted GTM

**Consequences:** Product must achieve high reliability from day 1. Competes with Svix (MIT, a16z-backed), Hookdeck (proprietary), and Convoy (ELv2, YC W22).

---

## DEC-002 | 2026-03-13 | Pricing: Events-Based with Free/$49/$149/$349 Tiers

**Status:** Active
**Linked to:** T-003

**Context:** Analyzed competitor pricing (Svix $0/$490, Hookdeck $0/$39/$499, Convoy $0/$99) and buyer personas (Series A-C SaaS, $49-299/mo sweet spot).

**Decision:** 4-tier pricing: Free (100K events), Starter ($49, 500K), Growth ($149, 2M), Scale ($349, 10M). Retries free. Events = messages delivered.

**Alternatives considered:**

- Endpoint-based pricing — doesn't correlate with infrastructure cost
- API call pricing — conflates ingestion with management calls

**Consequences:** Must track per-tenant event counts for billing. Free tier hard limit forces upgrade. Overage pricing incentivizes tier upgrades.

---

## DEC-003 | 2026-03-13 | License: AGPL-3.0 Server + MIT SDKs

**Status:** Active
**Linked to:** T-005

**Context:** Evaluated MIT (Svix), ELv2 (Convoy), Apache 2.0 (Outpost), AGPL, and BSL for a bootstrapped solo-dev SaaS.

**Decision:** AGPL-3.0 for server (copyleft prevents SaaS clones), MIT for SDKs (maximum adoption). CLA for dual-licensing contributor code.

**Alternatives considered:**

- MIT — too permissive for solo founder; cloud providers could clone
- ELv2 — not OSI-approved; limits community trust
- BSL — source-available but not open-source; time-bomb complexity

**Consequences:** Corporate legal teams will prefer cloud over self-hosting (AGPL deterrent effect). Must implement CLA bot for contributors.

---

## DEC-004 | 2026-03-13 | Architecture: Edge/Origin Hybrid with CF Workers + Railway

**Status:** Active
**Linked to:** T-008

**Context:** Needed fast inbound webhook reception (<50ms) globally, plus reliable outbound delivery with persistent queue workers.

**Decision:** Cloudflare Workers for edge (inbound reception, signature verification, rate limiting). Railway for origin (API server, BullMQ workers, PostgreSQL access). QStash bridges edge→origin.

**Alternatives considered:**

- All-Railway — no edge presence, slower inbound reception
- All-Workers — can't run persistent queue consumers, no TCP connections
- Fly.io instead of Railway — comparable, but Railway has simpler DX

**Consequences:** Code must be portable between Workers and Node.js (Hono enables this). Edge code limited to 128MB memory, no filesystem.

---

## DEC-005 | 2026-03-13 | Multi-Tenancy: Shared Schema + PostgreSQL RLS

**Status:** Active
**Linked to:** T-008

**Context:** Webhook platforms serve thousands of tenants. Needed simple schema evolution and strong isolation.

**Decision:** Shared schema with `org_id` on every table. PostgreSQL Row-Level Security policies. `SET LOCAL app.current_tenant` per request.

**Alternatives considered:**

- Schema-per-tenant — migration complexity at N schemas
- Database-per-tenant — operational overhead, connection explosion

**Consequences:** Application DB role must NOT be superuser (bypasses RLS). Every query must set tenant context. Denormalize org_id on child tables for RLS performance.

---

## DEC-006 | 2026-03-13 | Entity: Nevada LLC

**Status:** Superseded by DEC-018
**Linked to:** T-004

**Context:** Solo bootstrapped SaaS, founder based in Nevada. Evaluated LLC vs C-Corp, Nevada vs Delaware.

**Decision:** Nevada LLC. Pass-through taxation, no state income tax, $425 formation + $350/year.

**Alternatives considered:**

- Delaware C-Corp — better for VC but unnecessary for bootstrapped; adds franchise tax + registered agent cost
- Nevada C-Corp — double taxation without VC benefit

**Consequences:** Convert to C-Corp if/when raising institutional VC or issuing employee stock options.

---

## DEC-007 | 2026-03-13 | Brand: EmitHQ

**Status:** Active
**Linked to:** T-009

**Context:** Needed a short, memorable, developer-friendly name not in the "Hook-" namespace.

**Decision:** EmitHQ. Domain: emithq.com. "Emit" is developer-native vocabulary (events emit). "HQ" avoids generic word conflicts and improves SEO.

**Alternatives considered:**

- Emit (bare) — emit.dev unavailable; generic word SEO challenges
- Herald — existing heraldapp on GitHub; common word
- Signet — Signet Jewelers dominates SEO
- Pylon — taken ($20M B2B support platform)

**Consequences:** All branding, code, and docs use "EmitHQ" as product name. Repo under Not-Another-Ai-Co GitHub org.

---

## DEC-008 | 2026-03-13 | Auth: Dual Clerk Sessions + Custom API Keys

**Status:** Active
**Linked to:** T-012

**Context:** EmitHQ needs two auth modes — browser dashboard (Clerk sessions) and programmatic SDK/API access (API keys). Architecture spec had a single `api_key_hash` column on organizations.

**Decision:** Dual auth via `@hono/clerk-auth` middleware + custom `emhq_` prefixed API keys. Separate `api_keys` table (not a column on organizations) for multiple active keys per org, zero-downtime rotation, and soft-delete revocation. Clerk org ID maps to internal `org_id` via `clerk_org_id` column on organizations. SHA-256 hashing for key storage, `timingSafeEqual` for verification.

**Alternatives considered:**

- Clerk-only API keys (`acceptsToken: 'api_key'`) — less control over prefix, rotation, revocation
- Single `api_key_hash` on organizations — no rotation support, one key per org
- bcrypt for key hashing — unnecessary for high-entropy secrets (192-bit), adds 100ms per request

**Consequences:** Two DB roles needed: `app_user` (RLS enforced) and `app_admin` (BYPASSRLS for org/key lookup). Direct Neon connection required (not pooler) for `SET LOCAL` support. Key shown once on creation — lost keys require rotation.

---

## DEC-009 | 2026-03-13 | DB: Drizzle ORM with Native RLS Policies

**Status:** Active
**Linked to:** T-012

**Context:** Needed an ORM that supports PostgreSQL RLS policies as first-class schema citizens, with migration generation.

**Decision:** Drizzle ORM with `pgPolicy()` for inline RLS policy definitions. `drizzle-kit generate` emits RLS SQL automatically. `db.transaction()` + `SET LOCAL app.current_tenant` for tenant isolation (Drizzle guarantees connection affinity). `node-postgres` driver with direct Neon connection.

**Alternatives considered:**

- Prisma — no native RLS support; would require raw SQL migrations for policies
- Raw SQL migrations — more control but no schema-as-code, harder to maintain
- Neon HTTP driver — doesn't support multi-statement transactions needed for SET LOCAL

**Consequences:** Schema changes go through `drizzle-kit generate` → `drizzle-kit migrate`. Migrations must run as `app_admin` (BYPASSRLS), not `app_user`. `entities.roles.provider: 'neon'` in drizzle config to avoid managing Neon system roles.

---

## DEC-010 | 2026-03-13 | Event Ingestion: Persist-Before-Enqueue with BullMQ

**Status:** Active
**Linked to:** T-013

**Context:** Event ingestion endpoint needs to accept webhook messages and fan them out to delivery endpoints. Queue reliability and data durability are critical — losing a customer's event is unacceptable.

**Decision:** Persist message + delivery_attempt rows to PostgreSQL within the tenant-scoped transaction BEFORE enqueueing BullMQ jobs. Queue failures are non-fatal — the message is safe in DB. BullMQ uses ioredis (TCP) to Upstash Redis with TLS. Queue and Worker are decoupled — T-013 only enqueues, T-014 adds the worker.

**Alternatives considered:**

- Enqueue first, persist later — risks data loss if worker processes before DB write
- PostgreSQL-only queue (SKIP LOCKED) — simpler but less performant than BullMQ for high throughput

**Consequences:** Recovery sweep needed (T-014) for pending delivery_attempts without corresponding BullMQ jobs. Upstash Fixed plan recommended over Pay-Per-Request for BullMQ polling costs.

---

## DEC-011 | 2026-03-13 | Rate Limiting: Monthly Quota via event_count_month

**Status:** Active
**Linked to:** T-013

**Context:** Need per-tenant rate limiting based on pricing tiers (free=100K, starter=500K, growth=2M, scale=10M events/month).

**Decision:** MVP uses `event_count_month` column on organizations table, incremented atomically in the same PostgreSQL transaction as message insert. Custom quota middleware checks count against tier limit before ingestion. No Redis-backed burst limiting for MVP — Cloudflare Workers handle edge-level rate limiting.

**Alternatives considered:**

- Redis-backed per-second rate limiting (`hono-rate-limiter`) — adds complexity and another Redis dependency for a concern already handled at the edge
- Token bucket algorithm — overkill for monthly counters

**Consequences:** Need a monthly cron to reset `event_count_month = 0`. Burst limiting deferred to post-launch if abuse is observed.

---

## DEC-012 | 2026-03-13 | Delivery Worker: Standard Webhooks Signing + Circuit Breaker

**Status:** Active
**Linked to:** T-014

**Context:** Outbound webhook delivery needs HMAC signing per Standard Webhooks spec, configurable timeouts, and automatic endpoint disabling after consecutive failures.

**Decision:** BullMQ Worker using `adminDb` (BYPASSRLS) for cross-tenant processing. Standard Webhooks signing: `HMAC-SHA256(msg_{id}.{timestamp}.{body}, whsec_secret)` → `v1,{base64}`. Native `fetch` + `AbortSignal.timeout()` for HTTP delivery (Node 22+, no deps). Non-retriable codes (400/401/403/404/410) throw `UnrecoverableError`. Circuit breaker: `failureCount` incremented per failure, endpoint disabled at ≥10 consecutive failures, reset on success.

**Alternatives considered:**

- undici HTTP client — more control over connection pooling, but native fetch is sufficient for MVP
- Transient "delivering" status — adds a DB write with no consumer until dashboard (T-017); deferred

**Consequences:** Worker concurrency capped at 5 (matching `adminPool.max`). Response body truncated to 1KB. T-015 will refine retry schedule with custom backoff strategy.

---

## DEC-013 | 2026-03-13 | Retry: Full-Jitter Fixed Schedule + BullMQ Failed Set as DLQ

**Status:** Active
**Linked to:** T-015

**Context:** Architecture spec defines a specific retry schedule (5s/30s/2m/15m/1h/4h/24h) with full jitter. BullMQ has no native DLQ — exhausted jobs land in the Redis failed set.

**Decision:** Fixed delay array indexed by `attemptsMade` with full jitter (`Math.floor(Math.random() * cap)`) via BullMQ's `settings.backoffStrategy`. BullMQ's built-in failed set serves as DLQ for MVP — `worker.on('failed')` detects exhaustion (`attemptsMade >= MAX_DELIVERY_ATTEMPTS`) and marks DB status as `exhausted`. Replay creates a fresh job with reset attempts (not `job.retry()` which preserves attempt count). `reEnableEndpoint()` resets `disabled`, `disabledReason`, and `failureCount`.

**Alternatives considered:**

- Separate `webhook-dlq` BullMQ queue — cleaner separation but adds Redis overhead and complexity for MVP
- BullMQ built-in exponential backoff — doesn't match spec schedule, no full jitter
- Pure exponential formula — approximates but doesn't match exact spec delays

**Consequences:** `delivery_attempts.status` now has 4 values: `pending`, `delivered`, `failed`, `exhausted`. `nextAttemptAt` populated on failure for dashboard display. Replay API at `POST /api/v1/app/:appId/msg/:msgId/retry`.

---

## DEC-014 | 2026-03-13 | Transformation: Zero-Dependency JSONPath Subset + Templates

**Status:** Active
**Linked to:** T-018

**Context:** Payload transformation is a key differentiator. Needed JSONPath extraction + template interpolation for reshaping webhook payloads before delivery.

**Decision:** Custom zero-dependency implementation (~230 lines). JSONPath dot-notation subset ($.key, $.arr[0], $.obj['key']). Template interpolation ({{...}}). Built-in functions (formatDate, uppercase, lowercase, concat). Per-endpoint `transformRules` JSONB column. Applied in delivery worker before signing.

**Alternatives considered:**

- jsonpath-plus library — 150KB, security risk from filter expressions, still needs custom template code
- jsonata — 200KB, non-standard syntax, overkill for field mapping

**Consequences:** Prototype pollution blocked via BLOCKED_KEYS set. Input limits enforced (20 rules, 256 char paths, 512 char templates). targetField validated against whitelist regex.

---

## DEC-015 | 2026-03-13 | SDK: Zero-Dependency Fetch-Based TypeScript Client

**Status:** Active
**Linked to:** T-019

**Context:** TypeScript SDK is the primary developer experience. Needed typed client, error handling, retry logic, and webhook verification.

**Decision:** Zero runtime dependencies. Native `fetch` + `AbortController` for HTTP. Typed error classes mapped from HTTP status codes. Client-side retry (3 attempts, exponential backoff with jitter) on 5xx/network errors. `verifyWebhook()` using WebCrypto API for universal compatibility (Node 18+, browsers, edge). Published as `@emithq/sdk` on npm (MIT license).

**Alternatives considered:**

- axios/undici — unnecessary dependency for a simple REST client
- Node crypto.timingSafeEqual for verification — not available in browsers/edge runtimes

**Consequences:** SDK works everywhere WebCrypto is available. Custom timing-safe comparison for signature verification (XOR-based, constant-time).

---

## DEC-016 | 2026-03-13 | Dashboard: Separate Next.js App Calling API Over HTTP

**Status:** Active
**Linked to:** T-017

**Context:** Dashboard needs to display event logs, delivery attempts, endpoint health, and DLQ. Could either import @emithq/core directly or call API endpoints.

**Decision:** Separate `packages/dashboard` Next.js 15 App Router app. Calls API server over HTTP (not direct DB access). Clerk-wrapped for auth. Client components for interactive pages (events, endpoints, DLQ), server component for overview stats.

**Alternatives considered:**

- Direct @emithq/core import from Server Components — tighter coupling, bypasses API as single entry point
- Single app with dashboard + landing — different auth requirements (Clerk vs public)

**Consequences:** Required building 6 new dashboard API endpoints (message list, detail, attempts, stats, DLQ, endpoint-health). Dashboard and API are independently deployable.

---

## DEC-017 | 2026-03-13 | Landing Site: Separate Static Next.js App on CF Pages

**Status:** Active
**Linked to:** T-020

**Context:** Marketing site and documentation need to be public (no auth), fast (static), and separately deployable from the dashboard.

**Decision:** Separate `packages/landing` Next.js app with `output: 'export'` for static HTML generation. Deployed to Cloudflare Pages. No Clerk, no @emithq/core dependency. Plausible analytics (privacy-friendly, no cookies). Indigo/violet brand colors (#6366F1).

**Alternatives considered:**

- Part of dashboard app — would require conditional Clerk wrapping and public route exceptions
- Astro — good fit for static sites but adds another framework to learn

**Consequences:** Two Next.js apps in the monorepo (dashboard + landing). Landing site content must be kept in sync with API changes manually.
