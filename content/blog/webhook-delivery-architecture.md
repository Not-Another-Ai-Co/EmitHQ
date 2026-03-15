# Webhook Delivery Architecture: How EmitHQ Achieves Reliable Delivery

_A technical deep-dive into the edge/origin split, persist-before-enqueue pattern, retry strategy, and circuit breakers that power EmitHQ's delivery engine._

---

Webhook delivery is deceptively simple: receive an event, POST it to an endpoint. In practice, the hard parts are everything that happens when that POST fails.

This post walks through EmitHQ's architecture — the decisions we made, the tradeoffs we accepted, and the patterns that keep delivery reliable.

## The Edge/Origin Split

EmitHQ uses a hybrid architecture. Cloudflare Workers handle inbound webhook reception at the edge. Node.js on Railway handles everything else.

```
Inbound webhook (Stripe, GitHub)
        |
  Cloudflare Worker (edge)
  - Verify provider signature
  - Return 200 in <50ms
  - Forward to origin via QStash
        |
  Railway (origin)
  - API server (Hono)
  - BullMQ delivery workers
  - PostgreSQL (Neon)
  - Redis (Upstash)
```

**Why split?** Webhook providers have timeout expectations. Stripe expects a response within 5-20 seconds. GitHub within 10 seconds. By acknowledging at the edge, we return 200 in under 50 milliseconds regardless of origin load. The actual processing happens asynchronously.

The edge worker does three things: verify the provider's signature (HMAC, timing-safe comparison), return 200, and forward the payload to the origin via QStash (Upstash's durable HTTP queue). QStash guarantees at-least-once delivery to our origin, even if Railway is temporarily down.

## Persist Before Enqueue

This is the most important architectural decision in the system.

When a customer sends an event through our API, we persist the message and all delivery attempt records to PostgreSQL **before** enqueueing jobs to Redis/BullMQ.

```
API Request → Validate → Begin Transaction
  → INSERT message
  → INSERT delivery_attempt (one per endpoint, status=pending)
  → INCREMENT event_count_month
  → COMMIT
  → Enqueue BullMQ jobs (best effort)
  → Return 202 Accepted
```

If the BullMQ enqueue fails (Redis down, network partition), the message is safe in PostgreSQL. A recovery sweep can find pending delivery_attempts without corresponding queue jobs and re-enqueue them.

The alternative — enqueue first, persist later — risks losing messages if the worker processes the job before the database write completes, or if the API crashes between enqueue and persist.

## Delivery and Signing

Each delivery attempt follows the Standard Webhooks specification:

```
Headers:
  webhook-id: msg_2Xh9J...
  webhook-timestamp: 1710000000
  webhook-signature: v1,K5oZfzN95Z9UVu...

Signed content: {webhook-id}.{webhook-timestamp}.{raw_body}
Algorithm: HMAC-SHA256, base64-encoded
```

Every endpoint gets its own signing secret (`whsec_` prefix). Independent rotation, no cross-endpoint impact. The SDK provides `verifyWebhook()` using the WebCrypto API, so it works in Node.js, browsers, and edge runtimes.

Delivery uses native `fetch` with `AbortSignal.timeout()` (Node 22+). Default timeout is 30 seconds per endpoint. Response body is captured but truncated to 1KB for debugging.

## Retry Strategy

Failed deliveries retry with exponential backoff and full jitter:

| Attempt | Base Delay | With Jitter |
| ------- | ---------- | ----------- |
| 1       | Immediate  | 0           |
| 2       | 5s         | 0-5s        |
| 3       | 30s        | 0-30s       |
| 4       | 2m         | 0-2m        |
| 5       | 15m        | 0-15m       |
| 6       | 1h         | 0-1h        |
| 7       | 4h         | 0-4h        |
| 8       | 24h        | 0-24h       |

Full jitter (random delay between 0 and the base) prevents thundering herd when many deliveries fail simultaneously. BullMQ's custom backoff strategy implements this directly.

Not all failures are retried. Status codes 400, 401, 403, 404, and 410 are permanent — retrying won't fix them. These throw `UnrecoverableError` in BullMQ, which moves the job to the failed set immediately.

After exhausting all 8 attempts, the delivery moves to the dead-letter queue (BullMQ's failed set). The event is marked `exhausted` in the database. Customers can replay from the DLQ via the API or dashboard.

## Circuit Breaker

Per-endpoint circuit breakers prevent a single broken endpoint from consuming all worker capacity.

Every failed delivery increments the endpoint's `failureCount`. On success, it resets to 0. When `failureCount` reaches 10, the endpoint is automatically disabled with `disabledReason: 'circuit_breaker'`.

Disabled endpoints don't receive new deliveries. They can be re-enabled via the API (which resets `failureCount` and clears the reason), or the dashboard.

## Multi-Tenant Isolation

EmitHQ uses PostgreSQL Row-Level Security for tenant isolation. Every table has an `org_id` column with an RLS policy:

```sql
CREATE POLICY tenant_isolation ON messages
  AS RESTRICTIVE
  USING (org_id = current_setting('app.current_tenant')::uuid);
```

Every request runs inside a transaction that sets `SET LOCAL app.current_tenant = '{orgId}'`. Even if application code has a bug, the database enforces isolation — a query can never return another tenant's data.

Two database roles enforce this: `app_user` (RLS enforced, used at runtime) and `app_admin` (BYPASSRLS, used for org lookups before tenant context is established, and by delivery workers that process jobs across tenants).

## Queue Architecture

BullMQ on Upstash Redis handles the delivery queue. Key design choices:

- **One queue, one worker pool.** Simpler than per-tenant queues. Worker concurrency is capped at 5 (matching the admin database connection pool).
- **Job ID = delivery attempt ID.** Prevents duplicate enqueues if the API retries.
- **Completed jobs auto-prune** at 1,000. Failed jobs (DLQ) retain 5,000 for replay.
- **BullMQ's failed set serves as the DLQ.** No separate dead-letter queue — the built-in failed set plus the `exhausted` status in PostgreSQL is sufficient for MVP.

## What We'd Change

Nothing is perfect. A few things we'd approach differently with hindsight:

- **Structured logging from day one.** We added Sentry for error tracking but don't have structured JSON logs yet. Debugging delivery issues in production will require it.
- **Separate read/write database pools.** The shared pool works for now, but read-heavy dashboard queries will compete with write-heavy delivery workers at scale.
- **WebSocket delivery status.** The dashboard polls for updates. Real-time delivery status via WebSockets would be better UX.

## Try It

The entire codebase is open-source (AGPL-3.0 server, MIT SDKs). You can read every line of code described in this post.

- **GitHub:** https://github.com/Not-Another-Ai-Co/EmitHQ
- **Get started:** `npm install @emithq/sdk`
- **Free tier:** 100K events/month, no credit card required

---

_Tags: #webhooks #architecture #typescript #opensource #devtools_
