'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';
import { Modal } from '@/components/modal';
import { ErrorBanner } from '@/components/error-banner';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function ApiKeysTab() {
  const apiFetch = useApiFetch();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/auth/keys');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setKeys(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      const json = await res.json();
      setNewKey(json.data.key);
      setCreateName('');
      setShowCreate(false);
      await fetchKeys();
      toast.success('API key created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/auth/keys/${revokeTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `Error ${res.status}`);
      }
      setRevokeTarget(null);
      await fetchKeys();
      toast.success('API key revoked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Loading...</p>;
  }

  return (
    <section>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          {showCreate ? 'Cancel' : 'Generate New Key'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div className="mb-4">
            <label
              htmlFor="api-key-name"
              className="mb-1 block text-sm text-[var(--color-text-muted)]"
            >
              Key name <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="api-key-name"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Production API key"
              required
              maxLength={128}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !createName.trim()}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
          >
            {creating ? 'Generating...' : 'Generate Key'}
          </button>
        </form>
      )}

      {keys.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">
            No API keys yet. Generate a key to start using the EmitHQ API.
          </p>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
            >
              Generate First Key
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Name</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                  Created
                </th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                  Last Used
                </th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setRevokeTarget(key)}
                      className="rounded-lg border border-[var(--color-error)]/30 px-3 py-1.5 text-xs text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!newKey} onClose={() => setNewKey(null)} title="API Key Created">
        <p className="mb-3 text-sm text-[var(--color-warning)]">
          Copy this key now — it won&apos;t be shown again.
        </p>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <code className="block break-all font-mono text-sm">{newKey}</code>
        </div>
        <button
          onClick={() => {
            if (newKey) {
              navigator.clipboard.writeText(newKey);
              toast.success('Copied to clipboard');
            }
          }}
          className="mt-3 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80"
        >
          Copy to Clipboard
        </button>
      </Modal>

      <Modal open={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Revoke API Key">
        <p className="mb-2 text-sm text-[var(--color-text-muted)]">
          Are you sure you want to revoke this key? Any integrations using it will stop working.
        </p>
        {keys.length === 1 && (
          <p className="mb-2 text-sm font-medium text-[var(--color-error)]">
            This is your only API key. Revoking it will disable all API access until you generate a
            new one.
          </p>
        )}
        {revokeTarget && <p className="mb-4 font-medium">{revokeTarget.name}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-error)]/80 disabled:opacity-50"
          >
            {revoking ? 'Revoking...' : 'Revoke Key'}
          </button>
          <button
            onClick={() => setRevokeTarget(null)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </section>
  );
}
