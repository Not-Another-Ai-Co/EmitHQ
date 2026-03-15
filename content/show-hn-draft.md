# Show HN Draft

**Title:** Show HN: EmitHQ – Open-source webhook infrastructure (AGPL) with a $49/mo cloud

**Post body:**

Hi HN, I built EmitHQ — an open-source platform for sending and receiving webhooks. Server is AGPL-3.0, SDKs are MIT.

**The problem:** If you're building a SaaS and need to send webhooks to your customers, your options are: build it yourself (and maintain retry logic, signing, monitoring, and a dashboard forever), or pay $490+/mo for Svix or Hookdeck. There's almost nothing in between.

I wanted something I could start using at $49/mo and grow with.

**What it does:**

- Outbound: Send webhooks to your customers' endpoints with HMAC signing (Standard Webhooks spec), automatic retries with exponential backoff, a dead-letter queue, and per-endpoint circuit breakers.
- Inbound: Receive webhooks from Stripe/GitHub/Shopify with provider-specific signature verification at the edge (Cloudflare Workers).
- Dashboard: Event log with filtering, delivery attempt details, endpoint health, and DLQ replay.
- Payload transformations: Reshape webhook payloads with JSONPath and template expressions before delivery — no code required.
- TypeScript SDK: `npm install @emithq/sdk` — send your first webhook in 5 minutes.

**Architecture:**

Cloudflare Workers at the edge for fast inbound reception (<50ms). Node.js + Hono on the origin for the API and delivery workers. BullMQ on Redis for the queue. PostgreSQL with row-level security for multi-tenant isolation. Standard Webhooks for signing. Messages are persisted to PostgreSQL before enqueueing — if the queue loses a job, the data is safe.

**Pricing:**

Free tier: 100K events/mo (hard limit, no credit card). Starter: $49/mo for 500K. Growth: $149/mo for 2M. Scale: $349/mo for 10M. Retries are always free and don't count toward your event limit.

**What's missing (being honest):**

- No inbound edge worker deployed yet (the code exists, but only the origin API is live).
- Self-hosting docs are thin — Docker Compose works but isn't production-hardened.
- Only a TypeScript SDK so far. Python and Go are on the roadmap.
- The dashboard is functional but not beautiful.

**Links:**

- GitHub: https://github.com/Not-Another-Ai-Co/EmitHQ
- Docs: https://emithq.com/docs?utm_source=hackernews&utm_medium=social&utm_content=show-hn
- Try it: https://emithq.com?utm_source=hackernews&utm_medium=social&utm_content=show-hn

I'm a solo developer building this. Happy to answer any questions about the architecture, pricing model, or why the world needs another webhook platform.
