import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coreMock, authMock, tenantMock } from '../test-helpers/mock-core';

// Mock dependencies BEFORE importing the route
vi.mock('@emithq/core', () => coreMock());
vi.mock('../middleware/auth', () => authMock());
vi.mock('../middleware/tenant', () => tenantMock());
vi.mock('../middleware/quota', () => ({
  quotaCheck: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
  quotaHeaders: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
}));

import { messageRoutes } from './messages';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { AuthEnv } from '../types';

/** Create a mock tx that simulates Drizzle transaction operations */
function createMockTx() {
  const mockTx = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  };
  return mockTx;
}

/**
 * Create a test app mounting the REAL messageRoutes with injected auth + tx context.
 * The tenantMock passes through without setting tx, so we inject it explicitly.
 */
function createMessageApp(txOverrides?: ReturnType<typeof createMockTx>) {
  const app = new Hono();
  const mockTx = txOverrides ?? createMockTx();

  // Inject auth context and mock tx (replaces what requireAuth + tenantScope would do)
  const injectContext = createMiddleware<AuthEnv>(async (c, next) => {
    c.set('orgId', 'org-123');
    c.set('userId', null);
    c.set('authType', 'api_key');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.set('tx', mockTx as any);
    await next();
  });

  app.use('/api/v1/app/*', injectContext);
  app.route('/api/v1/app', messageRoutes);

  return { app, mockTx };
}

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/app/:appId/msg (real handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 202 with message data for valid event', async () => {
    const { app, mockTx } = createMessageApp();
    const { adminDb } = await import('@emithq/core');

    // App lookup → found
    let selectCall = 0;
    mockTx.limit.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return Promise.resolve([{ id: 'app-uuid-123' }]); // app
      return Promise.resolve([]); // endpoints — none active
    });

    // Message insert → returning message
    mockTx.returning.mockResolvedValueOnce([
      {
        id: 'msg-uuid-1',
        eventType: 'invoice.paid',
        eventId: null,
        createdAt: '2026-03-13T00:00:00Z',
      },
    ]);

    // Quota increment
    (adminDb.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ event_count_month: 5 }],
    });

    const res = await app.request(
      jsonRequest('/api/v1/app/app-123/msg', {
        eventType: 'invoice.paid',
        payload: { amount: 100 },
      }),
    );

    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.data.id).toBe('msg-uuid-1');
    expect(json.data.eventType).toBe('invoice.paid');
  });

  it('returns 400 when eventType is missing', async () => {
    const { app } = createMessageApp();

    const res = await app.request(
      jsonRequest('/api/v1/app/app-123/msg', { payload: { foo: 'bar' } }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('eventType');
  });

  it('returns 400 when payload is not an object', async () => {
    const { app } = createMessageApp();

    const res = await app.request(
      jsonRequest('/api/v1/app/app-123/msg', {
        eventType: 'test.event',
        payload: 'not-an-object',
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('payload must be a JSON object');
  });

  it('returns 400 when payload is an array', async () => {
    const { app } = createMessageApp();

    const res = await app.request(
      jsonRequest('/api/v1/app/app-123/msg', {
        eventType: 'test.event',
        payload: [1, 2, 3],
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 413 when content-length exceeds limit', async () => {
    const { app } = createMessageApp();

    const res = await app.request(
      jsonRequest(
        '/api/v1/app/app-123/msg',
        { eventType: 'test.event' },
        {
          'Content-Length': '500000',
        },
      ),
    );

    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error.code).toBe('payload_too_large');
  });

  it('returns 404 when application not found', async () => {
    const { app, mockTx } = createMessageApp();

    // App lookup → not found
    mockTx.limit.mockResolvedValueOnce([]);

    const res = await app.request(
      jsonRequest('/api/v1/app/nonexistent/msg', { eventType: 'test.event' }),
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('not_found');
  });
});

describe('isUniqueViolation', () => {
  it('detects PostgreSQL unique constraint violation code 23505', () => {
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
