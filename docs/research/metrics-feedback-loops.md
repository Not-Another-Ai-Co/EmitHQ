# Research: Metrics, Analytics & Feedback Loop Design
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-007

## Summary

Three feedback loops drive the business: product metrics (is the product reliable?), business metrics (is the business growing?), and user feedback (what do customers want?). All three feed into a weekly review cadence that produces prioritized action items. The system is designed so I (Claude) can analyze metrics, identify trends, and recommend actions — with Julian approving strategic decisions.

## Business Metrics Dashboard

### Primary Metrics (Review Weekly)

| Metric | Definition | Target | Source |
|--------|-----------|--------|--------|
| **MRR** | Monthly Recurring Revenue | Growth month-over-month | Stripe |
| **ARR** | MRR x 12 | $1M target | Stripe |
| **Net New MRR** | New + expansion - contraction - churn | Positive every month | Stripe |
| **Churn Rate** | % of customers who cancel in a month | <3% monthly | Stripe |
| **ARPU** | Average Revenue Per User | $199/mo target at maturity | Stripe |
| **Active Users** | Users who sent/received >=1 event in last 30 days | Growth month-over-month | Product DB |
| **Free-to-Paid Conversion** | % of free users who upgrade within 60 days | 5-8% | Product DB + Stripe |
| **Trial-to-Paid** (if applicable) | % of trial users who convert | >15% | Product DB + Stripe |

### Secondary Metrics (Review Monthly)

| Metric | Definition | Target | Source |
|--------|-----------|--------|--------|
| **LTV** | Lifetime Value (ARPU / churn rate) | >$6,600 (at 3% churn, $199 ARPU) | Calculated |
| **CAC** | Customer Acquisition Cost | <$500 (organic-first model) | Attribution |
| **LTV:CAC Ratio** | | >3:1 | Calculated |
| **Expansion Revenue** | Revenue from upgrades + overage | >20% of new MRR | Stripe |
| **Logo Churn vs Revenue Churn** | Are we losing small or large customers? | Revenue churn < logo churn | Stripe |
| **Time to First Event** | How long from signup to first webhook sent | <30 minutes | Product DB |
| **Activation Rate** | % of signups who send >=100 events in first 7 days | >40% | Product DB |

## Product Metrics Dashboard

### Reliability Metrics (SLO Tracking — Review Daily)

| Metric | Definition | SLO | Alert Threshold |
|--------|-----------|-----|-----------------|
| **Delivery Success Rate** | % of events delivered on first attempt | 99.9% | <99.5% |
| **End-to-End Latency (p50)** | Time from ingestion to delivery | <200ms | >500ms |
| **End-to-End Latency (p95)** | | <500ms | >1,000ms |
| **End-to-End Latency (p99)** | | <2,000ms | >5,000ms |
| **Queue Depth** | Events waiting for delivery | <1,000 | >10,000 |
| **Retry Rate** | % of events requiring retry | <10% | >20% |
| **Dead-Letter Rate** | % of events exhausting all retries | <0.1% | >1% |
| **API Error Rate** | % of API requests returning 5xx | <0.1% | >0.5% |
| **API Latency (p95)** | Response time for API endpoints | <100ms | >500ms |
| **Uptime** | Measured via external monitoring | 99.9%+ | Any downtime |

### Usage Metrics (Review Weekly)

| Metric | Definition | Purpose |
|--------|-----------|---------|
| **Events Processed (daily/weekly/monthly)** | Total events through the system | Capacity planning |
| **Events by Tier** | Distribution across Free/Starter/Growth/Scale | Pricing validation |
| **Endpoints per Customer** | Average and distribution | Feature usage |
| **Event Types per Customer** | How many distinct event types | Engagement depth |
| **Transformation Usage** | % of customers using transformations | Feature value signal |
| **Portal Usage** | % of customers using embeddable portal | Feature value signal |
| **Inbound vs Outbound Split** | % of events in each direction | Product direction signal |
| **SDK Usage by Language** | Which SDKs are most used | SDK investment priority |

## User Feedback Collection

### Automated Feedback Triggers

| Trigger | Action | Timing |
|---------|--------|--------|
| **Day 1 after signup** | Welcome email with quick-start guide | Automated |
| **Day 7 (if active)** | NPS survey (0-10) + open-ended "What could be better?" | In-app modal |
| **Day 30 (if active)** | NPS survey + feature satisfaction checklist | Email |
| **Hits free tier limit** | Upgrade prompt + "What would make you upgrade?" survey | In-app |
| **First failed delivery** | Contextual help + "Was this resolution helpful?" | In-app |
| **Cancellation** | Exit survey: "Why are you leaving?" (multiple choice + freeform) | In-app modal (required) |
| **Downgrade** | "What changed?" survey | Email |
| **90 days active** | Detailed satisfaction survey + case study request | Email |

### Exit Survey Categories (Churn Analysis)
- Too expensive
- Missing features (which ones?)
- Reliability issues
- Switched to competitor (which one?)
- Built in-house
- Company shut down / no longer needed
- Poor support experience
- Other (freeform)

### Feature Request Tracking
- **Public roadmap** — GitHub Discussions or Canny-style board
- **Upvoting** — customers vote on features they want most
- **Request frequency tracking** — how many unique customers request each feature
- **Revenue-weighted requests** — are Scale customers asking for different things than Starter customers?

## Feedback Loops Architecture

### Loop 1: Product Reliability Loop (Daily)
```
Delivery metrics → Alert if SLO breached → Investigate → Fix → Deploy → Verify SLO restored
```
- **Input:** Delivery success rate, latency, error rate, queue depth
- **Decision maker:** Automated (alerts) + Claude (diagnosis) + Julian (approval for infrastructure changes)
- **Output:** Bug fixes, infrastructure scaling, architecture changes
- **Cadence:** Continuous monitoring, daily review of trends

### Loop 2: Growth & Conversion Loop (Weekly)
```
Signup/conversion/churn data → Identify bottleneck → Hypothesis → Experiment → Measure → Iterate
```
- **Input:** Signups, activation rate, free-to-paid conversion, churn reasons, ARPU
- **Decision maker:** Claude (analysis + hypothesis) + Julian (approval for pricing/feature changes)
- **Output:** Onboarding improvements, pricing adjustments, feature prioritization
- **Cadence:** Weekly metrics review, monthly deep analysis

### Loop 3: User Feedback Loop (Bi-weekly)
```
NPS + surveys + feature requests → Synthesize themes → Prioritize → Build → Ship → Measure impact
```
- **Input:** NPS scores, exit surveys, feature request votes, support tickets
- **Decision maker:** Claude (synthesis + prioritization) + Julian (approval for roadmap changes)
- **Output:** Feature development tickets, UX improvements, documentation updates
- **Cadence:** Bi-weekly synthesis, monthly roadmap update

### Loop 4: Competitive Intelligence Loop (Monthly)
```
Monitor competitor changes → Assess impact → Adjust positioning/pricing/features if needed
```
- **Input:** Competitor pricing changes, feature launches, funding announcements, HN/social mentions
- **Decision maker:** Claude (monitoring + analysis) + Julian (strategic response)
- **Output:** Pricing adjustments, feature prioritization changes, content responses
- **Cadence:** Monthly scan, immediate response if competitor makes major move

## Weekly Review Cadence

### Monday: Metrics Review (30 min)
Claude produces a weekly report covering:
1. **Business metrics:** MRR change, new customers, churned customers, ARPU trend
2. **Product metrics:** Delivery success rate, latency trends, error rate
3. **User metrics:** NPS score trend, top 3 feature requests, support ticket themes
4. **Alerts:** Anything that breached thresholds during the week
5. **Recommended actions:** Top 3 things to do this week, ranked by impact

Julian reviews and approves/modifies actions.

### Monthly: Deep Analysis (1 hour)
Claude produces a monthly report covering:
1. **Cohort analysis:** Are newer customers retaining better than older ones?
2. **Pricing validation:** Is the tier structure working? Where do customers cluster?
3. **Feature ROI:** Which features correlate with retention and upgrade?
4. **Competitive landscape changes:** Any new competitors, pricing changes, or feature launches?
5. **Churn deep-dive:** Exit survey analysis, patterns, and prevention strategies
6. **Roadmap recommendation:** Next month's priorities based on all data

## Tool Selection

| Purpose | Tool | Cost | Why |
|---------|------|------|-----|
| **Product analytics** | PostHog (self-hosted) or Plausible | $0-29/mo | Privacy-friendly, developer-oriented, self-hostable |
| **Business metrics** | Stripe Dashboard + custom queries | $0 | Stripe is the source of truth for revenue |
| **Uptime monitoring** | Better Stack (Uptime) | $0 (free tier) | External monitoring, status page included |
| **Error tracking** | Sentry | $0 (free tier) | Industry standard, good DX |
| **NPS/surveys** | In-app custom (simple) or Formbricks (OSS) | $0 | Keep it lightweight |
| **Feature requests** | GitHub Discussions | $0 | Developers are already on GitHub |
| **Customer communication** | Email (Resend or Postmark) | ~$10/mo | Transactional + lifecycle emails |
| **Status page** | Better Stack (StatusPage) | $0 (included) | Customer-facing reliability transparency |

**Total analytics/feedback infrastructure cost: ~$10-40/mo**

## Automated Alerts (Claude-Actionable)

| Alert | Threshold | Action |
|-------|-----------|--------|
| Delivery success <99.5% | 15-min window | Investigate immediately |
| p95 latency >1s | 15-min window | Check queue depth, worker health |
| Queue depth >10K | Point-in-time | Scale workers or investigate blocking |
| API error rate >0.5% | 15-min window | Check recent deployments, dependencies |
| MRR decreased | Week-over-week | Churn analysis, reach out to churned customers |
| Activation rate <30% | Weekly | Review onboarding flow, identify drop-off |
| NPS <30 | Monthly average | Investigate top complaints, prioritize fixes |
| Free tier >80% capacity | Per customer | Send upgrade prompt email |

## Sources

- T-002: `docs/research/customer-discovery.md` (buyer personas, decision criteria)
- T-003: `docs/research/pricing-model.md` (tier structure, ARPU targets)
- Knowledge base: `~/.claude/knowledge/sales-gtm/research.md` (LTV:CAC ratios, churn benchmarks)
- Knowledge base: `~/.claude/knowledge/growth-retention/research.md` (NPS, activation, retention patterns)
