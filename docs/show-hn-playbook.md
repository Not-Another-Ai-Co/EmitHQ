# Show HN Playbook

Launch logistics, comment response templates, and Product Hunt day-2 plan.

## Launch Timing

**Show HN:** Sunday, 11:00-16:00 UTC (best breakout rate at 15.7% vs ~9.5% weekday average)

**Engagement commitment:** Respond to every comment within 30 minutes for the first 6 hours. After that, check hourly for 24 hours.

## Pre-Flight Checklist

Before posting, verify all of these:

- [ ] Production smoke test passed (T-045)
- [ ] At least [10+] beta users with real usage
- [ ] At least 1 paying customer (even $49 Starter)
- [ ] Beta metric placeholders filled in `docs/show-hn-draft.md`
- [ ] GitHub repo README is clean: badges, quick-start, architecture diagram
- [ ] GitHub Discussions enabled (verified: already done)
- [ ] Landing page live at emithq.com (verified: already deployed)
- [ ] Dashboard live at app.emithq.com (verified: already deployed)
- [ ] API live at api.emithq.com (verified: already deployed)
- [ ] Free tier signup works without credit card
- [ ] SDK published on npm (`@emithq/sdk`)
- [ ] Comparison pages live (/compare/svix, /compare/hookdeck, /compare/build-vs-buy)
- [ ] Product Hunt maker profile created (Julian)
- [ ] Product Hunt launch scheduled for day 2

## Comment Response Templates

### "I built this in a weekend"

> Totally fair -- the core HTTP POST + retry loop is straightforward. The complexity is in everything around it:
>
> - Per-endpoint signing secrets with independent rotation (compromising one endpoint doesn't leak others)
> - Timing-safe signature verification (string comparison leaks secret length via timing attacks)
> - Circuit breaker that auto-disables endpoints after consecutive failures and sends you an operational webhook
> - Dead-letter queue with replay (when retries exhaust, the message isn't lost)
> - Exponential backoff with full jitter (not just `2^n` -- you need jitter to avoid thundering herd across endpoints)
> - Payload transformations so customers can reshape events per-endpoint
> - A customer-facing delivery log showing every attempt, status code, and response time
> - Usage-based rate limiting per tenant
> - Idempotency (UNIQUE constraint on event_id so retried sends don't duplicate)
>
> Any one of these is a few hours. All of them together, tested and reliable, is a quarter of eng time. And you still won't have a dashboard or SDK.
>
> That said, if your scale is small and you don't need customer-facing observability, DIY is totally reasonable. EmitHQ is for when webhooks become a product feature your customers depend on.

### "Why not just use Svix?"

> Svix is great -- they pioneered the Standard Webhooks spec and we implement it too. The main differences:
>
> 1. **Pricing:** Svix jumps from free to $490/mo. EmitHQ has $49/$149/$349 tiers in between. If you're a Series A SaaS sending 500K events/mo, that's a meaningful gap.
> 2. **License:** Svix server is MIT (great for self-hosting), EmitHQ is AGPL (copyleft, so cloud providers can't clone it without contributing back). SDKs are MIT either way.
> 3. **Payload transformations:** EmitHQ supports per-endpoint JSONPath + template transforms. Svix has this in enterprise only.
> 4. **Inbound + outbound:** We're building both directions (inbound is on the roadmap). Svix is outbound-only.
>
> If you're already on Svix and happy, no reason to switch. If you're evaluating options and $490/mo is steep for your stage, take a look.

### GDPR / Data Residency

> Good question. Currently EmitHQ cloud runs on:
>
> - **Database:** Neon PostgreSQL (AWS us-east-1)
> - **Queue:** Upstash Redis (us-east-1)
> - **API/Workers:** Railway (us-west)
>
> For EU data residency, self-hosting is the answer today -- the AGPL server runs anywhere you can run Node.js + PostgreSQL + Redis. We're evaluating EU region deployment for the managed cloud based on demand.
>
> Webhook payloads are stored in PostgreSQL with Row-Level Security tenant isolation. We don't share data across tenants at any layer. Signing secrets are stored with PostgreSQL's native at-rest encryption (Neon encrypts all data at rest with AES-256).

### Pricing Concerns -- "Too expensive"

> The free tier gives you 100K events/mo with no credit card -- enough to validate whether webhook infra is worth outsourcing. If you're sending fewer than 100K events, you never need to pay.
>
> At $49/mo for 500K events, that's $0.10 per 1K events. The alternative is an engineer spending 1-2 weeks building and maintaining retry logic, circuit breakers, DLQ, a dashboard, and a signing implementation. At $150K/yr salary, that's $6-12K in eng time before ongoing maintenance.
>
> But totally understand if the math doesn't work for your stage. The self-hosted option is free (AGPL).

### Pricing Concerns -- "Why not free / fully open-source?"

> The server is AGPL -- you can self-host for free forever. The managed cloud is how I fund development as a solo founder. AGPL means cloud providers can't take the code and compete without contributing back, which protects the ability to keep building.
>
> The model is the same as GitLab, Plausible, and Cal.com: open core with a managed cloud for teams that don't want to run infrastructure.

### "Why AGPL?"

> As a solo bootstrapped founder, I need a license that:
>
> 1. Lets anyone self-host (you can, it's fully functional)
> 2. Prevents AWS/GCP from cloning it as a managed service without contributing back
> 3. Keeps the community honest about modifications (copyleft)
>
> MIT is great for adoption but offers zero protection for a solo dev. ELv2 and BSL aren't OSI-approved, which limits community trust. AGPL is the strongest copyleft that's still genuinely open-source.
>
> SDKs are MIT -- no copyleft friction for your application code.

### "How is this different from Hookdeck?"

> Hookdeck is primarily an inbound webhook platform (receiving webhooks from providers like Stripe). EmitHQ is primarily outbound (sending webhooks to your customers' endpoints). Different core use case.
>
> Hookdeck's pricing also jumps from $39 Team to $499 Growth. If you need outbound delivery in that gap, that's where EmitHQ fits.
>
> We're adding inbound reception (Cloudflare Workers edge layer) to handle both directions, but the outbound delivery engine is where we are today.

### Technical Architecture Questions

> Happy to go deep. The short version:
>
> - **Persist before enqueue:** Message hits PostgreSQL before Redis queue. If the queue loses the job, the DB has it. Recovery sweep catches orphaned deliveries.
> - **Standard Webhooks signing:** `HMAC-SHA256(msg_{id}.{timestamp}.{body}, whsec_secret)` with base64 encoding. Interoperable with Svix and 30+ other implementations.
> - **Retry schedule:** [immediate, 30s, 2m, 15m, 1h, 4h, 12h, 12h] with full jitter. BullMQ handles scheduling.
> - **Tenant isolation:** PostgreSQL RLS with `SET LOCAL app.current_tenant` per transaction. Even buggy app code can't leak cross-tenant data.
> - **Circuit breaker:** Per-endpoint failure counter in the DB. 10 consecutive failures -> auto-disable + operational webhook to the org. Manual re-enable via API.
>
> Full architecture doc is in the repo: `docs/research/technical-architecture.md`

### "Why TypeScript and not Go/Rust?"

> Fair question -- infra tools in Go/Rust are common for good reason. TypeScript was deliberate here:
>
> 1. **Target audience writes TypeScript.** Our SDK, examples, and webhook payload types are all TS. Using the same language end-to-end means fewer context switches for contributors and users.
> 2. **Hono runs on both Node.js and Cloudflare Workers.** When we add the edge layer for inbound webhooks, the same code runs at the edge and origin. Go/Rust would mean two separate codebases or WASM complexity.
> 3. **Node.js 22+ performance is fine for this workload.** Webhook delivery is I/O-bound (HTTP calls, DB writes), not CPU-bound. The bottleneck is the target endpoint's response time, not our runtime.
> 4. **Solo dev pragmatism.** I ship faster in TypeScript. The 200ms cold start from tsx vs compiled Go is irrelevant for a Railway service that stays running.
>
> If we hit CPU-bound bottlenecks at scale (signing millions of payloads/sec), a Rust signing module via NAPI is on the table. Not there yet.

### "What happens if EmitHQ goes down?"

> Messages are persisted to PostgreSQL before they're enqueued to Redis. If the queue goes down, messages are safe in the database -- a recovery sweep picks up any delivery_attempts in 'pending' status without a corresponding queue job.
>
> If the whole service goes down:
>
> - Messages already in the DB are safe and will be delivered when the service recovers
> - Messages sent during the outage get a 503 from the API -- your retry logic should catch that
> - BullMQ jobs survive Redis restarts (Upstash Redis has persistence)
>
> We monitor with Better Stack (external uptime checks) and Sentry (error tracking). The /health endpoint probes both DB and Redis connectivity.
>
> For the self-hosted path, you control the infrastructure and SLA entirely. For the managed cloud, we're targeting 99.9% API uptime -- our delivery success SLO is 99.9% measured from delivery_attempts data.

## Product Hunt Day-2 Plan

### Pre-requisites (Julian)

- [ ] Create Product Hunt maker profile at producthunt.com
- [ ] Prepare assets: logo (240x240), gallery images (1270x760), product description
- [ ] Schedule launch for the morning after Show HN (Monday or Tuesday)

### Product Hunt Listing Content

**Tagline (60 chars max):** Open-source webhook delivery with a $49/mo cloud

**Description:**
EmitHQ is webhook infrastructure for SaaS companies. Send webhooks to your customers' endpoints with automatic retries, per-endpoint signing, circuit breakers, and a real-time dashboard. Open-source (AGPL) with a managed cloud starting at $49/mo -- filling the gap between free tiers and $490+ enterprise platforms.

**Topics:** Developer Tools, Open Source, SaaS, APIs, Infrastructure

**Gallery images to prepare:**

1. Dashboard overview (delivery stats, endpoint health)
2. Event log with delivery attempt details
3. Pricing page showing the gap vs competitors
4. Code snippet showing SDK usage (3 lines to send a webhook)
5. Architecture diagram

### Day-2 Engagement

- Post on Product Hunt between 00:01-03:00 PST (peak visibility window)
- Share the PH link on X/Twitter with "We launched on Product Hunt today" + link to HN discussion from day 1
- Respond to every PH comment within 2 hours
- Cross-reference: "We were on Show HN yesterday -- here's the discussion: [HN link]"

## Post-Launch Tracking

Track these metrics during launch week:

| Metric           | Day 1 (HN) | Day 2 (PH) | Day 3 | Day 7 |
| ---------------- | ---------- | ---------- | ----- | ----- |
| HN points        |            |            |       |       |
| HN comments      |            |            |       |       |
| PH upvotes       |            |            |       |       |
| GitHub stars     |            |            |       |       |
| Signups (free)   |            |            |       |       |
| Signups (paid)   |            |            |       |       |
| Events delivered |            |            |       |       |
| Unique visitors  |            |            |       |       |

**Realistic targets** (based on Convoy HN: 88 pts, 53 comments):

- HN: 50-150 points, 20-50 comments
- PH: 50-200 upvotes
- Signups: 50-200 free tier in first week
- Stars: 20-100 in first week
