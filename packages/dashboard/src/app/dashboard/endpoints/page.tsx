'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/status-badge';

interface EndpointHealth {
  id: string;
  uid: string | null;
  url: string;
  description: string | null;
  disabled: boolean;
  disabledReason: string | null;
  failureCount: number;
  totalAttempts: number;
  deliveredCount: number;
  successRate: number;
  avgLatencyMs: number;
  lastDelivery: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const APP_ID = 'default';

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<EndpointHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/app/${APP_ID}/endpoint-health`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();
        setEndpoints(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Endpoint Health</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm">{ep.url}</p>
                  {ep.description && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{ep.description}</p>
                  )}
                </div>
                <StatusBadge status={ep.disabled ? 'disabled' : 'active'} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Success Rate</p>
                  <p
                    className={`font-semibold ${
                      ep.successRate >= 95
                        ? 'text-[var(--color-success)]'
                        : ep.successRate >= 80
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--color-error)]'
                    }`}
                  >
                    {ep.successRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Avg Latency</p>
                  <p className="font-semibold">{ep.avgLatencyMs}ms</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Failures</p>
                  <p className="font-semibold">{ep.failureCount}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Last Delivery</p>
                  <p className="text-xs">
                    {ep.lastDelivery ? new Date(ep.lastDelivery).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              {ep.disabledReason && (
                <p className="mt-3 text-xs text-[var(--color-error)]">
                  Disabled: {ep.disabledReason}
                </p>
              )}
            </div>
          ))}
          {endpoints.length === 0 && (
            <p className="col-span-full text-center text-[var(--color-text-muted)]">
              No endpoints configured
            </p>
          )}
        </div>
      )}
    </div>
  );
}
