'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useApps } from '@/lib/apps-context';
import {
  LayoutGrid,
  Settings,
  BarChart3,
  Zap,
  Link2,
  AlertTriangle,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

const ICON_SIZE = 16;

const GLOBAL_NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: '/dashboard', label: 'Applications', icon: <LayoutGrid size={ICON_SIZE} /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={ICON_SIZE} /> },
];

const APP_NAV_ITEMS: { segment: string; label: string; icon: ReactNode }[] = [
  { segment: '', label: 'Overview', icon: <BarChart3 size={ICON_SIZE} /> },
  { segment: '/events', label: 'Events', icon: <Zap size={ICON_SIZE} /> },
  { segment: '/endpoints', label: 'Endpoints', icon: <Link2 size={ICON_SIZE} /> },
  { segment: '/dlq', label: 'Dead Letter Queue', icon: <AlertTriangle size={ICON_SIZE} /> },
];

function NavLinks() {
  const pathname = usePathname();
  const params = useParams<{ appId?: string }>();
  const appId = params.appId;
  const inAppContext = !!appId;
  const { apps } = useApps();

  if (inAppContext) {
    const appBase = `/dashboard/app/${appId}`;
    const decodedId = decodeURIComponent(appId);
    const currentApp = apps.find((a) => a.uid === decodedId || a.id === decodedId);
    const appDisplayName = currentApp?.name ?? decodedId;
    return (
      <div className="flex flex-1 flex-col">
        <Link
          href="/dashboard"
          className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} />
          All Apps
        </Link>
        <div className="mb-3 truncate border-b border-[var(--color-border)] pb-3 text-sm font-semibold">
          {appDisplayName}
        </div>
        <ul className="space-y-1">
          {APP_NAV_ITEMS.map((item) => {
            const href = `${appBase}${item.segment}`;
            const active =
              item.segment === ''
                ? pathname === appBase || pathname === `${appBase}/`
                : pathname === href || pathname?.startsWith(href + '/');
            return (
              <li key={item.segment}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span className="inline-flex w-5 justify-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto">
          <ul className="space-y-1 border-t border-[var(--color-border)] pt-3">
            {GLOBAL_NAV_ITEMS.filter((i) => i.href !== '/dashboard').map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <span className="inline-flex w-5 justify-center">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // Global mode
  return (
    <ul className="space-y-1">
      {GLOBAL_NAV_ITEMS.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <span className="inline-flex w-5 justify-center">{item.icon}</span>
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
  const params = useParams<{ appId?: string }>();
  const appId = params.appId;

  if (appId) {
    const appBase = `/dashboard/app/${appId}`;
    const mobileAppItems = [
      ...APP_NAV_ITEMS,
      { segment: '@@back', label: 'Apps', icon: (<LayoutGrid size={ICON_SIZE} />) as ReactNode },
    ];
    return (
      <ul className="flex justify-around py-2">
        {mobileAppItems.map((item) => {
          if (item.segment === '@@back') {
            return (
              <li key="back">
                <Link
                  href="/dashboard"
                  className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-[var(--color-text-muted)]"
                >
                  <span className="flex justify-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          }
          const href = `${appBase}${item.segment}`;
          const active =
            item.segment === ''
              ? pathname === appBase || pathname === `${appBase}/`
              : pathname === href || pathname?.startsWith(href + '/');
          return (
            <li key={item.segment}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                  active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                <span className="flex justify-center">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  // Global mobile nav
  const mobileGlobalItems = GLOBAL_NAV_ITEMS;
  return (
    <ul className="flex justify-around py-2">
      {mobileGlobalItems.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <span className="flex justify-center">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: '/sign-in' })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
    >
      <span className="inline-flex w-5 justify-center">
        <LogOut size={ICON_SIZE} />
      </span>
      Sign Out
    </button>
  );
}

export function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 flex h-full w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 max-md:hidden">
      <div className="mb-4">
        <Link href="/dashboard" className="text-xl font-bold text-[var(--color-accent)]">
          EmitHQ
        </Link>
      </div>
      <Suspense fallback={null}>
        <NavLinks />
      </Suspense>
      <div className="mt-auto border-t border-[var(--color-border)] pt-3">
        <SignOutButton />
      </div>
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
