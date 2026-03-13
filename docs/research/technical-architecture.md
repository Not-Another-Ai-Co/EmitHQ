# Research: Technical Architecture Decision
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-008

## Summary

Hybrid edge/origin architecture: Cloudflare Workers handle inbound webhook reception (signature verification, rate limiting, instant 200 response) and forward via QStash to Railway origin. Railway runs the API server, BullMQ workers for outbound delivery, and all database operations. PostgreSQL (Neon) is the system of record with RLS for tenant isolation. Upstash Redis for BullMQ queues and caching. Standard Webhooks spec for outbound signing. Shared-schema multi-tenancy with org_id on every table.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS (Edge)                 │
│                                                             │
│  Inbound Webhooks    Rate Limiting    API Key Validation    │
│  (Stripe, GitHub)    (Redis REST)     (Redis cache lookup)  │
│       │                                     │               │
│       ▼                                     ▼               │
│  Verify Signature    ──────────────►  Forward to Origin     │
│  Return 200 fast                      via QStash            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   QStash    │  (Upstash — durable HTTP queue)
                    └──────┬──────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    RAILWAY (Origin Server)                    │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  API Server  │   │  BullMQ      │   │  Scheduler      │  │
│  │  (Hono/Elysia│   │  Workers     │   │  (retry timing, │  │
│  │   REST API)  │   │  (delivery)  │   │   health checks)│  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬────────┘  │
│         │                  │                     │           │
│         ▼                  ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Upstash Redis (BullMQ queues + cache)    │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Neon PostgreSQL (system of record)        │   │
│  │              RLS: org_id on every table                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Event Flow: Inbound (Receive from Stripe/GitHub)

```
1. Stripe/GitHub POSTs to https://api.[product].com/webhooks/inbound/{source_id}
2. Cloudflare Worker receives request
3. Look up source config from Redis cache (provider type, signing secret)
4. Verify provider-specific signature (HMAC-SHA256, timing-safe compare)
5. Return 200 OK immediately (< 50ms)
6. ctx.waitUntil() → publish to QStash with {source_id, payload, headers}
7. QStash durably stores and delivers to Railway endpoint
8. Railway worker: match source → org, persist to inbound_events table
9. Optionally fan out to outbound delivery if routing rules configured
```

## Event Flow: Outbound (Send to Customer Endpoints)

```
1. Customer calls POST /api/v1/app/{app_id}/msg/ with event payload
2. API server validates auth (API key → org lookup → set RLS context)
3. Persist message to PostgreSQL (BEFORE queueing — critical)
4. Fan out: for each matching endpoint, create delivery_attempt row (status=pending)
5. Enqueue one BullMQ job per endpoint delivery
6. BullMQ Worker picks up job:
   a. Load endpoint config + signing secret (from Redis cache or DB)
   b. Sign payload (Standard Webhooks: webhook-id, webhook-timestamp, webhook-signature)
   c. HTTP POST to customer endpoint (30s timeout)
   d. On 2xx: update attempt → success, reset failure counter
   e. On 5xx/timeout: BullMQ schedules retry with exponential backoff + jitter
   f. On exhaustion: move to DLQ, send operational webhook to org
   g. Check circuit breaker: if failure_count >= threshold → disable endpoint
```

## Multi-Tenancy Model

**Decision: Shared schema + tenant_id + PostgreSQL Row-Level Security (RLS)**

Rationale: Webhook platforms serve thousands of tenants. Schema evolution touches one schema. RLS bakes isolation into the database — even buggy app code can't leak cross-tenant data.

### Resource Hierarchy

```
Organization (our customer — the SaaS company)
├── Application (their customer — one per end-user)
│   ├── Endpoint (delivery destination URL, multiple per app)
│   └── Message (webhook event to send)
│       └── DeliveryAttempt (one per message × endpoint)
├── InboundSource (Stripe, GitHub, etc.)
└── EventType (schema definitions)
```

### Database Schema

```sql
-- Organizations (our customers)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  api_key_hash TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',  -- free, starter, growth, scale
  event_count_month INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications (their customers)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  uid TEXT,  -- user-defined ID (interchangeable with id in API)
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, uid)
);

-- Endpoints (delivery destinations)
CREATE TABLE endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES applications(id),
  org_id UUID NOT NULL,  -- denormalized for RLS
  uid TEXT,
  url TEXT NOT NULL,
  description TEXT,
  signing_secret TEXT NOT NULL,  -- encrypted at rest
  event_type_filter TEXT[],  -- NULL = all types
  disabled BOOLEAN DEFAULT FALSE,
  disabled_reason TEXT,
  failure_count INT DEFAULT 0,
  rate_limit INT,  -- max deliveries per second
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (webhook events)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES applications(id),
  org_id UUID NOT NULL,
  event_id TEXT,  -- idempotency key from sender
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, event_id)
);

-- Delivery attempts
CREATE TABLE delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  endpoint_id UUID NOT NULL REFERENCES endpoints(id),
  org_id UUID NOT NULL,
  attempt_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_status INT,
  response_body TEXT,
  response_time_ms INT,
  error_message TEXT,
  next_attempt_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound sources
CREATE TABLE inbound_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  provider TEXT NOT NULL,
  label TEXT,
  signing_secret TEXT NOT NULL,  -- encrypted
  endpoint_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON applications
  AS RESTRICTIVE USING (org_id = current_setting('app.current_tenant')::uuid);
-- (repeat for each table)

-- Key indices
CREATE INDEX idx_messages_app_created ON messages(app_id, created_at DESC);
CREATE INDEX idx_attempts_retry ON delivery_attempts(endpoint_id, status, next_attempt_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX idx_attempts_message ON delivery_attempts(message_id);
CREATE INDEX idx_endpoints_app ON endpoints(app_id) WHERE NOT disabled;
```

## Edge vs Origin Split

| Component | Where | Why |
|-----------|-------|-----|
| Inbound webhook reception | Cloudflare Workers | Sub-50ms response, global PoPs, absorb burst traffic |
| Signature verification (inbound) | Cloudflare Workers | Stateless HMAC, no DB needed |
| Rate limiting | Cloudflare Workers + Upstash Redis REST | Edge enforcement, Redis REST compatible |
| API key validation (cache) | Cloudflare Workers + Redis cache | Fast reject of invalid keys |
| REST API server | Railway | Needs persistent DB connections |
| BullMQ delivery workers | Railway | Needs TCP Redis + PostgreSQL connections |
| Outbound signing | Railway | Needs signing secrets from DB |
| Dashboard/Portal | Railway + static assets on CF Pages | SSR + API on origin, assets at edge |
| Retry scheduler | Railway | Long-running process with queue access |

## Retry Strategy

**Default schedule (configurable per endpoint):**

| Attempt | Delay | Cumulative |
|---------|-------|------------|
| 1 | Immediate | 0 |
| 2 | ~30s (jittered) | ~30s |
| 3 | ~2m (jittered) | ~2.5m |
| 4 | ~15m (jittered) | ~17m |
| 5 | ~1h (jittered) | ~1h 17m |
| 6 | ~4h (jittered) | ~5h 17m |
| 7 | ~12h (jittered) | ~17h |
| 8 | ~12h (jittered) | ~29h |

**Algorithm:** Full jitter exponential backoff
```
exponentialDelay = min(cap, initialDelay × 2^retry)
actualDelay = random(0, exponentialDelay)
```

**Non-retriable status codes:** 401, 403, 404 (permanent errors — won't fix themselves)
**Retriable:** 5xx, 408, 429, connection errors, timeouts

**Circuit breaker:** Per endpoint. 10 consecutive failures → auto-disable. Send `endpoint.disabled` operational webhook. Half-open probe after 30 seconds of cooldown.

**Dead-letter queue:** After exhausting all retries → move to DLQ. Send `message.attempt.exhausted` operational webhook. Manual replay via API or dashboard.

## Webhook Signing (Standard Webhooks Spec)

**Outbound (we sign for customers):**
```
Headers:
  webhook-id: msg_2Xh9J...
  webhook-timestamp: 1710000000
  webhook-signature: v1,K5oZfzN95Z9UVu...

Signed content: {webhook-id}.{webhook-timestamp}.{raw_body}
Algorithm: HMAC-SHA256, base64-encoded
Secret format: whsec_{base64_random}
```

**Inbound verification (provider-specific):**

| Provider | Header | Format |
|----------|--------|--------|
| Stripe | `Stripe-Signature` | `t={ts},v1={hex_hmac}` |
| GitHub | `X-Hub-Signature-256` | `sha256={hex_hmac}` |
| Shopify | `X-Shopify-Hmac-Sha256` | base64 HMAC |
| Slack | `X-Slack-Signature` | `v0={hex_hmac}` of `v0:{ts}:{body}` |
| Standard Webhooks | `webhook-signature` | `v1,{base64_hmac}` |

All verification uses `crypto.timingSafeEqual` — never string equality.

## API Surface (MVP)

**Authentication:** `Authorization: Bearer {api_key}` — API key hashed with SHA-256, stored in organizations table.

**Core endpoints:**
```
POST   /api/v1/app/                          Create application
GET    /api/v1/app/                          List applications
GET    /api/v1/app/{app_id}/                 Get application
POST   /api/v1/app/{app_id}/endpoint/        Create endpoint
GET    /api/v1/app/{app_id}/endpoint/        List endpoints
PUT    /api/v1/app/{app_id}/endpoint/{ep_id}/ Update endpoint
DELETE /api/v1/app/{app_id}/endpoint/{ep_id}/ Delete endpoint
POST   /api/v1/app/{app_id}/msg/             Send message (triggers delivery)
GET    /api/v1/app/{app_id}/msg/             List messages
GET    /api/v1/app/{app_id}/msg/{msg_id}/    Get message + attempts
POST   /api/v1/app/{app_id}/msg/{msg_id}/retry/ Retry failed message
POST   /webhooks/inbound/{source_id}         Receive inbound webhook
```

**Pagination:** Cursor-based (not offset). Response: `{ data: [...], iterator: "cursor", done: false }`

**Versioning:** URL path `/api/v1/`. No breaking changes within version.

## Infrastructure Cost Model

| Volume | CF Workers | Neon PG | Upstash Redis | QStash | Railway | Total |
|--------|-----------|---------|---------------|--------|---------|-------|
| 100K evt/mo | $0 | $0 (free) | $0 (free) | $0 (free) | $5 | **~$5/mo** |
| 1M evt/mo | $0.30 | $5 | $2 | $1 | $10 | **~$18/mo** |
| 10M evt/mo | $3 | $15 | $20 | $10 | $30 | **~$78/mo** |
| 100M evt/mo | $30 | $80 | $200 | $100 | $100 | **~$510/mo** |

At $1M ARR (419 customers, ~50M events/mo aggregate): infrastructure cost ~$300-500/mo = **99%+ gross margin on infrastructure.**

## Technology Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Edge runtime | Cloudflare Workers | Zero cold starts, 330+ PoPs, free 10M requests |
| Origin runtime | Node.js on Railway | Best AI tooling, TypeScript, persistent connections |
| API framework | Hono or Elysia | Lightweight, TypeScript-native, Works on both CF Workers and Node |
| Database | Neon PostgreSQL | Serverless, branching for dev, RLS support |
| Queue | BullMQ on Upstash Redis | Reliable job queue with retry/backoff built-in |
| Edge→Origin queue | Upstash QStash | HTTP-based, durable, works from CF Workers |
| Auth | Clerk | Managed auth, team management, SSO (Scale tier) |
| Payments | Stripe | Industry standard, usage-based billing support |
| Monitoring | Better Stack | Uptime monitoring, status page, log aggregation |
| Error tracking | Sentry | Free tier, good TypeScript support |
| Analytics | PostHog or Plausible | Privacy-friendly, developer-focused |

## Key Architectural Decisions

1. **Persist before enqueue** — message in PostgreSQL before Redis queue. If queue loses the job, DB has it.
2. **Standard Webhooks for signing** — interoperable with 30+ companies. Don't invent a new spec.
3. **Shared-schema + RLS** — single database, row-level security for tenant isolation.
4. **Edge for fast ack, origin for delivery** — Cloudflare Workers return 200 in <50ms; Railway workers do the actual HTTP delivery.
5. **BullMQ for outbound, QStash for inbound relay** — BullMQ gives fine-grained control for delivery; QStash bridges edge→origin durably.
6. **Hono as API framework** — runs on both Cloudflare Workers and Node.js, enabling code sharing between edge and origin.
7. **uid support on all resources** — customers use their own IDs, don't need to store our internal UUIDs.
8. **Per-endpoint signing secrets** — independent rotation, no cross-endpoint impact.
9. **Idempotency via UNIQUE(app_id, event_id)** — deduplication at database level.
10. **Circuit breaker per endpoint** — failure tracking in Redis, auto-disable at threshold, operational webhook notification.

## Sources

- Full agent artifact: `docs/tmp/build-explore-delivery-architecture.md`
- Svix architecture blog, retry docs, entity model
- Convoy architecture docs, control/data plane design
- Hookdeck webhooks-at-scale blog, retry best practices
- Standard Webhooks spec (github.com/standard-webhooks)
- AWS exponential backoff and jitter research
- Neon connection method guide
- BullMQ webhook delivery patterns
