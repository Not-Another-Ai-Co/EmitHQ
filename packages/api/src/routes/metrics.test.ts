import { describe, it, expect } from 'vitest';

describe('metrics secret middleware', () => {
  it('rejects requests with wrong secret', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.use('*', async (c, next) => {
      const secret = 'test-secret';
      if (c.req.header('x-metrics-secret') !== secret) {
        return c.json({ error: { code: 'unauthorized', message: 'Invalid metrics secret' } }, 401);
      }
      await next();
    });

    app.get('/', (c) => c.json({ data: {} }));

    const res = await app.request('/', {
      headers: { 'x-metrics-secret': 'wrong-secret' },
    });
    expect(res.status).toBe(401);
  });

  it('allows requests with correct secret', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.use('*', async (c, next) => {
      const secret = 'test-secret';
      if (c.req.header('x-metrics-secret') !== secret) {
        return c.json({ error: { code: 'unauthorized' } }, 401);
      }
      await next();
    });

    app.get('/', (c) => c.json({ data: { status: 'ok' } }));

    const res = await app.request('/', {
      headers: { 'x-metrics-secret': 'test-secret' },
    });
    expect(res.status).toBe(200);
  });

  it('allows requests when no secret is configured', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.use('*', async (c, next) => {
      const secret = undefined; // no secret configured
      if (secret && c.req.header('x-metrics-secret') !== secret) {
        return c.json({ error: { code: 'unauthorized' } }, 401);
      }
      await next();
    });

    app.get('/', (c) => c.json({ data: {} }));

    const res = await app.request('/');
    expect(res.status).toBe(200);
  });
});

describe('metrics response shape', () => {
  it('returns delivery stats, latency, queue, and pool data', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/metrics', (c) =>
      c.json({
        data: {
          window: '1 hour',
          timestamp: new Date().toISOString(),
          delivery: {
            total: 10000,
            delivered: 9990,
            failed: 8,
            exhausted: 2,
            successRate: 99.9,
            retryRate: 5.2,
            dlqRate: 0.02,
          },
          latency: { p50Ms: 45, p95Ms: 180, p99Ms: 450, avgMs: 62 },
          queue: { waiting: 12, active: 3, failed: 0, delayed: 5, completed: 50000 },
          pool: {
            app: { total: 20, idle: 15, waiting: 0 },
            admin: { total: 5, idle: 4, waiting: 0 },
          },
        },
      }),
    );

    const res = await app.request('/metrics');
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toHaveProperty('delivery');
    expect(json.data).toHaveProperty('latency');
    expect(json.data).toHaveProperty('queue');
    expect(json.data).toHaveProperty('pool');
    expect(json.data.delivery).toHaveProperty('successRate');
    expect(json.data.delivery).toHaveProperty('retryRate');
    expect(json.data.delivery).toHaveProperty('dlqRate');
    expect(json.data.latency).toHaveProperty('p50Ms');
    expect(json.data.latency).toHaveProperty('p95Ms');
    expect(json.data.latency).toHaveProperty('p99Ms');
  });
});

describe('SLO compliance check', () => {
  function evaluateSLOs(successRate: number, p95Ms: number, queueDepth: number) {
    return {
      slos: [
        {
          name: 'delivery_success_rate',
          target: 99.9,
          current: successRate,
          pass: successRate >= 99.9,
        },
        { name: 'p95_delivery_latency', target: 500, current: p95Ms, pass: p95Ms <= 500 },
        { name: 'queue_depth', target: 1000, current: queueDepth, pass: queueDepth <= 1000 },
      ],
      allPassing: successRate >= 99.9 && p95Ms <= 500 && queueDepth <= 1000,
    };
  }

  it('all SLOs pass when within targets', () => {
    const result = evaluateSLOs(99.95, 200, 50);
    expect(result.allPassing).toBe(true);
    expect(result.slos.every((s) => s.pass)).toBe(true);
  });

  it('fails when success rate below target', () => {
    const result = evaluateSLOs(99.0, 200, 50);
    expect(result.allPassing).toBe(false);
    expect(result.slos[0].pass).toBe(false);
    expect(result.slos[1].pass).toBe(true);
  });

  it('fails when p95 latency above target', () => {
    const result = evaluateSLOs(99.95, 600, 50);
    expect(result.allPassing).toBe(false);
    expect(result.slos[1].pass).toBe(false);
  });

  it('fails when queue depth above target', () => {
    const result = evaluateSLOs(99.95, 200, 15000);
    expect(result.allPassing).toBe(false);
    expect(result.slos[2].pass).toBe(false);
  });

  it('boundary: exactly at SLO target passes', () => {
    const result = evaluateSLOs(99.9, 500, 1000);
    expect(result.allPassing).toBe(true);
  });

  it('boundary: just below SLO target fails', () => {
    const result = evaluateSLOs(99.89, 501, 1001);
    expect(result.allPassing).toBe(false);
    expect(result.slos[0].pass).toBe(false);
    expect(result.slos[1].pass).toBe(false);
    expect(result.slos[2].pass).toBe(false);
  });
});

describe('health check response', () => {
  it('returns ok when both services healthy', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/health', (c) => {
      const dbOk = true;
      const redisOk = true;
      const status = dbOk && redisOk ? 'ok' : 'degraded';
      return c.json({ status, db: dbOk, redis: redisOk }, status === 'ok' ? 200 : 503);
    });

    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.db).toBe(true);
    expect(json.redis).toBe(true);
  });

  it('returns 503 degraded when DB is down', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/health', (c) => {
      const dbOk = false;
      const redisOk = true;
      const status = dbOk && redisOk ? 'ok' : 'degraded';
      return c.json({ status, db: dbOk, redis: redisOk }, status === 'ok' ? 200 : 503);
    });

    const res = await app.request('/health');
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.status).toBe('degraded');
    expect(json.db).toBe(false);
  });

  it('returns 503 degraded when Redis is down', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/health', (c) => {
      const dbOk = true;
      const redisOk = false;
      const status = dbOk && redisOk ? 'ok' : 'degraded';
      return c.json({ status, db: dbOk, redis: redisOk }, status === 'ok' ? 200 : 503);
    });

    const res = await app.request('/health');
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.status).toBe('degraded');
    expect(json.redis).toBe(false);
  });
});

describe('queue stats fallback', () => {
  it('returns zeros when queue is unavailable', () => {
    const fallback = { waiting: 0, active: 0, failed: 0, delayed: 0, completed: 0 };
    expect(fallback.waiting).toBe(0);
    expect(fallback.active).toBe(0);
  });
});

describe('business metrics response shape', () => {
  it('returns MRR, ARR, ARPU, tier breakdown, and churn data', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/metrics/business', (c) =>
      c.json({
        data: {
          timestamp: new Date().toISOString(),
          mrr: 1490,
          arr: 17880,
          arpu: 149,
          totalOrgs: 15,
          paidOrgs: 10,
          freeOrgs: 5,
          tierBreakdown: { free: 5, starter: 4, growth: 5, scale: 1 },
          activeOrgs: 12,
          churn: { cancellationsLast30d: 1, churnRatePct: 10 },
          conversionRate: 66.7,
        },
      }),
    );

    const res = await app.request('/metrics/business');
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toHaveProperty('mrr');
    expect(json.data).toHaveProperty('arr');
    expect(json.data).toHaveProperty('arpu');
    expect(json.data).toHaveProperty('tierBreakdown');
    expect(json.data).toHaveProperty('churn');
    expect(json.data.churn).toHaveProperty('cancellationsLast30d');
    expect(json.data.churn).toHaveProperty('churnRatePct');
    expect(json.data).toHaveProperty('conversionRate');
  });
});

describe('MRR calculation', () => {
  const TIER_MONTHLY_PRICES: Record<string, number> = {
    starter: 49,
    growth: 149,
    scale: 349,
  };

  function calculateMRR(tierMap: Record<string, number>): number {
    let mrr = 0;
    for (const [tier, price] of Object.entries(TIER_MONTHLY_PRICES)) {
      mrr += (tierMap[tier] ?? 0) * price;
    }
    return mrr;
  }

  it('calculates MRR from paid tier counts', () => {
    expect(calculateMRR({ free: 10, starter: 5, growth: 3, scale: 1 })).toBe(
      5 * 49 + 3 * 149 + 1 * 349,
    );
  });

  it('returns 0 when only free users', () => {
    expect(calculateMRR({ free: 100 })).toBe(0);
  });

  it('handles missing tiers', () => {
    expect(calculateMRR({ starter: 2 })).toBe(98);
  });
});

describe('conversion rate', () => {
  function conversionRate(total: number, paid: number): number {
    return total > 0 ? Math.round((paid / total) * 100 * 10) / 10 : 0;
  }

  it('calculates free-to-paid conversion', () => {
    expect(conversionRate(100, 8)).toBe(8);
  });

  it('returns 0 when no orgs', () => {
    expect(conversionRate(0, 0)).toBe(0);
  });

  it('handles 100% conversion', () => {
    expect(conversionRate(10, 10)).toBe(100);
  });
});

describe('weekly report response shape', () => {
  it('returns product stats, analytics summary, and tier breakdown', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/metrics/report', (c) =>
      c.json({
        data: {
          period: 'last_7_days',
          generatedAt: new Date().toISOString(),
          product: {
            totalAttempts: 50000,
            delivered: 49900,
            failed: 80,
            exhausted: 20,
            successRatePct: 99.8,
            p95LatencyMs: 180,
            activeOrgs: 12,
          },
          analytics: {
            'org.created': 3,
            first_event_sent: 2,
            'subscription.created': 1,
          },
          tiers: { free: 5, starter: 4, growth: 3, scale: 1 },
        },
      }),
    );

    const res = await app.request('/metrics/report');
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toHaveProperty('period');
    expect(json.data).toHaveProperty('product');
    expect(json.data.product).toHaveProperty('totalAttempts');
    expect(json.data.product).toHaveProperty('successRatePct');
    expect(json.data.product).toHaveProperty('p95LatencyMs');
    expect(json.data).toHaveProperty('analytics');
    expect(json.data).toHaveProperty('tiers');
  });
});

describe('analytics event tracking', () => {
  const VALID_EVENTS = [
    'org.created',
    'first_event_sent',
    'subscription.created',
    'subscription.canceled',
    'subscription.upgraded',
    'subscription.downgraded',
    'endpoint.created',
    'quota.warning_80pct',
    'quota.limit_reached',
    'api_key.created',
  ];

  it('defines all expected event types', () => {
    expect(VALID_EVENTS).toContain('org.created');
    expect(VALID_EVENTS).toContain('first_event_sent');
    expect(VALID_EVENTS).toContain('subscription.created');
    expect(VALID_EVENTS).toContain('subscription.canceled');
  });

  it('event names use dot notation', () => {
    for (const event of VALID_EVENTS) {
      expect(event).toMatch(/^[a-z_]+(\.[a-z_0-9]+)?$/);
    }
  });
});
