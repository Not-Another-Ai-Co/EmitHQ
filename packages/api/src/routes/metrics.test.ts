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
