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

### T-068: Research — Dashboard UX Restructure [x] [verified]

**Phase:** 8a (Show HN blocker)
**Effort:** Medium
**Complexity:** Complex
**Depends on:** T-060
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** The dashboard UX has several issues surfaced during smoke testing. Research and plan a restructure covering: (1) App selection should be the landing page, not a dropdown — overview page shows apps as cards, user clicks to enter an app's context. (2) Getting Started integrated into the landing page and disappears after first app is created. (3) Settings should include Profile and Billing (consolidated page, not 3 separate nav items). (4) Deleted apps should be soft-deleted with 30-day recovery in settings. (5) App dropdown shows stale deleted apps (client cache not invalidated). (6) Delete button formatting issues. Check frontend research at `~/.claude/knowledge/` and review modern SaaS dashboard patterns.

**Acceptance criteria:**

- [x] Research: review dashboard patterns (Vercel, Railway, Clerk, Stripe) for app-centric navigation
- [x] Research: soft-delete with recovery UX patterns
- [x] Research: settings consolidation (profile + billing + API keys in one page vs tabs)
- [x] Design: wireframe/description of new dashboard layout
- [x] Plan: break into implementation tickets with effort estimates
- [x] Artifact: `docs/research/dashboard-ux-restructure.md`

---

### Phase 8a: Dashboard UX Restructure (Implementation)

_Six tickets from T-068 research. Implements app-centric navigation, inline onboarding, settings consolidation, soft delete, and cache fix. Show HN blocker._

---

### T-070: Route Restructure + Sidebar Transform

**Phase:** 8a (Show HN blocker)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-068
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Restructure dashboard routes from flat `?app=` query param to path-based `/dashboard/app/[appId]/*`. Replace the AppSwitcher dropdown with a two-state sidebar: global mode (Apps, Settings, Sign Out) and app-context mode (Overview, Events, Endpoints, DLQ with "Back to Apps" link). Remove `hrefWithApp()` query param propagation.

**Acceptance criteria:**

- [ ] `/dashboard/app/[appId]` nested layout with dynamic route
- [ ] Events, Endpoints, DLQ pages moved to `/dashboard/app/[appId]/*`
- [ ] Sidebar renders global nav when on `/dashboard` or `/dashboard/settings`
- [ ] Sidebar renders app-scoped nav with app name and "Back to Apps" when on `/dashboard/app/*`
- [ ] `useApp()` hook reads `appId` from path params instead of query params
- [ ] All internal links updated to path-based app context
- [ ] AppSwitcher component removed
- [ ] `hrefWithApp()` removed from nav

---

### T-071: App Listing as Landing Page

**Phase:** 8a (Show HN blocker)
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-070
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Make the app card grid the dashboard landing page at `/dashboard`. Each card shows app name, uid, endpoint count, and 24h event count. Clicking a card navigates to `/dashboard/app/[appId]`. The current Overview stats page becomes the app-scoped overview at `/dashboard/app/[appId]`.

**Acceptance criteria:**

- [ ] `/dashboard` renders app card grid (moved from `/dashboard/applications`)
- [ ] Each card shows: app name, uid (if set), endpoint count, 24h event count, created date
- [ ] "+ New Application" card/button in the grid
- [ ] Click card navigates to `/dashboard/app/[appId]`
- [ ] Overview stats page moved to `/dashboard/app/[appId]`
- [ ] Empty state: centered CTA when no apps exist
- [ ] `/dashboard/applications` route removed or redirects to `/dashboard`

---

### T-072: Inline Onboarding

**Phase:** 8a (Show HN blocker)
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-071
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Move the Getting Started checklist from a standalone page to an inline card on the app listing page. Add server-side `onboarding_completed_at` flag to organizations table. Checklist appears above app cards when incomplete, auto-hides when all steps done, dismissible.

**Acceptance criteria:**

- [ ] Getting Started extracted to reusable component (not a page)
- [ ] Rendered inline on `/dashboard` above app cards when onboarding incomplete
- [ ] `onboarding_completed_at` column added to organizations table (migration)
- [ ] Dismiss sets both localStorage AND server-side flag
- [ ] Auto-hides when all 4 steps complete (brief "You're all set" state)
- [ ] `/dashboard/getting-started` page removed
- [ ] Getting Started nav item removed
- [ ] New API endpoint: `POST /api/v1/onboarding/dismiss`

---

### T-073: Settings Consolidation

**Phase:** 8a (Show HN blocker)
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-068
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Consolidate Settings (API keys), Billing, and Profile into a single tabbed page at `/dashboard/settings`. Tab routing via `?tab=` query param. Remove Billing and Profile from sidebar nav. Add empty Danger Zone tab (populated by T-074).

**Acceptance criteria:**

- [ ] `/dashboard/settings` renders tabbed interface: API Keys (default), Billing, Profile, Danger Zone
- [ ] Tab routing via `?tab=api-keys|billing|profile|danger-zone`
- [ ] API Keys tab contains current Settings page content
- [ ] Billing tab contains current Billing page content
- [ ] Profile tab contains Clerk `<UserProfile />`
- [ ] Danger Zone tab shows placeholder ("No recently deleted apps")
- [ ] Billing and Profile removed from sidebar nav
- [ ] `/dashboard/billing` and `/dashboard/profile` redirect to `/dashboard/settings?tab=billing` and `?tab=profile`

---

### T-074: Soft Delete + Recovery

**Phase:** 8a (Show HN blocker)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-073
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Replace hard delete of applications with soft delete. Add `deleted_at` column, update DELETE endpoint to set timestamp instead of cascading delete, add restore endpoint, add recovery UI in Settings > Danger Zone tab. 30-day auto-purge of soft-deleted apps.

**Acceptance criteria:**

- [ ] `deleted_at TIMESTAMPTZ` column added to applications table (migration)
- [ ] Partial index: `CREATE INDEX idx_applications_deleted ON applications(org_id) WHERE deleted_at IS NULL`
- [ ] `DELETE /api/v1/app/:appId` sets `deleted_at = NOW()` and disables all endpoints
- [ ] `GET /api/v1/app` filters `WHERE deleted_at IS NULL` by default
- [ ] `GET /api/v1/app?deleted=true` returns only soft-deleted apps
- [ ] `POST /api/v1/app/:appId/restore` clears `deleted_at` and re-enables endpoints
- [ ] Settings > Danger Zone tab lists soft-deleted apps with Restore and Permanent Delete buttons
- [ ] 5-second undo toast in dashboard after soft-delete
- [ ] Confirmation dialog updated: "This app will be moved to trash. You can restore it within 30 days."
- [ ] 30-day auto-purge: hard-delete apps where `deleted_at < NOW() - INTERVAL '30 days'`

---

### T-075: Stale App Cache Fix

**Phase:** 8a (Show HN blocker)
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-070
**Research:** docs/research/dashboard-ux-restructure.md

**Description:** Replace per-component `useState` app lists with a shared React Context. All components that need the app list consume from `useApps()`. Mutations (create, delete, restore) update context immediately, eliminating stale data in the sidebar.

**Acceptance criteria:**

- [ ] `AppsProvider` React Context wrapping dashboard layout
- [ ] `useApps()` hook: `{ apps, loading, refetch, removeApp, addApp }`
- [ ] App listing page consumes from `useApps()` instead of local fetch
- [ ] Sidebar app name (in app-context mode) reads from context
- [ ] Create/delete/restore operations update context immediately
- [ ] No stale apps visible anywhere after mutation

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
- [ ] T-030 marketplace submissions completed (Julian's manual items)
- [ ] E2E happy-path test passes locally (T-060)
- [-] ~~MFA enabled in Clerk (T-061)~~ — deferred, Clerk Pro feature
- [ ] API-only signup endpoint live and tested (T-063)
- [ ] OpenAPI spec + llm.txt + agents.json published (T-064)
- [ ] All production services healthy (API, worker, dashboard, Umami)

---
