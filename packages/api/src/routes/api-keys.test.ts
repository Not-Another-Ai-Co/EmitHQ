import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AuthEnv } from '../types';

vi.mock('@emithq/core', () => ({
  apiKeys: {
    id: 'id',
    orgId: 'org_id',
    keyHash: 'key_hash',
    name: 'name',
    lastUsedAt: 'last_used_at',
    expiresAt: 'expires_at',
    revokedAt: 'revoked_at',
    createdAt: 'created_at',
  },
  generateApiKey: vi.fn().mockReturnValue({ key: 'emhq_new_key_abc', hash: 'hash_abc' }),
  trackEvent: vi.fn(),
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
  requireRole: vi.fn(() => async (_c: unknown, next: () => Promise<void>) => next()),
}));

vi.mock('../middleware/tenant', () => ({
  tenantScope: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
}));

import { apiKeyRoutes } from './api-keys';

// Shared mock tx — reset in beforeEach
let mockTx: Record<string, ReturnType<typeof vi.fn>>;

function buildMockTx() {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
}

function createApp() {
  const app = new Hono<AuthEnv>();
  app.use('*', async (c, next) => {
    c.set('orgId', 'org-123');
    c.set('userId', 'user-123');
    c.set('authType', 'api_key');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.set('tx', mockTx as any);
    await next();
  });
  app.route('/api/v1/auth/keys', apiKeyRoutes);
  return app;
}

function jsonPost(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/v1/auth/keys (create)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = buildMockTx();
  });

  it('returns 201 with new key on valid name', async () => {
    mockTx.returning.mockResolvedValueOnce([
      { id: 'key-1', name: 'Production', createdAt: '2026-03-18T00:00:00Z' },
    ]);
    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys', { name: 'Production' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.key).toBe('emhq_new_key_abc');
    expect(json.data.name).toBe('Production');
  });

  it('returns 400 when name is missing', async () => {
    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys', {}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
  });

  it('returns 400 when name is empty string', async () => {
    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys', { name: '   ' }));
    expect(res.status).toBe(400);
  });

  it('tracks api_key.created event', async () => {
    mockTx.returning.mockResolvedValueOnce([
      { id: 'key-1', name: 'Test', createdAt: '2026-03-18T00:00:00Z' },
    ]);
    const app = createApp();
    await app.request(jsonPost('/api/v1/auth/keys', { name: 'Test' }));
    const { trackEvent } = await import('@emithq/core');
    expect(trackEvent).toHaveBeenCalledWith('api_key.created', 'org-123');
  });
});

describe('GET /api/v1/auth/keys (list)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = buildMockTx();
  });

  it('returns 200 with key metadata', async () => {
    // For GET, the chain is select().from().where() which returns the array directly
    // The mock chain: select returns this, from returns this, where resolves to array
    mockTx.where.mockResolvedValueOnce([
      { id: 'key-1', name: 'Default', lastUsedAt: null, expiresAt: null, createdAt: '2026-03-18' },
    ]);
    const app = createApp();
    const res = await app.request('http://localhost/api/v1/auth/keys');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe('Default');
  });

  it('returns empty array when no keys exist', async () => {
    mockTx.where.mockResolvedValueOnce([]);
    const app = createApp();
    const res = await app.request('http://localhost/api/v1/auth/keys');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });
});

describe('DELETE /api/v1/auth/keys/:keyId (revoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = buildMockTx();
  });

  it('returns 200 with revoked confirmation', async () => {
    mockTx.returning.mockResolvedValueOnce([{ id: 'key-1' }]);
    const app = createApp();
    const res = await app.request('http://localhost/api/v1/auth/keys/key-1', { method: 'DELETE' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.revoked).toBe(true);
  });

  it('returns 404 when key not found', async () => {
    mockTx.returning.mockResolvedValueOnce([]);
    const app = createApp();
    const res = await app.request('http://localhost/api/v1/auth/keys/nonexistent', {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('not_found');
  });
});

describe('POST /api/v1/auth/keys/:keyId/rotate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = buildMockTx();
  });

  it('returns 201 with new key and sets grace period on old key', async () => {
    // First call: select old key (limit resolves)
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'Default Key' }]);
    // Second call: insert new key (returning resolves)
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'Default Key', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys/old-key-1/rotate', {}));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.key).toBe('emhq_new_key_abc');
    expect(json.data.rotatedFrom).toBe('old-key-1');
    expect(json.data.oldKeyExpiresAt).toBeTruthy();
    // Default grace period is 1 hour — old key expires ~1h from now
    const expiresAt = new Date(json.data.oldKeyExpiresAt);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    expect(Math.abs(expiresAt.getTime() - oneHourFromNow.getTime())).toBeLessThan(5000);
  });

  it('returns 404 when old key not found', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys/nonexistent/rotate', {}));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('not_found');
  });

  it('supports custom grace period', async () => {
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'My Key' }]);
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'My Key', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    const res = await app.request(
      jsonPost('/api/v1/auth/keys/old-key-1/rotate', { gracePeriodMinutes: 120 }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    const expiresAt = new Date(json.data.oldKeyExpiresAt);
    const twoHoursFromNow = new Date(Date.now() + 120 * 60 * 1000);
    expect(Math.abs(expiresAt.getTime() - twoHoursFromNow.getTime())).toBeLessThan(5000);
  });

  it('immediately revokes old key when gracePeriodMinutes is 0', async () => {
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'Key' }]);
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'Key', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    const res = await app.request(
      jsonPost('/api/v1/auth/keys/old-key-1/rotate', { gracePeriodMinutes: 0 }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.oldKeyExpiresAt).toBeNull();
    // Verify set() was called with revokedAt for immediate revocation (not expiresAt)
    expect(mockTx.set).toHaveBeenCalled();
    const setArg = mockTx.set.mock.calls[0][0];
    expect(setArg).toHaveProperty('revokedAt');
    expect(setArg).not.toHaveProperty('expiresAt');
  });

  it('rejects gracePeriodMinutes > 1440', async () => {
    const app = createApp();
    const res = await app.request(
      jsonPost('/api/v1/auth/keys/old-key-1/rotate', { gracePeriodMinutes: 2000 }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
  });

  it('rejects negative gracePeriodMinutes', async () => {
    const app = createApp();
    const res = await app.request(
      jsonPost('/api/v1/auth/keys/old-key-1/rotate', { gracePeriodMinutes: -1 }),
    );
    expect(res.status).toBe(400);
  });

  it('works with no request body (uses default grace period)', async () => {
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'Key' }]);
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'Key', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    // Send request with no body
    const res = await app.request('http://localhost/api/v1/auth/keys/old-key-1/rotate', {
      method: 'POST',
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.oldKeyExpiresAt).toBeTruthy();
  });

  it('tracks api_key.rotated event', async () => {
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'Key' }]);
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'Key', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    await app.request(jsonPost('/api/v1/auth/keys/old-key-1/rotate', {}));
    const { trackEvent } = await import('@emithq/core');
    expect(trackEvent).toHaveBeenCalledWith('api_key.rotated', 'org-123');
  });

  it('sets expiresAt (not revokedAt) when grace period > 0', async () => {
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'Key' }]);
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'Key', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    await app.request(jsonPost('/api/v1/auth/keys/old-key-1/rotate', { gracePeriodMinutes: 30 }));
    const setArg = mockTx.set.mock.calls[0][0];
    expect(setArg).toHaveProperty('expiresAt');
    expect(setArg).not.toHaveProperty('revokedAt');
  });

  it('returns 404 when old key is already expired', async () => {
    // The select query filters out expired keys, so limit returns empty
    mockTx.limit.mockResolvedValueOnce([]);
    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys/expired-key/rotate', {}));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('not_found');
  });

  it('preserves the key name from the old key', async () => {
    mockTx.limit.mockResolvedValueOnce([{ id: 'old-key-1', name: 'Production API' }]);
    mockTx.returning.mockResolvedValueOnce([
      { id: 'new-key-1', name: 'Production API', createdAt: '2026-03-18T01:00:00Z' },
    ]);

    const app = createApp();
    const res = await app.request(jsonPost('/api/v1/auth/keys/old-key-1/rotate', {}));
    const json = await res.json();
    expect(json.data.name).toBe('Production API');
  });
});
