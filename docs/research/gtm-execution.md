# Research: Go-to-Market Execution & First Customer Acquisition

**Date:** 2026-03-16
**Status:** Draft — pending review

## Summary

EmitHQ has a complete product but zero deployed infrastructure, zero users, and zero revenue. The research reveals a clear sequencing error: we should NOT do Show HN as the first step. The pattern from every successful bootstrapped dev tool (Plausible, PostHog, Resend, Cal.com) is identical: deploy → get 10+ real users via personal outreach → THEN launch publicly. The $49/$149/$349 pricing sits in a validated gap (Svix: $0→$490 cliff), but should be tested with 5 customer interviews and a Van Westendorp survey before committing. Sustained acquisition post-launch comes from bottom-of-funnel SEO content (competitor comparison pages), cold outreach to GitHub repos using Svix SDK, and integration marketplace listings. Show HN is one shot — don't waste it on day zero.

## Current State

**Code:** Complete — auth, billing, delivery engine, retries, transformations, SDK (published to npm), dashboard, landing page, monitoring, 252 tests passing.

**Deployment blockers (P0):**

1. `startDeliveryWorker()` never called — webhooks enqueue but never deliver
2. No Drizzle migrations generated — schema never applied to DB
3. Missing `tsconfig.json` in `packages/api/` — build will fail

**Deployment blockers (P1):** 4. No `railway.toml` or Procfile — Railway needs manual config 5. `sentry` and `metrics` 1Password items missing 6. Production URLs needed (currently Tailscale IPs)

**Not built (deferrable):**

- Cloudflare Workers edge layer (inbound webhook reception) — can launch outbound-only
- Email service (Resend) for lifecycle emails

## Adjacent Context

**Existing knowledge base coverage:** Sales/GTM frameworks, growth/retention patterns, marketing psychology, pricing strategy, CRO — all in `~/.claude/knowledge/`. This research builds on those foundations with EmitHQ-specific execution tactics.

**Existing EmitHQ research:** Customer discovery (buyer personas), competitive landscape (Svix/Hookdeck/Convoy), pricing model (tier structure), content distribution strategy (SEO keywords, Show HN plan), brand identity. All complete and referenced below.

## Findings

### 1. Launch Sequencing — Don't Show HN First

Every successful bootstrapped dev tool launch follows the same pattern:

| Company   | Pre-launch users before public launch                                        | Result                        |
| --------- | ---------------------------------------------------------------------------- | ----------------------------- |
| PostHog   | 4 weeks of building, launched rough MVP on HN                                | $1M ARR in 8 months           |
| Plausible | 15 months of slow growth, then one blog post hit HN                          | $400→$10K MRR in 9 months     |
| Resend    | Open-sourced react.email first (12K stars), then launched commercial product | 1K paying customers in year 1 |
| Cal.com   | Side project with usage, then "Open Source Calendly" on HN                   | 5K GitHub stars in weeks      |

**The pattern:** Have something live and used before the high-stakes public moment.

**Why it matters for EmitHQ:**

- "Is anyone using this?" is a launch-killing comment on HN
- The build-vs-buy objection ("I built webhooks in a weekend") is unavoidable — having concrete metrics ("We've processed X webhooks in beta") neutralizes it
- Beta users upvote organically (HN detects voting rings)
- You learn what questions come up before they're asked publicly

**Minimum bar before Show HN:** 10+ real users, >0 paying customers (even at $1), one concrete metric.

### 2. Recommended Execution Sequence

```
Phase 0 — Deploy (1-2 weeks)
  Fix P0 blockers (worker entry point, migrations, tsconfig)
  Deploy API to Railway, landing to Vercel/CF Pages
  Apply schema to Neon, connect Upstash Redis
  Create Sentry + metrics 1Password items
  Verify end-to-end: sign up → create app → send event → deliver webhook

Phase 1 — Warm-up (2-4 weeks)
  Get 5-20 beta users via personal outreach
  Join 3-5 communities (r/node, r/selfhosted, r/SaaS, relevant Discord servers)
  Build in public: weekly updates on X and Indie Hackers
  Cold email 20-30 companies/week whose GitHub repos import Svix SDK
  Collect testimonials and usage metrics from beta users
  Run 5 customer interviews for pricing validation

Phase 2 — Launch week (1 week)
  Day 1: Show HN (Sunday, 11:00-16:00 UTC for best breakout rate)
  Day 2: Product Hunt
  Day 3: Dev.to cross-post of origin story
  Day 4: Twitter/X thread with technical breakdown
  Day 5: Newsletter submissions (TLDR, Bytes, Cooper Press)
  All week: Respond to every comment within 30 minutes

Phase 3 — Sustain (ongoing)
  BOFU content: competitor comparison pages, integration guides
  List on Railway templates, awesome-selfhosted, AlternativeTo, SaaSHub
  Build Zapier integration (month 2)
  Engineering deep-dives for backlinks
  Vercel Marketplace (month 3-4)
```

### 3. First 10 Customers — Specific Tactics

**Cold outreach (highest velocity):**

- Target companies whose GitHub repos import `@svix/svix` or have webhook-related code
- LinkedIn DMs to platform engineers at Series A-C SaaS companies
- Script: "Saw you're using Svix — we built an open-source alternative at $49/mo. Happy to share how it differs."
- Volume: 20-30 personalized emails/week, expect 10-15% reply rate, 2-5% trial conversion
- Follow-up cadence: Day 0 → Day 3 → Day 10 → Day 17

**Community participation (warmest leads):**

- Weeks 1-2: Join communities, contribute genuinely, don't mention product
- Weeks 3-4: After 20-30 genuine contributions, mention you're building something
- Weeks 5-6: White-glove beta with 1:1 video calls for every user

**Build in public:**

- Ship updates publicly from day 1 (GitHub commits, weekly logs on X)
- Share technical decisions: "We chose X over Y because..."
- Milestone posts (first user, first paying customer, first $100 MRR)
- 2-4 posts/week on X; reply to developers in your niche daily

### 4. Sustained Acquisition Channels

**Priority order by time-to-impact:**

| Channel                                                           | Time to impact  | Effort | Expected outcome                          |
| ----------------------------------------------------------------- | --------------- | ------ | ----------------------------------------- |
| Cold outreach (Svix GitHub users)                                 | 1-2 weeks       | Medium | First 5-15 paying customers               |
| Marketplace listings (Railway, awesome-selfhosted, AlternativeTo) | Immediate       | Low    | 50-200 visitors/mo, compounds             |
| BOFU content ("EmitHQ vs Svix", comparison page)                  | 3-6 months SEO  | Medium | In-market buyers, highest conversion      |
| Integration guides (Stripe/GitHub webhook handling)               | 3-6 months SEO  | Medium | Provider-specific traffic                 |
| Zapier integration                                                | 2-4 weeks build | High   | 27% more revenue per user, 20% less churn |
| Engineering deep-dives                                            | 6-12 months SEO | Medium | Backlinks, brand credibility              |
| Vercel Marketplace                                                | 2-4 weeks build | High   | Access to Vercel's developer base         |

**Key insight from research:** Bottom-of-funnel content converts 3x+ better than top-of-funnel. A "webhooks as a service comparison" page and "EmitHQ vs Svix" page should exist before any "what are webhooks" explainer. FeatureBase grew from 0→$4K MRR primarily on "Canny.io alternative" pages.

### 5. Pricing Validation

**Current pricing is well-positioned:**

The $49/$149/$349 ladder sits in a confirmed gap. Svix's current pricing (March 2026) jumps from $0 directly to $490/mo. Hookdeck has $39 Team but jumps to $499 Growth. No competitor occupies the $49-$349 range with full multi-tenant webhook delivery.

**Recommended validation actions before committing:**

1. **Van Westendorp survey** on the $49 entry tier — 30-50 developer respondents via community channels. Confirm $49 falls within acceptable price range.
2. **5 customer interviews** using staged questioning: packaging → pricing model → price points. Track failure categories (too expensive, wrong model, bad fencing).
3. **Fake-door test** — "Start free" button on landing page that leads to signup. Measure click-through to pricing page and tier selection ratios.
4. **Publish overage pricing** clearly — this is the primary conversion anxiety for usage-based pricing.

**One pricing adjustment to consider:** Reduce free tier from 100K to 50K events to match Svix's free tier exactly. The research shows dev tool freemium converts at only 1-3% — a 100K free tier is generous enough that many small companies never need to upgrade. Alternatively, keep 100K but add a 7-day retention limit (currently 3 days) to reduce the "production-on-free" problem.

**Three tiers, not four:** A/B test data shows 4+ tiers result in 31% worse conversion due to decision paralysis. Consider collapsing to Free/Growth/Scale or Free/Starter/Growth, with enterprise as "Contact us."

### 6. Show HN Execution

**Optimal timing:** Sunday, 11:00-16:00 UTC (up to 15.7% breakout rate vs ~9.5% weekday average).

**Post structure that works:**

1. Who you are (1 sentence, personal)
2. What you built (1 sentence)
3. The problem: the $49-$490 pricing gap
4. Your origin story
5. Technical depth (HN reads code, not bullets)
6. How it differs from Svix/Hookdeck specifically
7. Explicit ask for feedback

**Prepared responses for inevitable comments:**

- "I built this in a weekend" → List what they won't think of: per-endpoint secrets, key rotation, circuit breakers, DLQ, observability, customer-facing portal, retry scheduling
- Security questions → EmitHQ has per-endpoint secrets, `crypto.timingSafeEqual`, Standard Webhooks spec compliance
- GDPR/data residency → Address where data is stored (Neon regions)
- "Why not just use Svix?" → Open-source (AGPL), $49 vs $490, both inbound and outbound

**Benchmark:** Convoy's HN launch: 88 points, 53 comments. This is the realistic target for a webhook infra launch.

### 7. Community Building

**Start with GitHub Discussions, not Discord:**

- Async, threaded, archived alongside code, shows up in search (SEO)
- Zero friction — developers already have GitHub accounts
- Add Discord when you have 20+ active GitHub users (month 2-3)

**What builds community:**

- Founder availability — responding within hours on GitHub Discussions
- Closing the feedback loop publicly: "User X asked for Y, it's now live"
- Evergreen content (docs, tutorials) brings people in; events keep them

## Recommendation

**Do not launch publicly yet.** The product needs to be deployed and validated with real users first.

**Immediate next steps (Phase 0 — this week):**

1. Fix deployment blockers: worker entry point, Drizzle migrations, tsconfig
2. Deploy to Railway + Vercel
3. Create missing 1Password items (sentry, metrics)
4. Verify end-to-end flow works in production

**Then Phase 1 (next 2-4 weeks):**

1. Get 10+ beta users via personal outreach and cold email
2. Run 5 pricing validation interviews
3. Publish comparison page ("EmitHQ vs Svix")
4. List on awesome-selfhosted, AlternativeTo, Railway templates
5. Build in public on X and Indie Hackers

**Then Phase 2:** Show HN launch with real metrics and testimonials.

**Alternatives considered:**

- Launch immediately on Show HN → Rejected. Zero users + zero metrics = weak launch. You get one shot.
- Skip Show HN entirely, grow through SEO only → Rejected. SEO takes 6-12 months. Show HN provides an initial spike that seeds awareness.
- Paid acquisition → Rejected for now. $0 budget is a feature, not a constraint. Content + community + cold outreach scales further per dollar for a solo dev tool.

## Sources

### Online Research

- [Show HN timing analysis — Myriade.ai](https://www.myriade.ai/blogs/when-is-it-the-best-time-to-post-on-show-hn)
- [State of Show HN 2025 — Sturdy Statistics](https://blog.sturdystatistics.com/posts/show_hn/)
- [Dev tool HN launch guide — Markepear](https://www.markepear.dev/blog/dev-tool-hacker-news-launch)
- [Plausible bootstrapping story](https://plausible.io/blog/bootstrapping-saas)
- [Plausible $10K MRR growth](https://plausible.io/blog/growing-saas-mrr)
- [Resend 100K users](https://resend.com/blog/what-is-next-after-100-000-users)
- [PostHog growth story — How They Grow](https://www.howtheygrow.co/p/how-posthog-grows-the-power-of-being)
- [Convoy Launch HN (88 pts, 53 comments)](https://news.ycombinator.com/item?id=30469078)
- [Svix Launch HN](https://news.ycombinator.com/item?id=27528202)
- [Grow and Convert — Pain Point SEO](https://www.growandconvert.com/content-marketing/bottom-up-content-strategy/)
- [Grow and Convert — Leadfeeder case study](https://www.growandconvert.com/content-marketing/content-marketing-case-study/)
- [Cold email statistics 2025 — SalesCaptain](https://www.salescaptain.io/blog/cold-email-statistics)
- [Cold outreach tactics — Seedstrapped](https://seedstrapped.substack.com/p/7-underrated-cold-outreach-tactics)
- [Zapier partner ROI data](https://zapier.com/blog/zapier-partner-examples/)
- [How Zapier Grows — How They Grow](https://www.howtheygrow.co/p/how-zapier-grows)
- [Van Westendorp guide — OpinionX](https://www.opinionx.co/blog/van-westendorp-pricing-guide)
- [Pricing validation framework — WillingnessToPay](https://www.willingnesstopay.com/resources/how-to-validate-new-saas-pricing-internal-validation-interviews-sales-test)
- [SaaS pricing trends 2025 — Maxio](https://www.maxio.com/resources/2025-saas-pricing-trends-report)
- [Usage-based pricing 2025 — Metronome](https://metronome.com/state-of-usage-based-pricing-2025)
- [Freemium conversion rates — First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- [Free-to-paid benchmarks — Lenny's Newsletter](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion)
- [SaaS pricing page best practices 2026 — InfluenceFlow](https://influenceflow.io/resources/saas-pricing-page-best-practices-complete-guide-for-2026/)
- [Svix pricing page](https://www.svix.com/pricing/) (fetched March 2026)
- [Hookdeck pricing page](https://hookdeck.com/pricing) (fetched March 2026)
- [Outpost pricing](https://hookdeck.com/outpost/pricing) (fetched March 2026)
- [Hook Relay webhooks comparison](https://www.hookrelay.dev/blog/webhooks-as-a-service-comparison/)
- [Launch weeks for dev tools — Evil Martians](https://evilmartians.com/chronicles/how-to-do-launch-weeks-for-developer-tools-startups-and-small-teams)
- [FeatureBase $4K MRR on comparison pages — SaaSyTrends](https://saasytrends.com/featurebase)

### Project Research (built upon)

- `docs/research/customer-discovery.md` — buyer personas
- `docs/research/competitive-landscape.md` — competitor analysis
- `docs/research/pricing-model.md` — tier structure and unit economics
- `docs/research/content-distribution-strategy.md` — SEO keywords and Show HN plan
- `docs/research/brand-identity.md` — positioning

### Knowledge Base

- `~/.claude/knowledge/sales-gtm/research.md` — launch strategy, pricing frameworks
- `~/.claude/knowledge/growth-retention/research.md` — churn, free tier design, referrals
- `~/.claude/knowledge/marketing-strategy/research.md` — psychology, channel prioritization
