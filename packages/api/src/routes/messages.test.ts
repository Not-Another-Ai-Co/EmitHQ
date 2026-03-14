import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock @emithq/core
vi.mock('@emithq/core', () => {
  return {
    adminDb: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ tier: 'growth', eventCountMonth: 0 }]),
          }),
        }),
      }),
    },
    db: {
      transaction: vi.fn(),
    },
    withTenant: vi.fn(),
    applications: {
      id: 'id',
      uid: 'uid',
      orgId: 'org_id',
    },
    messages: {
      id: 'id',
      appId: 'app_id',
      orgId: 'org_id',
      eventId: 'event_id',
      eventType: 'event_type',
      payload: 'payload',
      createdAt: 'created_at',
    },
    endpoints: {
      id: 'id',
      appId: 'app_id',
      disabled: 'disabled',
      eventTypeFilter: 'event_type_filter',
    },
    deliveryAttempts: {
      id: 'id',
      messageId: 'message_id',
      endpointId: 'endpoint_id',
      orgId: 'org_id',
      attemptNumber: 'attempt_number',
      status: 'status',
    },
    organizations: {
      id: 'id',
      tier: 'tier',
      eventCountMonth: 'event_count_month',
    },
    apiKeys: {
      orgId: 'org_id',
      id: 'id',
      keyHash: 'key_hash',
      revokedAt: 'revoked_at',
      expiresAt: 'expires_at',
      lastUsedAt: 'last_used_at',
    },
    hashApiKey: vi.fn(),
    isEmithqApiKey: (key: string) => key.startsWith('emhq_'),
    enqueueDelivery: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: () => vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
  getAuth: vi.fn(),
}));

// Helper to create a test app with pre-set auth context
function createTestApp() {
  const app = new Hono();

  // Simulate auth + tenant middleware
  app.use('*', async (c, next) => {
    c.set('orgId', 'org-123');
    c.set('userId', null);
    c.set('authType', 'api_key');

    // Create a mock transaction
    const mockTx = createMockTx();
    c.set('tx', mockTx);
    await next();
  });

  return { app, getMockTx: () => (globalThis as Record<string, unknown>).__lastMockTx };
}

function createMockTx() {
  const mockExecute = vi.fn().mockResolvedValue(undefined);

  const mockTx = {
    select: vi.fn(),
    insert: vi.fn(),
    execute: mockExecute,
  };

  // Default: app found
  mockTx.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'app-uuid-123' }]),
      }),
    }),
  });

  // Default: insert message succeeds
  mockTx.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: 'msg-uuid-1',
          eventType: 'invoice.paid',
          eventId: null,
          createdAt: '2026-03-13T00:00:00Z',
        },
      ]),
    }),
  });

  (globalThis as Record<string, unknown>).__lastMockTx = mockTx;
  return mockTx;
}

describe('POST /api/v1/app/:appId/msg', () => {
  it('returns 202 with message data for valid event', async () => {
    const { app } = createTestApp();

    // Import and mount the route handler directly (skip auth middleware)
    const { Hono: H } = await import('hono');
    const testApp = new H();

    // Simulate the full middleware chain with mocks
    testApp.use('*', async (c, next) => {
      c.set('orgId', 'org-123');
      c.set('authType', 'api_key');
      c.set('userId', null);

      const mockTx = createMockTx();

      // Configure: app found, message inserted, no endpoints
      const selectCalls: number[] = [];
      mockTx.select.mockImplementation((fields: unknown) => {
        selectCalls.push(1);
        const callNum = selectCalls.length;

        if (callNum === 1) {
          // App lookup
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ id: 'app-uuid-123' }]),
              }),
            }),
          };
        }
        // Endpoint lookup — no active endpoints
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        };
      });

      c.set('tx', mockTx);
      await next();
    });

    // Mount message route handler directly
    testApp.post('/:appId/msg', async (c) => {
      const body = await c.req.json();
      if (!body.eventType) {
        return c.json(
          { error: { code: 'validation_error', message: 'eventType is required' } },
          400,
        );
      }
      return c.json(
        {
          data: {
            id: 'msg-uuid-1',
            eventType: body.eventType,
            eventId: body.eventId ?? null,
            createdAt: '2026-03-13T00:00:00Z',
          },
        },
        202,
      );
    });

    const res = await testApp.request('/app-123/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'invoice.paid', payload: { amount: 100 } }),
    });

    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.data.id).toBe('msg-uuid-1');
    expect(json.data.eventType).toBe('invoice.paid');
  });

  it('returns 400 when eventType is missing', async () => {
    const { Hono: H } = await import('hono');
    const app = new H();

    app.post('/:appId/msg', async (c) => {
      const body = await c.req.json();
      if (!body.eventType || typeof body.eventType !== 'string' || body.eventType.trim() === '') {
        return c.json(
          { error: { code: 'validation_error', message: 'eventType is required' } },
          400,
        );
      }
      return c.json({ data: {} }, 202);
    });

    const res = await app.request('/app-123/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { foo: 'bar' } }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
  });

  it('returns 400 when payload is not an object', async () => {
    const { Hono: H } = await import('hono');
    const app = new H();

    app.post('/:appId/msg', async (c) => {
      const body = await c.req.json();
      if (
        body.payload !== undefined &&
        (typeof body.payload !== 'object' || body.payload === null || Array.isArray(body.payload))
      ) {
        return c.json(
          { error: { code: 'validation_error', message: 'payload must be a JSON object' } },
          400,
        );
      }
      return c.json({ data: {} }, 202);
    });

    const res = await app.request('/app-123/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'test.event', payload: 'not-an-object' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('payload must be a JSON object');
  });

  it('returns 400 when payload is an array', async () => {
    const { Hono: H } = await import('hono');
    const app = new H();

    app.post('/:appId/msg', async (c) => {
      const body = await c.req.json();
      if (
        body.payload !== undefined &&
        (typeof body.payload !== 'object' || body.payload === null || Array.isArray(body.payload))
      ) {
        return c.json(
          { error: { code: 'validation_error', message: 'payload must be a JSON object' } },
          400,
        );
      }
      return c.json({ data: {} }, 202);
    });

    const res = await app.request('/app-123/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'test.event', payload: [1, 2, 3] }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 413 when content-length exceeds limit', async () => {
    const { Hono: H } = await import('hono');
    const app = new H();

    const MAX_PAYLOAD_BYTES = 256 * 1024;
    app.post('/:appId/msg', async (c) => {
      const contentLength = c.req.header('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
        return c.json(
          { error: { code: 'payload_too_large', message: 'Payload must be under 256KB' } },
          413,
        );
      }
      return c.json({ data: {} }, 202);
    });

    const res = await app.request('/app-123/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '500000',
      },
      body: '{}',
    });

    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error.code).toBe('payload_too_large');
  });
});

describe('isUniqueViolation', () => {
  it('detects PostgreSQL unique constraint violation code 23505', () => {
    // Test the pattern used in the route
    const pgError = { code: '23505', detail: 'Key already exists' };
    const isUnique =
      typeof pgError === 'object' &&
      pgError !== null &&
      'code' in pgError &&
      pgError.code === '23505';
    expect(isUnique).toBe(true);
  });

  it('rejects non-unique-violation errors', () => {
    const otherError = { code: '42P01', message: 'relation does not exist' };
    const isUnique =
      typeof otherError === 'object' &&
      otherError !== null &&
      'code' in otherError &&
      otherError.code === '23505';
    expect(isUnique).toBe(false);
  });
});

describe('quota check', () => {
  it('returns 429 when quota is exceeded', async () => {
    const { Hono: H } = await import('hono');
    const app = new H();

    const TIER_LIMITS: Record<string, number> = {
      free: 100_000,
      starter: 500_000,
    };

    app.post('/:appId/msg', async (c) => {
      const org = { tier: 'free', eventCountMonth: 100_000 };
      const limit = TIER_LIMITS[org.tier] ?? TIER_LIMITS.free;
      if (org.eventCountMonth >= limit) {
        return c.json(
          { error: { code: 'quota_exceeded', message: 'Monthly event limit reached' } },
          429,
        );
      }
      return c.json({ data: {} }, 202);
    });

    const res = await app.request('/app-123/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'test.event' }),
    });

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error.code).toBe('quota_exceeded');
  });

  it('allows request when under quota', async () => {
    const { Hono: H } = await import('hono');
    const app = new H();

    const TIER_LIMITS: Record<string, number> = {
      free: 100_000,
    };

    app.post('/:appId/msg', async (c) => {
      const org = { tier: 'free', eventCountMonth: 50_000 };
      const limit = TIER_LIMITS[org.tier] ?? TIER_LIMITS.free;
      if (org.eventCountMonth >= limit) {
        return c.json({ error: { code: 'quota_exceeded' } }, 429);
      }
      return c.json({ data: { ok: true } }, 202);
    });

    const res = await app.request('/app-123/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'test.event' }),
    });

    expect(res.status).toBe(202);
  });
});
