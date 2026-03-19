# Decisions — EmitHQ

> Last verified: 2026-03-19
> Archived decisions: see [DECISIONS-ARCHIVE.md](DECISIONS-ARCHIVE.md)

## DEC-018 | 2026-03-13 | Legal Entity: NotAnotherAiCo LLC (Multi-Product Umbrella)

**Status:** Active (supersedes DEC-006 naming)
**Linked to:** T-021, T-004

**Context:** Julian decided EmitHQ is the second product under NotAnotherAiCo LLC (first is NAAC ERP for property management). Company domain is naac.ai.

**Decision:** NotAnotherAiCo LLC is the legal entity for all products. EmitHQ is a product brand, not a separate company. npm org stays product-level (@emithq). Stripe for EmitHQ billing (SaaS subscriptions + usage metering). Payabli stays for NAAC ERP only (embedded payments — different payment flow).

**Alternatives considered:**

- Separate LLC per product — unnecessary overhead for a solo founder
- Payabli for EmitHQ — built for embedded payments, no usage-based metering

**Consequences:** Legal docs reference "NotAnotherAiCo LLC" as entity. naac.ai needs a company website showcasing both products (future work).

---

## DEC-019 | 2026-03-15 | Billing: Stripe Checkout + Flat Subscription + Webhook Lifecycle

**Status:** Active
**Linked to:** T-011

**Context:** T-011 requires Stripe integration for subscription billing. Need to handle signup, plan changes, cancellation, payment failures, and usage tracking.

**Decision:** Stripe Checkout Sessions for initial subscription (not custom Payment Element). One flat-rate price per tier per interval (6 total). Stripe Customer Portal for self-service plan changes. Webhook handler processes 5 event types for subscription lifecycle. `billingEvents` table with unique `stripe_event_id` for idempotent webhook processing. Auto-provision organizations on first Clerk login (no separate org creation flow). Paid tiers allow overage past included events (free tier hard-blocks). `invoice.paid` resets `event_count_month` (replaces standalone monthly cron).

**Alternatives considered:**

- Custom Payment Element forms — more code, less conversion, handles fewer payment methods
- Metered billing from day 1 — adds complexity; defer overage billing via Stripe Meter until customers hit overages
- Separate org creation endpoint — unnecessary when Clerk provides org data; auto-provisioning is simpler
- Monthly cron for event count reset — `invoice.paid` is the actual billing period boundary; more accurate

**Consequences:** Stripe products/prices created in sandbox (3 products × 2 intervals = 6 prices). Price IDs stored in 1Password. Org auto-provisioning means first Clerk login creates the org row. Dashboard billing UI deferred to follow-up ticket.

---

## DEC-020 | 2026-03-15 | Monitoring: PostgreSQL SLO Queries + Better Stack + Sentry

**Status:** Active
**Linked to:** T-022

**Context:** Need production monitoring for a webhook infrastructure platform selling reliability. Must track delivery success rate, latency percentiles, queue depth, and provide incident response capability.

**Decision:** SLO metrics computed from existing `delivery_attempts` table via PostgreSQL aggregate queries (percentile_cont, filtered counts) — no new schema or time-series DB. `/metrics` endpoint exposes cross-tenant aggregates via `adminDb` (BYPASSRLS), protected by `METRICS_SECRET` header. `/health` extended to probe DB + Redis connectivity (returns 503 if degraded). Better Stack for external uptime monitoring + status page. Sentry for error tracking + performance monitoring. Incident runbook at `docs/RUNBOOK.md`.

**Alternatives considered:**

- Prometheus + Grafana — overkill for pre-launch; adds operational complexity for a solo dev
- Custom time-series database — unnecessary when delivery_attempts already stores all SLO data
- Datadog/New Relic — expensive; Better Stack + Sentry covers needs at $0/mo (free tiers)

**Consequences:** Better Stack and Sentry accounts need to be created and API tokens stored in 1Password. `/metrics` endpoint must not be public (secret-protected). SLO queries may become slow at >100M delivery_attempts — add materialized views or time-series if needed post-launch.

---

## DEC-021 | 2026-03-16 | Production Runtime: tsx Instead of tsc + node

**Status:** Active
**Linked to:** T-027

**Context:** The monorepo uses `@emithq/core` as a workspace package with `main: "src/index.ts"` pointing to TypeScript source. The root tsconfig uses `moduleResolution: "bundler"` with path aliases. After `tsc` compilation, `@emithq/core` imports in emitted JS cannot resolve at runtime — Node.js cannot execute `.ts` files or resolve compile-time-only path aliases without a bundler or additional tooling.

**Decision:** Use `tsx` (esbuild-based TypeScript runner) for production instead of `tsc` + `node`. The API server runs `tsx src/server.ts` and the delivery worker runs `tsx src/worker.ts`. No compilation step needed. `tsx` is already a devDependency used for `npm run dev`.

**Alternatives considered:**

- `tsc` + bundler (tsup/esbuild) — adds build complexity, another dependency to maintain
- Fix `@emithq/core` to compile and export JS — requires maintaining two build configs, breaks the simple workspace-as-source pattern
- `tsc-alias` for runtime path resolution — brittle, adds another tool to the chain

**Consequences:** Slightly slower cold start (~200ms for tsx transpilation vs pre-compiled). Negligible for a Railway service that stays running. `tsx` must be in `packages/api` production `dependencies` (not just root devDependencies). If performance becomes an issue at scale, migrate to a bundler step.

---

## DEC-022 | 2026-03-17 | SET LOCAL Uses sql.raw() with UUID Pre-Validation

**Status:** Active
**Linked to:** T-045

**Context:** PostgreSQL `SET LOCAL` doesn't support parameterized values (`$1`). Drizzle's `sql` template tag parameterizes by default, causing syntax errors on every tenant-scoped query in production.

**Decision:** Use `sql.raw()` for the SET LOCAL statement after strict UUID regex validation (`/^[0-9a-f]{8}-...$/i`). The validation throws before interpolation if the input isn't a valid UUID.

**Alternatives considered:**

- Parameterized query — PostgreSQL rejects `SET LOCAL ... = $1`
- Raw string without validation — SQL injection risk

**Consequences:** Every `withTenant()` call depends on the UUID regex. If the regex is removed or weakened, injection becomes possible. This is documented as a security-critical code path.

---

## DEC-023 | 2026-03-17 | Idempotency via onConflictDoNothing Instead of Catch

**Status:** Active
**Linked to:** T-045

**Context:** The original idempotency handler caught unique constraint violations (23505) and re-selected the existing row. PostgreSQL aborts the entire transaction on constraint errors, making the subsequent SELECT fail.

**Decision:** Use Drizzle's `onConflictDoNothing()` to silently skip duplicate inserts without aborting the transaction. If the insert returns nothing, re-select the existing message by `(appId, eventId)` and return 200.

**Alternatives considered:**

- Catch-and-select within same transaction — fails because PostgreSQL aborts tx on constraint error
- Use a savepoint — adds complexity for a simple idempotency check
- Check-then-insert — race condition between check and insert

**Consequences:** Duplicate events return 200 with the original message data. No re-delivery occurs. The `onConflictDoNothing` target is the `UNIQUE(app_id, event_id)` constraint.

---

## DEC-024 | 2026-03-17 | Dashboard Auth: Server Component Guard + Clerk Middleware

**Status:** Active
**Linked to:** T-045

**Context:** The dashboard at app.emithq.com had no auth protection — middleware wasn't detected by Next.js (wrong file location), and Clerk env vars were missing from both Vercel and Railway.

**Decision:** Three-layer auth: (1) `clerkMiddleware()` with `auth.protect()` at `src/middleware.ts` (Next.js requires this path with `src/` directory), (2) server-side `auth()` check in the dashboard layout with try/catch fallback to `/sign-in`, (3) client-side `useApiFetch()` hook that gets Clerk JWT via `useAuth().getToken()` and sends as Bearer header. Required env vars: `CLERK_SECRET_KEY` + `CLERK_PUBLISHABLE_KEY` on Railway, `CLERK_SECRET_KEY` + sign-in URL vars on Vercel.

**Alternatives considered:**

- Middleware only — failed silently when placed in wrong directory; layout guard adds defense-in-depth
- Cookie-based auth (`credentials: 'include'`) — API expects Bearer tokens, not cookies; CORS issues

**Consequences:** All dashboard client components must use `useApiFetch()` from `@/lib/use-api.ts`, not raw `fetch`. New env vars required on both Vercel (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) and Railway (`CLERK_PUBLISHABLE_KEY`).

---

## DEC-025 | 2026-03-17 | Analytics: Self-Hosted Umami Instead of Plausible Cloud

**Status:** Active
**Linked to:** T-041

**Context:** T-041 originally planned Plausible Cloud ($9/mo Starter, no API; $19/mo Business for API). Julian requested a free alternative. Evaluated Cloudflare Web Analytics (free, no custom events/API), Umami (free, self-hosted, MIT, custom events + API), and PostHog (free tier, heavy).

**Decision:** Self-hosted Umami v3 on the miniPC via Docker Compose. Own Postgres container (isolated from Neon). Port 3100 (avoids NAAC_ERP conflict on 3000). Script and collection endpoint renamed (`TRACKER_SCRIPT_NAME=u`, `COLLECT_API_ENDPOINT=/api/u`) to bypass ad blocker lists. Vercel rewrites proxy the script through emithq.com (`/t/u.js`) as belt-and-suspenders. Public exposure via `analytics.emithq.com` (Cloudflare Tunnel or Caddy — Julian's choice).

**Alternatives considered:**

- Plausible Cloud ($9-19/mo) — costs money; API only on Business tier ($19/mo)
- Plausible self-hosted — AGPL, requires ClickHouse (heavy), same effort as Umami for more complexity
- Cloudflare Web Analytics — free but no custom events, no API
- PostHog — free tier exists but 90KB script, overkill for landing page analytics

**Consequences:** Umami adds ~300MB RAM to miniPC Docker footprint. API access (JWT-based) available immediately for `/catchup` integration and T-025 data analysis. Requires Julian to expose the service publicly (Cloudflare Tunnel recommended) and create a 1Password item for `UMAMI_APP_SECRET`.

---

## DEC-026 | 2026-03-17 | Landing Page Analytics Exempt from Unit Test Requirement

**Status:** Active
**Linked to:** T-041

**Context:** `/verify` scored Test Quality at 0.0 (auto-FAIL) because the landing package has zero test files. The test reviewer identified 10 theoretical gaps including race conditions, silent failures, and prop mutation. Julian accepted with known issues.

**Decision:** The landing page analytics wrapper (`trackEvent()`, `CtaLink`) is exempt from unit test requirements. Client-side fire-and-forget analytics is designed to silently fail — testing it means mocking `window.umami` and asserting the mock was called, which tests the mock, not real behavior. Real validation was performed manually: Umami endpoint returns 200, script loads, collection endpoint responds.

**Alternatives considered:**

- Add vitest + jsdom + React Testing Library to landing package — adds dependency maintenance cost exceeding test value for a 3-line passthrough function
- Defer to T-038 (CI Integration Tests) — T-038 covers API/core tests, not landing page analytics

**Consequences:** Landing page remains untested. If analytics breaks, it will be detected by absence of data in Umami dashboard, not by CI. This is an accepted tradeoff for a static marketing site.

---

## DEC-027 | 2026-03-18 | API-Only Signup via Clerk Backend API + Quota Headers

**Status:** Active
**Linked to:** T-063

**Context:** EmitHQ needs to be fully LLM-automatable — an AI agent should create an account and start sending webhooks without a browser. The existing Clerk-hosted signup requires browser interaction.

**Decision:** New `POST /api/v1/signup` endpoint uses Clerk Backend API (`createUser` + `createOrganization` with `createdBy` for auto-admin). Returns `{ orgId, apiKey }` in one response. In-memory rate limiting (3/IP/day) — Redis upgrade deferred to T-065. Machine-readable `X-EmitHQ-Quota-*` headers on all authenticated responses. Enriched 429 with structured `quota` + `action` objects including upgrade tiers. CORS `exposeHeaders` added for browser clients.

**Alternatives considered:**

- API-key-first with no Clerk user — simpler but creates orphan accounts with no email for recovery, billing, or communication
- Redis-backed rate limiting from day one — overkill for a 3/IP/day limit on a single Railway instance
- Global quota middleware fetching org data — accepted the extra DB query per authenticated request for simplicity; optimize with caching if needed post-launch

**Consequences:** Signup creates both a Clerk user and an EmitHQ org in one call. If EmitHQ DB insert fails after Clerk user creation, the Clerk user is orphaned but recoverable via dashboard login (auto-provision catches it). In-memory rate limiter resets on deploy — acceptable abuse window. `TIER_PRICES` constant added to `@emithq/core` for 429 response bodies.

---

## DEC-028 | 2026-03-18 | Dashboard: Path-Based App Context + Two-State Sidebar

**Status:** Active
**Linked to:** T-070, docs/research/dashboard-ux-restructure.md

**Context:** Dashboard used `?app=<uid>` query params to track app context. This caused stale AppSwitcher state after deletes, confusing "default" fallback when no app selected, and required `hrefWithApp()` propagation on every nav link. T-068 research recommended path-based routing following Vercel/Railway patterns.

**Decision:** Restructured to `/dashboard/app/[appId]/*` path-based routing. `useApp()` reads from `useParams()` instead of `useSearchParams()`. Sidebar is a two-state component: global mode (Applications, Settings, Billing, Profile) when on `/dashboard` or `/dashboard/settings/*`, and app-context mode (Overview, Events, Endpoints, DLQ + "Back to Apps") when on `/dashboard/app/*`. AppSwitcher dropdown removed. `/dashboard` landing is now the app card grid (absorbed from `/dashboard/applications`). Mobile nav also switches between global and app-context items.

**Alternatives considered:**

- Breadcrumb-only approach (keep sidebar static, add breadcrumb header) — doesn't clearly communicate app context, still needs query param propagation
- Nested layout duplication (separate layout for global vs app) — duplicates auth guard and outer chrome
- Keep AppSwitcher as app-context header — adds complexity without benefit when card grid is the landing page

**Consequences:** Old `?app=` URLs no longer work (pre-launch, so no user impact). E2E browser journey tests updated for new URL patterns. AppSwitcher component deleted. Old `/dashboard/applications`, `/dashboard/events`, `/dashboard/endpoints`, `/dashboard/dlq` routes removed — all app-scoped pages live under `/dashboard/app/[appId]/`.

---

## DEC-029 | 2026-03-18 | API Key Rotation with Grace Period for LLM Agent Safety

**Status:** Active
**Linked to:** T-078

**Context:** EmitHQ's differentiator is full LLM-automatable onboarding. The signup endpoint returns an API key in the response, which then lives in the LLM's conversation context — a potential exposure vector. Research (KB: `llm-api-key-security/`) found no platform has adapted auth flows for LLM agents. Key patterns: brokered credentials (MCP), scoped keys, rolling rotation with grace periods, GitHub Secret Scanning.

**Decision:** Added `POST /api/v1/auth/keys/:keyId/rotate` endpoint. Creates a new key and sets `expiresAt` on the old key (grace period, default 1 hour, configurable 0-1440 minutes). If `gracePeriodMinutes: 0`, the old key is immediately revoked. Auth middleware already enforces `expiresAt` — no changes needed there. Updated `llm.txt` with full API key management section (create/list/rotate/revoke), error code reference, and rate limit docs. Updated `agents.json` with `manage_api_keys` capability and SDK reference.

**Alternatives considered:**

- OAuth 2.0 Client Credentials flow (short-lived tokens) — more secure but adds complexity; deferred to post-launch
- Immediate revocation only (no grace period) — breaks running agents that can't coordinate instant key swaps
- Two-call rotation (POST new + DELETE old) — already works but no grace period overlap; atomic rotate is safer

**Consequences:** LLM agents can now rotate keys with zero downtime. The brokered credentials pattern (via MCP server, T-067) remains the recommended long-term approach — rotation is the pragmatic near-term solution. GitHub Secret Scanning partner registration (`emhq_` prefix) is a manual step for Julian.

---

## DEC-030 | 2026-03-18 | Dashboard: Top Bar Replaces Sidebar at All Levels

**Status:** Active (supersedes DEC-028 sidebar chrome; DEC-028 path-based routing still valid)
**Linked to:** T-080

**Context:** The two-state sidebar from DEC-028 had only 2 items (Applications, Settings) at the global level, wasting screen space. Julian flagged this as confusing — the sparse sidebar didn't communicate that rich data lives inside each app card. Research showed Railway uses no sidebar at the project list level, and Vercel recently moved to persistent but morphing nav. The 2-item sidebar was the worst of both patterns.

**Decision:** Replaced the sidebar with a fixed top bar at all levels. Global mode: logo (left) + Settings gear + Sign Out (right). App-context mode: adds inline nav items (← Apps | App Name | Overview, Events, Endpoints, DLQ) in the top bar center-left. Mobile: app nav items in a secondary scrollable row below the top bar. No sidebar at any level. Full-width content everywhere.

**Alternatives considered:**

- Keep sidebar but add more global items (usage, billing, quick actions) — adds items that don't exist yet just to fill space
- Railway-style top tabs only in app context — inconsistent; global still needs settings somewhere
- Vercel-style persistent morphing sidebar — good pattern but overkill for 2 global + 4 app items

**Consequences:** `Sidebar` and `MobileNav` components deleted. `TopBar` is the single nav export from `nav.tsx`. Layout `<main>` uses `pt-14` instead of `md:ml-56`. E2E tests don't reference sidebar (confirmed by explore agent) — no test changes needed. DEC-028's path-based routing (`/dashboard/app/[appId]/*`) and `useParams()` context detection remain unchanged.

---

## DEC-031 | 2026-03-18 | SSRF Protection on Endpoint URLs with DNS Rebinding Prevention

**Status:** Active
**Linked to:** T-086

**Context:** The delivery worker POSTs to any URL registered as an endpoint — including internal IPs (169.254.169.254, 10.x.x.x, 127.0.0.1). Cloud metadata endpoints are a critical SSRF target. DNS rebinding attacks can bypass hostname-only checks by resolving to an internal IP after initial validation.

**Decision:** Two-layer URL validation: `validateEndpointUrl()` (async, DNS-resolving) at endpoint creation/update time, `isObviouslyBlockedUrl()` (sync, fast) at delivery time. Blocked ranges: RFC 1918, loopback, link-local, cloud metadata IPs and hostnames. DNS resolution check resolves hostname and verifies the resolved IP is not in blocked ranges. Both functions in `@emithq/core/security/url-validator.ts`.

**Alternatives considered:**

- Hostname-only blocklist (no DNS resolution) — vulnerable to DNS rebinding; attacker registers domain that initially resolves to public IP, then switches to 169.254.169.254
- Proxy all outbound requests through a gateway — too complex for MVP; adds latency and another failure point
- Allow private IPs with a toggle — increases attack surface; customers rarely need to deliver to private endpoints

**Consequences:** Endpoint creation is slightly slower due to DNS resolution (~50ms). Delivery-time check is fast (regex-based, no DNS). 20 tests cover blocked IPs, public IPs, DNS rebinding, protocol validation, and hostname blocking.

---

## DEC-032 | 2026-03-18 | Pre-Launch Abuse Prevention: Disposable Email Blocking + Admin Disable

**Status:** Active
**Linked to:** T-082, T-065

**Context:** Before Show HN, needed minimum abuse prevention without full payment-gated flow (deferred to T-065). Two highest-impact items: prevent signup with throwaway emails, and give admin ability to instantly kill an abusive org.

**Decision:** Disposable email domain blocklist (55+ domains) on `POST /api/v1/signup` — returns 400. `POST /api/v1/admin/org/:orgId/disable` and `/enable` endpoints protected by `ADMIN_SECRET` header. Auth middleware checks `disabled` flag on organization for both API key and Clerk session auth paths — returns 403 for disabled orgs. DB migration adds `disabled` (boolean) + `disabled_reason` (text) columns to organizations table.

**Alternatives considered:**

- Full card-on-file (Stripe SetupIntent) before free tier — too much Stripe integration work pre-launch; deferred to T-065
- Usage velocity detection — needs baseline data from real users; meaningless at zero users
- IP-based blocking only — easily circumvented; email blocking is more effective

**Consequences:** Disposable email list needs periodic updates as new domains appear. Admin endpoints are internal-only (excluded from OpenAPI spec and drift check). T-065 remains open for card-on-file and velocity detection post-launch.
