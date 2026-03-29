'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';
import { ErrorBanner } from '@/components/error-banner';
import { toast } from 'sonner';

interface DeletedApp {
  id: string;
  uid: string | null;
  name: string;
  deletedAt: string;
}

export function DangerZoneTab() {
  const apiFetch = useApiFetch();
  const [apps, setApps] = useState<DeletedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchDeleted = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/app?deleted=true');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setApps(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deleted apps');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  async function handleRestore(appId: string) {
    setRestoring(appId);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/app/${appId}/restore`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      await fetchDeleted();
      toast.success('Application restored');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore application');
    } finally {
      setRestoring(null);
    }
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  return (
    <div>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {apps.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No recently deleted apps.</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Deleted apps will appear here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            These apps will be permanently deleted after 30 days.
          </p>
          {apps.map((app) => {
            const deletedDate = new Date(app.deletedAt);
            const daysRemaining = Math.max(
              0,
              30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)),
            );
            return (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div>
                  <p className="font-medium">{app.name}</p>
                  {app.uid && (
                    <p className="text-xs text-[var(--color-text-muted)]">uid: {app.uid}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Deleted {deletedDate.toLocaleDateString()} · {daysRemaining} day
                    {daysRemaining !== 1 ? 's' : ''} remaining
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(app.id)}
                  disabled={restoring === app.id}
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
                >
                  {restoring === app.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
