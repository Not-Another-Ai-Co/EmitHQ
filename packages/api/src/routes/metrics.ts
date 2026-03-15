import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { adminDb, adminPool, pool, getDeliveryQueue } from '@emithq/core';

const metricsRoutes = new Hono();

/**
 * Middleware: protect /metrics with a shared secret.
 * Not behind Clerk (external monitors need access), not public.
 */
metricsRoutes.use('*', async (c, next) => {
  const secret = process.env.METRICS_SECRET;
  if (secret && c.req.header('x-metrics-secret') !== secret) {
    return c.json({ error: { code: 'unauthorized', message: 'Invalid metrics secret' } }, 401);
  }
  await next();
});

/**
 * GET /metrics — System-wide SLO aggregates
 * Cross-tenant (uses adminDb), returns delivery success rate,
 * latency percentiles, queue depth, and DB pool stats.
 */
metricsRoutes.get('/', async (c) => {
  const window = c.req.query('window') || '1h';
  const ALLOWED_INTERVALS: Record<string, string> = { '1h': '1 hour', '24h': '24 hours' };
  const interval = ALLOWED_INTERVALS[window] ?? '1 hour';

  // Run SLO queries in parallel
  const [deliveryStats, latencyStats, queueStats] = await Promise.all([
    // Delivery success rate + retry rate + DLQ rate
    adminDb.execute<{
      total: string;
      delivered: string;
      failed: string;
      exhausted: string;
      retried: string;
      success_rate: string;
      retry_rate: string;
      dlq_rate: string;
    }>(sql`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'delivered')::text AS delivered,
        COUNT(*) FILTER (WHERE status = 'failed')::text AS failed,
        COUNT(*) FILTER (WHERE status = 'exhausted')::text AS exhausted,
        COUNT(*) FILTER (WHERE attempt_number > 1)::text AS retried,
        COALESCE(
          ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0), 2),
          100
        )::text AS success_rate,
        COALESCE(
          ROUND(100.0 * COUNT(*) FILTER (WHERE attempt_number > 1) / NULLIF(COUNT(*), 0), 2),
          0
        )::text AS retry_rate,
        COALESCE(
          ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'exhausted') / NULLIF(COUNT(*), 0), 4),
          0
        )::text AS dlq_rate
      FROM delivery_attempts
      WHERE attempted_at > NOW() - INTERVAL '${sql.raw(interval)}'
    `),

    // Latency percentiles (delivered attempts only)
    adminDb.execute<{
      p50_ms: string;
      p95_ms: string;
      p99_ms: string;
      avg_ms: string;
    }>(sql`
      SELECT
        COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms), 0)::text AS p50_ms,
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 0)::text AS p95_ms,
        COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms), 0)::text AS p99_ms,
        COALESCE(AVG(response_time_ms), 0)::text AS avg_ms
      FROM delivery_attempts
      WHERE attempted_at > NOW() - INTERVAL '${sql.raw(interval)}'
        AND status = 'delivered'
        AND response_time_ms IS NOT NULL
    `),

    // BullMQ queue depth
    getQueueStats(),
  ]);

  const delivery = deliveryStats.rows[0];
  const latency = latencyStats.rows[0];

  return c.json({
    data: {
      window: interval,
      timestamp: new Date().toISOString(),
      delivery: {
        total: parseInt(delivery?.total ?? '0', 10),
        delivered: parseInt(delivery?.delivered ?? '0', 10),
        failed: parseInt(delivery?.failed ?? '0', 10),
        exhausted: parseInt(delivery?.exhausted ?? '0', 10),
        successRate: parseFloat(delivery?.success_rate ?? '100'),
        retryRate: parseFloat(delivery?.retry_rate ?? '0'),
        dlqRate: parseFloat(delivery?.dlq_rate ?? '0'),
      },
      latency: {
        p50Ms: Math.round(parseFloat(latency?.p50_ms ?? '0')),
        p95Ms: Math.round(parseFloat(latency?.p95_ms ?? '0')),
        p99Ms: Math.round(parseFloat(latency?.p99_ms ?? '0')),
        avgMs: Math.round(parseFloat(latency?.avg_ms ?? '0')),
      },
      queue: queueStats,
      pool: {
        app: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
        admin: {
          total: adminPool.totalCount,
          idle: adminPool.idleCount,
          waiting: adminPool.waitingCount,
        },
      },
    },
  });
});

/**
 * GET /metrics/slo — SLO compliance check
 * Returns pass/fail for each SLO target.
 */
metricsRoutes.get('/slo', async (c) => {
  const [stats] = await adminDb.execute<{
    success_rate: string;
    p95_ms: string;
    queue_depth: string;
    retry_rate: string;
    dlq_rate: string;
  }>(sql`
    SELECT
      COALESCE(
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0), 2),
        100
      )::text AS success_rate,
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 0)::text AS p95_ms
    FROM delivery_attempts
    WHERE attempted_at > NOW() - INTERVAL '1 hour'
      AND (response_time_ms IS NOT NULL OR status = 'delivered')
  `);

  const queueStats = await getQueueStats();

  const successRate = parseFloat(stats?.success_rate ?? '100');
  const p95Ms = parseFloat(stats?.p95_ms ?? '0');
  const queueDepth = queueStats.waiting + queueStats.delayed;
  const queueSLOPass = !queueStats.unavailable && queueDepth <= 1000;

  return c.json({
    data: {
      timestamp: new Date().toISOString(),
      slos: [
        {
          name: 'delivery_success_rate',
          target: 99.9,
          current: successRate,
          unit: '%',
          pass: successRate >= 99.9,
        },
        {
          name: 'p95_delivery_latency',
          target: 500,
          current: Math.round(p95Ms),
          unit: 'ms',
          pass: p95Ms <= 500,
        },
        {
          name: 'queue_depth',
          target: 1000,
          current: queueDepth,
          unit: 'jobs',
          pass: queueSLOPass,
          unavailable: queueStats.unavailable,
        },
      ],
      allPassing: successRate >= 99.9 && p95Ms <= 500 && queueSLOPass,
    },
  });
});

interface QueueStats {
  waiting: number;
  active: number;
  failed: number;
  delayed: number;
  completed: number;
  unavailable: boolean;
}

async function getQueueStats(): Promise<QueueStats> {
  try {
    const queue = getDeliveryQueue();
    const counts = await queue.getJobCounts('waiting', 'active', 'failed', 'delayed', 'completed');
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      completed: counts.completed ?? 0,
      unavailable: false,
    };
  } catch {
    return { waiting: 0, active: 0, failed: 0, delayed: 0, completed: 0, unavailable: true };
  }
}

export { metricsRoutes };
