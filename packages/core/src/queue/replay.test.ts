import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/client', () => ({
  adminDb: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../db/schema', () => ({
  deliveryAttempts: {
    id: 'id',
    messageId: 'message_id',
    endpointId: 'endpoint_id',
    orgId: 'org_id',
    status: 'status',
    attemptNumber: 'attempt_number',
    responseStatus: 'response_status',
    responseBody: 'response_body',
    responseTimeMs: 'response_time_ms',
    errorMessage: 'error_message',
    nextAttemptAt: 'next_attempt_at',
    attemptedAt: 'attempted_at',
  },
  endpoints: {
    id: 'id',
    disabled: 'disabled',
    disabledReason: 'disabled_reason',
    failureCount: 'failure_count',
  },
  messages: { id: 'id' },
}));

vi.mock('./delivery-queue', () => {
  const mockAdd = vi.fn().mockResolvedValue({ id: 'new-job-1' });
  return {
    getDeliveryQueue: vi.fn().mockReturnValue({ add: mockAdd }),
    __mockAdd: mockAdd,
  };
});

vi.mock('./backoff', () => ({
  MAX_DELIVERY_ATTEMPTS: 8,
}));

import { adminDb } from '../db/client';
import { replayDelivery, replayMessage, reEnableEndpoint } from './replay';

function mockSelect(results: unknown[]) {
  vi.mocked(adminDb.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(results),
      }),
    }),
  } as never);
}

function mockSelectNoLimit(results: unknown[]) {
  vi.mocked(adminDb.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(results),
    }),
  } as never);
}

function mockUpdate() {
  vi.mocked(adminDb.update).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  } as never);
}

describe('replayDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate();
  });

  it('resets attempt status and enqueues a new job', async () => {
    mockSelect([
      {
        id: 'att-1',
        messageId: 'msg-1',
        endpointId: 'ep-1',
        orgId: 'org-1',
        status: 'exhausted',
      },
    ]);

    const jobId = await replayDelivery('att-1');
    expect(jobId).toBe('new-job-1');
    expect(adminDb.update).toHaveBeenCalled();
  });

  it('throws if attempt not found', async () => {
    mockSelect([]);
    await expect(replayDelivery('nonexistent')).rejects.toThrow(/not found/);
  });

  it('throws if attempt status is not failed or exhausted', async () => {
    mockSelect([
      {
        id: 'att-1',
        messageId: 'msg-1',
        endpointId: 'ep-1',
        orgId: 'org-1',
        status: 'delivered',
      },
    ]);

    await expect(replayDelivery('att-1')).rejects.toThrow(/Cannot replay/);
  });

  it('accepts failed status for replay', async () => {
    mockSelect([
      {
        id: 'att-1',
        messageId: 'msg-1',
        endpointId: 'ep-1',
        orgId: 'org-1',
        status: 'failed',
      },
    ]);

    const jobId = await replayDelivery('att-1');
    expect(jobId).toBe('new-job-1');
  });
});

describe('replayMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate();
  });

  it('replays all exhausted attempts for a message', async () => {
    // First call: select exhausted attempts (no limit)
    mockSelectNoLimit([
      { id: 'att-1', messageId: 'msg-1', endpointId: 'ep-1', orgId: 'org-1' },
      { id: 'att-2', messageId: 'msg-1', endpointId: 'ep-2', orgId: 'org-1' },
    ]);

    // replayDelivery calls select with limit for each attempt
    let selectCallCount = 0;
    vi.mocked(adminDb.select).mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // replayMessage's initial select
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { id: 'att-1', messageId: 'msg-1', endpointId: 'ep-1', orgId: 'org-1' },
              { id: 'att-2', messageId: 'msg-1', endpointId: 'ep-2', orgId: 'org-1' },
            ]),
          }),
        } as never;
      }
      // replayDelivery's select for each attempt
      const attemptId = selectCallCount === 2 ? 'att-1' : 'att-2';
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: attemptId,
                messageId: 'msg-1',
                endpointId: selectCallCount === 2 ? 'ep-1' : 'ep-2',
                orgId: 'org-1',
                status: 'exhausted',
              },
            ]),
          }),
        }),
      } as never;
    });

    const results = await replayMessage('msg-1');
    expect(results).toHaveLength(2);
    expect(results[0].attemptId).toBe('att-1');
    expect(results[1].attemptId).toBe('att-2');
  });
});

describe('reEnableEndpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate();
  });

  it('resets disabled flag, reason, and failure count', async () => {
    await reEnableEndpoint('ep-1');
    expect(adminDb.update).toHaveBeenCalled();
  });
});
