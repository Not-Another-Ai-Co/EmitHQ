# Research: Brand Identity & Naming
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-009

## Summary

7 name candidates presented, ranked by brand fit. Top recommendation: **Emit** — short, evocative (events emit signals), unique in the webhook space, developer-friendly. Domain candidates: emit.dev, emithq.com, useemit.com. Julian to verify domain availability and register.

## Naming Criteria

1. **Short** — 4-6 characters ideal (Svix = 4, n8n = 3)
2. **No "Hook-" prefix** — oversaturated (Hookdeck, HookRelay, HostedHooks, HookCatcher)
3. **Evocative of delivery/events/signals** — not generic
4. **Easy to spell and say** — no ambiguity in spoken conversation
5. **Available** — domain, GitHub org, npm package
6. **Not a real word with strong existing associations** — avoids SEO competition

## Name Candidates (Ranked)

### 1. Emit (RECOMMENDED)
- **Meaning:** To send out, to transmit a signal. Events "emit" — it's the exact verb developers use.
- **Why it works:** Short (4 chars), developer-native vocabulary (`emitter`, `emit event`), no existing webhook product with this name, works as both noun and verb ("Emit your webhooks" / "Built on Emit")
- **Domain candidates:** `emit.dev`, `emithq.com`, `useemit.com`, `getemit.com`
- **npm:** `@emit/sdk`, `emit-webhooks`
- **GitHub:** `emithq` or `emit-dev`
- **Risk:** "emit" is a common programming term — may have SEO challenges for the bare word. Mitigated by targeting "Emit webhooks" compound keywords.
- **Tagline options:** "Webhooks that just work." / "Reliable webhooks, fair pricing." / "The open-source webhook platform."

### 2. Signet
- **Meaning:** A small seal used to authenticate documents. Evokes signing, verification, trust.
- **Why it works:** Unique, professional, hints at HMAC signing (core security feature), 6 chars
- **Domain candidates:** `signet.dev`, `signethq.com`, `usesignet.com`
- **Risk:** Signet Jewelers is a major brand (SEO conflict). "Signet ring" dominates search.

### 3. Herald
- **Meaning:** A messenger, one who announces. Evokes event notification delivery.
- **Why it works:** Strong metaphor for webhook delivery, memorable, 6 chars
- **Domain candidates:** `herald.dev`, `heraldhq.com`, `useherald.com`
- **Risk:** heraldapp exists (user feedback tool on GitHub). Herald is a common word — SEO competition. Multiple existing projects use this name.

### 4. Dispatch
- **Meaning:** To send off to a destination. Exactly what webhooks do.
- **Why it works:** Clear, action-oriented, developer-friendly, 8 chars
- **Domain candidates:** `dispatch.dev`, `dispatchhq.com`, `getdispatch.dev`
- **Risk:** Common word, many companies named Dispatch (logistics, support). Svix internally calls their delivery service "dispatcher." Higher SEO competition.

### 5. Relay
- **Meaning:** To pass along, to transmit. Webhooks relay events between systems.
- **Why it works:** Perfect metaphor, 5 chars, developer-familiar
- **Domain candidates:** `relay.dev` (likely taken), `getrelay.dev`, `relayhq.com`
- **Risk:** HookRelay already exists in webhook space. Facebook's Relay (GraphQL framework) dominates search. Very common word.

### 6. Conduit
- **Meaning:** A channel for conveying. Events flow through a conduit.
- **Why it works:** Evocative, professional, 7 chars, less common than Relay/Dispatch
- **Domain candidates:** `conduit.dev`, `conduithq.com`, `useconduit.com`
- **Risk:** Conduit.io exists (data streaming tool by Meroxa). Some SEO conflict.

### 7. Hoist
- **Meaning:** To raise, to lift up. Hoist your events to their destination.
- **Why it works:** Short (5 chars), unique in dev tools, memorable
- **Domain candidates:** `hoist.dev`, `hoisthq.com`, `usehoist.com`
- **Risk:** Less intuitive connection to webhooks. "Hoisting" has a specific JS meaning (variable hoisting) that could confuse.

## Brand Positioning Statement

**Template:** `[Product] is the open-source webhook platform that [key differentiator] for [target customer].`

**For Emit:**
> Emit is the open-source webhook platform with fair pricing for growing SaaS teams.

**Alternative positionings:**
- Reliability angle: "Emit: Reliable webhooks without the enterprise price tag."
- Pricing angle: "Emit: Webhook infrastructure from $49/mo. Not $490."
- Open-source angle: "Emit: The open-source webhook platform you can trust and afford."

## Tagline Options (Top 5)

1. **"Webhooks that just work."** — Simple, confidence-inspiring. Echoes what Svix customers say.
2. **"Reliable webhooks, fair pricing."** — Directly addresses the market gap.
3. **"The webhook platform for growing teams."** — Targets Series A-C buyers.
4. **"Send webhooks. Sleep at night."** — Reliability + humor.
5. **"Open-source webhooks. Managed or self-hosted."** — Clear value prop for dev audience.

## Visual Identity Direction

### Color Palette (Developer Tool Aesthetic)
- **Primary:** Electric indigo or deep violet (#6366F1 or #7C3AED) — stands out from competitor blues (Svix blue, Hookdeck blue, Convoy dark)
- **Secondary:** Warm white (#FAFAF9) for backgrounds
- **Accent:** Emerald green (#10B981) for success states, amber (#F59E0B) for warnings
- **Dark mode:** Slate/zinc backgrounds (#18181B) — developers expect dark mode

### Typography
- **Headings:** Inter or Cal Sans (modern, clean, developer-friendly)
- **Body:** Inter or system font stack
- **Code:** JetBrains Mono or Fira Code

### Logo Direction
- **Style:** Wordmark + simple icon. Clean, geometric.
- **Icon concepts:**
  - Arrow/signal emanating from a point (emit concept)
  - Stylized "E" with motion lines
  - Simple webhook bracket → arrow symbol
- **Keep minimal** — developer tools should look technical, not playful. Reference: Svix (simple wordmark), Vercel (triangle), Railway (track icon).

## Julian Action Items

- [ ] **Verify domain availability** for top 3 candidates:
  1. `emit.dev` (preferred)
  2. `emithq.com` (fallback)
  3. `useemit.com` (fallback)
- [ ] **Check GitHub org availability:** `emithq`, `emit-dev`, `emit-webhooks`
- [ ] **Check npm availability:** `@emit`, `emit-webhooks`, `@emithq`
- [ ] **Register domain** (Cloudflare Registrar recommended — free DNS, no markup)
- [ ] **Create GitHub organization**
- [ ] **Create npm organization**
- [ ] Pick final name based on availability

## Sources

- T-001: `docs/research/competitive-landscape.md` (competitor brand analysis)
- T-002: `docs/research/customer-discovery.md` (buyer personas for positioning)
- T-006: `docs/research/content-distribution-strategy.md` (SEO implications of naming)
