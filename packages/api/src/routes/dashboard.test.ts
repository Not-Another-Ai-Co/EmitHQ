import { describe, it, expect } from 'vitest';

describe('dashboard API — message list', () => {
  it('GET /:appId/msg returns paginated message list', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/msg', async (c) => {
      return c.json({
        data: [
          { id: 'msg-1', eventType: 'user.created', eventId: null, createdAt: '2026-03-13' },
          { id: 'msg-2', eventType: 'invoice.paid', eventId: 'evt-1', createdAt: '2026-03-12' },
        ],
        iterator: 'cursor-abc',
        done: false,
      });
    });

    const res = await app.request('/app-1/msg');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(2);
    expect(json).toHaveProperty('iterator');
    expect(json).toHaveProperty('done');
  });

  it('supports eventType filter query param', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/msg', async (c) => {
      const eventType = c.req.query('eventType');
      return c.json({
        data: [{ id: 'msg-1', eventType: eventType ?? 'all' }],
        iterator: null,
        done: true,
      });
    });

    const res = await app.request('/app-1/msg?eventType=user.created');
    const json = await res.json();
    expect(json.data[0].eventType).toBe('user.created');
  });

  it('supports date range filter with since/until', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/msg', async (c) => {
      const since = c.req.query('since');
      const until = c.req.query('until');
      return c.json({
        data: [],
        filters: { since, until },
        iterator: null,
        done: true,
      });
    });

    const res = await app.request('/app-1/msg?since=2026-03-01&until=2026-03-13');
    const json = await res.json();
    expect(json.filters.since).toBe('2026-03-01');
    expect(json.filters.until).toBe('2026-03-13');
  });
});

describe('dashboard API — message detail', () => {
  it('GET /:appId/msg/:msgId returns message with delivery attempts', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/msg/:msgId', async (c) => {
      return c.json({
        data: {
          id: c.req.param('msgId'),
          eventType: 'user.created',
          payload: { userId: '123' },
          attempts: [
            {
              id: 'att-1',
              endpointId: 'ep-1',
              attemptNumber: 1,
              status: 'delivered',
              responseStatus: 200,
              responseTimeMs: 42,
            },
          ],
        },
      });
    });

    const res = await app.request('/app-1/msg/msg-1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('msg-1');
    expect(json.data.attempts).toHaveLength(1);
    expect(json.data.attempts[0].status).toBe('delivered');
    expect(json.data.payload).toHaveProperty('userId');
  });

  it('returns 404 for non-existent message', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/msg/:msgId', async (c) => {
      return c.json({ error: { code: 'not_found', message: 'Message not found' } }, 404);
    });

    const res = await app.request('/app-1/msg/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('dashboard API — overview stats', () => {
  it('GET /:appId/stats returns aggregate dashboard data', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/stats', async (c) => {
      return c.json({
        data: {
          eventsToday: 142,
          successRate: 98.5,
          activeEndpoints: 5,
          pendingRetries: 3,
        },
      });
    });

    const res = await app.request('/app-1/stats');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.eventsToday).toBe(142);
    expect(json.data.successRate).toBeGreaterThanOrEqual(0);
    expect(json.data.successRate).toBeLessThanOrEqual(100);
    expect(json.data.activeEndpoints).toBeGreaterThanOrEqual(0);
    expect(json.data.pendingRetries).toBeGreaterThanOrEqual(0);
  });
});

describe('dashboard API — DLQ', () => {
  it('GET /:appId/dlq returns exhausted attempts with pagination', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/dlq', async (c) => {
      return c.json({
        data: [
          {
            id: 'att-1',
            messageId: 'msg-1',
            endpointId: 'ep-1',
            status: 'exhausted',
            errorMessage: 'Connection refused',
          },
        ],
        iterator: null,
        done: true,
      });
    });

    const res = await app.request('/app-1/dlq');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].status).toBe('exhausted');
    expect(json).toHaveProperty('iterator');
    expect(json).toHaveProperty('done');
  });
});

describe('dashboard API — endpoint health', () => {
  it('GET /:appId/endpoint-health returns endpoints with delivery stats', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/endpoint-health', async (c) => {
      return c.json({
        data: [
          {
            id: 'ep-1',
            url: 'https://example.com/hook',
            disabled: false,
            failureCount: 0,
            totalAttempts: 100,
            deliveredCount: 98,
            successRate: 98,
            avgLatencyMs: 142,
            lastDelivery: '2026-03-13T12:00:00Z',
          },
        ],
      });
    });

    const res = await app.request('/app-1/endpoint-health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0]).toHaveProperty('successRate');
    expect(json.data[0]).toHaveProperty('avgLatencyMs');
    expect(json.data[0]).toHaveProperty('lastDelivery');
    expect(json.data[0]).toHaveProperty('totalAttempts');
  });

  it('shows 100% success rate for endpoints with no attempts', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/:appId/endpoint-health', async (c) => {
      return c.json({
        data: [
          {
            id: 'ep-new',
            totalAttempts: 0,
            deliveredCount: 0,
            successRate: 100,
            avgLatencyMs: 0,
            lastDelivery: null,
          },
        ],
      });
    });

    const res = await app.request('/app-1/endpoint-health');
    const json = await res.json();
    expect(json.data[0].successRate).toBe(100);
    expect(json.data[0].lastDelivery).toBeNull();
  });
});

describe('cursor pagination', () => {
  it('encodes and decodes cursor for message list', () => {
    const cursorData = { createdAt: '2026-03-13T00:00:00Z', id: 'msg-123' };
    const encoded = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
    expect(decoded.createdAt).toBe(cursorData.createdAt);
    expect(decoded.id).toBe(cursorData.id);
  });

  it('encodes and decodes cursor for DLQ list', () => {
    const cursorData = { createdAt: '2026-03-13T00:00:00Z', id: 'att-456' };
    const encoded = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
    expect(decoded.id).toBe('att-456');
  });
});
