# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-22
> Archived tickets: see [TICKETS-ARCHIVE.md](TICKETS-ARCHIVE.md)

Status markers: `[ ]` open | `[x]` complete | `[x] [verified] [audited]` passed quality gates | `[x] [verified] [audited] [audited]` docs audited | `[-]` skipped/deferred | `[~]` blocked

## Recently Completed

### T-104: API-Level Tier Enforcement for Payload Transforms [x] [verified] [audited]

**Phase:** 10
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-100
**Research:** none (gap found during catchup audit)

**Description:** Add server-side tier check on endpoint create (POST) and update (PUT) — free-tier orgs attempting to set `transformRules` get 403 with upgrade guidance. Closes the bypass where free users could use transforms via direct API calls.

**Acceptance criteria:**

- [x] `checkTransformTier()` helper queries org tier via `adminDb`
- [x] POST `/:appId/endpoint` returns 403 when free tier sets `transformRules`
- [x] PUT `/:appId/endpoint/:epId` returns 403 when free tier sets `transformRules`
- [x] `transformRules: null` on PUT (clearing rules) allowed on any tier
- [x] Error response: `{ code: 'forbidden', action: { type: 'upgrade' } }`
- [x] 5 contract tests added to `endpoints.test.ts`

---

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

### T-090: Execute Cold Outreach — First 10 Users

**Phase:** 11
**Effort:** Large
**Complexity:** Complex
**Depends on:** T-088, T-089, T-107, T-109
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

- [ ] DNS: fix SPF record to include Resend (add `include:amazonses.com`) — current SPF only authorizes Cloudflare, outreach emails will fail SPF alignment without this
- [ ] DNS: `replies.emithq.com` MX record added via Cloudflare API
- [ ] Resend inbound configured for `replies.emithq.com`
- [ ] DNS: verify DMARC stays at `p=none` during initial outreach, tighten to `p=quarantine` after confirming email authentication passes
- [ ] API handlers: `/api/v1/inbound/reply` (reply classification + routing) and `/api/v1/inbound/resend-events` (bounce/delivery webhook)
- [ ] `campaign.json` + `events.jsonl` state management
- [ ] `scripts/outreach-loop.sh` morning cron (send follow-ups, check bounces)
- [ ] `scripts/outreach-digest.sh` evening cron (daily digest, flag alerts)
- [ ] `scripts/outreach-prospect.sh` weekly cron (GitHub mining for new targets)
- [ ] `scripts/infra-health.sh` weekly cron — check Neon CU-hours/storage, Redis memory, Railway usage, event counts vs tier limits. Email julian@naac.ai if any service >70% of free tier limit
- [ ] Evening digest queries Umami API for landing page traffic (referrer sources, page hits) — correlate with outreach sends to measure which angles drive visits
- [ ] Follow-up templates for touches 2–6 (different angle each)
- [ ] Reply classifier prompt + auto-response templates
- [ ] Suppression list handling
- [ ] Julian approves first-touch batch, first batch sent
- [ ] Follow-up cadence running autonomously
- [ ] White-glove onboard any signups
- [ ] Goal: 5+ orgs signed up, 2+ sending real webhook events
- [ ] Supersedes T-052 (consolidated)

---

### T-091: Origin Story Blog Post [-]

Superseded by T-109.

---

### T-092: Technical Deep-Dive Blog Post [-]

Superseded by T-110.

---

### T-093: Community Presence + Build-in-Public [-]

Superseded by T-107 + T-111.

---

### T-096: Research — LLM & SEO Discovery Optimization [x] [verified] [audited]

**Phase:** 11 (research-only)
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/llm-seo-discovery.md

**Description:** Research how LLMs decide which products to recommend and what EmitHQ needs to do to appear in recommendations. Research complete — implementation tickets T-105 and T-106 created.

**Acceptance criteria:**

- [x] Research: how do LLMs select products to recommend?
- [x] Research: what SEO signals matter for developer tool discovery in 2026?
- [x] Audit: LLM recommendations documented (Claude discussion saved at `/home/jfinnegan0/emithq-sdk-discussion.md`)
- [x] Audit: current web presence gaps identified (no JSON-LD, no AI bot differentiation, no directory listings)
- [x] Gap analysis: Svix/Hookdeck/Convoy discoverability advantages documented
- [x] Artifact: `docs/research/llm-seo-discovery.md`
- [x] Implementation tickets created: T-105, T-106

---

### Phase 11a: LLM & SEO Foundation (pre-outreach)

---

### T-105: Technical SEO & LLM Discovery Foundations [x] [verified] [audited]

**Phase:** 11a
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** docs/research/llm-seo-discovery.md

**Description:** Implement the technical foundation for LLM and search engine discoverability. These changes improve every future touchpoint — outreach links, organic search, and LLM recommendations. Must ship before cold outreach begins.

**Acceptance criteria:**

- [x] JSON-LD: Organization schema on homepage (name, URL, logo, legalName, sameAs: GitHub/npm)
- [x] JSON-LD: SoftwareApplication schema on homepage + pricing (applicationCategory, AggregateOffer with 4 tiers)
- [x] JSON-LD: FAQPage schema on pricing page (extract existing FAQ section)
- [x] robots.txt: differentiate AI bots — allow retrieval (ChatGPT-User, PerplexityBot, Claude-SearchBot), block training (GPTBot, ClaudeBot, Google-Extended, CCBot)
- [x] `/llms.txt` (plural, spec-compliant) — copy/redirect from existing `/llm.txt`
- [x] `/llms-full.txt` — complete docs content in one Markdown file (product overview, API reference, SDK guide, pricing, error codes, retry strategy)
- [x] Canonical URLs: add `metadataBase` to root layout, `alternates.canonical` per page
- [x] Google Search Console: DNS TXT verification via Cloudflare API, sitemap submitted (13 URLs, 0 errors)

---

### T-106: Third-Party Directory Listings [x]

**Phase:** 11a
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/llm-seo-discovery.md

**Description:** Create EmitHQ profiles on platforms that LLMs heavily weight when making product recommendations. Consistent messaging across all: "Open-source webhook infrastructure for SaaS teams. $49/mo — not $490." Some listings require Julian's manual verification (account ownership, email confirmation).

**Acceptance criteria:**

- [ ] AlternativeTo: listed as alternative to Svix, Hookdeck, Convoy — cheat sheet at docs/outreach/directory-listings.md (bot-blocked, needs manual)
- [ ] G2: free profile created — cheat sheet ready (needs manual)
- [ ] Crunchbase: basic company profile — cheat sheet ready (needs manual)
- [x] SaaSHub: submitted, pending approval (categories: API, Webhooks, Developer Tools; competitors: Svix, Hookdeck, Convoy)
- [ ] StackShare: tool profile — cheat sheet ready (needs manual)
- [x] awesome-selfhosted: PR #2200 submitted (same tag as Svix: Software Development - API Management)
- [ ] Capterra: vendor signup — cheat sheet ready (needs manual)
- [ ] Julian manually claims/verifies any profiles requiring email confirmation

---

### Phase 11b: Content + Social Foundation — 2026-03-22

_Research: docs/research/social-community-strategy.md. Postiz (self-hosted) provides API-based posting to X/LinkedIn/Reddit. Blog posts support outreach touches #2 and #5. Social profiles must look active before cold outreach starts._

---

### T-107: Postiz Self-Hosted Setup + Social Account Creation [ ]

**Phase:** 11b-1
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** docs/research/social-community-strategy.md

**Description:** Deploy Postiz (open-source social scheduling tool) on miniPC via Docker Compose. Julian creates social accounts manually (bot protection blocks automated creation). Connect X, LinkedIn, Reddit via Postiz OAuth. Set up Postiz MCP server for Claude integration. Configure mention monitoring. Julian starts HN/Reddit karma building immediately — both platforms require 2+ weeks of organic comment history before any self-promotion.

**Acceptance criteria:**

- [x] Julian creates accounts: Twitter/X (@EmitHQ), LinkedIn company page, Reddit, Dev.to, HN — checklist at docs/outreach/social-setup-checklist.md — all created 2026-03-25
- [x] Julian creates X developer app (free tier — ~500 posts/mo) — done 2026-03-24
- [~] Julian creates LinkedIn Community Management API app — app created 2026-03-25, Community Management API approval pending (submitted form)
- [x] Postiz Docker Compose deployed on miniPC (9 containers, ports 4007/7233/8080/8969)
- [~] X, LinkedIn, Reddit connected to Postiz via OAuth — X connected; LinkedIn waiting on API approval; Reddit waiting on API pre-approval (submitted 2026-03-25, ~7 day turnaround)
- [x] Postiz MCP server available at http://localhost:4007/api/mcp (configure after Julian creates Postiz account + API key)
- [x] Postiz secrets migrated to 1Password `.env.tpl` + `op inject` flow (DEC-038 session)
- [x] Dev.to API key generated and stored in 1Password EmitHQ vault — done 2026-03-25
- [x] F5Bot configured: "emithq", "webhook platform", "svix alternative", "hookdeck alternative", "webhook service" — done 2026-03-25
- [x] Talkwalker Alerts configured for "emithq", "svix alternative", "hookdeck alternative" — done 2026-03-25
- [x] HN karma building automated — cron at `scripts/hn-karma.sh` posts 0-2 comments/day via `claude -p` + content skill. Manual comments also encouraged. Started 2026-03-25
- [x] Update port registry in `~/.claude/CLAUDE.md` with Postiz ports
- [x] Supersedes T-044

---

### T-108: Blog Infrastructure on Landing Site [x] [verified]

**Phase:** 11b-1
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Research:** docs/research/social-community-strategy.md

**Description:** Add /blog route to Next.js landing site with MDX or markdown rendering. Blog listing page, individual post layout, article JSON-LD, OG meta, and RSS feed. This is the prerequisite for all blog content — T-091/T-092 were missing this infrastructure.

**Acceptance criteria:**

- [x] `/blog` listing page with post cards (title, date, excerpt)
- [x] `/blog/[slug]` dynamic route rendering MDX or markdown content
- [x] Blog post layout: title, date, reading time, content, author
- [x] Article JSON-LD schema per post (headline, datePublished, author, publisher)
- [x] OG meta tags per post (title, description, image)
- [x] RSS feed at `/feed.xml` (static route handler, `force-static`)
- [x] At least one placeholder post to verify rendering
- [x] SEO: canonical URLs follow existing `metadataBase` pattern from T-105

---

### T-109: Origin Story Blog Post + Distribution [x] [verified]

**Phase:** 11b-2
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-108, T-107
**Research:** docs/research/social-community-strategy.md, docs/research/content-distribution-strategy.md

**Description:** Write "Why We Built EmitHQ: The $49-$490 Webhook Pricing Gap." Publish on emithq.com/blog. Cross-post to Dev.to via API with canonical URL. Distribute excerpts to Twitter/X and LinkedIn via Postiz. Supports outreach touch #5 (resource share). Supersedes T-091.

**Acceptance criteria:**

- [x] Blog post written: origin story, pricing gap discovery, what EmitHQ does differently
- [x] Published on emithq.com/blog/why-we-built-emithq
- [ ] Cross-posted to Dev.to via API with canonical URL pointing to emithq.com (deferred to T-107)
- [ ] 3-5 excerpt posts scheduled on Twitter/X via Postiz (deferred to T-107/T-111)
- [ ] 1 LinkedIn post via Postiz (deferred to T-107/T-111)
- [x] SEO meta tags targeting "webhook service" and "webhook platform"
- [x] Supersedes T-091

---

### T-110: Technical Deep-Dive Blog Post + Distribution [x] [verified]

**Phase:** 11b-2
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-108, T-107
**Research:** docs/research/social-community-strategy.md, docs/research/content-distribution-strategy.md

**Description:** Write "Webhook Delivery Architecture: How We Achieve 99.99% Reliability." Publish on emithq.com/blog. Cross-post to Dev.to. Distribute via Postiz. Supports outreach touch #2 (architecture story) and Show HN supporting content. Supersedes T-092.

**Acceptance criteria:**

- [x] Blog post written: architecture overview, delivery flow, retry strategy, signing, circuit breaker
- [x] Published on emithq.com/blog/webhook-delivery-architecture
- [x] Includes architecture diagram (text-based)
- [x] Code snippets showing signing implementation and retry logic
- [ ] Cross-posted to Dev.to via API with canonical URL (deferred to T-107)
- [ ] 3-5 excerpt posts scheduled on Twitter/X via Postiz (deferred to T-107/T-111)
- [ ] 1 LinkedIn post via Postiz (deferred to T-107/T-111)
- [x] SEO meta tags targeting "webhook delivery reliability" and "webhook retry logic"
- [x] Supersedes T-092

---

### T-111: Social Content Seeding + Automation [ ]

**Phase:** 11b-3
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-107, T-109
**Research:** docs/research/social-community-strategy.md

**Description:** Seed all social profiles with initial content so they look active when cold outreach recipients Google "EmitHQ." Set up recurring content cadence that Claude maintains via Postiz MCP. Supersedes T-093.

**Acceptance criteria:**

- [ ] Twitter/X has 5+ posts (technical insights, architecture decisions — not promotional)
- [ ] LinkedIn company page has description, logo, website link, and 2+ posts
- [ ] Reddit: 1 post to r/selfhosted ("I built an open-source webhook platform") — only if Julian has 2+ weeks of comment history
- [ ] Dev.to has 2 cross-posted articles (from T-109, T-110)
- [ ] Content calendar template in `docs/outreach/content-calendar.md` (what to post, where, weekly cadence)
- [ ] Cron script or addition to T-090 crons: weekly social content drafting via Claude, scheduled via Postiz
- [ ] Supersedes T-093

---

### Phase 11c: Cold Outreach (after social foundation)

_T-090 starts after T-107 (social accounts exist) + T-109 (first blog post live). Blog posts support outreach touches #2 and #5._

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

**Description:** Execute Show HN + Product Hunt launches once real metrics and testimonials are collected. Stagger by 1-2 weeks (HN first for developer credibility, PH second for broader SaaS audience). Claude writes and posts, responds to comments, cross-posts to Dev.to. Supersedes T-034 + T-058.

**Acceptance criteria:**

- [ ] HN karma ≥50 before posting — automated cron building karma daily (`scripts/hn-karma.sh`, 0-2 comments/day on infra/devtools threads, started 2026-03-25)
- [ ] Show HN draft finalized with real metrics (no [PLACEHOLDER] slots)
- [ ] Readiness gate passed: 5+ real users, 1+ paying or committed, 1+ testimonial
- [ ] Show HN posted (Sunday 11:00-16:00 UTC)
- [ ] Every HN comment responded to within 30 minutes for first 6 hours
- [ ] Dev.to cross-post published day after
- [ ] Product Hunt launch 1-2 weeks after Show HN (different audience, different angle)
- [ ] Supersedes T-034 + T-058

---

## Codebase Health Refactoring — 2026-03-28

_Research: ~/.claude/tmp/research-emithq-codebase-audit.md. 6-agent audit found 4 critical issues, ~10 high-severity gaps, and structural debt. Phased to not block outreach (T-090). Anti-pattern KB coverage waived (all 5 domains — straightforward fixes, not novel design)._

### Phase 13a: Critical Fixes

---

### T-112: Security Hardening — Timing-Safe Comparisons, Headers, Leak Cleanup [x] [verified]

**Phase:** 13a
**Effort:** Low
**Complexity:** Moderate
**Depends on:** none
**Test strategy:** unit
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Fix 2 timing-unsafe secret comparisons (HIGH severity), add security headers to API and dashboard, clean up secret/stack leaks in error responses and logs. All changes are in the API and dashboard packages — no business logic changes.

**Acceptance criteria:**

- [ ] `admin.ts`: replace `provided !== secret` with `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))` (with length guard returning 401 on mismatch)
- [ ] `metrics.ts`: same timing-safe fix for `METRICS_SECRET` comparison
- [ ] `billing.ts` webhook error handler: remove `stack` field from 500 response — return only `{ error: 'Webhook processing failed' }`
- [ ] `billing.ts`: remove `console.error` that logs first 10 chars of webhook secret (lines 201–204)
- [ ] `signup.ts`: sanitize Clerk error logging — strip email from error object before `console.error`
- [ ] `packages/api/src/index.ts`: add Hono `secureHeaders()` middleware — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `packages/dashboard/next.config.ts`: add `headers()` function with security headers on `/(.*)` — use `X-Frame-Options: SAMEORIGIN` (not DENY) because Clerk's `<UserProfile>` renders in an iframe
- [ ] Existing tests pass; add 2 tests to `auth.test.ts` or new `admin.test.ts`: verify 401 on wrong admin secret, verify 200 on correct admin secret

---

### T-113: Test Integrity — Fix Message Tests, Add Circuit Breaker + Billing Coverage [x] [verified]

**Phase:** 13a
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Test strategy:** unit
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Fix the critical gap where `messages.test.ts` reimplements the handler instead of importing the real route, then add tests for the 3 highest-risk untested paths: circuit breaker auto-disable, DLQ exhaustion handling, and Stripe webhook event processing.

**Acceptance criteria:**

- [ ] `messages.test.ts`: refactor to import and mount `messagesRoutes` from `routes/messages.ts` using `createTestApp()` pattern (matching how `signup.test.ts`, `api-keys.test.ts` test real handlers). All existing assertions preserved.
- [ ] `delivery-worker.test.ts`: add circuit breaker test — simulate 10 consecutive failures on one endpoint, verify `disabled` is set to `true` and `disabledReason` contains `'circuit_breaker'`
- [ ] `delivery-worker.test.ts`: add DLQ exhaustion test — verify `handleExhaustedDelivery` sets status to `'exhausted'` on the delivery attempt
- [ ] `billing.test.ts`: add tests for 4 Stripe webhook event types: `checkout.session.completed` (creates subscription), `customer.subscription.updated` (updates tier), `customer.subscription.deleted` (downgrades to free), `invoice.payment_failed` (sets status to `past_due`). Use mocked Stripe event payloads.
- [ ] All tests green: `npm test` passes with 0 failures

---

### Phase 13b: CI + Docs Alignment

---

### T-114: CI Hardening — Typecheck All Packages, Gate SDK Publish, Fix Coverage [x] [verified]

**Phase:** 13b
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Test strategy:** integration (CI pipeline)
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Close 3 CI blind spots: dashboard/landing are excluded from typecheck, SDK can publish without CI passing, and `@vitest/coverage-v8` is configured but not installed. Note: dashboard/landing have never been type-checked in CI — expect pre-existing type errors that need fixing before CI goes green.

**Acceptance criteria:**

- [ ] Add `typecheck:all` script to root `package.json` that runs `tsc --noEmit` on root config AND `tsc --noEmit -p packages/dashboard/tsconfig.json` AND `tsc --noEmit -p packages/landing/tsconfig.json`
- [ ] Update `.github/workflows/ci.yml` to use `npm run typecheck:all` instead of `npm run typecheck`
- [ ] `publish-sdk.yml`: add `needs: ci` dependency (or add a `ci-complete` job check) so SDK cannot publish when CI is red
- [ ] Install `@vitest/coverage-v8` as root devDependency: `npm install -D @vitest/coverage-v8`
- [ ] Remove stale `@types/ioredis` from root devDependencies (ioredis v5 ships own types)
- [ ] Clean knip config: remove unnecessary `.next/**` and `out/**` ignore patterns, remove `@playwright/test` from dashboard `ignoreDependencies`
- [ ] Fix any pre-existing type errors in dashboard/landing discovered by the new typecheck (may be non-trivial — these packages were never CI-checked)
- [ ] CI passes on a push to master with the updated workflow

---

### T-115: Architecture Documentation Alignment [x] [verified]

**Phase:** 13b
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-113
**Test strategy:** manual
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Update ARCHITECTURE.md to match what the code actually does. 3 claims are inaccurate: operational webhook on DLQ exhaustion (not implemented), quota increment "same transaction" (separate `adminDb` call), and API key verification via `timingSafeEqual` (middleware uses DB hash lookup). Also update SSRF description (uses full `validateEndpointUrl` at delivery, not `isObviouslyBlockedUrl`).

**Acceptance criteria:**

- [ ] ARCHITECTURE.md step 19: change "send operational webhook" to "mark status as exhausted in delivery_attempts table" — add note: "Operational webhook notification deferred (not yet implemented)"
- [ ] ARCHITECTURE.md step 8: change "atomically in same transaction" to "via separate adminDb UPDATE (organizations table has no RLS, requires admin pool). Not in the same PostgreSQL transaction as message persist."
- [ ] ARCHITECTURE.md Authentication section: change "verified with `crypto.timingSafeEqual`" to "looked up by SHA-256 hash via database equality (`WHERE keyHash = ?`). `verifyApiKey()` with `timingSafeEqual` exists in core but is not used in the production auth middleware path."
- [ ] ARCHITECTURE.md step 12: update SSRF description to say `validateEndpointUrl` (async, DNS-resolving) is used at both endpoint creation AND delivery time. Remove any reference to `isObviouslyBlockedUrl` at delivery.
- [ ] No code changes — documentation only

---

### Phase 13c: Dashboard Refactoring

---

### T-116: Dashboard Error Boundaries + Accessibility [x] [verified]

**Phase:** 13c
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** none
**Test strategy:** e2e
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Add Next.js error boundaries (`error.tsx`) to all dashboard route segments so crashes show recovery UI instead of the default error screen. Fix critical accessibility gaps: make interactive elements keyboard-focusable, add ARIA attributes to modal and forms, add `aria-label` to icon-only buttons.

**Acceptance criteria:**

- [ ] `error.tsx` added to: `app/dashboard/`, `app/dashboard/app/[appId]/`, `app/dashboard/settings/`. Each shows error message + "Try again" button that calls `reset()`
- [ ] `app/dashboard/app/[appId]/page.tsx` (server component): wrap `apiGet()` failure gracefully (already partially done — verify)
- [ ] `DlqPage`: add `setError(null)` at start of `fetchDlq` to clear stale errors on refetch
- [ ] `modal.tsx`: add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing the modal title element. Close button: add `aria-label="Close"`
- [ ] App cards in `page.tsx`: change `<div onClick>` to `<button>` or add `tabIndex={0}`, `role="button"`, `onKeyDown` (Enter/Space triggers click)
- [ ] Event log rows in `events/page.tsx`: add `tabIndex={0}`, `role="row"`, `onKeyDown` handler
- [ ] All icon-only dismiss buttons (`×`): add `aria-label="Dismiss"` or `aria-label="Close"`
- [ ] All form `<label>` elements: add `htmlFor` matching input `id` attributes (settings, endpoints, app create form)
- [ ] `endpoints/page.tsx` `handleTest()`: add `if (!res.ok)` check before reading JSON — show error in test result panel on failure

**Gherkin scenarios:**

```gherkin
Scenario: Error boundary catches component crash and shows recovery UI
  Given the SaaS Developer is on the dashboard
  When a child component throws an uncaught runtime error
  Then the nearest error.tsx boundary renders with an error message and "Try again" button
  And the navigation shell remains visible

Scenario: Keyboard-only user can navigate app cards
  Given the SaaS Developer is on the Applications list
  When the user presses Tab to cycle through app cards
  Then each card receives visible focus
  When the user presses Enter on a focused card
  Then the application detail view opens

Scenario: Screen reader announces modal as dialog
  When a modal is opened
  Then the modal has role="dialog" and aria-modal="true"
  And the screen reader announces the modal role and title
```

---

### T-117: Settings + Endpoints Page Decomposition [x] [verified with notes]

**Phase:** 13c
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-116
**Test strategy:** e2e
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Split the 832-line settings page into separate tab files and decompose the 694-line endpoints page into focused components. Extract shared `ErrorBanner` component. This reduces cognitive overhead, enables independent testing, and eliminates duplicated UI patterns (error banners 5x, endpoint form 2x, tier upsell 2x).

**Acceptance criteria:**

- [ ] `settings/page.tsx` split: extract `ApiKeysTab` → `settings/tabs/api-keys-tab.tsx`, `BillingTab` → `settings/tabs/billing-tab.tsx`, `DangerZoneTab` → `settings/tabs/danger-zone-tab.tsx`. `SettingsTabBar`, `ProfileTab`, `SettingsContent`, `SettingsPage` stay in `page.tsx` (thin routing shell)
- [ ] `endpoints/page.tsx` decomposed: extract `EndpointCard` component (view + health metrics + actions), `EndpointForm` component (shared between create and edit — single form, two modes), `EndpointHealthMetrics` component (2×4 metrics grid)
- [ ] Shared `ErrorBanner` component extracted to `components/error-banner.tsx` — replaces 5+ inline error banner patterns. Props: `message: string`, `onDismiss: () => void`. Includes `role="alert"` for screen readers.
- [ ] Endpoint create and edit forms use the same `EndpointForm` component (dedup URL/description/eventFilter/transformRules fields)
- [ ] Tier upsell block extracted to shared component used by both create and edit modes in `EndpointForm`
- [ ] `settings/page.tsx` is under 150 lines after extraction
- [ ] `endpoints/page.tsx` is under 200 lines after extraction (state + orchestration only)
- [ ] All existing functionality preserved — E2E browser journey passes without changes

**Gherkin scenarios:**

```gherkin
Scenario: Settings tabs work after split
  Given the SaaS Developer navigates to Settings
  When clicking each tab (API Keys, Billing, Profile, Danger Zone)
  Then each tab content renders independently without errors

Scenario: Endpoint CRUD works after decomposition
  Given the SaaS Developer is on the Endpoints page
  When creating, editing, and deleting endpoints
  Then all operations complete successfully via the decomposed components

Scenario: Endpoint test failure shows error in correct card
  Given multiple endpoints are visible
  When a test delivery fails on the second endpoint
  Then the ErrorBanner renders inside only that EndpointCard
```

---

### Phase 13d: Structural Cleanup

---

### T-118: Code DRY + Type Safety — Extract Shared Utils, Fix AuthEnv Types [ ]

**Phase:** 13d
**Effort:** Low
**Complexity:** Moderate
**Depends on:** T-117
**Test strategy:** unit
**Research:** ~/.claude/tmp/research-emithq-codebase-audit.md

**Description:** Extract duplicated utilities and fix the root cause of the `typedTx` cast pattern. Also extract shared tier feature flags to eliminate dashboard/landing duplication while keeping UI copy in each consumer (core exports data, not presentation).

**Acceptance criteria:**

- [ ] Extract `resolveApp(tx, appId)` to `packages/api/src/lib/resolve-app.ts` — remove duplicate definitions from `endpoints.ts` and `dashboard.ts`, import from shared location
- [ ] Extract `UUID_RE` to `packages/api/src/lib/constants.ts` — remove 4 duplicate definitions from `applications.ts`, `endpoints.ts`, `messages.ts`, and import from shared location. (Keep the copy in `packages/core/src/db/tenant.ts` since core shouldn't depend on api.)
- [ ] Fix `AuthEnv` in `packages/api/src/types.ts`: type `tx` as the Drizzle transaction type (not `unknown`). This eliminates the need for `const typedTx = tx as typeof import('@emithq/core').db` cast pattern. Remove all 14+ `typedTx` casts across route files.
- [ ] Add `TIER_FEATURES` map to `packages/core/src/billing/tiers.ts` — boolean feature flags per tier (e.g., `{ transforms: boolean, prioritySupport: boolean }`). Export from core barrel. Dashboard and landing import feature flags and compose their own UI copy around them. Do NOT put UI description strings in core — core exports data, each consumer owns presentation.
- [ ] `@emithq/core` barrel: replace `export * from './db/schema'` with explicit named exports for tables/types actually consumed by api routes
- [ ] All tests pass, knip clean, no new lint errors

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
- [-] T-044: Automated Social Media — superseded by T-107 (Postiz)
- [-] T-046: Cold Outreach Campaign — merged into T-088+T-090
- [-] T-052: Cold Outreach First 10 — merged into T-090
- [-] T-053: Pricing Validation Interviews — after 5+ users
- [-] T-055: Origin Story Blog — superseded by T-109
- [-] T-056: Technical Deep-Dive — superseded by T-110
- [-] T-057: Build-in-Public — superseded by T-107 + T-111
- [-] T-065: Payment-Gated Abuse Prevention — zero users to abuse
- [-] T-066: API Key Scoping — nice-to-have post-launch
- [-] T-067: EmitHQ MCP Server — build after users request it
- [-] T-069: Frontend-Backend Integration Hardening — infrastructure
- [-] T-084: Vercel Migration — after first 5-10 customers
- [-] T-058: Show HN Readiness Gate — superseded by T-095 readiness gate
