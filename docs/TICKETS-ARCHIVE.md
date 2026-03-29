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

---

## Phase 8a: Dashboard Self-Service (completed tickets, batch 2)

### T-050: Billing & Usage Page [x] [verified with notes] [audited]

### T-051: Getting Started / Onboarding Flow [x] [verified with notes] [audited]

### T-061: Enable MFA in Clerk + Test Enrollment Flow [-] deferred (Clerk Pro feature)

_Billing page (tier card, usage bar, Stripe checkout/portal), onboarding checklist (4-step auto-detect), Clerk MFA (TOTP) with profile page. Decisions: DEC-025, DEC-026._

---

## LLM-Automatable Onboarding (completed tickets)

### T-062: Research — Fully LLM-Automatable Onboarding [x] [verified] [audited]

### T-063: API-Only Signup Endpoint + Quota Headers [x] [verified with notes] [audited]

### T-064: OpenAPI Spec + Machine-Readable Docs + llm.txt [x] [verified] [audited]

_API-only signup (`POST /api/v1/signup`), quota headers on all responses, enriched 429 with upgrade tiers, OpenAPI 3.1 spec, llm.txt, agents.json, CI drift check. Research: `docs/research/llm-automatable-onboarding.md`. Decisions: DEC-027._

---

## E2E Testing (completed tickets)

### T-060: Playwright E2E Setup + Happy-Path Journey Tests [x] [verified with notes] [audited] — tests written but deferred until T-068 dashboard restructure completes; will need updates to match new UI

_Playwright + @clerk/testing: browser journey (8-step flow), API-only journey (LLM-automatable), account management smoke tests. Webhook test fixture. Auth via storageState. Research: `docs/research/e2e-new-user-journey-testing.md`. CI deferred to T-038._

---

## Phase 8a: Dashboard UX Restructure (completed tickets)

### T-068: Research — Dashboard UX Restructure [x] [verified] [audited]

### T-070: Route Restructure + Sidebar Transform [x] [verified] [audited]

### T-071: App Listing as Landing Page [x] [verified] [audited]

### T-072: Inline Onboarding [x] [verified] [audited]

### T-073: Settings Consolidation [x] [verified] [audited]

### T-074: Soft Delete + Recovery [x] [verified] [audited]

### T-075: Stale App Cache Fix [x] [verified] [audited]

_Full dashboard UX restructure: path-based app routing (`/dashboard/app/[appId]/*`), two-state sidebar, app card grid landing with per-app stats, inline onboarding with server-side flag, consolidated settings tabs (API Keys/Billing/Profile/Danger Zone), soft-delete with 30-day recovery + auto-purge, shared React Context for app state. Research: `docs/research/dashboard-ux-restructure.md`. Decisions: DEC-028._

---

## Phase 8a: Show HN Blockers (completed tickets, batch 2)

### T-077: Dashboard Polish + Onboarding Verification [x] [verified] [audited] (2 items [~] — LLM signup + dashboard-after-signup pending Julian manual test)

### T-078: LLM-Friendly API Docs & Key Rotation Hardening [x] [verified] [audited]

_Dashboard polish (Sonner toasts, Lucide icons, loading skeletons, StatusBadge fix). Key rotation endpoint with grace period (DEC-029). llm.txt + agents.json updated with full API key management. GitHub Secret Scanning deferred. 17 key management tests._

---

## Pre-Launch Hardening (completed tickets)

### T-079: Upstash Redis Fixed Plan + Health Check Fix [x] [verified] [audited]

### T-080: Dashboard Global Layout Restructure [x] [verified] [audited]

### T-081: App Card + Nav Button UX Improvements [x] [verified] [audited]

### T-083: App Switcher, Docs Link & Quick-Start Docs Page [x] [verified] [audited]

### T-082: Promote T-065 Abuse Prevention Pre-Launch [x] [verified] [audited]

_Upstash PAYG with $20/mo cap, singleton health check Redis. Top bar replaces sidebar (DEC-030). App cards with hover chevron, status dot, subtext. App switcher dropdown, Docs link, comprehensive /docs page. Disposable email blocking (55 domains) + admin org disable/enable (DEC-032)._

---

## Infrastructure Hardening (completed tickets)

### T-086: SSRF Protection on Endpoint URLs [x] [verified] [audited]

### T-087: Update Service Registry + Remove Unused Env Vars [x] [verified] [audited]

_SSRF protection with DNS rebinding prevention (DEC-031). 20 URL validator tests. Service registry updated, unused env vars commented out._

---

## Phase 8a: Stripe Live Mode (completed tickets)

### T-076: Stripe Checkout E2E Test + Live Mode Activation [x] [verified] [audited]

_Full Stripe billing flow verified end-to-end: sandbox testing, quota headers fix, webhook handler (5 events with idempotency), live Stripe products/prices created (3 tiers × 2 intervals), live checkout confirmed with real card. Portal return URL fix, quota headers middleware ordering fix._

---

## Phase 11: Outreach & First Users (completed tickets)

### T-088: GitHub Svix User Mining + Cold Email Drafts [x] [verified] [audited]

### T-089: Email Sending Infrastructure [x] [verified] [audited]

_Svix/Hookdeck/Convoy user mining: 50+ repos found, 20 cold email drafts with personalized hooks. Resend email service configured (SPF/DKIM verified, @emithq.com sender). Artifacts: `docs/outreach/svix-targets.md`, `docs/outreach/drafts/`, `scripts/send-email.ts`._

---

## Testing Baseline (completed tickets)

### T-097: Playwright MCP Smoke Test + Dashboard Baseline [x] [verified] [audited]

### T-098: T-090 Unit Test Infrastructure [x] [verified] [audited]

### T-099: Landing Site Browser Smoke Test [x] [verified] [audited]

_Playwright MCP established as browser testing tool. T-097: 5 dashboard pages verified (Clerk auth, settings tabs, app overview), 5 Clerk quirks documented in TEST_PLAN.md. T-098: 54 test-first tests for T-090 outreach system (reply classifier 12 categories, campaign state CRUD, inbound API handlers). T-099: 4 landing pages verified (homepage, pricing, compare, docs), zero console errors. Testing archetypes tracked in TEST_PLAN.md, personas in PERSONAS.md._

---

## Phase 13a: Payload Transform Dashboard (completed tickets)

### T-100: Fix Pricing Inconsistency — Transforms Available Starter+ [x] [verified] [audited]

### T-101: Transform Rule Editor UI — Endpoint Create/Edit [x] [verified] [audited]

### T-102: Live Transform Preview Panel [x] [verified] [audited]

### T-103: Transform Tier Gating UI [x] [verified] [audited]

_Pricing aligned: transforms Starter+ ($49/mo) across landing site + dashboard (DEC-034). Visual form-based transform editor: collapsible details/summary section, rule rows (Source Path → Target Field → Template), max 20 rules, inline validation, function reference tooltip, mobile-responsive. Live preview panel with debounced 300ms API calls to POST /transform/preview. Free tier upgrade prompt, paid tiers get full editor. Component: `packages/dashboard/src/components/transform-rule-editor.tsx`._

---

## Archived 2026-03-29

### T-104: API-Level Tier Enforcement for Payload Transforms [x] [verified] [audited]

### T-096: Research — LLM & SEO Discovery Optimization [x] [verified] [audited]

### T-105: Technical SEO & LLM Discovery Foundations [x] [verified] [audited]

### T-108: Blog Infrastructure on Landing Site [x] [verified] [audited]

### T-109: Origin Story Blog Post + Distribution [x] [verified] [audited]

### T-110: Technical Deep-Dive Blog Post + Distribution [x] [verified] [audited]

_SEO foundation: JSON-LD schemas, robots.txt AI bot differentiation, llms.txt, canonical URLs, Google Search Console. Blog infrastructure on landing site with MDX rendering, JSON-LD, OG meta, RSS feed. Two blog posts published: origin story + technical deep-dive._

### T-112: Security Hardening — Timing-Safe Comparisons, Headers, Leak Cleanup [x] [verified] [audited]

### T-113: Test Integrity — Fix Message Tests, Add Circuit Breaker + Billing Coverage [x] [verified] [audited]

### T-114: CI Hardening — Typecheck All Packages, Gate SDK Publish, Fix Coverage [x] [verified] [audited]

### T-115: Architecture Documentation Alignment [x] [verified] [audited]

### T-116: Dashboard Error Boundaries + Accessibility [x] [verified] [audited]

### T-117: Settings + Endpoints Page Decomposition [x] [verified with notes] [audited]

_Codebase health refactoring (Phase 13a-c): timing-safe secret comparisons, security headers on API+dashboard, Stripe/signup log leak cleanup. Test integrity: messages.test.ts now tests real handler, circuit breaker + DLQ + billing webhook tests added (372 total). CI: typecheck:all covers dashboard+landing, SDK publish gated on CI, coverage-v8 installed. ARCHITECTURE.md aligned to code reality. Dashboard: error boundaries on all route segments, keyboard/ARIA accessibility, settings page decomposed (832→85 lines), endpoints page decomposed (724→382 lines), shared ErrorBanner component._
