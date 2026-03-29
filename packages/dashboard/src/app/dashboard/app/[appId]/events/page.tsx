'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '@/lib/use-api';
import { useApp } from '@/lib/use-app';
import { StatusBadge } from '@/components/status-badge';

interface Message {
  id: string;
  eventType: string;
  eventId: string | null;
  createdAt: string;
}

interface MessageDetail {
  id: string;
  eventType: string;
  eventId: string | null;
  payload: unknown;
  createdAt: string;
  attempts: Array<{
    id: string;
    endpointId: string;
    attemptNumber: number;
    status: string;
    responseStatus: number | null;
    responseTimeMs: number | null;
    errorMessage: string | null;
    attemptedAt: string | null;
  }>;
}

export default function EventsPage() {
  const APP_ID = useApp();
  const apiFetch = useApiFetch();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (eventTypeFilter) params.set('eventType', eventTypeFilter);
        if (!reset && cursor) params.set('cursor', cursor);

        const res = await apiFetch(`/api/v1/app/${APP_ID}/msg?${params.toString()}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();

        if (reset) {
          setMessages(json.data);
        } else {
          setMessages((prev) => [...prev, ...json.data]);
        }
        setCursor(json.iterator);
        setDone(json.done);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    },
    [cursor, eventTypeFilter, apiFetch, APP_ID],
  );

  useEffect(() => {
    fetchMessages(true);
  }, [eventTypeFilter, APP_ID]);

  const loadDetail = async (msgId: string) => {
    try {
      const res = await apiFetch(`/api/v1/app/${APP_ID}/msg/${msgId}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setSelected(json.data);
    } catch {
      setSelected(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Event Log</h1>
        <input
          type="text"
          placeholder="Filter by event type..."
          value={eventTypeFilter}
          onChange={(e) => {
            setEventTypeFilter(e.target.value);
            setCursor(null);
          }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Event list */}
        <div className="flex-1">
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    Event Type
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] max-sm:hidden">
                    Event ID
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    tabIndex={0}
                    onClick={() => loadDetail(msg.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadDetail(msg.id);
                      }
                    }}
                    className={`cursor-pointer transition-colors hover:bg-[var(--color-surface)] focus:bg-[var(--color-accent)]/5 focus:outline-none ${
                      selected?.id === msg.id ? 'bg-[var(--color-accent)]/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{msg.eventType}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] max-sm:hidden">
                      {msg.eventId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                    >
                      No events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!done && (
            <button
              onClick={() => fetchMessages(false)}
              disabled={loading}
              className="mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>

        {/* Event detail panel */}
        {selected && (
          <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:w-96">
            <h2 className="mb-4 text-lg font-semibold">Event Detail</h2>
            <div className="mb-3 space-y-2 text-sm">
              <p>
                <span className="text-[var(--color-text-muted)]">Type:</span>{' '}
                <span className="font-mono">{selected.eventType}</span>
              </p>
              <p>
                <span className="text-[var(--color-text-muted)]">ID:</span>{' '}
                <span className="font-mono text-xs">{selected.id}</span>
              </p>
              {selected.eventId && (
                <p>
                  <span className="text-[var(--color-text-muted)]">Event ID:</span>{' '}
                  <span className="font-mono text-xs">{selected.eventId}</span>
                </p>
              )}
            </div>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-[var(--color-text-muted)]">
                Payload
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </details>

            <h3 className="mb-2 text-sm font-medium">Delivery Attempts</h3>
            <div className="space-y-2">
              {selected.attempts.map((att) => (
                <div
                  key={att.id}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Attempt #{att.attemptNumber}
                    </span>
                    <StatusBadge status={att.status} />
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {att.responseStatus && <span>HTTP {att.responseStatus} </span>}
                    {att.responseTimeMs && <span>• {att.responseTimeMs}ms </span>}
                    {att.errorMessage && (
                      <span className="text-[var(--color-error)]">• {att.errorMessage}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
