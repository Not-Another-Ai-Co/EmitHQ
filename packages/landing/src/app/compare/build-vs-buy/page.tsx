import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Build vs Buy: Webhook Infrastructure in 2026',
  description:
    'The true cost of building webhook delivery in-house vs using a managed platform like EmitHQ. Engineering time, maintenance, and hidden costs.',
  openGraph: {
    title: 'Build vs Buy: Webhook Infrastructure in 2026',
    description: 'Engineering time, maintenance burden, and hidden costs of DIY webhooks.',
    url: 'https://emithq.com/compare/build-vs-buy',
  },
  alternates: { canonical: 'https://emithq.com/compare/build-vs-buy' },
};

const COST_ROWS = [
  {
    category: 'Initial build',
    diy: '2-4 weeks engineering time',
    managed: '30 minutes (SDK integration)',
  },
  {
    category: 'Retry logic with backoff',
    diy: '2-3 days to build, ongoing tuning',
    managed: 'Configurable, built-in',
  },
  {
    category: 'Dead-letter queue',
    diy: '1-2 days + monitoring setup',
    managed: 'Built-in with replay API',
  },
  {
    category: 'HMAC signature signing',
    diy: '1 day + security review',
    managed: 'Standard Webhooks spec, automatic',
  },
  {
    category: 'Delivery monitoring',
    diy: 'Custom dashboard, 1-2 weeks',
    managed: 'Dashboard included',
  },
  {
    category: 'Multi-tenant isolation',
    diy: '1-2 weeks (RLS, per-tenant queues)',
    managed: 'Built-in RLS per organization',
  },
  {
    category: 'Circuit breaker',
    diy: '2-3 days + threshold tuning',
    managed: 'Auto-disable at failure threshold',
  },
  {
    category: 'Payload transformations',
    diy: '1-2 weeks if needed',
    managed: 'No-code JSONPath + templates',
  },
  {
    category: 'On-call for failures',
    diy: 'Your team, ongoing',
    managed: 'We handle it',
  },
  {
    category: 'Scaling',
    diy: 'Redis tuning, worker scaling, queue sharding',
    managed: 'Handled — scale tier goes to 10M events/mo',
  },
];

export default function BuildVsBuyPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">Build vs Buy</h1>
          <p className="mt-2 text-sm font-medium text-[var(--color-text-muted)]">
            Webhook Infrastructure in 2026
          </p>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Every team thinks &ldquo;we&apos;ll just add a webhook endpoint.&rdquo; Then they
            discover retries, dead-letter queues, signature verification, circuit breakers, and
            monitoring. Here&apos;s the real cost comparison.
          </p>
        </div>

        {/* The hidden iceberg */}
        <div className="mb-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <h2 className="mb-6 text-xl font-bold">
            What &ldquo;just send a POST request&rdquo; actually requires
          </h2>
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              'HTTP POST with configurable timeouts',
              'HMAC-SHA256 signature on every delivery',
              'Exponential backoff with jitter',
              'Dead-letter queue for exhausted retries',
              'Per-endpoint circuit breaker',
              'Idempotency key deduplication',
              'Delivery attempt logging and replay',
              'Rate limiting per tenant',
              'Customer-facing delivery dashboard',
              'Payload transformation engine (Starter+)',
              'Multi-tenant data isolation (RLS)',
              'Monitoring, alerting, and SLO tracking',
            ].map((item) => (
              <div key={item} className="rounded-lg border border-[var(--color-border)] px-4 py-3">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Building all of this in-house takes 8-12 weeks of senior engineering time. Maintaining
            it is an ongoing cost.
          </p>
        </div>

        {/* Cost comparison table */}
        <h2 className="mb-8 text-center text-2xl font-bold">Component-by-component cost</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-4">Component</th>
                <th className="px-4 py-4 text-center">Build in-house</th>
                <th className="bg-[var(--color-accent)]/5 px-4 py-4 text-center text-[var(--color-accent)]">
                  EmitHQ
                </th>
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((row) => (
                <tr key={row.category} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium">{row.category}</td>
                  <td className="px-4 py-3 text-center text-[var(--color-text-muted)]">
                    {row.diy}
                  </td>
                  <td className="bg-[var(--color-accent)]/5 px-4 py-3 text-center">
                    {row.managed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total cost summary */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <h3 className="text-lg font-semibold text-[var(--color-text-muted)]">DIY cost</h3>
            <p className="mt-2 text-3xl font-bold">$15,000-$40,000</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Engineering time (at $150-200/hr) + ongoing maintenance
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-8 text-center">
            <h3 className="text-lg font-semibold text-[var(--color-accent)]">EmitHQ</h3>
            <p className="mt-2 text-3xl font-bold">$49/mo</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Everything included. Self-host for free if you prefer.
            </p>
          </div>
        </div>

        {/* When DIY makes sense */}
        <div className="mt-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <h2 className="mb-4 text-xl font-bold">When building in-house makes sense</h2>
          <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <li>
              You have unique delivery requirements that no platform supports (custom protocols,
              non-HTTP delivery)
            </li>
            <li>Webhooks are a core competency and competitive advantage for your business</li>
            <li>You need to operate in an air-gapped environment with no external dependencies</li>
            <li>Your volume exceeds 100M events/month and you need custom infrastructure tuning</li>
          </ul>
          <p className="mt-4 text-sm">
            For everyone else, a managed platform pays for itself in the first week of engineering
            time saved.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="https://app.emithq.com"
            className="inline-block rounded-xl bg-[var(--color-accent)] px-8 py-3 font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            Start free — 100K events/mo
          </Link>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            No credit card required. Or{' '}
            <Link
              href="https://github.com/Not-Another-Ai-Co/EmitHQ"
              className="text-[var(--color-accent)] hover:underline"
            >
              self-host the open-source server
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
