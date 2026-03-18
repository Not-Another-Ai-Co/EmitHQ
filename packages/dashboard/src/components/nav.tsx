'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect, type ReactNode } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useApps } from '@/lib/apps-context';
import {
  BarChart3,
  Zap,
  Link2,
  AlertTriangle,
  ArrowLeft,
  LogOut,
  Settings,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

const ICON_SIZE = 16;

const APP_NAV_ITEMS: { segment: string; label: string; icon: ReactNode }[] = [
  { segment: '', label: 'Overview', icon: <BarChart3 size={ICON_SIZE} /> },
  { segment: '/events', label: 'Events', icon: <Zap size={ICON_SIZE} /> },
  { segment: '/endpoints', label: 'Endpoints', icon: <Link2 size={ICON_SIZE} /> },
  { segment: '/dlq', label: 'DLQ', icon: <AlertTriangle size={ICON_SIZE} /> },
];

function AppSwitcher() {
  const { apps } = useApps();
  const params = useParams<{ appId?: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const appId = params.appId;
  const decodedId = appId ? decodeURIComponent(appId) : '';
  const currentApp = apps.find((a) => a.uid === decodedId || a.id === decodedId);
  const appDisplayName = currentApp?.name ?? decodedId;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  function switchTo(app: { id: string; uid: string | null }) {
    const param = app.uid ?? app.id;
    router.push(`/dashboard/app/${encodeURIComponent(param)}`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 truncate rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--color-bg)]/50"
        title={appDisplayName}
      >
        <span className="max-w-[120px] truncate md:max-w-[200px]">{appDisplayName}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && apps.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {apps.map((app) => {
            const isActive = app.uid === decodedId || app.id === decodedId;
            return (
              <button
                key={app.id}
                onClick={() => switchTo(app)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                }`}
              >
                <span className="truncate">{app.name}</span>
                {app.uid && app.uid !== 'default' && (
                  <span className="shrink-0 rounded bg-[var(--color-bg)] px-1 py-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                    {app.uid}
                  </span>
                )}
              </button>
            );
          })}
          <div className="border-t border-[var(--color-border)] mt-1 pt-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            >
              View all apps
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function TopBarLinks() {
  const pathname = usePathname();
  const params = useParams<{ appId?: string }>();
  const appId = params.appId;
  const inAppContext = !!appId;

  if (!inAppContext) return null;

  const appBase = `/dashboard/app/${appId}`;

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
      <AppSwitcher />
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

        {/* Right: Docs + Settings + Sign Out */}
        <div className="flex items-center gap-1">
          <a
            href="https://emithq.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            title="Documentation"
          >
            <BookOpen size={ICON_SIZE} />
            <span className="max-md:hidden">Docs</span>
          </a>
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
      <Suspense fallback={null}>
        <MobileAppNav />
      </Suspense>
    </>
  );
}
