'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiFetch } from '@/lib/use-api';
import { useApps } from '@/lib/apps-context';
import { GettingStartedCard } from '@/components/getting-started-card';
import { SkeletonCard } from '@/components/skeleton';
import { toast } from 'sonner';

export default function AppsLandingPage() {
  const { apps, loading, error: appsError, refetch, removeApp } = useApps();
  const [localError, setLocalError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createUid, setCreateUid] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const apiFetch = useApiFetch();
  const router = useRouter();

  const error = localError ?? appsError;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setLocalError(null);
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
      await refetch();
      toast.success('Application created');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setCreating(false);
    }
  }

  function selectApp(app: { id: string; uid: string | null }) {
    const appParam = app.uid ?? app.id;
    router.push(`/dashboard/app/${encodeURIComponent(appParam)}`);
  }

  async function handleDelete(appId: string) {
    setDeleting(true);
    setLocalError(null);
    const deletedApp = apps.find((a) => a.id === appId);
    try {
      const res = await apiFetch(`/api/v1/app/${appId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setDeleteConfirm(null);
      removeApp(appId);
      if (deletedApp) {
        toast(`"${deletedApp.name}" deleted`, {
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                const res = await apiFetch(`/api/v1/app/${deletedApp.id}/restore`, {
                  method: 'POST',
                });
                if (!res.ok) throw new Error('Failed to restore');
                await refetch();
                toast.success('Application restored');
              } catch {
                toast.error('Failed to undo delete');
              }
            },
          },
          duration: 5000,
        });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to delete application');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Applications</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <GettingStartedCard />
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
            onClick={() => setLocalError(null)}
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
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => selectApp(app)}
              className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold group-hover:text-[var(--color-accent)]">{app.name}</h3>
                {app.uid && (
                  <span className="ml-2 shrink-0 rounded bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                    {app.uid}
                  </span>
                )}
              </div>
              <div className="mb-3 flex gap-4 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Endpoints</p>
                  <p className="font-semibold">{app.endpointCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Events (24h)</p>
                  <p className="font-semibold">{app.events24h ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Created {new Date(app.createdAt).toLocaleDateString()}
                </p>
                {deleteConfirm === app.id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(app.id)}
                      disabled={deleting}
                      className="rounded bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="rounded border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(app.id);
                    }}
                    className="rounded border border-[var(--color-error)]/30 px-2.5 py-1 text-xs text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
