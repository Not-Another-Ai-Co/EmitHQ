import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnrecoverableError } from 'bullmq';

// Mock DB client
vi.mock('../db/client', () => ({
  adminDb: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock schema — just need column references
vi.mock('../db/schema', () => ({
  messages: { id: 'id', payload: 'payload', eventType: 'event_type' },
  endpoints: {
    id: 'id',
    url: 'url',
    signingSecret: 'signing_secret',
    disabled: 'disabled',
    failureCount: 'failure_count',
    rateLimit: 'rate_limit',
  },
  deliveryAttempts: {
    id: 'id',
    status: 'status',
    responseStatus: 'response_status',
    responseBody: 'response_body',
    responseTimeMs: 'response_time_ms',
    errorMessage: 'error_message',
    attemptedAt: 'attempted_at',
  },
}));

// Mock signing
vi.mock('../signing/webhook-signer', () => ({
  buildWebhookHeaders: vi.fn().mockReturnValue({
    'webhook-id': 'msg_test-id',
    'webhook-timestamp': '1710000000',
    'webhook-signature': 'v1,testSignature',
  }),
}));

// Mock redis
vi.mock('../queue/redis', () => ({
  createRedisConnection: vi.fn().mockReturnValue({}),
}));

import { adminDb } from '../db/client';
import { deliverWebhook, processDeliveryJob, handleExhaustedDelivery } from './delivery-worker';

const TEST_JOB_DATA = {
  messageId: 'msg-1',
  endpointId: 'ep-1',
  orgId: 'org-1',
  attemptId: 'att-1',
};

function mockDbSelect(callResults: Array<unknown[]>) {
  let callIndex = 0;
  vi.mocked(adminDb.select).mockImplementation(() => {
    const results = callResults[callIndex] ?? [];
    callIndex++;
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(results),
        }),
      }),
    } as never;
  });
}

function mockDbUpdate() {
  vi.mocked(adminDb.update).mockImplementation(
    () =>
      ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }) as never,
  );
}

describe('deliverWebhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success for 200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        text: vi.fn().mockResolvedValue('OK'),
      }),
    );

    const result = await deliverWebhook('https://example.com/webhook', '{}', {});

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.responseBody).toBe('OK');
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.errorMessage).toBeNull();
  });

  it('returns failure for 500 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      }),
    );

    const result = await deliverWebhook('https://example.com/webhook', '{}', {});

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.responseBody).toBe('Internal Server Error');
  });

  it('handles timeout errors', async () => {
    const timeoutErr = new Error('Timeout');
    timeoutErr.name = 'TimeoutError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutErr));

    const result = await deliverWebhook('https://example.com/webhook', '{}', {}, 5000);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.errorMessage).toContain('timed out');
    expect(result.errorMessage).toContain('5000');
  });

  it('handles network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const result = await deliverWebhook('https://example.com/webhook', '{}', {});

    expect(result.success).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.errorMessage).toBe('ECONNREFUSED');
  });

  it('truncates response body to 1024 characters', async () => {
    const longBody = 'x'.repeat(2000);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        text: vi.fn().mockResolvedValue(longBody),
      }),
    );

    const result = await deliverWebhook('https://example.com/webhook', '{}', {});

    expect(result.responseBody).toHaveLength(1024);
  });

  it('returns success for 201 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 201,
        text: vi.fn().mockResolvedValue('Created'),
      }),
    );

    const result = await deliverWebhook('https://example.com/webhook', '{}', {});
    expect(result.success).toBe(true);
  });

  it('returns failure for 301 redirect', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 301,
        text: vi.fn().mockResolvedValue('Moved'),
      }),
    );

    const result = await deliverWebhook('https://example.com/webhook', '{}', {});
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(301);
  });
});

describe('processDeliveryJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbUpdate();
  });

  it('delivers successfully and marks attempt as delivered', async () => {
    mockDbSelect([
      [{ id: 'msg-1', payload: { test: true }, eventType: 'test.event' }],
      [
        {
          id: 'ep-1',
          url: 'https://example.com/webhook',
          signingSecret: 'whsec_dGVzdA==',
          disabled: false,
          failureCount: 0,
          rateLimit: null,
        },
      ],
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        text: vi.fn().mockResolvedValue('OK'),
      }),
    );

    await processDeliveryJob(TEST_JOB_DATA);

    // Verify attempt was updated
    expect(adminDb.update).toHaveBeenCalled();
  });

  it('throws UnrecoverableError when message not found', async () => {
    mockDbSelect([[]]);

    await expect(processDeliveryJob(TEST_JOB_DATA)).rejects.toThrow(UnrecoverableError);
    await expect(processDeliveryJob(TEST_JOB_DATA)).rejects.toThrow(/not found/);
  });

  it('throws UnrecoverableError when endpoint not found', async () => {
    mockDbSelect([[{ id: 'msg-1', payload: {}, eventType: 'test' }], []]);

    await expect(processDeliveryJob(TEST_JOB_DATA)).rejects.toThrow(UnrecoverableError);
  });

  it('throws UnrecoverableError for disabled endpoint', async () => {
    mockDbSelect([
      [{ id: 'msg-1', payload: {}, eventType: 'test' }],
      [
        {
          id: 'ep-1',
          url: 'https://example.com',
          signingSecret: 'whsec_dGVzdA==',
          disabled: true,
          failureCount: 5,
          rateLimit: null,
        },
      ],
    ]);

    let caught: unknown;
    try {
      await processDeliveryJob(TEST_JOB_DATA);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(UnrecoverableError);
    expect((caught as Error).message).toMatch(/disabled/);
  });

  it('throws UnrecoverableError for non-retriable status codes (401)', async () => {
    mockDbSelect([
      [{ id: 'msg-1', payload: { test: true }, eventType: 'test' }],
      [
        {
          id: 'ep-1',
          url: 'https://example.com',
          signingSecret: 'whsec_dGVzdA==',
          disabled: false,
          failureCount: 0,
          rateLimit: null,
        },
      ],
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized'),
      }),
    );

    let caught: unknown;
    try {
      await processDeliveryJob(TEST_JOB_DATA);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(UnrecoverableError);
    expect((caught as Error).message).toMatch(/Non-retriable/);
  });

  it('throws regular error for retriable 500 status', async () => {
    mockDbSelect([
      [{ id: 'msg-1', payload: { test: true }, eventType: 'test' }],
      [
        {
          id: 'ep-1',
          url: 'https://example.com',
          signingSecret: 'whsec_dGVzdA==',
          disabled: false,
          failureCount: 0,
          rateLimit: null,
        },
      ],
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        text: vi.fn().mockResolvedValue('Server Error'),
      }),
    );

    let caught: unknown;
    try {
      await processDeliveryJob(TEST_JOB_DATA);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(UnrecoverableError);
  });

  it('triggers circuit breaker when failure count reaches threshold (10)', async () => {
    // Endpoint starts with failureCount=9 — one more failure triggers circuit breaker
    mockDbSelect([
      [{ id: 'msg-1', payload: { test: true }, eventType: 'test' }],
      [
        {
          id: 'ep-1',
          url: 'https://example.com',
          signingSecret: 'whsec_dGVzdA==',
          disabled: false,
          failureCount: 9,
          rateLimit: null,
        },
      ],
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        text: vi.fn().mockResolvedValue('Server Error'),
      }),
    );

    // Capture set() args from all update calls
    const setCalls: unknown[] = [];
    vi.mocked(adminDb.update).mockImplementation(
      () =>
        ({
          set: vi.fn().mockImplementation((args: unknown) => {
            setCalls.push(args);
            return { where: vi.fn().mockResolvedValue(undefined) };
          }),
        }) as never,
    );

    // processDeliveryJob throws on retriable failure — catch it
    await expect(processDeliveryJob(TEST_JOB_DATA)).rejects.toThrow();

    // Find the endpoint update (the one with 'disabled' field)
    const endpointUpdate = setCalls.find(
      (c) => typeof c === 'object' && c !== null && 'disabled' in c,
    );
    expect(endpointUpdate).toBeDefined();
    expect(endpointUpdate).toMatchObject({
      failureCount: 10,
      disabled: true,
      disabledReason: expect.stringContaining('circuit_breaker'),
    });
  });

  it('increments failure count without circuit breaker when below threshold', async () => {
    mockDbSelect([
      [{ id: 'msg-1', payload: { test: true }, eventType: 'test' }],
      [
        {
          id: 'ep-1',
          url: 'https://example.com',
          signingSecret: 'whsec_dGVzdA==',
          disabled: false,
          failureCount: 3,
          rateLimit: null,
        },
      ],
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        text: vi.fn().mockResolvedValue('Server Error'),
      }),
    );

    const setCalls: unknown[] = [];
    vi.mocked(adminDb.update).mockImplementation(
      () =>
        ({
          set: vi.fn().mockImplementation((args: unknown) => {
            setCalls.push(args);
            return { where: vi.fn().mockResolvedValue(undefined) };
          }),
        }) as never,
    );

    await expect(processDeliveryJob(TEST_JOB_DATA)).rejects.toThrow();

    // Endpoint update should increment count but NOT disable
    const endpointUpdate = setCalls.find(
      (c) => typeof c === 'object' && c !== null && 'failureCount' in c && !('disabled' in c),
    );
    expect(endpointUpdate).toBeDefined();
    expect(endpointUpdate).toMatchObject({ failureCount: 4 });
  });
});

describe('handleExhaustedDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks delivery attempt as exhausted with null nextAttemptAt', async () => {
    const setCalls: unknown[] = [];
    vi.mocked(adminDb.update).mockImplementation(
      () =>
        ({
          set: vi.fn().mockImplementation((args: unknown) => {
            setCalls.push(args);
            return { where: vi.fn().mockResolvedValue(undefined) };
          }),
        }) as never,
    );

    await handleExhaustedDelivery(TEST_JOB_DATA);

    expect(setCalls).toHaveLength(1);
    expect(setCalls[0]).toMatchObject({
      status: 'exhausted',
      nextAttemptAt: null,
    });
  });
});
