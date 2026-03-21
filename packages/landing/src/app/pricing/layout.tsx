import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — EmitHQ Webhook Infrastructure',
  description:
    'EmitHQ pricing — webhook infrastructure from $49/mo. Free tier with 100K events. No credit card required. Retries always free.',
  openGraph: {
    title: 'EmitHQ Pricing — Webhook Infrastructure from $49/mo',
    description: 'Simple, fair pricing. Free tier included. Retries always free.',
    url: 'https://emithq.com/pricing',
  },
  alternates: { canonical: '/pricing' },
};

const JSONLD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What counts as an event?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each message you send through the API counts as one event. Fan-out to multiple endpoints counts as one event per endpoint. Retries are always free — never counted.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when I hit my limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "On the free tier, your API returns 429 — no surprise bills. On paid tiers, overage is billed at $0.30-$0.50 per 1,000 events depending on tier. You'll get a warning at 80% usage.",
      },
    },
    {
      '@type': 'Question',
      name: 'Are retries free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. If a delivery fails and is retried 7 times, you are charged for 1 event. Retries never count against your quota.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I change plans at any time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Upgrades take effect immediately (prorated). Downgrades take effect at the next billing cycle. No lock-in, cancel anytime.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I self-host EmitHQ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The server is AGPL-3.0 licensed. Self-host for free with your own infrastructure. The managed service adds SLA guarantees, monitoring, and priority support.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does annual billing work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Annual billing saves 20% on all paid tiers. You pay upfront for 12 months. Same features, same support — just cheaper.',
      },
    },
  ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }}
      />
      {children}
    </>
  );
}
