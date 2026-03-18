'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useApps } from '@/lib/apps-context';
import { BarChart3, Zap, Link2, AlertTriangle, ArrowLeft, LogOut, Settings } from 'lucide-react';

const ICON_SIZE = 16;

const APP_NAV_ITEMS: { segment: string; label: string; icon: ReactNode }[] = [
  { segment: '', label: 'Overview', icon: <BarChart3 size={ICON_SIZE} /> },
  { segment: '/events', label: 'Events', icon: <Zap size={ICON_SIZE} /> },
  { segment: '/endpoints', label: 'Endpoints', icon: <Link2 size={ICON_SIZE} /> },
  { segment: '/dlq', label: 'DLQ', icon: <AlertTriangle size={ICON_SIZE} /> },
];

function TopBarLinks() {
  const pathname = usePathname();
  const params = useParams<{ appId?: string }>();
  const appId = params.appId;
  const inAppContext = !!appId;
  const { apps } = useApps();

  if (!inAppContext) return null;

  const appBase = `/dashboard/app/${appId}`;
  const decodedId = decodeURIComponent(appId);
  const currentApp = apps.find((a) => a.uid === decodedId || a.id === decodedId);
  const appDisplayName = currentApp?.name ?? decodedId;

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={14} />
        <span className="max-md:hidden">Apps</span>
      </Link>
      <span className="text-[var(--color-border)]">|</span>
      <span className="truncate px-2 text-sm font-semibold max-w-[120px] md:max-w-[200px]">
        {appDisplayName}
      </span>
      <span className="text-[var(--color-border)]">|</span>
      {APP_NAV_ITEMS.map((item) => {
        const href = `${appBase}${item.segment}`;
        const active =
          item.segment === ''
            ? pathname === appBase || pathname === `${appBase}/`
            : pathname === href || pathname?.startsWith(href + '/');
        return (
          <Link
            key={item.segment}
            href={href}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors max-md:px-1.5 ${
              active
                ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'border-transparent bg-[var(--color-bg)]/50 text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            <span className="inline-flex">{item.icon}</span>
            <span className="max-md:hidden">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function MobileAppNav() {
  const pathname = usePathname();
  const params = useParams<{ appId?: string }>();
  const appId = params.appId;

  if (!appId) return null;

  const appBase = `/dashboard/app/${appId}`;

  return (
    <>
      <div className="fixed left-0 right-0 top-14 z-40 flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 md:hidden">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={12} />
          Apps
        </Link>
        {APP_NAV_ITEMS.map((item) => {
          const href = `${appBase}${item.segment}`;
          const active =
            item.segment === ''
              ? pathname === appBase || pathname === `${appBase}/`
              : pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={item.segment}
              href={href}
              className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                active
                  ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-muted)]'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Spacer to push main content below the fixed mobile nav row */}
      <div className="h-10 md:hidden" />
    </>
  );
}

function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: '/sign-in' })}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      title="Sign out"
    >
      <LogOut size={ICON_SIZE} />
      <span className="max-md:hidden">Sign Out</span>
    </button>
  );
}

export function TopBar() {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        {/* Left: Logo + app context nav */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-bold text-[var(--color-accent)]">
            EmitHQ
          </Link>
          <Suspense fallback={null}>
            <TopBarLinks />
          </Suspense>
        </div>

        {/* Right: Settings + Sign Out */}
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            title="Settings"
          >
            <Settings size={ICON_SIZE} />
            <span className="max-md:hidden">Settings</span>
          </Link>
          <Suspense fallback={null}>
            <SignOutButton />
          </Suspense>
        </div>
      </header>
      {/* Mobile: secondary nav row for app-context items */}
      <Suspense fallback={null}>
        <MobileAppNav />
      </Suspense>
    </>
  );
}
