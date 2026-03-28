import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coreMock, authMock, tenantMock } from '../test-helpers/mock-core';

// Mock dependencies BEFORE importing the route
vi.mock('@emithq/core', () => coreMock());
vi.mock('../middleware/auth', () => authMock());
vi.mock('../middleware/tenant', () => tenantMock());

import { adminRoutes } from './admin';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

function createAdminApp(secret?: string) {
  if (secret) process.env.ADMIN_SECRET = secret;
  else delete process.env.ADMIN_SECRET;
  delete process.env.METRICS_SECRET;
  const app = new Hono();
  app.route('/api/v1/admin', adminRoutes);
  return app;
}

describe('admin secret middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_SECRET;
    delete process.env.METRICS_SECRET;
  });

  it('returns 401 when wrong secret provided', async () => {
    const app = createAdminApp('correct-secret');
    const res = await app.request('/api/v1/admin/org/some-id/disable', {
      method: 'POST',
      headers: {
        'x-admin-secret': 'wrong-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('unauthorized');
  });

  it('returns 401 when no secret header provided', async () => {
    const app = createAdminApp('correct-secret');
    const res = await app.request('/api/v1/admin/org/some-id/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it('returns 500 when ADMIN_SECRET not configured', async () => {
    const app = createAdminApp();
    const res = await app.request('/api/v1/admin/org/some-id/disable', {
      method: 'POST',
      headers: {
        'x-admin-secret': 'any-value',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('server_error');
  });

  it('returns 401 when same-length wrong secret provided', async () => {
    const app = createAdminApp('correct-secret-1234');
    const res = await app.request('/api/v1/admin/org/some-id/disable', {
      method: 'POST',
      headers: {
        'x-admin-secret': 'wrongXX-secret-1234',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it('passes through with correct secret', async () => {
    const app = createAdminApp('correct-secret');
    const { adminDb } = await import('@emithq/core');

    // Mock the DB update to return a result
    const mockReturning = vi.fn().mockResolvedValueOnce([{ id: 'org-1', name: 'Test Org' }]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    (adminDb.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

    const res = await app.request('/api/v1/admin/org/org-1/disable', {
      method: 'POST',
      headers: {
        'x-admin-secret': 'correct-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'abuse' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.disabled).toBe(true);
  });
});

describe('security headers on API responses', () => {
  it('includes security headers when secureHeaders middleware is applied', async () => {
    const app = new Hono();
    app.use(
      '*',
      secureHeaders({
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        strictTransportSecurity: 'max-age=63072000; includeSubDomains',
        referrerPolicy: 'strict-origin-when-cross-origin',
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
        originAgentCluster: false,
        xDnsPrefetchControl: false,
        xDownloadOptions: false,
        xPermittedCrossDomainPolicies: false,
        xXssProtection: false,
      }),
    );
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('strict-transport-security')).toBe(
      'max-age=63072000; includeSubDomains',
    );
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });
});
