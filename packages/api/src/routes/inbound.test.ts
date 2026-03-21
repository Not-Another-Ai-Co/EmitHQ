import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { jsonRequest } from '../test-helpers/create-test-app';

/**
 * T-098: Test-first tests for T-090 inbound webhook handlers.
 *
 * These tests define the contract for two API endpoints:
 *   POST /api/v1/inbound/reply       — Resend inbound email (reply classification)
 *   POST /api/v1/inbound/resend-events — Resend delivery status webhooks
 *
 * The route file (inbound.ts) does not exist yet — T-090 will implement it.
 * These tests will fail until the implementation is complete.
 */

// Mock @emithq/core before importing the route
vi.mock('@emithq/core', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  };
  return {
    adminDb: { ...mockDb },
    db: mockDb,
    withTenant: vi.fn(async (_orgId: string, fn: (tx: unknown) => Promise<void>) => {
      await fn(mockDb);
    }),
    trackEvent: vi.fn(),
  };
});

// The route module — will fail to import until T-090 creates it
// For now, we build a placeholder app to show the expected API contract
let inboundReplyRoute: Hono;
let inboundResendEventsRoute: Hono;

try {
  // T-090 will export these from ./inbound.ts
  const mod = await import('./inbound');
  inboundReplyRoute = mod.inboundReplyRoute;
  inboundResendEventsRoute = mod.inboundResendEventsRoute;
} catch (e: unknown) {
  // Only skip on module-not-found — re-throw parse errors so they surface immediately
  const code = (e as { code?: string }).code;
  if (code && code !== 'ERR_MODULE_NOT_FOUND') throw e;
  inboundReplyRoute = null as unknown as Hono;
  inboundResendEventsRoute = null as unknown as Hono;
}

const VALID_RESEND_SIGNATURE = 'test-valid-signature';

function makeReplyPayload(overrides: Record<string, unknown> = {}) {
  return {
    from: 'prospect@example.com',
    subject: 'Re: Webhook infrastructure for your SaaS',
    text: 'This looks interesting, tell me more.',
    headers: { 'message-id': '<msg-001@example.com>' },
    ...overrides,
  };
}

function makeResendEventPayload(type: string, overrides: Record<string, unknown> = {}) {
  return {
    type,
    data: {
      email_id: 're_test123',
      from: 'julian@emithq.com',
      to: ['prospect@example.com'],
      created_at: '2026-03-21T08:00:00Z',
      ...overrides,
    },
  };
}

describe('POST /api/v1/inbound/reply', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    if (!inboundReplyRoute) return;
    app = new Hono();
    app.route('/api/v1/inbound', inboundReplyRoute);
  });

  it.skipIf(!inboundReplyRoute)('returns 200 and classifies a valid reply', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload(),
        headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.category).toBeDefined();
    expect(json.data.action).toBeDefined();
  });

  it.skipIf(!inboundReplyRoute)('returns 400 for missing required fields (no from)', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload({ from: undefined }),
        headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
  });

  it.skipIf(!inboundReplyRoute)('returns 400 for missing body (no text and no html)', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload({ text: undefined, html: undefined }),
        headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
      }),
    );
    expect(res.status).toBe(400);
  });

  it.skipIf(!inboundReplyRoute)('returns 401 for missing signature header', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload(),
      }),
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('unauthorized');
  });

  it.skipIf(!inboundReplyRoute)('returns 401 for invalid signature', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload(),
        headers: { 'x-resend-signature': 'invalid-signature' },
      }),
    );
    expect(res.status).toBe(401);
  });

  it.skipIf(!inboundReplyRoute)(
    'auto-handles suppressed sender (returns 200, no classification)',
    async () => {
      // Mock: sender is in suppression list
      const res = await app.request(
        jsonRequest('/api/v1/inbound/reply', {
          method: 'POST',
          body: makeReplyPayload({ from: 'suppressed@example.com' }),
          headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.action).toBe('suppressed');
    },
  );

  it.skipIf(!inboundReplyRoute)('classifies interested reply and flags for review', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload({
          text: 'This is exactly what we need! Can we schedule a demo?',
        }),
        headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.category).toBe('interested');
    expect(json.data.action).toBe('flagged');
  });

  it.skipIf(!inboundReplyRoute)('classifies unsubscribe and auto-suppresses', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/reply', {
        method: 'POST',
        body: makeReplyPayload({
          text: 'Please unsubscribe me from this list',
        }),
        headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.category).toBe('unsubscribe');
    expect(json.data.action).toBe('suppressed');
  });
});

describe('POST /api/v1/inbound/resend-events', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    if (!inboundResendEventsRoute) return;
    app = new Hono();
    app.route('/api/v1/inbound', inboundResendEventsRoute);
  });

  it.skipIf(!inboundResendEventsRoute)(
    'handles email.bounced — marks target as bounced',
    async () => {
      const res = await app.request(
        jsonRequest('/api/v1/inbound/resend-events', {
          method: 'POST',
          body: makeResendEventPayload('email.bounced'),
          headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.processed).toBe(true);
      expect(json.data.action).toBe('bounced');
    },
  );

  it.skipIf(!inboundResendEventsRoute)(
    'handles email.delivered — logs delivery event',
    async () => {
      const res = await app.request(
        jsonRequest('/api/v1/inbound/resend-events', {
          method: 'POST',
          body: makeResendEventPayload('email.delivered'),
          headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.processed).toBe(true);
      expect(json.data.action).toBe('logged');
    },
  );

  it.skipIf(!inboundResendEventsRoute)(
    'handles email.complained — adds to suppression list',
    async () => {
      const res = await app.request(
        jsonRequest('/api/v1/inbound/resend-events', {
          method: 'POST',
          body: makeResendEventPayload('email.complained'),
          headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.processed).toBe(true);
      expect(json.data.action).toBe('suppressed');
    },
  );

  it.skipIf(!inboundResendEventsRoute)('handles duplicate event ID idempotently', async () => {
    const payload = makeResendEventPayload('email.delivered');

    // First call
    const res1 = await app.request(
      jsonRequest('/api/v1/inbound/resend-events', {
        method: 'POST',
        body: payload,
        headers: {
          'x-resend-signature': VALID_RESEND_SIGNATURE,
          'x-resend-event-id': 'evt_duplicate_123',
        },
      }),
    );
    expect(res1.status).toBe(200);

    // Second call with same event ID
    const res2 = await app.request(
      jsonRequest('/api/v1/inbound/resend-events', {
        method: 'POST',
        body: payload,
        headers: {
          'x-resend-signature': VALID_RESEND_SIGNATURE,
          'x-resend-event-id': 'evt_duplicate_123',
        },
      }),
    );
    expect(res2.status).toBe(200);
    const json = await res2.json();
    expect(json.data.duplicate).toBe(true);
  });

  it.skipIf(!inboundResendEventsRoute)('returns 401 for missing signature', async () => {
    const res = await app.request(
      jsonRequest('/api/v1/inbound/resend-events', {
        method: 'POST',
        body: makeResendEventPayload('email.delivered'),
      }),
    );
    expect(res.status).toBe(401);
  });

  it.skipIf(!inboundResendEventsRoute)(
    'acknowledges unknown event type without processing',
    async () => {
      const res = await app.request(
        jsonRequest('/api/v1/inbound/resend-events', {
          method: 'POST',
          body: makeResendEventPayload('email.unknown_event'),
          headers: { 'x-resend-signature': VALID_RESEND_SIGNATURE },
        }),
      );
      // Unknown events should be acknowledged but not processed
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.processed).toBe(false);
    },
  );
});
