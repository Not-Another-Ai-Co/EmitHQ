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

## Data Flow: Outbound

1. Customer calls `POST /api/v1/app/{app_id}/msg/` with event payload
2. API validates auth → sets RLS context → persists message to PostgreSQL
3. Fan-out: create delivery_attempt row per matching endpoint
4. Enqueue BullMQ job per delivery
5. Worker: sign payload (Standard Webhooks), POST to endpoint, record result
6. On failure: exponential backoff with jitter, circuit breaker per endpoint
7. On exhaustion: move to DLQ, send operational webhook

## Data Flow: Inbound

1. Provider (Stripe/GitHub) POSTs to `/webhooks/inbound/{source_id}`
2. Cloudflare Worker verifies provider signature, returns 200 immediately
3. Forwards to origin via QStash
4. Origin persists event, optionally fans out to outbound delivery

## Multi-Tenancy

Shared schema with PostgreSQL Row-Level Security. `org_id` on every table. `SET LOCAL app.current_tenant` per request.

## Key Decisions
- See docs/DECISIONS.md for architectural decision records
- See docs/research/technical-architecture.md for full architecture research
