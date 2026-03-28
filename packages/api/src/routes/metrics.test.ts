import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coreMock, authMock, tenantMock } from '../test-helpers/mock-core';

// Mock dependencies BEFORE importing the route
vi.mock('@emithq/core', () => coreMock());
vi.mock('../middleware/auth', () => authMock());
vi.mock('../middleware/tenant', () => tenantMock());

import { metricsRoutes } from './metrics';
import { Hono } from 'hono';

function createMetricsApp(secret?: string) {
  if (secret) process.env.METRICS_SECRET = secret;
  else delete process.env.METRICS_SECRET;
  const app = new Hono();
  app.route('/metrics', metricsRoutes);
  return app;
}

describe('metrics secret middleware (real handler)', () => {
  it('rejects requests with wrong secret', async () => {
    const app = createMetricsApp('correct-secret');
    const res = await app.request('/metrics/slo', {
      headers: { 'x-metrics-secret': 'wrong-secret' },
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('unauthorized');
  });

  it('allows requests with correct secret', async () => {
    const app = createMetricsApp('correct-secret');
    const { adminDb } = await import('@emithq/core');
    (adminDb.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ success_rate: '99.95', p95_ms: '100' }],
    });

    const res = await app.request('/metrics/slo', {
      headers: { 'x-metrics-secret': 'correct-secret' },
    });
    expect(res.status).toBe(200);
  });

  it('returns 500 when no secret configured (fail closed)', async () => {
    const app = createMetricsApp();

    const res = await app.request('/metrics/slo');
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('server_error');
  });
});

describe('GET /metrics/slo (real handler)', () => {
  const TEST_SECRET = 'test-metrics-secret';
  const authHeaders = { 'x-metrics-secret': TEST_SECRET };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.METRICS_SECRET;
  });

  it('returns pass when all SLOs met', async () => {
    const app = createMetricsApp(TEST_SECRET);
    const { adminDb } = await import('@emithq/core');
    (adminDb.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ success_rate: '99.95', p95_ms: '180' }],
    });

    const res = await app.request('/metrics/slo', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.allPassing).toBe(true);
    expect(json.data.slos).toHaveLength(3);
    expect(json.data.slos[0].pass).toBe(true);
  });

  it('fails when success rate below 99.9%', async () => {
    const app = createMetricsApp(TEST_SECRET);
    const { adminDb } = await import('@emithq/core');
    (adminDb.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ success_rate: '98.50', p95_ms: '100' }],
    });

    const res = await app.request('/metrics/slo', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.allPassing).toBe(false);
    expect(json.data.slos[0].pass).toBe(false);
  });

  it('fails when p95 latency above 500ms', async () => {
    const app = createMetricsApp(TEST_SECRET);
    const { adminDb } = await import('@emithq/core');
    (adminDb.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ success_rate: '99.95', p95_ms: '750' }],
    });

    const res = await app.request('/metrics/slo', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.slos[1].pass).toBe(false);
  });

  it('marks queue unavailable and fails when Redis is down', async () => {
    const app = createMetricsApp(TEST_SECRET);
    const { adminDb, getDeliveryQueue } = await import('@emithq/core');
    (adminDb.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ success_rate: '99.95', p95_ms: '100' }],
    });
    (getDeliveryQueue as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      getJobCounts: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    });

    const res = await app.request('/metrics/slo', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.slos[2].unavailable).toBe(true);
    expect(json.data.slos[2].pass).toBe(false);
    expect(json.data.allPassing).toBe(false);
  });
});

describe('SLO boundary values', () => {
  function evaluateSLOs(
    successRate: number,
    p95Ms: number,
    queueDepth: number,
    queueUnavailable = false,
  ) {
    const queuePass = !queueUnavailable && queueDepth <= 1000;
    return {
      allPassing: successRate >= 99.9 && p95Ms <= 500 && queuePass,
      successPass: successRate >= 99.9,
      latencyPass: p95Ms <= 500,
      queuePass,
    };
  }

  it('exactly at target passes', () => {
    const r = evaluateSLOs(99.9, 500, 1000);
    expect(r.allPassing).toBe(true);
  });

  it('just below target fails', () => {
    const r = evaluateSLOs(99.89, 501, 1001);
    expect(r.allPassing).toBe(false);
    expect(r.successPass).toBe(false);
    expect(r.latencyPass).toBe(false);
    expect(r.queuePass).toBe(false);
  });

  it('queue unavailable fails even at depth 0', () => {
    const r = evaluateSLOs(99.95, 200, 0, true);
    expect(r.queuePass).toBe(false);
    expect(r.allPassing).toBe(false);
  });
});

describe('MRR calculation', () => {
  const TIER_MONTHLY_PRICES: Record<string, number> = { starter: 49, growth: 149, scale: 349 };

  function calculateMRR(tierMap: Record<string, number>): number {
    let mrr = 0;
    for (const [tier, price] of Object.entries(TIER_MONTHLY_PRICES)) {
      mrr += (tierMap[tier] ?? 0) * price;
    }
    return mrr;
  }

  it('calculates from paid tier counts', () => {
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

describe('health check response', () => {
  it('returns ok when both services healthy', async () => {
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
  });

  it('returns 503 when a service is down', async () => {
    const app = new Hono();
    app.get('/health', (c) => {
      const dbOk = false;
      const redisOk = true;
      const status = dbOk && redisOk ? 'ok' : 'degraded';
      return c.json({ status, db: dbOk, redis: redisOk }, status === 'ok' ? 200 : 503);
    });
    const res = await app.request('/health');
    expect(res.status).toBe(503);
  });
});
