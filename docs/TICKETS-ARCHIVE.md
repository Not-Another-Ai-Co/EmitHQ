# Archived Tickets

Completed and audited tickets moved here to keep TICKETS.md lean.

---

## Phase 0: Business Foundation Research

_Before writing any code, understand every dimension of the business._

### T-001: Competitive Deep-Dive [x]

### T-002: Customer Discovery [x]

### T-003: Pricing Model Validation [x]

### T-004: Legal & Business Structure Research [x]

### T-005: Open-Source Strategy Research [x]

### T-006: Content & Distribution Strategy [x]

### T-007: Metrics, Analytics & Feedback Loop Design [x]

### T-008: Technical Architecture Decision [x]

_All Phase 0 research artifacts in `docs/research/`. Decisions: DEC-001 through DEC-006._

---

## Phase 1: Brand & Project Scaffolding (completed tickets)

### T-009: Brand Identity & Naming [x]

### T-010: Project Scaffolding & Repository Setup [x]

_Brand research: `docs/research/brand-identity.md`. Decision: DEC-007._

---

## Phase 1: Foundation (completed tickets)

### T-011: Billing & Payment Infrastructure [x] [verified with notes] [audited]

### T-012: Auth & Multi-Tenant Foundation [x] [verified] [audited]

_Stripe integration, Clerk auth, RLS multi-tenancy. Decisions: DEC-008 through DEC-019._

---

## Phase 2: Core Product (completed tickets)

### T-013: Event Ingestion API [x] [verified with notes] [audited]

### T-014: Webhook Delivery Engine [x] [verified] [audited]

### T-015: Retry Logic & Dead-Letter Queue [x] [verified] [audited]

### T-016: Endpoint Management API [x] [verified] [audited]

_Core delivery engine with retries, DLQ, circuit breaker, fan-out. 252 tests._

---

## Phase 3: Dashboard & DX (completed tickets)

### T-017: Dashboard — Event Log & Monitoring [x] [verified with notes] [audited]

### T-018: Payload Transformation Engine [x] [verified] [audited]

### T-019: TypeScript SDK [x] [verified] [audited]

_Dashboard (Next.js 15), no-code transformations, @emithq/sdk published to npm._

---

## Phase 4: Launch Preparation (completed tickets)

### T-020: Landing Page & Documentation Site [x] [verified] [audited]

### T-021: Legal Documents [x] [verified] [audited]

### T-022: Monitoring, Alerting & SLO Setup [x] [verified with notes] [audited]

### T-023: Show HN Launch & Content [x] [verified] [audited]

_Landing page, legal docs, monitoring/SLOs, launch content. Decisions: DEC-020._

---

## Phase 5: Post-Launch Feedback (completed tickets)

### T-024: Analytics & Feedback Loop Implementation [x] [verified with notes] [audited]

_Analytics events, business metrics, weekly report endpoint. NPS/churn surveys deferred (requires email service)._

---

## Phase 6: Quality & Infrastructure (completed tickets)

### T-026: Integration Test Infrastructure [x] [verified with notes] [audited]

_Test DB setup, mock-core helpers, billing/metrics tests rewritten with real routes._

---

## Phase 7: Deploy to Production (completed tickets)

### T-027: Fix Deployment Blockers & Deploy API to Railway [x] [verified with notes] [audited]

_Worker entry point, tsx production runtime (DEC-021), Drizzle migrations, npm scripts. Railway manual setup remaining._

### T-028: Deploy Dashboard & Landing Page [x] [audited]

### T-029: Production Domain & DNS Setup [x] [audited]

_Dashboard + landing on Vercel, API on Railway, DNS on Cloudflare. Decisions: DEC-024._

---

## Phase 8: Pre-Launch Warm-up (completed tickets)

### T-030: Marketplace Listings & Directory Submissions [x] [audited]

### T-031: BOFU Comparison Content [x] [audited]

### T-032: Pricing Page Optimization [x] [audited]

### T-033: Show HN Post Revision & Launch Prep [x] [verified] [audited]

### T-040: Clerk Production Keys & Plausible Analytics [x] [audited]

### T-041: Analytics Setup (Umami Self-Hosted) [x] [verified] [audited]

### T-045: Production Smoke Test & Bug Hunt [x] [verified] [audited]

_Comparison pages, pricing optimization, Show HN prep, Clerk production keys, Umami analytics (DEC-025, DEC-026), smoke test (17 bugs found/fixed, DEC-022-024). 258 tests._

---

## Phase 8a: Dashboard Self-Service (completed tickets)

### T-047: App Switcher & Application Management [x] [verified] [audited]

### T-048: Endpoint Management UI (Full CRUD) [x] [verified] [audited]

### T-049: API Key Management UI [x] [verified] [audited]

_Dashboard self-service: app switcher via URL params, endpoint CRUD with signing secret modal, API key management with one-time display. Reusable Modal component._

---

## Phase 10: Post-Launch Infrastructure (completed tickets)

### T-059: Code Efficiency Tooling (Knip + jscpd) [x] [verified] [audited]

_Knip dead code detection + jscpd duplication checking. Pruned 12 dead barrel exports from @emithq/core. Both tools blocking in CI. Research: `docs/research/code-efficiency-tooling.md`._
