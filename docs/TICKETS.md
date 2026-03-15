# Tickets — Webhook Infrastructure SaaS

> Last verified: 2026-03-13
> Archived tickets: see [TICKETS-ARCHIVE.md](TICKETS-ARCHIVE.md)

Status markers: `[ ]` open | `[x]` complete | `[x] [verified]` passed quality gates | `[x] [verified] [audited]` docs audited | `[-]` skipped/deferred | `[~]` blocked

## Webhook SaaS Business Build — 2026-03-13

### T-011: Billing & Payment Infrastructure [x]

**Phase:** 1
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-003, T-010
**Research:** docs/research/pricing-model.md

**Description:** Implement Stripe integration with the pricing tiers defined in T-003. Include: subscription management, usage metering (event counts), billing portal, webhook handling for Stripe events (yes — we use webhooks to build a webhook product), and the free tier with automatic upgrade prompts.

**Acceptance criteria:**

- [x] Stripe products and prices created matching tier structure
- [x] Subscription lifecycle: create, upgrade, downgrade, cancel
- [-] Usage metering: event count tracking reported to Stripe (DEFERRED: overage metering via Stripe Billing Meter deferred to post-launch; event_count_month tracked in DB)
- [x] Customer billing portal (Stripe hosted)
- [x] Free tier enforcement with usage limits
- [-] Upgrade prompts when approaching tier limits (DEFERRED: post-launch — requires dashboard billing UI)
- [x] Stripe webhook handler for payment events (invoice.paid, subscription.updated, etc.)
- [x] Tests covering subscription state transitions

---

### T-012: Auth & Multi-Tenant Foundation [x] [verified] [audited]

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

_Build the webhook delivery engine — the core value proposition._

---

### T-013: Event Ingestion API [x] [verified with notes] [audited]

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

### T-014: Webhook Delivery Engine [x] [verified] [audited]

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

### T-015: Retry Logic & Dead-Letter Queue [x] [verified] [audited]

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

### T-016: Endpoint Management API [x] [verified] [audited]

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

### T-017: Dashboard — Event Log & Monitoring [x] [verified with notes] [audited]

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

### T-018: Payload Transformation Engine [x] [verified] [audited]

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

### T-019: TypeScript SDK [x] [verified] [audited]

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

### T-020: Landing Page & Documentation Site [x] [verified] [audited]

**Phase:** 4
**Effort:** High
**Complexity:** Moderate
**Depends on:** T-009, T-019
**Research:** docs/research/brand-identity.md, docs/research/content-distribution-strategy.md

**Description:** Build the marketing landing page and documentation site. The landing page sells; the docs convert. Include: hero section, feature breakdown, pricing table, comparison with competitors, and full API documentation generated from OpenAPI spec.

**Acceptance criteria:**

- [x] Landing page: hero, problem statement, features, pricing table, CTA (packages/landing with hero, pricing gap narrative, 6 feature cards, tier preview, SDK snippet)
- [x] Pricing page with tier comparison and FAQ (4-tier table with annual pricing, 6 FAQ items)
- [x] Competitor comparison page (vs Svix, vs Hookdeck, vs Convoy, vs building your own)
- [x] Documentation site: getting started, API reference, SDK guides, examples (docs hub + getting started + API ref + SDK guide)
- [x] API reference from endpoint inventory (19 endpoints across 6 sections with request/response examples)
- [x] SEO fundamentals: meta tags, Open Graph, Twitter cards, sitemap.xml, robots.txt, keywords
- [x] Analytics integration (Plausible script tag — privacy-friendly, no cookie banner)
- [x] Mobile responsive (Tailwind responsive classes throughout, mobile nav)

---

### T-021: Legal Documents [x] [verified] [audited]

**Phase:** 4
**Effort:** Low
**Complexity:** Simple
**Depends on:** T-004
**Research:** docs/research/legal-structure.md

**Description:** Generate Terms of Service, Privacy Policy, Data Processing Agreement, and SLA document based on the legal research in T-004. These must be real, enforceable documents — not AI-generated fluff. Julian to review with counsel if needed.

**Acceptance criteria:**

- [x] Terms of Service covering: service description, acceptable use, liability caps, data handling (12 sections)
- [x] Privacy Policy covering: what data we collect, how we process it, GDPR/CCPA compliance (11 sections, 7 data categories, 7 subprocessors)
- [x] Data Processing Agreement template for enterprise customers (11 sections, GDPR Article 28 compliant)
- [x] SLA document with uptime commitment and credit policy (per-tier SLA: 99.9%/99.95%/99.99%, 10%/25% credits capped at 30%)
- [x] All documents accessible from landing page footer (Terms, Privacy, DPA, SLA links + sitemap)
- [x] Julian review gate: all pages display "Draft — requires legal review before publishing" banner

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

---

### Phase 6: Quality & Infrastructure

---

### T-026: Integration Test Infrastructure

**Phase:** 6
**Effort:** Medium
**Complexity:** Moderate
**Depends on:** T-012

**Description:** Replace contract-stub test pattern with real integration tests. Currently all route test files create inline Hono stubs instead of importing actual routes — tests verify stubs, not production code. Set up a test database and test the real middleware chain (auth → tenant → handler).

**Acceptance criteria:**

- [ ] Test database setup (Neon branch or local PG via Docker)
- [ ] Test helper: seed org, create API key, set up tenant context
- [ ] Route tests import real routes (billingRoutes, endpointRoutes, etc.) instead of inline stubs
- [ ] Middleware chain tested end-to-end (auth → tenantScope → handler)
- [ ] Stripe webhook signature verification tested with real constructEvent
- [ ] CI runs integration tests against test database
- [ ] Existing contract tests migrated or replaced for: billing, endpoints, messages, dashboard
