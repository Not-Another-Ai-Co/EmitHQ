import type { EndpointHealth } from '../types';

export function EndpointHealthMetrics({ health }: { health: EndpointHealth }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">Success Rate</p>
        <p
          className={`font-semibold ${
            health.successRate >= 95
              ? 'text-[var(--color-success)]'
              : health.successRate >= 80
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-error)]'
          }`}
        >
          {health.successRate}%
        </p>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">Avg Latency</p>
        <p className="font-semibold">{health.avgLatencyMs}ms</p>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">Failures</p>
        <p className="font-semibold">{health.totalAttempts - health.deliveredCount}</p>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">Last Delivery</p>
        <p className="text-xs">
          {health.lastDelivery ? new Date(health.lastDelivery).toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}
