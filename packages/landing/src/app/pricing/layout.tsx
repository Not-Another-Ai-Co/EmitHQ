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
  alternates: { canonical: 'https://emithq.com/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
