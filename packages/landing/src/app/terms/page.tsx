import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'EmitHQ Terms of Service — service description, acceptable use, liability, and data handling.',
};

export default function TermsPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
        <p className="mb-12 text-sm text-[var(--color-text-muted)]">Last updated: March 13, 2026</p>

        <div className="prose-legal space-y-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <Section title="1. Service Description">
            <p>
              EmitHQ (&ldquo;Service&rdquo;) is a webhook infrastructure platform operated by EmitHQ
              (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). The Service provides
              outbound webhook delivery, inbound webhook reception, payload transformation, retry
              management, and monitoring capabilities via API and web dashboard.
            </p>
            <p>
              &ldquo;Delivery&rdquo; means the Service has received a 2xx HTTP response from the
              destination endpoint. The Service provides an at-least-once delivery guarantee &mdash;
              not exactly-once. Customers are responsible for implementing idempotency on their
              receiving endpoints.
            </p>
            <p>
              The Service operates a retry policy for failed deliveries. Retry schedules are
              configurable per endpoint on paid tiers. Events that exhaust all retry attempts are
              moved to a dead-letter queue and can be manually replayed via the API or dashboard.
            </p>
          </Section>

          <Section title="2. Accounts and API Keys">
            <p>
              You must create an account to use the Service. You are responsible for maintaining the
              security of your account credentials and API keys. API keys grant full programmatic
              access to your organization&apos;s data and must be treated as secrets.
            </p>
            <p>
              You may create multiple API keys for zero-downtime rotation. Revoked keys are
              immediately invalidated and cannot be restored.
            </p>
          </Section>

          <Section title="3. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Send unsolicited messages (spam) or bulk marketing communications</li>
              <li>
                Conduct denial-of-service attacks or intentionally degrade service performance
              </li>
              <li>Transmit illegal content or content that violates third-party rights</li>
              <li>Circumvent rate limits, usage quotas, or other service restrictions</li>
              <li>Attempt to access other customers&apos; data or bypass tenant isolation</li>
              <li>
                Use the Service for real-time communication (chat, streaming) rather than event
                delivery
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms without
              prior notice.
            </p>
          </Section>

          <Section title="4. Pricing, Billing, and Quotas">
            <p>
              The Service offers Free, Starter ($49/mo), Growth ($149/mo), and Scale ($349/mo)
              tiers. Annual billing is available at a 20% discount.
            </p>
            <p>
              <strong>Free tier:</strong> Usage is hard-capped at 100,000 events per month. When the
              limit is reached, the API returns HTTP 429 until the next billing cycle. No charges
              are incurred.
            </p>
            <p>
              <strong>Paid tiers:</strong> Overage beyond the included event quota is billed at the
              per-tier overage rate ($0.30&ndash;$0.50 per 1,000 events). Retries never count
              against your event quota.
            </p>
            <p>
              Upgrades take effect immediately and are prorated. Downgrades take effect at the start
              of the next billing cycle. You may cancel at any time; cancellation takes effect at
              the end of the current billing period.
            </p>
          </Section>

          <Section title="5. Data Handling">
            <p>
              Webhook payloads transit through our infrastructure for the purpose of delivery. We do
              not inspect, analyze, or use payload content for any purpose beyond delivery and
              troubleshooting.
            </p>
            <p>
              Event data is retained according to your tier: Free (3 days), Starter (14 days),
              Growth (30 days), Scale (90 days). After the retention period, event data is
              permanently deleted.
            </p>
            <p>
              All data is encrypted in transit (TLS 1.2+) and at rest (AES-256 via infrastructure
              provider). See our{' '}
              <a href="/privacy" className="text-[var(--color-accent)] hover:underline">
                Privacy Policy
              </a>{' '}
              for full details.
            </p>
          </Section>

          <Section title="6. Customer Responsibilities">
            <p>You are responsible for:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Maintaining the availability and performance of your webhook receiving endpoints
              </li>
              <li>
                Implementing webhook signature verification on your endpoints using the provided
                signing secret
              </li>
              <li>Handling idempotency for events that may be delivered more than once</li>
              <li>
                Monitoring delivery status via the dashboard or API and replaying failed events as
                needed
              </li>
              <li>Keeping your endpoint URLs and signing secrets up to date</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The Service, including all software, documentation, and infrastructure, is owned by
              EmitHQ. The server software is licensed under AGPL-3.0; SDKs are licensed under MIT.
            </p>
            <p>
              You retain all rights to your event payloads, endpoint configurations, and application
              data. We claim no ownership or license over your data.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              <strong>Liability cap:</strong> Our total aggregate liability for any claims arising
              from or related to the Service is limited to the total fees paid by you in the twelve
              (12) months preceding the claim.
            </p>
            <p>
              <strong>Exclusion of consequential damages:</strong> In no event shall we be liable
              for any indirect, incidental, special, consequential, or punitive damages, including
              loss of profits, loss of data, business interruption, or loss of business
              opportunities, regardless of the theory of liability.
            </p>
            <p>
              <strong>Indemnification:</strong> Each party&apos;s indemnification obligations are
              capped at three times (3x) the annual fees paid or payable.
            </p>
          </Section>

          <Section title="9. Service Level Agreement">
            <p>
              Uptime commitments and service credits are defined in our{' '}
              <a href="/sla" className="text-[var(--color-accent)] hover:underline">
                Service Level Agreement
              </a>
              . The Free tier does not include an SLA.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              Either party may terminate this agreement with thirty (30) days written notice. Upon
              termination, you may export your data via the API. We will delete your data within
              thirty (30) days of the effective termination date.
            </p>
            <p>
              We may terminate or suspend your account immediately for material breach of these
              terms, including but not limited to acceptable use violations or non-payment.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Delaware, United States, without
              regard to conflict of law principles. Any disputes shall be resolved in the state or
              federal courts located in Delaware.
            </p>
          </Section>

          <Section title="12. Changes to Terms">
            <p>
              We may update these Terms from time to time. Material changes will be communicated via
              email to the account owner at least thirty (30) days before taking effect. Continued
              use of the Service after changes take effect constitutes acceptance.
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
