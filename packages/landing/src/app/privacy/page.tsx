import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'EmitHQ Privacy Policy — what data we collect, how we process it, GDPR and CCPA compliance.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-12 text-sm text-[var(--color-text-muted)]">Last updated: March 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <Section title="1. Introduction">
            <p>
              EmitHQ (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates the EmitHQ
              webhook infrastructure platform. This Privacy Policy explains what data we collect,
              why, and how we handle it.
            </p>
            <p>
              We act as a <strong>data processor</strong> for webhook payload data (processing on
              your instructions) and as a <strong>data controller</strong> for account and usage
              data.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Category</th>
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Examples</th>
                  <th className="py-2 font-medium text-[var(--color-text)]">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <td className="py-2 pr-4">Account data</td>
                  <td className="py-2 pr-4">Name, email, company name, password hash</td>
                  <td className="py-2">Contract performance</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Billing data</td>
                  <td className="py-2 pr-4">
                    Stripe customer ID, subscription status (no card numbers stored)
                  </td>
                  <td className="py-2">Contract performance</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">API keys</td>
                  <td className="py-2 pr-4">SHA-256 hashes only &mdash; plaintext never stored</td>
                  <td className="py-2">Contract performance</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Webhook payloads</td>
                  <td className="py-2 pr-4">
                    Event data you send through the Service (transit and temporary storage)
                  </td>
                  <td className="py-2">Contract / Legitimate interest</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Delivery metadata</td>
                  <td className="py-2 pr-4">
                    Timestamps, HTTP status codes, response times, endpoint URLs
                  </td>
                  <td className="py-2">Legitimate interest</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Usage data</td>
                  <td className="py-2 pr-4">
                    Event counts, API call volumes, dashboard interactions
                  </td>
                  <td className="py-2">Legitimate interest</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Analytics</td>
                  <td className="py-2 pr-4">
                    Anonymized page views via Plausible (no cookies, no PII)
                  </td>
                  <td className="py-2">Legitimate interest</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="ml-4 list-disc space-y-1">
              <li>Deliver webhook events to configured endpoints</li>
              <li>Manage retry logic and dead-letter queues</li>
              <li>Authenticate API requests and enforce tenant isolation</li>
              <li>Monitor service health and debug delivery issues</li>
              <li>Process billing and enforce usage quotas</li>
              <li>Improve the Service based on aggregate usage patterns</li>
            </ul>
            <p>
              We never inspect, sell, or share webhook payload content with third parties. Payloads
              are processed solely for the purpose of delivery.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p>Webhook event data is retained according to your subscription tier:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Free: 3 days</li>
              <li>Starter: 14 days</li>
              <li>Growth: 30 days</li>
              <li>Scale: 90 days</li>
            </ul>
            <p>
              Account data is retained for the duration of your account plus 30 days after
              termination. Billing records are retained as required by law (typically 7 years).
            </p>
          </Section>

          <Section title="5. Subprocessors">
            <p>We use the following third-party services to operate the platform:</p>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Provider</th>
                  <th className="py-2 pr-4 font-medium text-[var(--color-text)]">Purpose</th>
                  <th className="py-2 font-medium text-[var(--color-text)]">Data Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <td className="py-2 pr-4">Cloudflare</td>
                  <td className="py-2 pr-4">Edge computing, CDN, DDoS protection</td>
                  <td className="py-2">Request headers, payloads (transit)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Railway</td>
                  <td className="py-2 pr-4">Application hosting</td>
                  <td className="py-2">All application data</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Neon</td>
                  <td className="py-2 pr-4">PostgreSQL database</td>
                  <td className="py-2">All persisted data</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Upstash</td>
                  <td className="py-2 pr-4">Redis (queues, caching)</td>
                  <td className="py-2">Queue job data, cache entries</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Stripe</td>
                  <td className="py-2 pr-4">Payment processing</td>
                  <td className="py-2">Billing data</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Clerk</td>
                  <td className="py-2 pr-4">Authentication</td>
                  <td className="py-2">Account credentials, session data</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Plausible</td>
                  <td className="py-2 pr-4">Web analytics</td>
                  <td className="py-2">Anonymized page views (no PII)</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="6. Your Rights (GDPR)">
            <p>If you are in the European Economic Area, you have the right to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>Access</strong> &mdash; Request a copy of your personal data
              </li>
              <li>
                <strong>Rectification</strong> &mdash; Correct inaccurate data
              </li>
              <li>
                <strong>Erasure</strong> &mdash; Request deletion of your data (&ldquo;right to be
                forgotten&rdquo;)
              </li>
              <li>
                <strong>Portability</strong> &mdash; Export your data in a machine-readable format
                (via API)
              </li>
              <li>
                <strong>Restriction</strong> &mdash; Limit how we process your data
              </li>
              <li>
                <strong>Objection</strong> &mdash; Object to processing based on legitimate interest
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a
                href="mailto:privacy@emithq.com"
                className="text-[var(--color-accent)] hover:underline"
              >
                privacy@emithq.com
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="7. Your Rights (CCPA)">
            <p>If you are a California resident, you have the right to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Know what personal information we collect and how it is used</li>
              <li>Request deletion of your personal information</li>
              <li>
                Opt out of the sale of personal information (we do not sell personal information)
              </li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
          </Section>

          <Section title="8. International Data Transfers">
            <p>
              Our infrastructure is hosted in the United States. If you are located outside the US,
              your data will be transferred to and processed in the US. For EU customers, we rely on
              Standard Contractual Clauses (SCCs) as the legal mechanism for data transfers. Our{' '}
              <a href="/dpa" className="text-[var(--color-accent)] hover:underline">
                Data Processing Agreement
              </a>{' '}
              includes SCCs.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We implement industry-standard security measures including: TLS 1.2+ encryption in
              transit, AES-256 encryption at rest, PostgreSQL Row-Level Security for tenant
              isolation, timing-safe signature verification, and API key hashing (SHA-256).
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated via email at least 30 days before taking effect. The &ldquo;Last
              updated&rdquo; date at the top of this page reflects the most recent revision.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy-related inquiries:{' '}
              <a
                href="mailto:privacy@emithq.com"
                className="text-[var(--color-accent)] hover:underline"
              >
                privacy@emithq.com
              </a>
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
