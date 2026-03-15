# Why We Built EmitHQ: The $49-$490 Webhook Pricing Gap

_The origin story of an open-source webhook platform for teams that outgrow free tiers but can't justify enterprise pricing._

---

Every SaaS product eventually needs to send webhooks. Your customers want real-time notifications when things happen — an invoice is paid, an order ships, a deployment finishes. You need to deliver those events reliably, with proper signing, retries, and monitoring.

You have two choices: build it yourself or buy a solution. Both have problems.

## Building It Yourself

Building webhook delivery looks simple. It's an HTTP POST. You can ship a v1 in a weekend.

Then reality sets in.

Your first customer reports they're not receiving webhooks. Their server was down for 10 minutes at 3am. You don't have retries yet. You add retries — exponential backoff with jitter, because you read that AWS blog post. Now you need to track delivery attempts. You add a database table.

A week later, another customer's endpoint is returning 500s consistently. Your retry queue is backing up. You need a circuit breaker. And a dead-letter queue. And a way to replay failed events. And a dashboard so your support team can debug delivery issues without SSHing into production.

Six months in, you've built a webhook system that handles 80% of cases. The remaining 20% — payload transformations, multi-tenant isolation, signature verification with the Standard Webhooks spec, endpoint health monitoring — will take another six months. Meanwhile, you're not building your actual product.

We've seen this pattern at multiple SaaS companies. The total cost of a DIY webhook system is 500-1000 engineering hours over two years — $75K-$150K in loaded engineering time.

## Buying a Solution

So you look at managed solutions. The market in 2026 looks like this:

- **Svix:** Open-source (MIT). Great product. Cloud pricing: free tier, then **$490/mo**. If you're a Series A startup doing $50K MRR, spending $490/mo on webhook infrastructure is a hard sell.
- **Hookdeck:** Solid inbound webhook handling. Pricing: free tier, $39/mo (limited to 5 events/second — unusable for production), then **$499/mo** for production-grade features.
- **Convoy:** Open-source (ELv2 — not OSI-approved). Cloud: free tier, $99/mo. Smaller team, less mature.

There's a gap. If you need more than a free tier but less than $490/mo, your options are limited. This is the $49-$490 gap.

## Filling the Gap

EmitHQ fills this gap with four paid tiers:

|            | Free  | Starter | Growth  | Scale   |
| ---------- | ----- | ------- | ------- | ------- |
| **Price**  | $0/mo | $49/mo  | $149/mo | $349/mo |
| **Events** | 100K  | 500K    | 2M      | 10M     |

Retries are free and don't count toward your event limit. Because charging for retries — which happen because the customer's server is having problems — feels wrong.

We're open-source (AGPL-3.0 server, MIT SDKs) because we believe infrastructure software should be inspectable. If you want to self-host, you can. If you want us to run it for you, that's what the cloud is for.

## What We Actually Built

EmitHQ handles both directions:

**Outbound** (you send webhooks to your customers): HMAC-SHA256 signing per the Standard Webhooks spec, configurable retries with exponential backoff and jitter, per-endpoint circuit breakers, dead-letter queue with replay, and payload transformations.

**Inbound** (you receive webhooks from Stripe/GitHub/Shopify): Provider-specific signature verification at the edge via Cloudflare Workers, with sub-50ms acknowledgement.

The architecture is a hybrid edge/origin split. Cloudflare Workers handle inbound reception globally — fast acknowledgement, verify the signature, forward to the origin. The origin (Node.js on Railway) handles the API, delivery workers, and all database operations. PostgreSQL with row-level security handles multi-tenant isolation.

Every message is persisted to PostgreSQL before it's enqueued to Redis. If the queue loses a job, the message is safe in the database.

## The Tech Stack

- **Edge:** Cloudflare Workers (inbound reception, rate limiting)
- **Origin:** Node.js + Hono (API server, BullMQ delivery workers)
- **Database:** Neon PostgreSQL (RLS multi-tenancy)
- **Queue:** BullMQ on Upstash Redis
- **Signing:** Standard Webhooks spec (HMAC-SHA256)
- **SDK:** TypeScript/JavaScript (zero dependencies, WebCrypto)

## What's Next

We're launching with the core delivery engine, dashboard, and TypeScript SDK. On the roadmap:

- Python and Go SDKs
- Inbound webhook routing rules
- Production-hardened self-hosting with Helm charts
- Customer-facing webhook portal (embeddable)

If you're building a SaaS and need webhook infrastructure that doesn't cost $490/mo, give EmitHQ a try. The free tier gives you 100K events — enough to build and ship a real integration.

**GitHub:** https://github.com/Not-Another-Ai-Co/EmitHQ
**Docs:** [docs URL]
**Get started:** `npm install @emithq/sdk`

---

_Tags: #webhooks #opensource #devtools #typescript #saas_
