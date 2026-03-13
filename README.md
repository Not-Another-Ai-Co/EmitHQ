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

## Pricing

| | Free | Starter | Growth | Scale |
|--|------|---------|--------|-------|
| **Price** | $0/mo | $49/mo | $149/mo | $349/mo |
| **Events** | 100K | 500K | 2M | 10M |
| **Retries** | Free | Free | Free | Free |

## Self-Hosting

```bash
docker compose up
```

See [Self-Hosting Guide](docs/self-hosting.md) for details.

## License

Server: [AGPL-3.0](LICENSE)
SDK: [MIT](packages/sdk/LICENSE)
