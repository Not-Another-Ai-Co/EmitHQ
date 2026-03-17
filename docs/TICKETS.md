# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-18
> Archived tickets: see [TICKETS-ARCHIVE.md](TICKETS-ARCHIVE.md)

Status markers: `[ ]` open | `[x]` complete | `[x] [verified]` passed quality gates | `[x] [verified] [audited]` docs audited | `[-]` skipped/deferred | `[~]` blocked

## Open Tickets

### T-025: First Iteration Cycle

**Phase:** 5
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-024
**Research:** none (driven by feedback data)

**Description:** Review first 2-4 weeks of post-launch data. Analyze: which features are used, where users drop off, what feedback says, what the churn reasons are. Produce a prioritized iteration plan. This ticket is the first turn of the feedback loop — it creates the next batch of tickets.

**Acceptance criteria:**

- [ ] Data analysis: feature usage heatmap, funnel drop-off points, support ticket themes
- [ ] User feedback synthesis: NPS scores, exit survey themes, feature requests ranked by frequency
- [ ] Churn analysis: why did users leave, could we have prevented it
- [ ] Competitive response check: did competitors react to our launch
- [ ] Prioritized iteration plan: next 5-10 tickets based on data, not assumptions
- [ ] Updated pricing validation: is the pricing working or does it need adjustment
- [ ] Artifact: `docs/research/iteration-1-findings.md`

---

## GTM Execution & First Customer Acquisition — 2026-03-16

### Phase 9: Public Launch

_Execute the launch week and begin sustained acquisition. Gates on T-058 (readiness gate)._

---

### T-034: Launch Week Execution

**Phase:** 9
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-033, T-058
**Research:** docs/research/gtm-execution.md

**Description:** Execute the launch week sequence. This is primarily Julian's work — posting, engaging, responding. Claude supports with content prep and monitoring.

**Acceptance criteria:**

- [ ] Day 1: Show HN posted (Sunday 11:00-16:00 UTC)
- [ ] Day 1: Every HN comment responded to within 30 minutes for first 6 hours
- [ ] Day 2: Product Hunt launch
- [ ] Day 3: Dev.to cross-post published
- [ ] Day 4: Twitter/X thread posted
- [ ] Day 5: Newsletter submissions sent (TLDR, Bytes, Cooper Press)
- [ ] Launch metrics captured: HN points, comments, signups, GitHub stars
- [ ] Post-launch retrospective written (what worked, what didn't)

---

### T-035: Sustained Acquisition Setup

**Phase:** 9
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-034
**Research:** docs/research/gtm-execution.md

**Description:** Set up the sustained acquisition channels that compound after the launch spike fades. Cold outreach infrastructure, content calendar, and integration roadmap.

**Acceptance criteria:**

- [ ] Cold outreach target list: 50+ companies whose GitHub repos import @svix/svix (search GitHub code)
- [ ] Email outreach template and follow-up sequence (Day 0, 3, 10, 17)
- [ ] Content calendar for months 1-3: 2 BOFU posts/month, 1 engineering deep-dive/month
- [ ] Monthly changelog template (product-led SEO signal)
- [ ] Zapier integration scoped and added to roadmap (month 2 target)
- [ ] Build-in-public cadence established: 2-4 posts/week on X, weekly Indie Hackers update

---

### Phase 10: Post-Launch Infrastructure

_Deferred items from earlier phases. Not blocking launch — pick up as needed based on user feedback and growth._

---

### T-036: Email Service & Lifecycle Emails

**Phase:** 10
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-028
**Research:** none

**Description:** Set up Resend for transactional and lifecycle emails. Enables NPS surveys, churn exit surveys, weekly metric reports to Julian, and welcome/onboarding emails.

**Acceptance criteria:**

- [ ] Resend account created, API key in 1Password, domain verified
- [ ] Welcome email on signup (triggered by `org.created` analytics event)
- [ ] NPS survey email at day 7 and day 30 (deferred from T-024)
- [ ] Churn exit survey on subscription cancellation (deferred from T-024)
- [ ] Weekly metrics report emailed to Julian (deferred from T-024 — currently manual via GET /metrics/report)

---

### T-037: Stripe Overage Metering & Upgrade Prompts

**Phase:** 10
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-011
**Research:** docs/research/pricing-model.md

**Description:** Wire up Stripe Billing Meter for overage charges and add upgrade prompts in the dashboard when users approach tier limits. Deferred from T-011.

**Acceptance criteria:**

- [ ] Stripe Billing Meter configured for per-event overage ($0.50/0.40/0.30 per 1K events by tier)
- [ ] event_count_month reported to Stripe at billing period boundaries
- [ ] Dashboard shows usage bar with current event count vs tier limit
- [ ] Upgrade prompt shown at 80% and 100% of tier limit
- [ ] Downgrade blocked if current usage exceeds target tier limit
- [ ] Switch Stripe from test to live mode: create live products/prices, update 1Password keys (`sk_live_`, webhook secret), update Railway env vars, update Stripe webhook endpoint URL

---

### T-038: CI Integration Tests

**Phase:** 10
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-026
**Research:** none

**Description:** Wire up the deferred integration test infrastructure from T-026. Run real middleware chain tests against a test database in CI.

**Acceptance criteria:**

- [ ] CI runs integration tests against Docker PostgreSQL (GitHub Actions service container)
- [ ] Middleware chain tested end-to-end: auth → tenantScope → handler (deferred from T-026)
- [ ] Stripe webhook signature verification tested with Stripe test key in CI (deferred from T-026)
- [ ] Stripe test key stored as GitHub Actions secret

---

### T-039: Cloudflare Workers Edge Layer (Inbound Webhooks)

**Phase:** 10
**Effort:** High
**Complexity:** Complex
**Depends on:** T-027
**Research:** docs/research/technical-architecture.md

**Description:** Build the Cloudflare Workers edge layer for inbound webhook reception. Currently EmitHQ is outbound-only. This adds receiving webhooks from Stripe/GitHub/Shopify with provider-specific signature verification, instant 200 response, and QStash relay to origin.

**Acceptance criteria:**

- [ ] Wrangler project configured with deployment to Cloudflare Workers
- [ ] Inbound webhook endpoint: POST /webhooks/inbound/{source_id}
- [ ] Provider-specific signature verification (Stripe, GitHub, Shopify, Slack, Standard Webhooks)
- [ ] Return 200 immediately (<50ms), forward to origin via QStash
- [ ] Rate limiting at edge via Upstash Redis REST
- [ ] Inbound events persisted to inbound_sources table on origin
- [ ] Tests: signature verification per provider, rate limiting, QStash forwarding

---

---

### T-042: Account Creation Rate Limiting & Abuse Prevention

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-027
**Research:** none

**Description:** Prevent multi-account abuse and automated signups that could exhaust free tier resources across many accounts.

**Acceptance criteria:**

- [ ] IP-based rate limit on Clerk signup (max 3 accounts per IP per day)
- [ ] Flag accounts that hit 100K free tier limit within first 48 hours (likely bots/abuse)
- [ ] Admin endpoint to disable an organization immediately (emergency kill switch)
- [ ] Org disable cascades: stops accepting events, pauses delivery worker for that org

---

### T-043: Infrastructure Cost Monitoring & Emergency Controls

**Phase:** 10
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-022, T-024
**Research:** none

**Description:** Real-time monitoring of infrastructure costs vs revenue. Detect when vendor free tier limits approach, flag cost/revenue imbalance, and provide emergency controls to throttle or disable high-cost users.

**Acceptance criteria:**

- [ ] `/metrics/costs` endpoint: estimated infra cost based on event volume (events × $1.34/1M), compared against MRR
- [ ] Vendor ceiling alerts in `/metrics/slo`: Upstash Redis commands/day vs 10K limit, Neon compute hours vs 190/mo, Railway credit remaining
- [ ] Per-org cost estimation: track each org's event count and estimated infra cost vs their tier revenue
- [ ] Alert when any org's estimated cost exceeds 80% of their tier revenue (negative margin user)
- [ ] Alert when any vendor metric exceeds 70% of free tier ceiling
- [ ] Emergency throttle: reduce a specific org's rate limit to 1 evt/s without disabling
- [ ] `/catchup` integration: Claude checks `/metrics/costs` and `/metrics/slo` every session, flags in Attention Needed
- [ ] Runbook entry: "Vendor ceiling approaching" with upgrade steps for each service

---

### T-059: Code Efficiency Tooling (Knip + jscpd) [x]

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/code-efficiency-tooling.md

**Description:** Add dead code detection (Knip) and copy-paste duplication detection (jscpd) to the monorepo. Knip covers unused exports, files, and dependencies across all 5 workspaces. jscpd catches duplicated code blocks. Both run in CI as informational first, then blocking once baseline is clean. Prune unused `@emithq/core` barrel exports (YAGNI — re-export when consumers need them).

**Acceptance criteria:**

- [x] `knip` installed as root devDependency
- [x] `knip.json` at monorepo root with workspace config (core, api, dashboard, landing; SDK excluded — published package, all exports intentional)
- [x] `jscpd` installed as root devDependency
- [x] `.jscpd.json` at monorepo root (`threshold: 5`, `minLines: 10`, `minTokens: 50`, ignore `node_modules`, `.next`, `out`, `dist`)
- [x] Initial Knip audit run — pruned 12 dead barrel exports from core, removed unused `export` keywords, removed dead code (`quotaMock`, `apiPost`, `Sentry` re-export)
- [x] Initial jscpd audit run — 3.03% duplication (under 5% threshold), all structural landing page duplication
- [x] `npm run knip` and `npm run duplication` scripts in root `package.json`
- [x] Both added to CI workflow as informational steps (`|| true`)
- [x] `/verify` updated to include Knip + jscpd config-aware gates

---

### T-044: Automated Social Media Posting

**Phase:** 8
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-028
**Research:** none

**Description:** Set up automated posting to social platforms via APIs or MCP servers. Julian creates accounts, Claude publishes content. Covers build-in-public updates, launch announcements, and ongoing content distribution.

**Acceptance criteria:**

- [ ] Research available APIs/MCPs: Twitter/X API, Indie Hackers (scrape/API?), Dev.to API, LinkedIn API
- [ ] Identify which platforms have usable APIs vs require manual posting
- [ ] Set up API keys/tokens in 1Password for accessible platforms
- [ ] Create a posting helper script or MCP integration that Claude can invoke
- [ ] Draft first 5 build-in-public posts (progress updates, technical decisions, milestones)
- [ ] Publish first post on each connected platform

---

---

### T-046: Cold Outreach Campaign

**Phase:** 8
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-031, T-045
**Research:** docs/research/gtm-execution.md

**Description:** Identify and contact potential beta users. Target companies using Svix SDK on GitHub. Prepare personalized outreach emails. Track responses and conversions.

**Acceptance criteria:**

- [ ] GitHub code search: find 50+ repos importing @svix/svix — extract company/maintainer info
- [ ] Categorize targets by company size, webhook usage patterns, potential fit
- [ ] Draft 3 outreach email templates (cold intro, follow-up day 3, follow-up day 10)
- [ ] Personalize top 20 emails with specific repo/company references
- [ ] Track outreach in a simple spreadsheet or GitHub issue (sent, replied, trialed, converted)
- [ ] Target: 20 emails/week for 4 weeks, 10-15% reply rate, 2-5% trial conversion

---

---

## Pre-Launch Warm-up — 2026-03-17

_Research says the path is Deploy → Warm-up (2-4 weeks) → Show HN. Every successful bootstrapped dev tool (PostHog, Plausible, Resend, Cal.com) had real users before going public. Minimum bar: 10+ real users, >0 paying customers, one concrete metric. These tickets fill the gap between T-045 (smoke test) and T-034 (Show HN)._

### Phase 8a: Dashboard Self-Service (Show HN Blocker)

_The dashboard is read-only — users can't create endpoints, manage API keys, or see billing. API-first beta users (T-055) can work with curl/SDK, but Show HN visitors expect a polished self-service flow._

---

---

### T-050: Billing & Usage Page

**Phase:** 8a
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-045
**Research:** none

**Description:** No visibility into current plan, usage, or upgrade path. Add a billing page showing tier, usage bar, and Stripe portal/checkout links. API endpoints already exist (GET /api/v1/billing/subscription, POST /api/v1/billing/checkout, POST /api/v1/billing/portal).

**Acceptance criteria:**

- [ ] Billing page at `/dashboard/billing`
- [ ] Current tier card: name, price, included events, feature list
- [ ] Usage bar: events this month vs tier limit, percentage, color (green/yellow/red)
- [ ] Upgrade buttons per tier → opens Stripe Checkout session
- [ ] "Manage Subscription" button → opens Stripe Customer Portal
- [ ] Free tier: "Upgrade to unlock..." messaging

---

### T-051: Getting Started / Onboarding Flow

**Phase:** 8a
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-047, T-049
**Research:** none

**Description:** New users land on a blank Overview page with no guidance. Add a getting started experience that walks through: create app → get API key → create endpoint → send first event. Show on first login, dismissable, accessible from sidebar.

**Acceptance criteria:**

- [ ] Getting started page at `/dashboard/getting-started` (or modal on first visit)
- [ ] Step-by-step checklist: (1) Create application, (2) Generate API key, (3) Create endpoint, (4) Send test event
- [ ] Each step shows status (done/pending) and links to the relevant page
- [ ] Code snippet for sending first event via SDK (copy-pasteable)
- [ ] Dismissable — doesn't show again after completion or manual dismiss
- [ ] Linked from sidebar nav (e.g., "Getting Started" with progress indicator)

---

### Phase 8b: Beta Acquisition & Validation

_Get real users on the platform and validate pricing before the public launch._

---

### T-052: Cold Outreach — First 10 Beta Users

**Phase:** 8b
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-046, T-051
**Research:** docs/research/gtm-execution.md, docs/research/customer-discovery.md

**Description:** Execute T-046's outreach plan to get 10+ real beta users on EmitHQ. T-046 prepares the target list and templates; this ticket is about sending emails and converting replies to signups. Focus on companies importing @svix/svix on GitHub — they already need webhook infrastructure and are paying $490/mo or building DIY. Offer free access during beta (no payment required). Goal: 10 active orgs sending real webhooks.

**Acceptance criteria:**

- [ ] First batch of 20 personalized emails sent (from T-046's target list)
- [ ] Follow-up cadence running: Day 0 → Day 3 → Day 10
- [ ] 10+ orgs signed up and created API keys
- [ ] At least 3 orgs have sent real webhook events (not test data)
- [ ] Track in GitHub issue: sent count, reply count, signup count, active count
- [ ] Identify top 5 most engaged users for pricing interviews (T-053)

---

### T-053: Pricing Validation Interviews

**Phase:** 8b
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-052
**Research:** docs/research/pricing-model.md, docs/research/gtm-execution.md

**Description:** Run 5 structured pricing validation interviews with beta users. Research recommends staged questioning: packaging → pricing model → price points. Validate that the $49 entry price sits within the acceptable range. Identify whether 3 tiers (Free/Growth/Scale) converts better than 4. Document failure categories (too expensive, wrong model, bad fencing).

**Acceptance criteria:**

- [ ] Interview script prepared (staged: packaging → model → price points)
- [ ] 5 interviews completed with beta users or warm leads
- [ ] For each interview: record willingness-to-pay range, pricing model preference, tier structure feedback
- [ ] Synthesize: is $49 in the acceptable range? Should free tier be 50K or 100K? 3 tiers vs 4?
- [ ] Decision: confirm or adjust pricing before Show HN (add DEC entry if changed)
- [ ] Artifact: `docs/research/pricing-validation-results.md`

---

### T-054: Collect Beta Metrics & Testimonials

**Phase:** 8b
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-052
**Research:** docs/research/gtm-execution.md

**Description:** Collect real usage metrics and testimonials from beta users. These fill the [PLACEHOLDER] slots in the Show HN draft (T-033) and provide social proof for launch. The Show HN post needs concrete numbers ("processed X webhooks for Y companies in beta") to neutralize the "is anyone using this?" objection.

**Acceptance criteria:**

- [ ] Query production metrics: total events processed, delivery success rate, active orgs, active endpoints
- [ ] Get 2-3 testimonial quotes from beta users (email ask or interview follow-up)
- [ ] Update `docs/show-hn-draft.md` — replace [PLACEHOLDER] slots with real numbers
- [ ] Screenshot or metric for Show HN: "X events delivered with Y% success rate in beta"
- [ ] At least 1 beta user willing to comment on the HN thread (ask directly)

---

### Phase 8c: Pre-Launch Content & Presence

_Publish content and establish community presence before the public launch spike._

---

### T-055: Origin Story Blog Post

**Phase:** 8c
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/content-distribution-strategy.md

**Description:** Publish "Why We Built EmitHQ: The $49-$490 Webhook Pricing Gap" on the landing site. This is content piece #1 from the research content calendar. It's the dev.to cross-post source for T-034 Day 3 and establishes the narrative before Show HN. Should feel personal (Julian's voice), reference real pricing research, and position EmitHQ as the underdog filling an obvious gap.

**Acceptance criteria:**

- [ ] Blog post written: origin story, pricing gap discovery, what EmitHQ does differently
- [ ] Published on emithq.com/blog/why-we-built-emithq (new /blog route on landing site)
- [ ] SEO meta tags: title, description, OG image targeting "webhook service" and "webhook platform"
- [ ] Linked from landing page footer and header nav
- [ ] Cross-postable format (clean markdown) for Dev.to on launch Day 3

---

### T-056: Technical Deep-Dive Blog Post

**Phase:** 8c
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/content-distribution-strategy.md

**Description:** Publish "Webhook Delivery Architecture: How We Achieve 99.99% Reliability" on the landing site. Content piece #2 — establishes technical credibility with the HN audience. Covers: persist-before-enqueue, BullMQ retry with jitter, circuit breakers, Standard Webhooks signing, RLS multi-tenancy. Include architecture diagram and code snippets.

**Acceptance criteria:**

- [ ] Blog post written: architecture overview, delivery flow, retry strategy, signing, circuit breaker
- [ ] Published on emithq.com/blog/webhook-delivery-architecture
- [ ] Includes architecture diagram (text or SVG, not external image)
- [ ] Code snippets showing signing implementation and retry logic
- [ ] SEO meta tags targeting "webhook delivery reliability" and "webhook retry logic"

---

### T-057: Build-in-Public Launch Cadence

**Phase:** 8c
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-052
**Research:** docs/research/gtm-execution.md

**Description:** Start the build-in-public cadence on X and Indie Hackers. Research recommends 2-4 posts/week starting during warm-up, not after Show HN. Posts should share technical decisions, beta milestones, and pricing learnings. This builds an audience that organically upvotes Show HN.

**Acceptance criteria:**

- [ ] X account created for EmitHQ (or Julian's personal account designated)
- [ ] Draft first 5 build-in-public posts: beta milestone, technical decision, pricing insight, competitor gap, "what I learned" reflection
- [ ] Post 2-4x/week for 2+ weeks before Show HN
- [ ] Engage with 5+ developers/day in webhook/infra threads (reply, not self-promote)
- [ ] Indie Hackers product page created with first update

---

### Phase 8d: Show HN Readiness Gate

---

### T-058: Show HN Readiness Gate

**Phase:** 8d
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-047, T-048, T-049, T-050, T-051, T-052, T-053, T-054, T-055, T-056
**Research:** docs/research/gtm-execution.md

**Description:** Verify all Show HN prerequisites are met before executing T-034. This is a checklist ticket, not implementation work. If any gate fails, defer T-034 until it's resolved.

**Acceptance criteria:**

- [ ] Dashboard self-service complete: app management, endpoint CRUD, API keys, billing, onboarding (T-047–T-051)
- [ ] 10+ real orgs on the platform (from T-052)
- [ ] At least 1 paying customer or confirmed willingness-to-pay (from T-053)
- [ ] Show HN draft has real metrics, not [PLACEHOLDER] (from T-054)
- [ ] 2+ testimonials collected (from T-054)
- [ ] Origin story blog live (from T-055)
- [ ] Technical deep-dive blog live (from T-056)
- [ ] 2+ weeks of build-in-public posts (from T-057)
- [ ] T-030 marketplace submissions completed (Julian's manual items)
- [ ] All production services healthy (API, worker, dashboard, Umami)

---
