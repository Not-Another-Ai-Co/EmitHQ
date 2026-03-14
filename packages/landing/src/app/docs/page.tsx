import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'EmitHQ documentation — getting started, API reference, and SDK guides.',
};

export default function DocsPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold">Documentation</h1>

        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/docs/api"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
          >
            <h2 className="mb-2 text-lg font-semibold">API Reference</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Complete REST API documentation with request/response examples for all 19 endpoints.
            </p>
          </Link>
          <Link
            href="/docs/sdk"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
          >
            <h2 className="mb-2 text-lg font-semibold">SDK Guide</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              TypeScript SDK quickstart, method reference, error handling, and webhook verification.
            </p>
          </Link>
        </div>

        {/* Getting Started */}
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Getting Started</h2>

          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-lg font-semibold">1. Install the SDK</h3>
              <pre className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm">
                <code>npm install @emithq/sdk</code>
              </pre>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">2. Get your API key</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Sign up at{' '}
                <a
                  href="https://app.emithq.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  app.emithq.com
                </a>
                , create an organization, then generate an API key from the dashboard. Your key
                starts with{' '}
                <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">emhq_</code>
                .
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">3. Send your first event</h3>
              <pre className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-relaxed">
                <code>{`import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('emhq_your_api_key');

// Create an endpoint for your customer
const endpoint = await emithq.createEndpoint('app_123', {
  url: 'https://customer.com/webhooks',
});
// Save endpoint.signingSecret — shown only once

// Send a webhook event
const message = await emithq.sendEvent('app_123', {
  eventType: 'invoice.paid',
  payload: { invoiceId: 'inv_456', amount: 9900 },
});
console.log('Event queued:', message.id);`}</code>
              </pre>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">4. Verify webhooks (consumer side)</h3>
              <pre className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-relaxed">
                <code>{`import { verifyWebhook } from '@emithq/sdk';

// In your webhook handler
const isValid = await verifyWebhook(rawBody, {
  'webhook-id': req.headers['webhook-id'],
  'webhook-timestamp': req.headers['webhook-timestamp'],
  'webhook-signature': req.headers['webhook-signature'],
}, 'whsec_your_endpoint_secret');
// Throws if invalid — catch to return 401`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
