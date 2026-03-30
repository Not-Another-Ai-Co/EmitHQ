# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-29
> Archived tickets: see [TICKETS-ARCHIVE.md](TICKETS-ARCHIVE.md)

Status markers: `[ ]` open | `[x]` complete | `[x] [verified] [audited]` passed quality gates | `[x] [verified] [audited] [audited]` docs audited | `[-]` skipped/deferred | `[~]` blocked

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

### T-111: Social Content Seeding + Automation [x]

**Phase:** 11b-3
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-107, T-109
**Research:** docs/research/social-community-strategy.md

**Description:** Seed all social profiles with initial content so they look active when cold outreach recipients Google "EmitHQ." Set up recurring content cadence that Claude maintains via Postiz MCP. Supersedes T-093.

**Acceptance criteria:**

- [x] Twitter/X has 5+ posts (technical insights, architecture decisions — not promotional) — 5 posts scheduled via Postiz UI (2026-03-30)
- [~] LinkedIn company page has description, logo, website link, and 2+ posts — blocked on LinkedIn Community Management API approval (submitted 2026-03-25)
- [~] Reddit: 1 post to r/selfhosted ("I built an open-source webhook platform") — blocked on Reddit API pre-approval (submitted 2026-03-25) + 2-week karma window (~2026-04-08)
- [x] Dev.to has 2 cross-posted articles (from T-109, T-110) — published 2026-03-29: https://dev.to/emithq/why-we-built-emithq-the-49-490-webhook-pricing-gap-npd + https://dev.to/emithq/webhook-delivery-architecture-how-we-built-for-reliability-5e50
- [x] Content calendar template in `docs/outreach/content-calendar.md` (what to post, where, weekly cadence)
- [x] Cron script: `scripts/social-content.sh` — weekly drafting via `claude -p`. Postiz API scheduling deferred until auth fixed (401 on all header formats, API key may need regeneration in Postiz UI)
- [x] Supersedes T-093

**DEVIATION FLAG:**

- **Ticket:** T-111
- **Expected:** Automated scheduling via Postiz MCP/REST API
- **Actual:** Posts scheduled via Postiz UI (Playwright). Postiz REST API auth requires `Authorization: <key>` (no "Bearer" prefix) — not `Authorization: Bearer <key>`. MCP URL embeds the key in the path (`/api/mcp/<key>`). API key in 1Password is correct. Weekly cron drafts to markdown file for now — needs API integration update to use correct auth header format.
- **Reason:** Postiz uses non-standard auth header format. Discovered via Playwright inspection of Settings → Developers page.
- **Action needed:** Update `scripts/social-content.sh` to use `Authorization: $KEY` (no Bearer) for Postiz API calls. Update Claude MCP server config to use `/api/mcp/<key>` URL format.

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

_Phases 13a–13c complete (T-112 through T-117 archived). See TICKETS-ARCHIVE.md._

### Phase 13d: Structural Cleanup

---

### T-118: Code DRY + Type Safety — Extract Shared Utils, Fix AuthEnv Types [x] [verified]

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
