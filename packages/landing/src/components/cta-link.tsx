'use client';

import { trackEvent } from '@/lib/analytics';

export function CtaLink({
  href,
  tier,
  location,
  className,
  children,
}: {
  href: string;
  tier?: string;
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={() =>
        trackEvent('Signup CTA Clicked', {
          tier: tier ?? 'free',
          location,
        })
      }
      className={className}
    >
      {children}
    </a>
  );
}
