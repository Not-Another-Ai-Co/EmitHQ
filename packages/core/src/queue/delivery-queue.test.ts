import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock bullmq
vi.mock('bullmq', () => {
  const mockAdd = vi.fn().mockResolvedValue({ id: 'job-1' });
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: mockAdd,
    })),
    __mockAdd: mockAdd,
  };
});

// Mock redis connection
vi.mock('./redis', () => ({
  createRedisConnection: vi.fn().mockReturnValue({}),
}));

import { getDeliveryQueue, enqueueDelivery } from './delivery-queue';

describe('getDeliveryQueue', () => {
  it('returns a queue instance', () => {
    const queue = getDeliveryQueue();
    expect(queue).toBeDefined();
    expect(queue.add).toBeDefined();
  });

  it('returns the same instance on subsequent calls', () => {
    const q1 = getDeliveryQueue();
    const q2 = getDeliveryQueue();
    expect(q1).toBe(q2);
  });
});

describe('enqueueDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a job to the queue with correct data', async () => {
    const data = {
      messageId: 'msg-1',
      endpointId: 'ep-1',
      orgId: 'org-1',
      attemptId: 'att-1',
    };

    await enqueueDelivery(data);

    const queue = getDeliveryQueue();
    expect(queue.add).toHaveBeenCalledWith('deliver', data, {
      jobId: 'delivery:att-1',
    });
  });

  it('uses attemptId as the job ID for idempotency', async () => {
    await enqueueDelivery({
      messageId: 'msg-2',
      endpointId: 'ep-2',
      orgId: 'org-2',
      attemptId: 'unique-attempt-id',
    });

    const queue = getDeliveryQueue();
    expect(queue.add).toHaveBeenCalledWith(
      'deliver',
      expect.anything(),
      expect.objectContaining({ jobId: 'delivery:unique-attempt-id' }),
    );
  });
});
