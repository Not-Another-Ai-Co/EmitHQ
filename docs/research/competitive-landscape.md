# Research: Competitive Landscape — Webhook Infrastructure
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-001

## Summary

Four real competitors exist in webhook infrastructure: Svix (outbound, $490/mo Pro, MIT, a16z-backed), Hookdeck (inbound, $39-499/mo, proprietary), Convoy (both directions, $99/mo Pro, ELv2, YC W22), and Outpost (outbound, free/Apache 2.0, by Hookdeck). No managed service occupies the $25-75/mo price point with full multi-tenant capabilities. The critical positioning gap is a product that handles both inbound and outbound at mid-market pricing with a permissive open-source core.

## Competitor Profiles

### Svix — The Outbound King
- **What it is:** Outbound webhook sending as a service. You're an API provider sending webhooks TO your customers.
- **Founded:** 2021 (YC W21), San Francisco
- **Funding:** $13M (a16z Series A, Feb 2023)
- **Team:** ~7-12 employees
- **License:** MIT (fully permissive)
- **GitHub:** 3,100+ stars, 3,406 commits, 44 open issues
- **Tech stack:** Rust server, PostgreSQL + Redis
- **Named customers:** Brex, Lob; OpenAI via Standard Webhooks adoption
- **Compliance:** SOC 2 Type II, HIPAA, PCI-DSS, GDPR, CCPA

**Key strengths:**
- Best enterprise credibility (a16z, Standard Webhooks spec chair)
- 11 language SDKs (JS, Python, Go, Java, Kotlin, Ruby, C#, Rust, PHP, CLI, Terraform)
- First-class multi-tenancy ("Applications" = your customers)
- Embeddable Application Portal (white-label customer-facing UI)
- Static IP support on Pro tier (enterprise requirement)
- Standard Webhooks spec leadership — adopted by 30+ companies including OpenAI, Zapier, Twilio, Kong, Supabase

**Key weaknesses:**
- $0 → $490/mo pricing cliff (no mid-tier)
- Outbound only (Svix Ingest for inbound is a separate, newer product)
- Retries are fixed schedule (8 attempts, ~27 hours total) — not configurable
- Free tier is generous (50K msgs) but Pro jump is brutal for startups

**Retry policy (fixed):** Immediate → 5s → 5m → 30m → 2h → 5h → 10h → 10h (8 total). Endpoint auto-disabled after 5 continuous days of failure.

**Transformations:** JavaScript (QuickJS engine). Can modify method, URL, body, headers. Can cancel delivery conditionally. Gated to Pro+.

### Hookdeck — The Inbound Router
- **What it is:** Inbound webhook receiving and routing. You receive webhooks FROM third-party services (Stripe, GitHub, Shopify) and need reliable processing.
- **Founded:** ~2020-2021, Montreal, Canada
- **Funding:** $5.5M (Matrix Partners Canada seed)
- **Team:** ~8 employees
- **License:** Proprietary (main product); Apache 2.0 (Outpost)
- **Compliance:** SOC2 Type II, GDPR, CCPA, HIPAA (enterprise)

**Key strengths:**
- Best local dev experience (CLI with multi-user simultaneous connections)
- $39/mo Team tier (only mid-market option among major players)
- Configurable retries (up to 50 attempts, per-status-code rules, Retry-After header support)
- Strong observability — event tracing, issue surfacing, bulk replay
- 15+ provider-specific inbound verification patterns (Stripe, GitHub, Shopify, etc.)
- Launched Outpost for outbound (Apache 2.0, competing with Svix)

**Key weaknesses:**
- 5 events/sec default throughput cap — hidden cost trap, pay-per-unit to scale
- Rotating IPs on cloud — IP whitelisting impossible (enterprise blocker)
- Narrower SDK coverage (JS/TS primary, no official Python/Go/Ruby SDK)
- Aug 28-29, 2024 reliability incident — cited in reviews as causing "severe consequences"
- Free tier limited (10K events, 3-day retention, 1 user)
- $39 → $499 gap between Team and Growth tiers

**Pricing detail:**
| Tier | Price | Events/mo | Throughput | Retention |
|------|-------|-----------|------------|-----------|
| Developer | $0 | 10,000 | 5 evt/s | 3 days |
| Team | $39/mo+ | 10K + metered overage | 5 evt/s | 7 days |
| Growth | $499/mo+ | 10K + metered | 5 evt/s | 30 days |
| Enterprise | Custom | Custom | Custom | Custom |

Metered overage: $0.33 per 100K events. Throughput add-on: ~$1/evt/s.

### Convoy — The Both-Directions Player
- **What it is:** Open-source webhooks gateway handling both incoming and outgoing webhooks.
- **Founded:** 2021, Lagos, Nigeria (YC W22)
- **Funding:** YC W22 (amount undisclosed, likely ~$500K seed)
- **Team:** 8 employees
- **License:** Elastic License v2.0 (ELv2) — source-available but cannot offer as hosted SaaS
- **GitHub:** 2,800 stars, 1,464 commits, 31 open issues
- **Tech stack:** Go (73%), control/data plane separation
- **Named customers:** Spruce Health, Neynar, Xendit, PiggyVest (14 total on homepage)

**Key strengths:**
- Both incoming AND outgoing in one platform
- Cheapest managed cloud entry: $99/mo Pro tier
- Dual retry algorithms (constant + exponential with jitter)
- Circuit breaking with Email/Slack notifications
- Strong self-hosted story (Docker + Kubernetes/Helm)
- Active founder presence on HN

**Key weaknesses:**
- ELv2 license prevents building competing SaaS on top
- Small team (8) for a complex infrastructure product — velocity risk
- Redis Sentinel incompatibility (open issue #1842)
- HMAC signature validation issues reported (#1827)
- Missing: ordering guarantees, synchronous processing, NATS support
- No large funding round beyond YC — may struggle to scale

**Pricing:**
| Tier | Price | Throughput | Retention | SLA |
|------|-------|------------|-----------|-----|
| Community (self-hosted) | Free | Unlimited | Unlimited | None |
| Pro (cloud) | $99/mo | 25 evt/s | 7 days | 99.99% |
| Enterprise (cloud) | Custom | Custom | Custom | 99.999% |

Static IPs: +$100/mo add-on.

### Outpost — The Open-Source Event Router (by Hookdeck)
- **What it is:** Self-hostable outbound webhook + event destination delivery. The only tool that natively delivers to Kafka, SQS, EventBridge, Pub/Sub alongside webhooks.
- **License:** Apache 2.0 (fully permissive, no commercial restrictions)
- **GitHub:** 889 stars, 60 releases since May 2025 (very active)
- **Tech stack:** Go (60%), TypeScript (20%), Python (13%)
- **SDKs:** Go, Python, TypeScript (generated by Speakeasy)

**Key strengths:**
- Only player with native "Event Destinations" beyond webhooks (SQS, Kafka, EventBridge, Pub/Sub, RabbitMQ, S3)
- Apache 2.0 — zero commercial restrictions (vs Svix MIT, Convoy ELv2)
- Very high release velocity (60 releases in 10 months)
- Backed by Hookdeck's engineering resources
- Embeddable portal via JWT token
- OpenTelemetry native
- MCP server integration (novel)

**Key weaknesses:**
- Outbound only (no inbound routing)
- No payload transformations mentioned
- Managed version pricing not yet published (Early Access)
- Younger project (May 2025) — less battle-tested
- No rate limiting or circuit breaking documented

**Managed version:** Launched Jan 2026. Positioned as "1/10th the cost" of alternatives. Includes admin UI, serverless architecture, SOC2, SSO, RBAC.

### Smaller Players (Not Material Threats)
- **EventDock** ($29/mo claimed): Site unreachable, appears defunct
- **Vartiq** ("Webhook Infrastructure for High-Velocity Dev Teams"): Pre-launch/stealth, no docs/pricing/community
- **Codehooks** ($19/mo): Code template, not managed service. 3 retries, no multi-tenancy.
- **Orkera**: 2 HN points (Sep 2025). Not a factor.
- **Nohooks** (by Convoy): Adds webhooks to platforms that lack them. Niche product.

## Feature Matrix

| Feature | Svix | Hookdeck | Convoy | Outpost |
|---------|------|----------|--------|---------|
| **Direction** | Outbound | Inbound (+ Outpost for outbound) | Both | Outbound |
| **Delivery guarantee** | At-least-once | At-least-once | At-least-once | At-least-once |
| **Max retries** | 8 (fixed) | 50 (configurable) | Configurable | Configurable |
| **Fan-out** | Native | Via multiple connections | Yes | Yes (topic-based) |
| **Transformations** | JavaScript (QuickJS) | JavaScript | JavaScript | No |
| **SDK languages** | 11 | 1 (JS/TS) | Go + others | 3 (Go, Python, TS) |
| **Multi-tenancy** | First-class (Applications) | Project-level | Org → Project | Native |
| **Embeddable portal** | Yes (white-label) | No | Yes (iframe) | Yes (JWT) |
| **Self-hosted** | Yes (MIT) | No (Outpost only) | Yes (ELv2) | Yes (Apache 2.0) |
| **Event destinations** | Webhooks only | Webhooks only | Webhooks only | Webhooks + Kafka + SQS + EventBridge + Pub/Sub + RabbitMQ + S3 |
| **Static IPs** | Pro+ ($490/mo) | No (enterprise only) | +$100/mo add-on | Self-hosted (your IPs) |
| **Inbound verification** | Svix Ingest (separate) | 15+ providers native | Yes | No (outbound only) |
| **Signing standard** | Standard Webhooks (HMAC-SHA256) | Custom (x-hookdeck-*) | HMAC-SHA256 | HMAC-SHA256 |
| **Local dev CLI** | Yes | Yes (multi-user) | Yes | No |
| **Circuit breaking** | Auto-disable after 5 days | Issue surfacing | Yes (Email/Slack notify) | No |
| **Idempotency** | Yes (idempotency-key header) | Yes (deduplication rules) | Not confirmed | Yes (headers) |
| **Rate limiting** | Per-endpoint | Per-connection (5 evt/s default) | Per-endpoint | Not documented |
| **OpenTelemetry** | Yes | Not confirmed | Not confirmed | Yes |
| **SOC2** | Type II | Type II | Not confirmed | Via managed version |
| **HIPAA** | Yes | Enterprise | Not confirmed | Not confirmed |

## Pricing Gap Map

```
$0        $50       $100      $150      $200      $250      $300      $400      $500+
|---------|---------|---------|---------|---------|---------|---------|---------|---------|
Svix Free                                                                    Svix Pro $490
|                                                                            |
Hookdeck Free    Hookdeck Team $39                                           Hookdeck Growth $499
|                |                                                           |
Convoy Free                    Convoy Pro $99
|                              |
Outpost Free (self-host)       Managed: TBD (early access)
|

              ▲▲▲ THE GAP ▲▲▲
        $50-200/mo managed webhook service
        with multi-tenant + both directions
        = NO PLAYER HERE
```

## Positioning Gaps Identified

### Gap 1: Mid-Market Managed Service ($49-199/mo)
No managed webhook service with full multi-tenant capabilities exists between Convoy's $99/mo (limited: 25 evt/s, 7-day retention, ELv2-restricted) and Svix/Hookdeck's $490-499/mo tiers. The $49-199/mo range with reasonable limits (100K-1M events, 30-day retention, configurable retries) is completely unserved.

### Gap 2: Both Directions in One Product
Svix = outbound only. Hookdeck = inbound-focused. Convoy does both but is small team + ELv2-restricted. No well-funded, permissively-licensed product handles both receiving webhooks from third parties AND sending webhooks to your customers.

### Gap 3: Standard Webhooks + Inbound Verification
Svix chairs Standard Webhooks (outbound signing). Hookdeck does inbound verification (15+ providers). Nobody combines both into a single product that speaks the Standard Webhooks spec for outbound AND verifies inbound from Stripe/GitHub/Shopify.

### Gap 4: Event Destinations Beyond Webhooks (Managed)
Outpost is the only tool delivering to Kafka/SQS/EventBridge — but it's primarily self-hosted. The managed version is early access with unpublished pricing. A managed service with webhook + event destination delivery would differentiate strongly.

### Gap 5: Payload Transformations at Mid-Market Price
Both Svix and Hookdeck gate transformations to paid tiers ($490+). Offering JavaScript transformations at the $99-199/mo price point would be a meaningful differentiator for teams that need to reshape payloads across integrations.

## Strategic Takeaways for Our Product

1. **Price at $49-199/mo** — fill the gap explicitly. Convoy at $99/mo shows the price point works; we need better limits and permissive licensing.

2. **MIT or Apache 2.0 license** — Svix's MIT strategy is proven for developer acquisition. Convoy's ELv2 limits adoption. Apache 2.0 (like Outpost) is the safest choice for maximum community trust.

3. **Handle both directions** — outbound delivery (compete with Svix) AND inbound receiving/verification (compete with Hookdeck). This is a genuine product differentiator no single product does well.

4. **Adopt Standard Webhooks** — don't invent a new signing spec. Standard Webhooks is already adopted by 30+ companies. Compatibility = trust.

5. **Embeddable portal is table stakes** — Svix's Application Portal and Convoy's customer portal both drive retention. Build this early.

6. **Configurable retries, not fixed** — Svix's fixed 8-attempt schedule is a documented pain point. Hookdeck's 50-retry configurability is better. Default to sane schedule, allow customization.

7. **Static IPs from day 1** — Hookdeck's lack of static IPs is an enterprise blocker cited in reviews. Offer static IPs on the $149-199/mo tier, not just enterprise.

8. **Avoid Hookdeck's throughput trap** — 5 evt/s default with pay-per-unit scaling is deceptive pricing. Set generous defaults (50-100 evt/s) and scale honestly.

9. **Consider event destinations as V2 differentiator** — Outpost's SQS/Kafka/EventBridge delivery is unique. Don't ship this in MVP, but architect for it. This could be the "why switch from Svix" answer for established teams.

10. **Reliability is non-negotiable** — Hookdeck's Aug 2024 incident shows the cost of downtime in this space. Invest heavily in monitoring and redundancy from day 1.

## Sources

- Svix: svix.com, docs.svix.com, github.com/svix/svix-webhooks, standardwebhooks.com
- Hookdeck: hookdeck.com, hookdeck.com/docs, hookdeck.com/pricing, github.com/hookdeck/outpost
- Convoy: getconvoy.io, github.com/frain-dev/convoy, docs.getconvoy.io
- Outpost: hookdeck.com/outpost, github.com/hookdeck/outpost
- G2 reviews: g2.com/products/svix/reviews, g2.com/products/hookdeck/reviews
- HN threads: IDs 30347858, 47151522, 43904511
- Tracxn, Wellfound, BetaKit for funding data
- Full agent artifacts: docs/tmp/build-explore-svix-hookdeck.md, docs/tmp/build-explore-convoy-others.md
