# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-19
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

### T-042: Account Creation Rate Limiting & Abuse Prevention [-] (consolidated into T-063 + T-065)

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-027
**Research:** none

**Description:** ~~Prevent multi-account abuse and automated signups.~~ Consolidated: signup rate limiting (3/IP/day) moved to T-063, remaining abuse prevention (card-on-file, velocity detection, admin kill switch) moved to T-065.

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

### T-076: Stripe Checkout E2E Test + Live Mode Activation [x]

**Phase:** 8a (Show HN blocker)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-073
**Research:** docs/research/pricing-model.md, docs/research/stripe-billing-e2e-verification.md

**Description:** Verify the full Stripe billing flow works end-to-end in sandbox, then switch to live mode. Test that payment correctly updates org tier and that quota enforcement respects the new tier limit. Confirm DASHBOARD_URL is set correctly on Railway for checkout redirects.

**Acceptance criteria:**

- [x] Verify `DASHBOARD_URL=https://app.emithq.com` set on Railway API service (Julian confirmed)
- [x] Fix: portal return URL pointed to `/dashboard/billing` instead of `/dashboard/settings?tab=billing`
- [x] Fix: quota headers middleware was never setting headers (ran before requireAuth set orgId)
- [x] Sandbox test: `GET /billing/subscription` returns free tier correctly (tier, usage, limits)
- [x] Sandbox test: `POST /billing/checkout` creates real Stripe checkout session URL
- [x] Verified quota headers: `X-EmitHQ-Tier: free`, limit 100K, used 0, remaining 100K
- [x] Verified quota enforcement logic: free tier hard-blocks at limit, paid tiers allow overage (code + 14 unit tests)
- [x] Verified webhook handler: 5 events handled (checkout.completed, sub.updated, sub.deleted, invoice.paid, invoice.payment_failed) with idempotency via unique stripe_event_id
- [~] Sandbox checkout E2E (browser): Julian to complete in Stripe checkout page with test card 4242... then verify tier updates in dashboard
- [~] Configure Stripe Customer Portal in sandbox (Julian: Stripe Dashboard → Settings → Customer Portal)
- [~] Create live Stripe products + prices (3 tiers × 2 intervals = 6 prices)
- [~] Store live price IDs in 1Password (`EmitHQ/stripe`)
- [~] Update Railway env vars: `STRIPE_SECRET_KEY` (sk*live*), `STRIPE_WEBHOOK_SECRET`, all `STRIPE_PRICE_*`
- [~] Create live webhook endpoint: `https://api.emithq.com/api/v1/billing/webhook`
- [~] Verify live checkout end-to-end with real card

---

### T-077: Dashboard Polish + Onboarding Verification [x] [verified] (2 items [~] — LLM signup + dashboard-after-signup pending Julian manual test)

**Phase:** 8a (Show HN blocker)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-075
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Address remaining dashboard issues from smoke testing: Getting Started card not showing (likely localStorage dismissed), verification email going to spam (Clerk SPF/DKIM), LLM signup flow verification, and general frontend polish. Research modern SaaS frontend patterns for final UX pass.

**Acceptance criteria:**

- [x] Getting Started card verified working: clear localStorage, confirm card appears for new orgs
- [x] Clerk email deliverability: DKIM records verified (clk.\_domainkey, clk2.\_domainkey → clerk.services). Clerk sends from own domain — SPF on emithq.com not required.
- [~] LLM signup flow (`POST /api/v1/signup`) verified end-to-end: endpoint returns 500 — Clerk Backend API rejects user creation (likely production instance restriction). Code logic verified via unit tests (12 pass). Julian to test with real email.
- [~] Dashboard populates correctly after LLM signup: blocked on signup flow above. Auto-provision path (browser login) verified in code review.
- [x] Research: review frontend patterns (animations, loading states, empty states, toast notifications) for polish
- [x] Apply top 3-5 quick frontend improvements from research

---

### Phase 8d: Show HN Readiness Gate

---

### T-065: Payment-Gated Abuse Prevention

**Phase:** 10 (post-launch)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-063
**Research:** docs/research/llm-automatable-onboarding.md

**Description:** Add Stripe SetupIntent (card-on-file, $0 charge) as a gate for free tier access. Consolidates with T-042's signup rate limiting. Prevents multi-account abuse while keeping LLM automation frictionless. Optional 7-day/10K-event no-card trial if conversion data warrants it.

**Acceptance criteria:**

- [ ] Stripe SetupIntent flow: programmatic card-on-file collection (no browser required)
- [ ] Free tier gated on valid payment method (or within 7-day trial window)
- [ ] Disposable email domain blocklist (mailinator, guerrillamail, etc.)
- [ ] Usage velocity detection: flag orgs hitting 100K within 48 hours
- [ ] Consolidates T-042 signup rate limiting (3/IP/day already in T-063)
- [ ] Admin endpoint to disable org immediately (from T-042)

---

### T-066: API Key Scoping + Audit Trail

**Phase:** 10 (post-launch)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-063
**Research:** docs/research/llm-automatable-onboarding.md

**Description:** Add optional scope restrictions to API keys and an audit trail for all API operations. Differentiator: 93% of agent projects use unscoped keys. Scoped keys + audit logs make EmitHQ the most security-conscious option for LLM-driven webhook infrastructure.

**Acceptance criteria:**

- [ ] Optional `scopes` array on API key creation (e.g., `messages:write`, `endpoints:read`)
- [ ] Scope enforcement in auth middleware — reject operations outside key's scope
- [ ] Optional `ip_allowlist` and per-key `rate_limit` on API key creation
- [ ] `audit_log` table: key ID, IP, user-agent, method, path, key params, timestamp
- [ ] Audit middleware logs every authenticated API call
- [ ] 90-day retention policy on audit logs
- [ ] Auto-disable on anomalous usage (10x normal volume in 1 hour)

---

### T-067: EmitHQ MCP Server

**Phase:** 10 (post-launch)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-064
**Research:** docs/research/llm-automatable-onboarding.md

**Description:** Build an MCP (Model Context Protocol) server for EmitHQ so Claude and other LLM agents can manage webhooks via tool interface. The MCP server wraps EmitHQ API calls as tools — create app, manage endpoints, send events, check delivery status, manage billing.

**Acceptance criteria:**

- [ ] MCP server package (`packages/mcp` or standalone npm package)
- [ ] Tools: signup, create app, list apps, create endpoint, list endpoints, send event, get message status, get delivery attempts, check quota, manage billing
- [ ] Authentication via EmitHQ API key (configured in MCP settings)
- [ ] Published to npm as `@emithq/mcp`
- [ ] Documented in landing site `/docs` and SDK README

---

### T-069: Frontend-Backend Integration Hardening

**Phase:** 10 (post-launch)
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-038
**Research:** ~/.claude/knowledge/frontend-backend-integration-e2e/research.md

**Description:** Apply frontend-backend integration best practices from cross-project knowledge base research. Key items: E2E tests should use a local test DB instead of Neon branch for speed, and add OpenAPI spec drift detection to CI (T-064 already generates the spec).

**Acceptance criteria:**

- [ ] E2E tests (T-060) configured to use local PostgreSQL instead of Neon branch
- [ ] CI step: regenerate OpenAPI spec, fail if diff against committed spec (drift detection)
- [ ] Review and apply any other applicable patterns from KB research

---

### T-078: LLM-Friendly API Docs & Key Rotation Hardening [x] [verified]

**Phase:** 8a (Show HN blocker)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-064, T-063
**Research:** ~/.claude/knowledge/llm-api-key-security/research.md

**Description:** Harden the LLM-automatable onboarding flow with key rotation support, update llm.txt/agents.json with complete signup-to-first-webhook walkthrough, and register for GitHub Secret Scanning. EmitHQ's differentiator is full LLM automation — the docs and key management must reflect that.

**Acceptance criteria:**

- [x] `POST /api/v1/auth/keys/:keyId/rotate` endpoint: returns new key, old key valid for configurable grace period (default 1 hour)
- [x] Update `llm.txt` with complete LLM onboarding flow: signup → create app → create endpoint → send first event + API key management section + error codes + rate limits
- [x] Update `agents.json` with `manage_api_keys` capability including rotation flow + SDK reference
- [x] Update `openapi.json` with rotate endpoint (signup was already present)
- [-] Register `emhq_` prefix with GitHub Secret Scanning partner program — deferred to post-launch. Requires: email secret-scanning@github.com, build a webhook receiver for leak notifications, implement ECDSA signature verification. See [GitHub docs](https://docs.github.com/code-security/secret-scanning/secret-scanning-partnership-program/secret-scanning-partner-program).
- [x] Tests: 17 tests covering rotation happy path, custom grace period, immediate revocation, validation, plus create/list/revoke

---

## Pre-Launch Hardening — 2026-03-18

_Address infrastructure cost risk, dashboard UX gaps, and abuse prevention before Show HN._

### Phase 8e: Infrastructure & UX Fixes

---

### T-079: Upstash Redis Fixed Plan + Health Check Fix [x] [verified]

**Phase:** 8e
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/infrastructure-stack-audit.md

**Description:** Upgrade Upstash Redis from free tier to Fixed $10/mo plan (unlimited commands, 256MB). Fix the health check endpoint which creates a new Redis connection on every call. BullMQ polling burns ~2.6M commands/month on free tier (500K limit) — fixed plan eliminates this entirely.

**Acceptance criteria:**

- [x] Upstash upgraded to PAYG with $20/mo budget cap (Julian confirmed)
- [x] Health check reuses a singleton Redis connection instead of `createRedisConnection()` per call
- [x] Verified `GET /health` returns `{"status":"ok","db":true,"redis":true}`
- [x] Update service registry memory with correct Upstash plan info

---

### T-080: Dashboard Global Layout Restructure [x] [verified]

**Phase:** 8e
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** Conversation context — research on Vercel/Railway/Clerk dashboard patterns

**Description:** Remove the global sidebar (which has only 2 items and wastes space). At `/dashboard`, the full page is the app card grid. Move Settings to a top bar (gear icon next to user/sign-out). Keep the app-context sidebar when inside `/dashboard/app/[appId]/` — that's where it earns its space.

**Acceptance criteria:**

- [x] Remove `<Sidebar>` from global layout — replaced with `<TopBar>` at all levels (no sidebar anywhere)
- [x] Add top bar with: EmitHQ logo (left), Settings gear icon + Sign Out (right)
- [x] App card grid uses full page width at `/dashboard`
- [x] App-context nav shows inline in top bar: ← Apps | App Name | Overview, Events, Endpoints, DLQ
- [x] Mobile: app-context items in scrollable secondary row below top bar; global has no bottom nav
- [x] `/dashboard/settings` renders full-width (inherits top bar layout)

---

### T-081: App Card + Nav Button UX Improvements [x] [verified]

**Phase:** 8e
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-080
**Research:** Conversation context — card grid best practices

**Description:** Make app cards more visually compelling and clearly clickable. Improve top bar nav button visibility in app context. Remove unnecessary uid badge on default app. Verify endpoint/event counts are accurate.

**Acceptance criteria:**

- [x] Add `ChevronRight` icon on card hover (right side, fades in)
- [x] Add status indicator: green dot = events in last 24h, gray dot = idle
- [x] Add subtle subtext below stats: "View events, endpoints & deliveries"
- [x] Slightly increase card padding and stat font size for visual weight
- [x] Empty state card: webhook icon in accent circle + improved copy + Plus icon on CTA button
- [x] Top bar app-context nav buttons: border + background on both desktop and mobile (tab-style)
- [x] Hide uid badge when uid equals "default"
- [x] Verified: endpoint/event counts use correct SQL subqueries — 0s are accurate (no endpoints/events exist for test apps)

---

### T-083: App Switcher, Docs Link & Quick-Start Docs Page [x] [verified]

**Phase:** 8e
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-080
**Research:** none

**Description:** Add app switcher dropdown in top bar for quick context switching, add Docs link in nav bar, and create a comprehensive quick-start docs page on the landing site that explains how to use the product.

**Acceptance criteria:**

- [x] App switcher dropdown in top bar: click app name → dropdown of all apps with active highlight, "View all apps" link, click-outside-to-close
- [x] "Docs" link in top bar (BookOpen icon), left of Settings gear, links to emithq.com/docs (external, new tab)
- [x] Landing site `/docs` page: comprehensive guide with 5-step quick start (signup, app, endpoint, send, check), API key management (create/rotate/revoke), retries & DLQ table, webhook verification, billing & quotas
- [x] Docs page is static, SEO-friendly, uses landing site CSS variables and styling patterns

---

## Infrastructure Hardening — 2026-03-18

_From stack audit (docs/research/infrastructure-stack-audit.md). Fix ToS violations, add SSRF protection, update service metadata._

### Phase 8f: Pre-Launch Infrastructure

---

### T-084: Migrate Off Vercel Hobby (ToS Compliance)

**Phase:** 8f
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/infrastructure-stack-audit.md

**Description:** Vercel Hobby prohibits commercial use. Migrate the landing site to Cloudflare Pages (free, static export — zero code changes). Upgrade the dashboard to Vercel Pro ($20/mo) — simplest path, Clerk just works. Must complete before first paying customer.

**Acceptance criteria:**

- [ ] Landing site: Cloudflare Pages project created, connected to GitHub repo, build config set (root: `packages/landing`, build: `npm run build`, output: `out`)
- [ ] Landing site: custom domains `emithq.com` + `www.emithq.com` on CF Pages, DNS updated
- [ ] Landing site: verify all pages render (homepage, pricing, compare, docs, legal)
- [ ] Landing site: remove Vercel project
- [ ] Dashboard: upgrade to Vercel Pro ($20/mo) in Vercel console (Julian manual step)
- [ ] Update ARCHITECTURE.md

---

### T-086: SSRF Protection on Endpoint URLs [x] [verified]

**Phase:** 8f (Show HN blocker)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** docs/research/infrastructure-stack-audit.md

**Description:** The delivery worker will POST to any URL registered as an endpoint — including internal IPs (169.254.169.254, 10.x.x.x, 127.0.0.1). Add URL validation at both endpoint creation and delivery time. Block RFC 1918, link-local, loopback, and cloud metadata endpoints.

**Acceptance criteria:**

- [x] `validateEndpointUrl(url)` + `isObviouslyBlockedUrl(url)` in `@emithq/core/security/url-validator.ts`
- [x] Validation runs at endpoint creation (`POST /api/v1/app/:appId/endpoint`) and update (`PUT`) — returns 400
- [x] Validation runs at delivery time (in worker before `fetch`) — marks attempt failed, throws UnrecoverableError
- [x] Blocked ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, ::1, fc00::/7, fe80::/10
- [x] Blocked hostnames: metadata.google.internal, metadata.goog, kubernetes.default.svc, localhost
- [x] DNS resolution check: resolve hostname, verify resolved IP not in blocked ranges (prevents DNS rebinding)
- [x] 20 tests: blocked IPs, public IPs, DNS rebinding, protocol validation, hostname blocking

---

### T-087: Update Service Registry + Remove Unused Env Vars [x] [verified]

**Phase:** 8f
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/infrastructure-stack-audit.md

**Description:** Update auto-memory service registry with correct Clerk free tier (50K MAU, not 10K). Comment out unused QStash and Redis REST env vars in `.env.tpl` to reduce cognitive overhead (they're for T-039, post-launch). Update upgrade triggers based on stack audit.

**Acceptance criteria:**

- [x] Updated `project_service_registry.md`: Clerk 50K MAU, Upstash Fixed $10/mo, CF Pages planned, Vercel ToS flagged
- [x] Commented out unused env vars in `.env.tpl`: REDIS*URL, REDIS_TOKEN, QSTASH*\*, with note referencing T-039
- [x] Updated upgrade triggers and priority order based on stack audit

---

### T-082: Promote T-065 Abuse Prevention Pre-Launch [x] [verified]

**Phase:** 8e
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-076
**Research:** docs/research/llm-automatable-onboarding.md, ~/.claude/knowledge/llm-api-key-security/research.md

**Description:** Pull forward the highest-impact items from T-065 (currently Phase 10) to prevent free-tier abuse before Show HN. Scope: disposable email blocking on signup + admin endpoint to disable an org. Defer card-on-file (Stripe SetupIntent) and velocity detection to post-launch — they require more Stripe integration work.

**Acceptance criteria:**

- [x] Disposable email domain blocklist (55+ domains) on `POST /api/v1/signup` — returns 400 for disposable emails
- [x] `POST /api/v1/admin/org/:orgId/disable` — sets org disabled flag + reason, all API calls return 403
- [x] `POST /api/v1/admin/org/:orgId/enable` — re-enables org (bonus)
- [x] Admin endpoint protected by `ADMIN_SECRET` or `METRICS_SECRET` header
- [x] Auth middleware checks `disabled` flag for both API key and Clerk session auth paths
- [x] DB migration: added `disabled` + `disabled_reason` columns to organizations table
- [x] Tests: 8 disposable email tests (blocked domains, allowed domains, case-insensitive, invalid format)

---

## First 10 Customers — 2026-03-19

_Product is live. Stripe is live. Zero customers. Claude drives all execution. Research: docs/research/first-10-customers.md_

### Phase 11: Outreach & First Users

---

### T-088: GitHub Svix User Mining + Cold Email Drafts

**Phase:** 11
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/first-10-customers.md

**Description:** Search GitHub for companies importing `@svix/svix` in package.json. Extract company names, repo context, and maintainer contact info (email from commits/profile). Draft 20 personalized cold emails highlighting the $49 vs $490 pricing gap. Each email references the specific repo.

**Acceptance criteria:**

- [ ] GitHub code search: find 50+ repos with `@svix/svix` in package.json or similar
- [ ] Extract company/org name, repo URL, maintainer name, and email for each
- [ ] Categorize: startup vs enterprise, webhook volume estimate from repo context
- [ ] Draft 20 personalized cold emails (each references their specific repo/company)
- [ ] Email template: intro → pricing gap → CTA (try free, no card required)
- [ ] Follow-up template: Day 3, Day 10
- [ ] Artifact: `docs/outreach/svix-targets.md` with target list + email drafts

---

### T-089: Email Sending Infrastructure

**Phase:** 11
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** docs/research/first-10-customers.md

**Description:** Set up email sending capability that Claude can use autonomously. Options: Resend API (transactional email service — free tier 100 emails/day), or Gmail MCP if available. Emails should come from a professional address (e.g., julian@emithq.com or hello@emithq.com). Must be automatable from Claude's bash/API access.

**Acceptance criteria:**

- [ ] Research: evaluate Resend vs Gmail MCP vs other options for Claude-driven email sending
- [ ] Set up chosen email service (account, API key in 1Password, domain verification)
- [ ] Create sending script or integration that Claude can invoke from bash
- [ ] Configure sender address (professional @emithq.com address)
- [ ] Send test email to julian@naac.ai to verify delivery + formatting
- [ ] Verify emails don't land in spam (SPF/DKIM configured)

---

### T-090: Execute Cold Outreach — First 10 Users

**Phase:** 11
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-088, T-089
**Research:** docs/research/first-10-customers.md

**Description:** Send the personalized cold emails from T-088 using the infrastructure from T-089. Track responses. Follow up on Day 3 and Day 10. White-glove onboard anyone who signs up — help them create their first app, endpoint, and send their first webhook.

**Acceptance criteria:**

- [ ] First batch of 20 emails sent
- [ ] Follow-up cadence running: Day 0 → Day 3 → Day 10
- [ ] Track in `docs/outreach/tracker.md`: sent count, reply count, signup count, active count
- [ ] White-glove onboard any signups: create app + endpoint + first event via API on their behalf
- [ ] Goal: 5+ orgs signed up, 2+ sending real webhook events
- [ ] Supersedes T-052 (consolidated)

---

### T-091: Origin Story Blog Post

**Phase:** 11
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/content-distribution-strategy.md

**Description:** Write and publish "Why We Built EmitHQ: The $49-$490 Webhook Pricing Gap" on emithq.com/blog. Supports outreach emails as credibility piece. Claude writes in Julian's voice based on the pricing research and competitive analysis already completed. Supersedes T-055.

**Acceptance criteria:**

- [ ] Blog post written: origin story, pricing gap discovery, what EmitHQ does differently
- [ ] Published on emithq.com/blog/why-we-built-emithq (new /blog route on landing site)
- [ ] SEO meta tags: title, description, OG image targeting "webhook service" and "webhook platform"
- [ ] Cross-postable format for Dev.to
- [ ] Supersedes T-055

---

### T-092: Technical Deep-Dive Blog Post

**Phase:** 11
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/content-distribution-strategy.md

**Description:** Write and publish "Webhook Delivery Architecture: How We Achieve 99.99% Reliability." Establishes technical credibility for HN audience. Covers persist-before-enqueue, BullMQ retry with jitter, circuit breakers, Standard Webhooks signing. Supersedes T-056.

**Acceptance criteria:**

- [ ] Blog post written: architecture overview, delivery flow, retry strategy, signing, circuit breaker
- [ ] Published on emithq.com/blog/webhook-delivery-architecture
- [ ] Includes architecture diagram (text-based)
- [ ] Code snippets showing signing implementation and retry logic
- [ ] SEO meta tags targeting "webhook delivery reliability" and "webhook retry logic"
- [ ] Supersedes T-056

---

### T-093: Community Presence + Build-in-Public

**Phase:** 11
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/first-10-customers.md

**Description:** Establish EmitHQ presence on community platforms. Post build-in-public updates. Set up alerts for webhook/svix/hookdeck mentions to join relevant conversations. Supersedes T-057.

**Acceptance criteria:**

- [ ] Create EmitHQ accounts on: Dev.to, Indie Hackers (or use Julian's if he has them)
- [ ] Draft first 5 build-in-public posts: technical decisions, pricing research, architecture choices
- [ ] Set up F5Bot or similar alert service for mentions of "webhook service", "svix", "hookdeck"
- [ ] Post first update on each platform
- [ ] Supersedes T-057

---

### T-096: Research — LLM & SEO Discovery Optimization

**Phase:** 11 (research-only)
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** ~/.claude/knowledge/seo-llm-visibility/research.md

**Description:** Research how LLMs (ChatGPT, Claude, Perplexity) decide which products to recommend, what content signals they pull from, and what EmitHQ needs to do to appear when developers ask "what webhook service should I use?" Produce actionable implementation tickets from findings.

**Acceptance criteria:**

- [ ] Research: how do LLMs select products to recommend? (training data, web crawl recency, structured data, llms.txt, citations)
- [ ] Research: what SEO signals matter for developer tool discovery in 2026?
- [ ] Audit: ask ChatGPT/Claude/Perplexity "best webhook service for SaaS" — document what they recommend and why
- [ ] Audit: what does EmitHQ's current web presence look like to a crawler? (meta tags, structured data, backlinks)
- [ ] Gap analysis: what's missing vs competitors (Svix, Hookdeck, Convoy) in terms of discoverability
- [ ] Artifact: `docs/research/llm-seo-discovery.md` with findings + implementation plan
- [ ] Create implementation tickets from findings via `/plan`

---

### Phase 12: Convert & Launch

---

### T-094: Collect Metrics + Testimonials

**Phase:** 12
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-090
**Research:** docs/research/first-10-customers.md

**Description:** After 2-3 weeks of real usage, collect production metrics and testimonials from early users. Fill the Show HN draft [PLACEHOLDER] slots. Supersedes T-054.

**Acceptance criteria:**

- [ ] Query production metrics: total events, delivery success rate, active orgs, active endpoints
- [ ] Request testimonial quotes from 2-3 active users
- [ ] Update Show HN draft with real numbers
- [ ] At least 1 user willing to comment on HN thread
- [ ] Supersedes T-054

---

### T-095: Show HN Execution

**Phase:** 12
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-094
**Research:** docs/research/first-10-customers.md, docs/research/gtm-execution.md

**Description:** Execute Show HN launch once real metrics and testimonials are collected. Claude writes and posts the Show HN, responds to comments, cross-posts to Dev.to. Supersedes T-034 + T-058.

**Acceptance criteria:**

- [ ] Show HN draft finalized with real metrics (no [PLACEHOLDER] slots)
- [ ] Readiness gate passed: 5+ real users, 1+ paying or committed, 1+ testimonial
- [ ] Show HN posted (Sunday 11:00-16:00 UTC)
- [ ] Every HN comment responded to within 30 minutes for first 6 hours
- [ ] Dev.to cross-post published day after
- [ ] Supersedes T-034 + T-058

---

### Deferred Tickets [-]

_The following tickets are deferred until post-first-10-customers. They add complexity without value at zero users._

- [-] T-025: First Iteration Cycle — need data first
- [-] T-035: Sustained Acquisition Setup — after Show HN
- [-] T-036: Email Service & Lifecycle Emails — after 100+ users
- [-] T-037: Stripe Overage Metering — after users hit limits
- [-] T-038: CI Integration Tests — infrastructure, not user-facing
- [-] T-039: Cloudflare Workers Edge Layer — no inbound webhook demand yet
- [-] T-043: Infrastructure Cost Monitoring — premature at $15/mo
- [-] T-044: Automated Social Media — manual posting is fine
- [-] T-046: Cold Outreach Campaign — merged into T-088+T-090
- [-] T-052: Cold Outreach First 10 — merged into T-090
- [-] T-053: Pricing Validation Interviews — after 5+ users
- [-] T-055: Origin Story Blog — superseded by T-091
- [-] T-056: Technical Deep-Dive — superseded by T-092
- [-] T-057: Build-in-Public — superseded by T-093
- [-] T-065: Payment-Gated Abuse Prevention — zero users to abuse
- [-] T-066: API Key Scoping — nice-to-have post-launch
- [-] T-067: EmitHQ MCP Server — build after users request it
- [-] T-069: Frontend-Backend Integration Hardening — infrastructure
- [-] T-084: Vercel Migration — before first paying customer

---

### T-058: Show HN Readiness Gate

**Phase:** 8d
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-047, T-048, T-049, T-050, T-051, T-052, T-053, T-054, T-055, T-056, T-060, T-063, T-064
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
- [x] T-030 marketplace submissions completed
- [ ] E2E happy-path test passes locally (T-060)
- [-] ~~MFA enabled in Clerk (T-061)~~ — deferred, Clerk Pro feature
- [ ] API-only signup endpoint live and tested (T-063)
- [ ] OpenAPI spec + llm.txt + agents.json published (T-064)
- [ ] All production services healthy (API, worker, dashboard, Umami)

---
