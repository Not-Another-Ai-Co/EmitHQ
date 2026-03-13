# Decisions — EmitHQ

## DEC-001 | 2026-03-13 | Product Category: Webhook Infrastructure Platform

**Status:** Active
**Linked to:** T-001, T-002, T-003

**Context:** Researched middleware SaaS opportunities targeting $1M ARR. Evaluated webhook infrastructure, background job orchestration, and SOC2 readiness platforms.

**Decision:** Build a webhook infrastructure platform (both inbound and outbound) filling the $49-490/mo pricing gap.

**Alternatives considered:**
- Background job orchestration (Node.js) — higher complexity, stronger funded competition (Inngest)
- SOC2 pre-audit readiness — requires compliance domain expertise, sales-assisted GTM

**Consequences:** Product must achieve high reliability from day 1. Competes with Svix (MIT, a16z-backed), Hookdeck (proprietary), and Convoy (ELv2, YC W22).

---

## DEC-002 | 2026-03-13 | Pricing: Events-Based with Free/$49/$149/$349 Tiers

**Status:** Active
**Linked to:** T-003

**Context:** Analyzed competitor pricing (Svix $0/$490, Hookdeck $0/$39/$499, Convoy $0/$99) and buyer personas (Series A-C SaaS, $49-299/mo sweet spot).

**Decision:** 4-tier pricing: Free (100K events), Starter ($49, 500K), Growth ($149, 2M), Scale ($349, 10M). Retries free. Events = messages delivered.

**Alternatives considered:**
- Endpoint-based pricing — doesn't correlate with infrastructure cost
- API call pricing — conflates ingestion with management calls

**Consequences:** Must track per-tenant event counts for billing. Free tier hard limit forces upgrade. Overage pricing incentivizes tier upgrades.

---

## DEC-003 | 2026-03-13 | License: AGPL-3.0 Server + MIT SDKs

**Status:** Active
**Linked to:** T-005

**Context:** Evaluated MIT (Svix), ELv2 (Convoy), Apache 2.0 (Outpost), AGPL, and BSL for a bootstrapped solo-dev SaaS.

**Decision:** AGPL-3.0 for server (copyleft prevents SaaS clones), MIT for SDKs (maximum adoption). CLA for dual-licensing contributor code.

**Alternatives considered:**
- MIT — too permissive for solo founder; cloud providers could clone
- ELv2 — not OSI-approved; limits community trust
- BSL — source-available but not open-source; time-bomb complexity

**Consequences:** Corporate legal teams will prefer cloud over self-hosting (AGPL deterrent effect). Must implement CLA bot for contributors.

---

## DEC-004 | 2026-03-13 | Architecture: Edge/Origin Hybrid with CF Workers + Railway

**Status:** Active
**Linked to:** T-008

**Context:** Needed fast inbound webhook reception (<50ms) globally, plus reliable outbound delivery with persistent queue workers.

**Decision:** Cloudflare Workers for edge (inbound reception, signature verification, rate limiting). Railway for origin (API server, BullMQ workers, PostgreSQL access). QStash bridges edge→origin.

**Alternatives considered:**
- All-Railway — no edge presence, slower inbound reception
- All-Workers — can't run persistent queue consumers, no TCP connections
- Fly.io instead of Railway — comparable, but Railway has simpler DX

**Consequences:** Code must be portable between Workers and Node.js (Hono enables this). Edge code limited to 128MB memory, no filesystem.

---

## DEC-005 | 2026-03-13 | Multi-Tenancy: Shared Schema + PostgreSQL RLS

**Status:** Active
**Linked to:** T-008

**Context:** Webhook platforms serve thousands of tenants. Needed simple schema evolution and strong isolation.

**Decision:** Shared schema with `org_id` on every table. PostgreSQL Row-Level Security policies. `SET LOCAL app.current_tenant` per request.

**Alternatives considered:**
- Schema-per-tenant — migration complexity at N schemas
- Database-per-tenant — operational overhead, connection explosion

**Consequences:** Application DB role must NOT be superuser (bypasses RLS). Every query must set tenant context. Denormalize org_id on child tables for RLS performance.

---

## DEC-006 | 2026-03-13 | Entity: Nevada LLC

**Status:** Active
**Linked to:** T-004

**Context:** Solo bootstrapped SaaS, founder based in Nevada. Evaluated LLC vs C-Corp, Nevada vs Delaware.

**Decision:** Nevada LLC. Pass-through taxation, no state income tax, $425 formation + $350/year.

**Alternatives considered:**
- Delaware C-Corp — better for VC but unnecessary for bootstrapped; adds franchise tax + registered agent cost
- Nevada C-Corp — double taxation without VC benefit

**Consequences:** Convert to C-Corp if/when raising institutional VC or issuing employee stock options.

---

## DEC-007 | 2026-03-13 | Brand: EmitHQ

**Status:** Active
**Linked to:** T-009

**Context:** Needed a short, memorable, developer-friendly name not in the "Hook-" namespace.

**Decision:** EmitHQ. Domain: emithq.com. "Emit" is developer-native vocabulary (events emit). "HQ" avoids generic word conflicts and improves SEO.

**Alternatives considered:**
- Emit (bare) — emit.dev unavailable; generic word SEO challenges
- Herald — existing heraldapp on GitHub; common word
- Signet — Signet Jewelers dominates SEO
- Pylon — taken ($20M B2B support platform)

**Consequences:** All branding, code, and docs use "EmitHQ" as product name. Repo under Not-Another-Ai-Co GitHub org.
