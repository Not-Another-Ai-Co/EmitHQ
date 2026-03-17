'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useApiFetch } from '@/lib/use-api';

interface App {
  id: string;
  uid: string | null;
  name: string;
  createdAt: string;
}

export function AppSwitcher() {
  const [apps, setApps] = useState<App[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const apiFetch = useApiFetch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentAppId = searchParams.get('app') ?? 'default';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/v1/app');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setApps(json.data ?? []);
      } catch {
        // ignore — apps list will be empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentApp = apps.find((a) => a.uid === currentAppId || a.id === currentAppId);
  const displayName = currentApp?.name ?? currentAppId;

  function selectApp(app: App) {
    const appParam = app.uid ?? app.id;
    const params = new URLSearchParams(searchParams.toString());
    params.set('app', appParam);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  if (loading) {
    return (
      <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
        Loading...
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
        No apps yet
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]/50"
      >
        <span className="truncate">{displayName}</span>
        <span className="ml-2 text-[var(--color-text-muted)]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {apps.map((app) => {
            const isActive = app.uid === currentAppId || app.id === currentAppId;
            return (
              <button
                key={app.id}
                onClick={() => selectApp(app)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  isActive
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span className="truncate">{app.name}</span>
                {app.uid && (
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{app.uid}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
