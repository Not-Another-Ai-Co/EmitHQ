# Show HN Draft

> Fill in `[PLACEHOLDER]` values after T-045 (production smoke test) and beta user acquisition.

## Title

Show HN: EmitHQ -- Open-source webhook infrastructure with a $49/mo cloud

## Post Body

Hi HN, I'm Julian. I've been building SaaS products for the past few years, and every time I need webhook delivery, I hit the same wall: Svix jumps from free to $490/mo, Hookdeck from $39 to $499, and everything in between is "contact sales." So I built EmitHQ.

**The problem:** If you're a Series A-C SaaS sending webhooks to your customers' endpoints, your options are: (1) build it yourself and discover the 12 things you forgot, or (2) pay enterprise pricing before you have enterprise revenue.

**What EmitHQ does:**

- Outbound webhook delivery with automatic retries (exponential backoff + jitter, 8 attempts over 29 hours)
- Per-endpoint signing secrets using the Standard Webhooks spec (HMAC-SHA256)
- Circuit breaker per endpoint (auto-disable after 10 consecutive failures, operational webhook notification)
- Dead-letter queue with manual replay via API or dashboard
- Payload transformations (JSONPath extraction + template interpolation, per-endpoint)
- Real-time dashboard showing delivery attempts, endpoint health, and event logs
- TypeScript SDK (`@emithq/sdk` on npm) with auto-retry and webhook verification

**Pricing:** Free (100K events/mo), Starter ($49/mo, 500K), Growth ($149/mo, 2M), Scale ($349/mo, 10M). No credit card required.

**What "build it yourself" actually means:**

I've seen the "I built webhooks in a weekend" take before, so here's what that weekend doesn't cover: per-endpoint signing with independent key rotation, timing-safe signature verification (`crypto.timingSafeEqual`, not string equality), circuit breakers that auto-disable failing endpoints, a dead-letter queue with replay, retry scheduling with jitter to avoid thundering herd, payload transformations, a customer-facing delivery log, rate limiting per tenant, and usage-based billing. That's not a weekend -- that's a quarter of eng time, and it still won't have observability.

**Security:**

- Every endpoint gets its own `whsec_` signing secret (compromising one doesn't affect others)
- All signature verification uses `crypto.timingSafeEqual` -- never string comparison
- Standard Webhooks spec compliant (interoperable with 30+ companies)
- PostgreSQL Row-Level Security for tenant isolation (not just WHERE clauses)
- API keys stored as SHA-256 hashes, shown once on creation

**Stack:** TypeScript, Hono (runs on both Workers and Node.js), BullMQ on Redis for delivery queue, Neon PostgreSQL with RLS, Clerk auth, Stripe billing. 4,800+ lines of TypeScript, 252 tests passing.

**What's missing (honest gaps):**

- Inbound webhook reception (Stripe/GitHub -> your app) is planned but not shipped yet -- currently outbound-only
- No Zapier/Make integration yet (month 2 roadmap)
- Self-hosted deployment docs are thin -- the Docker setup works but needs polish
- [BETA_GAPS] -- any issues found during beta

**Beta stats:** [X] users, [Y] events delivered, [Z]% delivery success rate over [W] days.

The code is AGPL-3.0 (server) + MIT (SDK). GitHub: https://github.com/Not-Another-Ai-Co/EmitHQ

I'd love feedback on the API design, pricing, and anything that would make you switch from what you're using today. Happy to go deep on any architectural decisions.
