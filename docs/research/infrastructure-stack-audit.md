# Research: Full Infrastructure Stack Audit

**Date:** 2026-03-18
**Status:** Draft — pending review

## Summary

EmitHQ's current infrastructure stack is well-chosen for a pre-launch product with near-zero traffic. The total monthly burn at 0 users is ~$5 (Railway Hobby). At each growth stage, different services become the cost bottleneck: Upstash Redis commands (100-1K users), Clerk auth (1K-10K users), and Neon compute (10K+ users). Two immediate recommendations: (1) move the dashboard from Vercel to Cloudflare Pages to eliminate the commercial use violation on Vercel Hobby, and (2) switch Upstash Redis from pay-as-you-go to the $10/mo fixed plan before BullMQ polling burns through the free tier. The stack is fundamentally sound — no service needs replacement at the current stage, but several have clear upgrade triggers documented below.

## Current State

### Service Inventory (from codebase)

| Service                  | Package                                               | Integration Point                                                           | Config                                                 |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Neon PostgreSQL**      | `pg` + `drizzle-orm`                                  | `packages/core/src/db/client.ts`                                            | Direct connection (not pooler) for SET LOCAL           |
| **Upstash Redis (TCP)**  | `ioredis`                                             | `packages/core/src/queue/redis.ts`                                          | TLS, port 6379, BullMQ connection                      |
| **Upstash Redis (REST)** | env vars only                                         | `.env.tpl` (REDIS_URL, REDIS_TOKEN)                                         | Not used in code yet (planned for edge)                |
| **Upstash QStash**       | env vars only                                         | `.env.tpl` (QSTASH_TOKEN, signing keys)                                     | Not used in code yet (planned for edge)                |
| **Clerk**                | `@clerk/backend`, `@hono/clerk-auth`, `@clerk/nextjs` | API auth middleware, dashboard auth, signup endpoint                        | Dual auth: Clerk sessions (dashboard) + API keys (SDK) |
| **Stripe**               | `stripe`                                              | `packages/core/src/billing/stripe.ts`, `packages/api/src/routes/billing.ts` | Checkout + Customer Portal + Webhooks                  |
| **Sentry**               | `@sentry/node`                                        | `packages/api/src/instrument.ts`                                            | 10% traces in production                               |
| **Railway**              | Platform                                              | API server (`tsx src/server.ts`) + Worker (`tsx src/worker.ts`)             | Hobby plan, 2 services                                 |
| **Vercel**               | Platform                                              | Dashboard (Next.js) + Landing (static export)                               | Hobby plan, 2 projects                                 |
| **Cloudflare**           | DNS                                                   | Domain DNS only                                                             | Free plan                                              |
| **Umami**                | Self-hosted Docker                                    | `docker-compose.yml` (miniPC)                                               | Own Postgres container, port 3100                      |

### Key Observations

1. **QStash is provisioned but unused** — env vars configured, but no code imports or uses it. The edge worker (T-039) is Phase 10 (post-launch). Currently paying $0 for it.
2. **Redis REST is provisioned but unused** — same situation, planned for edge rate limiting.
3. **Two Railway services** — API server and delivery worker run as separate processes. Both use `tsx` (no build step per DEC-021).
4. **Vercel Hobby for commercial use** — the dashboard and landing site are deployed on Vercel Hobby, which explicitly prohibits commercial use. This is a compliance risk.
5. **Database pools** — `app_user` pool (max 20) + `app_admin` pool (max 5) = 25 max connections. Neon free tier supports up to 100 connections on direct (non-pooler) endpoint.
6. **BullMQ polling** — BullMQ workers poll Redis aggressively. On the free tier (500K commands/month), a single idle worker polling at ~1 command/second burns ~2.6M commands/month. The free tier is insufficient even with no traffic.

## Cost Model by Growth Stage

### Stage 0: Pre-Launch (0 active users, today)

| Service         | Plan        | Monthly Cost | Notes                                          |
| --------------- | ----------- | ------------ | ---------------------------------------------- |
| Neon PostgreSQL | Free        | $0           | 0.5 GB storage, 100 CU-hours/mo                |
| Upstash Redis   | Free        | $0           | 500K commands/mo — **will exceed with BullMQ** |
| Upstash QStash  | Free        | $0           | Not yet used                                   |
| Railway         | Hobby       | $5           | 2 services, ~$3-4 actual usage                 |
| Vercel          | Hobby       | $0           | **Commercial use prohibited**                  |
| Clerk           | Free        | $0           | 50K MAU (updated from 10K)                     |
| Stripe          | Pay-per-tx  | $0           | Test mode                                      |
| Sentry          | Free        | $0           | 5K errors/mo                                   |
| Better Stack    | Free        | $0           | 10 monitors                                    |
| Cloudflare      | Free        | $0           | DNS only                                       |
| Umami           | Self-hosted | $0           | Runs on miniPC                                 |
| **Total**       |             | **$5/mo**    |                                                |

**Immediate issue:** BullMQ polling will exhaust Upstash free tier. Switch to $10/mo fixed plan or the worker will stop functioning once commands/month exceeds 500K.

### Stage 1: First 100 Users (~500K events/month)

| Service            | Plan          | Monthly Cost   | Notes                                       |
| ------------------ | ------------- | -------------- | ------------------------------------------- |
| Neon PostgreSQL    | Free → Launch | $0-15          | Free if <100 CU-hrs; Launch at ~$15 typical |
| Upstash Redis      | Fixed $10     | $10            | 250MB, unlimited commands                   |
| Upstash QStash     | Free          | $0             | <500 messages/day even with edge            |
| Railway            | Hobby         | $5-10          | 2 services under moderate load              |
| Vercel/CF Pages    | Free          | $0             | Migrate to Cloudflare Pages                 |
| Clerk              | Free          | $0             | Well under 50K MAU                          |
| Stripe             | 2.9%+30c      | ~$5-50         | Depends on paying customer count            |
| Sentry             | Free          | $0             | Under 5K errors/mo                          |
| Better Stack       | Free          | $0             | Under 10 monitors                           |
| Cloudflare Workers | Free          | $0             | Under 100K requests/day                     |
| **Total**          |               | **~$20-85/mo** |                                             |

**Cost driver:** Neon may exceed free tier compute hours with 100 active orgs making queries. Redis fixed plan is the first real cost.

### Stage 2: 1,000 Users (~5M events/month)

| Service            | Plan         | Monthly Cost    | Notes                              |
| ------------------ | ------------ | --------------- | ---------------------------------- |
| Neon PostgreSQL    | Launch       | $15-40          | ~300 CU-hrs, ~2-5 GB storage       |
| Upstash Redis      | Fixed $10-30 | $10-30          | 250MB-1GB depending on queue depth |
| Upstash QStash     | PAYG         | $1-5            | ~50K-500K messages/month           |
| Railway            | Pro          | $20-50          | Higher CPU for worker concurrency  |
| Cloudflare Pages   | Free         | $0              | Unlimited bandwidth                |
| Clerk              | Free         | $0              | Still under 50K MAU                |
| Stripe             | 2.9%+30c     | ~$500-1500      | ~100 paying customers              |
| Sentry             | Free/Team    | $0-26           | May exceed 5K errors               |
| Better Stack       | Free/Paid    | $0-21           | May need more monitors             |
| Cloudflare Workers | Paid $5      | $5              | >100K requests/day                 |
| **Total**          |              | **~$55-175/mo** |                                    |

**Revenue at this stage:** ~$10K-20K MRR (100 paying customers at $100-200 ARPU). Margin: **>95%**.

### Stage 3: 10,000 Users (~50M events/month)

| Service            | Plan          | Monthly Cost     | Notes                                |
| ------------------ | ------------- | ---------------- | ------------------------------------ |
| Neon PostgreSQL    | Scale         | $69-200          | 750 CU-hrs, 50 GB storage, SLA       |
| Upstash Redis      | Fixed $30-100 | $30-100          | 5-10GB for queue depth + cache       |
| Upstash QStash     | PAYG          | $50-100          | ~5M-10M messages/month               |
| Railway            | Pro           | $50-150          | Multiple workers, higher concurrency |
| Cloudflare Pages   | Free          | $0               | Unlimited bandwidth                  |
| Clerk              | Pro           | $25-100          | At 10K MAU, base Pro covers it       |
| Stripe             | 2.9%+30c      | $5K-15K          | Stripe is the largest "cost"         |
| Sentry             | Team          | $26-80           | Higher error volume                  |
| Better Stack       | Paid          | $21-50           | Full monitoring suite                |
| Cloudflare Workers | Paid          | $5-30            | ~50M requests/month                  |
| **Total**          |               | **~$280-810/mo** | (excluding Stripe processing fees)   |

**Revenue at this stage:** ~$80K-170K MRR. Margin: **>99%** on infrastructure (Stripe fees are the real cost).

## Service-by-Service Analysis

### 1. Redis/Queue: Upstash

**Current:** Free tier (500K commands/month, 256 MB)
**Problem:** BullMQ is a poor fit for pay-per-command pricing. A single worker doing `BRPOPLPUSH` polling generates thousands of commands per hour with zero traffic.

**Recommendation:** Switch to **Upstash Fixed $10/mo** immediately. This eliminates per-command billing and gives unlimited commands with 250MB storage. At 10K users, move to larger fixed plans ($30-100/mo).

**Alternatives evaluated:**

| Option                     | Cost             | Pros                                             | Cons                                                         |
| -------------------------- | ---------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Upstash Fixed              | $10/mo           | Same provider, no migration, BullMQ compatible   | Storage starts small (250MB)                                 |
| Railway Redis              | ~$3-5/mo         | Co-located with API (lower latency), usage-based | No TLS by default, manual backups, Railway dependency        |
| Dragonfly Cloud            | $27/mo (3GB min) | 25x throughput, drop-in Redis replacement        | Overkill at this stage, minimum 3GB                          |
| Self-hosted Redis (miniPC) | $0               | Free                                             | Single point of failure, no TLS, not suitable for production |

**Verdict:** Stay with Upstash, switch to fixed plan. Railway Redis is a viable alternative at the Pro plan stage ($20/mo base) since it eliminates a separate vendor and the API server is already on Railway. Consider at Stage 2.

### 2. PostgreSQL: Neon

**Current:** Free tier (0.5 GB storage, 100 CU-hours/month)
**Strengths:** Serverless scale-to-zero, branching for dev, native RLS support, direct connection for SET LOCAL.

**Recommendation:** Stay with Neon. The pricing is competitive, and the auto-suspend feature keeps costs low during low-traffic periods. The direct connection requirement (not pooler) for SET LOCAL is a constraint that limits alternatives.

**Alternatives evaluated:**

| Option               | Cost (equiv) | Pros                                             | Cons                                                                                              |
| -------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Neon Launch          | ~$15/mo      | Same provider, serverless, branching             | Compute-hour pricing can surprise                                                                 |
| Supabase Pro         | $25/mo       | Bundled auth/storage/realtime, dedicated compute | Not serverless (always-on), RLS support exists but different tooling, don't need bundled features |
| Railway Postgres     | ~$3-5/mo     | Co-located, usage-based, simple                  | No serverless, no branching, manual backups, no native RLS tooling                                |
| Self-hosted (miniPC) | $0           | Free                                             | Not production-grade, single point of failure                                                     |

**Verdict:** Neon is the right choice. The serverless model matches EmitHQ's variable traffic pattern. Supabase would only make sense if you wanted to replace Clerk with Supabase Auth (which brings its own trade-offs). Railway Postgres lacks the serverless scaling that keeps early costs low.

**Watch point:** At Stage 3, Neon Scale ($69+ base) becomes significant. At that revenue level, consider whether a dedicated Postgres on Railway or Fly.io ($30-50/mo for a 2GB instance) would be cheaper with consistent high traffic.

### 3. Hosting: Railway

**Current:** Hobby ($5/mo), 2 services (API + Worker)
**Strengths:** Simple DX, usage-based pricing, no Docker required, git push deploys.

**Recommendation:** Stay with Railway. The Hobby plan covers pre-launch. Upgrade to Pro ($20/mo) when you need more replicas or the $5 credit is consistently exceeded.

**Alternatives evaluated:**

| Option                | Cost (equiv) | Pros                                                     | Cons                                                  |
| --------------------- | ------------ | -------------------------------------------------------- | ----------------------------------------------------- |
| Railway Hobby         | $5/mo        | Current setup, simple                                    | 8 vCPU/8 GB max per replica                           |
| Fly.io                | ~$10-15/mo   | Global edge, scale-to-zero Machines, lower per-unit cost | More complex setup, Docker required, less polished DX |
| Render                | $7-25/mo     | Free tier for static, fixed pricing                      | No usage-based model, cold starts on free tier        |
| Coolify (self-hosted) | $0           | Free, self-hosted on miniPC or VPS                       | Operational burden, single point of failure           |

**Verdict:** Railway is fine for now. Fly.io becomes attractive at Stage 2-3 when global distribution matters (webhook delivery from multiple regions). The edge worker (T-039) on Cloudflare Workers handles the global presence need for inbound; outbound delivery from Railway's US region is acceptable for MVP.

### 4. Auth: Clerk

**Current:** Free tier (now 50K MAU, updated from 10K in service registry)
**Strengths:** Managed auth, org management, good Next.js integration, Backend API for programmatic user creation.

**IMPORTANT UPDATE:** Clerk increased the free tier to **50,000 MAU** (up from 10,000). The service registry is outdated. This dramatically extends the runway before Clerk becomes a cost.

**Recommendation:** Stay with Clerk. The free tier now covers well past Stage 2 (1,000 users). Pro at $25/mo kicks in only at 50K+ users — likely Stage 3 territory.

**Alternatives evaluated:**

| Option                    | Cost at 10K MAU   | Pros                                     | Cons                                                          |
| ------------------------- | ----------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Clerk Free                | $0                | Current setup, 50K MAU free              | Vendor lock-in, limited MFA on free tier                      |
| Clerk Pro                 | $25/mo            | Remove branding, MFA, custom session     | Paying for something that's free today                        |
| WorkOS                    | $0 (1M MAU free!) | Massive free tier, enterprise SSO focus  | Different API, migration effort, less polished org management |
| Supabase Auth             | $0 (50K MAU)      | Bundled with Supabase, cheapest at scale | Would need to also migrate DB, different paradigm             |
| Better Auth (self-hosted) | $0                | Open source, no vendor lock-in           | Operational burden, no managed dashboard                      |

**Verdict:** Clerk is correct. WorkOS is worth noting as a future escape hatch if Clerk pricing becomes painful at scale (WorkOS gives 1M MAU free), but the migration cost isn't justified pre-launch. Update the service registry to reflect 50K MAU free tier.

### 5. Dashboard/Landing Hosting: Vercel

**Current:** Hobby ($0), 2 projects (dashboard + landing)
**CRITICAL ISSUE:** Vercel Hobby explicitly prohibits commercial use. EmitHQ is a commercial product. This is a terms-of-service violation.

**Recommendation:** Migrate both sites to **Cloudflare Pages** (free tier, unlimited bandwidth, commercial use allowed). The landing site is already a static export — trivial migration. The dashboard uses `@clerk/nextjs` which is compatible with Cloudflare Pages with some configuration.

**Alternatives evaluated:**

| Option              | Cost        | Pros                                                | Cons                                       |
| ------------------- | ----------- | --------------------------------------------------- | ------------------------------------------ |
| Vercel Pro          | $20/seat/mo | Stay on current platform, commercial allowed        | $20/mo for a pre-revenue product           |
| Cloudflare Pages    | $0          | Unlimited bandwidth, commercial OK, same CDN as DNS | SSR requires Workers adapter for dashboard |
| Railway (dashboard) | ~$3-5/mo    | Co-located with API                                 | Not optimized for static/SSR hybrid        |
| Netlify Free        | $0          | Commercial allowed, 100GB bandwidth                 | 125K function invocations/mo limit         |

**Verdict:** Cloudflare Pages for the landing site (static export, zero changes needed). For the dashboard, either Cloudflare Pages with `@cloudflare/next-on-pages` adapter, or Vercel Pro ($20/mo) if the migration is too complex pre-launch. Netlify is a viable backup.

### 6. Edge: Cloudflare Workers + QStash

**Current:** QStash provisioned but unused. Edge worker (T-039) is post-launch.
**Cost at launch:** $0 (not deployed)

**Recommendation:** No action needed now. When T-039 is built:

- Cloudflare Workers free tier (100K requests/day) covers early inbound traffic
- QStash free tier (500 messages/day) covers early edge→origin relay
- Both scale cheaply ($5/mo Workers paid, $1/100K messages QStash)

### 7. Monitoring: Sentry + Better Stack

**Current:** Sentry free (5K errors/mo), Better Stack free (10 monitors)
**Assessment:** Adequate for launch. Sentry's 10% trace sampling in production is appropriate.

**Recommendation:** No changes. Upgrade Sentry to Team ($26/mo) if error volume exceeds 5K/mo (unlikely until Stage 2). Better Stack free tier is sufficient for MVP.

### 8. Analytics: Umami (Self-Hosted)

**Current:** Self-hosted on miniPC Docker, own Postgres container
**Cost:** $0
**Assessment:** Good choice. No vendor cost, full data ownership, API access for `/catchup`.

**Recommendation:** No changes. The only risk is miniPC availability — if it goes down, analytics stop. This is acceptable for a pre-revenue product. Consider migrating to Railway or a $5/mo VPS if uptime becomes critical.

### 9. Stripe

**Current:** Test mode, sandbox products/prices configured
**Cost:** Per-transaction only (2.9% + 30c)
**Assessment:** No alternative makes sense. Stripe is the industry standard for SaaS billing.

**Recommendation:** No changes. Stripe processing fees become the dominant "cost" at Stage 3, but that's inherent to payment processing, not an optimization opportunity.

## Abuse Vectors

### 1. SSRF via Endpoint URLs (HIGH)

**Vector:** Attacker registers an endpoint URL pointing to internal services (169.254.169.254, 10.x.x.x, localhost).
**Current state:** No SSRF protection in the delivery worker. `fetch()` will happily call internal IPs.
**Mitigation:** Validate endpoint URLs at creation time AND at delivery time. Block private IP ranges (RFC 1918), link-local (169.254.x.x), loopback (127.x.x.x), and metadata endpoints. Consider a proxy like Smokescreen for defense-in-depth.

### 2. Free Tier Event Exhaustion (MEDIUM)

**Vector:** Attacker creates multiple free-tier accounts and sends 100K events each, consuming infrastructure resources without paying.
**Current state:** In-memory rate limiting on signup (3/IP/day) — resets on deploy. No card-on-file requirement.
**Mitigation:** T-065 (payment-gated abuse prevention) addresses this. In the interim, the 100K event hard limit and 3-day retention cap exposure per account.

### 3. Slow-Loris Endpoint Abuse (MEDIUM)

**Vector:** Attacker registers an endpoint that accepts connections but responds very slowly, tying up delivery workers.
**Current state:** 30-second fetch timeout per delivery attempt. Worker concurrency capped at 5.
**Mitigation:** The existing timeout is good. Consider reducing to 15 seconds for MVP. The circuit breaker (10 failures → disable) also helps. At scale, isolate delivery workers per-tenant or per-priority.

### 4. BullMQ Queue Poisoning (LOW)

**Vector:** If Redis credentials are compromised, attacker could inject malicious jobs.
**Current state:** Redis credentials are in 1Password, TLS enabled.
**Mitigation:** Current security is adequate. Upstash provides TLS and access control. No action needed.

### 5. API Key Enumeration (LOW)

**Vector:** Brute-force API keys by trying `emhq_` prefixed strings.
**Current state:** 192-bit entropy keys, SHA-256 hashed, timing-safe comparison.
**Mitigation:** Current design is cryptographically secure. 192-bit key space makes enumeration infeasible.

### 6. Multi-Account Abuse via Clerk (MEDIUM)

**Vector:** Attacker uses disposable emails to create many free accounts.
**Current state:** Clerk handles email verification, but doesn't block disposable domains.
**Mitigation:** T-065 includes disposable email blocklist. Short-term, Clerk's built-in bot protection helps but isn't sufficient alone.

## Findings: Services We're Paying For That We Shouldn't Be

1. **No unnecessary payments currently** — all services are on free tiers or the $5 Railway minimum. The stack is lean.
2. **Vercel Hobby isn't costing money but violates ToS** — migrate before generating revenue.
3. **QStash and Redis REST are provisioned but unused** — no cost, but the 1Password items and env vars add cognitive overhead. Remove from `.env.tpl` until T-039, or add a comment noting they're for future edge work.

## Recommendation

### Immediate Actions (Pre-Launch)

1. **Switch Upstash Redis to Fixed $10/mo plan** — BullMQ polling will exhaust free tier. This is blocking.
2. **Migrate landing site to Cloudflare Pages** — static export, trivial migration, fixes ToS violation.
3. **Evaluate dashboard hosting** — either migrate to Cloudflare Pages (requires `@cloudflare/next-on-pages`) or upgrade to Vercel Pro ($20/mo). Cloudflare Pages is preferred if the adapter works with `@clerk/nextjs`.
4. **Update service registry** — Clerk free tier is now 50K MAU, not 10K.
5. **Add SSRF protection** — block private IP ranges in endpoint URL validation. This is a security issue.

### Stage 1 Triggers (100 Users)

- Monitor Neon compute hours. If consistently >80 CU-hrs/month, upgrade to Launch ($15/mo).
- Monitor Railway usage. If consistently >$5/mo credit, no action needed (it auto-bills overage).

### Stage 2 Triggers (1,000 Users)

- Upgrade Railway to Pro ($20/mo) for higher limits and 30-day logs.
- Consider Railway Redis instead of Upstash if latency matters (co-location benefit).
- Deploy Cloudflare Workers for inbound webhooks (T-039) if inbound demand exists.

### Stage 3 Triggers (10,000 Users)

- Neon Scale ($69/mo) or evaluate dedicated Postgres on Fly.io.
- Clerk Pro ($25/mo) if approaching 50K MAU.
- Sentry Team ($26/mo) if error volume grows.
- Consider Fly.io for global delivery worker distribution.

### The Stack Is Sound

No service needs replacement. The choices are appropriate for a bootstrapped solo-dev SaaS selling webhook infrastructure. The key insight is that infrastructure costs remain <1% of revenue at every growth stage — the real cost is Stripe processing fees (2.9%), which is unavoidable.

## Sources

- [Upstash Redis Pricing](https://upstash.com/pricing/redis)
- [Upstash QStash Pricing](https://upstash.com/pricing/qstash)
- [Neon PostgreSQL Pricing](https://neon.com/pricing)
- [Railway Pricing](https://railway.com/pricing)
- [Clerk Pricing](https://clerk.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [Cloudflare Workers & Pages Pricing](https://www.cloudflare.com/plans/developer-platform/)
- [Sentry Pricing](https://sentry.io/pricing/)
- [Better Stack Pricing](https://betterstack.com/pricing)
- [Dragonfly Cloud Pricing](https://www.dragonflydb.io/pricing)
- [WorkOS Pricing (Clerk Alternative)](https://workos.com/blog/clerk-pricing)
- [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Svix Webhook Security Best Practices](https://www.svix.com/resources/webhook-best-practices/security/)
- [PlanetScale Webhook Security](https://planetscale.com/blog/securing-webhooks)
- [Fly.io vs Railway Comparison](https://thesoftwarescout.com/fly-io-vs-railway-2026-which-developer-platform-should-you-deploy-on/)
- [Neon vs Supabase Comparison](https://vela.simplyblock.io/neon-vs-supabase/)
- Codebase: `packages/core/src/queue/redis.ts`, `packages/core/src/db/client.ts`, `packages/api/src/instrument.ts`
- Codebase: `packages/core/src/billing/stripe.ts`, `.env.tpl`, `docker-compose.yml`
- Memory: `~/.claude/projects/-home-jfinnegan0-EmitHQ/memory/project_service_registry.md`
- Knowledge base: `~/.claude/knowledge/deployment/research.md`
