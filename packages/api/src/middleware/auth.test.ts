import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock @emithq/core before importing auth middleware
vi.mock('@emithq/core', () => {
  const { createHash } = require('node:crypto');
  return {
    adminDb: {
      select: vi.fn(),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            catch: vi.fn(),
          })),
        })),
      })),
    },
    apiKeys: {
      orgId: 'org_id',
      id: 'id',
      keyHash: 'key_hash',
      revokedAt: 'revoked_at',
      expiresAt: 'expires_at',
      lastUsedAt: 'last_used_at',
    },
    organizations: {
      id: 'id',
      clerkOrgId: 'clerk_org_id',
    },
    hashApiKey: (key: string) => createHash('sha256').update(key).digest('hex'),
    isEmithqApiKey: (key: string) => key.startsWith('emhq_'),
    withTenant: vi.fn(),
    db: {},
  };
});

// Mock @hono/clerk-auth
vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: () => vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
  getAuth: vi.fn(),
}));

import { requireAuth, requireRole } from './auth';
import { getAuth } from '@hono/clerk-auth';
import { adminDb } from '@emithq/core';

describe('requireAuth middleware', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.use('*', requireAuth);
    app.get('/test', (c) =>
      c.json({
        orgId: c.get('orgId'),
        authType: c.get('authType'),
      }),
    );
  });

  it('rejects requests without Authorization header', async () => {
    const res = await app.request('/test');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('rejects requests with non-Bearer auth', async () => {
    const res = await app.request('/test', {
      headers: { Authorization: 'Basic abc123' },
    });
    expect(res.status).toBe(401);
  });

  it('authenticates valid API key', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ orgId: 'org-123', id: 'key-1' }]),
        }),
      }),
    });
    (adminDb as Record<string, unknown>).select = mockSelect;

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (adminDb as Record<string, unknown>).update = mockUpdate;

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer emhq_validkey123456789012345678' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orgId).toBe('org-123');
    expect(body.authType).toBe('api_key');
  });

  it('rejects invalid API key', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    (adminDb as Record<string, unknown>).select = mockSelect;

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer emhq_invalidkey' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('rejects revoked API key (revokedAt is set)', async () => {
    // When the DB query filters by isNull(revokedAt), a revoked key returns no rows
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // No rows — key is revoked
        }),
      }),
    });
    (adminDb as Record<string, unknown>).select = mockSelect;

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer emhq_revokedkey12345678901234567' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('rejects expired API key (expiresAt in the past)', async () => {
    // When the DB query filters by gt(expiresAt, now), an expired key returns no rows
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // No rows — key is expired
        }),
      }),
    });
    (adminDb as Record<string, unknown>).select = mockSelect;

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer emhq_expiredkey12345678901234567' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('rejects Clerk session without orgId', async () => {
    vi.mocked(getAuth).mockReturnValue({
      userId: 'user-1',
      orgId: null,
    } as ReturnType<typeof getAuth>);

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer sess_token_123' },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('no_active_organization');
  });

  it('rejects Clerk session without userId', async () => {
    vi.mocked(getAuth).mockReturnValue(null as ReturnType<typeof getAuth>);

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer sess_token_123' },
    });

    expect(res.status).toBe(401);
  });
});

describe('requireRole middleware', () => {
  it('allows API key auth regardless of role', async () => {
    const app = new Hono();

    // Simulate API key auth already done
    app.use('*', async (c, next) => {
      c.set('authType', 'api_key');
      c.set('orgId', 'org-123');
      await next();
    });
    app.use('*', requireRole('org:admin'));
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('rejects Clerk session with wrong role', async () => {
    vi.mocked(getAuth).mockReturnValue({
      orgRole: 'org:member',
    } as ReturnType<typeof getAuth>);

    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('authType', 'clerk_session');
      c.set('orgId', 'org-123');
      await next();
    });
    app.use('*', requireRole('org:admin', 'org:owner'));
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('forbidden');
  });

  it('allows Clerk session with matching role', async () => {
    vi.mocked(getAuth).mockReturnValue({
      orgRole: 'org:admin',
    } as ReturnType<typeof getAuth>);

    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('authType', 'clerk_session');
      c.set('orgId', 'org-123');
      await next();
    });
    app.use('*', requireRole('org:admin', 'org:owner'));
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });
});
