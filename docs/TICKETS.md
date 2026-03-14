# Tickets — Webhook Infrastructure SaaS

## Webhook SaaS Business Build — 2026-03-13

### Phase 0: Business Foundation Research
*Before writing any code, understand every dimension of the business. Each ticket produces a research artifact that feeds subsequent decisions.*

---

### T-001: Competitive Deep-Dive — Svix, Hookdeck, Convoy, Outpost [x]
**Phase:** 0
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Deep-dive into every direct competitor. Map their exact features, pricing tiers, API surface, documentation quality, open-source strategy, funding status, team size, and customer reviews. Identify precisely where each is strong and weak. Produce a competitive matrix and positioning map.

**Acceptance criteria:**
- [x] Feature matrix covering: delivery guarantees, retry policies, fan-out, transformations, SDKs, dashboard, multi-tenancy, self-hosted option
- [x] Pricing breakdown with exact tier limits (events, endpoints, retention, support)
- [x] G2/Capterra/HN sentiment summary per competitor (what customers love, what they complain about)
- [x] Funding/team size/revenue estimates where public
- [x] Clear positioning gaps identified — where no competitor serves well
- [x] Artifact: `docs/research/competitive-landscape.md`

---

### T-002: Customer Discovery — Who Buys Webhook Infrastructure and Why [x]
**Phase:** 0
**Effort:** Medium
**Complexity:** Simple
**Depends on:** none
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Research who the actual buyers are. Map buyer personas, their pain points, buying triggers, and decision criteria. Analyze public case studies, forum posts, job listings mentioning webhooks, and GitHub issues to understand what drives purchase decisions. Determine whether the buyer is the individual developer, the engineering lead, or the platform team.

**Acceptance criteria:**
- [x] 3-5 buyer personas with role, company stage, pain point, buying trigger
- [x] Analysis of webhook-related job postings (what companies are hiring for this)
- [x] Forum/HN/Reddit thread analysis — what triggers someone to search for a webhook platform
- [x] Purchase decision criteria ranked (reliability > price > features > DX > support)
- [x] Identification of "hair on fire" use cases — when is this urgent, not just nice-to-have
- [x] Artifact: `docs/research/customer-discovery.md`

---

### T-003: Pricing Model Validation [x]
**Phase:** 0
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-001, T-002
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Design the pricing model based on competitive data and customer personas. Determine the pricing metric (events, endpoints, API calls, or hybrid), tier structure, free tier limits, and expansion triggers. Model unit economics: what does it cost us to deliver 1M webhook events? What margins do we need? Apply Van Westendorp and value-based pricing frameworks from the knowledge base.

**Acceptance criteria:**
- [x] Pricing metric selected with rationale (events vs endpoints vs hybrid)
- [x] 3-4 tier structure with specific limits and prices
- [x] Free tier design — generous enough to drive adoption, constrained enough to convert
- [x] Unit economics model: infrastructure cost per 1M events at each provider (Cloudflare, Railway, AWS)
- [x] Margin analysis at each tier (target: 80%+ gross margin)
- [x] Comparison against competitor pricing showing clear differentiation
- [x] Artifact: `docs/research/pricing-model.md`

---

### T-004: Legal & Business Structure Research [x]
**Phase:** 0
**Effort:** Low
**Complexity:** Simple
**Depends on:** none
**Research:** none

**Description:** Research the legal and business structure requirements for a SaaS business. Cover: entity type (LLC vs C-Corp), state of incorporation, data processing agreements (DPA), terms of service requirements for infrastructure middleware, privacy policy requirements, and liability considerations specific to webhook delivery (what happens when we lose someone's events?). Julian will handle actual filings.

**Acceptance criteria:**
- [x] Entity type recommendation with rationale (LLC vs C-Corp for SaaS)
- [x] State of incorporation recommendation (Delaware vs Nevada vs home state)
- [x] DPA template requirements for B2B SaaS handling customer data
- [x] ToS key clauses for infrastructure middleware (SLA language, liability caps, data handling)
- [x] Privacy policy requirements (GDPR, CCPA implications for webhook payload data)
- [x] Liability analysis — what's our exposure if webhooks are lost/delayed
- [x] List of accounts/registrations Julian needs to create manually
- [x] Artifact: `docs/research/legal-structure.md`

---

### T-005: Open-Source Strategy Research [x]
**Phase:** 0
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-001
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Research the open-source vs. closed-source decision deeply. Analyze how Svix (open-source), Hookdeck (closed), and Outpost (open-source) use licensing as strategy. Study the Plausible, PostHog, and Cal.com open-core models. Determine: what to open-source, what to keep proprietary, which license (MIT, AGPL, BSL, ELv2), and how to prevent self-hosting from cannibalizing revenue.

**Acceptance criteria:**
- [x] License comparison matrix: MIT vs AGPL vs BSL vs ELv2 with pros/cons for our case
- [x] Analysis of Svix's open-source strategy — what they open, what they gate
- [x] Analysis of Plausible/PostHog open-core models — conversion rates from self-hosted to paid
- [x] Recommendation: what's open (core engine) vs. proprietary (dashboard, multi-tenant, analytics)
- [x] Self-hosting cannibalization mitigation strategy
- [x] Community contribution strategy — how to attract contributors without giving away the business
- [x] Artifact: `docs/research/open-source-strategy.md`

---

### T-006: Content & Distribution Strategy [x]
**Phase:** 0
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-002, T-005
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Design the full content and distribution strategy. Determine: what content to create (technical blog posts, comparison pages, tutorials, documentation), SEO keyword targets, HN/Reddit/Dev.to strategy, developer community platform (Discord vs Slack vs GitHub Discussions), and the Show HN launch plan. This is the primary growth engine — treat it as seriously as the product.

**Acceptance criteria:**
- [x] SEO keyword research — 20+ target keywords with search volume and difficulty
- [x] Content calendar for first 3 months (blog topics, comparison pages, tutorials)
- [x] Show HN launch plan — timing, post format, engagement strategy
- [x] Developer community platform decision with rationale
- [x] Social media strategy (Twitter/X, LinkedIn, Dev.to) — what to post, how often
- [x] Integration marketplace strategy (list on Vercel, Railway, etc.)
- [x] Artifact: `docs/research/content-distribution-strategy.md`

---

### T-007: Metrics, Analytics & Feedback Loop Design [x]
**Phase:** 0
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-003
**Research:** none

**Description:** Design the metrics framework and feedback loops that will drive all business and technical decisions post-launch. Define: which metrics to track (MRR, churn, ARPU, NPS, feature usage, reliability SLOs), how to collect them, how to review them, and what automated actions they trigger. This is the "nervous system" of the business — it's how we know what's working and what isn't.

**Acceptance criteria:**
- [x] Business metrics dashboard spec: MRR, ARR, churn rate, ARPU, LTV, CAC, NPS
- [x] Product metrics spec: events processed, delivery success rate, p99 latency, API error rates
- [x] User behavior tracking plan: which actions indicate engagement, expansion, churn risk
- [x] Feedback collection system: in-app surveys, NPS triggers, churn exit surveys
- [x] Weekly/monthly review cadence — what gets reviewed, what triggers action
- [x] Automated alerts: churn risk signals, reliability degradation, usage spikes
- [x] Tool selection for analytics (PostHog, Plausible, custom, Stripe metrics)
- [x] Artifact: `docs/research/metrics-feedback-loops.md`

---

### T-008: Technical Architecture Decision [x]
**Phase:** 0
**Effort:** High
**Complexity:** Complex
**Depends on:** T-001, T-003
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Make all major technical architecture decisions before writing code. This is NOT implementation — it's the technical blueprint. Cover: delivery pipeline architecture (how events flow from ingestion to delivery), retry strategy, dead-letter queue design, multi-tenancy model, data storage schema, edge vs. origin split, SDK design, and API surface. Compare against how Svix and Hookdeck architect their systems (from docs, blog posts, open-source code).

**Acceptance criteria:**
- [x] Event flow diagram: ingestion → queuing → delivery → retry → dead-letter
- [x] Multi-tenancy model decision (shared DB with tenant isolation vs. schema-per-tenant)
- [x] Data storage schema draft (events, endpoints, delivery attempts, tenants)
- [x] Edge vs. origin decision — what runs on Cloudflare Workers vs. origin server
- [x] Retry strategy design (exponential backoff, jitter, configurable per-endpoint)
- [x] API surface design (REST endpoints, auth model, rate limiting)
- [x] SDK strategy — which languages first, generation approach (OpenAPI → SDK)
- [x] Infrastructure cost model at 10K, 100K, 1M, 10M events/day
- [x] Artifact: `docs/research/technical-architecture.md`

---

### Phase 1: Brand & Project Scaffolding
*Set up the project, brand, and infrastructure before building product features.*

---

### T-009: Brand Identity & Naming [x]
**Phase:** 1
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-002, T-006
**Research:** docs/research/content-distribution-strategy.md

**Description:** Research and recommend a product name, domain, and visual identity. Check domain availability, GitHub org availability, npm package name availability. Design the brand positioning statement and tagline. Julian will register the domain and accounts.

**Acceptance criteria:**
- [x] 5-7 name candidates with domain availability checked (via web search)
- [x] GitHub org and npm package name availability for top candidates
- [x] Brand positioning statement (one sentence: what we do, for whom, why us)
- [x] Tagline options (3-5, focused on the pricing gap or reliability angle)
- [x] Color palette and typography recommendation (developer-tool aesthetic)
- [x] Logo concept direction (to be refined later)
- [x] Julian action items: register domain, create GitHub org, create npm org
- [x] Artifact: `docs/research/brand-identity.md`

---

### T-010: Project Scaffolding & Repository Setup [x]
**Phase:** 1
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-008, T-009
**Research:** docs/research/technical-architecture.md

**Description:** Initialize the monorepo, configure tooling, set up CI/CD, create the project CLAUDE.md and docs structure. This is the foundation everything builds on — do it right. Include: TypeScript config, ESLint, Prettier, test framework, Docker Compose for local dev, GitHub Actions, and the open-source license file.

**Acceptance criteria:**
- [x] Monorepo structure created (packages: core, api, dashboard, docs, sdk)
- [x] TypeScript strict mode configured across all packages
- [x] ESLint + Prettier configured with shared config
- [x] Vitest (or chosen test framework) configured
- [x] Docker Compose for local PostgreSQL + Redis
- [x] GitHub Actions: lint, test, build on PR
- [x] Project CLAUDE.md with architecture, conventions, and scaffolding system integration
- [x] docs/ structure: ARCHITECTURE.md, CONVENTIONS.md, DECISIONS.md, TICKETS.md, MAINTENANCE.md
- [x] LICENSE file (per T-005 decision)
- [x] .env.tpl with op:// references for secrets
- [x] README.md with project overview and setup instructions

---

### T-011: Billing & Payment Infrastructure
**Phase:** 1
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-003, T-010
**Research:** docs/research/pricing-model.md

**Description:** Implement Stripe integration with the pricing tiers defined in T-003. Include: subscription management, usage metering (event counts), billing portal, webhook handling for Stripe events (yes — we use webhooks to build a webhook product), and the free tier with automatic upgrade prompts.

**Acceptance criteria:**
- [ ] Stripe products and prices created matching tier structure
- [ ] Subscription lifecycle: create, upgrade, downgrade, cancel
- [ ] Usage metering: event count tracking reported to Stripe
- [ ] Customer billing portal (Stripe hosted)
- [ ] Free tier enforcement with usage limits
- [ ] Upgrade prompts when approaching tier limits
- [ ] Stripe webhook handler for payment events (invoice.paid, subscription.updated, etc.)
- [ ] Tests covering subscription state transitions

---

### T-012: Auth & Multi-Tenant Foundation [x] [verified]
**Phase:** 1
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-008, T-010
**Research:** docs/research/technical-architecture.md

**Description:** Implement authentication (Clerk or chosen provider) and multi-tenant data isolation. Every query must be scoped to tenant. Include: user signup/login, organization/workspace creation, API key generation for programmatic access, and tenant-scoped database queries.

**Acceptance criteria:**
- [x] Auth provider integrated (signup, login, logout, password reset)
- [x] Organization/workspace model with tenant isolation
- [x] API key generation and management (create, revoke, rotate)
- [x] All database queries scoped by tenant_id — no cross-tenant data leakage
- [x] Role model (owner, admin, member) with permission checks
- [x] Tests covering: signup flow, API key auth, tenant isolation, permission boundaries

---

### Phase 2: Core Product
*Build the webhook delivery engine — the core value proposition.*

---

### T-013: Event Ingestion API [x] [verified with notes]
**Phase:** 2
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-012
**Research:** docs/research/technical-architecture.md

**Description:** Build the event ingestion endpoint — the API that customers call to send webhooks through our system. Include: event validation, schema enforcement, rate limiting, and queueing for async delivery.

**Acceptance criteria:**
- [x] POST /api/v1/app/:appId/msg endpoint accepting event payloads
- [x] Event validation (required fields, payload size limits, content-type)
- [x] Idempotency key support (prevent duplicate deliveries)
- [x] Rate limiting per tenant (based on tier)
- [x] Events queued for async delivery (BullMQ on Upstash Redis)
- [x] Event stored in database with status tracking
- [x] API response includes event ID for tracking
- [x] Tests: valid event, invalid payload, rate limit hit, idempotency, large payload rejection

---

### T-014: Webhook Delivery Engine [x] [verified]
**Phase:** 2
**Effort:** High
**Complexity:** Complex
**Depends on:** T-013
**Research:** docs/research/technical-architecture.md

**Description:** Build the core delivery engine — the system that takes queued events and delivers them to customer-configured endpoints. This is the heart of the product. Include: HTTP delivery with configurable timeouts, signature verification (HMAC), delivery attempt logging, and success/failure tracking.

**Acceptance criteria:**
- [x] Worker processes queued events and delivers via HTTP POST
- [x] HMAC signature generation (SHA-256) on every delivery
- [x] Configurable timeout per endpoint (default 30s)
- [x] Delivery attempt logged with: status code, response time, response body (truncated), headers
- [x] Success criteria: 2xx response = delivered, anything else = failed
- [x] Event status updated: pending → delivered / failed (DEVIATION: skip transient "delivering" state until dashboard T-017)
- [x] Concurrent delivery to multiple endpoints (fan-out via BullMQ concurrency=5)
- [x] Tests: successful delivery, timeout, 5xx response, signature verification, fan-out

---

### T-015: Retry Logic & Dead-Letter Queue [x] [verified]
**Phase:** 2
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-014
**Research:** docs/research/technical-architecture.md

**Description:** Implement retry logic for failed deliveries and dead-letter queue for events that exhaust all retries. Include: configurable retry schedule (exponential backoff with jitter), max retry count, and dead-letter queue with manual replay.

**Acceptance criteria:**
- [x] Exponential backoff with jitter (configurable schedule, default: 5s, 30s, 2m, 15m, 1h, 4h, 24h)
- [x] Max retry count configurable per endpoint (default: 7 retries = 8 total attempts)
- [x] Dead-letter queue for exhausted events (BullMQ failed set + status='exhausted')
- [x] Manual replay from dead-letter queue (single event or bulk via API)
- [x] Endpoint auto-disable after N consecutive failures (threshold=10, from T-014)
- [x] Recovery: auto-re-enable endpoint via reEnableEndpoint()
- [x] Tests: retry scheduling, backoff timing, dead-letter transition, endpoint disable/recovery

---

### T-016: Endpoint Management API [x] [verified]
**Phase:** 2
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-012
**Research:** docs/research/technical-architecture.md

**Description:** CRUD API for managing webhook endpoints. Customers configure where their events get delivered.

**Acceptance criteria:**
- [x] CRUD endpoints: create, read, update, delete webhook endpoints
- [x] Endpoint properties: URL, secret (for signature verification), enabled/disabled, event type filter, description
- [x] URL validation (HTTPS required for production, HTTP allowed for development)
- [x] Test delivery endpoint — send a test event to verify connectivity
- [x] List endpoints with cursor-based pagination
- [x] Tests: CRUD operations, URL validation, test delivery

---

### Phase 3: Dashboard & DX

---

### T-017: Dashboard — Event Log & Monitoring [x]
**Phase:** 3
**Effort:** High
**Complexity:** Complex
**Depends on:** T-014, T-015
**Research:** docs/research/technical-architecture.md

**Description:** Build the web dashboard for monitoring webhook deliveries. Include: event log with filtering/search, delivery attempt details, endpoint health overview, and real-time delivery status.

**Acceptance criteria:**
- [x] Event log view: filterable by status, endpoint, event type, date range (GET /:appId/msg with query filters + events page with filter input)
- [x] Event detail view: payload, delivery attempts with status/timing, retry schedule (GET /:appId/msg/:msgId with joined attempts + detail panel)
- [x] Endpoint health view: success rate, average latency, failure count, last delivery (GET /:appId/endpoint-health with aggregates + endpoint cards)
- [x] Dashboard overview: events today, success rate, active endpoints, pending retries (GET /:appId/stats + overview page with stat cards)
- [x] Dead-letter queue view with replay actions (GET /:appId/dlq + DLQ page with replay buttons)
- [x] Responsive design (works on mobile for on-call debugging) (sidebar + mobile bottom nav, responsive grid, hidden columns on mobile)
- [x] Tests: data loading, filtering, pagination, replay action (11 API contract tests for dashboard endpoints)

---

### T-018: Payload Transformation Engine [x] [verified]
**Phase:** 3
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-014
**Research:** docs/research/middleware-saas-opportunity.md

**Description:** Build the no-code payload transformation layer — one of the key differentiators identified in research. Allow customers to reshape webhook payloads before delivery using JSONPath or template expressions, without writing code.

**Acceptance criteria:**
- [x] Transformation rule model: source field → target field mapping (TransformRule interface with sourcePath, targetField, template)
- [x] JSONPath-based field extraction (dot-notation subset: $.key, $.arr[0], $.obj['key'])
- [x] Template expressions for computed fields ({{...}} interpolation, formatDate, uppercase, lowercase, concat)
- [x] Transformation preview (POST /api/v1/transform/preview — stateless before/after)
- [x] Transformation applied per-endpoint (transformRules JSONB column on endpoints table, applied in delivery worker)
- [x] Passthrough mode (no transformation) as default (null/empty rules = passthrough)
- [x] Tests: field mapping, JSONPath extraction, template expressions, preview accuracy, validation, security (prototype pollution blocked)

---

### T-019: TypeScript SDK [x] [verified]
**Phase:** 3
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-013, T-016
**Research:** docs/research/technical-architecture.md

**Description:** Build the first-party TypeScript/JavaScript SDK. This is the primary developer experience — it must be excellent. Include: typed client, event sending, endpoint management, and comprehensive documentation with examples.

**Acceptance criteria:**
- [x] npm package with TypeScript types
- [x] Client initialization with API key
- [x] Methods: sendEvent(), createEndpoint(), listEndpoints(), getEndpoint(), updateEndpoint(), deleteEndpoint(), testEndpoint(), replayEvent(), replayAttempt()
- [x] Error handling with typed errors (RateLimitError, ValidationError, AuthError)
- [x] Automatic retry on transient failures (5xx, network errors)
- [x] README with quickstart example
- [ ] Published to npm (Julian to create npm account if needed)
- [x] Tests: all methods, error scenarios, retry behavior
- [x] verifyWebhook() for consumers to verify incoming webhook signatures (WebCrypto API)

---

### Phase 4: Launch Preparation

---

### T-020: Landing Page & Documentation Site
**Phase:** 4
**Effort:** High
**Complexity:** Moderate
**Depends on:** T-009, T-019
**Research:** docs/research/brand-identity.md, docs/research/content-distribution-strategy.md

**Description:** Build the marketing landing page and documentation site. The landing page sells; the docs convert. Include: hero section, feature breakdown, pricing table, comparison with competitors, and full API documentation generated from OpenAPI spec.

**Acceptance criteria:**
- [ ] Landing page: hero, problem statement, features, pricing table, CTA
- [ ] Pricing page with tier comparison and FAQ
- [ ] Competitor comparison page (vs Svix, vs Hookdeck, vs building your own)
- [ ] Documentation site: getting started, API reference, SDK guides, examples
- [ ] API reference auto-generated from OpenAPI spec
- [ ] SEO fundamentals: meta tags, structured data, sitemap, robots.txt
- [ ] Analytics integration (Plausible or PostHog)
- [ ] Mobile responsive

---

### T-021: Legal Documents
**Phase:** 4
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-004
**Research:** docs/research/legal-structure.md

**Description:** Generate Terms of Service, Privacy Policy, Data Processing Agreement, and SLA document based on the legal research in T-004. These must be real, enforceable documents — not AI-generated fluff. Julian to review with counsel if needed.

**Acceptance criteria:**
- [ ] Terms of Service covering: service description, acceptable use, liability caps, data handling
- [ ] Privacy Policy covering: what data we collect, how we process it, GDPR/CCPA compliance
- [ ] Data Processing Agreement template for enterprise customers
- [ ] SLA document with uptime commitment and credit policy
- [ ] All documents accessible from landing page footer
- [ ] Julian review gate: legal documents require human review before publishing

---

### T-022: Monitoring, Alerting & SLO Setup
**Phase:** 4
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-014
**Research:** docs/research/metrics-feedback-loops.md

**Description:** Implement production monitoring, alerting, and SLO tracking. We're selling reliability — we must be reliable. Include: uptime monitoring, delivery latency tracking, error rate alerting, and customer-facing status page.

**Acceptance criteria:**
- [ ] Uptime monitoring (external) — Better Stack or similar
- [ ] Delivery latency p50/p95/p99 tracking
- [ ] Error rate alerting (>1% delivery failure triggers alert)
- [ ] Queue depth monitoring (backlog alerts)
- [ ] Customer-facing status page (statuspage.io or custom)
- [ ] SLO dashboard: 99.9% delivery success rate, <500ms p95 delivery latency
- [ ] Incident response runbook (what to do when things break)
- [ ] Alerts route to Julian (email/SMS/Slack)

---

### T-023: Show HN Launch & Content
**Phase:** 4
**Effort:** Medium
**Complexity:** Simple
**Depends on:** T-020, T-006
**Research:** docs/research/content-distribution-strategy.md

**Description:** Prepare and execute the launch. Write the Show HN post, first 3 blog posts, README for the open-source repo, and social media announcements. The Show HN post is the single most important piece of content — study what worked for Plausible, Svix, and Outpost.

**Acceptance criteria:**
- [ ] Show HN post draft — technically substantive, honest about what it is and isn't
- [ ] 3 blog posts ready: (1) "Why we built this" origin story, (2) technical deep-dive on architecture, (3) comparison/positioning post
- [ ] Open-source repo README: compelling, clear, with quickstart in <5 minutes
- [ ] Twitter/X announcement thread
- [ ] Dev.to cross-post of blog post #1
- [ ] Launch day engagement plan (respond to every HN comment within 30 minutes)

---

### Phase 5: Post-Launch Feedback & Iteration

---

### T-024: Analytics & Feedback Loop Implementation
**Phase:** 5
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-007, T-022
**Research:** docs/research/metrics-feedback-loops.md

**Description:** Implement the metrics and feedback systems designed in T-007. Wire up product analytics, NPS collection, churn surveys, and the business metrics dashboard. This is how we steer the business after launch.

**Acceptance criteria:**
- [ ] Product analytics tracking: key user actions instrumented
- [ ] NPS survey triggered at day 7 and day 30
- [ ] Churn exit survey on cancellation
- [ ] Business metrics dashboard: MRR, churn, ARPU, active users
- [ ] Weekly automated report (email to Julian): key metrics, trends, alerts
- [ ] Feature request tracking system (public roadmap or simple backlog)

---

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
