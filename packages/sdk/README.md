# @emithq/sdk

TypeScript SDK for [EmitHQ](https://emithq.com) — webhook infrastructure that just works.

## Install

```bash
npm install @emithq/sdk
```

## Quick Start

```typescript
import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('emhq_your_api_key');

// Send a webhook event
const message = await emithq.sendEvent('app_123', {
  eventType: 'invoice.paid',
  payload: { invoiceId: 'inv_456', amount: 9900 },
  eventId: 'evt_unique_key', // optional — prevents duplicate delivery
});

console.log(`Event ${message.id} queued for delivery`);
```

## Endpoints

```typescript
// Create an endpoint
const endpoint = await emithq.createEndpoint('app_123', {
  url: 'https://example.com/webhooks',
  description: 'Production webhook receiver',
  eventTypeFilter: ['invoice.paid', 'invoice.failed'], // optional
});

// Save the signing secret — it's only shown once
console.log(`Signing secret: ${endpoint.signingSecret}`);

// List endpoints (cursor-paginated)
const { data, iterator, done } = await emithq.listEndpoints('app_123', { limit: 10 });

// Update an endpoint
await emithq.updateEndpoint('app_123', 'ep_id', { url: 'https://new-url.com/hook' });

// Re-enable a disabled endpoint (resets circuit breaker)
await emithq.updateEndpoint('app_123', 'ep_id', { disabled: false });

// Test endpoint connectivity
const result = await emithq.testEndpoint('app_123', 'ep_id');
console.log(`Test delivery: ${result.success ? 'OK' : result.errorMessage}`);

// Get a specific endpoint
const ep = await emithq.getEndpoint('app_123', 'ep_id');

// Delete (soft-delete) an endpoint
await emithq.deleteEndpoint('app_123', 'ep_id');
```

## Replay Failed Deliveries

```typescript
// Replay all failed attempts for a message
const replay = await emithq.replayEvent('app_123', 'msg_id');
console.log(`Replayed ${replay.replayed} attempts`);

// Replay a single attempt
const attempt = await emithq.replayAttempt('app_123', 'msg_id', 'attempt_id');
```

## Verify Incoming Webhooks

When receiving webhooks from EmitHQ, verify the signature:

```typescript
import { verifyWebhook } from '@emithq/sdk';

// In your webhook handler (Express, Hono, etc.)
const isValid = await verifyWebhook(
  rawBody,
  {
    'webhook-id': req.headers['webhook-id'],
    'webhook-timestamp': req.headers['webhook-timestamp'],
    'webhook-signature': req.headers['webhook-signature'],
  },
  'whsec_your_endpoint_secret',
);
```

`verifyWebhook` throws if the signature is invalid, the timestamp is too old (>5 minutes), or headers are missing. Uses WebCrypto API — works in Node.js 18+, browsers, and edge runtimes.

## Error Handling

All errors are typed:

```typescript
import {
  EmitHQ,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  PayloadTooLargeError,
} from '@emithq/sdk';

try {
  await emithq.sendEvent('app_123', { eventType: 'test' });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log('Quota exceeded — upgrade your plan');
  } else if (err instanceof ValidationError) {
    console.log(`Invalid input: ${err.message}`);
  } else if (err instanceof AuthError) {
    console.log('Check your API key');
  } else if (err instanceof NotFoundError) {
    console.log('Application not found');
  }
}
```

## Automatic Retries

The SDK automatically retries on transient failures (5xx, 408, 429, network errors) with exponential backoff. Non-retriable errors (400, 401, 403, 404, 410) fail immediately.

```typescript
const emithq = new EmitHQ('emhq_key', {
  maxRetries: 3, // default: 3
  timeout: 30000, // default: 30s
  baseUrl: 'https://api.emithq.com', // default
});
```

## License

MIT
