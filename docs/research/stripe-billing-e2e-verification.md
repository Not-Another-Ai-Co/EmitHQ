# Research: Stripe Billing Integration E2E Verification

**Date:** 2026-03-19
**Status:** Draft — pending review
**Linked to:** T-076

## Summary

The current Stripe implementation covers the core checkout-to-webhook lifecycle well but has several gaps that need addressing before going live. Key findings: (1) a portal return URL bug, (2) missing webhook events (notably `customer.subscription.created`), (3) no Stripe Customer Portal configuration in the dashboard, (4) no sandbox E2E test coverage for the full checkout→webhook→tier-update flow, and (5) the go-live migration requires creating 6 live prices and swapping 8 env vars. Abuse vectors are manageable short-term but T-065 (payment-gated abuse prevention) should follow soon after launch.

## Current State

### What Exists

**Billing routes** (`packages/api/src/routes/billing.ts`):

- `POST /api/v1/billing/checkout` — Creates Stripe Checkout Session for starter/growth/scale, monthly or annual (6 combinations). Validates tier, checks for existing active subscription (409 conflict), reuses existing Stripe customer if available.
- `GET /api/v1/billing/subscription` — Returns tier, usage (current/limit/percentage), subscription status, Stripe customer/subscription presence.
- `POST /api/v1/billing/portal` — Creates Stripe Customer Portal session. Returns 412 if no Stripe customer exists.
- `POST /api/v1/billing/webhook` — Stripe webhook handler with signature verification via `stripe.webhooks.constructEvent()`. Idempotent processing via `billingEvents` table with unique `stripe_event_id`.

**Webhook event handlers** (5 events handled):

1. `checkout.session.completed` — Sets `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus: 'active'`, maps price→tier via `tierFromPriceId()`, sets `currentPeriodEnd`.
2. `customer.subscription.updated` — Updates tier from price, maps status (`cancel_at_period_end` → `'canceled'`, `active`, `past_due`). Falls back to subscription ID lookup if no `org_id` in metadata.
3. `customer.subscription.deleted` — Resets to `tier: 'free'`, `subscriptionStatus: 'free'`, nulls `stripeSubscriptionId` and `currentPeriodEnd`.
4. `invoice.paid` — Resets `eventCountMonth: 0` and sets `subscriptionStatus: 'active'`. This replaces a standalone monthly cron for event count reset (DEC-019).
5. `invoice.payment_failed` — Sets `subscriptionStatus: 'past_due'`.

**Core Stripe module** (`packages/core/src/billing/stripe.ts`):

- `getStripe()` — Singleton Stripe instance from `STRIPE_SECRET_KEY`.
- `getPriceIds(tier)` — Reads `STRIPE_PRICE_{TIER}_{INTERVAL}` env vars (6 total).
- `tierFromPriceId(priceId)` — Reverse lookup: price ID → tier name.
- `TIER_LIMITS` — `{ free: 100K, starter: 500K, growth: 2M, scale: 10M }`.
- `TIER_PRICES` — `{ starter: 49, growth: 149, scale: 349 }`.

**Quota enforcement** (`packages/api/src/middleware/quota.ts`):

- `quotaHeaders` — Sets `X-EmitHQ-Quota-*` headers on all authenticated responses. Warning at 80%, critical at 95%.
- `quotaCheck` — Blocks free tier at limit (429 with structured upgrade tiers). Paid tiers allow overage (no blocking).

**Dashboard billing UI** (`packages/dashboard/src/app/dashboard/settings/page.tsx`):

- Billing tab shows current plan card with status badge, usage bar (color-coded at 70%/100%), features list, subscription end date for canceled plans.
- Tier cards grid (4 tiers) with context-aware buttons: "Upgrade to X" (for free→paid checkout), "Upgrade/Downgrade" (for plan changes via portal), "Manage in portal" (for downgrade to free), "Current plan" badge.
- Checkout success banner on redirect with `?checkout=success` query param.
- Past due payment warning with portal link.
- `/dashboard/billing` redirects to `/dashboard/settings?tab=billing`.

**Database schema** (`packages/core/src/db/schema.ts`):

- `organizations` table: `tier`, `eventCountMonth`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `currentPeriodEnd`.
- `billingEvents` table: `stripeEventId` (unique), `eventType`, `payload`, `orgId`, `processedAt`.

**1Password Stripe item** (vault: EmitHQ):

- Contains sandbox keys: `sk_test_51TB...`, `whsec_cwsUwx...`, and 6 sandbox price IDs.
- No live keys stored yet.

**Tests:**

- 14 unit tests in `billing.test.ts` covering checkout validation, subscription response, portal precondition, webhook signature rejection, subscription status mapping, quota behavior by tier.
- 14 unit tests in `quota.test.ts` covering header injection, warning thresholds, enriched 429 response, paid tier overage allowance.
- E2E: `account-management.spec.ts` has 2 billing smoke tests (tab loads, redirect works) + `api-journey.spec.ts` verifies billing subscription endpoint returns 200. No checkout flow E2E test.

### Env Var Configuration

- `.env.tpl` has 8 Stripe-related vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and 6 `STRIPE_PRICE_*` vars.
- `DASHBOARD_URL` defaults to `http://localhost:4002` in code, with production value `https://app.emithq.com` in comments.

## Findings

### 1. Portal Return URL Bug

The Stripe Customer Portal `return_url` in `billing.ts:158` points to `/dashboard/billing`, but that route is just a redirect to `/dashboard/settings?tab=billing`. This causes an unnecessary redirect hop after the user exits the Stripe portal. It should point directly to `/dashboard/settings?tab=billing` for consistency with the checkout success/cancel URLs.

### 2. Missing Webhook Events

The current implementation handles 5 events. Stripe best practices recommend additional events:

| Event                                  | Current     | Impact                                                                                                                                                 |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checkout.session.completed`           | Handled     | --                                                                                                                                                     |
| `customer.subscription.updated`        | Handled     | --                                                                                                                                                     |
| `customer.subscription.deleted`        | Handled     | --                                                                                                                                                     |
| `invoice.paid`                         | Handled     | --                                                                                                                                                     |
| `invoice.payment_failed`               | Handled     | --                                                                                                                                                     |
| `customer.subscription.created`        | **Missing** | Low risk — `checkout.session.completed` covers initial creation. Could matter if subscriptions are created outside Checkout (API, portal resubscribe). |
| `invoice.upcoming`                     | **Missing** | Medium value — allows pre-renewal actions (usage warnings, upsell prompts). Not blocking for MVP.                                                      |
| `customer.subscription.trial_will_end` | **N/A**     | EmitHQ has no trial period — not needed.                                                                                                               |

**Assessment:** The missing events are nice-to-haves, not blockers. The `checkout.session.completed` handler already covers initial subscription creation. `customer.subscription.created` would only matter if a customer resubscribes through the portal without going through Checkout, which is edge-case behavior.

### 3. Checkout Flow — Per-Tier Verification Needed

Each of the 6 price combinations (3 tiers x 2 intervals) needs sandbox verification:

| Tier    | Monthly           | Annual            | Notes                                  |
| ------- | ----------------- | ----------------- | -------------------------------------- |
| Starter | `price_1TBST4...` | `price_1TBSTF...` | Verify $49/mo and $39/mo ($468/yr)     |
| Growth  | `price_1TBSTF...` | `price_1TBSTF...` | Verify $149/mo and $119/mo ($1,428/yr) |
| Scale   | `price_1TBSTG...` | `price_1TBSTG...` | Verify $349/mo and $279/mo ($3,348/yr) |

The test should verify:

1. Checkout session creates successfully for each tier/interval combination
2. Webhook fires with correct `checkout.session.completed` event
3. Org record updates: `tier`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus: 'active'`, `currentPeriodEnd`
4. Quota headers reflect new tier limits on subsequent API calls
5. Dashboard billing tab shows updated plan name, price, and usage bar with new limit

### 4. Subscription Lifecycle E2E Gaps

The following lifecycle scenarios have no E2E coverage:

- **Upgrade (Starter→Growth):** User clicks "Upgrade" on Growth card → portal opens → plan changes → `customer.subscription.updated` fires → org tier updates. Currently the dashboard routes active subscribers to the portal for plan changes, which is correct.
- **Downgrade (Growth→Starter):** Same flow via portal. Need to verify tier and limits update correctly.
- **Cancel:** Portal cancel → `customer.subscription.updated` (with `cancel_at_period_end: true`) → status shows "Canceling" → after period end, `customer.subscription.deleted` fires → resets to free.
- **Payment failure:** `invoice.payment_failed` → status shows "Past Due" → dashboard shows warning banner with portal link.
- **Event count reset:** `invoice.paid` on renewal → `eventCountMonth` resets to 0.

### 5. DASHBOARD_URL Configuration

The checkout `success_url` and `cancel_url` use `process.env.DASHBOARD_URL || 'http://localhost:4002'`. T-076 requires verifying this is set to `https://app.emithq.com` on Railway. If missing, Stripe Checkout will redirect users to `localhost:4002` after payment — a critical production bug.

### 6. Abuse Vectors

| Vector                        | Risk   | Current Mitigation                                                                                | Recommended                             |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Free tier multi-account       | Medium | Signup rate limit (3/IP/day, in-memory)                                                           | T-065: Card-on-file gate for free tier  |
| Tier spoofing (direct DB)     | None   | Webhook handler is the only tier updater; no API for self-setting tier                            | N/A                                     |
| Webhook replay                | Low    | Idempotency via `billingEvents.stripeEventId` unique constraint                                   | Already mitigated                       |
| Checkout session manipulation | None   | Price ID is set server-side from env vars, not from client input                                  | N/A                                     |
| Card testing                  | Low    | No payment form — Stripe Checkout handles card input                                              | Stripe Radar (enabled by default)       |
| Subscription sharing          | Low    | One org per Clerk user. API keys per org.                                                         | Monitor via analytics                   |
| Free→paid cycling             | Low    | `checkout.session.completed` creates Stripe customer; cancel resets to free but customer persists | Acceptable — Stripe tracks the customer |
| Quota bypass via direct API   | None   | `quotaCheck` middleware runs on message ingestion, reads from DB                                  | Already mitigated                       |

**Key finding:** The biggest abuse vector is free tier multi-account signup (burner emails + VPN to bypass IP rate limit). This is explicitly deferred to T-065 (payment-gated access). For Show HN, the in-memory 3/IP/day limit and Clerk's email verification are sufficient.

### 7. Go-Live Migration Steps

Based on Stripe's [go-live checklist](https://docs.stripe.com/get-started/checklist/go-live) and the current codebase:

**Step 1: Create live Stripe products and prices**

```
3 products (Starter, Growth, Scale) × 2 prices each (monthly, annual) = 6 prices
```

- Create in Stripe Dashboard (live mode) or via API
- Use the same product names and price amounts as sandbox
- Note: Stripe objects in sandbox DO NOT transfer to live mode — must recreate

**Step 2: Create live webhook endpoint**

- URL: `https://api.emithq.com/api/v1/billing/webhook`
- Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- Copy the new webhook signing secret (`whsec_...`)

**Step 3: Update 1Password `EmitHQ/stripe` item**
Add live fields (or create a separate `stripe-live` item):

- `secret-key` → `sk_live_...`
- `webhook-secret` → new live `whsec_...`
- 6 `price-*` fields → new live `price_...` IDs

**Step 4: Update Railway env vars**
8 env vars to update on the API service:

1. `STRIPE_SECRET_KEY` → `sk_live_...`
2. `STRIPE_WEBHOOK_SECRET` → new `whsec_...`
3. `STRIPE_PRICE_STARTER_MONTHLY` → live price ID
4. `STRIPE_PRICE_STARTER_ANNUAL` → live price ID
5. `STRIPE_PRICE_GROWTH_MONTHLY` → live price ID
6. `STRIPE_PRICE_GROWTH_ANNUAL` → live price ID
7. `STRIPE_PRICE_SCALE_MONTHLY` → live price ID
8. `STRIPE_PRICE_SCALE_ANNUAL` → live price ID

Also verify: `DASHBOARD_URL=https://app.emithq.com` is set.

**Step 5: Verify live end-to-end**

- Create a real checkout session for Starter monthly
- Complete payment with real card
- Verify webhook fires and org updates
- Verify dashboard shows updated plan
- Cancel via portal and verify downgrade

**Step 6: Configure Stripe Customer Portal (live)**

- Enable plan changes between tiers (Starter ↔ Growth ↔ Scale)
- Enable cancellation
- Enable payment method updates
- Set business name, privacy/terms links

### 8. Stripe Customer Portal Configuration

The codebase creates portal sessions via `stripe.billingPortal.sessions.create()`, but there's no evidence of portal product configuration. Stripe Customer Portal requires:

- Business information (name, privacy policy URL, terms of service URL)
- Enabled features (cancellation, plan changes, payment method updates)
- Products/prices linked to the portal for plan switching

This must be configured in Stripe Dashboard (Settings → Billing → Customer Portal) in **both** sandbox and live mode. Without this, the portal may show a generic page without plan change options.

## Recommendation

**For T-076 implementation, address in this order:**

1. **Fix the portal return URL bug** — trivial one-liner in `billing.ts:158`
2. **Verify DASHBOARD_URL on Railway** — check via Railway CLI or dashboard
3. **Configure Stripe Customer Portal** — in sandbox first, verify plan switching works
4. **Run sandbox E2E test** — manual test of full checkout flow for at least 1 tier (Starter monthly), verify webhook fires, org updates, dashboard reflects change, cancel works
5. **Create live products/prices** — 3 products, 6 prices in Stripe Dashboard live mode
6. **Store live credentials** — update 1Password, then Railway env vars
7. **Create live webhook endpoint** — register in Stripe Dashboard
8. **Verify live E2E** — real card test for 1 tier

**Do not block on:**

- Missing `customer.subscription.created` / `invoice.upcoming` events — add post-launch
- Abuse prevention beyond current IP rate limiting — T-065 handles this
- Automated E2E for billing (requires real Stripe test mode in CI) — T-038 scope

## Sources

- Codebase: `packages/api/src/routes/billing.ts`, `packages/core/src/billing/stripe.ts`, `packages/api/src/middleware/quota.ts`, `packages/dashboard/src/app/dashboard/settings/page.tsx`
- Schema: `packages/core/src/db/schema.ts` (organizations, billingEvents tables)
- Tests: `packages/api/src/routes/billing.test.ts`, `packages/api/src/middleware/quota.test.ts`
- E2E: `packages/dashboard/e2e/account-management.spec.ts`, `packages/dashboard/e2e/api-journey.spec.ts`
- 1Password: `EmitHQ/stripe` — 8 fields, all sandbox (`sk_test_`, `whsec_`, `price_` prefixes)
- [Stripe Go-Live Checklist](https://docs.stripe.com/get-started/checklist/go-live)
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe Checkout Build Subscriptions](https://docs.stripe.com/payments/checkout/build-subscriptions)
- [Stripe Card Testing Prevention](https://docs.stripe.com/disputes/prevention/card-testing)
- [Stripe First-Party Fraud Trends](https://stripe.com/blog/analyzing-first-party-fraud-trends-account-free-trial-and-refund-abuse)
