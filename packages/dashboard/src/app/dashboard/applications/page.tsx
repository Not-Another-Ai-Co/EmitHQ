'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiFetch } from '@/lib/use-api';

interface App {
  id: string;
  uid: string | null;
  name: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUid, setCreateUid] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const apiFetch = useApiFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAppId = searchParams.get('app') ?? 'default';

  const fetchApps = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/app');
      if (!res.ok) throw new Error('Failed to load applications');
      const json = await res.json();
      setApps(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, string> = { name: createName.trim() };
      if (createUid.trim()) body.uid = createUid.trim();
      const res = await apiFetch('/api/v1/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setCreateName('');
      setCreateUid('');
      setShowCreate(false);
      await fetchApps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setCreating(false);
    }
  }

  function selectApp(app: App) {
    const appParam = app.uid ?? app.id;
    router.push(`/dashboard?app=${encodeURIComponent(appParam)}`);
  }

  async function handleDelete(appId: string) {
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/app/${appId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setDeleteConfirm(null);
      // If we deleted the active app, clear the app param
      if (appId === currentAppId) {
        router.push('/dashboard/applications');
      }
      await fetchApps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Applications</h1>
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          {showCreate ? 'Cancel' : 'New Application'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-[var(--color-error)]/70 hover:text-[var(--color-error)]"
          >
            ×
          </button>
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 className="mb-4 text-lg font-semibold">Create Application</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
              Name <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="My App"
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
              UID <span className="text-xs">(optional — your own identifier)</span>
            </label>
            <input
              type="text"
              value={createUid}
              onChange={(e) => setCreateUid(e.target.value)}
              placeholder="my-app"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !createName.trim()}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {apps.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">
            No applications yet. Create your first app to start sending webhooks.
          </p>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
            >
              Create First Application
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const isActive = app.uid === currentAppId || app.id === currentAppId;
            return (
              <div
                key={app.id}
                className={`rounded-xl border p-5 transition-colors ${
                  isActive
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30'
                }`}
              >
                <button onClick={() => selectApp(app)} className="w-full text-left">
                  <h3 className="font-semibold">{app.name}</h3>
                  {app.uid && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">uid: {app.uid}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Created {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  {isActive && (
                    <span className="mt-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs text-[var(--color-accent)]">
                      Active
                    </span>
                  )}
                </button>
                {deleteConfirm === app.id ? (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-xs text-red-400">
                      This will permanently delete this app and all its endpoints, messages, and
                      delivery data. This cannot be reversed.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deleting}
                        className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(app.id);
                    }}
                    className="mt-3 text-xs text-[var(--color-text-muted)] hover:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
