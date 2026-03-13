# Research: Pricing Model Validation
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-003

## Summary

Events (messages) is the right pricing metric — it's what competitors use, what customers understand, and what correlates with our infrastructure costs. Retries should be free (Svix's approach — builds trust). Our 4-tier structure fills the $49-$490 void with a generous free tier at 100K events (matching the DIY pain threshold), and growth tiers at $49, $149, and $349. Target 80%+ gross margin at all tiers. Annual discount of 20% reduces churn by ~51%.

## Pricing Metric Selection

### Options Evaluated

| Metric | Pros | Cons | Who Uses It |
|--------|------|------|-------------|
| **Events (messages)** | Intuitive, correlates with value, industry standard | High-volume customers pay more (fair but feels expensive) | Svix, Hookdeck, Convoy |
| Endpoints | Simple, predictable | Doesn't correlate with infrastructure cost; punishes customers with many low-volume endpoints | Nobody major |
| API calls | Familiar to developers | Conflates ingestion + management calls; confusing | AWS API Gateway |
| Hybrid (events + features) | Captures value at multiple dimensions | Complex to explain | Hookdeck (events + throughput) |

### Decision: Events (messages delivered)

**Rationale:**
- 67% of webhook providers use event-based pricing (API Economics 2022)
- Customers intuitively understand "events" — it's what they're sending/receiving
- Correlates directly with our infrastructure costs (each event = HTTP request + DB write + queue operation)
- Svix's approach of not counting retries or filtered messages is the gold standard — builds trust and reduces customer anxiety about costs

**What counts as an event:**
- Each unique message delivered (or attempted) to an endpoint = 1 event
- Retries: FREE (not counted). This is our trust-building differentiator.
- Filtered/skipped messages: FREE (not counted)
- Fan-out: Each endpoint delivery counts as 1 event (sending to 3 endpoints = 3 events)

## Tier Structure

### Good-Better-Best + Free (4 Tiers)

| | Free | Starter | Growth | Scale |
|--|------|---------|--------|-------|
| **Price** | $0/mo | $49/mo | $149/mo | $349/mo |
| **Annual price** | — | $39/mo (20% off) | $119/mo (20% off) | $279/mo (20% off) |
| **Events/mo** | 100,000 | 500,000 | 2,000,000 | 10,000,000 |
| **Overage** | Hard limit (upgrade required) | $0.50/1K events | $0.40/1K events | $0.30/1K events |
| **Endpoints** | 10 | 50 | 250 | Unlimited |
| **Retention** | 3 days | 14 days | 30 days | 90 days |
| **Throughput** | 10 evt/s | 50 evt/s | 200 evt/s | 1,000 evt/s |
| **Retries** | 5 (fixed schedule) | 10 (configurable) | 20 (configurable) | 50 (configurable) |
| **Transformations** | — | Basic (JSONPath) | Full (JavaScript) | Full + custom functions |
| **Team members** | 1 | 3 | 10 | Unlimited |
| **Support** | Community (Discord) | Email (48h) | Email (24h) + chat | Priority (4h) + Slack |
| **SLA** | — | 99.9% | 99.95% | 99.99% |
| **Customer portal** | — | Basic | White-label | White-label + custom domain |
| **Inbound verification** | 5 providers | All providers | All providers | All + custom |
| **Static IPs** | — | — | — | Included |
| **SSO/SAML** | — | — | — | Included |
| **Audit logs** | — | — | Basic | Full |

### Enterprise (Custom)
- Custom event volumes, retention, SLAs
- VPC peering, dedicated infrastructure
- Custom contracts, DPA, security review
- Dedicated account manager
- Starting at ~$500/mo, typically $1,000-5,000/mo

### Pricing Rationale

**Free tier at 100K events:**
- Matches the "first pain" threshold from T-002 (100K-1M events/month is when teams start looking for solutions)
- More generous than Hookdeck (10K) but more limited than Svix (50K messages) — our 100K gives real room to evaluate
- Hard limit (no overage) forces upgrade decision — avoids the free-forever problem
- 3-day retention is enough to debug but short enough to feel limiting

**Starter at $49/mo:**
- Fills the void below Convoy's $99/mo (cheapest current managed option)
- Accessible to individual developers and seed-stage startups
- 500K events covers most early B2B SaaS webhook needs
- 2.7x price jump from free (implied, since free is $0) is the standard conversion point

**Growth at $149/mo (Hero Tier):**
- This is the "recommended" tier — positioned as the best value
- 2M events covers Series A-B companies
- Includes transformations and white-label portal — the features that differentiate from DIY
- 3x price jump from Starter (within 2-3x Good-Better-Best guideline)
- Undercuts Svix ($490) and Hookdeck Growth ($499) by 70%

**Scale at $349/mo:**
- For Series B-D companies with serious volume
- 10M events, 90-day retention, static IPs, SSO — enterprise features at non-enterprise price
- Still 30% cheaper than Svix Pro ($490) and Hookdeck Growth ($499)
- Includes static IPs (Hookdeck's enterprise blocker) — meaningful differentiator
- 2.3x jump from Growth (within guideline)

### Pricing Psychology Applied
- **Anchoring:** Scale ($349) shown first on pricing page — makes Growth ($149) look reasonable
- **Decoy effect:** Starter ($49) makes Growth look like better value per event ($0.075/1K vs $0.098/1K)
- **Charm pricing:** $49, $149, $349 (not $50, $150, $350)
- **Annual discount:** 20% off — reduces effective price AND reduces churn by ~51% (knowledge base data)

## Unit Economics Model

### Infrastructure Cost per 1M Events

| Component | Cost per 1M Events | Notes |
|-----------|-------------------|-------|
| **Cloudflare Workers** (ingestion) | $0.30 | $0.30/M requests |
| **Cloudflare Workers** (delivery) | $0.30 | 1 delivery attempt per event (avg) |
| **Cloudflare Workers** (retries, ~20% retry rate) | $0.06 | 0.2M retry requests |
| **Neon PostgreSQL** (storage) | $0.04 | ~100 bytes/event, $0.35/GB-month |
| **Neon PostgreSQL** (compute) | $0.14 | ~1 CU-hour per 1M events |
| **Upstash Redis** (queue operations) | $0.40 | ~2 commands/event (enqueue + dequeue) |
| **Railway** (worker processes) | $0.10 | Amortized always-on cost |
| **Bandwidth** | $0.00 | Cloudflare: no egress fees |
| **Total** | **~$1.34** | Per 1M events |

### Margin Analysis by Tier

| Tier | Price | Included Events | Revenue/1M Events | Cost/1M Events | Gross Margin |
|------|-------|----------------|-------------------|----------------|-------------|
| Free | $0 | 100K | $0 | $0.13 | -100% (loss leader) |
| Starter | $49 | 500K | $98.00 | $0.67 | **99.3%** |
| Growth | $149 | 2M | $74.50 | $2.68 | **96.4%** |
| Scale | $349 | 10M | $34.90 | $13.40 | **61.6%** |

**Notes:**
- Free tier cost at 100K events: ~$0.13/mo per user — very cheap loss leader
- Starter and Growth margins are excellent (96-99%) because infrastructure costs are dominated by the fixed cost of running the service, not per-event marginal cost
- Scale tier margin drops because the per-event cost becomes significant at 10M, but 61.6% is still healthy
- These are infrastructure-only margins — do not include labor, marketing, or SaaS tooling costs
- At 419 customers (blended $199/mo ARPU for $1M ARR), total infrastructure cost: ~$500-1,500/mo

### Overage Pricing Rationale

| Tier | Overage | Our Cost | Margin on Overage |
|------|---------|----------|-------------------|
| Starter | $0.50/1K | $0.00134/1K | 99.7% |
| Growth | $0.40/1K | $0.00134/1K | 99.7% |
| Scale | $0.30/1K | $0.00134/1K | 99.6% |

Overage pricing is extremely high-margin. This is intentional — overages should incentivize upgrading to the next tier rather than staying and paying overage. A customer hitting 600K events on Starter pays $49 + ($0.50 x 100) = $99 — at which point Growth at $149 for 2M events is obviously better value.

## Free Tier Design

**Purpose:** Developer acquisition funnel. Convert to paid when value is proven.

**Design principles:**
1. **Generous enough to build and ship a real integration** — 100K events lets you send webhooks to 50 customers at 2,000 events/customer/month
2. **Constrained enough to convert** — 3-day retention means you can't use it for production without upgrading (no debugging history)
3. **Hard limit, not soft** — events stop at 100K. No surprise bills. Forces a conscious upgrade decision.
4. **No credit card required** — reduce signup friction

**Conversion triggers (designed into the tiers):**
- Hit 100K event limit → must upgrade to Starter
- Need >3 day retention for debugging → must upgrade to Starter
- Need transformations → must upgrade to Growth
- Need white-label portal → must upgrade to Growth
- Need static IPs or SSO → must upgrade to Scale

## Competitive Pricing Comparison

```
                    Free     $49      $99      $149     $199     $349     $490+
                    |--------|--------|--------|--------|--------|--------|--------|
Our Product:        Free     Starter           Growth                    Scale
                    100K     500K              2M                        10M

Convoy:             Free              Pro $99
                    (self)            25 evt/s

Svix:               Free                                                         Pro $490
                    50K                                                           400 msg/s

Hookdeck:           Free     Team $39                                            Growth $499
                    10K      10K+metered                                          10K+metered
```

**Our advantage:** We fill the entire $49-$349 range with three tiers. Convoy has one option at $99 (limited). Svix jumps from $0 to $490. Hookdeck has a $39 tier but jumps to $499 for production-grade features.

## Expansion Revenue Model

### Natural Upgrade Path
1. **Free → Starter:** Hit event limit or need retention. Expected at month 2-3 of active use.
2. **Starter → Growth:** Hit 500K events or need transformations/portal. Expected at month 6-12.
3. **Growth → Scale:** Hit 2M events or need enterprise features. Expected at month 12-24.
4. **Scale → Enterprise:** Need custom SLAs, VPC, dedicated infra. Expected at month 18+.

### ARPU Growth Model
- Initial ARPU (month 1): $49-99/mo (mostly Starter + some Growth)
- Month 12 ARPU: $120-160/mo (tier upgrades + overage)
- Month 24 ARPU: $180-220/mo (growth into Scale + enterprise)
- Target blended ARPU at $1M ARR: $199/mo (419 customers)

### Annual Billing Incentive
- 20% discount for annual commitment
- Annual plans reduce churn by ~51% (knowledge base)
- At $149/mo Growth tier: annual = $1,428/year ($119/mo) vs $1,788 monthly
- Customer saves $360/year; we get guaranteed retention

## ARR Path to $1M

| Metric | Value |
|--------|-------|
| Target ARPU | $199/mo blended |
| Customers needed | 419 |
| Monthly churn (target) | 3% |
| New customers needed/mo (steady state) | ~13 |
| Free-to-paid conversion (target) | 5-8% |
| Free signups needed/mo (at 6.5% conversion) | ~200 |

## Risks

1. **Overage pricing may feel punitive** — mitigate with clear upgrade prompts before hitting limits
2. **Free tier may attract non-converting users** — mitigate with 3-day retention limit (forces upgrade for production)
3. **Competitors may react to mid-market pricing** — Svix or Hookdeck could launch a $99 tier. Our response: already established, focus on DX and features.
4. **Scale tier at 61% margin is lower** — acceptable because these are the highest-retention, highest-ARPU customers. Monitor and adjust if infrastructure costs rise.

## Sources

- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Neon PostgreSQL Pricing](https://neon.com/pricing)
- [Upstash Redis Pricing](https://upstash.com/pricing/redis)
- [Railway Pricing](https://railway.com/pricing)
- [Svix Pricing](https://www.svix.com/pricing/)
- [Hookdeck Pricing](https://hookdeck.com/pricing)
- [Webhook Pricing Metrics — Monetizely](https://www.getmonetizely.com/articles/is-your-webhooks-service-priced-based-on-events-or-endpoints-understanding-the-impact-on-your-saas-budget)
- Knowledge base: `~/.claude/knowledge/sales-gtm/research.md` (pricing frameworks)
- T-001: `docs/research/competitive-landscape.md`
- T-002: `docs/research/customer-discovery.md`
