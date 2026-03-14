import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'EmitHQ pricing — webhook infrastructure from $49/mo. Free tier with 100K events. No surprise bills.',
};

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    annual: '$0',
    events: '100,000',
    endpoints: '10',
    retention: '3 days',
    throughput: '10 evt/s',
    retries: '5 (fixed)',
    transform: false,
    support: 'Community',
  },
  {
    name: 'Starter',
    price: '$49',
    annual: '$39',
    events: '500,000',
    endpoints: '50',
    retention: '14 days',
    throughput: '50 evt/s',
    retries: '10 (configurable)',
    transform: false,
    support: 'Email',
  },
  {
    name: 'Growth',
    price: '$149',
    annual: '$119',
    events: '2,000,000',
    endpoints: '250',
    retention: '30 days',
    throughput: '200 evt/s',
    retries: '20 (configurable)',
    transform: true,
    support: 'Priority',
    popular: true,
  },
  {
    name: 'Scale',
    price: '$349',
    annual: '$279',
    events: '10,000,000',
    endpoints: 'Unlimited',
    retention: '90 days',
    throughput: '1,000 evt/s',
    retries: '50 (configurable)',
    transform: true,
    support: 'Dedicated',
  },
];

const FAQ = [
  {
    q: 'What counts as an event?',
    a: 'Each message you send through the API counts as one event, regardless of how many endpoints receive it. Fan-out to multiple endpoints does not multiply your event count.',
  },
  {
    q: 'Are retries free?',
    a: 'Yes. Retries never count against your event quota. If a delivery fails and is retried 7 times, you are still charged for 1 event.',
  },
  {
    q: 'What happens if I exceed my event limit on the free tier?',
    a: 'On the free tier, your API will return a 429 error when you hit the limit. No surprise bills. On paid tiers, overage is billed at $0.30-$0.50 per 1,000 events.',
  },
  {
    q: 'Can I self-host EmitHQ?',
    a: 'Yes. The server is licensed under AGPL-3.0 and can be self-hosted. The managed service adds operational convenience, SLA guarantees, and priority support.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes. Annual billing saves 20% on all paid tiers.',
  },
  {
    q: 'Can I change plans at any time?',
    a: 'Yes. Upgrades take effect immediately and are prorated. Downgrades take effect at the start of your next billing cycle.',
  },
];

const ROWS = [
  { label: 'Events/month', key: 'events' as const },
  { label: 'Endpoints', key: 'endpoints' as const },
  { label: 'Retention', key: 'retention' as const },
  { label: 'Throughput', key: 'throughput' as const },
  { label: 'Retries', key: 'retries' as const },
  { label: 'Support', key: 'support' as const },
];

export default function PricingPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">Simple, fair pricing.</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Retries are always free. Save 20% with annual billing.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-4 font-medium text-[var(--color-text-muted)]" />
                {TIERS.map((tier) => (
                  <th key={tier.name} className="px-4 py-4 text-center">
                    <div className="text-lg font-semibold">{tier.name}</div>
                    <div className="mt-1 text-2xl font-bold">
                      {tier.price}
                      {tier.price !== '$0' && (
                        <span className="text-sm font-normal text-[var(--color-text-muted)]">
                          /mo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {tier.annual !== '$0' ? `${tier.annual}/mo billed annually` : 'Forever free'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.label}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.name} className="px-4 py-3 text-center">
                      {tier[row.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3 text-[var(--color-text-muted)]">Payload transformation</td>
                {TIERS.map((tier) => (
                  <td key={tier.name} className="px-4 py-3 text-center">
                    {tier.transform ? (
                      <span className="text-[var(--color-success)]">&#10003;</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">&mdash;</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
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
