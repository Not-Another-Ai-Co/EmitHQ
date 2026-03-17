import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';

vi.mock('@emithq/core', () => ({
  applications: {
    id: 'id',
    orgId: 'org_id',
    uid: 'uid',
    name: 'name',
    createdAt: 'created_at',
  },
}));

vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: () => vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
  getAuth: vi.fn(),
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
}));

vi.mock('../middleware/tenant', () => ({
  tenantScope: vi.fn(
    async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      // tenantScope normally sets tx — provide mock tx from shared state
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
          }),
        }),
      };
      c.set('tx', mockTx);
      await next();
    },
  ),
}));

// Shared mock tx state — set before each request via middleware
let mockSelectResult: unknown[] = [];
let mockInsertResult: unknown[] = [];

async function createTestApp() {
  const app = new Hono();
  const { applicationRoutes } = await import('./applications');
  app.route('/api/v1/app', applicationRoutes);
  return app;
}

describe('POST /api/v1/app', () => {
  it('returns 201 with created app', async () => {
    mockInsertResult = [
      { id: 'app-new', uid: 'test-app', name: 'Test App', createdAt: '2026-03-17T00:00:00Z' },
    ];
    const app = await createTestApp();
    const res = await app.request('/api/v1/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test App', uid: 'test-app' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe('app-new');
    expect(body.data.name).toBe('Test App');
  });

  it('returns 400 when name is missing', async () => {
    const app = await createTestApp();
    const res = await app.request('/api/v1/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'no-name' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
  });

  it('returns 400 when name is empty', async () => {
    const app = await createTestApp();
    const res = await app.request('/api/v1/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '  ' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when uid is empty', async () => {
    const app = await createTestApp();
    const res = await app.request('/api/v1/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', uid: '' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/app/:appId', () => {
  it('returns app by non-UUID uid', async () => {
    mockSelectResult = [
      { id: 'some-uuid', uid: 'default', name: 'Default App', createdAt: '2026-03-17T00:00:00Z' },
    ];
    const app = await createTestApp();
    const res = await app.request('/api/v1/app/default');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.uid).toBe('default');
  });

  it('returns 404 when app not found', async () => {
    mockSelectResult = [];
    const app = await createTestApp();
    const res = await app.request('/api/v1/app/nonexistent');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('not_found');
  });
});
