# EmitHQ — Project Instructions

## What This Is

EmitHQ is an open-source webhook infrastructure platform (AGPL-3.0 server + MIT SDKs). It handles both inbound (receiving webhooks from Stripe/GitHub/etc.) and outbound (sending webhooks to customers' endpoints) with fair pricing ($49-349/mo) filling the gap between free tiers and $490+ enterprise platforms.

## Tech Stack

- **Edge:** Cloudflare Workers (inbound reception, signature verification, rate limiting)
- **Origin:** Node.js + Hono on Railway (API server, BullMQ delivery workers)
- **Database:** Neon PostgreSQL (RLS multi-tenancy, shared schema)
- **Queue:** BullMQ on Upstash Redis (outbound delivery), QStash (edge→origin relay)
- **Auth:** Clerk
- **Payments:** Stripe (usage-based billing)
- **Language:** TypeScript (strict mode)

## Architecture

See @docs/research/technical-architecture.md for full details.

**Key patterns:**

- Persist message to PostgreSQL BEFORE enqueueing to Redis
- Standard Webhooks spec for outbound signing (HMAC-SHA256)
- RLS (`SET LOCAL app.current_tenant`) on every request — never rely on WHERE clauses alone
- Edge returns 200 immediately, delivery happens async via BullMQ workers
- `crypto.timingSafeEqual` for ALL signature verification — never string equality

## Documentation

- @docs/TICKETS.md — Current work tracking
- @docs/CONVENTIONS.md — Coding patterns and conventions

**Environment context:** This machine uses a 1Password service account (`minipc-cli`) with read-only access. Token is in `~/.bashrc` as `OP_SERVICE_ACCOUNT_TOKEN`. SSH key is configured for GitHub (`ssh -T git@github.com` works). Git remote protocol is HTTPS (via `gh`); SSH also available. EmitHQ vault verified (5 items, vault ID `xs5ek3axtys2twnjpniwmczbyi`).

## Monorepo Structure

```
packages/
  core/     — Delivery engine, retry logic, signing, queue workers
  api/      — REST API server (Hono)
  dashboard/ — Web dashboard (Next.js or similar)
  sdk/      — TypeScript SDK (published to npm)
```
