'use client';

import { useState } from 'react';
import Link from 'next/link';

const TIERS = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    events: '100,000',
    eventsNum: 100000,
    endpoints: '10',
    retention: '3 days',
    throughput: '10 evt/s',
    retries: '5 (fixed)',
    transform: false,
    support: 'Community',
    cta: 'Start free',
    href: 'https://app.emithq.com',
  },
  {
    name: 'Starter',
    monthly: 49,
    annual: 39,
    events: '500,000',
    eventsNum: 500000,
    endpoints: '50',
    retention: '14 days',
    throughput: '50 evt/s',
    retries: '10 (configurable)',
    transform: false,
    support: 'Email (48h)',
    cta: 'Start free',
    href: 'https://app.emithq.com',
  },
  {
    name: 'Growth',
    monthly: 149,
    annual: 119,
    events: '2,000,000',
    eventsNum: 2000000,
    endpoints: '250',
    retention: '30 days',
    throughput: '200 evt/s',
    retries: '20 (configurable)',
    transform: true,
    support: 'Priority (24h)',
    popular: true,
    cta: 'Start free',
    href: 'https://app.emithq.com',
  },
  {
    name: 'Scale',
    monthly: 349,
    annual: 279,
    events: '10,000,000',
    eventsNum: 10000000,
    endpoints: 'Unlimited',
    retention: '90 days',
    throughput: '1,000 evt/s',
    retries: '50 (configurable)',
    transform: true,
    support: 'Dedicated (4h)',
    cta: 'Start free',
    href: 'https://app.emithq.com',
  },
];

const FAQ = [
  {
    q: 'What counts as an event?',
    a: 'Each message you send through the API counts as one event. Fan-out to multiple endpoints counts as one event per endpoint. Retries are always free — never counted.',
  },
  {
    q: 'What happens when I hit my limit?',
    a: "On the free tier, your API returns 429 — no surprise bills. On paid tiers, overage is billed at $0.30-$0.50 per 1,000 events depending on tier. You'll get a warning at 80% usage.",
  },
  {
    q: 'Are retries free?',
    a: 'Yes. If a delivery fails and is retried 7 times, you are charged for 1 event. Retries never count against your quota.',
  },
  {
    q: 'Can I change plans at any time?',
    a: 'Yes. Upgrades take effect immediately (prorated). Downgrades take effect at the next billing cycle. No lock-in, cancel anytime.',
  },
  {
    q: 'Can I self-host EmitHQ?',
    a: 'Yes. The server is AGPL-3.0 licensed. Self-host for free with your own infrastructure. The managed service adds SLA guarantees, monitoring, and priority support.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual billing saves 20% on all paid tiers. You pay upfront for 12 months. Same features, same support — just cheaper.',
  },
];

const ROWS: Array<{ label: string; key: keyof (typeof TIERS)[0] }> = [
  { label: 'Events/month', key: 'events' },
  { label: 'Endpoints', key: 'endpoints' },
  { label: 'Retention', key: 'retention' },
  { label: 'Throughput', key: 'throughput' },
  { label: 'Retries', key: 'retries' },
  { label: 'Support', key: 'support' },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">Simple, fair pricing.</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Retries are always free. No credit card required.
          </p>

          {/* Annual/Monthly toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            <button
              onClick={() => setIsAnnual(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isAnnual
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Annual <span className="text-xs opacity-75">save 20%</span>
            </button>
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !isAnnual
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const price = isAnnual ? tier.annual : tier.monthly;
            const perEvent =
              tier.eventsNum > 0 && price > 0
                ? `$${((price / tier.eventsNum) * 1000).toFixed(2)}/1K events`
                : null;

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  tier.popular
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{price === 0 ? '$0' : `$${price}`}</span>
                    {price > 0 && (
                      <span className="text-sm text-[var(--color-text-muted)]">/mo</span>
                    )}
                  </div>
                  {perEvent && (
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">{perEvent}</div>
                  )}
                  {price === 0 && (
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">Forever free</div>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  <li>{tier.events} events/mo</li>
                  <li>{tier.endpoints} endpoints</li>
                  <li>{tier.retention} retention</li>
                  <li>{tier.throughput}</li>
                  <li>
                    {tier.transform ? (
                      <span>
                        <span className="text-[var(--color-success)]">&#10003;</span> Payload
                        transformations
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">No transformations</span>
                    )}
                  </li>
                  <li>{tier.support} support</li>
                </ul>

                <Link
                  href={tier.href}
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
                      : 'border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* SDK snippet */}
        <div className="mt-16 text-center">
          <h2 className="mb-4 text-xl font-bold">Integrate in 3 lines</h2>
          <div className="mx-auto max-w-lg overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left">
            <pre className="text-sm">
              <code className="text-[var(--color-text-muted)]">
                {`import { EmitHQ } from '@emithq/sdk';

const emithq = new EmitHQ('emhq_your_api_key');

await emithq.sendEvent('app_123', {
  eventType: 'invoice.paid',
  payload: { amount: 9900, currency: 'usd' },
});`}
              </code>
            </pre>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs">
              npm install @emithq/sdk
            </code>
          </p>
        </div>

        {/* Overage pricing */}
        <div className="mt-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <h2 className="text-xl font-bold">Overage pricing</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Exceed your tier limit? No problem. Paid tiers bill overages transparently.
          </p>
          <div className="mt-4 flex justify-center gap-8 text-sm">
            <div>
              <div className="font-semibold">Starter</div>
              <div className="text-[var(--color-text-muted)]">$0.50 / 1K events</div>
            </div>
            <div>
              <div className="font-semibold">Growth</div>
              <div className="text-[var(--color-text-muted)]">$0.40 / 1K events</div>
            </div>
            <div>
              <div className="font-semibold">Scale</div>
              <div className="text-[var(--color-text-muted)]">$0.30 / 1K events</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Free tier has a hard limit — no surprise bills.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mx-auto max-w-3xl space-y-6">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
