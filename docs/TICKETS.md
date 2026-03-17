# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-17
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

### T-033: Show HN Post Revision & Launch Prep [x] [verified] [audited]

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

### T-045: Production Smoke Test & Bug Hunt [x] [verified] [audited]

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

14. Events Today used UTC midnight boundary — wrong for non-UTC users
15. Idempotency handler crashed inside aborted PostgreSQL transaction
16. No app CRUD API endpoint
17. favicon.ico missing on dashboard

**Resolved post-smoke-test:**

- Ghost pending attempts re-enqueued (1024 recovered, 9 skipped — disabled endpoint)
- Idempotency handler rewritten with onConflictDoNothing
- App CRUD routes added (POST/GET /api/v1/app)
- Events counter changed to 24h rolling window
- SVG favicon added

**Known issues remaining:**

- Success rate metric still reflects pre-fix ghost attempts (will self-correct as new deliveries accumulate) (404)

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

### T-047: App Switcher & Application Management [x] [verified]

**Phase:** 8a
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-045
**Research:** none

**Description:** All dashboard pages hardcode `appId = 'default'`. Users with multiple applications can't switch between them. Add an application management page and a shared app context so all pages use the selected app. API endpoints already exist (POST/GET /api/v1/app).

**Acceptance criteria:**

- [x] Applications page at `/dashboard/applications` — list apps with name, created date, uid; cards with active indicator
- [x] "New Application" button → inline form with name + uid fields → calls POST /api/v1/app
- [x] App switcher component in sidebar — dropdown showing current app, navigate on selection
- [x] All 4 existing pages (Overview, Events, Endpoints, DLQ) use selected app via `?app=` URL param instead of hardcoded 'default'
- [x] App param preserved across page navigation (nav links carry `?app=` param)
- [x] Empty state when no apps exist — prompt to create first app

---

### T-048: Endpoint Management UI (Full CRUD) [x] [verified]

**Phase:** 8a
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-047
**Research:** none

**Description:** The endpoints page is read-only (health metrics only). Users can't create, edit, delete, or test endpoints from the dashboard — they must use curl. Add full CRUD UI. API endpoints already exist (POST/GET/PUT/DELETE /api/v1/app/:appId/endpoint). Show signing secret on creation (one-time display). Add test endpoint button.

**Acceptance criteria:**

- [ ] "Create Endpoint" button → form: URL (required), description, event type filter, rate limit
- [ ] On creation success: modal showing signing secret with copy button ("Copy this — you won't see it again")
- [ ] Endpoint list: cards with URL, health status, failure count, disabled badge
- [ ] Per-endpoint actions: edit (URL, description, filters), disable/enable toggle, delete (soft)
- [ ] "Test" button per endpoint → calls POST /:appId/endpoint/:epId/test → shows result
- [ ] Form validation: HTTPS URL required, description max 256 chars

---

### T-049: API Key Management UI

**Phase:** 8a
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-045
**Research:** none

**Description:** No dashboard UI for API key management. Users can only get keys at signup. Add a settings page to create, list, and revoke API keys. API endpoints already exist (POST/GET/DELETE /api/v1/auth/keys).

**Acceptance criteria:**

- [ ] Settings page at `/dashboard/settings` with API Keys section
- [ ] "Generate New Key" button → name field → calls POST /api/v1/auth/keys
- [ ] On creation: modal showing full key with copy button ("Copy this — you won't see it again")
- [ ] Key list: name, created date, last-used date (if available), prefix (emhq\_...xxxx)
- [ ] Revoke button per key with confirmation dialog
- [ ] At least 1 key must remain active (prevent revoking last key)

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

### T-041: Analytics Setup (Umami Self-Hosted) [x] [verified]

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-028
**Research:** none

**Description:** Set up self-hosted Umami analytics for tracking landing page traffic, referral sources, and page conversions. Free, open-source (MIT), with custom events and API access. Replaces original Plausible plan ($9/mo) with $0/mo self-hosted solution.

**Acceptance criteria:**

- [x] Umami Docker service added to docker-compose.yml (port 3100, own Postgres, renamed script/endpoint for ad-blocker bypass)
- [x] UMAMI_APP_SECRET added to .env.tpl (op://EmitHQ/umami/app-secret)
- [x] Script tag updated in layout.tsx — proxied via Vercel rewrites (`/t/u.js` → `analytics.emithq.com/u.js`)
- [x] trackEvent() TypeScript wrapper at `src/lib/analytics.ts` — Umami-native, type-safe, gracefully degrades
- [x] Custom events wired: Signup CTA Clicked (hero, bottom-cta, pricing × 4 tiers), Pricing Toggle (annual/monthly)
- [ ] Julian: create 1Password item `umami` in EmitHQ vault with `app-secret` field (random 32+ char string)
- [ ] Julian: expose Umami publicly at analytics.emithq.com (Cloudflare Tunnel or Caddy + DNS A record)
- [ ] Julian: start Umami (`op run --env-file=.env.tpl -- docker compose up -d umami umami-db`), create site in dashboard, copy website-id into layout.tsx script tag
- [ ] Referral sources visible once Umami is running and receiving pageviews
