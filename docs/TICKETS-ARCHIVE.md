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
