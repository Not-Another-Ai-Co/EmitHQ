import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'EmitHQ vs Hookdeck — Webhook Infrastructure Comparison 2026',
  description:
    'Compare EmitHQ and Hookdeck on pricing, features, and throughput. EmitHQ handles both inbound and outbound without hidden throughput caps.',
  openGraph: {
    title: 'EmitHQ vs Hookdeck — Webhook Infrastructure Comparison',
    description: 'Side-by-side comparison of EmitHQ and Hookdeck for webhook infrastructure.',
    url: 'https://emithq.com/compare/hookdeck',
  },
  alternates: { canonical: 'https://emithq.com/compare/hookdeck' },
};

const ROWS = [
  { label: 'Free tier', emithq: '100K events/mo', hookdeck: '10K events/mo' },
  { label: 'First paid tier', emithq: '$49/mo (500K events)', hookdeck: '$39/mo (10K + metered)' },
  { label: 'Growth tier', emithq: '$149/mo (2M events)', hookdeck: '$499/mo (metered)' },
  { label: 'Direction', emithq: 'Inbound + Outbound', hookdeck: 'Inbound (Outpost for outbound)' },
  { label: 'Default throughput', emithq: '50 evt/s (Starter)', hookdeck: '5 evt/s (all tiers)' },
  { label: 'Throughput scaling', emithq: 'Included in tier', hookdeck: 'Paid add-on (~$1/evt/s)' },
  { label: 'Retry strategy', emithq: 'Configurable, up to 50', hookdeck: 'Configurable, up to 50' },
  { label: 'Signing spec', emithq: 'Standard Webhooks', hookdeck: 'Custom (x-hookdeck-*)' },
  { label: 'Payload transformations', emithq: 'JSONPath + templates', hookdeck: 'JavaScript' },
  { label: 'SDK languages', emithq: 'TypeScript', hookdeck: 'TypeScript' },
  { label: 'License', emithq: 'AGPL-3.0 (open source)', hookdeck: 'Proprietary' },
  { label: 'Self-hosted option', emithq: 'Yes', hookdeck: 'No (Outpost only)' },
  { label: 'Data retention (paid)', emithq: '14-90 days by tier', hookdeck: '7-30 days by tier' },
  { label: 'Static IPs', emithq: 'Scale tier', hookdeck: 'Enterprise only' },
];

export default function VsHookdeckPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">EmitHQ vs Hookdeck</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Hookdeck is strong on inbound webhook routing. But the 5 evt/s throughput cap, metered
            pricing, and $39&nbsp;&rarr;&nbsp;$499 jump create hidden costs that grow with your
            usage.
          </p>
        </div>

        {/* Throughput trap callout */}
        <div className="mb-16 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-8 text-center">
          <h2 className="text-xl font-bold">The throughput trap</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Hookdeck defaults to 5 events/second on all tiers. Scaling throughput is a paid add-on
            at ~$1 per evt/s. At 50 evt/s, that alone costs more than EmitHQ&apos;s Growth tier —
            which includes 200 evt/s by default.
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
                <th className="px-4 py-4 text-center text-lg font-semibold">Hookdeck</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.label}</td>
                  <td className="bg-[var(--color-accent)]/5 px-4 py-3 text-center">{row.emithq}</td>
                  <td className="px-4 py-3 text-center">{row.hookdeck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* When to choose */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-accent)]">
              Choose EmitHQ when
            </h3>
            <ul className="space-y-2 text-sm">
              <li>You need both inbound and outbound in one platform</li>
              <li>Throughput predictability matters — no per-evt/s surcharges</li>
              <li>You want Standard Webhooks signing, not a proprietary spec</li>
              <li>You want to self-host the server (AGPL-3.0)</li>
              <li>$149/mo for 2M events beats $499/mo + metered overages</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <h3 className="mb-4 text-lg font-semibold">Choose Hookdeck when</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>Your primary need is inbound webhook routing and transformation</li>
              <li>You need the local dev CLI with multi-user simultaneous connections</li>
              <li>You need SOC2 Type II compliance today</li>
              <li>Low volume makes metered pricing cheaper than a flat tier</li>
              <li>You want Outpost (Apache 2.0) for self-hosted outbound delivery</li>
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
