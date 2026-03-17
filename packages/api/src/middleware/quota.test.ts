import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { coreMock } from '../test-helpers/mock-core';
import type { AuthEnv } from '../types';

vi.mock('@emithq/core', () => coreMock());

import { quotaCheck, quotaHeaders, getQuotaResetDate } from './quota';

function createQuotaApp(middleware: unknown) {
  const app = new Hono<AuthEnv>();

  // Inject auth context
  app.use(
    '*',
    createMiddleware<AuthEnv>(async (c, next) => {
      c.set('orgId', 'test-org-id');
      c.set('userId', 'test-user');
      c.set('authType', 'api_key');
      await next();
    }),
  );

  app.use('*', middleware as Parameters<typeof app.use>[1]);
  app.get('/test', (c) => c.json({ ok: true }));
  app.post('/msg', (c) => c.json({ ok: true }));

  return app;
}

async function mockOrgData(overrides: Record<string, unknown> = {}) {
  const { adminDb } = await import('@emithq/core');
  const db = adminDb as unknown as Record<string, ReturnType<typeof vi.fn>>;
  db.select.mockReturnThis();
  db.from.mockReturnThis();
  db.where.mockReturnThis();
  db.limit.mockResolvedValueOnce([
    {
      tier: 'free',
      eventCountMonth: 50000,
      currentPeriodEnd: null,
      ...overrides,
    },
  ]);
}

describe('getQuotaResetDate', () => {
  it('returns ISO date of currentPeriodEnd when provided', () => {
    const date = new Date('2026-05-01T00:00:00Z');
    expect(getQuotaResetDate(date)).toBe('2026-05-01T00:00:00.000Z');
  });

  it('returns first day of next month for free tier (null period end)', () => {
    const result = getQuotaResetDate(null);
    const parsed = new Date(result);
    expect(parsed.getUTCDate()).toBe(1);
    expect(parsed > new Date()).toBe(true);
  });
});

describe('quotaHeaders middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets all 5 standard quota headers on response', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 30000 });
    const app = createQuotaApp(quotaHeaders);

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-EmitHQ-Quota-Limit')).toBe('100000');
    expect(res.headers.get('X-EmitHQ-Quota-Used')).toBe('30000');
    expect(res.headers.get('X-EmitHQ-Quota-Remaining')).toBe('70000');
    expect(res.headers.get('X-EmitHQ-Quota-Reset')).toBeTruthy();
    expect(res.headers.get('X-EmitHQ-Tier')).toBe('free');
  });

  it('sets warning headers at 80% usage', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 82000 });
    const app = createQuotaApp(quotaHeaders);

    const res = await app.request('/test');
    expect(res.headers.get('X-EmitHQ-Quota-Warning')).toBe('approaching_limit');
    expect(res.headers.get('X-EmitHQ-Upgrade-URL')).toBe('/api/v1/billing/checkout');
  });

  it('sets critical warning headers at 95% usage', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 96000 });
    const app = createQuotaApp(quotaHeaders);

    const res = await app.request('/test');
    expect(res.headers.get('X-EmitHQ-Quota-Warning')).toBe('critical_limit');
    expect(res.headers.get('X-EmitHQ-Upgrade-URL')).toBe('/api/v1/billing/checkout');
  });

  it('does not set warning headers below 80%', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 50000 });
    const app = createQuotaApp(quotaHeaders);

    const res = await app.request('/test');
    expect(res.headers.get('X-EmitHQ-Quota-Warning')).toBeNull();
  });

  it('shows remaining as 0 when over limit (paid tier)', async () => {
    await mockOrgData({ tier: 'starter', eventCountMonth: 600000 });
    const app = createQuotaApp(quotaHeaders);

    const res = await app.request('/test');
    expect(res.headers.get('X-EmitHQ-Quota-Remaining')).toBe('0');
    expect(res.headers.get('X-EmitHQ-Quota-Limit')).toBe('500000');
  });

  it('uses currentPeriodEnd for paid tier reset date', async () => {
    const periodEnd = new Date('2026-05-01T00:00:00Z');
    await mockOrgData({ tier: 'starter', eventCountMonth: 100000, currentPeriodEnd: periodEnd });
    const app = createQuotaApp(quotaHeaders);

    const res = await app.request('/test');
    expect(res.headers.get('X-EmitHQ-Quota-Reset')).toBe('2026-05-01T00:00:00.000Z');
  });

  it('passes through without headers when orgId not set', async () => {
    const app = new Hono();
    app.use('*', quotaHeaders as Parameters<typeof app.use>[1]);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-EmitHQ-Quota-Limit')).toBeNull();
  });
});

describe('quotaCheck middleware (enriched 429)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks free tier at limit with structured 429 response', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 100000 });
    const app = createQuotaApp(quotaCheck);

    const res = await app.request('/msg', { method: 'POST' });
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error.code).toBe('quota_exceeded');
    expect(json.error.quota).toBeDefined();
    expect(json.error.quota.limit).toBe(100000);
    expect(json.error.quota.used).toBe(100000);
    expect(json.error.quota.tier).toBe('free');
    expect(json.error.action).toBeDefined();
    expect(json.error.action.type).toBe('upgrade');
    expect(json.error.action.tiers).toHaveLength(3);
    expect(json.error.action.url).toBe('/api/v1/billing/checkout');
    expect(json.error.action.tiers[0].name).toBe('starter');
    expect(json.error.action.tiers[0].price).toBe(49);
  });

  it('sets quota headers on 429 response', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 100000 });
    const app = createQuotaApp(quotaCheck);

    const res = await app.request('/msg', { method: 'POST' });
    expect(res.headers.get('X-EmitHQ-Quota-Limit')).toBe('100000');
    expect(res.headers.get('X-EmitHQ-Quota-Remaining')).toBe('0');
    expect(res.headers.get('X-EmitHQ-Tier')).toBe('free');
  });

  it('allows paid tier over limit (overage)', async () => {
    await mockOrgData({ tier: 'starter', eventCountMonth: 600000 });
    const app = createQuotaApp(quotaCheck);

    const res = await app.request('/msg', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('allows free tier under limit', async () => {
    await mockOrgData({ tier: 'free', eventCountMonth: 50000 });
    const app = createQuotaApp(quotaCheck);

    const res = await app.request('/msg', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('returns 404 when org not found', async () => {
    const { adminDb } = await import('@emithq/core');
    const db = adminDb as unknown as Record<string, ReturnType<typeof vi.fn>>;
    db.select.mockReturnThis();
    db.from.mockReturnThis();
    db.where.mockReturnThis();
    db.limit.mockResolvedValueOnce([]);

    const app = createQuotaApp(quotaCheck);
    const res = await app.request('/msg', { method: 'POST' });
    expect(res.status).toBe(404);
  });
});
