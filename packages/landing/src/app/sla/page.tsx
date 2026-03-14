import type { Metadata } from 'next';
import { LegalBanner } from '@/components/legal-banner';

export const metadata: Metadata = {
  title: 'Service Level Agreement',
  description: 'EmitHQ SLA — uptime commitments, service credits, and exclusions by tier.',
};

export default function SlaPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <LegalBanner />
        <h1 className="mb-2 text-3xl font-bold">Service Level Agreement</h1>
        <p className="mb-12 text-sm text-[var(--color-text-muted)]">Last updated: March 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <Section title="1. Uptime Commitment">
            <p>
              EmitHQ commits to the following monthly uptime percentages for the webhook delivery
              API:
            </p>
            <table className="mt-3 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Tier</th>
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Uptime SLA</th>
                  <th className="py-2 font-medium text-[var(--color-text)]">Max Downtime/Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <td className="py-2 pr-4">Free</td>
                  <td className="py-2 pr-4">No SLA</td>
                  <td className="py-2">&mdash;</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Starter ($49/mo)</td>
                  <td className="py-2 pr-4">99.9%</td>
                  <td className="py-2">~43 minutes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Growth ($149/mo)</td>
                  <td className="py-2 pr-4">99.95%</td>
                  <td className="py-2">~22 minutes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Scale ($349/mo)</td>
                  <td className="py-2 pr-4">99.99%</td>
                  <td className="py-2">~4 minutes</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">
              &ldquo;Uptime&rdquo; means the webhook delivery API (POST /api/v1/app/:appId/msg) is
              accepting and processing requests. The dashboard and documentation site are not
              covered by this SLA.
            </p>
          </Section>

          <Section title="2. Service Credits">
            <p>
              If monthly uptime falls below the committed SLA, you are eligible for service credits
              applied to your next invoice:
            </p>
            <table className="mt-3 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Monthly Uptime</th>
                  <th className="py-2 font-medium text-[var(--color-text)]">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <td className="py-2 pr-4">&lt; 99.9% but &ge; 99.0%</td>
                  <td className="py-2">10% of monthly fee</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">&lt; 99.0%</td>
                  <td className="py-2">25% of monthly fee</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">
              Credits are capped at 30% of your monthly fee. Credits are issued as account balance
              adjustments, not cash refunds. Credits must be requested within 30 days of the
              incident.
            </p>
          </Section>

          <Section title="3. Exclusions">
            <p>The following are excluded from uptime calculations:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Scheduled maintenance (announced at least 48 hours in advance)</li>
              <li>Force majeure events (natural disasters, war, government actions)</li>
              <li>Failures caused by your systems, endpoints, or network connectivity</li>
              <li>API requests that exceed your tier&apos;s rate limits</li>
              <li>
                Outages of third-party providers (Cloudflare, Neon, Upstash) that are outside our
                control
              </li>
              <li>Beta or preview features</li>
            </ul>
          </Section>

          <Section title="4. Measurement">
            <p>
              Uptime is measured using external monitoring (synthetic health checks every 60 seconds
              from multiple geographic locations). A &ldquo;downtime minute&rdquo; is recorded when
              two or more monitoring locations fail to receive a successful response.
            </p>
            <p>
              Monthly uptime percentage = (total minutes in month &minus; downtime minutes) / total
              minutes in month &times; 100.
            </p>
          </Section>

          <Section title="5. Claiming Credits">
            <p>To claim a service credit:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>
                Email{' '}
                <a
                  href="mailto:support@emithq.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  support@emithq.com
                </a>{' '}
                within 30 days of the incident
              </li>
              <li>Include your organization name and the dates/times of the outage</li>
              <li>We will verify the claim against our monitoring data within 5 business days</li>
              <li>Approved credits are applied to your next invoice</li>
            </ol>
          </Section>

          <Section title="6. Delivery SLA (Best Effort)">
            <p>
              In addition to API uptime, we target the following delivery performance metrics on a
              best-effort basis (not credit-eligible):
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                99.9% delivery success rate (measured as 2xx responses from destination endpoints)
              </li>
              <li>p95 delivery latency &lt; 500ms (time from enqueue to HTTP delivery attempt)</li>
              <li>p99 delivery latency &lt; 2,000ms</li>
            </ul>
            <p>
              These targets exclude endpoint-side failures (timeouts, 5xx responses from your
              customers&apos; endpoints).
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
