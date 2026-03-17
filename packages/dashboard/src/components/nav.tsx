'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { AppSwitcher } from '@/components/app-switcher';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '◉' },
  { href: '/dashboard/events', label: 'Events', icon: '⚡' },
  { href: '/dashboard/endpoints', label: 'Endpoints', icon: '🔗' },
  { href: '/dashboard/dlq', label: 'Dead Letter Queue', icon: '⚠' },
  { href: '/dashboard/applications', label: 'Applications', icon: '📦' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appParam = searchParams.get('app');
  const [onboardingDismissed, setOnboardingDismissed] = useState(true);

  useEffect(() => {
    setOnboardingDismissed(localStorage.getItem('emithq_onboarding_dismissed') === 'true');
  }, []);

  function hrefWithApp(base: string): string {
    if (!appParam) return base;
    return `${base}?app=${encodeURIComponent(appParam)}`;
  }

  return (
    <ul className="space-y-1">
      {!onboardingDismissed && (
        <li>
          <Link
            href="/dashboard/getting-started"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === '/dashboard/getting-started'
                ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>🚀</span>
            Getting Started
          </Link>
        </li>
      )}
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <li key={item.href}>
            <Link
              href={hrefWithApp(item.href)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MobileNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appParam = searchParams.get('app');

  function hrefWithApp(base: string): string {
    if (!appParam) return base;
    return `${base}?app=${encodeURIComponent(appParam)}`;
  }

  // Show first 4 nav items + Profile on mobile
  const mobileItems = [...NAV_ITEMS.slice(0, 4), NAV_ITEMS[NAV_ITEMS.length - 1]];

  return (
    <ul className="flex justify-around py-2">
      {mobileItems.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <li key={item.href}>
            <Link
              href={hrefWithApp(item.href)}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-56 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 max-md:hidden">
      <div className="mb-4">
        <Link href="/dashboard" className="text-xl font-bold text-[var(--color-accent)]">
          EmitHQ
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
            Loading...
          </div>
        }
      >
        <AppSwitcher />
      </Suspense>
      <Suspense fallback={null}>
        <NavLinks />
      </Suspense>
    </nav>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden">
      <Suspense fallback={null}>
        <MobileNavLinks />
      </Suspense>
    </nav>
  );
}
