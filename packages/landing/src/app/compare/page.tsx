import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Webhooks as a Service Comparison 2026 — EmitHQ vs Svix vs Hookdeck vs Convoy',
  description:
    'Compare webhook infrastructure platforms: EmitHQ, Svix, Hookdeck, Convoy, and Outpost. Pricing, features, licensing, and the $49-$490 gap.',
  openGraph: {
    title: 'Webhooks as a Service Comparison 2026',
    description: 'The complete webhook platform comparison — pricing, features, and trade-offs.',
    url: 'https://emithq.com/compare',
  },
  alternates: { canonical: 'https://emithq.com/compare' },
};

const COMPETITORS = [
  {
    name: 'EmitHQ',
    highlight: true,
    pricing: '$0 / $49 / $149 / $349',
    events: 'Up to 10M/mo',
    inbound: true,
    outbound: true,
    retries: 'Configurable per endpoint',
    signing: 'Standard Webhooks',
    transform: 'Starter+ ($49/mo)',
    license: 'AGPL-3.0 + MIT SDKs',
    selfHost: true,
    dashboard: true,
    staticIps: 'Scale tier',
  },
  {
    name: 'Svix',
    highlight: false,
    pricing: '$0 / $490 / Custom',
    events: 'Up to 5M/mo',
    inbound: 'Svix Ingest (separate)',
    outbound: true,
    retries: 'Fixed 8 attempts',
    signing: 'Standard Webhooks',
    transform: false,
    license: 'MIT (limited)',
    selfHost: true,
    dashboard: true,
    staticIps: 'Enterprise only',
  },
  {
    name: 'Hookdeck',
    highlight: false,
    pricing: '$0 / $39 / $499 / Custom',
    events: 'Up to 2M/mo',
    inbound: true,
    outbound: 'Via Outpost (separate)',
    retries: 'Configurable',
    signing: 'Custom',
    transform: true,
    license: 'Proprietary',
    selfHost: false,
    dashboard: true,
    staticIps: 'Enterprise only',
  },
  {
    name: 'Convoy',
    highlight: false,
    pricing: '$0 / $99 / $299 / Custom',
    events: 'Up to 5M/mo',
    inbound: true,
    outbound: true,
    retries: 'Configurable',
    signing: 'Custom (not Standard Webhooks)',
    transform: false,
    license: 'ELv2 (restrictive)',
    selfHost: true,
    dashboard: true,
    staticIps: 'Paid add-on',
  },
];

const ROWS: Array<{ label: string; key: keyof (typeof COMPETITORS)[0] }> = [
  { label: 'Pricing tiers', key: 'pricing' },
  { label: 'Monthly events', key: 'events' },
  { label: 'Inbound webhooks', key: 'inbound' },
  { label: 'Outbound delivery', key: 'outbound' },
  { label: 'Retry strategy', key: 'retries' },
  { label: 'Signing spec', key: 'signing' },
  { label: 'Payload transformation', key: 'transform' },
  { label: 'License', key: 'license' },
  { label: 'Self-hosted option', key: 'selfHost' },
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Static IPs', key: 'staticIps' },
];

function renderCell(value: unknown) {
  if (value === true) return <span className="text-[var(--color-success)]">&#10003;</span>;
  if (value === false) return <span className="text-[var(--color-text-muted)]">&mdash;</span>;
  return <span>{String(value)}</span>;
}

export default function ComparePage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">How EmitHQ compares.</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            We built EmitHQ because the mid-market gap in webhook infrastructure was unacceptable.
            Here&apos;s how we stack up.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-4" />
                {COMPETITORS.map((c) => (
                  <th
                    key={c.name}
                    className={`px-4 py-4 text-center text-lg font-semibold ${
                      c.highlight ? 'text-[var(--color-accent)]' : ''
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.label}</td>
                  {COMPETITORS.map((c) => (
                    <td
                      key={c.name}
                      className={`px-4 py-3 text-center ${
                        c.highlight ? 'bg-[var(--color-accent)]/5' : ''
                      }`}
                    >
                      {renderCell(c[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deep-dive links */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Link
            href="/compare/svix"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[var(--color-accent)]/50"
          >
            <h3 className="font-semibold">EmitHQ vs Svix</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              The $0&nbsp;&rarr;&nbsp;$490 pricing gap explained. Feature-by-feature breakdown.
            </p>
            <span className="mt-3 inline-block text-sm text-[var(--color-accent)]">
              Read comparison &rarr;
            </span>
          </Link>
          <Link
            href="/compare/hookdeck"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[var(--color-accent)]/50"
          >
            <h3 className="font-semibold">EmitHQ vs Hookdeck</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              The throughput trap and hidden metered costs. Inbound vs both directions.
            </p>
            <span className="mt-3 inline-block text-sm text-[var(--color-accent)]">
              Read comparison &rarr;
            </span>
          </Link>
          <Link
            href="/compare/build-vs-buy"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[var(--color-accent)]/50"
          >
            <h3 className="font-semibold">Build vs Buy</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              The true cost of building webhook infrastructure in-house. Component-by-component.
            </p>
            <span className="mt-3 inline-block text-sm text-[var(--color-accent)]">
              Read analysis &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
