import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare — EmitHQ vs Svix vs Hookdeck',
  description:
    'See how EmitHQ compares to Svix, Hookdeck, and Convoy on pricing, features, and licensing.',
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
    transform: true,
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

        {/* Build vs Buy */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold">vs Building Your Own</h2>
          <div className="mx-auto max-w-3xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 font-semibold text-[var(--color-text-muted)]">
                  Building in-house
                </h3>
                <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                  <li>2-4 weeks of engineering time</li>
                  <li>Retry logic, DLQ, monitoring from scratch</li>
                  <li>Ongoing maintenance burden</li>
                  <li>Signature verification you have to get right</li>
                  <li>No multi-tenant isolation built-in</li>
                  <li>Hidden cost: on-call for webhook failures</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold text-[var(--color-accent)]">Using EmitHQ</h3>
                <ul className="space-y-2 text-sm">
                  <li>5-minute SDK integration</li>
                  <li>Configurable retries + DLQ + dashboard included</li>
                  <li>We handle uptime and scaling</li>
                  <li>Standard Webhooks signing built-in</li>
                  <li>RLS multi-tenancy from day one</li>
                  <li>Open-source: self-host if you outgrow us</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
