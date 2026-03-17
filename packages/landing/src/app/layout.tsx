import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EmitHQ — Reliable Webhooks, Fair Pricing',
    template: '%s | EmitHQ',
  },
  description:
    'Open-source webhook infrastructure for growing SaaS teams. Inbound and outbound webhooks with Standard Webhooks signing, configurable retries, and a dashboard. From $49/mo.',
  keywords: [
    'webhook service',
    'webhook platform',
    'webhook infrastructure',
    'svix alternative',
    'hookdeck alternative',
    'open source webhook',
    'webhook delivery',
    'webhook retry',
    'managed webhooks',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'EmitHQ',
    title: 'EmitHQ — Reliable Webhooks, Fair Pricing',
    description:
      'Open-source webhook infrastructure from $49/mo. Not $490. Standard Webhooks signing, configurable retries, real-time dashboard.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EmitHQ — Reliable Webhooks, Fair Pricing',
    description: 'Open-source webhook infrastructure from $49/mo. Not $490.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script defer src="/t/u.js" data-website-id="6664f0da-fcc1-4bea-a940-26ff3e089a45" />
      </head>
      <body className="min-h-screen antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
