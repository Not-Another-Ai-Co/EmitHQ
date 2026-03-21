# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-20
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

### T-076: Stripe Checkout E2E Test + Live Mode Activation [x] [verified]

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
- [x] Sandbox checkout E2E (browser): completed — verified tier update in dashboard
- [x] Configure Stripe Customer Portal in sandbox
- [x] Create live Stripe products + prices (3 tiers × 2 intervals = 6 prices)
- [x] Store live price IDs in 1Password (`EmitHQ/stripe`)
- [x] Update Railway env vars: `STRIPE_SECRET_KEY` (sk*live), `STRIPE_WEBHOOK_SECRET`, all `STRIPE_PRICE*\*`
- [x] Create live webhook endpoint: `https://api.emithq.com/api/v1/billing/webhook`
- [x] Verify live checkout end-to-end with real card — Julian subscribed to Starter, confirmed working

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
- [x] Disposable email domain blocklist (mailinator, guerrillamail, etc.) — done in T-082
- [ ] Usage velocity detection: flag orgs hitting 100K within 48 hours
- [ ] Consolidates T-042 signup rate limiting (3/IP/day already in T-063)
- [x] Admin endpoint to disable org immediately (from T-042) — done in T-082

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

---

### T-084: Migrate Off Vercel Hobby (ToS Compliance)

**Phase:** 8f
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/infrastructure-stack-audit.md

**Description:** Vercel Hobby prohibits commercial use. Migrate the landing site to Cloudflare Pages (free, static export — zero code changes). Upgrade the dashboard to Vercel Pro ($20/mo) — simplest path, Clerk just works. Low risk at small scale — defer until 5-10 paying customers.

**Acceptance criteria:**

- [ ] Landing site: Cloudflare Pages project created, connected to GitHub repo, build config set (root: `packages/landing`, build: `npm run build`, output: `out`)
- [ ] Landing site: custom domains `emithq.com` + `www.emithq.com` on CF Pages, DNS updated
- [ ] Landing site: verify all pages render (homepage, pricing, compare, docs, legal)
- [ ] Landing site: remove Vercel project
- [ ] Dashboard: upgrade to Vercel Pro ($20/mo) in Vercel console (Julian manual step)
- [ ] Update ARCHITECTURE.md

---

---

## First 10 Customers — 2026-03-19

_Product is live. Stripe is live. Zero customers. Claude drives all execution. Research: docs/research/first-10-customers.md_

### Phase 11: Outreach & First Users

---

### T-088: GitHub Svix User Mining + Cold Email Drafts [x] [verified]

**Phase:** 11
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/first-10-customers.md

**Description:** Search GitHub for companies importing `@svix/svix` in package.json. Extract company names, repo context, and maintainer contact info (email from commits/profile). Draft 20 personalized cold emails highlighting the $49 vs $490 pricing gap. Each email references the specific repo.

**Acceptance criteria:**

- [x] GitHub code search: find 50+ repos with `@svix/svix` in package.json or similar
- [x] Extract company/org name, repo URL, maintainer name, and email for each
- [x] Categorize: startup vs enterprise, webhook volume estimate from repo context
- [x] Draft 20 personalized cold emails (each references their specific repo/company)
- [x] Email template: intro → pricing gap → CTA (try free, no card required)
- [x] Follow-up template: Day 3, Day 10
- [x] Artifact: `docs/outreach/svix-targets.md` with target list + email drafts

---

### T-089: Email Sending Infrastructure [x] [verified]

**Phase:** 11
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** docs/research/first-10-customers.md

**Description:** Set up email sending capability that Claude can use autonomously. Options: Resend API (transactional email service — free tier 100 emails/day), or Gmail MCP if available. Emails should come from a professional address (e.g., julian@emithq.com or hello@emithq.com). Must be automatable from Claude's bash/API access.

**Acceptance criteria:**

- [x] Research: evaluate Resend vs Gmail MCP vs other options for Claude-driven email sending
- [x] Set up chosen email service (account, API key in 1Password, domain verification)
- [x] Create sending script or integration that Claude can invoke from bash
- [x] Configure sender address (professional @emithq.com address)
- [x] Send test email to julian@naac.ai to verify delivery + formatting
- [x] Verify emails don't land in spam (SPF/DKIM configured)

---

### T-090: Execute Cold Outreach — First 10 Users

**Phase:** 11
**Effort:** Large
**Complexity:** Complex
**Depends on:** T-088, T-089
**Research:** docs/research/first-10-customers.md, docs/tmp/build-explore-outreach-loop.md, docs/tmp/build-explore-outreach-best-practices.md, docs/tmp/build-explore-tooling-audit.md, docs/tmp/build-explore-resend-capabilities.md

**Description:** Build and run a fully autonomous cold outreach campaign. Claude sends initial emails, monitors for bounces/replies, classifies responses, auto-responds to low-risk categories, flags high-value replies for Julian, and sends scheduled follow-ups with different angles per touch. Continuous GitHub mining refills the prospect pipeline. System designed for future migration into Index-based workflow engine.

**Architecture (from research):**

- **Campaign state:** `docs/outreach/campaign.json` — structured JSON with targets, touch history, resend IDs
- **Event log:** `docs/outreach/events.jsonl` — append-only, typed events (send, delivered, bounced, reply, flagged, approved). Index-ingestible format.
- **Reply capture:** Resend inbound on `replies.emithq.com` (MX → `inbound-smtp.resend.com`). API handler at `/api/v1/inbound/reply` classifies and routes replies.
- **Bounce/delivery tracking:** Resend webhook at `/api/v1/inbound/resend-events` for `email.bounced`, `email.delivered`, `email.complained`.
- **Morning cron (8 AM Mon–Thu):** `claude -p` reads campaign state, sends due follow-ups, polls bounce status, updates state. Rate limit: 20 first-touch/day, 30 total/day.
- **Evening cron (6 PM daily):** Aggregates daily activity, writes digest, emails Julian if flags exist.
- **Continuous prospecting cron (weekly):** `claude -p` mines GitHub for new Svix/Hookdeck/Convoy users, appends to campaign.json, queues for Julian approval before first touch.
- **Notification:** Resend email to `julian@naac.ai` for flags (interested replies, angry, spam complaints, bounce rate >2%).
- **Approval flow (v1):** Julian approves in next Claude session. Future: reply-to-approve via Resend inbound. Longer-term: Index workflow engine.

**6-touch sequence (different angle each):**

1. Day 0 — Personalized hook: their repo, pricing gap ($49 vs $490)
2. Day 3 — Architecture story: persist-before-enqueue, circuit breakers
3. Day 10 — Social proof / early metrics
4. Day 17 — Self-hosting / open-source (AGPL)
5. Day 22 — Resource share: technical blog post
6. Day 30 — Honest breakup: "last email, here if needed"

**Reply classification (12 categories):**

- Auto-respond: `question` (factual answer from docs), `not_interested` (graceful close)
- Flag for Julian: `interested`, `meeting_request`, `wrong_person`, `angry`
- Auto-handle: `unsubscribe` (suppress immediately), `out_of_office` (pause sequence), `bounced_hard` (remove), `bounced_soft` (retry), `spam_complaint` (suppress), `competitor` (suppress)

**Safety rails:**

- Suppression list (`docs/outreach/suppression-list.txt`) checked before every send
- CAN-SPAM: physical address in footer (187 E. Warm Springs Road, Suite B - NV189, Las Vegas NV 89119), reply-to as opt-out mechanism, no formal unsubscribe footer (volume <5K)
- No List-Unsubscribe header (not required at this volume)
- Claude cannot invent metrics, disparage competitors, or make legal claims
- `interested`/`angry`/`meeting_request` replies always gated behind Julian

**Cron notes:** `claude -p --model sonnet` runs as separate process, does NOT interrupt interactive sessions. Shares subscription rate limit pool but lightweight usage won't conflict.

**Future-proofing:** JSON + JSONL event format designed for Index ingestion. When Index becomes the workflow backbone, campaign state becomes queryable items and crons become Index-triggered actions.

**Acceptance criteria:**

- [ ] DNS: `replies.emithq.com` MX record added via Cloudflare API
- [ ] Resend inbound configured for `replies.emithq.com`
- [ ] API handlers: `/api/v1/inbound/reply` (reply classification + routing) and `/api/v1/inbound/resend-events` (bounce/delivery webhook)
- [ ] `campaign.json` + `events.jsonl` state management
- [ ] `scripts/outreach-loop.sh` morning cron (send follow-ups, check bounces)
- [ ] `scripts/outreach-digest.sh` evening cron (daily digest, flag alerts)
- [ ] `scripts/outreach-prospect.sh` weekly cron (GitHub mining for new targets)
- [ ] Follow-up templates for touches 2–6 (different angle each)
- [ ] Reply classifier prompt + auto-response templates
- [ ] Suppression list handling
- [ ] Julian approves first-touch batch, first batch sent
- [ ] Follow-up cadence running autonomously
- [ ] White-glove onboard any signups
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
- [-] T-084: Vercel Migration — after first 5-10 customers

---

## Testing Baseline — 2026-03-20

_Establish Playwright MCP baseline and T-090 test infrastructure before building the outreach system._

---

### T-097: Playwright MCP Smoke Test + Dashboard Baseline [x] [verified]

**Phase:** 11 (pre-T-090)
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** ~/.claude/knowledge/browser-mcp-testing/research.md

**Description:** First-ever Playwright MCP test in this project. Validate the tool works against the live dashboard (Clerk auth, page navigation, element interaction). Establish patterns for future `/verify` browser testing. This is a one-time setup — once proven, `/verify` handles incremental testing.

**Acceptance criteria:**

- [x] Playwright MCP connects to live dashboard at `https://app.emithq.com`
- [x] Auth works: navigate to dashboard, Clerk login completes (use E2E test user from 1Password)
- [x] Navigate to 3+ dashboard pages: home, apps list, settings
- [x] Verify key elements render: app table, billing tab, API key section
- [x] Document any Clerk-specific quirks (iframe auth, session handling) in TEST_PLAN.md
- [x] Update TEST_PLAN.md: mark archetypes 1 (auth) and 8 (navigation) as "Covered" if tests pass

---

### T-098: T-090 Unit Test Infrastructure [x] [verified]

**Phase:** 11 (pre-T-090)
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** none

**Description:** Write the Vitest test suite for T-090's backend components BEFORE building them (test-first). This ticket creates test files with clear expectations; T-090 implements the code that makes them pass. Covers: reply classification (12 categories), campaign state management (JSON read/write), suppression list enforcement, and inbound API handler validation.

**Acceptance criteria:**

- [x] `packages/api/src/routes/inbound.test.ts` — tests for `/api/v1/inbound/reply` handler: valid reply payload → classified correctly, missing fields → 400, invalid signature → 401, suppressed sender → auto-handled
- [x] `packages/api/src/routes/inbound.test.ts` — tests for `/api/v1/inbound/resend-events` handler: `email.bounced` → marks target as bounced, `email.delivered` → logs delivery, `email.complained` → adds to suppression list, duplicate event ID → idempotent
- [x] `scripts/__tests__/reply-classifier.test.ts` — tests for all 12 reply categories: `interested`, `meeting_request`, `question`, `not_interested`, `wrong_person`, `angry`, `unsubscribe`, `out_of_office`, `bounced_hard`, `bounced_soft`, `spam_complaint`, `competitor`
- [x] `scripts/__tests__/campaign-state.test.ts` — tests for campaign.json read/write: add target, record touch, update status, append event to events.jsonl, check suppression list
- [x] All tests initially fail (no implementation yet) — verified with `vitest run --reporter=verbose`

---

### T-099: Landing Site Browser Smoke Test [x] [verified]

**Phase:** 11 (pre-T-090)
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-097
**Research:** none

**Description:** Use Playwright MCP to verify the landing site pages that outreach emails link to. Prospective Customer persona: every cold email CTA links to emithq.com — those pages must work. Quick visual verification of homepage, pricing, compare, docs.

**Acceptance criteria:**

- [x] Playwright MCP loads `https://emithq.com` — homepage renders, CTA buttons visible
- [x] Navigate to `/pricing` — 3 tiers visible with correct prices ($49, $149, $349)
- [x] Navigate to `/compare` — comparison table renders
- [x] Navigate to `/docs` — API reference loads
- [x] No console errors or broken images on any page
- [x] Update TEST_PLAN.md: note landing site coverage under archetype 14 (performance) if LCP measured

---

## Payload Transformation Dashboard — 2026-03-21

_Research: docs/research/payload-transform-dashboard-ux.md. Julian decided: Starter+ tier, build now, fix pricing._

---

### T-100: Fix Pricing Inconsistency — Transforms Available Starter+ [x] [verified]

**Phase:** 13a
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/payload-transform-dashboard-ux.md

**Description:** Landing site pricing page shows transforms as Growth+ only. Compare pages say "all tiers." API has no tier enforcement. Fix all three to align: transforms available on Starter+ ($49/mo). Free tier excluded.

**Acceptance criteria:**

- [x] Pricing page: "Payload transformations" checkmark on Starter, Growth, Scale tiers (not Free)
- [x] Compare page (/compare): EmitHQ row already shows boolean ✓ — no tier-specific text needed
- [x] Compare/svix page: update "all tiers" to "Starter+ ($49/mo)" for transforms
- [x] Compare/build-vs-buy page: no tier mentioned — "No-code JSONPath + templates" is tier-agnostic
- [x] Verify: no API-level tier enforcement needed yet (transforms already work on any tier via API)
- [x] Homepage: added "Payload transformation" to Starter tier features list
- [x] Dashboard billing: already lists transforms on Starter — no change needed

---

### T-101: Transform Rule Editor UI — Endpoint Create/Edit [x] [verified]

**Phase:** 13a
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-100
**Research:** docs/research/payload-transform-dashboard-ux.md

**Description:** Add a visual form-based transform rule editor to the endpoint create/edit page. Each rule is a row of 3 inputs (Source Path, Target Field, optional Template) with add/remove buttons. Maps 1:1 to existing `TransformRule[]` model. No code editor. Collapsible section, hidden by default.

**Acceptance criteria:**

- [x] "Transform Rules" collapsible section on endpoint create and edit forms
- [x] Rule row: Source Path (text, `$.` prefix hint), Target Field (text), Template (optional text)
- [x] Add Rule / Remove Rule (×) buttons, max 20 rules enforced in UI
- [x] Inline validation: invalid JSONPath, empty required fields, duplicate target fields
- [x] Existing rules pre-populated when editing an endpoint
- [x] Removing all rules saves as `null` (passthrough mode)
- [x] Empty state: "No transform rules — payload forwarded as-is"
- [x] Function reference tooltip: formatDate, uppercase, lowercase, concat with examples
- [x] Mobile: rules stack vertically, remove button is tappable (44×44px)

**Gherkin scenarios (selected):**

```gherkin
Scenario: Add a single transform rule and save
  Given the SaaS Developer is on the endpoint create page (Starter+ tier)
  When they click "Add Rule"
  And enter "$.user.email" as Source Path and "customer_email" as Target Field
  And click "Save Endpoint"
  Then the endpoint is saved with one transform rule
  And navigating back shows the rule pre-populated

Scenario: Invalid JSONPath shows inline error
  Given the developer has added a rule row
  When they enter "user..email" as Source Path and tab away
  Then an inline error appears: "Invalid JSONPath expression"
  And the Save button is disabled

Scenario: Exceeding 20 rules disables Add Rule
  Given the developer has added 20 rule rows
  Then the Add Rule button is disabled
  And helper text reads "Maximum of 20 transform rules per endpoint"

Scenario: Remove all rules reverts to passthrough
  Given an endpoint has one transform rule
  When the developer removes it
  Then the section shows "No transform rules — payload forwarded as-is"
  And saving persists null transformRules
```

---

### T-102: Live Transform Preview Panel [x] [verified]

**Phase:** 13a
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-101
**Research:** docs/research/payload-transform-dashboard-ux.md

**Description:** Add a live preview panel to the transform editor. User pastes a sample JSON payload, sees transformed output in real-time. Calls existing `POST /api/v1/transform/preview` endpoint (debounced). Side-by-side on desktop, tabbed on mobile.

**Acceptance criteria:**

- [x] Preview panel below the rules editor: "Sample Payload" input (textarea) → "Transformed Output" (read-only)
- [x] Calls `POST /api/v1/transform/preview` on keystrokes (debounced 300ms)
- [x] Invalid JSON input shows "Invalid JSON" message, no API call
- [x] Empty rules show passthrough: input === output with "Passthrough" label
- [x] Source path not found in payload shows inline warning per rule — API returns validation error for missing paths
- [x] Mobile: stacked layout (flex-col) — both sections visible without tabs
- [x] No preview API call when no rules exist — passthrough rendered client-side

**Gherkin scenarios (selected):**

```gherkin
Scenario: Live preview shows transformed output
  Given the developer has a rule: $.user.email → customer_email
  When they paste {"user": {"email": "jane@test.com"}} into the preview input
  Then the output shows {"customer_email": "jane@test.com"}

Scenario: Missing path shows inline warning
  Given the developer has a rule: $.user.phone → phone
  When they paste {"user": {"email": "jane@test.com"}}
  Then the rule shows warning: "Path '$.user.phone' not found in sample payload"
```

---

### T-103: Transform Tier Gating UI

**Phase:** 13a
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-101
**Research:** docs/research/payload-transform-dashboard-ux.md

**Description:** Free tier users see an upgrade prompt instead of the transform editor. Starter+ users see the full editor. No API-level enforcement — UI-only gating.

**Acceptance criteria:**

- [ ] Free tier: transform section replaced with upgrade prompt ("Payload transforms available on Starter+")
- [ ] Upgrade button links to billing checkout (Starter tier)
- [ ] Starter/Growth/Scale: full transform editor visible and interactive
- [ ] After upgrading mid-session and returning to page, editor appears (no reload required if possible)

**Gherkin scenarios (selected):**

```gherkin
Scenario: Free tier sees upgrade prompt
  Given the developer is on the Free tier
  When they navigate to endpoint create/edit
  Then the transform section shows "Payload transforms are available on Starter and above"
  And a button reads "Upgrade to Starter — $49/mo"
  And no rule inputs are rendered
```

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
