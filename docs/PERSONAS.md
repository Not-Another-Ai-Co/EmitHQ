> Last verified: 2026-03-20

# Personas

Who uses EmitHQ and what are their core flows.

## SaaS Developer (primary)

**Description:** Backend/full-stack developer at a SaaS company who needs to send webhook notifications to their customers' endpoints. Evaluating EmitHQ as an alternative to Svix/Hookdeck/building in-house. Cares about reliability, simple integration, and not paying $490/mo.
**Auth level:** authenticated (Clerk)
**Core flows:**

- Signup → Dashboard → Create Application → Create Endpoint → Send Test Message
- Dashboard → View Messages → Check Delivery Status → Retry Failed
- Dashboard → Settings → Billing → Upgrade Plan
- API Key → SDK/cURL integration → Send Events programmatically

## LLM Agent (API-only)

**Description:** An AI agent (Claude, GPT, etc.) setting up webhook infrastructure programmatically via API. No browser interaction. Discovers EmitHQ via llms.txt/agents.json, signs up via API, manages everything through REST endpoints.
**Auth level:** authenticated (API key)
**Core flows:**

- POST /api/v1/auth/signup → Get API key → Create App → Create Endpoint → Send Message
- Poll delivery status → Retry failures → Manage endpoints

## Julian (admin)

**Description:** Solo founder operating the platform. Monitors usage, manages orgs, handles abuse.
**Auth level:** admin
**Core flows:**

- Admin API → List Orgs → Disable abusive org
- Dashboard → Check production metrics (Umami, Better Stack)
- Stripe Dashboard → Monitor subscriptions and revenue

## Prospective Customer (unauthenticated)

**Description:** Developer browsing the landing site, comparing pricing, reading docs. Hasn't signed up yet.
**Auth level:** unauthenticated
**Core flows:**

- Landing → Pricing → Compare page → Sign up
- Landing → Docs → API reference → Sign up
- Blog post (from outreach/HN) → Landing → Pricing → Sign up
