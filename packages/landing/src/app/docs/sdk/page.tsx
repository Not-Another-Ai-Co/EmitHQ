import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SDK Guide',
  description: 'EmitHQ TypeScript SDK guide — methods, error handling, webhook verification.',
  alternates: { canonical: '/docs/sdk' },
};

export default function SdkGuidePage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold">TypeScript SDK Guide</h1>
        <p className="mb-12 text-[var(--color-text-muted)]">
          <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
            npm install @emithq/sdk
          </code>{' '}
          — Zero dependencies. Works in Node.js 18+, browsers, and edge runtimes.
        </p>

        <div className="space-y-12">
          {/* Client Init */}
          <Section title="Client Initialization">
            <pre className="code-block">{`import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('emhq_your_api_key', {
  baseUrl: 'https://api.emithq.com', // default
  timeout: 30000,                     // default: 30s
  maxRetries: 3,                      // default: 3
});`}</pre>
          </Section>

          {/* Send Events */}
          <Section title="Sending Events">
            <pre className="code-block">{`const message = await emithq.sendEvent('app_123', {
  eventType: 'invoice.paid',
  payload: { invoiceId: 'inv_456', amount: 9900 },
  eventId: 'evt_unique_key', // optional — prevents duplicate delivery
});
// Returns: { id, eventType, eventId, createdAt }`}</pre>
            <p className="note">
              The event is persisted to the database before being queued for delivery. If the queue
              is temporarily unavailable, the event is safe and will be recovered.
            </p>
          </Section>

          {/* Endpoint Management */}
          <Section title="Managing Endpoints">
            <pre className="code-block">{`// Create
const ep = await emithq.createEndpoint('app_123', {
  url: 'https://customer.com/webhooks',
  description: 'Production receiver',
  eventTypeFilter: ['invoice.paid', 'invoice.failed'],
});
// ep.signingSecret — shown once, save it

// List (cursor-paginated)
const { data, iterator, done } = await emithq.listEndpoints('app_123');

// Update
await emithq.updateEndpoint('app_123', ep.id, { url: 'https://new-url.com' });

// Re-enable after circuit breaker trip
await emithq.updateEndpoint('app_123', ep.id, { disabled: false });

// Delete (soft-delete)
await emithq.deleteEndpoint('app_123', ep.id);

// Test connectivity
const result = await emithq.testEndpoint('app_123', ep.id);
// result.success, result.statusCode, result.responseTimeMs`}</pre>
          </Section>

          {/* Replay */}
          <Section title="Replaying Failed Deliveries">
            <pre className="code-block">{`// Replay all failed attempts for a message
const replay = await emithq.replayEvent('app_123', 'msg_id');
// replay.replayed = number of attempts re-queued

// Replay a single attempt
const attempt = await emithq.replayAttempt('app_123', 'msg_id', 'attempt_id');`}</pre>
          </Section>

          {/* Webhook Verification */}
          <Section title="Verifying Incoming Webhooks">
            <pre className="code-block">{`import { verifyWebhook } from '@emithq/sdk';

// In your webhook handler (Express, Hono, etc.)
try {
  await verifyWebhook(rawBody, {
    'webhook-id': req.headers['webhook-id'],
    'webhook-timestamp': req.headers['webhook-timestamp'],
    'webhook-signature': req.headers['webhook-signature'],
  }, 'whsec_your_endpoint_secret');
  // Signature valid — process the event
} catch (err) {
  // Invalid signature, expired timestamp, or missing headers
  return res.status(401).json({ error: 'Invalid signature' });
}`}</pre>
            <p className="note">
              Uses WebCrypto API with timing-safe comparison. Rejects timestamps older than 5
              minutes to prevent replay attacks. Supports multiple space-separated signatures for
              key rotation.
            </p>
          </Section>

          {/* Error Handling */}
          <Section title="Error Handling">
            <pre className="code-block">{`import {
  EmitHQError,
  AuthError,        // 401 — invalid API key
  ForbiddenError,   // 403 — insufficient permissions
  NotFoundError,    // 404 — resource not found
  ValidationError,  // 400 — invalid input
  RateLimitError,   // 429 — quota exceeded
  PayloadTooLargeError, // 413 — payload > 256KB
} from '@emithq/sdk';

try {
  await emithq.sendEvent('app_123', { eventType: 'test' });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log('Quota exceeded:', err.message);
    // err.retryAfter — seconds until quota resets (if available)
  }
  if (err instanceof EmitHQError) {
    console.log(err.code, err.statusCode, err.message);
  }
}`}</pre>
          </Section>

          {/* Auto Retry */}
          <Section title="Automatic Retries">
            <p className="note">
              The SDK automatically retries on transient failures (5xx, 408, 429, network errors)
              with exponential backoff and jitter. Non-retriable errors (400, 401, 403, 404, 410,
              413) fail immediately. Default: 3 retries. Configure via <code>maxRetries</code>{' '}
              option.
            </p>
            <p className="note">
              This is client-side retry for API calls. Server-side delivery retries (for webhook
              delivery to your customers&apos; endpoints) are configured separately per endpoint.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
