import { eq } from 'drizzle-orm';
import { adminDb } from '../db/client';
import { deliveryAttempts, endpoints, messages } from '../db/schema';
import { getDeliveryQueue } from './delivery-queue';
import { MAX_DELIVERY_ATTEMPTS } from './backoff';

/**
 * Replay a single exhausted/failed delivery attempt.
 * Resets the attempt status to 'pending' and enqueues a fresh BullMQ job.
 *
 * @returns The new BullMQ job ID.
 */
export async function replayDelivery(attemptId: string): Promise<string> {
  // Load the attempt to get message + endpoint IDs
  const [attempt] = await adminDb
    .select({
      id: deliveryAttempts.id,
      messageId: deliveryAttempts.messageId,
      endpointId: deliveryAttempts.endpointId,
      orgId: deliveryAttempts.orgId,
      status: deliveryAttempts.status,
    })
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    throw new Error(`Delivery attempt ${attemptId} not found`);
  }

  if (attempt.status !== 'failed' && attempt.status !== 'exhausted') {
    throw new Error(
      `Cannot replay attempt with status '${attempt.status}' — must be 'failed' or 'exhausted'`,
    );
  }

  // Reset the attempt
  await adminDb
    .update(deliveryAttempts)
    .set({
      status: 'pending',
      attemptNumber: 1,
      responseStatus: null,
      responseBody: null,
      responseTimeMs: null,
      errorMessage: null,
      nextAttemptAt: null,
      attemptedAt: null,
    })
    .where(eq(deliveryAttempts.id, attemptId));

  // Enqueue fresh job
  const queue = getDeliveryQueue();
  const job = await queue.add(
    'deliver',
    {
      messageId: attempt.messageId,
      endpointId: attempt.endpointId,
      orgId: attempt.orgId,
      attemptId: attempt.id,
    },
    {
      jobId: `replay:${attempt.id}:${Date.now()}`,
      attempts: MAX_DELIVERY_ATTEMPTS,
      backoff: { type: 'custom' },
    },
  );

  return job.id!;
}

/**
 * Replay all exhausted delivery attempts for a given message.
 *
 * @returns Array of { attemptId, jobId } for each replayed attempt.
 */
export async function replayMessage(
  messageId: string,
): Promise<Array<{ attemptId: string; jobId: string }>> {
  const exhausted = await adminDb
    .select({
      id: deliveryAttempts.id,
      messageId: deliveryAttempts.messageId,
      endpointId: deliveryAttempts.endpointId,
      orgId: deliveryAttempts.orgId,
    })
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.messageId, messageId));

  const results: Array<{ attemptId: string; jobId: string }> = [];

  for (const attempt of exhausted) {
    const jobId = await replayDelivery(attempt.id);
    results.push({ attemptId: attempt.id, jobId });
  }

  return results;
}

/**
 * Re-enable a circuit-broken endpoint after verifying connectivity.
 * Resets failureCount and disabled flag.
 */
export async function reEnableEndpoint(endpointId: string): Promise<void> {
  await adminDb
    .update(endpoints)
    .set({
      disabled: false,
      disabledReason: null,
      failureCount: 0,
    })
    .where(eq(endpoints.id, endpointId));
}
