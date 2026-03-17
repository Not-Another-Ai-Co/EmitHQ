# Research: Fully LLM-Automatable SaaS Onboarding for EmitHQ

**Date:** 2026-03-17
**Status:** Draft -- pending review

## Summary

LLM-automatable onboarding is achievable for EmitHQ with a phased approach: (1) add a public `POST /api/v1/signup` endpoint using Clerk Backend API for programmatic account creation, returning an API key in the same response, (2) expose machine-readable quota/billing signals via response headers, and (3) implement a payment-gated abuse prevention model where free tier requires Stripe payment method on file. No competitor in the webhook infrastructure space offers this today -- EmitHQ would be first-mover. The security model uses scoped, per-key permissions with full audit trails and immediate revocation.

## Current State

EmitHQ's onboarding today requires a browser:

1. **Account creation:** Clerk hosted UI at `accounts.emithq.com` -- no API bypass exists
2. **Org provisioning:** Auto-provisioned on first Clerk login via `requireAuth` middleware (`packages/api/src/middleware/auth.ts` lines 109-143)
3. **API key creation:** `POST /api/v1/auth/keys` requires Clerk session + `org:admin` or `org:owner` role -- LLM cannot call this without a browser-obtained session token
4. **Billing:** Stripe Checkout Sessions redirect to browser -- `POST /api/v1/billing/checkout` returns a URL, not a programmatic flow

**Current auth flow (blocking LLM automation):**

```
Browser → Clerk hosted UI → Clerk session token → API → auto-provision org → create API key
```

**Required flow for LLM automation:**

```
LLM → POST /api/v1/signup {email, password} → {org_id, api_key} → use API immediately
```

Key files:

- `/home/jfinnegan0/EmitHQ/packages/api/src/middleware/auth.ts` -- dual auth (Clerk session + API key)
- `/home/jfinnegan0/EmitHQ/packages/api/src/routes/api-keys.ts` -- API key CRUD (Clerk session required)
- `/home/jfinnegan0/EmitHQ/packages/api/src/routes/billing.ts` -- Stripe Checkout (browser redirect)
- `/home/jfinnegan0/EmitHQ/packages/core/src/auth/api-key.ts` -- key generation (`emhq_` prefix, SHA-256 hash)
- `/home/jfinnegan0/EmitHQ/packages/api/src/middleware/quota.ts` -- monthly quota enforcement

## Findings

### 1. API-Only Account Creation (Bypassing Clerk Hosted UI)

**Clerk Backend API supports programmatic user creation:**

```bash
curl 'https://api.clerk.com/v1/users' -X POST \
  -H 'Authorization: Bearer CLERK_SECRET_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email_address": ["user@example.com"], "password": "secure-password"}'
```

Key details:

- Email addresses created via Backend API are **automatically marked as verified** -- no email confirmation loop
- `createUser()` supports `publicMetadata`, `privateMetadata` for storing onboarding source
- After user creation, use `createOrganization()` to create the Clerk org programmatically
- Both operations require `CLERK_SECRET_KEY` (server-side only)

**Three implementation options:**

| Option                                  | How                                                                                                                | Pros                                        | Cons                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **A. Clerk Backend API wrapper**        | New `POST /api/v1/signup` calls Clerk Backend API to create user + org, then auto-provisions EmitHQ org + API key  | Full Clerk integration, existing auth works | Clerk dependency on signup path, extra API calls |
| **B. API-key-first with deferred auth** | New `POST /api/v1/signup` creates org + API key directly (no Clerk user), Clerk account linked later via dashboard | Fastest LLM path, zero browser dependency   | Two-track auth, org exists without Clerk user    |
| **C. Custom signup endpoint + Clerk**   | New endpoint creates Clerk user + org + EmitHQ org + API key in one atomic flow                                    | Single request, complete setup              | Most complex, but most correct                   |

**Recommendation: Option C** -- single `POST /api/v1/signup` that:

1. Creates Clerk user via Backend API (`createUser`)
2. Creates Clerk org via Backend API (`createOrganization`)
3. Auto-provisions EmitHQ org row (reuses existing auto-provision logic)
4. Generates first API key
5. Returns `{ orgId, apiKey, userId }` in one response

### 2. Secure Credential Handoff to LLMs

**The problem:** When an LLM creates an account, it receives an API key. Where does that key go safely?

**1Password SDK integration (recommended):**

- 1Password SDKs (JS, Python, Go) support `secrets.resolve()` for runtime credential injection
- Service accounts provide read-only scoped access to specific vaults
- Pattern: LLM receives API key → stores in 1Password via SDK → retrieves at runtime via `op://` reference
- 1Password explicitly supports this use case with a [tutorial for AI agent integration](https://developer.1password.com/docs/sdks/ai-agent/)

**Important caveat from 1Password:** Their docs note this SDK approach is "not our recommended integration approach" for production. They recommend:

- Short-lived tokens over long-lived API keys
- Minimize model access to sensitive data
- Use brokered credentials pattern (proxy makes API calls, LLM never sees the key)

**Brokered Credentials pattern (most secure):**

```
LLM → "create webhook endpoint" → Broker Service → (injects API key) → EmitHQ API
```

The LLM never handles the raw API key. A trusted intermediary (MCP server, proxy) holds credentials and makes calls on behalf of the agent.

**EmitHQ response design for credential handoff:**

```json
{
  "data": {
    "orgId": "uuid",
    "apiKey": "emhq_...",
    "credential_storage_hint": {
      "1password": "op item create --vault EmitHQ --title 'EmitHQ API Key' --category 'API Credential' 'credential=emhq_...'",
      "env_var": "EMITHQ_API_KEY"
    }
  }
}
```

### 3. Abuse Prevention

**The tension:** Free tier (100K events/mo) is vulnerable to bot-driven multi-account abuse, but blocking LLM automation defeats the purpose.

**Recommended multi-layer approach:**

| Layer                             | Mechanism                                                    | Blocks Abuse? | Blocks Legit LLMs?               |
| --------------------------------- | ------------------------------------------------------------ | ------------- | -------------------------------- |
| **Payment method on file**        | Require Stripe SetupIntent (card-on-file) even for free tier | Strong        | No -- LLMs can pass card via API |
| **Email domain scoring**          | Flag disposable email providers (mailinator, guerrillamail)  | Moderate      | No                               |
| **IP rate limiting**              | Max 3 signups per IP per day (already spec'd in T-042)       | Moderate      | Rarely                           |
| **Phone verification (optional)** | SMS OTP for flagged signups                                  | Strong        | Yes -- breaks automation         |
| **Usage velocity detection**      | Flag orgs hitting 100K free limit within 48 hours            | Moderate      | No                               |

**Recommendation: Payment-gated free tier**

- Free tier requires a valid Stripe payment method on file (SetupIntent, no charge)
- This is the single strongest anti-abuse signal that doesn't break LLM automation
- Stripe's `POST /v1/setup_intents` can be called programmatically (no browser needed with `confirm: true` + `payment_method_data`)
- Card validation costs $0.00 (Stripe doesn't charge for SetupIntents)
- Pattern used by: AWS, Vercel, Railway, Render, Fly.io

**Fallback for truly headless LLMs (no card):**

- Offer a 7-day trial with 10K event limit (no card required)
- After 7 days, require card-on-file to continue
- Provides enough runway for LLM to prove value before requiring payment credentials

### 4. Quota and Billing Signals (Machine-Readable)

LLM agents need to know when limits are approaching and what to do about it. Current quota middleware returns a 429 error at the limit -- no advance warning.

**Recommended response headers on every API response:**

```
X-EmitHQ-Quota-Limit: 100000
X-EmitHQ-Quota-Used: 87500
X-EmitHQ-Quota-Remaining: 12500
X-EmitHQ-Quota-Reset: 2026-04-01T00:00:00Z
X-EmitHQ-Tier: free
```

**Warning header at 80% and 95% thresholds:**

```
X-EmitHQ-Quota-Warning: approaching_limit
X-EmitHQ-Upgrade-URL: https://api.emithq.com/api/v1/billing/checkout
```

**429 response body (machine-actionable):**

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Monthly event limit reached.",
    "quota": {
      "limit": 100000,
      "used": 100000,
      "reset_at": "2026-04-01T00:00:00Z",
      "tier": "free"
    },
    "action": {
      "type": "upgrade",
      "url": "/api/v1/billing/checkout",
      "tiers": [
        { "name": "starter", "price": 49, "limit": 500000 },
        { "name": "growth", "price": 149, "limit": 2000000 },
        { "name": "scale", "price": 349, "limit": 10000000 }
      ]
    }
  }
}
```

**Why this matters:** An LLM agent receiving this response can autonomously decide to upgrade, or report the situation to the human operator with actionable options. Without structured quota data, the LLM just sees "429" and retries uselessly.

### 5. Competitive Landscape

**No webhook infrastructure platform offers fully LLM-automatable onboarding today.**

| Platform              | Account Creation         | API-Only?                     | LLM-Ready? |
| --------------------- | ------------------------ | ----------------------------- | ---------- |
| **Svix**              | Dashboard + email invite | Partial (self-hosted has API) | No         |
| **Hookdeck**          | Dashboard signup         | No                            | No         |
| **Convoy**            | Dashboard or CLI         | Partial (CLI)                 | No         |
| **EmitHQ (proposed)** | `POST /api/v1/signup`    | Yes                           | Yes        |

**Broader SaaS landscape:**

- **Stripe** -- closest to API-only, but still requires browser for some payment flows
- **Twilio** -- API-first signup exists but requires console for initial setup
- **Resend** -- API key via dashboard only
- **Railway** -- CLI-based, but account creation requires browser
- **Vercel** -- fully browser-dependent signup

**The opportunity:** Agent-operability is becoming a competitive moat. Gartner projects 60% of enterprise workflows will involve AI agents by 2026. Being the first webhook platform where an LLM can go from zero to sending webhooks without a browser is a genuine differentiator. The DEV Community article on [agent-operability](https://dev.to/bridgeai/agent-operability-is-the-next-saas-standard-what-founders-need-to-know-3kf7) argues this is becoming "the next SaaS standard."

**Adjacent standards emerging:**

- `agents.json` -- machine-readable capability manifest (like robots.txt for agents)
- `llm.txt` -- site information optimized for LLM consumption
- MCP (Model Context Protocol) -- standardized tool interface for agents

### 6. Security Model

**Guardrails for LLM-controlled accounts:**

**a. API Key Scoping (new capability)**

Current EmitHQ API keys are org-level with full access. For LLM safety, add optional scopes:

```json
{
  "scopes": ["messages:write", "endpoints:read", "endpoints:write"],
  "restrictions": {
    "ip_allowlist": ["203.0.113.0/24"],
    "rate_limit": 100 // requests per minute
  }
}
```

Key principles from the [State of AI Agent Security 2026](https://grantex.dev/report/state-of-agent-security-2026) report:

- 93% of AI agent projects use unscoped API keys (vulnerability)
- 100% have no granular revocation capability
- 87% provide no audit logging

**b. Audit Trail**

Every API call already has `orgId` and `authType` in context. Extend to log:

- Key ID used for each request
- IP address and user-agent
- Action performed (method + path + key params)
- Store in `audit_log` table with 90-day retention

**c. Revocation**

Already implemented via soft-delete (`revokedAt` column on `api_keys`). Current capability is sufficient -- immediate revocation, multiple active keys per org for zero-downtime rotation.

**d. Emergency Kill Switch**

Already spec'd in T-042: admin endpoint to disable an organization immediately. Add: auto-disable on anomalous usage patterns (10x normal volume in 1 hour).

**e. On-Behalf-Of (OBO) Pattern (future)**

The gold standard for agent security: LLM presents both the user's authorization token and its own agent identity. The API issues a scoped token containing claims for both, creating an auditable chain of command. This is a post-MVP enhancement.

## Recommendation

**Phased implementation:**

### Phase 1: API-Only Signup (Medium effort)

1. Add `POST /api/v1/signup` endpoint:
   - Input: `{ email, password, orgName? }`
   - Creates Clerk user + org via Backend API
   - Auto-provisions EmitHQ org + first API key
   - Returns `{ orgId, apiKey }` in single response
   - Rate limit: 3 signups per IP per day
2. Add machine-readable quota headers to all responses
3. Enrich 429 response with structured upgrade information

### Phase 2: Abuse Prevention (Low effort)

1. Payment-method-on-file gate for free tier (Stripe SetupIntent)
2. Disposable email domain blocklist
3. Usage velocity detection (flag 100K in 48h)
4. 7-day no-card trial option (10K event cap)

### Phase 3: Security Hardening (Medium effort)

1. API key scoping (optional `scopes` array on key creation)
2. Audit log table + middleware
3. Auto-disable on anomalous usage patterns
4. `agents.json` manifest for agent discovery

### Phase 4: Agent Ecosystem (Low effort, high signal)

1. MCP server for EmitHQ (tool interface for Claude/other LLMs)
2. `llm.txt` at `emithq.com/llm.txt`
3. 1Password credential storage hints in signup response
4. SDK method: `EmitHQ.signup({ email, password })` -- wraps the API call

**Alternatives considered:**

- **API-key-first with no Clerk user:** Simpler but creates orphan accounts with no email for recovery, billing, or communication. Rejected.
- **OAuth2 device flow:** Standard for CLI tools but overkill -- EmitHQ API keys are simpler and the LLM doesn't need an access token with refresh cycles.
- **Clerk API keys (beta):** Clerk now offers machine auth API keys, but they're scoped to Clerk's auth system, not EmitHQ's resource model. Our custom `emhq_` keys give more control over scoping, revocation, and audit.
- **CAPTCHA on signup:** Defeats LLM automation entirely. Payment-on-file is a stronger abuse signal that doesn't block agents.

## Sources

- [Clerk createUser() Backend API](https://clerk.com/docs/reference/backend/user/create-user) -- programmatic user creation, auto-verified emails
- [Clerk Machine Auth API Keys](https://clerk.com/docs/guides/development/machine-auth/api-keys) -- Clerk's native API key feature (beta)
- [1Password SDK AI Agent Tutorial](https://developer.1password.com/docs/sdks/ai-agent/) -- integrating 1Password with AI agents for credential storage
- [1Password Agentic AI Security](https://1password.com/solutions/agentic-ai) -- secure credential management for autonomous agents
- [Agent-Operability: The Next SaaS Standard](https://dev.to/bridgeai/agent-operability-is-the-next-saas-standard-what-founders-need-to-know-3kf7) -- requirements for agent-operable products
- [State of AI Agent Security 2026 (Grantex)](https://grantex.dev/report/state-of-agent-security-2026) -- audit of 30 agent projects, 93% use unscoped keys
- [Stripe SetupIntents API](https://docs.stripe.com/api/setup_intents) -- programmatic payment method collection
- [Stripe Subscriptions API](https://docs.stripe.com/api/subscriptions/create) -- API-only subscription creation
- [Composio: Secure AI Agent Infrastructure Guide](https://composio.dev/content/secure-ai-agent-infrastructure-guide) -- brokered credentials, OBO pattern
- [Deloitte: SaaS meets AI agents](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/saas-ai-agents.html) -- market trends, agentic SaaS
- `packages/api/src/middleware/auth.ts` -- current dual auth implementation
- `packages/api/src/routes/api-keys.ts` -- API key CRUD routes
- `packages/api/src/routes/billing.ts` -- Stripe billing integration
- `packages/core/src/auth/api-key.ts` -- key generation and verification
- `packages/api/src/middleware/quota.ts` -- monthly quota enforcement
