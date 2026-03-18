import Link from 'next/link';
import { CtaLink } from '@/components/cta-link';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Webhooks that{' '}
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] bg-clip-text text-transparent">
              just work.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-text-muted)]">
            Open-source webhook infrastructure for growing SaaS teams. Inbound and outbound delivery
            with Standard Webhooks signing, configurable retries, and a real-time dashboard. From{' '}
            <strong className="text-[var(--color-text)]">$49/mo</strong> &mdash; not $490.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CtaLink
              href="https://app.emithq.com"
              location="hero"
              className="rounded-xl bg-[var(--color-accent)] px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Start Free &mdash; No Credit Card
            </CtaLink>
            <a
              href="https://github.com/Not-Another-Ai-Co/EmitHQ"
              className="rounded-xl border border-[var(--color-border)] px-8 py-3 text-lg font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">The $49&ndash;$490 gap is real.</h2>
          <p className="mt-4 text-[var(--color-text-muted)]">
            Svix jumps from free to $490/mo. Hookdeck goes from $39 to $499. Convoy starts at $99
            with restrictive licensing. If you&apos;re a growing team that needs reliable webhook
            delivery without an enterprise budget, your options have been: build it yourself, or
            overpay.
          </p>
          <p className="mt-4 text-[var(--color-text)]">
            EmitHQ fills that gap with three tiers at <strong>$49, $149, and $349/mo</strong>.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Snippet */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Ship in 5 minutes.</h2>
          <pre className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-sm leading-relaxed">
            <code>{CODE_EXAMPLE}</code>
          </pre>
          <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
            Install with{' '}
            <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
              npm install @emithq/sdk
            </code>
          </p>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Simple, fair pricing.</h2>
          <p className="mb-12 text-[var(--color-text-muted)]">
            Retries are always free. No surprise overage bills on the free tier.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 text-left ${
                  tier.popular
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {tier.popular && (
                  <span className="mb-2 inline-block rounded-full bg-[var(--color-accent)] px-3 py-0.5 text-xs font-medium text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-2 text-3xl font-bold">
                  {tier.price}
                  {tier.price !== 'Free' && (
                    <span className="text-base font-normal text-[var(--color-text-muted)]">
                      /mo
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{tier.events}</p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[var(--color-success)]">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-8 inline-block text-sm text-[var(--color-accent)] hover:underline"
          >
            See full pricing details &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Start for free. Upgrade when you grow.</h2>
          <p className="mt-4 text-[var(--color-text-muted)]">
            100,000 events/month free. No credit card required.
          </p>
          <CtaLink
            href="https://app.emithq.com"
            location="bottom-cta"
            className="mt-8 inline-block rounded-xl bg-[var(--color-accent)] px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Get Started
          </CtaLink>
        </div>
      </section>
    </>
  );
}

const FEATURES = [
  {
    icon: '🔄',
    title: 'Outbound Delivery',
    description:
      'Send webhooks to your customers with Standard Webhooks signing (HMAC-SHA256), automatic fan-out, and per-endpoint configuration.',
  },
  {
    icon: '📥',
    title: 'Inbound Reception',
    description:
      'Receive webhooks from Stripe, GitHub, Shopify, and more. Signature verification at the edge, instant 200 response.',
  },
  {
    icon: '🔁',
    title: 'Smart Retries',
    description:
      'Exponential backoff with full jitter. Configurable retry count per endpoint. Dead-letter queue with manual replay.',
  },
  {
    icon: '📊',
    title: 'Real-Time Dashboard',
    description:
      'Monitor deliveries, inspect payloads, track endpoint health, and replay failed events from a responsive web dashboard.',
  },
  {
    icon: '🔀',
    title: 'Payload Transformation',
    description:
      'Reshape webhook payloads before delivery using JSONPath extraction and template expressions. No code required.',
  },
  {
    icon: '🔒',
    title: 'Multi-Tenant Security',
    description:
      'PostgreSQL Row-Level Security for tenant isolation. Per-endpoint signing secrets. API keys with zero-downtime rotation.',
  },
];

const TIERS = [
  {
    name: 'Free',
    price: 'Free',
    events: '100,000 events/mo',
    popular: false,
    features: ['10 endpoints', '3-day retention', '5 retries (fixed)', 'Community support'],
  },
  {
    name: 'Starter',
    price: '$49',
    events: '500,000 events/mo',
    popular: false,
    features: ['50 endpoints', '14-day retention', '10 retries (configurable)', 'Email support'],
  },
  {
    name: 'Growth',
    price: '$149',
    events: '2,000,000 events/mo',
    popular: true,
    features: [
      '250 endpoints',
      '30-day retention',
      '20 retries (configurable)',
      'Payload transformation',
      'Priority support',
    ],
  },
  {
    name: 'Scale',
    price: '$349',
    events: '10,000,000 events/mo',
    popular: false,
    features: [
      'Unlimited endpoints',
      '90-day retention',
      '50 retries (configurable)',
      'Static IPs',
      'Dedicated support',
    ],
  },
];

const CODE_EXAMPLE = `import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('emhq_your_api_key');

// Send a webhook event
await emithq.sendEvent('app_123', {
  eventType: 'invoice.paid',
  payload: { invoiceId: 'inv_456', amount: 9900 },
});

// Verify incoming webhooks
import { verifyWebhook } from '@emithq/sdk';

await verifyWebhook(rawBody, {
  'webhook-id': headers['webhook-id'],
  'webhook-timestamp': headers['webhook-timestamp'],
  'webhook-signature': headers['webhook-signature'],
}, 'whsec_your_secret');`;
