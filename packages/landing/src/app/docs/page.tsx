import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentation — EmitHQ',
  description:
    'EmitHQ documentation — complete guide to sending webhooks, managing endpoints, API keys, retries, and billing.',
  alternates: { canonical: '/docs' },
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative border-l-2 border-[var(--color-border)] pl-8 pb-10 last:pb-0">
      <div className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-bg)] text-sm font-bold text-[var(--color-accent)]">
        {number}
      </div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold">Documentation</h1>
        <p className="mb-8 text-lg text-[var(--color-text-muted)]">
          Everything you need to send webhooks to your customers with EmitHQ.
        </p>

        {/* Quick links */}
        <div className="mb-8 flex flex-wrap gap-3 text-sm">
          <a
            href="#quickstart"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Quick Start
          </a>
          <a
            href="#api-keys"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            API Keys
          </a>
          <a
            href="#retries"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Retries & DLQ
          </a>
          <a
            href="#verification"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Verification
          </a>
          <a
            href="#billing"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Billing
          </a>
          <a
            href="/openapi.json"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            OpenAPI Spec
          </a>
          <a
            href="/llm.txt"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            llm.txt
          </a>
        </div>

        {/* Reference cards */}
        <div className="mb-16 grid gap-6 sm:grid-cols-2">
          <Link
            href="/docs/api"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
          >
            <h2 className="mb-2 text-lg font-semibold">API Reference</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Complete REST API documentation with request/response examples for all 24+ endpoints.
            </p>
          </Link>
          <Link
            href="/docs/sdk"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
          >
            <h2 className="mb-2 text-lg font-semibold">TypeScript SDK</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              SDK quickstart, method reference, error handling, and webhook verification.
            </p>
          </Link>
        </div>

        {/* ============ QUICK START ============ */}
        <div id="quickstart" className="scroll-mt-20">
          <h2 className="mb-2 text-2xl font-bold">Quick Start</h2>
          <p className="mb-8 text-[var(--color-text-muted)]">
            Go from zero to sending your first webhook in under 5 minutes. Works with the API
            directly (curl) or the TypeScript SDK.
          </p>

          <div className="space-y-0">
            <Step number={1} title="Create an account">
              <p className="text-sm text-[var(--color-text-muted)]">
                Sign up via the API — no browser required. You&apos;ll get an org ID and API key in
                one call.
              </p>
              <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@company.com", "password": "your-password"}'

# Response:
# { "data": { "orgId": "...", "apiKey": "emhq_...", "tier": "free", "eventLimit": 100000 } }
# Save your API key — it's shown only once.`}</CodeBlock>
              <p className="text-xs text-[var(--color-text-muted)]">
                Or sign up at{' '}
                <a
                  href="https://app.emithq.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  app.emithq.com
                </a>{' '}
                and generate a key from Settings → API Keys.
              </p>
            </Step>

            <Step number={2} title="Create an application">
              <p className="text-sm text-[var(--color-text-muted)]">
                Applications are logical groupings — usually one per customer or service.
              </p>
              <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/app \\
  -H "Authorization: Bearer emhq_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Acme Corp"}'

# Response: { "data": { "id": "app_...", "name": "Acme Corp" } }`}</CodeBlock>
            </Step>

            <Step number={3} title="Create an endpoint">
              <p className="text-sm text-[var(--color-text-muted)]">
                An endpoint is a URL where webhooks will be delivered. Each endpoint gets its own
                signing secret.
              </p>
              <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/app/APP_ID/endpoint \\
  -H "Authorization: Bearer emhq_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://customer.com/webhooks"}'

# Response includes signingSecret (whsec_...) — save it for verification.`}</CodeBlock>
            </Step>

            <Step number={4} title="Send a webhook event">
              <p className="text-sm text-[var(--color-text-muted)]">
                EmitHQ signs the payload, delivers it to all matching endpoints, and handles retries
                automatically.
              </p>
              <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/app/APP_ID/msg \\
  -H "Authorization: Bearer emhq_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"eventType": "invoice.paid", "payload": {"amount": 9900, "currency": "usd"}}'

# Response: { "data": { "id": "msg_...", "eventType": "invoice.paid" } }`}</CodeBlock>
            </Step>

            <Step number={5} title="Check delivery status">
              <p className="text-sm text-[var(--color-text-muted)]">
                View delivery attempts, success/failure status, and response times.
              </p>
              <CodeBlock>{`curl https://api.emithq.com/api/v1/app/APP_ID/msg/MSG_ID \\
  -H "Authorization: Bearer emhq_YOUR_KEY"

# Shows message details + delivery attempts with status, response code, and timing.`}</CodeBlock>
            </Step>
          </div>

          <div className="mt-8 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-6">
            <h3 className="mb-2 font-semibold">Prefer the SDK?</h3>
            <CodeBlock>{`npm install @emithq/sdk

import { EmitHQ } from '@emithq/sdk';
const emithq = new EmitHQ('emhq_YOUR_KEY');

const endpoint = await emithq.createEndpoint('APP_ID', {
  url: 'https://customer.com/webhooks',
});

await emithq.sendEvent('APP_ID', {
  eventType: 'invoice.paid',
  payload: { amount: 9900 },
});`}</CodeBlock>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              See the full{' '}
              <Link href="/docs/sdk" className="text-[var(--color-accent)] hover:underline">
                SDK guide
              </Link>{' '}
              for error handling, retries, and webhook verification.
            </p>
          </div>
        </div>

        {/* ============ API KEYS ============ */}
        <div id="api-keys" className="mt-20 scroll-mt-20">
          <h2 className="mb-4 text-2xl font-bold">API Key Management</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">
            API keys authenticate all requests. Keys use the{' '}
            <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">emhq_</code>{' '}
            prefix and are stored as SHA-256 hashes — plaintext is shown only at creation.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">Create a key</h3>
              <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/auth/keys \\
  -H "Authorization: Bearer emhq_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "CI/CD Pipeline"}'`}</CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Rotate a key (zero downtime)</h3>
              <p className="mb-2 text-sm text-[var(--color-text-muted)]">
                Generates a new key and keeps the old one valid during a grace period (default: 1
                hour). Perfect for automated key rotation without service interruption.
              </p>
              <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/auth/keys/KEY_ID/rotate \\
  -H "Authorization: Bearer emhq_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"gracePeriodMinutes": 60}'

# Both old and new keys work during the grace period.
# Old key expires automatically after the grace period.`}</CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">List & revoke keys</h3>
              <CodeBlock>{`# List active keys (metadata only, no secrets)
curl https://api.emithq.com/api/v1/auth/keys \\
  -H "Authorization: Bearer emhq_YOUR_KEY"

# Revoke a key immediately
curl -X DELETE https://api.emithq.com/api/v1/auth/keys/KEY_ID \\
  -H "Authorization: Bearer emhq_YOUR_KEY"`}</CodeBlock>
            </div>
          </div>
        </div>

        {/* ============ RETRIES & DLQ ============ */}
        <div id="retries" className="mt-20 scroll-mt-20">
          <h2 className="mb-4 text-2xl font-bold">Retries & Dead Letter Queue</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">
            Failed deliveries are retried automatically with exponential backoff and jitter.
          </p>

          <div className="mb-6 overflow-hidden rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Attempt</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Delay</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    Cumulative
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[
                  ['1', 'Immediate', '0'],
                  ['2', '~30s', '~30s'],
                  ['3', '~2 min', '~2.5 min'],
                  ['4', '~15 min', '~17 min'],
                  ['5', '~1 hour', '~1h 17m'],
                  ['6', '~4 hours', '~5h 17m'],
                  ['7', '~12 hours', '~17h'],
                  ['8', '~12 hours', '~29h'],
                ].map(([attempt, delay, cum]) => (
                  <tr key={attempt}>
                    <td className="px-4 py-2">{attempt}</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">{delay}</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">{cum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 text-sm">
            <p>
              <strong>Non-retriable status codes:</strong>{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">400</code>,{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">401</code>,{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">403</code>,{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">404</code>,{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">410</code> —
              these indicate permanent errors that won&apos;t fix themselves.
            </p>
            <p>
              <strong>Dead Letter Queue:</strong> After all 8 attempts are exhausted, the delivery
              moves to the DLQ. You can replay DLQ entries from the dashboard or via the API.
            </p>
            <p>
              <strong>Circuit breaker:</strong> 10 consecutive failures to an endpoint will
              auto-disable it. The endpoint can be re-enabled from the dashboard.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 font-semibold">Replay a failed delivery</h3>
            <CodeBlock>{`curl -X POST https://api.emithq.com/api/v1/app/APP_ID/msg/MSG_ID/retry \\
  -H "Authorization: Bearer emhq_YOUR_KEY"`}</CodeBlock>
          </div>
        </div>

        {/* ============ VERIFICATION ============ */}
        <div id="verification" className="mt-20 scroll-mt-20">
          <h2 className="mb-4 text-2xl font-bold">Webhook Verification</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">
            EmitHQ signs every outbound webhook using the{' '}
            <a
              href="https://www.standardwebhooks.com"
              className="text-[var(--color-accent)] hover:underline"
            >
              Standard Webhooks
            </a>{' '}
            spec (HMAC-SHA256). Your customers should verify signatures to ensure authenticity.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">Signature headers</h3>
              <p className="mb-2 text-sm text-[var(--color-text-muted)]">
                Every webhook delivery includes three headers:
              </p>
              <CodeBlock>{`webhook-id: msg_2Xh9J...        # Unique message ID
webhook-timestamp: 1710000000   # Unix timestamp (seconds)
webhook-signature: v1,K5oZ...   # HMAC-SHA256 signature (base64)`}</CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Verify with the SDK</h3>
              <CodeBlock>{`import { verifyWebhook } from '@emithq/sdk';

// In your webhook handler
const isValid = await verifyWebhook(rawBody, {
  'webhook-id': req.headers['webhook-id'],
  'webhook-timestamp': req.headers['webhook-timestamp'],
  'webhook-signature': req.headers['webhook-signature'],
}, 'whsec_your_endpoint_secret');`}</CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Manual verification</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Signed content:{' '}
                <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
                  {'{webhook-id}.{webhook-timestamp}.{raw_body}'}
                </code>
                . Compute HMAC-SHA256 with the{' '}
                <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
                  whsec_
                </code>{' '}
                secret (base64-decode the secret first), then base64-encode the result. Compare with
                the{' '}
                <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">v1,</code>{' '}
                value in the signature header. Always use timing-safe comparison.
              </p>
            </div>
          </div>
        </div>

        {/* ============ BILLING ============ */}
        <div id="billing" className="mt-20 scroll-mt-20">
          <h2 className="mb-4 text-2xl font-bold">Billing & Quotas</h2>

          <div className="mb-6 overflow-hidden rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Tier</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    Events/mo
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[
                  ['Free', '100,000', '$0'],
                  ['Starter', '500,000', '$49/mo'],
                  ['Growth', '2,000,000', '$149/mo'],
                  ['Scale', '10,000,000', '$349/mo'],
                ].map(([tier, events, price]) => (
                  <tr key={tier}>
                    <td className="px-4 py-2 font-medium">{tier}</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">{events}</td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)]">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 text-sm">
            <p>
              <strong>Quota headers:</strong> Every API response includes{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
                X-EmitHQ-Quota-Limit
              </code>
              ,{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
                X-EmitHQ-Quota-Used
              </code>
              , and{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
                X-EmitHQ-Quota-Remaining
              </code>{' '}
              headers so you can monitor usage programmatically.
            </p>
            <p>
              <strong>Free tier:</strong> Hard limit at 100K events/month. Upgrade to continue
              sending.
            </p>
            <p>
              <strong>Retries are free:</strong> Only the initial message counts against your quota.
              Retry attempts don&apos;t consume additional events.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <h2 className="mb-2 text-xl font-bold">Ready to start?</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">
            Create an account and send your first webhook in under 5 minutes.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://app.emithq.com"
              className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Get Started Free
            </a>
            <Link
              href="/docs/api"
              className="rounded-lg border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              API Reference
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
