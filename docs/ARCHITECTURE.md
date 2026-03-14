# Architecture — EmitHQ

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
10. Worker (T-014): sign payload, POST to endpoint, record result
11. On failure: exponential backoff with jitter, circuit breaker per endpoint
12. On exhaustion: move to DLQ, send operational webhook

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

## Key Decisions
- See docs/DECISIONS.md for architectural decision records
- See docs/research/technical-architecture.md for full architecture research
