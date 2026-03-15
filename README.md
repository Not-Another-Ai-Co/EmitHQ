# EmitHQ

**Open-source webhook infrastructure. Reliable delivery, fair pricing.**

EmitHQ handles both inbound (receiving webhooks from Stripe, GitHub, Shopify) and outbound (sending webhooks to your customers' endpoints) with guaranteed delivery, automatic retries, and a dashboard to see exactly what's happening.

## Why EmitHQ?

- **Fair pricing** — $49/mo, not $490. We fill the gap between free tiers and enterprise pricing.
- **Both directions** — Receive AND send webhooks in one platform.
- **Open source** — AGPL-3.0 server. Self-host or use our managed cloud.
- **Standard Webhooks** — Compatible with the industry-standard signing spec.
- **Reliable** — At-least-once delivery, configurable retries, dead-letter queue, circuit breakers.

## Quick Start

```bash
npm install @emithq/sdk
```

```typescript
import { EmitHQ } from '@emithq/sdk';

const emit = new EmitHQ('your-api-key');

// Send a webhook
await emit.message.send('app_customer123', {
  eventType: 'invoice.paid',
  payload: { invoiceId: 'inv_001', amount: 9900 },
});
```

## How It Works

```
┌─────────────────────────────────┐
│   Cloudflare Workers (Edge)     │  ← Inbound: verify signature, return 200 in <50ms
│   Inbound reception + rate      │
│   limiting                      │
└────────────┬────────────────────┘
             │ QStash (durable relay)
┌────────────▼────────────────────┐
│   Railway (Origin)              │
│                                 │
│   API Server (Hono)             │  ← REST API + webhook delivery
│   BullMQ Workers                │  ← Retry with exponential backoff + jitter
│   PostgreSQL (Neon, RLS)        │  ← Persist before enqueue — never lose a message
│   Redis (Upstash)               │  ← Job queue + caching
└─────────────────────────────────┘
```

- **Persist before enqueue** — messages saved to PostgreSQL before Redis queue. Queue failure = recoverable. Data loss = never.
- **Standard Webhooks** — HMAC-SHA256 signing compatible with the industry spec.
- **Row-Level Security** — PostgreSQL RLS enforces tenant isolation at the database layer.
- **Circuit breakers** — 10 consecutive failures auto-disable an endpoint. Re-enable via API or dashboard.

## Features

- **Outbound delivery** — Send webhooks to your customers' endpoints with HMAC signing, retries, and DLQ
- **Inbound reception** — Receive webhooks from Stripe/GitHub/Shopify with provider-specific signature verification
- **Dashboard** — Event log, delivery attempts, endpoint health, dead-letter queue with replay
- **Payload transformations** — Reshape payloads with JSONPath and templates before delivery
- **TypeScript SDK** — `npm install @emithq/sdk` — zero dependencies, typed errors, automatic retry

## Pricing

|             | Free  | Starter | Growth  | Scale   |
| ----------- | ----- | ------- | ------- | ------- |
| **Price**   | $0/mo | $49/mo  | $149/mo | $349/mo |
| **Events**  | 100K  | 500K    | 2M      | 10M     |
| **Retries** | Free  | Free    | Free    | Free    |

[Full pricing details](https://emithq.com/pricing) — retries never count toward your event limit.

## Self-Hosting

```bash
docker compose up
```

See [Self-Hosting Guide](docs/self-hosting.md) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. We welcome bug fixes, test improvements, new provider integrations, and SDK ports.

## License

Server: [AGPL-3.0](LICENSE) — self-host freely, copyleft for competing SaaS offerings.
SDK: [MIT](packages/sdk/LICENSE) — no restrictions on your application code.
