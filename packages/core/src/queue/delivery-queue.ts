import { Queue } from 'bullmq';
import { createRedisConnection } from './redis';

export interface DeliveryJobData {
  messageId: string;
  endpointId: string;
  orgId: string;
  attemptId: string;
}

let queue: Queue<DeliveryJobData> | null = null;

/**
 * Get or create the delivery queue instance.
 * Lazy initialization — queue is created on first use, not at import time.
 * This allows the API to start even if Redis is temporarily unavailable.
 */
export function getDeliveryQueue(): Queue<DeliveryJobData> {
  if (!queue) {
    queue = new Queue<DeliveryJobData>('webhook-delivery', {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 8,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: { count: 5_000 },
      },
    });
  }
  return queue;
}

/**
 * Enqueue a single delivery job for one endpoint.
 * Called once per active endpoint during fan-out.
 * If Redis is unavailable, the error propagates but the message is already persisted in PostgreSQL.
 */
export async function enqueueDelivery(data: DeliveryJobData): Promise<void> {
  const q = getDeliveryQueue();
  await q.add('deliver', data, {
    jobId: `delivery:${data.attemptId}`,
  });
}
