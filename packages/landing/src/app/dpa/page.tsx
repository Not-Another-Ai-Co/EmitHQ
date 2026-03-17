import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description:
    'EmitHQ DPA — GDPR Article 28 compliant data processing agreement for enterprise customers.',
};

export default function DpaPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold">Data Processing Agreement</h1>
        <p className="mb-12 text-sm text-[var(--color-text-muted)]">Last updated: March 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the Terms of Service
            between the customer (&ldquo;Controller&rdquo;) and EmitHQ (&ldquo;Processor&rdquo;) and
            governs the processing of personal data in connection with the Service, in compliance
            with GDPR Article 28.
          </p>

          <Section title="1. Scope and Roles">
            <p>
              <strong>Controller:</strong> You (the customer) determine the purposes and means of
              processing personal data by choosing to send webhook payloads through the Service.
            </p>
            <p>
              <strong>Processor:</strong> EmitHQ processes personal data contained in webhook
              payloads solely on your documented instructions for the purpose of delivering webhooks
              to your configured endpoints.
            </p>
          </Section>

          <Section title="2. Processing Instructions">
            <p>
              The Processor shall process personal data only on documented instructions from the
              Controller. Your use of the API constitutes documented instructions. The Processor
              shall not process personal data for any purpose other than delivering webhook events
              and providing the Service as described in the Terms of Service.
            </p>
          </Section>

          <Section title="3. Confidentiality">
            <p>
              The Processor ensures that persons authorized to process personal data have committed
              themselves to confidentiality or are under an appropriate statutory obligation of
              confidentiality.
            </p>
          </Section>

          <Section title="4. Security Measures">
            <p>The Processor implements the following technical and organizational measures:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>PostgreSQL Row-Level Security for tenant data isolation</li>
              <li>API key authentication with SHA-256 hashing (no plaintext storage)</li>
              <li>Timing-safe signature verification (HMAC-SHA256)</li>
              <li>Access controls limiting personnel access to production data</li>
              <li>Multi-factor authentication (TOTP) for dashboard accounts</li>
              <li>Infrastructure provider certifications (SOC 2 via Cloudflare, Railway, Neon)</li>
            </ul>
          </Section>

          <Section title="5. Subprocessors">
            <p>
              The Controller provides general authorization for the Processor to engage
              subprocessors. The current list of subprocessors is published in our{' '}
              <a href="/privacy" className="text-[var(--color-accent)] hover:underline">
                Privacy Policy (Section 5)
              </a>
              .
            </p>
            <p>
              The Processor shall notify the Controller of any intended changes to subprocessors at
              least 30 days in advance. The Controller may object to a new subprocessor within 14
              days of notification. If the objection cannot be resolved, the Controller may
              terminate the affected Service.
            </p>
          </Section>

          <Section title="6. Data Subject Rights">
            <p>
              The Processor shall assist the Controller in responding to data subject requests
              (access, rectification, erasure, portability, restriction, objection) by providing
              technical capabilities via the API and dashboard to search, export, and delete event
              data.
            </p>
          </Section>

          <Section title="7. Data Breach Notification">
            <p>
              The Processor shall notify the Controller of any personal data breach without undue
              delay and no later than 72 hours after becoming aware of the breach. The notification
              shall include:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Nature of the breach, including categories and approximate number of records
                affected
              </li>
              <li>Contact details of the data protection point of contact</li>
              <li>Likely consequences of the breach</li>
              <li>Measures taken or proposed to address the breach</li>
            </ul>
          </Section>

          <Section title="8. Data Deletion and Return">
            <p>
              Upon termination of the Service, the Processor shall, at the Controller&apos;s choice,
              delete or return all personal data within 30 days. The Controller may export data via
              the API before termination. After the 30-day period, remaining data is permanently
              deleted and cannot be recovered.
            </p>
          </Section>

          <Section title="9. Audit Rights">
            <p>
              The Processor shall make available to the Controller all information necessary to
              demonstrate compliance with this DPA. The Controller may conduct audits, including
              inspections, no more than once per year with 30 days advance notice. The Processor may
              satisfy audit requests by providing relevant certifications, audit reports, or
              summaries from independent third-party auditors.
            </p>
          </Section>

          <Section title="10. International Transfers">
            <p>
              Where personal data is transferred outside the European Economic Area, the Processor
              relies on Standard Contractual Clauses (SCCs) as approved by the European Commission.
              The SCCs are incorporated by reference into this DPA.
            </p>
          </Section>

          <Section title="11. Duration and Termination">
            <p>
              This DPA remains in effect for the duration of the Service agreement. Obligations
              relating to confidentiality and data deletion survive termination.
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
