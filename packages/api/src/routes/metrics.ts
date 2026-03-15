import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import {
  adminDb,
  adminPool,
  pool,
  getDeliveryQueue,
  getStripe,
  organizations,
  analyticsEvents,
} from '@emithq/core';
import { desc, count } from 'drizzle-orm';

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

// ─── GET /metrics/business — Business metrics from Stripe ────────────────────

metricsRoutes.get('/business', async (c) => {
  const stripe = getStripe();

  // Count orgs by tier
  const tierCounts = await adminDb
    .select({
      tier: organizations.tier,
      count: count(),
    })
    .from(organizations)
    .groupBy(organizations.tier);

  const tierMap: Record<string, number> = {};
  for (const row of tierCounts) {
    tierMap[row.tier] = row.count;
  }

  // Calculate MRR from active subscriptions
  const TIER_MONTHLY_PRICES: Record<string, number> = {
    starter: 49,
    growth: 149,
    scale: 349,
  };

  let mrr = 0;
  for (const [tier, price] of Object.entries(TIER_MONTHLY_PRICES)) {
    mrr += (tierMap[tier] ?? 0) * price;
  }

  const totalOrgs = Object.values(tierMap).reduce((a, b) => a + b, 0);
  const paidOrgs = totalOrgs - (tierMap.free ?? 0);
  const arpu = paidOrgs > 0 ? Math.round(mrr / paidOrgs) : 0;

  // Active users (orgs with events in last 30 days)
  const [activeResult] = await adminDb.execute<{ active_orgs: string }>(sql`
    SELECT COUNT(DISTINCT org_id)::text AS active_orgs
    FROM delivery_attempts
    WHERE created_at > NOW() - INTERVAL '30 days'
  `);

  // Recent cancellations (last 30 days)
  let recentCancellations = 0;
  try {
    const subs = await stripe.subscriptions.list({
      status: 'canceled',
      created: { gte: Math.floor(Date.now() / 1000) - 30 * 86400 },
      limit: 100,
    });
    recentCancellations = subs.data.length;
  } catch {
    // Stripe unavailable — continue with 0
  }

  const churnRate = paidOrgs > 0 ? Math.round((recentCancellations / paidOrgs) * 100 * 10) / 10 : 0;

  return c.json({
    data: {
      timestamp: new Date().toISOString(),
      mrr,
      arr: mrr * 12,
      arpu,
      totalOrgs,
      paidOrgs,
      freeOrgs: tierMap.free ?? 0,
      tierBreakdown: tierMap,
      activeOrgs: parseInt(activeResult?.active_orgs ?? '0', 10),
      churn: {
        cancellationsLast30d: recentCancellations,
        churnRatePct: churnRate,
      },
      conversionRate: totalOrgs > 0 ? Math.round((paidOrgs / totalOrgs) * 100 * 10) / 10 : 0,
    },
  });
});

// ─── GET /metrics/report — Weekly summary report ─────────────────────────────

metricsRoutes.get('/report', async (c) => {
  // Product metrics (last 7 days)
  const [productStats] = await adminDb.execute<{
    total_attempts: string;
    delivered: string;
    failed: string;
    exhausted: string;
    success_rate: string;
    p95_ms: string;
    unique_orgs: string;
  }>(sql`
    SELECT
      COUNT(*)::text AS total_attempts,
      COUNT(*) FILTER (WHERE status = 'delivered')::text AS delivered,
      COUNT(*) FILTER (WHERE status = 'failed')::text AS failed,
      COUNT(*) FILTER (WHERE status = 'exhausted')::text AS exhausted,
      COALESCE(
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0), 2),
        100
      )::text AS success_rate,
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 0)::text AS p95_ms,
      COUNT(DISTINCT org_id)::text AS unique_orgs
    FROM delivery_attempts
    WHERE attempted_at > NOW() - INTERVAL '7 days'
  `);

  // Analytics events summary (last 7 days)
  const eventCounts = await adminDb
    .select({
      eventName: analyticsEvents.eventName,
      count: count(),
    })
    .from(analyticsEvents)
    .where(sql`${analyticsEvents.createdAt} > NOW() - INTERVAL '7 days'`)
    .groupBy(analyticsEvents.eventName)
    .orderBy(desc(count()));

  const analyticsSummary: Record<string, number> = {};
  for (const row of eventCounts) {
    analyticsSummary[row.eventName] = row.count;
  }

  // Org tier breakdown
  const tierCounts = await adminDb
    .select({ tier: organizations.tier, count: count() })
    .from(organizations)
    .groupBy(organizations.tier);

  const tierMap: Record<string, number> = {};
  for (const row of tierCounts) {
    tierMap[row.tier] = row.count;
  }

  return c.json({
    data: {
      period: 'last_7_days',
      generatedAt: new Date().toISOString(),
      product: {
        totalAttempts: parseInt(productStats?.total_attempts ?? '0', 10),
        delivered: parseInt(productStats?.delivered ?? '0', 10),
        failed: parseInt(productStats?.failed ?? '0', 10),
        exhausted: parseInt(productStats?.exhausted ?? '0', 10),
        successRatePct: parseFloat(productStats?.success_rate ?? '100'),
        p95LatencyMs: Math.round(parseFloat(productStats?.p95_ms ?? '0')),
        activeOrgs: parseInt(productStats?.unique_orgs ?? '0', 10),
      },
      analytics: analyticsSummary,
      tiers: tierMap,
    },
  });
});

export { metricsRoutes };
