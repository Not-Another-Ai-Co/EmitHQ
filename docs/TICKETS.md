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

### T-028: Deploy Dashboard & Landing Page [x] [audited]

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
- [x] Clerk production instance configured (app.emithq.com, clerk.emithq.com, accounts.emithq.com — all DNS verified)
- [-] Plausible analytics receiving data from landing page (DEFERRED: Julian to create Plausible account + add site)
- [x] SSL/HTTPS working on all endpoints

---

### T-029: Production Domain & DNS Setup [x] [audited]

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
- [x] CORS configured for production origins in API server (emithq.com, www.emithq.com, app.emithq.com — done in 6c75c66)

---

### Phase 8: Pre-Launch Warm-up

_Get real users before the public launch. Validate pricing. Build initial traction._

---

### T-030: Marketplace Listings & Directory Submissions [x] [audited]

**Phase:** 8
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/gtm-execution.md

**Description:** Submit EmitHQ to directories and marketplaces that drive developer discovery. These are low-effort, high-compound-interest channels that should be live before Show HN.

**Acceptance criteria:**

- [ ] awesome-selfhosted PR submitted — content prepared in docs/tmp/marketplace-submissions.md, fork created (Julian to submit PR)
- [ ] AlternativeTo profile created — content prepared in docs/tmp/marketplace-submissions.md (Julian to submit)
- [ ] SaaSHub profile created — content prepared in docs/tmp/marketplace-submissions.md (Julian to submit)
- [-] Railway template created (DEFERRED: Railway trial account may not support templates)
- [x] GitHub Discussions enabled on repo (verified: Announcements, General, Ideas, Polls, Q&A, Show and Tell)
- [x] GitHub repo topics/tags updated (webhooks, webhook-infrastructure, webhook-delivery, typescript, open-source, hono, bullmq, developer-tools, saas, agpl)
- [x] Repo description and homepage URL set

---

### T-031: BOFU Comparison Content [x] [audited]

**Phase:** 8
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/gtm-execution.md, docs/research/content-distribution-strategy.md

**Description:** Create bottom-of-funnel comparison pages that capture buyers already evaluating webhook solutions. These convert 3x better than educational content and should exist before Show HN drives traffic. Publish on the landing page/docs site.

**Acceptance criteria:**

- [x] "Webhooks as a Service Comparison 2026" page (expanded /compare with full matrix + deep-dive links)
- [x] "EmitHQ vs Svix" dedicated page (/compare/svix — pricing gap, 14-row feature comparison, when-to-choose)
- [x] "EmitHQ vs Hookdeck" dedicated page (/compare/hookdeck — throughput trap, 14-row comparison)
- [x] "Build vs Buy: Webhook Infrastructure in 2026" page (/compare/build-vs-buy — 12 components, cost analysis, $15-40K DIY vs $49/mo)
- [x] All pages have SEO meta tags (title, description, OG, canonical URLs targeting comparison keywords)
- [x] Pages linked from compare hub and sitemap.xml

---

### T-032: Pricing Page Optimization [x] [audited]

**Phase:** 8
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** docs/research/gtm-execution.md

**Description:** Optimize the pricing page based on research findings. Research shows 3 tiers convert 31% better than 4+, annual default increases annual adoption 19%, and "Most popular" badges simplify decisions. Apply pricing psychology and developer-specific trust signals.

**Acceptance criteria:**

- [x] Default to annual pricing toggle (client-side toggle, defaults to annual with "save 20%" label)
- [x] Growth tier ($149/mo) highlighted as "Most popular" (accent border + floating badge)
- [x] Per-event cost breakdown visible in each tier (e.g., "$0.08/1K events" for Growth)
- [x] Overage pricing published in dedicated section ($0.30-$0.50/1K by tier)
- [x] "What counts as an event?" FAQ answer visible on pricing page (+ "What happens when I hit my limit?")
- [x] "Start free" CTA per tier (no credit card required)
- [x] SDK code snippet on pricing page showing integration example

---

### T-033: Show HN Post Revision & Launch Prep [x] [verified]

**Phase:** 8
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-031
**Research:** docs/research/gtm-execution.md

**Description:** Revise the Show HN draft based on GTM research findings. The post needs to reference real usage metrics from beta, address the build-vs-buy objection preemptively, and follow the proven post structure. Prepare comment response templates for inevitable objections.

**Acceptance criteria:**

- [x] Show HN draft updated with concrete beta metrics (users, events processed) — `docs/show-hn-draft.md` with [PLACEHOLDER] slots for post-beta metrics
- [x] Build-vs-buy objection addressed in post body (list what DIY misses) — 10-item list in draft
- [x] Security surface addressed (per-endpoint secrets, timingSafeEqual, Standard Webhooks) — dedicated section in draft
- [x] Comment response templates prepared for: "built this in a weekend", "why not Svix", GDPR, pricing concerns — `docs/show-hn-playbook.md` with 8 templates
- [x] Launch timing confirmed (Sunday 11:00-16:00 UTC) — confirmed in playbook
- [x] Product Hunt launch prepared as day-2 follow-up — listing content, assets checklist, and engagement plan in playbook

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

### T-040: Clerk Production Keys & Plausible Analytics [x] [audited]

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** none

**Description:** Switch Clerk from test to production keys and set up Plausible analytics. Low-effort but needed before public launch.

**Acceptance criteria:**

- [x] Clerk production instance created (cloned from dev, app.emithq.com primary domain)
- [x] Production keys (`sk_live_`, `pk_live_`) stored in 1Password, updated in Railway + Vercel env vars
- [x] DNS configured: clerk.emithq.com, accounts.emithq.com, clkmail.emithq.com, DKIM records — all verified green
- [-] Plausible analytics (MOVED to T-041)
- [-] Plausible script tag verification (MOVED to T-041)

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

### T-045: Production Smoke Test & Bug Hunt [x]

**Phase:** 8
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-027, T-028
**Research:** none

**Description:** Simulate a real user journey end-to-end in production. Create an org, generate API keys, configure endpoints, send webhooks, verify delivery, test retries, test DLQ, test the dashboard. Find and fix bugs before real users hit them.

**Acceptance criteria:**

- [x] Create test org via Clerk signup on app.emithq.com (Julian signed up, org created, API key generated)
- [x] Create application and endpoint via API (app uid='default', endpoint → webhook.site)
- [x] Send 10 test events via SDK and verify delivery (10 sent, delivery confirmed on webhook.site)
- [x] Verify signature validation works (Standard Webhooks headers present, HMAC-SHA256 signature verified programmatically)
- [x] Send event to a dead endpoint — verify retry scheduling and eventual DLQ (httpstat.us/500 endpoint, failureCount incrementing, BullMQ retries confirmed)
- [x] Test endpoint disable/re-enable via API (disable/re-enable confirmed, failureCount resets)
- [-] Test replay from DLQ via API (DEFERRED: retries still in progress, full exhaustion takes hours with jitter schedule)
- [x] Verify dashboard shows: event log, delivery attempts, endpoint health, stats (all 4 pages confirmed working with live data)
- [x] Test rate limiting — quota middleware confirmed: 1039/100000, free tier hard-blocks at limit (code-verified)
- [-] Test billing flow — Stripe checkout, subscription creation (DEFERRED: Stripe in test mode, T-037)
- [x] Document all bugs found → create fix tickets (11 bugs found and fixed, see below)
- [x] Stress test: send 1,000 events in rapid succession, verify no data loss (1000/1000 accepted, 0 failures)

**Bugs found and fixed during smoke test:**

1. Missing Clerk middleware.ts → dashboard 500
2. Missing CLERK_SECRET_KEY in Vercel → dashboard auth crash
3. Missing sign-in/sign-up pages → no auth redirect
4. Middleware in wrong directory (root vs src/) → middleware not running on Vercel
5. Missing CLERK_PUBLISHABLE_KEY in Railway → API 500 on all Clerk auth
6. SET LOCAL parameterization → PostgreSQL syntax error on every tenant-scoped query
7. UUID cast error in app resolution → 500 when using uid instead of UUID
8. tx.execute() returns QueryResult not array → event counter crash
9. Missing credentials:true in CORS → dashboard can't call API cross-origin
10. BullMQ job ID contains colon → every delivery silently dropped
11. Worker missing GitHub deploy trigger → worker never updated on git push
12. Dashboard client pages used cookies instead of Bearer tokens → 401 on Events/Endpoints/DLQ
13. Nav sidebar highlight stuck on Overview for all routes

**Known issues remaining:**

- Idempotency handler broken inside transactions (PostgreSQL aborts tx on unique violation, subsequent select fails)
- No app CRUD API endpoint (dashboard hardcodes uid='default', app created via direct DB)
- Some delivery attempts from pre-fix period stuck in 'pending' (never enqueued, need recovery sweep)
- Success rate metric inflated by ghost attempts from pre-fix period
- favicon.ico missing on dashboard (404)

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

### T-041: Plausible Analytics Setup

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** none

**Description:** Set up Plausible analytics for tracking landing page traffic, referral sources, and page conversions. Self-host (free, Docker) or use hosted plan ($9/mo). Landing page already has the Plausible script tag.

**Acceptance criteria:**

- [ ] Plausible account created (self-hosted or hosted)
- [ ] emithq.com site added
- [ ] Script tag verified receiving pageviews
- [ ] Referral sources visible (for measuring Show HN / content impact)
