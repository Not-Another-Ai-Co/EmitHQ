# Research: Stripe Webhook Delivery 401 Diagnosis

**Date:** 2026-03-19
**Status:** Draft — pending review
**Linked to:** T-076

## Summary

The Stripe webhook endpoint at `/api/v1/billing/webhook` returns 401 for all events. After analyzing the codebase, Hono middleware architecture, Stripe SDK behavior, and deployment configuration, there are 4 possible root causes ranked by likelihood. The most probable is a **webhook signing secret mismatch** — either between test/live modes, between Stripe CLI (`stripe listen`) and dashboard-configured endpoints, or between what's in 1Password and what's deployed on Railway. Two secondary causes involve Hono middleware ordering quirks and Stripe API version incompatibility.

## Current State

### Code Architecture (Correct)

The webhook handler in `packages/api/src/routes/billing.ts` (line 172-249) is properly structured:

- Exported as a separate `billingWebhookRoute` Hono instance (not behind `requireAuth`)
- Uses `c.req.text()` for raw body (correct per Hono docs and Stripe Hono example)
- Uses `stripe.webhooks.constructEvent()` (synchronous, correct for Node.js runtime)
- Mounted BEFORE Clerk middleware in `packages/api/src/index.ts` (line 87, vs Clerk at line 90)

### The 401 Response Paths

The handler returns 401 in exactly two cases:

1. **Line 178-183:** Missing `stripe-signature` header → `{ error: { code: 'unauthorized', message: 'Missing stripe-signature header' } }`
2. **Line 199-201:** `constructEvent` throws → `{ error: { code: 'unauthorized', message: 'Invalid webhook signature' } }`

Stripe always sends the `stripe-signature` header, so path 1 is unlikely unless something strips it. Path 2 (signature verification failure) is the probable cause.

## Findings

### 1. Most Likely: Webhook Signing Secret Mismatch

Stripe uses **separate signing secrets** for:

- **Dashboard-configured webhook endpoints** — each endpoint gets its own `whsec_...` secret
- **`stripe listen` CLI** — generates a temporary secret (printed in terminal)
- **Test mode vs. Live mode** — different secrets even for the same endpoint URL

The 1Password item `EmitHQ/stripe` contains a `webhook-secret` field (currently `whsec_cwsUwx...` per the existing research doc). The critical question is whether the secret stored in 1Password matches the secret configured on the **specific Stripe webhook endpoint** that's sending events.

**Common failure scenarios:**

- The endpoint URL registered in Stripe Dashboard (test mode) is `https://api.emithq.com/api/v1/billing/webhook`, but the signing secret in 1Password is from a different endpoint or from `stripe listen`
- The 1Password secret was updated (item updated 46 minutes ago) but Railway hasn't been redeployed with the new value
- Stripe Dashboard has a test mode endpoint AND a live mode endpoint, and the wrong secret was stored

**Diagnosis steps:**

1. Open Stripe Dashboard → Developers → Webhooks (in test mode)
2. Click the webhook endpoint for `https://api.emithq.com/api/v1/billing/webhook`
3. Click "Reveal" on the signing secret
4. Compare it byte-for-byte with the value in 1Password `EmitHQ/stripe/webhook-secret`
5. Check Railway env vars — verify `STRIPE_WEBHOOK_SECRET` is populated and matches

### 2. Possible: Hono Middleware Ordering Issue

There is a [known Hono behavior](https://github.com/honojs/hono/issues/3361) where `app.use('*', middleware)` applies to **ALL routes** regardless of registration order. This means the Clerk middleware (line 90) runs on the webhook route (line 87) even though the route is registered first.

**However**, after examining the [@hono/clerk-auth source code](https://github.com/honojs/middleware/blob/main/packages/clerk-auth/src/clerk-auth.ts), the `clerkMiddleware()` function:

- Passes `c.req.raw` to `clerkClient.authenticateRequest()` (reads headers only, NOT body)
- Does NOT consume or parse the request body
- Calls `await next()` regardless of authentication result (it just sets auth state)

**Verdict:** Clerk middleware running on the webhook route is harmless — it reads headers, sets context, and passes through. It does NOT consume the body or block unauthenticated requests. This is **not** the cause of the 401.

The `quotaHeaders` middleware (`app.use('/api/v1/*', quotaHeaders)` at line 93) also matches the webhook path, but it calls `await next()` first and only reads `orgId` afterward (returns early if unset). Also harmless.

### 3. Possible: Request Body Encoding Issue

Stripe SDK's `constructEvent` requires the raw body as a UTF-8 string, exactly as received. In Hono on `@hono/node-server`, `c.req.text()` returns the body as a UTF-8 string, which matches what Stripe expects. The [Hono Stripe Webhook example](https://hono.dev/examples/stripe-webhook) uses exactly this approach.

There is a [GitHub issue (#3083)](https://github.com/honojs/hono/issues/3083) discussing whether Hono alters the body via `.text()`. The conclusion: on Node.js, `.text()` returns the body as-is (UTF-8 string). On Cloudflare Workers, there were reports of encoding differences, but EmitHQ runs on `@hono/node-server`, not Workers.

**Verdict:** Body encoding is unlikely to be the issue on Node.js. If it were, the error message from `constructEvent` would be "No signatures found matching the expected signature for payload" — worth checking the actual error being thrown (currently swallowed by the catch block on line 199).

### 4. Unlikely: Stripe API Version Mismatch

The `Stripe` constructor in `packages/core/src/billing/stripe.ts` creates the client with `new Stripe(key)` — no explicit API version. The SDK defaults to the version it was compiled against (stripe@20.4.1). If the Stripe Dashboard account's API version differs significantly, event payloads might be structured differently, but this would not cause signature verification to fail — signature verification is version-independent.

**Verdict:** Not a cause of the 401.

### 5. Diagnostic Improvement: Error Details Are Swallowed

The current catch block (line 199-201) swallows the error details:

```typescript
} catch {
  return c.json({ error: { code: 'unauthorized', message: 'Invalid webhook signature' } }, 401);
}
```

The actual Stripe error message (e.g., "No signatures found matching the expected signature for payload" vs "Webhook payload must be provided as a string") would tell us exactly which failure mode we're hitting. This should be logged.

## Recommendation

**Immediate diagnosis (Julian, manual):**

1. **Check Stripe Dashboard** — go to Developers → Webhooks → your endpoint → Reveal signing secret. Compare with 1Password `EmitHQ/stripe/webhook-secret`.
2. **Check Railway env vars** — verify `STRIPE_WEBHOOK_SECRET` is set and current. If using 1Password integration on Railway, verify it's pulling from the right field.
3. **Check Stripe Dashboard event log** — Developers → Webhooks → your endpoint → Recent deliveries. Click a failed delivery. The response body will show whether it's "Missing stripe-signature header" or "Invalid webhook signature" — this narrows the cause.

**Code fix (regardless of root cause):**

1. **Log the actual error** from `constructEvent` — change the catch block to log `err.message` so future failures are diagnosable:

   ```typescript
   } catch (err) {
     const msg = err instanceof Error ? err.message : 'Unknown verification error';
     console.error(`Stripe webhook signature verification failed: ${msg}`);
     return c.json({ error: { code: 'unauthorized', message: 'Invalid webhook signature' } }, 401);
   }
   ```

2. **Consider using `constructEventAsync`** — the Hono official example uses the async version. While both work on Node.js, the async version is the documented approach for Hono.

**If the secret matches but verification still fails:**

3. **Test with `stripe listen --forward-to`** — use the Stripe CLI to forward events to `http://localhost:4000/api/v1/billing/webhook` locally. Use the CLI's signing secret (printed in terminal). This isolates whether the issue is secret mismatch, body encoding, or something in the Railway deployment.

4. **Add a debug endpoint** (temporary) that logs the raw body length, first 50 chars of signature header, and webhook secret prefix to verify all three inputs to `constructEvent` are present and well-formed.

## Stripe Sandbox Webhook Behavior

For reference, Stripe sandbox (test mode) webhook delivery:

- Retries failed deliveries **3 times** over a few hours (vs. 3 days in live mode)
- Uses the **same signing mechanism** as live mode (HMAC-SHA256)
- Signs events with the **endpoint-specific** secret (different from `stripe listen` CLI secret)
- Event payloads have `livemode: false` field
- Test and live endpoints have **different signing secrets** even for the same URL

## Sources

- Codebase: `packages/api/src/routes/billing.ts`, `packages/api/src/index.ts`, `packages/api/src/middleware/auth.ts`, `packages/core/src/billing/stripe.ts`
- [Hono Stripe Webhook Example](https://hono.dev/examples/stripe-webhook)
- [Stripe: Resolve webhook signature verification errors](https://docs.stripe.com/webhooks/signature)
- [Hono Issue #3361: Middleware matches all routes](https://github.com/honojs/hono/issues/3361)
- [Hono Issue #3083: Does Hono alter the request body?](https://github.com/honojs/hono/issues/3083)
- [Hono Issue #1561: Stripe webhooks Express middleware](https://github.com/honojs/hono/issues/1561)
- [@hono/clerk-auth source code](https://github.com/honojs/middleware/blob/main/packages/clerk-auth/src/clerk-auth.ts)
- [Stripe CLI: stripe listen signing secret](https://github.com/stripe/stripe-cli/issues/475)
- [Stripe webhook delivery troubleshooting](https://support.stripe.com/questions/troubleshooting-webhook-delivery-issues)
- Existing research: `docs/research/stripe-billing-e2e-verification.md`
