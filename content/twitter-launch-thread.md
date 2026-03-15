# Twitter/X Launch Thread

**Thread format: 8 tweets**

---

**1/8**
I just open-sourced EmitHQ — webhook infrastructure for SaaS teams.

AGPL-3.0 server, MIT SDKs. Self-host or use the cloud starting at $49/mo.

Why? Because the jump from free to $490/mo shouldn't be the only option.

github.com/Not-Another-Ai-Co/EmitHQ

---

**2/8**
The problem: every SaaS needs webhooks. Your options in 2026:

- Build it yourself (500+ engineering hours)
- Svix: free → $490/mo
- Hookdeck: free → $39 (5 evt/s cap) → $499/mo
- Convoy: free → $99/mo (ELv2)

There's a gap between free and $490. EmitHQ fills it.

---

**3/8**
Pricing:

Free: 100K events/mo
Starter: $49/mo (500K)
Growth: $149/mo (2M)
Scale: $349/mo (10M)

Retries are always free. Because charging you more when your customer's server is down feels wrong.

---

**4/8**
Both directions in one platform:

Outbound: Send webhooks to your customers with HMAC signing (Standard Webhooks spec), automatic retries, circuit breakers, and a DLQ.

Inbound: Receive webhooks from Stripe/GitHub/Shopify with edge signature verification in <50ms.

---

**5/8**
Architecture nerds, this one's for you:

- Cloudflare Workers at the edge (fast inbound ack)
- Node.js + Hono on Railway (API + delivery workers)
- BullMQ on Redis (queue)
- PostgreSQL with RLS (multi-tenant isolation)
- Persist to DB BEFORE enqueueing (never lose a message)

---

**6/8**
The SDK is zero dependencies, TypeScript-first:

```typescript
import { EmitHQ } from '@emithq/sdk';

const emit = new EmitHQ('your-api-key');

await emit.message.send('app_123', {
  eventType: 'invoice.paid',
  payload: { amount: 9900 },
});
```

npm install @emithq/sdk

---

**7/8**
What's missing (being honest):

- Edge inbound worker not deployed to prod yet
- TypeScript SDK only (Python/Go on roadmap)
- Self-hosting docs are thin
- Solo dev — I built this with Claude

I'd rather ship honest than ship perfect.

---

**8/8**
If you're building a SaaS and need webhook infrastructure:

- Try the free tier (100K events, no credit card)
- Read the code (it's all open source)
- Tell me what's missing

GitHub: github.com/Not-Another-Ai-Co/EmitHQ
Docs: [docs URL]

Show HN is live too: [HN link]
