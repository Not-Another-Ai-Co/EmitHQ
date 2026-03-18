'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';
import { useApp } from '@/lib/use-app';
import { StatusBadge } from '@/components/status-badge';

interface DlqEntry {
  id: string;
  messageId: string;
  endpointId: string;
  attemptNumber: number;
  status: string;
  responseStatus: number | null;
  errorMessage: string | null;
  attemptedAt: string | null;
  createdAt: string;
}

export default function DlqPage() {
  const APP_ID = useApp();
  const apiFetch = useApiFetch();
  const [entries, setEntries] = useState<DlqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaying, setReplaying] = useState<Set<string>>(new Set());

  const fetchDlq = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (!reset && cursor) params.set('cursor', cursor);

        const res = await apiFetch(`/api/v1/app/${APP_ID}/dlq?${params.toString()}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();

        if (reset) {
          setEntries(json.data);
        } else {
          setEntries((prev) => [...prev, ...json.data]);
        }
        setCursor(json.iterator);
        setDone(json.done);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [cursor, apiFetch, APP_ID],
  );

  useEffect(() => {
    fetchDlq(true);
  }, [APP_ID]);

  const replay = async (entry: DlqEntry) => {
    setReplaying((prev) => new Set(prev).add(entry.id));
    try {
      const res = await apiFetch(
        `/api/v1/app/${APP_ID}/msg/${entry.messageId}/attempt/${entry.id}/retry`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(`Replay failed: ${res.status}`);
      // Remove from list on success
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replay failed');
    } finally {
      setReplaying((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dead Letter Queue</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <tr>
              <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Status</th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Error</th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                Attempts
              </th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                Time
              </th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">
                  <StatusBadge status={entry.status} />
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[var(--color-text-muted)]">
                  {entry.errorMessage ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                  {entry.attemptNumber}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                  {entry.attemptedAt ? new Date(entry.attemptedAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => replay(entry)}
                    disabled={replaying.has(entry.id)}
                    className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent)]/80 disabled:opacity-50"
                  >
                    {replaying.has(entry.id) ? 'Replaying...' : 'Replay'}
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No exhausted deliveries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!done && (
        <button
          onClick={() => fetchDlq(false)}
          disabled={loading}
          className="mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
