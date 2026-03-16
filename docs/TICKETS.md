# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-16
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

### Phase 7: Deploy to Production

_Get the product live and verify end-to-end delivery works._

---

### T-028: Deploy Dashboard & Landing Page [x]

**Phase:** 7
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-027
**Research:** docs/research/gtm-execution.md

**Description:** Deploy the dashboard (Next.js + Clerk) and landing page (static Next.js) to production. Landing page to Vercel or Cloudflare Pages. Dashboard to Vercel (Clerk integration works best there). Update production URLs in .env.tpl and Railway environment.

**Acceptance criteria:**

- [x] Landing page deployed and accessible at production domain (https://emithq.com — Vercel, 200 OK)
- [x] Dashboard deployed with Clerk auth working (https://app.emithq.com — Vercel, 307 to Clerk login)
- [x] Production URLs updated in .env.tpl (production values documented, set in Railway/Vercel)
- [ ] Clerk production instance configured (allowed origins include production domain) — using test keys, Julian to switch to production Clerk instance
- [-] Plausible analytics receiving data from landing page (DEFERRED: Julian to create Plausible account + add site)
- [x] SSL/HTTPS working on all endpoints

---

### T-029: Production Domain & DNS Setup [x]

**Phase:** 7
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-027
**Research:** docs/research/gtm-execution.md

**Description:** Configure production domain(s) for EmitHQ. Set up DNS records for API, dashboard, and landing page. Configure Cloudflare DNS if using CF Pages for landing.

**Acceptance criteria:**

- [x] Domain registered and DNS configured (emithq.com on Cloudflare)
- [x] API accessible at api.emithq.com (Railway, CNAME + TXT verification)
- [x] Dashboard at app.emithq.com (Vercel, CNAME to vercel-dns.com)
- [x] Landing page at emithq.com (Vercel, A record to 76.76.21.21)
- [ ] CORS configured for production origins in API server — needs code change to allow emithq.com origins

---

### Phase 8: Pre-Launch Warm-up

_Get real users before the public launch. Validate pricing. Build initial traction._

---

### T-030: Marketplace Listings & Directory Submissions

**Phase:** 8
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/gtm-execution.md

**Description:** Submit EmitHQ to directories and marketplaces that drive developer discovery. These are low-effort, high-compound-interest channels that should be live before Show HN.

**Acceptance criteria:**

- [ ] awesome-selfhosted PR submitted (AGPL server qualifies)
- [ ] AlternativeTo profile created (listed as alternative to Svix, Hookdeck, Convoy)
- [ ] SaaSHub profile created
- [ ] Railway template created ("Deploy EmitHQ" one-click)
- [ ] GitHub Discussions enabled on repo (already done — verify categories: Q&A, Feature Requests, Show and Tell)
- [ ] GitHub repo topics/tags updated for discoverability (webhooks, webhook-infrastructure, typescript, open-source)

---

### T-031: BOFU Comparison Content

**Phase:** 8
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/gtm-execution.md, docs/research/content-distribution-strategy.md

**Description:** Create bottom-of-funnel comparison pages that capture buyers already evaluating webhook solutions. These convert 3x better than educational content and should exist before Show HN drives traffic. Publish on the landing page/docs site.

**Acceptance criteria:**

- [ ] "Webhooks as a Service Comparison 2026" page (EmitHQ vs Svix vs Hookdeck vs Convoy vs Outpost — feature matrix, pricing, pros/cons)
- [ ] "EmitHQ vs Svix" dedicated page (pricing gap narrative, feature comparison, migration guide)
- [ ] "EmitHQ vs Hookdeck" dedicated page
- [ ] "Build vs Buy: Webhook Infrastructure in 2026" page (cost analysis of DIY vs managed)
- [ ] All pages have proper SEO meta tags targeting identified keywords from content-distribution-strategy.md
- [ ] Pages linked from landing page navigation and sitemap

---

### T-032: Pricing Page Optimization

**Phase:** 8
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/gtm-execution.md

**Description:** Optimize the pricing page based on research findings. Research shows 3 tiers convert 31% better than 4+, annual default increases annual adoption 19%, and "Most popular" badges simplify decisions. Apply pricing psychology and developer-specific trust signals.

**Acceptance criteria:**

- [ ] Default to annual pricing toggle (show monthly as option)
- [ ] Growth tier ($149/mo) highlighted as "Most popular"
- [ ] Per-event cost breakdown visible in each tier (e.g., "$0.075 per 1K events")
- [ ] Overage pricing published clearly in FAQ or tooltip
- [ ] "What counts as an event?" FAQ answer visible on pricing page
- [ ] "Start free" CTA (no credit card required) — clear call to action
- [ ] SDK code snippet on pricing page showing 3-line integration

---

### T-033: Show HN Post Revision & Launch Prep

**Phase:** 8
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-031
**Research:** docs/research/gtm-execution.md

**Description:** Revise the Show HN draft based on GTM research findings. The post needs to reference real usage metrics from beta, address the build-vs-buy objection preemptively, and follow the proven post structure. Prepare comment response templates for inevitable objections.

**Acceptance criteria:**

- [ ] Show HN draft updated with concrete beta metrics (users, events processed)
- [ ] Build-vs-buy objection addressed in post body (list what DIY misses)
- [ ] Security surface addressed (per-endpoint secrets, timingSafeEqual, Standard Webhooks)
- [ ] Comment response templates prepared for: "built this in a weekend", "why not Svix", GDPR, pricing concerns
- [ ] Launch timing confirmed (Sunday 11:00-16:00 UTC)
- [ ] Product Hunt launch prepared as day-2 follow-up

---

### Phase 9: Public Launch

_Execute the launch week and begin sustained acquisition._

---

### T-034: Launch Week Execution

**Phase:** 9
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-033
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

### T-040: Clerk Production Keys & Plausible Analytics

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** none

**Description:** Switch Clerk from test to production keys and set up Plausible analytics. Low-effort but needed before public launch.

**Acceptance criteria:**

- [ ] Clerk production instance created (dashboard.clerk.com)
- [ ] Production keys (`sk_live_`, `pk_live_`) stored in 1Password, updated in Railway + Vercel env vars
- [ ] Allowed origins configured for emithq.com, app.emithq.com
- [ ] Plausible account created, emithq.com site added
- [ ] Plausible script tag verified receiving pageviews
