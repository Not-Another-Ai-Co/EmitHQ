import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'EmitHQ vs Svix — Webhook Infrastructure Comparison 2026',
  description:
    'Compare EmitHQ and Svix on pricing, features, and licensing. EmitHQ fills the $49-$490 gap with mid-market webhook delivery.',
  openGraph: {
    title: 'EmitHQ vs Svix — Webhook Infrastructure Comparison',
    description: 'Side-by-side comparison of EmitHQ and Svix for webhook delivery.',
    url: 'https://emithq.com/compare/svix',
  },
  alternates: { canonical: 'https://emithq.com/compare/svix' },
};

const ROWS = [
  { label: 'Free tier', emithq: '100K events/mo', svix: '50K messages/mo' },
  { label: 'First paid tier', emithq: '$49/mo (Starter)', svix: '$490/mo (Pro)' },
  { label: 'Mid-market option', emithq: '$149/mo (Growth)', svix: 'None' },
  { label: 'Direction', emithq: 'Inbound + Outbound', svix: 'Outbound only' },
  { label: 'Retry strategy', emithq: 'Configurable per endpoint', svix: 'Fixed 8 attempts' },
  {
    label: 'Payload transformations',
    emithq: 'JSONPath + templates (Starter+, $49/mo)',
    svix: 'JavaScript (Pro+ only)',
  },
  { label: 'Signing spec', emithq: 'Standard Webhooks', svix: 'Standard Webhooks' },
  { label: 'SDK languages', emithq: 'TypeScript (more coming)', svix: '11 languages' },
  { label: 'License', emithq: 'AGPL-3.0 server + MIT SDKs', svix: 'MIT' },
  { label: 'Static IPs', emithq: 'Scale tier ($349/mo)', svix: 'Pro tier ($490/mo)' },
  { label: 'Multi-tenancy', emithq: 'RLS with org_id isolation', svix: 'Applications model' },
  { label: 'Dead-letter queue', emithq: 'Built-in with replay API', svix: 'Built-in' },
  {
    label: 'Circuit breaker',
    emithq: 'Auto-disable at 10 failures',
    svix: 'Auto-disable at 5 days',
  },
  { label: 'Compliance', emithq: 'GDPR/CCPA ready', svix: 'SOC2, HIPAA, PCI-DSS' },
];

export default function VsSvixPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">EmitHQ vs Svix</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Svix is the enterprise standard for outbound webhooks. But their
            $0&nbsp;&rarr;&nbsp;$490 pricing cliff leaves startups and mid-market teams without an
            option.
          </p>
        </div>

        {/* Pricing gap callout */}
        <div className="mb-16 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-8 text-center">
          <h2 className="text-xl font-bold">The pricing gap</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Svix jumps from $0 to $490/mo with nothing in between. EmitHQ fills that gap with three
            tiers at $49, $149, and $349 — giving growing teams production-grade webhook delivery
            without the enterprise price tag.
          </p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-4" />
                <th className="px-4 py-4 text-center text-lg font-semibold text-[var(--color-accent)]">
                  EmitHQ
                </th>
                <th className="px-4 py-4 text-center text-lg font-semibold">Svix</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.label}</td>
                  <td className="bg-[var(--color-accent)]/5 px-4 py-3 text-center">{row.emithq}</td>
                  <td className="px-4 py-3 text-center">{row.svix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* When to choose Svix */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-accent)]">
              Choose EmitHQ when
            </h3>
            <ul className="space-y-2 text-sm">
              <li>You need webhook delivery at $49-$349/mo, not $490+</li>
              <li>You want configurable retry schedules, not a fixed 8-attempt policy</li>
              <li>You need both inbound and outbound in one platform</li>
              <li>You want payload transformations without a $490/mo commitment</li>
              <li>You prefer AGPL open-source with the option to self-host</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <h3 className="mb-4 text-lg font-semibold">Choose Svix when</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>You need SOC2 Type II, HIPAA, or PCI-DSS compliance today</li>
              <li>You need SDKs in 11+ languages (Go, Python, Java, Ruby, etc.)</li>
              <li>You need an embeddable white-label Application Portal</li>
              <li>Budget isn&apos;t a constraint — $490/mo is acceptable</li>
              <li>You&apos;re already integrated and switching cost is high</li>
            </ul>
          </div>
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
            No credit card required.{' '}
            <Link href="/compare" className="text-[var(--color-accent)] hover:underline">
              See full comparison &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
