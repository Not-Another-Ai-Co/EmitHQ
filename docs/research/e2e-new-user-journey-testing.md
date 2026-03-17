# Research: End-to-End New User Journey Testing

**Date:** 2026-03-17
**Status:** Draft -- pending review

## Summary

The EmitHQ new-user journey spans 7 distinct steps across 3 systems (Clerk, Dashboard, API): signup, org provisioning, app creation, API key generation, endpoint creation, sending a test event via SDK, and verifying delivery in the dashboard. The codebase has unit/route tests but zero E2E coverage of this flow. This research maps the complete journey, identifies all failure points, and recommends a Playwright-based E2E test strategy using Clerk's `@clerk/testing` package.

## Current State

### What exists today

- **Unit tests:** 11 test files across `packages/api/src/` and `packages/core/src/` covering routes (applications, endpoints, messages, billing, metrics, dashboard, auth) and core logic (backoff, replay, signing, transformation, delivery worker). Uses Vitest with `createTestApp` factory pattern and mocked `@emithq/core`.
- **SDK tests:** `client.test.ts`, `errors.test.ts`, `verify.test.ts` in `packages/sdk/src/`.
- **Dashboard tests:** None. No Playwright, no Vitest tests for any dashboard pages.
- **E2E tests:** None across the entire monorepo. No Playwright configuration exists.
- **CI:** Single-job workflow running lint + unit tests. No integration or E2E test stage.

### The user journey (mapped from code)

| Step                  | System                             | Code Path                                                                             | What Happens                                                                                                                                          |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Signup             | Clerk hosted UI                    | `packages/dashboard/src/app/sign-up/[[...sign-up]]/page.tsx`                          | Clerk `<SignUp />` component renders. User creates account. Clerk handles email verification.                                                         |
| 2. Dashboard entry    | Dashboard middleware + layout      | `src/middleware.ts` (`auth.protect()`), `src/app/dashboard/layout.tsx` (server guard) | Unauthenticated users redirected to `/sign-in`. Clerk middleware checks JWT.                                                                          |
| 3. Org auto-provision | API auth middleware                | `packages/api/src/middleware/auth.ts` lines 102-143                                   | First Clerk session request triggers auto-provision: fetches Clerk org name, inserts into `organizations` table, fires `org.created` analytics event. |
| 4. Create application | Dashboard applications page -> API | `src/app/dashboard/applications/page.tsx` -> `POST /api/v1/app`                       | User fills name + optional UID. API inserts into `applications` table within tenant-scoped transaction.                                               |
| 5. Generate API key   | Dashboard settings page -> API     | `src/app/dashboard/settings/page.tsx` -> `POST /api/v1/auth/keys`                     | User names the key. API generates `emhq_` prefixed key, stores SHA-256 hash. Plaintext shown once in modal. Requires `org:admin` or `org:owner` role. |
| 6. Create endpoint    | Dashboard endpoints page -> API    | `src/app/dashboard/endpoints/page.tsx` -> `POST /api/v1/app/:appId/endpoint`          | User enters URL (HTTPS in prod, HTTP in dev). API generates `whsec_` signing secret. Secret shown once in modal.                                      |
| 7. Send test event    | SDK or API                         | `EmitHQ.sendEvent()` -> `POST /api/v1/app/:appId/msg`                                 | SDK authenticates via API key. Message persisted. Fan-out creates `delivery_attempt` rows. BullMQ jobs enqueued.                                      |
| 8. Verify delivery    | Dashboard events page              | `src/app/dashboard/events/page.tsx` -> `GET /api/v1/app/:appId/msg` + `GET /:msgId`   | Events page shows message list. Click to see detail panel with delivery attempts, status, response codes.                                             |

### Getting Started page (T-051)

The onboarding checklist at `/dashboard/getting-started` auto-detects progress by calling 4 API endpoints:

1. `GET /api/v1/app` -- checks if any app exists
2. `GET /api/v1/auth/keys` -- checks if any API key exists
3. `GET /api/v1/app/:appId/endpoint` -- checks if first app has endpoints
4. `GET /api/v1/app/:appId/msg` -- checks if first app has messages

This maps exactly to the 4-step onboarding flow and serves as an excellent programmatic validation target.

## Findings

### 1. Critical failure points in the journey

**Auth handoff (Steps 2-3):** The Clerk-to-API auth chain is the most fragile link. Dashboard gets a Clerk JWT via `useAuth().getToken()`, sends it as Bearer to the API. The API's `requireAuth` middleware then:

- Validates the Clerk session via `@hono/clerk-auth`
- Requires `auth.orgId` (Clerk org must be set -- returns 403 if not)
- Auto-provisions the org if `clerk_org_id` doesn't exist in DB
- Creates Clerk client on-the-fly to fetch org name

**Failure modes here:**

- Missing `CLERK_SECRET_KEY` on API server -> 401 on every authenticated request
- Clerk org not created/selected -> 403 `no_active_organization`
- Neon DB unreachable -> org auto-provision fails silently (catch block returns 404)
- Race condition on first request -> `onConflictDoNothing` + re-select handles this

**API key role gate (Step 5):** `requireRole('org:admin', 'org:owner')` checks the Clerk session's `orgRole`. If the user signed up but doesn't have the right role in their Clerk org, they get 403. This is invisible in the UI -- the Settings page makes the API call and gets an error.

**Signing secret one-time display (Steps 5-6):** Both API key and endpoint signing secret are shown exactly once. If the user closes the modal without copying, there's no recovery path except generating a new key/endpoint. The E2E test must verify the modal appears and contains the expected format (`emhq_` prefix for API keys, `whsec_` prefix for signing secrets).

**Delivery verification (Steps 7-8):** Sending an event requires a real endpoint URL that accepts POST requests. In E2E testing, this means either:

- A mock HTTP server running alongside the test
- A test endpoint that returns 200 (like webhook.site or a local server)
- Using the "test delivery" button which bypasses message creation

### 2. Async delivery gap

The most significant testing challenge: `POST /api/v1/app/:appId/msg` returns 202 Accepted immediately. Actual delivery happens asynchronously via BullMQ worker (`packages/core/src/workers/delivery-worker.ts`). The E2E test needs to wait for the worker to process the job before checking the Events page.

Options for handling this:

- **Poll the API** for delivery attempt status changes (most realistic)
- **Skip async verification** and only test message creation + fan-out (delivery_attempt rows with `pending` status)
- **In-process worker** for test mode that processes jobs synchronously

### 3. Clerk testing infrastructure

Clerk provides `@clerk/testing` (v2.0.4) with Playwright-specific helpers:

- `clerkSetup()` in global setup -- obtains a Testing Token that bypasses bot detection
- `setupClerkTestingToken({ page })` per test -- injects the testing token
- `clerk.signIn()` with `strategy: 'password'` for programmatic authentication
- Auth state persistence via `storageState` to avoid re-authenticating per test

**Requirements:**

- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in test env
- A test user created in Clerk (password strategy must be enabled)
- Credentials stored as env vars (`E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_PASSWORD`)

### 4. Test endpoint for delivery verification

For a fully closed-loop E2E test, the test needs a URL that:

1. Accepts POST requests
2. Returns 200
3. Ideally lets the test verify the received payload

Options ranked:
| Approach | Complexity | Reliability | CI-Ready |
|----------|-----------|-------------|----------|
| Local HTTP server in test fixture | Low | High | Yes |
| webhook.site free URL | Zero | Medium (external dependency) | Fragile |
| Ngrok/Hookdeck tunnel | Medium | Medium | Needs setup |
| `POST /api/v1/app/:appId/endpoint/:epId/test` | Zero | High | Yes |

**Recommended:** Start with the built-in test delivery endpoint (`POST /.../test`) for the initial pass -- it validates connectivity without requiring a real external server. For full journey testing, add a lightweight HTTP server in the Playwright test fixture.

### 5. Dashboard page architecture implications

All dashboard pages are client components (`'use client'`) except the Overview page (server component). This means:

- Playwright must wait for client-side data fetching to complete
- All API calls go through `useApiFetch()` which adds Bearer tokens
- The `?app=<uid>` search param must be set for endpoint/event pages (managed by `useApp()` hook)
- localStorage-based onboarding dismissal state (`emithq_onboarding_dismissed`) affects nav visibility

### 6. Multi-tenancy testing consideration

RLS adds a constraint: the test user's Clerk org must map to an org in the database, and all resources (apps, endpoints, messages) must belong to that org. The auto-provisioning in `requireAuth` handles this on first login, but the E2E test should verify:

- Org is created on first dashboard visit
- Resources are scoped correctly (can't see other orgs' data)
- The `tenantScope` middleware correctly wraps all API calls

## Recommendation

**Implement a Playwright E2E test suite covering the critical new-user path in 3 phases:**

### Phase 1: Happy-path journey test (priority -- Show HN blocker)

A single Playwright test file that walks through all 8 steps:

1. Navigate to `/sign-up`, authenticate via `@clerk/testing` helpers
2. Verify redirect to `/dashboard`
3. Navigate to `/dashboard/getting-started`, verify all steps show "pending"
4. Create an application on `/dashboard/applications`
5. Generate an API key on `/dashboard/settings`, capture the key from the modal
6. Create an endpoint on `/dashboard/endpoints` (using a local test server URL)
7. Use the captured API key to send an event via `POST /api/v1/app/:appId/msg` (API call, not SDK -- avoids npm publish dependency)
8. Navigate to `/dashboard/events`, verify the event appears with delivery attempt(s)
9. Re-check getting-started page -- all 4 steps should show "completed"

**Test infrastructure needed:**

- `@playwright/test` + `@clerk/testing` packages
- Playwright config with Clerk global setup
- Test user credentials in `.env.tpl` (1Password)
- Local HTTP server fixture (express or native `http.createServer`) for endpoint URL
- CI: Run against the dev API server (or docker-compose with API + worker + DB)

### Phase 2: Error path tests

- Missing Clerk org -> verify 403 handling in dashboard
- Invalid API key -> verify SDK error response
- HTTPS-only endpoint URL in production mode
- Quota limit reached -> verify 429 response
- Endpoint circuit breaker (10 consecutive failures -> auto-disable)

### Phase 3: CI integration

- Add to GitHub Actions as a separate job (after lint + unit tests)
- Docker Compose for API + worker + PostgreSQL + Redis
- Clerk test instance (separate from production)
- Run on PR merges to master, not on every commit (E2E tests are slower)

### Alternatives considered

1. **API-only tests (no browser):** Would cover the API layer but miss the dashboard rendering, modal interactions, localStorage state, and real Clerk auth flow. The dashboard is the primary Show HN surface -- it must work.

2. **Cypress instead of Playwright:** Playwright has better Clerk integration (`@clerk/testing` is Playwright-first), faster execution, and native multi-browser support. Cypress would require custom Clerk auth workarounds.

3. **Manual testing checklist instead of automation:** Faster to start but doesn't prevent regressions. Given that the dashboard has zero tests today, any code change could break the onboarding flow silently. Automation is worth the setup cost.

## Sources

- EmitHQ codebase: `packages/dashboard/src/`, `packages/api/src/`, `packages/core/src/`, `packages/sdk/src/`
- [Clerk Playwright Testing Guide](https://clerk.com/docs/guides/development/testing/playwright/overview)
- [Clerk Testing Authenticated Flows](https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows)
- [@clerk/testing npm package](https://www.npmjs.com/package/@clerk/testing) (v2.0.4)
- [Clerk + Playwright + Next.js example repo](https://github.com/clerk/clerk-playwright-nextjs)
- [E2E Testing SaaS with Playwright](https://makerkit.dev/blog/tutorials/playwright-testing)
- [Webhooks E2E Testing for Next.js](https://dev.to/ash_dubai/webhooks-end-to-end-testing-for-nextjs-applications-webhooks-end-to-547c)
- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)
- [Webhook Testing Tools](https://hookdeck.com/webhooks/platforms/best-webhook-testing-tools-local-development)
- [webhook.site](https://webhook.site/)
- Existing knowledge base: `~/.claude/knowledge/testing/research.md` (Vitest/Hono patterns, CI conventions)
